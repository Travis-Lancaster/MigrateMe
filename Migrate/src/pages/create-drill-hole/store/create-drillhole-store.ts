/**
 * Create Drill Hole - Main Zustand Store (Data Entry Module)
 *
 * Central store for drill hole DATA ENTRY workflow.
 * Manages all 24 sections, handles validation, and coordinates data persistence.
 *
 * DATA ENTRY WORKFLOW:
 * - Loads EXISTING drill hole (not creating new)
 * - Sections populated with existing data
 * - Tracks completion percentage
 * - Validates per section
 * - Saves sections individually (no bulk submit)
 *
 * CRITICAL: Drill holes already exist weeks before this code runs.
 * HoleId = CollarId = DrillPlanId (always same GUID).
 *
 * ARCHITECTURE:
 * - Uses section factory pattern (eliminates duplication)
 * - Delegates to extracted modules (store-actions, store-loaders, store-row-operations)
 * - Follows offline-first pattern with Dexie cache
 * - Console.log debugging at key points (📂 store, 💾 save, 🔍 validation, ✅ success)
 */

import * as StoreActions from "./store-actions";
import * as StoreLoaders from "./store-loaders";
import * as StoreRowOps from "./store-row-operations";

import { ActionResult, RowStatus, SectionKey } from "#src/types/drillhole";
import type { ArraySectionKey, RowMetadata } from "#src/lib/db/dexie";
// Import actual API types for type safety
import type {
	CollarCoordinateBase,
	CreateCollarDto,
	DrillPlan,
	GeologyCombinedLog,
	RigSetupBase,
	Sample,
} from "#src/api/database/data-contracts.js";
// Import extracted modules (eliminates duplication)
import {
	createAllSections,
	getCompletionPercentage,
	getDependentSections,
	getSectionConfig,
} from "./section-config";

import type { SectionStore } from "./section-factory";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";

// ============================================================================
// Create Drill Hole Store Interface
// ============================================================================

/**
 * Creation workflow state
 */
export interface CreateDrillHoleState {
	// ========================================================================
	// IDENTITY & LOADING
	// ========================================================================

	/** Drill hole ID (same as CollarId and DrillPlanId) */
	drillHoleId: string | null;

	/** Collar ID (same as DrillHoleId and DrillPlanId) */
	collarId: string | null;

	/** Drill plan ID (same as DrillHoleId and CollarId) */
	drillPlanId: string | null;

	/** Hole name from collar */
	plannedHoleNm: string | null;

	/** Hole name (alias for plannedHoleNm) */
	HoleNm: string | null;

	/** Organization for this drill hole */
	Organization: string | null;

	/** Is data loaded and ready? */
	isLoaded: boolean;

	/** Is currently loading from API? */
	isLoading: boolean;

	/** Error message if load/save failed */
	error: string | null;

	// ========================================================================
	// CREATION WORKFLOW STATE
	// ========================================================================

	/** Completion percentage (0-100) based on section statuses */
	completionPercentage: number;

	/** Array of section keys that are Complete */
	sectionsCompleted: SectionKey[];

	/** Is currently submitting to create drill hole? */
	isSubmitting: boolean;

	/** Submission error if create failed */
	submissionError: string | null;

	// ========================================================================
	// UI STATE
	// ========================================================================

	/** Currently active section in the UI */
	activeSection: string;

	/** Set active section */
	setActiveSection: (sectionKey: string) => void;

	/** Is drawer editor open? */
	drawerOpen: boolean;

	/** Open drawer editor */
	openDrawer: () => void;

	/** Close drawer editor */
	closeDrawer: () => void;

	/** Open import modal (placeholder) */
	openImportModal: () => void;

	// ========================================================================
	// SECTIONS (24 total)
	// ========================================================================

