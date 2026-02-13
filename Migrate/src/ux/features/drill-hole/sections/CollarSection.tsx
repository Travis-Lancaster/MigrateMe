/**
 * Collar Section - Proof of Concept
 *
 * Demonstrates the LiveQuery component pattern for drill-hole sections.
 * Uses reactive data from Dexie, UI state from Zustand, and operations via hooks.
 *
 * Pattern:
 * 1. Get data from LiveQuery (useDrillHoleData)
 * 2. Get UI state from Zustand (useDrillHoleUI)
 * 3. Get operations (useSectionOperations)
 * 4. Determine editability with helper utilities
 * 5. Parse validation errors
 * 6. Render with SectionWrapper
 */

// Constants
import { RowStatusEnum } from "#src/data/domain/schema-helpers/enums.js";
import { SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, InputNumber, message, Select, Space, Tag } from "antd";

import React, { useState } from "react";
// Components
import { SectionWrapper } from "../components/SectionWrapper";
// Hooks
import { useDrillHoleData } from "../hooks/useDrillHoleData";
import { useSectionOperations } from "../hooks/useSectionOperations";
import { useDrillHoleUI } from "../store";
// Utilities
import {
	canEdit,
	getRowStatusColor,
	getRowStatusLabel,
	getValidationErrors,
} from "../utils/section-helpers";

interface CollarSectionProps {
	/** Drill hole ID (CollarId) */
	drillHoleId: string
}

/**
 * Collar Section Component
 *
 * Simple form for collar data entry with:
 * - HoleId (read-only)
 * - TotalDepth (editable number)
 * - Project (editable text)
 * - Organization (read-only)
 * - Status badge
 *
 * Features:
 * - LiveQuery auto-updates
 * - Save to Dexie
 * - Validation display
 * - Edit mode awareness
 * - Loading states
 */
export const CollarSection: React.FC<CollarSectionProps> = ({ drillHoleId }) => {
	// 1. Get data from LiveQuery (reactive from Dexie)
	const { collar, isLoading } = useDrillHoleData(drillHoleId);

	// 2. Get UI state from Zustand
	const { editMode } = useDrillHoleUI();

	// 3. Get operations
	const { saveCollar } = useSectionOperations();

	// 4. Local form state for optimistic updates
	const [formData, setFormData] = useState<{
		TotalDepth?: number
		Project?: string
	}>({});

	const [isSaving, setIsSaving] = useState(false);

	// 5. Determine editability
	const isEditable = canEdit(collar?.RowStatus, editMode);

	// 6. Parse validation errors
	const validationErrors = getValidationErrors(collar);

	// 7. Handle field changes
	const handleFieldChange = (field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
	};

	// 8. Handle save
	const handleSave = async () => {
		if (!collar) {
			message.error("No collar data to save");
			return;
		}

		setIsSaving(true);

		try {
			// Merge form changes with existing data
			const updates = {
				...collar,
				...formData,
			};

			const result = await saveCollar(drillHoleId, updates);

			if (result.success) {
				message.success("Collar saved successfully");
				setFormData({}); // Clear local changes
			}
			else {
				message.error(`Failed to save: ${result.error?.message}`);
			}
		}
		catch (error) {
			message.error("Unexpected error while saving");
			console.error("[CollarSection] Save error:", error);
		}
		finally {
			setIsSaving(false);
		}
	};

	// 9. Get current values (local changes override LiveQuery data)
	const currentValues = {
		HoleId: collar?.CollarId || "",
		TotalDepth: formData.TotalDepth ?? collar?.TotalDepth,
		Project: formData.Project ?? collar?.Project,
		Organization: collar?.Organization || "",
		RowStatus: collar?.RowStatus,
	};

	const hasChanges = Object.keys(formData).length > 0;

	return (
		<SectionWrapper
			title="Collar Information"
			loading={isLoading}
			isEditable={isEditable}
			validationErrors={validationErrors}
			extra={
				isEditable && (
					<Space>
						<Tag color={getRowStatusColor(collar?.RowStatus || RowStatusEnum.DRAFT)}>
							{getRowStatusLabel(collar?.RowStatus || RowStatusEnum.DRAFT)}
						</Tag>
						<Button
							type="primary"
							icon={<SaveOutlined />}
							onClick={handleSave}
							loading={isSaving}
							disabled={!hasChanges}
						>
							Save
						</Button>
					</Space>
				)
			}
		>
			<Form layout="vertical" style={{ maxWidth: 800 }}>
				{/* HoleId - Read-only */}
				<Form.Item
					label="Hole ID"
					help="Unique identifier for this drill hole"
				>
					<Input
						value={currentValues.HoleId}
						disabled
						style={{ fontFamily: "JetBrains Mono, monospace" }}
					/>
				</Form.Item>

				{/* TotalDepth - Editable number */}
				<Form.Item
					label="Total Depth (m)"
					help={isEditable ? "Final depth of the drill hole in meters" : undefined}
				>
					<InputNumber
						value={currentValues.TotalDepth}
						onChange={value => handleFieldChange("TotalDepth", value)}
						disabled={!isEditable}
						min={0}
						max={10000}
						step={0.1}
						precision={2}
						style={{ width: "200px" }}
						placeholder="Enter depth"
					/>
				</Form.Item>

				{/* Project - Editable select/input */}
				<Form.Item
					label="Project"
					help={isEditable ? "Project code for this drill hole" : undefined}
				>
					<Select
						value={currentValues.Project}
						onChange={value => handleFieldChange("Project", value)}
						disabled={!isEditable}
						placeholder="Select or enter project"
						showSearch
						allowClear
						style={{ width: "300px" }}
						options={[
							{ label: "FEK - Fekola", value: "FEK" },
							{ label: "OTO - Otjikoto", value: "OTO" },
							{ label: "MAR - Masbate", value: "MAR" },
							{ label: "GRA - Gramalote", value: "GRA" },
						]}
					/>
				</Form.Item>

				{/* Organization - Read-only */}
				<Form.Item
					label="Organization"
					help="Operating organization"
				>
					<Input
						value={currentValues.Organization}
						disabled
					/>
				</Form.Item>

				{/* Status Display */}
				<Form.Item label="Status">
					<Tag
						color={getRowStatusColor(currentValues.RowStatus || RowStatusEnum.DRAFT)}
						style={{ fontSize: "14px", padding: "4px 12px" }}
					>
						{getRowStatusLabel(currentValues.RowStatus || RowStatusEnum.DRAFT)}
					</Tag>
					{currentValues.RowStatus === RowStatusEnum.DRAFT as any && (
						<span style={{ marginLeft: "12px", color: "#8c8c8c", fontSize: "12px" }}>
							Only Draft status can be edited
						</span>
					)}
				</Form.Item>

				{/* Debug info (remove in production) */}
				{hasChanges && (
					<Form.Item>
						<div style={{
							padding: "8px 12px",
							background: "#f0f5ff",
							border: "1px solid #adc6ff",
							borderRadius: "4px",
							fontSize: "12px",
						}}
						>
							<strong>Pending changes:</strong>
							{" "}
							{Object.keys(formData).join(", ")}
						</div>
					</Form.Item>
				)}
			</Form>
		</SectionWrapper>
	);
};

export default CollarSection;
