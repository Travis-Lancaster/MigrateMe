/**
 * usePinnedBottomRow Hook
 *
 * Implements the "new row" pattern using AG Grid's pinnedBottomRowData.
 * Provides a cleaner separation between actual data and the placeholder row.
 *
 * Pattern:
 * 1. pinnedBottomRowData displays a single placeholder row
 * 2. Placeholder has DepthFrom = last row's DepthTo
 * 3. When edited, placeholder data is added to actual rowData
 * 4. Placeholder resets and DepthFrom recalculates
 *
 * Benefits over useAutoAddRow:
 * - No data mixing (pinned row separate from rowData)
 * - Simpler index logic (no off-by-one errors)
 * - Better performance (no enhancedRowData recalculation)
 * - Native AG Grid support (built-in styling, scrolling)
 *
 * @example
 * ```typescript
 * const { pinnedBottomRowData, onPinnedCellValueChanged } = usePinnedBottomRow(
 *   gridData,
 *   (newRow) => updateGridData(prev => [...prev, newRow]),
 *   {
 *     createEmptyRow: (depthFrom, context) => ({
 *       ...createEmptyDrillMethodData(),
 *       DepthFrom: depthFrom,
 *       CollarId: context.drillHoleId,
 *     }),
 *     idField: 'DrillMethodId',
 *     getDrillHoleContext: () => ({ drillHoleId, organization }),
 *   }
 * );
 *
 * <AgGridReact
 *   rowData={gridData}
 *   pinnedBottomRowData={pinnedBottomRowData}
 *   onCellValueChanged={(event) => {
 *     if (event.rowPinned === 'bottom') {
 *       onPinnedCellValueChanged(event);
 *     }
 *   }}
 * />
 * ```
 */

import { useCallback, useMemo, useState } from "react";

import type { CellValueChangedEvent } from "ag-grid-enterprise";
import type { DrillHoleContext } from "./useGridSection";

export interface UsePinnedBottomRowOptions<T> {
	/**
	 * Function to create an empty row with proper defaults
	 * @param depthFrom - Starting depth for the new row (from previous row's DepthTo)
	 * @param context - Current DrillHole context (ID, organization)
	 */
	createEmptyRow: (depthFrom: number, context: DrillHoleContext) => T

	/**
	 * Field name for DepthTo (default: 'DepthTo')
	 */
	depthToField?: keyof T

	/**
	 * Field name for DepthFrom (default: 'DepthFrom')
	 */
	depthFromField?: keyof T

	/**
	 * Field name for the row ID (e.g., 'DrillMethodId', 'SampleId')
	 * Used to assign UUID when converting pinned to real row
	 */
	idField: keyof T

	/**
	 * Get current DrillHole context
	 */
	getDrillHoleContext: () => DrillHoleContext

	/**
	 * Callback when new row is added from pinned row
	 */
	onRowAdded?: (row: T) => void

	/**
	 * Custom trigger condition (optional)
	 * By default, triggers when DepthTo > 0
	 * @param updatedRow - The current state of the pinned row after edit
	 * @returns true if row should be added to main data
	 */
	shouldAddRow?: (updatedRow: T) => boolean
}

export interface UsePinnedBottomRowReturn<T> {
	/**
	 * Single-item array for pinnedBottomRowData
	 */
	pinnedBottomRowData: T[]

	/**
	 * Handle cell value changed in pinned row
	 */
	onPinnedCellValueChanged: (event: CellValueChangedEvent<T>) => void

	/**
	 * Handle cell edit request in pinned row (for readOnlyEdit mode)
	 */
	onPinnedCellEditRequest: (event: any) => void

	/**
	 * Reset pinned row (e.g., after adding to main data)
	 */
	resetPinnedRow: () => void

	/**
	 * Check if params represent the pinned row
	 */
	isPinnedRow: (params: { rowPinned?: string | null }) => boolean
}

/**
 * Hook for pinned bottom row pattern (new row entry)
 */
