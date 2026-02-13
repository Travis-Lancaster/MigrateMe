/**
 * Store Row Operations
 *
 * Row-level operations for array sections: update, add, delete, and metadata management.
 * Extracted from drillhole-store.ts to reduce complexity and improve testability.
 *
 * Applies Single Responsibility Principle by isolating row-level logic.
 */

import type { ArraySectionKey, RowMetadata } from "#src/lib/db/dexie";
import type { Draft } from "immer";
import type { DrillHoleState } from "./drillhole-store";
import {
	markRowCleanInDexie,
	markRowDirtyInDexie,
} from "#src/services/drillholeService";
import {
	createEmptyMetadata,
	generateTempId,
	getIdField,
	mapToStoreSectionKey,
} from "./store-utils";

/**
 * Update a single row in an array section
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowId - Row ID to update
 * @param partialData - Partial data to merge
 */
export function updateRowData<TRow>(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowId: string,
	partialData: Partial<TRow>,
): void {
	console.log(`🔄 [ROW UPDATE] ${sectionKey}[${rowId}]`, partialData);

	set((state) => {
		const storeSectionKey = mapToStoreSectionKey(sectionKey);
		const section = state.sections[storeSectionKey];
		if (!section || !Array.isArray(section.data)) {
			console.error(`❌ Section ${sectionKey} is not an array`);
			return;
		}

		// Find and update the row
		const idField = getIdField(sectionKey);
		const rowIndex = section.data.findIndex((row: any) => row[idField] === rowId);

		if (rowIndex === -1) {
			console.error(`❌ Row ${rowId} not found in ${sectionKey}`);
			return;
		}

		// Preserve rv during update
		const oldRv = section.data[rowIndex].rv;
		Object.assign(section.data[rowIndex], partialData);
		if (oldRv && section.data[rowIndex].rv !== oldRv) {
			section.data[rowIndex].rv = oldRv; // Restore original rv
		}

		// Mark row as dirty
		if (!section.dirtyRowIds)
			section.dirtyRowIds = [];
		if (!section.dirtyRowIds.includes(rowId)) {
			section.dirtyRowIds.push(rowId);
		}

		// Update metadata
		if (!section.rowMetadata)
			section.rowMetadata = {};
		if (!section.rowMetadata[rowId]) {
			section.rowMetadata[rowId] = createEmptyMetadata();
		}
		section.rowMetadata[rowId].isDirty = true;

		// Mark section as dirty
		section.isDirty = true;
	});

	// Persist to Dexie
	get().markRowDirty(sectionKey, rowId);
}

/**
 * Add new row to array section
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowData - New row data
 */
export function addRow<TRow>(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowData: TRow,
): void {
	const newId = generateTempId(); // Generate temp ID for new rows
	console.log(`➕ [ROW ADD] ${sectionKey}[${newId}]`);

	set((state) => {
		const storeSectionKey = mapToStoreSectionKey(sectionKey);
		const section = state.sections[storeSectionKey];
		if (!section || !Array.isArray(section.data))
			return;

		// Add row to data
		const idField = getIdField(sectionKey);
		const newRow = { ...rowData, [idField]: newId } as any;
		section.data.push(newRow);

		// Mark as new and dirty
		if (!section.dirtyRowIds)
			section.dirtyRowIds = [];
		section.dirtyRowIds.push(newId);

		if (!section.rowMetadata)
			section.rowMetadata = {};
		section.rowMetadata[newId] = {
			isDirty: true,
			isNew: true,
			isDeleted: false,
			isStale: false,
		};

		section.isDirty = true;
	});

	get().markRowDirty(sectionKey, newId);
}

/**
 * Mark row for deletion
 *
 * Soft delete: marks row as deleted instead of removing it.
 * This allows tracking of deleted rows for sync purposes.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowId - Row ID to delete
 */
export function deleteRow(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowId: string,
): void {
	console.log(`🗑️ [ROW DELETE] ${sectionKey}[${rowId}]`);

	set((state) => {
		const storeSectionKey = mapToStoreSectionKey(sectionKey);
		const section = state.sections[storeSectionKey];
		if (!section || !Array.isArray(section.data))
			return;

		// Don't actually remove yet - mark as deleted
		if (!section.rowMetadata)
			section.rowMetadata = {};
		if (!section.rowMetadata[rowId]) {
			section.rowMetadata[rowId] = createEmptyMetadata();
		}
		section.rowMetadata[rowId].isDeleted = true;
		section.rowMetadata[rowId].isDirty = true;

		if (!section.dirtyRowIds)
			section.dirtyRowIds = [];
		if (!section.dirtyRowIds.includes(rowId)) {
			section.dirtyRowIds.push(rowId);
		}

		section.isDirty = true;
	});

	get().markRowDirty(sectionKey, rowId);
}

