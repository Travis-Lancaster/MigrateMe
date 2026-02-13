/**
 * DrillMethod Section - Array Pattern with AG Grid
 *
 * Demonstrates the LiveQuery component pattern for array sections.
 * Uses AG Grid for displaying and editing multiple drill method intervals.
 *
 * Pattern differences from single-object sections:
 * 1. Uses array data (drillMethods) instead of single object
 * 2. Uses AG Grid instead of Form
 * 3. Operations include add/update/delete instead of just save
 * 4. Handles row-level validation and cross-row validation
 */

import type { DrillMethod } from "#src/data/api/database/data-contracts";
import type { CellValueChangedEvent, ColDef, GridReadyEvent } from "ag-grid-enterprise";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import { AgGridReact } from "ag-grid-react";

import { Button, message, Space } from "antd";
import React, { useCallback, useMemo, useState } from "react";
import { SectionWrapper } from "../components/SectionWrapper";
import { useDrillHoleData } from "../hooks/useDrillHoleData";
import { useSectionOperations } from "../hooks/useSectionOperations";
import { useDrillHoleUI } from "../store";
import {
	canEdit,
	formatDepth,
	getValidationErrors,
} from "../utils/section-helpers";

// Utilities

// Types

// Constants

// Components

// Hooks

interface DrillMethodSectionProps {
	/** Drill hole ID (CollarId) */
	drillHoleId: string
}

/**
 * DrillMethod Section Component
 *
 * Displays drill method intervals in an editable grid.
 *
 * Features:
 * - AG Grid with inline editing
 * - Add/delete rows
 * - LiveQuery auto-updates
 * - Row-level validation
 * - Cross-row interval validation
 */