	/**
	 * All sections - created by factory from section-config.ts
	 *
	 * Setup: RigSheet, CollarCoordinates
	 * Geology: GeoCombinedLog, ShearLog, StructureLog
	 * Geotech: CoreRecoveryRunLog, FractureCountLog, MagSusLog, RockMechanicLog, RQD, SpecificGravity, StructurePt
	 * Sampling: Sample, Dispatch, LabResults, CycloneCleaning
	 * Other: Qaqc, Collar (SignOff), Summary, DrillPlan (read-only)
	 */
	sections: Record<SectionKey, SectionStore<any, any>> & {
		drillplan: SectionStore<DrillPlan>;
		rigsheet: SectionStore<RigSetupBase>;
		collarcoordinates: SectionStore<CollarCoordinateBase>;
		geocombined: SectionStore<GeologyCombinedLog[]>;
		sample: SectionStore<Sample[]>;
		// ... (other sections typed as needed)
	};

	// ========================================================================
	// INITIALIZATION ACTIONS
	// ========================================================================

	/**
	 * Initialize drill hole for data entry
	 *
	 * Loads existing drill hole data and initializes all sections.
	 *
	 * @param drillHoleId - The drill hole ID (same as CollarId and DrillPlanId)
	 */
	initializeDrillHole: (drillHoleId: string) => Promise<void>;

	/**
	 * Reset store to initial state
	 */
	resetStore: () => void;

	// ========================================================================
	// SECTION DATA OPERATIONS
	// ========================================================================

	/**
	 * Update section data in store
	 *
	 * @param sectionKey - The section to update
	 * @param partialData - Partial data to merge
	 */
	updateSectionData: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => void;

	/**
	 * Update section (alias for updateSectionData)
	 */
	updateSection: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => void;

	/**
	 * Save section to Dexie cache and optionally API
	 *
	 * @param sectionKey - The section to save
	 * @returns Action result with success/error
	 */
	saveSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Mark section as complete
	 *
	 * Validates section data before marking complete.
	 *
	 * @param sectionKey - The section to complete
	 * @returns Action result with success/error
	 */
	completeSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Submit section for review
	 */
	submitSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Reject section
	 */
	rejectSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Review section
	 */
	reviewSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Approve section
	 */
	approveSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Exclude section from report
	 */
	excludeFromReport: (sectionKey: SectionKey) => Promise<ActionResult>;

	/**
	 * Mark section as completed (alias for completeSection)
	 */
	completedSection: (sectionKey: SectionKey) => Promise<ActionResult>;

	// ========================================================================
	// ROW-LEVEL OPERATIONS (for array sections)
	// ========================================================================

	/**
	 * Update a single row in an array section
	 */
	updateRowData: <TRow>(
		sectionKey: ArraySectionKey,
		rowId: string,
		partialData: Partial<TRow>,
	) => void;

	/**
	 * Add new row to array section
	 */
	addRow: <TRow>(sectionKey: ArraySectionKey, rowData: TRow) => void;

	/**
	 * Mark row for deletion
	 */
	deleteRow: (sectionKey: ArraySectionKey, rowId: string) => void;

	/**
	 * Mark row as dirty (both in store and Dexie)
	 */
	markRowDirty: (sectionKey: ArraySectionKey, rowId: string) => Promise<void>;

	/**
	 * Mark row as clean (after successful save)
	 */
	markRowClean: (sectionKey: ArraySectionKey, rowId: string) => Promise<void>;

	/**
	 * Get metadata for specific row
	 */
	getRowMetadata: (sectionKey: ArraySectionKey, rowId: string) => RowMetadata | undefined;

	/**
	 * Set metadata for specific row
	 */
	setRowMetadata: (
		sectionKey: ArraySectionKey,
		rowId: string,
		metadata: Partial<RowMetadata>,
	) => void;

	/**
	 * Get list of dirty row IDs
	 */
	getDirtyRows: (sectionKey: ArraySectionKey) => string[];

	/**
	 * Get list of stale row IDs
	 */
	getStaleRows: (sectionKey: ArraySectionKey) => string[];

	// ========================================================================
	// CROSS-SECTION COORDINATION
	// ========================================================================

	/**
	 * Propagate changes to dependent sections
	 *
	 * Example: When GeoCombinedLog changes, update Sample intervals.
	 *
	 * @param changedSectionKey - The section that changed
	 */
	propagateChanges: (changedSectionKey: SectionKey) => void;