/**
 * Mark row as dirty (both in store and Dexie)
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowId - Row ID to mark dirty
 */
export async function markRowDirty(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowId: string,
): Promise<void> {
	const { drillPlanId } = get();
	if (!drillPlanId)
		return;

	// Update store state first
	set((state) => {
		const storeSectionKey = mapToStoreSectionKey(sectionKey);
		const section = state.sections[storeSectionKey];
		if (!section || !Array.isArray(section.data))
			return;

		// Add to dirty list if not already there
		if (!section.dirtyRowIds)
			section.dirtyRowIds = [];
		if (!section.dirtyRowIds.includes(rowId)) {
			section.dirtyRowIds.push(rowId);
		}

		// Update metadata
		if (!section.rowMetadata)
			section.rowMetadata = {};
		if (!section.rowMetadata[rowId]) {
			section.rowMetadata[rowId] = createEmptyMetadata();
		}
		section.rowMetadata[rowId].isDirty = true;

		// Mark section as dirty
		section.isDirty = true;
	});

	// Then persist to Dexie
	await markRowDirtyInDexie(drillPlanId, sectionKey, rowId);

	console.log(`✓ [ROW DIRTY] ${sectionKey}[${rowId}] marked as dirty`);
}

/**
 * Mark row as clean in Dexie (after successful save)
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowId - Row ID to mark clean
 */
export async function markRowClean(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowId: string,
): Promise<void> {
	const { drillPlanId } = get();
	if (!drillPlanId)
		return;

	await markRowCleanInDexie(drillPlanId, sectionKey, rowId);

	set((state) => {
		const storeSectionKey = mapToStoreSectionKey(sectionKey);
		const section = state.sections[storeSectionKey];
		if (!section)
			return;

		// Remove from dirty list
		if (section.dirtyRowIds) {
			section.dirtyRowIds = section.dirtyRowIds.filter((id: string) => id !== rowId);
		}

		// Update metadata
		if (section.rowMetadata?.[rowId]) {
			section.rowMetadata[rowId].isDirty = false;
			section.rowMetadata[rowId].isNew = false; // Saved, no longer new
		}

		// If no more dirty rows, mark section clean
		if (!section.dirtyRowIds || section.dirtyRowIds.length === 0) {
			section.isDirty = false;
		}
	});
}

/**
 * Get metadata for specific row
 *
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowId - Row ID
 * @returns Row metadata or undefined if not found
 */
export function getRowMetadata(
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowId: string,
): RowMetadata | undefined {
	const storeSectionKey = mapToStoreSectionKey(sectionKey);
	const section = get().sections[storeSectionKey];
	return section?.rowMetadata?.[rowId];
}

/**
 * Set metadata for specific row
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @param rowId - Row ID
 * @param metadata - Partial metadata to merge
 */
export function setRowMetadata(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
	rowId: string,
	metadata: Partial<RowMetadata>,
): void {
	set((state) => {
		const storeSectionKey = mapToStoreSectionKey(sectionKey);
		const section = state.sections[storeSectionKey];
		if (!section)
			return;

		if (!section.rowMetadata)
			section.rowMetadata = {};
		if (!section.rowMetadata[rowId]) {
			section.rowMetadata[rowId] = createEmptyMetadata();
		}

		Object.assign(section.rowMetadata[rowId], metadata);
	});
}

/**
 * Get list of dirty row IDs
 *
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @returns Array of dirty row IDs
 */
export function getDirtyRows(
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
): string[] {
	const storeSectionKey = mapToStoreSectionKey(sectionKey);
	const section = get().sections[storeSectionKey];
	return section?.dirtyRowIds || [];
}

/**
 * Get list of stale row IDs
 *
 * @param get - Zustand get function
 * @param sectionKey - Array section key
 * @returns Array of stale row IDs
 */
export function getStaleRows(
	get: () => DrillHoleState,
	sectionKey: ArraySectionKey,
): string[] {
	const storeSectionKey = mapToStoreSectionKey(sectionKey);
	const section = get().sections[storeSectionKey];
	return section?.staleRowIds || [];
}
