/**
 * DrillHole Aggregate Store
 *
 * Central Zustand store that manages the entire DrillHole aggregate.
 * Coordinates all sections, handles cross-section updates, and manages persistence.
 *
 * REFACTORED: Uses extracted modules for actions, loaders, and row operations.
 * This eliminates ~600 lines of duplication and improves maintainability.
 *
 * PHASE 2: Type safety improvements - uses actual API types instead of placeholders
 */

// Import actual API types (Phase 2: Type Safety)
import type {
	CollarBase,
	CollarCoordinateBase,
	DrillPlan,
	GeologyCombinedLog,
	Sample,
	SectionVersionDto,
} from "#src/api/database/data-contracts.js";
import type { ArraySectionKey, RowMetadata } from "#src/lib/db/dexie";
import type { ActionResult, SectionKey } from "#src/types/drillhole";
// Import Survey master-detail type
import type { SurveyWithLogs } from "../validation/survey-schemas";
import type { SectionStore } from "./section-factory";
import { create } from "zustand";

import { devtools } from "zustand/middleware";

import { immer } from "zustand/middleware/immer";

// Import extracted modules (eliminates duplication)
import { createAllSections } from "./section-config";
import * as StoreActions from "./store-actions";
import * as StoreLoaders from "./store-loaders";
import * as StoreRowOps from "./store-row-operations";

// ============================================================================
// DrillHole Store Interface
// ============================================================================

/**
 * Load conflict state - shown in modal when version conflict detected on load
 */
export interface LoadConflictState {
	visible: boolean
	staleSections: SectionKey[]
	serverVersions: SectionVersionDto[]
}

export interface DrillHoleState {
	updateSection: any
	// Aggregate identity
	drillHoleId: string | null
	drillPlanId: string | null
	isLoaded: boolean
	isLoading: boolean
	error: string | null

	// Conflict state
	loadConflict: LoadConflictState | null
	setLoadConflict: (conflict: LoadConflictState) => void
	clearLoadConflict: () => void

	// Import modal state
	importModalOpen: boolean
	openImportModal: () => void
	closeImportModal: () => void

	// UI state
	activeSection: string
	setActiveSection: (sectionKey: string) => void

	uiDrillHoleId: string
	DrillHoleId: string
	HoleNm?: string
	PlannedHoleNm?: string
	ProposedHoleNm?: string
	OtherHoleNm?: string
	Organization: string

	// All sections - now created by factory (Phase 2: Using actual API types)
	// Using Record type to support dynamic indexing with SectionKey enum
	sections: Record<SectionKey, SectionStore<any, any>> & {
		dispatch: any
		drillplan: SectionStore<DrillPlan>
		collar: SectionStore<CollarBase>
		collarcoordinates: SectionStore<CollarCoordinateBase>
		rigsheet: SectionStore<any> // TODO: Add RigSetup type from API
		drillmethod: SectionStore<any[]> // TODO: Add DrillMethod[] type from API
		// Master-detail pattern: Survey header + SurveyLog array
		survey: SectionStore<SurveyWithLogs>
		quicklog: SectionStore<GeologyCombinedLog> // QuickLog uses GeologyCombinedLog type
		geocombined: SectionStore<GeologyCombinedLog>
		sample: SectionStore<Sample>
	}

	// Actions - now delegate to extracted modules
	loadDrillHole: (drillPlanId: string, forceRefresh?: boolean) => Promise<void>
	unloadDrillHole: () => void

	// Section data update
	updateSectionData: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => void

	// Section operations
	saveSection: (sectionKey: SectionKey) => Promise<ActionResult>
	submitSection: (sectionKey: SectionKey) => Promise<ActionResult>
	completedSection: (sectionKey: SectionKey) => Promise<ActionResult>
	rejectSection: (sectionKey: SectionKey) => Promise<ActionResult>
	reviewSection: (sectionKey: SectionKey) => Promise<ActionResult>
	approveSection: (sectionKey: SectionKey) => Promise<ActionResult>
	excludeFromReport: (sectionKey: SectionKey) => Promise<ActionResult>

	// Conflict resolution
	refreshStaleSection: (sectionKey: SectionKey) => Promise<ActionResult>

	// Cross-section coordination
	propagateChanges: (changedSectionKey: SectionKey) => void

