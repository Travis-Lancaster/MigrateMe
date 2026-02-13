/**
 * useRowDirtyState Hook
 *
 * Tracks and visualizes dirty rows (rows with unsaved changes).
 * Integrates with Zustand store's dirty row tracking.
 *
 * Features:
 * - Detects which rows have unsaved changes
 * - Provides CSS class name for styling
 * - Automatically clears when section is saved
 * - Integrates with existing row-level dirty tracking
 *
 * @example
 * ```typescript
 * const { isDirtyRow, getRowClass } = useRowDirtyState(
 *   SectionKey.DrillMethod,
 *   (row) => row.DrillMethodId
 * );
 *
 * <AgGridReact
 *   rowClassRules={{
 *     'row-dirty': (params) => isDirtyRow(params.data),
 *   }}
 *   ...
 * />
 * ```
 */

import { useCallback, useMemo } from "react";

import type { RowClassParams } from "ag-grid-enterprise";
import type { SectionKey } from "#src/types/drillhole";
import { useDrillHoleStore } from "../store/drillhole-store";

// Stable empty array reference to prevent re-renders
const EMPTY_ARRAY: string[] = [];

/**
 * Hook for tracking and styling dirty rows
 *
 * @param sectionKey - Section key to track dirty rows for
 * @param getRowId - Function to extract row ID from row data
 * @returns Utilities for checking and styling dirty rows
 */
export function useRowDirtyState<T>(
	sectionKey: SectionKey,
	getRowId: (row: T) => string | undefined,
) {
	// Get dirty row IDs from store using getDirtyRows method
	// The store tracks dirty rows per section for row-level sync
	// Use stable selector to prevent infinite re-renders
	const dirtyRowIds = useDrillHoleStore(
		useCallback(
			(state) => {
				const rows = state.getDirtyRows(sectionKey as any);
				return rows && rows.length > 0 ? rows : EMPTY_ARRAY;
			},
			[sectionKey],
		),
	);

	/**
	 * Check if a row is dirty (has unsaved changes)
	 */
	const isDirtyRow = useCallback(
		(row: T | undefined | null): boolean => {
			if (!row)
				return false;
			const rowId = getRowId(row);
			if (!rowId)
				return false;
			return dirtyRowIds.includes(rowId);
		},
		[dirtyRowIds, getRowId],
	);

	/**
	 * Get CSS class name for a row based on dirty state
	 * Use with AG Grid's rowClassRules
	 */
	const getRowClass = useCallback(
		(params: RowClassParams<T>): string | undefined => {
			return isDirtyRow(params.data) ? "row-dirty" : undefined;
		},
		[isDirtyRow],
	);

	/**
	 * Row class rules object for AG Grid
	 * Can be spread into AG Grid's rowClassRules prop
	 */
	const rowClassRules = useMemo(
		() => ({
			"row-dirty": (params: RowClassParams<T>) => isDirtyRow(params.data),
		}),
		[isDirtyRow],
	);

	/**
	 * Get count of dirty rows
	 */
	const dirtyRowCount = dirtyRowIds.length;

	/**
	 * Check if any rows are dirty
	 */
	const hasDirtyRows = dirtyRowCount > 0;

	return {
		/** Check if a specific row is dirty */
		isDirtyRow,

		/** Get CSS class for a row (for manual use) */
		getRowClass,

		/** Row class rules object (for AG Grid rowClassRules) */
		rowClassRules,

		/** List of dirty row IDs */
		dirtyRowIds,

		/** Count of dirty rows */
		dirtyRowCount,

		/** Whether any rows are dirty */
		hasDirtyRows,
	};
}

/**
 * Combined row class rules for common row states
 *
 * Combines dirty, phantom, and deleted row styling.
 * Use this when you need multiple row states.
 *
 * @example
 * ```typescript
 * const rowClassRules = useCombinedRowClassRules<DrillMethodData>({
 *   isDirtyRow,
 *   isPhantomRow,
 *   isDeletedRow: (row) => row.ActiveInd === false,
 * });
 *
 * <AgGridReact rowClassRules={rowClassRules} ... />
 * ```
 */
export function useCombinedRowClassRules<T>(options: {
	isDirtyRow?: (row: T) => boolean
	isPhantomRow?: (row: T) => boolean
	isDeletedRow?: (row: T) => boolean
	isQaqcRow?: (row: T) => boolean
	isValidationError?: (row: T) => boolean
	customRules?: Record<string, (params: RowClassParams<T>) => boolean>
}) {
	const {
		isDirtyRow,
		isPhantomRow,
		isDeletedRow,
		isQaqcRow,
		isValidationError,
		customRules = {},
	} = options;

	return useMemo(() => {
		const rules: Record<string, (params: RowClassParams<T>) => boolean> = {};

		if (isDirtyRow) {
			rules["row-dirty"] = (params) => {
				return params.data ? isDirtyRow(params.data) : false;
			};
		}

		if (isPhantomRow) {
			rules["row-phantom"] = (params) => {
				return params.data ? isPhantomRow(params.data) : false;
			};
		}

		if (isDeletedRow) {
			rules["row-deleted"] = (params) => {
				return params.data ? isDeletedRow(params.data) : false;
			};
		}

		if (isQaqcRow) {
			rules["row-qaqc"] = (params) => {
				return params.data ? isQaqcRow(params.data) : false;
			};
		}

		if (isValidationError) {
			rules["validation-error"] = (params) => {
				return params.data ? isValidationError(params.data) : false;
			};
		}

		// Add custom rules
		Object.entries(customRules).forEach(([className, rule]) => {
			rules[className] = rule;
		});

		return rules;
	}, [isDirtyRow, isPhantomRow, isDeletedRow, isQaqcRow, isValidationError, customRules]);
}
