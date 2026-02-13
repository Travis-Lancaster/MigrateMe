/**
 * Section Template
 *
 * Copy this template when creating new drill-hole sections.
 * Follow the pattern established in CollarSection proof-of-concept.
 *
 * Pattern Steps:
 * 1. Get reactive data from LiveQuery
 * 2. Get UI state from Zustand
 * 3. Get operations from hooks
 * 4. Create local state for optimistic updates
 * 5. Determine editability
 * 6. Parse validation errors
 * 7. Handle save/update operations
 * 8. Merge local changes with LiveQuery data
 * 9. Render with SectionWrapper
 */

// Constants
import { SaveOutlined } from "@ant-design/icons";
import { Button, Form, Input, message } from "antd";

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
	getValidationErrors,
} from "../utils/section-helpers";

interface YourSectionProps {
	/** Drill hole ID (CollarId) */
	drillHoleId: string
}

/**
 * Your Section Component
 *
 * TODO: Add description of what this section does
 *
 * Features:
 * - LiveQuery for reactive data
 * - Optimistic UI updates
 * - Validation display
 * - Edit mode awareness
 * - Save operations
 */
export const YourSection: React.FC<YourSectionProps> = ({ drillHoleId }) => {
	// ============================================
	// STEP 1: Get reactive data from Dexie/LiveQuery
	// ============================================
	const {
		collar, // Single object sections use collar, rigSheet, etc.
		// drillMethods,  // Array sections use drillMethods, surveys, etc.
		isLoading,
	} = useDrillHoleData(drillHoleId);

	// ============================================
	// STEP 2: Get UI state from Zustand
	// ============================================
	const { editMode } = useDrillHoleUI();

	// ============================================
	// STEP 3: Get operations from hooks
	// ============================================
	const {
		saveCollar, // For single object sections
		// addDrillMethod,    // For array sections
		// updateDrillMethod, // For array sections
		// deleteDrillMethod, // For array sections
	} = useSectionOperations();

	// ============================================
	// STEP 4: Local form state for optimistic updates
	// ============================================
	const [formData, setFormData] = useState<{
		// Define fields that can be edited
		// Example: TotalDepth?: number;
	}>({});

	const [isSaving, setIsSaving] = useState(false);

	// ============================================
	// STEP 5: Determine editability
	// ============================================
	const isEditable = canEdit(collar?.RowStatus, editMode);

	// ============================================
	// STEP 6: Parse validation errors
	// ============================================
	const validationErrors = getValidationErrors(collar);

	// ============================================
	// STEP 7: Handle field changes
	// ============================================
	const handleFieldChange = (field: string, value: any) => {
		setFormData(prev => ({
			...prev,
			[field]: value,
		}));
	};

	// ============================================
	// STEP 8: Handle save operation
	// ============================================
	const handleSave = async () => {
		if (!collar) {
			message.error("No data to save");
			return;
		}

		setIsSaving(true);

		try {
			// Merge local changes with existing data
			const updates = {
				...collar,
				...formData,
			};

			const result = await saveCollar(drillHoleId, updates);

			if (result.success) {
				message.success("Saved successfully");
				setFormData({}); // Clear local state - LiveQuery will update UI
			}
			else {
				message.error(`Failed to save: ${result.error?.message}`);
			}
		}
		catch (error) {
			message.error("Unexpected error while saving");
			console.error("[YourSection] Save error:", error);
		}
		finally {
			setIsSaving(false);
		}
	};

	// ============================================
	// STEP 9: Merge local changes with LiveQuery data
	// ============================================
	const currentValues = {
		// Example: Merge local changes with LiveQuery data
		// Field: formData.Field ?? collar?.Field,
	};

	const hasChanges = Object.keys(formData).length > 0;

	// ============================================
	// STEP 10: Render with SectionWrapper
	// ============================================
	return (
		<SectionWrapper
			title="Your Section Title"
			loading={isLoading}
			isEditable={isEditable}
			validationErrors={validationErrors}
			extra={
				isEditable && (
					<Button
						type="primary"
						icon={<SaveOutlined />}
						onClick={handleSave}
						loading={isSaving}
						disabled={!hasChanges}
					>
						Save
					</Button>
				)
			}
		>
			<Form layout="vertical" style={{ maxWidth: 800 }}>
				{/* Add your form fields here */}

				<Form.Item
					label="Example Field"
					help={isEditable ? "Help text for editable mode" : undefined}
				>
					<Input
						// value={currentValues.Field}
						// onChange={(e) => handleFieldChange('Field', e.target.value)}
						disabled={!isEditable}
						placeholder="Enter value"
					/>
				</Form.Item>

				{/* Debug info - remove in production */}
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

export default YourSection;

/**
 * USAGE INSTRUCTIONS
 *
 * 1. Copy this file to a new section component
 * 2. Rename YourSection to actual section name (e.g., DrillMethodSection)
 * 3. Update the imports based on what you need
 * 4. Define your form fields in local state type
 * 5. Add form fields to the render
 * 6. Update currentValues merge logic
 * 7. Test with DrillHoleTestView
 * 8. Remove debug sections
 *
 * IMPORTANT NOTES
 *
 * - For single object sections: Use collar, rigSheet, etc.
 * - For array sections: Use drillMethods, surveys, etc.
 * - Always merge local state with LiveQuery data for display
 * - Clear local state after successful save
 * - LiveQuery will automatically update the UI
 * - Use helper utilities for consistency
 *
 * TESTING CHECKLIST
 *
 * - [ ] Data loads from LiveQuery
 * - [ ] Edit mode toggle works
 * - [ ] Fields are disabled when not editable
 * - [ ] Changes are tracked in local state
 * - [ ] Save button enables/disables correctly
 * - [ ] Save persists to Dexie
 * - [ ] UI updates automatically after save
 * - [ ] Validation errors display
 * - [ ] Loading states show
 * - [ ] Error handling works
 */
