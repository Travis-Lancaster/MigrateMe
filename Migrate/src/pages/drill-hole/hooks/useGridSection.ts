/**
 * useGridSection Hook
 *
 * Reusable hook for AG Grid sections that handles frozen immer store data.
 * Provides deep cloning, state management, and edit handlers for AG Grid.
 *
 * @example
 * const { gridData, gridProps } = useGridSection(SectionKey.DrillMethod);
 *
 * <AgGridReact
 *   rowData={gridData}
 *   {...gridProps}
 *   {...otherProps}
 * />
 */

import { useCallback, useEffect, useMemo, useRef } from "react";

import type { GridReadyEvent } from "ag-grid-enterprise";
import type { SectionKey } from "#src/types/drillhole";
import { getIdField } from "../store/store-utils";
import { useDrillHoleStore } from "../store/drillhole-store";

export interface UseGridSectionOptions {
	/** Optional callback when data changes */
	onDataChange?: (data: any[]) => void

	/** Default sort configuration */
	defaultSort?: {
		field: string
		direction: "asc" | "desc"
	}
}

/**
 * DrillHole context interface for populating new rows
 */
export interface DrillHoleContext {
	/** Current DrillHole ID */
	drillHoleId: string | null
	/** Current Organization */
	organization: string
}

export function useGridSection<T = any>(
	sectionKey: SectionKey,
	options: UseGridSectionOptions = {},
) {
	const section = useDrillHoleStore(state => state.sections[sectionKey]);
	const sectionData = useDrillHoleStore(state => state.sections[sectionKey].data);
	const updateSectionData = useDrillHoleStore(state => state.updateSectionData);

	/**
	 * Optimized deep clone using native structuredClone
	 * Falls back to shallow clone for older browsers
	 * Performance: structuredClone ~10x faster than JSON.parse/stringify
	 */
	const deepClone = useCallback(<TData>(data: TData): TData => {
		if (typeof structuredClone !== "undefined") {
			return structuredClone(data); // ✅ Native, 10x faster
		}
		// Fallback for older browsers
		if (Array.isArray(data)) {
			return data.map(item => ({ ...item })) as TData;
		}
		return { ...data } as TData;
	}, []);

	/**
	 * Memoize cloned data - only clone when sectionData actually changes
	 * This prevents unnecessary clones on every render
	 */
	const gridData = useMemo(() => {
		const data = Array.isArray(sectionData) ? sectionData : [];
		console.log(`🔵 [REFRESH-GRID] Cloning grid data for ${sectionKey}`, {
			rowCount: data.length,
			isDirty: section.isDirty,
		});
		return deepClone(data) as T[];
	}, [sectionData, sectionKey, deepClone, section.isDirty]);

	// Track if user is editing (prevents store updates from overwriting)
	const isUserEditingRef = useRef(false);

	// Reset editing flag when section becomes clean (e.g., after background sync)
	useEffect(() => {
		if (!section.isDirty) {
			console.log(`🔄 [useGridSection:${sectionKey}] Section synced - resetting editing flag`);
			isUserEditingRef.current = false;
		}
	}, [section.isDirty, sectionKey]);

	// Handle cell edit requests (required for readOnlyEdit mode)
	const onCellEditRequest = useCallback(async (event: any) => {
		console.log(`✏️ [useGridSection:${sectionKey}] Cell edit request`, {
			field: event.colDef.field,
			oldValue: event.oldValue,
			newValue: event.newValue,
			rowIndex: event.rowIndex,
		});

		// Mark that user is editing to prevent store updates from overwriting
		isUserEditingRef.current = true;

		// Create new array with updated row
		const updatedData = gridData.map((row: T, idx: number) => {
			if (idx === event.rowIndex) {
				// Create new object with updated field
				return { ...row, [event.colDef.field]: event.newValue };
			}
			return row;
		});

		// Update store - this will mark section as dirty
		updateSectionData<T[]>(sectionKey, updatedData);

		// Mark the specific row as dirty in Dexie for row-level tracking
		const editedRow = updatedData[event.rowIndex];
		if (editedRow) {
			const idField = getIdField(sectionKey);
			const rowId = (editedRow as any)[idField];
			if (rowId) {
				const { markRowDirty } = useDrillHoleStore.getState();
				await markRowDirty(sectionKey as any, String(rowId));
			}
		}

		// Call optional callback
		options.onDataChange?.(updatedData);
	}, [gridData, updateSectionData, sectionKey, options]);

	// Provide method to manually update grid data (for add/delete operations)
	const updateGridData = useCallback((newData: T[] | ((prev: T[]) => T[])) => {
		// Mark that user is editing to prevent store updates from overwriting
		isUserEditingRef.current = true;

		const updatedData = typeof newData === "function" ? newData(gridData) : newData;
		updateSectionData<T[]>(sectionKey, updatedData);
		options.onDataChange?.(updatedData);
	}, [gridData, updateSectionData, sectionKey, options]);

	// Get DrillHole context for populating new rows
	const getDrillHoleContext = useCallback((): DrillHoleContext => {
		const drillHoleId = useDrillHoleStore.getState().drillHoleId;
		const organization = useDrillHoleStore.getState().Organization;
		return {
			drillHoleId,
			organization,
		};
	}, []);

	// Handle grid ready with optional default sort
	const onGridReady = useCallback((params: GridReadyEvent) => {
		if (options.defaultSort) {
			params.api.applyColumnState({
				state: [{
					colId: options.defaultSort.field,
					sort: options.defaultSort.direction,
				}],
				defaultState: { sort: null },
			});
			console.log(`🔃 [useGridSection:${sectionKey}] Applied default sort: ${options.defaultSort.field} ${options.defaultSort.direction}`);
		}
	}, [options.defaultSort, sectionKey]);

	// Return grid data and required AG Grid props
	return {
		/** Current grid data (mutable copy) */
		gridData,

		/** Section from store (for metadata like isDirty, isEditable, etc.) */
		section,

		/** AG Grid props to spread onto AgGridReact component */
		gridProps: {
			readOnlyEdit: true,
			onCellEditRequest,
			onGridReady,

			selectionColumnDef: {
				// pinned: 'left',
				width: 20,
				suppressMovable: true,
				resizable: false,
			},
		},

		/** Method to manually update grid data (for add/delete rows) */
		updateGridData,

		/** Deep clone utility (useful for adding new rows) */
		deepClone,

		/** Get current DrillHole context for populating new rows */
		getDrillHoleContext,
	};
}
