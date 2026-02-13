/**
 * DrillMethodSection Component
 *
 * Grid-based section for managing drill method intervals.
 * Uses AG Grid for inline editing of multiple depth-based records.
 *
 * OPTIMIZED VERSION using reusable patterns:
 * - usePinnedBottomRow: Pinned row pattern for new entries
 * - useRowDirtyState: Visual dirty indicators
 * - Row-level validation: Validates and sets ValidationStatus/ValidationErrors
 * - COMMON_COLUMNS: Reusable column bundles
 * - createContextMenu: Centralized context menu
 * - Default sorting by DepthFrom
 */

import { Button, Space } from "antd";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import React, { useCallback, useMemo, useRef } from "react";
// Validation
import {
	mergeCrossRowErrors,
	validateDrillMethodGrid,
	validateDrillMethodIntervals,
	validateDrillMethodRow,
} from "../utils/row-validation";
import { useCombinedRowClassRules, useRowDirtyState } from "../hooks/useRowDirtyState";

import { AgGridReact } from "ag-grid-react";
import { AllEnterpriseModule } from "ag-grid-enterprise";
// Reusable utilities
import { COMMON_COLUMNS } from "../utils/column-definitions";
import type { ColDef } from "ag-grid-enterprise";
// Schema
import type {
	DrillMethodData,
} from "../validation/drill-method-schemas";
import { LookupResolver } from "#src/services/lookupResolver";
import { ModuleRegistry } from "ag-grid-enterprise";
import { SectionKey } from "#src/types/drillhole";
import { SectionMetadataPanel } from "../components/SectionMetadataPanel";
import { SectionWrapper } from "../components/SectionWrapper";
import { createContextMenu } from "../utils/grid-context-menu";
import {
	createEmptyDrillMethodData,
} from "../validation/drill-method-schemas";
import { createLookupColumn } from "../utils/column-factories";
// import { getCommonGridProps } from '#src/lib/ag-grid-config';
import { getCommonGridProps } from "#src/config/ag-grid-config";
import { useCreateDrillHoleStore } from "../store/create-drillhole-store";
// Optimized hooks
import { useGridSection } from "../hooks/useGridSection";
import { usePinnedBottomRow } from "../hooks/usePinnedBottomRow";
import { useSectionActions } from "../hooks/useSectionActions";

// Register modules globally
ModuleRegistry.registerModules([AllEnterpriseModule]);

export interface DrillMethodSectionProps {
	currentDrillHoleId: string
}