	// Row-level operations (for array sections)
	updateRowData: <TRow>(
		sectionKey: ArraySectionKey,
		rowId: string,
		partialData: Partial<TRow>,
	) => void
	addRow: <TRow>(sectionKey: ArraySectionKey, rowData: TRow) => void
	deleteRow: (sectionKey: ArraySectionKey, rowId: string) => void
	markRowDirty: (sectionKey: ArraySectionKey, rowId: string) => Promise<void>
	markRowClean: (sectionKey: ArraySectionKey, rowId: string) => Promise<void>
	getRowMetadata: (sectionKey: ArraySectionKey, rowId: string) => RowMetadata | undefined
	setRowMetadata: (sectionKey: ArraySectionKey, rowId: string, metadata: Partial<RowMetadata>) => void
	getDirtyRows: (sectionKey: ArraySectionKey) => string[]
	getStaleRows: (sectionKey: ArraySectionKey) => string[]

	// Utility
	getSectionByKey: (key: SectionKey) => SectionStore<any> | null
	hasUnsavedChanges: () => boolean
	getDirtySections: () => SectionKey[]
}

// ============================================================================
// Create Store
// ============================================================================

export const useDrillHoleStore = create<DrillHoleState>()(
	devtools(
		immer((set, get) => ({
			// Initial state
			drillHoleId: null,
			drillPlanId: null,
			isLoaded: false,
			isLoading: false,
			error: null,

			// Import modal state
			importModalOpen: false,
			uiDrillHoleId: "",
			DrillHoleId: "",
			Organization: "",

			// Conflict state
			loadConflict: null,
			setLoadConflict: (conflict: LoadConflictState) => {
				set((state) => {
					state.loadConflict = conflict;
				});
			},
			clearLoadConflict: () => {
				set((state) => {
					state.loadConflict = null;
				});
			},

			// UI state
			activeSection: "drillplan",
			setActiveSection: (sectionKey: string) => {
				set((state) => {
					state.activeSection = sectionKey;
				});
			},

			// Import modal actions
			openImportModal: () => {
				set((state) => {
					state.importModalOpen = true;
				});
			},
			closeImportModal: () => {
				set((state) => {
					state.importModalOpen = false;
				});
			},

			// ========================================================================
			// Initialize all sections using factory (eliminates 64 lines of duplication)
			// ========================================================================
			sections: createAllSections(),

			// ========================================================================
			// Data Loading Actions - Delegate to store-loaders module
			// ========================================================================

			/**
			 * Load drill hole data from Dexie cache or API
			 * Delegates to store-loaders.ts for implementation
			 */
			loadDrillHole: async (drillPlanId: string, forceRefresh = false) => {
				return StoreLoaders.loadDrillHole(set, get, drillPlanId, forceRefresh);
			},

			/**
			 * Unload current drill hole and reset state
			 * Delegates to store-loaders.ts for implementation
			 */
			unloadDrillHole: () => {
				StoreLoaders.unloadDrillHole(set);
			},

			/**
			 * Refresh a stale section from the server
			 * Delegates to store-loaders.ts for implementation
			 */
			refreshStaleSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreLoaders.refreshStaleSection(get, sectionKey);
			},

			// ========================================================================
			// Section Actions - Delegate to store-actions module
			// ========================================================================

			/**
			 * Update section data in store
			 * Delegates to store-actions.ts for implementation
			 */
			updateSectionData: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => {
				StoreActions.updateSectionData(set, get, sectionKey, partialData);
			},

			/**
			 * Update section data in store (alias for updateSectionData)
			 * Used by legacy components
			 */
			updateSection: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => {
				StoreActions.updateSectionData(set, get, sectionKey, partialData);
			},

			/**
			 * Save section to Dexie and API
			 * Delegates to store-actions.ts for implementation
			 */
			saveSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.saveSection(get, sectionKey);
			},

			/**
			 * Submit section (Draft → Complete)
			 * Delegates to store-actions.ts for implementation
			 */
			submitSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.submitSection(set, get, sectionKey);
			},

			/**
			 * Mark section as Complete (Draft → Complete without validation)
			 * Delegates to store-actions.ts for implementation
			 */
			completedSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.completedSection(set, get, sectionKey);
			},

			/**
			 * Reject section (back to Draft)
			 * Delegates to store-actions.ts for implementation
			 */
			rejectSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.rejectSection(set, get, sectionKey);
			},

			/**
			 * Review section (Complete → Reviewed)
			 * Delegates to store-actions.ts for implementation
			 */
			reviewSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.reviewSection(set, get, sectionKey);
			},

			/**
			 * Approve section (Reviewed → Approved)
			 * Delegates to store-actions.ts for implementation
			 */
			approveSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.approveSection(set, get, sectionKey);
			},

			/**
			 * Exclude section from reports (Approved sections only)
			 * Delegates to store-actions.ts for implementation
			 */
			excludeFromReport: async (sectionKey: SectionKey): Promise<ActionResult> => {
				return StoreActions.excludeFromReport(set, get, sectionKey);
			},

			/**
			 * Propagate changes to dependent sections
			 * Delegates to store-actions.ts for implementation
			 */
			propagateChanges: (changedSectionKey: SectionKey) => {
				StoreActions.propagateChanges(set, get, changedSectionKey);
			},

			// ========================================================================
			// Row-Level Operations - Delegate to store-row-operations module
			// ========================================================================

			/**
			 * Update a single row in an array section
			 * Delegates to store-row-operations.ts for implementation
			 */
			updateRowData: <TRow>(
				sectionKey: ArraySectionKey,
				rowId: string,
				partialData: Partial<TRow>,
			) => {
				StoreRowOps.updateRowData(set, get, sectionKey, rowId, partialData);
			},

			/**
			 * Add new row to array section
			 * Delegates to store-row-operations.ts for implementation
			 */
			addRow: <TRow>(sectionKey: ArraySectionKey, rowData: TRow) => {
				StoreRowOps.addRow(set, get, sectionKey, rowData);
			},

			/**
			 * Mark row for deletion
			 * Delegates to store-row-operations.ts for implementation
			 */
			deleteRow: (sectionKey: ArraySectionKey, rowId: string) => {
				StoreRowOps.deleteRow(set, get, sectionKey, rowId);
			},

			/**
			 * Mark row as dirty (both in store and Dexie)
			 * Delegates to store-row-operations.ts for implementation
			 */
			markRowDirty: async (sectionKey: ArraySectionKey, rowId: string) => {
				return StoreRowOps.markRowDirty(set, get, sectionKey, rowId);
			},

			/**
			 * Mark row as clean in Dexie (after successful save)
			 * Delegates to store-row-operations.ts for implementation
			 */
			markRowClean: async (sectionKey: ArraySectionKey, rowId: string) => {
				return StoreRowOps.markRowClean(set, get, sectionKey, rowId);
			},

			/**
			 * Get metadata for specific row
			 * Delegates to store-row-operations.ts for implementation
			 */
			getRowMetadata: (sectionKey: ArraySectionKey, rowId: string) => {
				return StoreRowOps.getRowMetadata(get, sectionKey, rowId);
			},

			/**
			 * Set metadata for specific row
			 * Delegates to store-row-operations.ts for implementation
			 */
			setRowMetadata: (
				sectionKey: ArraySectionKey,
				rowId: string,
				metadata: Partial<RowMetadata>,
			) => {
				StoreRowOps.setRowMetadata(set, get, sectionKey, rowId, metadata);
			},

			/**
			 * Get list of dirty row IDs
			 * Delegates to store-row-operations.ts for implementation
			 */
			getDirtyRows: (sectionKey: ArraySectionKey) => {
				return StoreRowOps.getDirtyRows(get, sectionKey);
			},

			/**
			 * Get list of stale row IDs
			 * Delegates to store-row-operations.ts for implementation
			 */
			getStaleRows: (sectionKey: ArraySectionKey) => {
				return StoreRowOps.getStaleRows(get, sectionKey);
			},

			// ========================================================================
			// Utilities
			// ========================================================================

			/**
			 * Get section by key
			 */
			getSectionByKey: (key: SectionKey): SectionStore | null => {
				return get().sections[key] || null;
			},

			/**
			 * Check if any section has unsaved changes
			 */
			hasUnsavedChanges: (): boolean => {
				const sections = get().sections;
				return Object.values(sections).some(section => section.hasUnsavedChanges());
			},

			/**
			 * Get list of sections with unsaved changes
			 */
			getDirtySections: (): SectionKey[] => {
				const sections = get().sections;
				return Object.entries(sections)
					.filter(([_, section]) => section.hasUnsavedChanges())
					.map(([key]) => key as SectionKey);
			},
		})),
	),
);
