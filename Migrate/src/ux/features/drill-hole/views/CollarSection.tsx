/**
 * Collar Section Component
 *
 * Form-based section for collar information using the generic useFormHook pattern.
 *
 * Architecture:
 * - Data: Dexie + LiveQuery (single source of truth)
 * - Form: useFormHook (generic, reusable)
 * - Actions: ActionBar (automatic button management)
 * - Validation: CollarBusinessSchema (Zod)
 *
 * @see plans/FORM_HOOK_MIGRATION_EXAMPLE.md
 * @see src/ux/hooks/USE_FORM_HOOK_README.md
 */

import { Col, Descriptions, Spin } from "antd";
import React, { useEffect, useRef } from "react";

import { ActionBar } from "#src/ux/components/ActionBar";
// Types
import { CollarBusinessSchema } from "#src/data/domain/collar";
import { SectionKey } from "../constants/section-keys";
import { SectionMetadataPanel } from "#src/ux/components/SectionMetadataPanel";
// Feature Components
import { SectionWrapper } from "../components";
// Reusable Components
import { SheetFormField } from "#src/ux/components/SheetFormField";
import { collarRepo } from "#src/data/index.js";
import { useDrillHoleData } from "../hooks/useDrillHoleData";
// Generic Form Hook & Action Bar (NEW PATTERN)
import { useFormHook } from "#src/ux/hooks/useFormHook";
import { useLiveQuery } from "dexie-react-hooks";
// Data & Schema
import { useLookups } from "#src/data/hooks/useLookups";

/**
 * CollarSection Component Props
 */
export interface CollarSectionProps {
	collarId: string
}

/**
 * CollarSection Component
 *
 * Renders collar details form with automatic validation, action buttons,
 * and state management via the generic useFormHook pattern.
 *
 * Key Features:
 * - 86% less code than custom hook approach
 * - Automatic action button visibility based on RowStatus
 * - Built-in validation via Zod schema
 * - Dirty state tracking with visual indicators
 * - Read-only enforcement when Approved
 * - Offline-first data persistence
 * - Real-time data sync via useLiveQuery
 */