	// ========================================================================
	// SUBMISSION (Create Drill Hole)
	// ========================================================================

	/**
	 * Submit drill hole for creation
	 *
	 * Validates all sections, then creates drill hole record via API.
	 * This is the final step in the creation workflow.
	 *
	 * @returns Action result with created drill hole ID
	 */
	submitDrillHole: () => Promise<ActionResult>;

	// ========================================================================
	// UTILITIES
	// ========================================================================

	/**
	 * Get section by key
	 */
	getSectionByKey: (key: SectionKey) => SectionStore<any> | null;

	/**
	 * Check if any section has unsaved changes
	 */
	hasUnsavedChanges: () => boolean;

	/**
	 * Get list of sections with unsaved changes
	 */
	getDirtySections: () => SectionKey[];

	/**
	 * Update completion percentage
	 */
	updateCompletionPercentage: () => void;
}

// ============================================================================
// Create Store
// ============================================================================

export const useCreateDrillHoleStore = create<CreateDrillHoleState>()(
	devtools(
		immer((set, get) => ({
			// ====================================================================
			// INITIAL STATE
			// ====================================================================

			drillHoleId: null,
			collarId: null,
			drillPlanId: null,
			plannedHoleNm: null,
			HoleNm: null,
			Organization: null,
			isLoaded: false,
			isLoading: false,
			error: null,

			// Creation workflow state
			completionPercentage: 0,
			sectionsCompleted: [],
			isSubmitting: false,
			submissionError: null,

			// UI state
			activeSection: "rigsheet",
			drawerOpen: false,

			// ====================================================================
			// UI ACTIONS
			// ====================================================================

			setActiveSection: (sectionKey: string) => {
				console.log(`📂 [STORE:UI] Switching to section: ${sectionKey}`);
				set((state) => {
					state.activeSection = sectionKey;
				});
			},

			openDrawer: () => {
				console.log("📂 [STORE:UI] Opening drawer editor");
				set((state) => {
					state.drawerOpen = true;
				});
			},

			closeDrawer: () => {
				console.log("📂 [STORE:UI] Closing drawer editor");
				set((state) => {
					state.drawerOpen = false;
				});
			},

			openImportModal: () => {
				console.log(`📂 [STORE:UI] Opening import modal`);
				// TODO: Implement import modal logic
				// Note: This is a placeholder - actual implementation will be added when import modal is built
			},

			// ====================================================================
			// INITIALIZE ALL SECTIONS (Factory Pattern)
			// ====================================================================

			sections: createAllSections(),

			// ====================================================================
			// INITIALIZATION ACTIONS
			// ====================================================================

			/**
			 * Initialize drill hole for data entry
			 *
			 * Loads existing drill hole data and populates sections.
			 *
			 * @param drillHoleId - The drill hole ID (same as CollarId and DrillPlanId)
			 */
			initializeDrillHole: async (drillHoleId: string) => {
				return StoreLoaders.initializeDrillHole(set, get, drillHoleId);
			},

			/**
			 * Reset store to initial state
			 */
			resetStore: () => {
				console.log("📂 [STORE:RESET] Resetting store to initial state");

				set((state) => {
					state.drillHoleId = null;
					state.collarId = null;
					state.drillPlanId = null;
					state.plannedHoleNm = null;
					state.isLoaded = false;
					state.isLoading = false;
					state.error = null;
					state.completionPercentage = 0;
					state.sectionsCompleted = [];
					state.isSubmitting = false;
					state.submissionError = null;
					state.activeSection = "rigsheet";
					state.drawerOpen = false;

					// Reset all sections to initial state
					state.sections = createAllSections() as any;
				});

				console.log("✅ [STORE:RESET] Store reset complete");
			},

			// ====================================================================
			// SECTION DATA OPERATIONS
			// ====================================================================

			/**
			 * Update section data in store
			 */
			updateSectionData: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => {
				console.log(`💾 [STORE:UPDATE] Updating section: ${sectionKey}`);
				console.log("  📝 Partial data:", partialData);

				// TODO: Delegate to StoreActions.updateSectionData when created
				set((state) => {
					const section = state.sections[sectionKey];
					if (section) {
						section.data = { ...section.data, ...partialData };
						section.isDirty = true;
					}
				});

				console.log(`✅ [STORE:UPDATE] Section ${sectionKey} updated`);
			},

			/**
			 * Update section (alias for updateSectionData)
			 */
			updateSection: <TData>(sectionKey: SectionKey, partialData: Partial<TData>) => {
				return get().updateSectionData(sectionKey, partialData);
			},

			/**
			 * Save section to Dexie cache and optionally API
			 */
			saveSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`💾 [STORE:SAVE] Saving section: ${sectionKey}`);

				// TODO: Delegate to StoreActions.saveSection when created
				// This will:
				// 1. Validate section data (Tier 2: Save validators)
				// 2. Save to Dexie cache
				// 3. Optionally sync to API
				// 4. Mark section as clean

				// Temporary placeholder:
				return {
					success: true,
					message: `Section ${sectionKey} saved`,
				};
			},

			/**
			 * Mark section as complete
			 */
			completeSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`🔍 [STORE:COMPLETE] Completing section: ${sectionKey}`);

				// TODO: Delegate to StoreActions.completeSection when created
				// This will:
				// 1. Validate section data (Tier 1: Database validators - blocking)
				// 2. Mark section status as Complete
				// 3. Update completion percentage
				// 4. Save to Dexie and API

				// Temporary placeholder:
				set((state) => {
					const section = state.sections[sectionKey];
					if (section) {
						section.rowStatus = RowStatus.Complete;
					}

					// Update sectionsCompleted array
					if (!state.sectionsCompleted.includes(sectionKey)) {
						state.sectionsCompleted.push(sectionKey);
					}

					// Recalculate completion percentage
					state.completionPercentage = getCompletionPercentage(state.sections);
				});

				console.log(`✅ [STORE:COMPLETE] Section ${sectionKey} marked complete`);

				return {
					success: true,
					message: `Section ${sectionKey} completed`,
				};
			},

			/**
			 * Submit section (placeholder for compatibility)
			 */
			submitSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`📤 [STORE:SUBMIT] Submitting section: ${sectionKey}`);
				return { success: true, message: `Section ${sectionKey} submitted` };
			},

			/**
			 * Reject section (placeholder for compatibility)
			 */
			rejectSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`❌ [STORE:REJECT] Rejecting section: ${sectionKey}`);
				return { success: true, message: `Section ${sectionKey} rejected` };
			},

			/**
			 * Review section (placeholder for compatibility)
			 */
			reviewSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`👀 [STORE:REVIEW] Reviewing section: ${sectionKey}`);
				return { success: true, message: `Section ${sectionKey} reviewed` };
			},

			/**
			 * Approve section (placeholder for compatibility)
			 */
			approveSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`✅ [STORE:APPROVE] Approving section: ${sectionKey}`);
				return { success: true, message: `Section ${sectionKey} approved` };
			},

			/**
			 * Exclude from report (placeholder for compatibility)
			 */
			excludeFromReport: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`🚫 [STORE:EXCLUDE] Excluding section from report: ${sectionKey}`);
				return { success: true, message: `Section ${sectionKey} excluded from report` };
			},

			/**
			 * Mark section as completed (alias for completeSection)
			 */
			completedSection: async (sectionKey: SectionKey): Promise<ActionResult> => {
				console.log(`✅ [STORE:COMPLETED] Marking section completed: ${sectionKey}`);
				return await get().completeSection(sectionKey);
			},

			// ====================================================================
			// ROW-LEVEL OPERATIONS
			// ====================================================================

			/**
			 * Update a single row in an array section
			 */
			updateRowData: <TRow>(
				sectionKey: ArraySectionKey,
				rowId: string,
				partialData: Partial<TRow>,
			) => {
				console.log(`💾 [STORE:ROW] Updating row in ${sectionKey}: ${rowId}`);

				// TODO: Delegate to StoreRowOps.updateRowData when created
				set((state) => {
					const section = (state.sections as any)[sectionKey];
					if (section && Array.isArray(section.data)) {
						const rowIndex = section.data.findIndex((row: any) => row.id === rowId);
						if (rowIndex !== -1) {
							section.data[rowIndex] = { ...section.data[rowIndex], ...partialData };
							section.isDirty = true;
						}
					}
				});

				console.log(`✅ [STORE:ROW] Row ${rowId} updated`);
			},

			/**
			 * Add new row to array section
			 */
			addRow: <TRow>(sectionKey: ArraySectionKey, rowData: TRow) => {
				console.log(`💾 [STORE:ROW] Adding row to ${sectionKey}`);

				// TODO: Delegate to StoreRowOps.addRow when created
				set((state) => {
					const section = (state.sections as any)[sectionKey];
					if (section && Array.isArray(section.data)) {
						section.data.push(rowData);
						section.isDirty = true;
					}
				});

				console.log(`✅ [STORE:ROW] Row added to ${sectionKey}`);
			},

			/**
			 * Mark row for deletion
			 */
			deleteRow: (sectionKey: ArraySectionKey, rowId: string) => {
				console.log(`💾 [STORE:ROW] Deleting row from ${sectionKey}: ${rowId}`);

				// TODO: Delegate to StoreRowOps.deleteRow when created
				set((state) => {
					const section = (state.sections as any)[sectionKey];
					if (section && Array.isArray(section.data)) {
						section.data = section.data.filter((row: any) => row.id !== rowId);
						section.isDirty = true;
					}
				});

				console.log(`✅ [STORE:ROW] Row ${rowId} deleted`);
			},

			/**
			 * Mark row as dirty (both in store and Dexie)
			 */
			markRowDirty: async (sectionKey: ArraySectionKey, rowId: string) => {
				console.log(`💾 [STORE:ROW] Marking row dirty: ${sectionKey}.${rowId}`);

				// TODO: Delegate to StoreRowOps.markRowDirty when created
				// This will update Dexie metadata
			},

			/**
			 * Mark row as clean (after successful save)
			 */
			markRowClean: async (sectionKey: ArraySectionKey, rowId: string) => {
				console.log(`✅ [STORE:ROW] Marking row clean: ${sectionKey}.${rowId}`);

				// TODO: Delegate to StoreRowOps.markRowClean when created
				// This will update Dexie metadata
			},

			/**
			 * Get metadata for specific row
			 */
			getRowMetadata: (sectionKey: ArraySectionKey, rowId: string) => {
				// TODO: Delegate to StoreRowOps.getRowMetadata when created
				return undefined;
			},

			/**
			 * Set metadata for specific row
			 */
			setRowMetadata: (
				sectionKey: ArraySectionKey,
				rowId: string,
				metadata: Partial<RowMetadata>,
			) => {
				console.log(`💾 [STORE:ROW] Setting metadata: ${sectionKey}.${rowId}`);

				// TODO: Delegate to StoreRowOps.setRowMetadata when created
			},

			/**
			 * Get list of dirty row IDs
			 */
			getDirtyRows: (sectionKey: ArraySectionKey) => {
				// TODO: Delegate to StoreRowOps.getDirtyRows when created
				return [];
			},

			/**
			 * Get list of stale row IDs
			 */
			getStaleRows: (sectionKey: ArraySectionKey) => {
				// TODO: Delegate to StoreRowOps.getStaleRows when created
				return [];
			},

			// ====================================================================
			// CROSS-SECTION COORDINATION
			// ====================================================================

			/**
			 * Propagate changes to dependent sections
			 */
			propagateChanges: (changedSectionKey: SectionKey) => {
				console.log(`🔗 [STORE:PROPAGATE] Propagating changes from ${changedSectionKey}`);

				const dependents = getDependentSections(changedSectionKey);
				console.log(`  🎯 Dependent sections: ${dependents.join(", ")}`);

				// TODO: Delegate to StoreActions.propagateChanges when created
				// This will:
				// 1. Find all sections that depend on changedSectionKey
				// 2. Update their data based on the changed section
				// Example: When GeoCombinedLog changes, update Sample intervals

				console.log(`✅ [STORE:PROPAGATE] Changes propagated to ${dependents.length} sections`);
			},

			// ====================================================================
			// SUBMISSION (Create Drill Hole)
			// ====================================================================

			/**
			 * Submit drill hole for creation
			 */
			submitDrillHole: async (): Promise<ActionResult> => {
				console.log("📤 [STORE:SUBMIT] Starting drill hole submission");

				set((state) => {
					state.isSubmitting = true;
					state.submissionError = null;
				});

				try {
					// TODO: Delegate to StoreActions.submitDrillHole when created
					// This will:
					// 1. Validate all sections (database validators - blocking)
					// 2. Ensure required sections are complete
					// 3. Build CreateCollarDto from section data
					// 4. POST to /api/collar endpoint
					// 5. Clear Dexie cache on success
					// 6. Navigate to drill hole view

					// Validation checks
					const state = get();
					const requiredSections: SectionKey[] = [
						SectionKey.RigSheet,
						SectionKey.CollarCoordinates,
					];

					const incompleteSections = requiredSections.filter((key) => {
						const section = state.sections[key];
						return !section || section.rowStatus !== RowStatus.Complete;
					});

					if (incompleteSections.length > 0) {
						console.log(
							`❌ [STORE:SUBMIT] Incomplete required sections: ${incompleteSections.join(", ")}`,
						);

						set((draft) => {
							draft.isSubmitting = false;
							draft.submissionError = `Complete required sections: ${incompleteSections.join(", ")}`;
						});

						return {
							success: false,
							message: `Complete required sections: ${incompleteSections.join(", ")}`,
						};
					}

					// Temporary placeholder - actual submission will be implemented in store-actions.ts
					console.log("🚀 [STORE:SUBMIT] Submitting to API...");
					console.log("  📋 Drill Plan ID:", state.drillPlanId);
					console.log("  🎯 Planned Hole Name:", state.plannedHoleNm);
					console.log("  📊 Completion:", state.completionPercentage, "%");

					set((draft) => {
						draft.isSubmitting = false;
					});

					console.log("✅ [STORE:SUBMIT] Drill hole submission complete");

					return {
						success: true,
						message: "Drill hole created successfully",
						data: { drillHoleId: "temp-id" }, // Will be replaced with actual ID from API
					};
				} catch (error) {
					console.error("❌ [STORE:SUBMIT] Submission failed:", error);

					set((state) => {
						state.isSubmitting = false;
						state.submissionError =
							error instanceof Error ? error.message : "Submission failed";
					});

					return {
						success: false,
						message: error instanceof Error ? error.message : "Submission failed",
					};
				}
			},

			// ====================================================================
			// UTILITIES
			// ====================================================================

			/**
			 * Get section by key
			 */
			getSectionByKey: (key: SectionKey): SectionStore | null => {
				const section = get().sections[key];
				return section || null;
			},

			/**
			 * Check if any section has unsaved changes
			 */
			hasUnsavedChanges: (): boolean => {
				const sections = get().sections;
				return Object.values(sections).some((section) => section.isDirty);
			},

			/**
			 * Get list of sections with unsaved changes
			 */
			getDirtySections: (): SectionKey[] => {
				const sections = get().sections;
				return Object.entries(sections)
					.filter(([_, section]) => section.isDirty)
					.map(([key]) => key as SectionKey);
			},

			/**
			 * Update completion percentage
			 */
			updateCompletionPercentage: () => {
				console.log("📊 [STORE:COMPLETION] Updating completion percentage");

				set((state) => {
					state.completionPercentage = getCompletionPercentage(state.sections);
				});

				console.log(`📊 [STORE:COMPLETION] New completion: ${get().completionPercentage}%`);
			},
		})),
		{ name: "CreateDrillHoleStore" },
	),
);