export function usePinnedBottomRow<T>(
	rowData: T[],
	addRow: (row: T) => void,
	options: UsePinnedBottomRowOptions<T>,
): UsePinnedBottomRowReturn<T> {
	const {
		createEmptyRow,
		depthToField = "DepthTo" as keyof T,
		depthFromField = "DepthFrom" as keyof T,
		idField,
		getDrillHoleContext,
		onRowAdded,
		shouldAddRow,
	} = options;

	// Track current pinned row state (local to this hook)
	const [pinnedRowData, setPinnedRowData] = useState<Partial<T>>({});

	/**
	 * Calculate the pinned row with auto-calculated DepthFrom
	 */
	const pinnedBottomRowData = useMemo(() => {
		// Get last row's DepthTo for auto-calculation
		const lastRow = rowData[rowData.length - 1];
		const lastDepthTo = lastRow ? (lastRow[depthToField] as number) : 0;
		const calculatedDepthFrom = typeof lastDepthTo === "number" ? lastDepthTo : 0;

		// Create empty row with calculated DepthFrom
		const context = getDrillHoleContext();
		const emptyRow = createEmptyRow(calculatedDepthFrom, context);

		// Merge with any user-entered data
		const pinnedRow = {
			...emptyRow,
			...pinnedRowData,
			// Always use calculated DepthFrom (overrides user input)
			[depthFromField]: calculatedDepthFrom,
			// Mark as placeholder for styling/identification
			isPlaceholder: true,
		} as T;

		return [pinnedRow];
	}, [rowData, depthToField, depthFromField, createEmptyRow, getDrillHoleContext, pinnedRowData]);

	/**
	 * Reset pinned row to empty state
	 */
	const resetPinnedRow = useCallback(() => {
		setPinnedRowData({});
	}, []);

	/**
	 * Check if row should be added based on trigger condition
	 */
	const checkShouldAddRow = useCallback(
		(updatedRow: T): boolean => {
			if (shouldAddRow) {
				return shouldAddRow(updatedRow);
			}

			// Default: trigger when DepthTo > 0
			const depthTo = updatedRow[depthToField];
			return depthTo != null && (depthTo as number) > 0;
		},
		[depthToField, shouldAddRow],
	);

	/**
	 * Handle cell value changes in pinned row
	 */
	const onPinnedCellValueChanged = useCallback(
		(event: CellValueChangedEvent<T>) => {
			if (event.rowPinned !== "bottom")
				return;

			const updatedRow = event.data;
			if (!updatedRow)
				return;

			// Update pinned row state with the change
			setPinnedRowData(prev => ({
				...prev,
				[event.column.getColId()]: event.newValue,
			}));

			// Check if row should be added to main data
			if (checkShouldAddRow(updatedRow)) {
				// Create real row with UUID
				const realRow = {
					...updatedRow,
					[idField]: crypto.randomUUID(),
					isPlaceholder: undefined, // Remove placeholder flag
				} as T;

				// Add to actual data
				addRow(realRow);

				// Reset pinned row
				resetPinnedRow();

				// Notify callback
				onRowAdded?.(realRow);

				console.log("✨ [usePinnedBottomRow] Added new row from pinned:", {
					idField,
					newId: realRow[idField],
					field: event.column.getColId(),
					value: event.newValue,
				});
			}
		},
		[idField, addRow, resetPinnedRow, onRowAdded, checkShouldAddRow],
	);

	/**
	 * Handle cell edit request in pinned row (for readOnlyEdit mode)
	 */
	const onPinnedCellEditRequest = useCallback(
		(event: any) => {
			if (event.rowPinned !== "bottom")
				return;

			// Update pinned row state with the change
			setPinnedRowData(prev => ({
				...prev,
				[event.colDef.field]: event.newValue,
			}));

			// Get updated row data
			const currentPinnedRow = pinnedBottomRowData[0];
			const updatedRow = {
				...currentPinnedRow,
				[event.colDef.field]: event.newValue,
			} as T;

			// Check if row should be added to main data
			if (checkShouldAddRow(updatedRow)) {
				// Create real row with UUID
				const realRow = {
					...updatedRow,
					[idField]: crypto.randomUUID(),
					isPlaceholder: undefined,
				} as T;

				// Add to actual data
				addRow(realRow);

				// Reset pinned row
				resetPinnedRow();

				// Notify callback
				onRowAdded?.(realRow);

				console.log("✨ [usePinnedBottomRow] Added new row from pinned (editRequest):", {
					idField,
					field: event.colDef.field,
					newId: realRow[idField],
					value: event.newValue,
				});
			}
		},
		[pinnedBottomRowData, idField, addRow, resetPinnedRow, onRowAdded, checkShouldAddRow],
	);

	/**
	 * Check if params represent the pinned row
	 */
	const isPinnedRow = useCallback((params: { rowPinned?: string | null }) => {
		console.log("isPinnedRow");
		return params.rowPinned === "bottom";
	}, []);

	return {
		pinnedBottomRowData,
		onPinnedCellValueChanged,
		onPinnedCellEditRequest,
		resetPinnedRow,
		isPinnedRow,
	};
}
