/**
 * Drill Hole UI State Store
 *
 * Zustand store for UI-only state (NOT data).
 * Data comes from Dexie via useLiveQuery.
 *
 * Responsibilities:
 * - Current active tab/section
 * - UI toggles (edit mode, collapsed panels)
 * - Temporary form state
 * - Navigation state
 */

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { SectionKey } from "../constants";

export interface DrillHoleUIState {
	// Navigation
	currentSection: SectionKey

	// UI toggles
	masterGridCollapsed: boolean
	tabsCollapsed: boolean
	editMode: boolean

	// Modals
	importModalOpen: boolean
	coordModalOpen: boolean
	conflictModalOpen: boolean

	// Actions
	setCurrentSection: (section: SectionKey) => void
	toggleMasterGrid: () => void
	toggleTabs: () => void
	setEditMode: (enabled: boolean) => void
	toggleEditMode: () => void
	openImportModal: () => void
	closeImportModal: () => void
	openCoordModal: () => void
	closeCoordModal: () => void
	openConflictModal: () => void
	closeConflictModal: () => void
	reset: () => void
}

const initialState = {
	currentSection: SectionKey.DrillPlan,
	masterGridCollapsed: false,
	tabsCollapsed: false,
	editMode: false,
	importModalOpen: false,
	coordModalOpen: false,
	conflictModalOpen: false,
};

export const useDrillHoleUI = create<DrillHoleUIState>()(
	immer(set => ({
		...initialState,

		setCurrentSection: (section) => {
			set((state) => {
				state.currentSection = section;
			});
		},

		toggleMasterGrid: () => {
			set((state) => {
				state.masterGridCollapsed = !state.masterGridCollapsed;
			});
		},

		toggleTabs: () => {
			set((state) => {
				state.tabsCollapsed = !state.tabsCollapsed;
			});
		},

		setEditMode: (enabled) => {
			set((state) => {
				state.editMode = enabled;
			});
		},

		toggleEditMode: () => {
			set((state) => {
				state.editMode = !state.editMode;
			});
		},

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

		openCoordModal: () => {
			set((state) => {
				state.coordModalOpen = true;
			});
		},

		closeCoordModal: () => {
			set((state) => {
				state.coordModalOpen = false;
			});
		},

		openConflictModal: () => {
			set((state) => {
				state.conflictModalOpen = true;
			});
		},

		closeConflictModal: () => {
			set((state) => {
				state.conflictModalOpen = false;
			});
		},

		reset: () => {
			set(initialState);
		},
	})),
);