export const CollarSection: React.FC<CollarSectionProps> = ({ collarId }) => {
	// ============================================================================
	// DATA LAYER - Fetch real collar data from Dexie (reactive)
	// ============================================================================
	const { collar, isLoading } = useDrillHoleData(collarId);

	console.log("🔍 [CollarSection] Data state:", {
		collarId,
		hasCollar: !!collar,
		isLoading,
		collarKeys: collar ? Object.keys(collar).length : 0,
	});
	// ============================================
	// LiveQuery: Watch Dexie for sync updates
	// ============================================
	// When dexie-syncable updates local cache, this triggers
	// and causes the grid to refresh with new data

	// LiveQuery - automatically updates when drill plan changes in IndexedDB

	// const dexieData = useLiveQuery(() => {
	// 	console.log('[CollarSection] 👀 LiveQuery watching for sync updates');
	// 	db.DrillHole_Collar.get(collarId)
	// 	return db.DrillHole_Collar.where(':id')
	// 		.equals(collarId)
	// 		.first();
	// }, [collarId]);

	// useEffect(() => {
	// 	if (dexieData && !isLoading) {
	// 		console.log('[CollarSection] 🔄 Cache updated by sync - auto-refreshing grid', {
	// 			recordCount: dexieData,
	// 		});

	// Refresh grid to show updated data from cache
	// purge: true ensures we reload from cache (not stale in-memory data)
	//		gridRef.current.api.refreshServerSide({ purge: true });
	// }
	// }, [dexieData, isLoading]);

	// ============================================================================
	// LOOKUPS - Dropdown options
	// ============================================================================
	const { HoleStatus, OrientationTools, Person } = useLookups();

	// ============================================================================
	// FORM LAYER - Generic Form Hook with real data (NEW PATTERN)
	// ============================================================================
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const form = useFormHook({
		sectionKey: SectionKey.Collar,
		schema: CollarBusinessSchema,
		defaultValues: collar, // ⚠️ CRITICAL: Pass collar data to form
	} as any);

	// ============================================================================
	// LIVEQUERY - Watch for real-time updates from Dexie (e.g., after sync)
	// ============================================================================
	const collar2 = useLiveQuery(
		async () => {
			if (!collarId || collarId === "new")
				return null;
			const result = null
			console.log("[CollarSection] LiveQuery loading collar:", collarId);
			//const result = await collarRepo.getById(collarId);
			return result || null;
		},
		[collarId],
		null,
	);

	// ============================================================================
	// SYNC LIVEQUERY DATA TO FORM
	// ============================================================================
	// Use ref to track last modified timestamp to prevent infinite loops
	const lastModifiedRef = useRef<string | null>(null);

	// Effect 1: When LiveQuery receives new data from sync, update the form
	useEffect(() => {
		if (collar2) {
			const newModified = collar2.ModifiedOnDt;
			const hasNewData = newModified && newModified !== lastModifiedRef.current;

			// Update form with new data from server/sync
			if (hasNewData) {
				console.log("🔄 [CollarSection] LiveQuery data changed - updating form", {
					oldModified: lastModifiedRef.current,
					newModified,
					// RowStatus: collar2.RowStatus,
					// Redox: collar2.Redox,
					formIsDirty: form.formState.isDirty,
				});

				// Reset form with new data (this will clear isDirty flag)
				form.reset(collar2 as any);
				lastModifiedRef.current = newModified;
			}
		}
	}, [collar2, form]);

	// Effect 2: Watch for form field changes (for debugging)
	useEffect(() => {
		const subscription = form.watch((formData, { name, type }) => {
			if (name && type === "change") {
				console.log("🔄 [CollarSection] Field changed:", {
					field: name,
					isDirty: form.formState.isDirty,
				});
			}
		});

		return () => subscription.unsubscribe();
	}, [form]);

	console.log("🔍 [CollarSection] Form state:", {
		hasFormData: !!form.section.data,
		formDataKeys: form.section.data ? Object.keys(form.section.data).length : 0,
		formIsDirty: form.formState.isDirty,
		sectionIsDirty: form.section.isDirty,
		collar2Redox: collar2?.Redox,
	});

	// ============================================================================
	// DESTRUCTURE - Extract what we need from form
	// ============================================================================
	const { control, section, getFieldProps, validationErrors } = form;
	const sectionData = section.data;

	// Type assertion to avoid React Hook Form deep type instantiation errors
	// This is safe because Controller components handle the actual type checking
	const formControl = control as any;

	// ============================================================================
	// LOADING STATE
	// ============================================================================
	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Spin size="large" tip="Loading collar data..." />
			</div>
		);
	}

	if (!collar) {
		return (
			<div className="flex items-center justify-center py-12">
				<p className="text-gray-500">Collar not found</p>
			</div>
		);
	}

	// ============================================================================
	// RENDER - Presentation Layer
	// ============================================================================
	return (
		<SectionWrapper
			title="Collar Information"
			loading={false}
			isEditable={section.isEditable?.() ?? true}
			validationErrors={Object.values(validationErrors)}
		>
			{/* NEW: ActionBar replaces 6 manual action props with 2 lines */}
			<ActionBar
				section={form.section}
				actions={form.actions}
				loading={false}
			/>

			{/* ====================================================================
			    FORM FIELDS - Using SheetFormField (has Controller internally)
			    ==================================================================== */}
			<Col xs={24} md={24}>
				<Descriptions
					bordered
					size="small"
					column={2}
					labelStyle={{
						fontWeight: "bold",
						backgroundColor: "#f0f0f0",
						padding: "2px 8px",
						width: "140px",
					}}
					contentStyle={{ padding: "2px 8px" }}
				>
					{/* ================================================================
                    PERSONNEL GROUP
                    ================================================================ */}
					<Descriptions.Item label="Geologist 1" span={1}>
						<SheetFormField
							name="ResponsiblePerson"
							control={formControl}
							type="autocomplete"
							placeholder="Select Geologist 1"
							options={Person}
							{...getFieldProps("ResponsiblePerson")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Geologist 2" span={1}>
						<SheetFormField
							name="ResponsiblePerson2"
							control={formControl}
							type="autocomplete"
							placeholder="Select Geologist 2"
							options={Person}
							{...getFieldProps("ResponsiblePerson2")}
						/>
					</Descriptions.Item>

					{/* ================================================================
                    TIMELINE GROUP
                    ================================================================ */}
					<Descriptions.Item label="Start Date" span={1}>
						<SheetFormField
							name="StartedOnDt"
							control={formControl}
							type="date"
							{...getFieldProps("StartedOnDt")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Complete Date" span={1}>
						<SheetFormField
							name="FinishedOnDt"
							control={formControl}
							type="date"
							{...getFieldProps("FinishedOnDt")}
						/>
					</Descriptions.Item>

					{/* ================================================================
                    MEASUREMENTS GROUP
                    ================================================================ */}
					<Descriptions.Item label="Water Table Depth" span={1}>
						<SheetFormField
							name="WaterTableDepth"
							control={formControl}
							type="number"
							{...getFieldProps("WaterTableDepth")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Measured Date" span={1}>
						<SheetFormField
							name="WaterTableDepthMeasuredOnDt"
							control={formControl}
							type="date"
							{...getFieldProps("WaterTableDepthMeasuredOnDt")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Redox" span={1}>
						<SheetFormField
							name="Redox"
							control={formControl}
							type="text"
							{...getFieldProps("Redox")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="PreCollarId" span={1}>
						<SheetFormField
							name="PreCollarId"
							control={formControl}
							type="text"
							{...getFieldProps("PreCollarId")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="CasingDepth" span={1}>
						<SheetFormField
							name="CasingDepth"
							control={formControl}
							type="number"
							{...getFieldProps("CasingDepth")}
						/>
					</Descriptions.Item>

					{/* ================================================================
                    TECHNICAL GROUP
                    ================================================================ */}
					<Descriptions.Item label="OrientationTool" span={1}>
						<SheetFormField
							name="OrientationTool"
							control={formControl}
							type="autocomplete"
							options={OrientationTools}
							{...getFieldProps("OrientationTool")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="TotalDepth" span={1}>
						<SheetFormField
							name="TotalDepth"
							control={formControl}
							type="number"
							{...getFieldProps("TotalDepth")}
						/>
					</Descriptions.Item>

					{/* ================================================================
                    READ-ONLY METADATA FIELDS
                    ================================================================ */}
					<Descriptions.Item label="Company" span={1}>
						{sectionData.ExplorationCompany || "B2GOLD"}
					</Descriptions.Item>

					<Descriptions.Item label="Collar Type" span={1}>
						{sectionData.CollarType}
					</Descriptions.Item>
				</Descriptions>
			</Col>

			{/* ====================================================================
            COMMENTS - Full Width
            ==================================================================== */}
			<Descriptions
				bordered
				size="small"
				column={1}
				labelStyle={{
					fontWeight: "bold",
					backgroundColor: "#f0f0f0",
					padding: "2px 8px",
					width: "140px",
				}}
				contentStyle={{ padding: "2px 8px" }}
			>
				<Descriptions.Item label="Comments" span={1}>
					<SheetFormField
						name="Comments"
						control={formControl}
						type="area"
						displayMode="description"
						span={3}
						{...getFieldProps("Comments")}
					/>
				</Descriptions.Item>
			</Descriptions>

			{/* Metadata panel at bottom */}
			{section && <SectionMetadataPanel section={section} />}
		</SectionWrapper>
	);
};