export const DrillMethodSection: React.FC<DrillMethodSectionProps> = ({
	currentDrillHoleId,
}) => {
	const gridRef = useRef<AgGridReact<DrillMethodData>>(null);

	// Base grid data management with default sort by DepthFrom
	const { gridData: baseGridData, section, gridProps, updateGridData, getDrillHoleContext }
		= useGridSection<DrillMethodData>(SectionKey.DrillMethod, {
			defaultSort: { field: "DepthFrom", direction: "asc" },
		});

	const isReadOnly = !section.isEditable();

	// Get collar data for TotalDepth validation and import modal handler
	const collarData = useCreateDrillHoleStore(state => state.sections.collar?.data);
	const totalDepth = collarData?.TotalDepth || null;
	const openImportModal = useCreateDrillHoleStore(state => state.openImportModal);

	// Filter out soft-deleted rows (ActiveInd = false)
	const activeGridData = useMemo(
		() => baseGridData.filter(row => row.ActiveInd !== false),
		[baseGridData],
	);

	// Calculate the next DepthFrom for phantom row positioning
	// Since grid is sorted by DepthFrom asc, phantom needs value >= max DepthTo to appear at bottom
	const nextDepthFrom = useMemo(() => {
		if (activeGridData.length === 0)
			return 0;
		// Find the maximum DepthTo value (where the next interval should start)
		const maxDepthTo = Math.max(...activeGridData.map(row => row.DepthTo || 0));
		// If all DepthTo values are 0 (empty), use max DepthFrom + small increment
		if (maxDepthTo === 0) {
			const maxDepthFrom = Math.max(...activeGridData.map(row => row.DepthFrom || 0));
			return maxDepthFrom + 0.01; // Add small increment to sort after existing rows
		}
		return maxDepthTo;
	}, [activeGridData]);

	// Pinned bottom row pattern for new entries
	const { pinnedBottomRowData, onPinnedCellEditRequest, isPinnedRow } = usePinnedBottomRow(
		activeGridData,
		(newRow) => {
			// Add new row to grid data
			updateGridData(prev => [...prev, newRow]);
			// Mark as dirty for sync
			const { markRowDirty } = useCreateDrillHoleStore.getState();
			markRowDirty(SectionKey.DrillMethod, newRow.DrillMethodId);
		},
		{
			createEmptyRow: (depthFrom, ctx) => {
				// Override the depthFrom parameter with our calculated value
				const pinnedDepthFrom = nextDepthFrom;
				console.log("🎯 [DrillMethod] Creating pinned row:", {
					pinnedDepthFrom,
					nextDepthFrom,
					activeGridDataCount: activeGridData.length,
					gridData: activeGridData.map(r => ({ depthFrom: r.DepthFrom, depthTo: r.DepthTo })),
				});
				return {
					...createEmptyDrillMethodData(),
					DrillMethodId: "", // Empty for pinned row
					CollarId: ctx.drillHoleId || currentDrillHoleId,
					Organization: ctx.organization || "",
					DepthFrom: pinnedDepthFrom,
					DepthTo: 0,
					ReportIncludeInd: false,
					ActiveInd: true,
				} as DrillMethodData;
			},
			getDrillHoleContext,
			idField: "DrillMethodId",
			onRowAdded: (row) => {
				console.log("🏷️ [DrillMethod] Added and marked new row as dirty:", row.DrillMethodId);
			},
		},
	);

	// Debug: Log pinned row data
	console.log("🔍 [DrillMethod] pinnedBottomRowData:", {
		pinnedBottomRowData,
		activeGridDataLength: activeGridData.length,
		nextDepthFrom,
	});

	// Dirty row tracking
	const { isDirtyRow } = useRowDirtyState<DrillMethodData>(
		SectionKey.DrillMethod,
		row => row.DrillMethodId || "",
	);

	// Combined row class rules (dirty, deleted, validation)
	const rowClassRules = useCombinedRowClassRules<DrillMethodData>({
		isDirtyRow,
		isDeletedRow: (row: DrillMethodData) => row.ActiveInd === false,
		isValidationError: (row: DrillMethodData) => {
			// Check if row has validation errors (ValidationStatus = 2)
			const status = row.ValidationStatus;
			return status === 2;
		},
	});

	// Section actions with beforeSave validation callback
	const actions = useSectionActions(SectionKey.DrillMethod, {
		beforeSave: async () => {
			console.log("🔍 [DrillMethod] Validating grid before save...");

			// Step 1: Single-row validation (schema validation)
			const singleRowResult = validateDrillMethodGrid(activeGridData);

			// Step 2: Cross-row validation (gaps, overlaps, total depth)
			const crossRowResult = validateDrillMethodIntervals(singleRowResult.rows, {
				totalDepth,
				depthTolerance: 0.01, // 1cm tolerance
			});

			// Step 3: Merge cross-row errors into row ValidationErrors
			const finalRows = mergeCrossRowErrors(singleRowResult.rows, crossRowResult.errors);

			// Step 4: Log validation summary
			const totalErrors = singleRowResult.errorCount + crossRowResult.errors.length;
			if (totalErrors > 0) {
				console.warn("⚠️ [DrillMethod] Validation errors found:", {
					singleRowErrors: singleRowResult.errorCount,
					crossRowErrors: crossRowResult.errors.length,
					totalErrors,
					totalRows: activeGridData.length,
					collarTotalDepth: totalDepth,
					crossRowDetails: crossRowResult.errors.map((e: any) => ({
						type: e.type,
						field: e.field,
						message: e.message,
					})),
				});
			}
			else {
				console.log("✅ [DrillMethod] All validations passed (single-row + cross-row)");
			}

			// Step 5: Update grid with all validation results
			updateGridData(finalRows);

			// Note: We don't block save on validation errors
			// The store will persist ValidationStatus and ValidationErrors fields
		},
	});

	// Load lookup options once
	const lookupOptions = useMemo(
		() => ({
			drillCompanies: LookupResolver.getFilteredLookupOptions(
				"Company",
				"Code",
				"Description",
				"CompanyType",
				"DRILLING",
			),
			drillRigTypes: LookupResolver.getLookupOptions("Machinery", "Code", "Description"),
			drillSizes: LookupResolver.getLookupOptions("DrillSize", "Code", "Description"),
			drillTypes: LookupResolver.getLookupOptions("DrillType", "Code", "Description"),
			sampleTypes: LookupResolver.getFilteredLookupOptions(
				"SampleType",
				"Code",
				"Description",
				"DH",
				true,
			),
			persons: LookupResolver.getLookupOptions("Person", "Code", "Description"),
		}),
		[],
	);

	// Column definitions using reusable bundles and factories
	const columnDefs = useMemo<ColDef<DrillMethodData>[]>(
		() => [
			// Depth interval (DepthFrom, DepthTo) - reusable bundle
			...COMMON_COLUMNS.depthInterval(isReadOnly),

			// Drill type/size/company - reusable factory
			createLookupColumn("DrillType", "Drill Type", lookupOptions.drillTypes, isReadOnly),
			createLookupColumn("DrillSize", "Drill Size", lookupOptions.drillSizes, isReadOnly, 120),
			createLookupColumn(
				"DrillCompany",
				"Drill Company",
				lookupOptions.drillCompanies,
				isReadOnly,
			),
			createLookupColumn(
				"DrillRigType",
				"Drill Rig Type",
				lookupOptions.drillRigTypes,
				isReadOnly,
			),
			createLookupColumn(
				"SampleType",
				"Sample Type",
				lookupOptions.sampleTypes,
				isReadOnly,
				110,
			),

			// Drill personnel (Driller1, Driller2) - reusable bundle
			...COMMON_COLUMNS.drillPersonnel(lookupOptions.persons, isReadOnly),

			// Date range (StartDt, EndDt) - reusable bundle
			...COMMON_COLUMNS.dateRange(isReadOnly),

			// Comments - reusable factory
			COMMON_COLUMNS.comments(isReadOnly),
		],
		[isReadOnly, lookupOptions],
	);

	// Handler: Add new row
	const handleAddRow = useCallback(() => {
		const context = getDrillHoleContext();
		const lastRow = activeGridData[activeGridData.length - 1];
		const depthFrom = lastRow?.DepthTo || 0;

		const newRow = {
			...createEmptyDrillMethodData(),
			DrillMethodId: crypto.randomUUID(),
			CollarId: context.drillHoleId || currentDrillHoleId,
			Organization: context.organization || "",
			DepthFrom: depthFrom,
		} as DrillMethodData;

		updateGridData(prev => [...prev, newRow]);
		console.log("➕ [DrillMethod] Added new row");
	}, [activeGridData, getDrillHoleContext, currentDrillHoleId, updateGridData]);

	// Handler: Insert row at index
	const handleInsertRowAt = useCallback(
		(index: number) => {
			const context = getDrillHoleContext();
			const prevRow = index > 0 ? activeGridData[index - 1] : null;
			const depthFrom = prevRow?.DepthTo || 0;

			const newRow = {
				...createEmptyDrillMethodData(),
				DrillMethodId: crypto.randomUUID(),
				CollarId: context.drillHoleId || currentDrillHoleId,
				Organization: context.organization || "",
				DepthFrom: depthFrom,
			} as DrillMethodData;

			updateGridData((prev) => {
				const newData = [...prev];
				newData.splice(index, 0, newRow);
				return newData;
			});

			console.log(`➕ [DrillMethod] Inserted row at index ${index}`);
		},
		[activeGridData, getDrillHoleContext, currentDrillHoleId, updateGridData],
	);

	// Handler: Delete selected rows (soft delete)
	const handleDeleteRows = useCallback(async () => {
		const api = gridRef.current?.api;
		if (!api)
			return;

		const selectedRows = api.getSelectedRows();
		if (selectedRows.length === 0)
			return;

		console.log("🗑️ [DrillMethod] Marking rows as inactive:", selectedRows.length);

		// Soft delete: set ActiveInd=false
		updateGridData(prev =>
			prev.map((row) => {
				const isSelected = selectedRows.some(
					selectedRow => selectedRow.DrillMethodId === row.DrillMethodId,
				);
				return isSelected ? { ...row, ActiveInd: false } : row;
			}),
		);

		// Mark rows as dirty for sync
		const markRowDirty = useCreateDrillHoleStore.getState().markRowDirty;
		for (const row of selectedRows) {
			if (row.DrillMethodId) {
				await markRowDirty(SectionKey.DrillMethod, row.DrillMethodId);
			}
		}

		api.deselectAll();
	}, [updateGridData]);

	// Context menu using factory
	const contextMenu = useMemo(
		() =>
			createContextMenu<DrillMethodData>(
				{
					allowInsert: !isReadOnly,
					allowDelete: !isReadOnly,
				},
				{
					onInsertRow: handleInsertRowAt,
					onDeleteRows: handleDeleteRows,
				},
			),
		[isReadOnly, handleInsertRowAt, handleDeleteRows],
	);

	// Get row style for pinned row
	const getRowStyle = useCallback((params: any) => {
		// Pinned row styling - make it stand out
		if (isPinnedRow(params)) {
			return {
				backgroundColor: "#e6f4ff", // Light blue background
				borderTop: "2px solid #1890ff", // Blue top border
				fontStyle: "italic",
				color: "#8c8c8c", // Lighter text color for placeholder feel
			};
		}
		return undefined;
	}, [isPinnedRow]);

	// Row selection configuration
	const rowSelection = useMemo(
		() => ({
			mode: "multiRow" as const,
			checkboxes: true,
			headerCheckbox: true,
			enableClickSelection: false,
		}),
		[],
	);

	// Cell selection configuration
	const cellSelection = useMemo(
		() => ({
			handle: {
				mode: "fill" as const,
			},
		}),
		[],
	);

	// Combined handler that processes pinned row logic AND validates AND marks rows dirty
	const handleCellEditRequest = useCallback(
		async (event: any) => {
			// Check if editing pinned row
			if (event.rowPinned === "bottom") {
				onPinnedCellEditRequest(event);
				return;
			}

			// For existing real rows, validate and mark dirty
			const currentRow = event.data;

			// Process real rows with IDs
			if (currentRow && currentRow.DrillMethodId && currentRow.DrillMethodId !== "") {
				// Apply the cell edit to get updated row
				const updatedRow = {
					...currentRow,
					[event.colDef.field]: event.newValue,
				};

				// Validate the row after edit
				const validation = validateDrillMethodRow(updatedRow);

				// Update row with validation results
				const validatedRow = {
					...updatedRow,
					ValidationStatus: validation.validationStatus,
					ValidationErrors: validation.validationErrors,
				};

				// Update grid data with validated row
				updateGridData((prev) => {
					const newData = [...prev];
					// Find the row by ID (rowIndex might change due to sorting)
					const actualIndex = newData.findIndex(r => r.DrillMethodId === currentRow.DrillMethodId);
					if (actualIndex !== -1) {
						newData[actualIndex] = validatedRow;
					}
					return newData;
				});

				// Mark row as dirty for sync
				const { markRowDirty } = useCreateDrillHoleStore.getState();
				await markRowDirty(SectionKey.DrillMethod, currentRow.DrillMethodId);

				// Log validation result
				if (!validation.isValid) {
					console.warn("🔴 [DrillMethod] Row validation failed:", {
						rowId: currentRow.DrillMethodId,
						field: event.colDef.field,
						errors: validation.errors.map(e => `${e.field}: ${e.message}`).join(", "),
					});
				}
				else {
					console.log("✅ [DrillMethod] Row validated successfully:", currentRow.DrillMethodId);
				}
			}
		},
		[onPinnedCellEditRequest, updateGridData],
	);

	return (
		<SectionWrapper
			section={section}
			title="Drill Method"
			{...actions}
			onImport={openImportModal}
			extra={
				!isReadOnly && (
					<Space>
						{false
							&& (
								<Button
									type="primary"
									icon={<PlusOutlined />}
									onClick={handleAddRow}
									size="small"
								>
									Add Interval
								</Button>
							)}
						<Button
							danger
							icon={<DeleteOutlined />}
							onClick={handleDeleteRows}
							size="small"
						>
							Delete Selected
						</Button>
					</Space>
				)
			}
		>
			<div style={{ width: "100%" }}>
				<AgGridReact<DrillMethodData>
					ref={gridRef}
					rowData={activeGridData}
					pinnedBottomRowData={pinnedBottomRowData}
					columnDefs={columnDefs}
					{...getCommonGridProps()}
					{...gridProps}
					domLayout="autoHeight"
					onCellEditRequest={handleCellEditRequest}
					rowSelection={rowSelection}
					cellSelection={cellSelection}
					rowClassRules={rowClassRules}
					getRowStyle={getRowStyle}
					getContextMenuItems={contextMenu}
					enableCellTextSelection={true}
					stopEditingWhenCellsLoseFocus={true}
					singleClickEdit={false}
					getRowId={params => params.data.DrillMethodId || ""}
				/>
			</div>

			{!isReadOnly && (
				<div className="mt-2 text-sm text-gray-500">
					Double-click cells to edit. Select rows using checkboxes. Gray row at bottom is for
					quick entry - enter DepthTo to add.
				</div>
			)}

			{/* Metadata panel at bottom */}
			{section && <SectionMetadataPanel section={section} />}
		</SectionWrapper>
	);
};