export const DrillMethodSection: React.FC<DrillMethodSectionProps> = ({ drillHoleId }) => {
	// ============================================
	// STEP 1: Get reactive data from Dexie/LiveQuery
	// ============================================
	const { drillMethods, isLoading } = useDrillHoleData(drillHoleId);

	// ============================================
	// STEP 2: Get UI state from Zustand
	// ============================================
	const { editMode } = useDrillHoleUI();

	// ============================================
	// STEP 3: Get operations from hooks
	// ============================================
	const {
		addDrillMethod,
		updateDrillMethod,
		deleteDrillMethod,
	} = useSectionOperations();

	// ============================================
	// STEP 4: Local state
	// ============================================
	const [selectedRows, setSelectedRows] = useState<DrillMethod[]>([]);

	// ============================================
	// STEP 5: Determine editability
	// ============================================
	// For array sections, check if ANY row can be edited
	const isEditable = useMemo(() => {
		if (!editMode || !drillMethods || drillMethods.length === 0)
			return false;
		return drillMethods.some((dm: any) => canEdit(dm.RowStatus, editMode));
	}, [drillMethods, editMode]);

	// ============================================
	// STEP 6: Parse validation errors
	// ============================================
	// For array sections, collect errors from all rows
	const validationErrors = useMemo(() => {
		if (!drillMethods)
			return [];

		const allErrors: string[] = [];
		drillMethods.forEach((dm: any, index: number) => {
			const errors = getValidationErrors(dm);
			errors.forEach((error) => {
				allErrors.push(`Row ${index + 1}: ${error}`);
			});
		});

		return allErrors;
	}, [drillMethods]);

	// ============================================
	// STEP 7: AG Grid column definitions
	// ============================================
	const columnDefs = useMemo<ColDef<DrillMethod>[]>(() => [
		{
			headerName: "Depth From (m)",
			field: "DepthFrom",
			width: 150,
			editable: isEditable,
			type: "numericColumn",
			valueFormatter: params => params.value?.toFixed(2) || "",
			cellClass: (params) => {
				const errors = getValidationErrors(params.data);
				return errors.length > 0 ? "ag-cell-error" : "";
			},
		},
		{
			headerName: "Depth To (m)",
			field: "DepthTo",
			width: 150,
			editable: isEditable,
			type: "numericColumn",
			valueFormatter: params => params.value?.toFixed(2) || "",
			cellClass: (params) => {
				const errors = getValidationErrors(params.data);
				return errors.length > 0 ? "ag-cell-error" : "";
			},
		},
		{
			headerName: "Drill Company",
			field: "DrillCompany",
			width: 200,
			editable: isEditable,
			cellEditor: "agSelectCellEditor",
			cellEditorParams: {
				values: ["Major Drilling", "Boart Longyear", "Orbit Drilling", "Geotec", "Other"],
			},
		},
		{
			headerName: "Drill Type",
			field: "DrillType",
			width: 150,
			editable: isEditable,
			cellEditor: "agSelectCellEditor",
			cellEditorParams: {
				values: ["RC", "DD", "RAB", "Air Core", "Rotary"],
			},
		},
		{
			headerName: "Drill Rig Type",
			field: "DrillRigType",
			width: 150,
			editable: isEditable,
		},
		{
			headerName: "Drill Size",
			field: "DrillSize",
			width: 120,
			editable: isEditable,
			cellEditor: "agSelectCellEditor",
			cellEditorParams: {
				values: ["HQ", "NQ", "PQ", "BQ", "LTK60", "RC"],
			},
		},
		{
			headerName: "Sample Type",
			field: "SampleType",
			width: 150,
			editable: isEditable,
		},
		{
			headerName: "Organization",
			field: "Organization",
			width: 150,
			editable: false,
		},
		{
			headerName: "Comments",
			field: "Comments",
			width: 200,
			editable: isEditable,
		},
		{
			headerName: "Actions",
			width: 100,
			cellRenderer: (params: any) => {
				if (!isEditable || !params.data)
					return null;

				return (
					<Button
						type="text"
						danger
						size="small"
						icon={<DeleteOutlined />}
						onClick={() => handleDeleteRow(params.data)}
					>
						Delete
					</Button>
				);
			},
		},
	], [isEditable]);

	// ============================================
	// STEP 8: Handle cell value changes
	// ============================================
	const handleCellValueChanged = useCallback(async (event: CellValueChangedEvent<DrillMethod>) => {
		if (!event.data)
			return;

		console.log("[DrillMethodSection] Cell value changed:", {
			field: event.colDef.field,
			oldValue: event.oldValue,
			newValue: event.newValue,
		});

		// Update in Dexie - LiveQuery will auto-update the grid
		const result = await updateDrillMethod(event.data.DrillMethodId, event.data);

		if (!result.success) {
			message.error(`Failed to update: ${result.error?.message}`);
			// Revert the change
			event.node.setDataValue(event.colDef.field!, event.oldValue);
		}
	}, [updateDrillMethod]);

	// ============================================
	// STEP 9: Handle add row
	// ============================================
	const handleAddRow = useCallback(async () => {
		// Calculate suggested depth range
		const lastDepth = drillMethods && drillMethods.length > 0
			? Math.max(...drillMethods.map((dm: { DepthTo: any }) => dm.DepthTo || 0))
			: 0;

		const newRow: Partial<DrillMethod> = {
			CollarId: drillHoleId,
			DepthFrom: lastDepth,
			DepthTo: lastDepth + 10, // Default 10m interval
			DrillCompany: "",
			DrillType: "RC",
			DrillRigType: "",
			DrillSize: "HQ",
			SampleType: "",
			Organization: "",
			Comments: "",
		};

		const result = await addDrillMethod(drillHoleId, newRow);

		if (result.success) {
			message.success("Row added successfully");
		}
		else {
			message.error(`Failed to add row: ${result.error?.message}`);
		}
	}, [drillHoleId, drillMethods, addDrillMethod]);

	// ============================================
	// STEP 10: Handle delete row
	// ============================================
	const handleDeleteRow = useCallback(async (row: DrillMethod) => {
		const result = await deleteDrillMethod(row.DrillMethodId);

		if (result.success) {
			message.success("Row deleted successfully");
		}
		else {
			message.error(`Failed to delete row: ${result.error?.message}`);
		}
	}, [deleteDrillMethod]);

	// ============================================
	// STEP 11: Handle grid ready
	// ============================================
	const handleGridReady = useCallback((event: GridReadyEvent) => {
		console.log("[DrillMethodSection] Grid ready with", drillMethods?.length || 0, "rows");
	}, [drillMethods]);

	// ============================================
	// STEP 12: Render with SectionWrapper
	// ============================================
	return (
		<SectionWrapper
			title="Drill Method Intervals"
			loading={isLoading}
			isEditable={isEditable}
			validationErrors={validationErrors}
			extra={
				isEditable && (
					<Space>
						<Button
							type="primary"
							icon={<PlusOutlined />}
							onClick={handleAddRow}
						>
							Add Row
						</Button>
					</Space>
				)
			}
		>
			<div style={{ height: "400px", width: "100%" }}>
				<div style={{ height: "100%", width: "100%" }}>
					<AgGridReact<DrillMethod>
						rowData={drillMethods || []}
						columnDefs={columnDefs}
						onGridReady={handleGridReady}
						onCellValueChanged={handleCellValueChanged}
						rowSelection="multiple"
						onSelectionChanged={(event) => {
							setSelectedRows(event.api.getSelectedRows());
						}}
						defaultColDef={{
							sortable: true,
							filter: true,
							resizable: true,
						}}
						animateRows={true}
						enableCellTextSelection={true}
						suppressRowClickSelection={true}
					/>
				</div>
			</div>

			{/* Summary info */}
			{drillMethods && drillMethods.length > 0 && (
				<div style={{
					marginTop: "16px",
					padding: "12px",
					background: "#f5f5f5",
					borderRadius: "4px",
					fontSize: "12px",
				}}
				>
					<strong>Summary:</strong>
					{" "}
					{drillMethods.length}
					{" "}
					intervals,
					Total depth:
					{" "}
					{formatDepth(Math.max(...drillMethods.map((dm: { DepthTo: any }) => dm.DepthTo || 0)))}
					{selectedRows.length > 0 && `, ${selectedRows.length} selected`}
				</div>
			)}
		</SectionWrapper>
	);
};

export default DrillMethodSection;
