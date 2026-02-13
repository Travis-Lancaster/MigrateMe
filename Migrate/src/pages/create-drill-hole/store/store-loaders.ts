/**
 * Create Drill Hole - Store Loaders (Data Entry Module)
 *
 * Handles initialization and draft loading for the DATA ENTRY workflow:
 * - initializeDrillHole: Load EXISTING drill hole and populate sections
 * - loadDraftFromCache: Restore work-in-progress from Dexie
 * - resetDraft: Clear draft cache
 *
 * DATA ENTRY WORKFLOW:
 * - Loads EXISTING drill hole (not drill plan)
 * - Sections already have data (not templates/defaults)
 * - User enters/edits data section by section
 * - Draft cache for resume-work capability
 *
 * CRITICAL: Drill holes already exist weeks before this code runs.
 * This module is for data entry into existing records, NOT creation.
 *
 * Adapted from drill-hole/store/store-loaders.ts
 */

import type { Draft } from "immer";
import type { CreateDrillHoleState } from "./create-drillhole-store";
import { db } from "#src/lib/db/dexie";
import { loadDrillHoleForEntry } from "#src/services/createDrillholeService";
import { initializeSectionsFromDrillHole } from "./section-mappers";

// ============================================================================
// INITIALIZE DRILL HOLE (Load Existing for Data Entry)
// ============================================================================

/**
 * Initialize drill hole for data entry
 *
 * This is the entry point for data entry workflow:
 * 1. Loads EXISTING drill hole data from API (not drill plan)
 * 2. Checks for work-in-progress draft in Dexie cache
 * 3. Populates sections with existing data (not templates)
 * 4. Sets up state for data entry workflow
 *
 * CRITICAL: The drill hole already exists (created weeks ago with DrillPlan).
 * HoleId = CollarId = DrillPlanId (same GUID).
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param drillHoleId - The drill hole ID (same as CollarId and DrillPlanId)
 *
 * @example
 * ```typescript
 * // Load existing drill hole for data entry
 * await initializeDrillHole(set, get, 'hole-123');
 * ```
 */
export async function initializeDrillHole(
	set: (fn: (state: Draft<CreateDrillHoleState>) => void) => void,
	get: () => CreateDrillHoleState,
	drillHoleId: string,
): Promise<void> {
	console.log("📂 [LOADERS:INIT] Loading existing drill hole for data entry");
	console.log("  🎯 Drill Hole ID (= CollarId = DrillPlanId):", drillHoleId);

	const startTime = performance.now();

	// Check if already initializing
	const currentState = get();
	if (currentState.isLoading) {
		console.log("⏳ [LOADERS:INIT] Already initializing, skipping");
		return;
	}

	set((state) => {
		state.isLoading = true;
		state.error = null;
	});

	try {
		// Step 1: Load existing drill hole from API
		console.log("📥 [LOADERS:INIT] Fetching existing drill hole from API...");
		const drillHole = await loadDrillHoleForEntry(drillHoleId);

		console.log("✅ [LOADERS:INIT] Drill hole loaded:", {
			drillHoleId,
			holeNm: drillHole.HoleNm,
			collarId: drillHole.Collar?.CollarId,
			organization: drillHole.Organization,
		});

		// Step 2: Initialize sections with existing drill hole data
		console.log("📊 [LOADERS:INIT] Populating sections from existing drill hole...");

		set((state) => {
			// Set identifiers (HoleId = CollarId = DrillPlanId, all same GUID)
			state.drillHoleId = drillHoleId;
			state.collarId = drillHole.Collar?.CollarId || drillHoleId;
			state.drillPlanId = drillHole.DrillPlan?.DrillPlanId || drillHoleId;
			state.plannedHoleNm = drillHole.HoleNm || "";
			state.HoleNm = drillHole.HoleNm || "";
			state.Organization = drillHole.Organization || "";

			// Map existing drill hole data to sections (NOT empty templates)
			initializeSectionsFromDrillHole(state, drillHole);

			state.isLoaded = true;
			state.isLoading = false;
		});

		const duration = (performance.now() - startTime).toFixed(0);
		console.log(`✅ [LOADERS:INIT] Data entry initialization complete in ${duration}ms`);
		console.log("  📂 Sections populated with existing data");
		console.log("  🎯 Ready for data entry");
	} catch (error) {
		console.error("❌ [LOADERS:INIT] Failed to load drill hole for data entry:", error);

		set((state) => {
			state.error = error instanceof Error ? error.message : "Failed to load drill hole";
			state.isLoading = false;
			state.isLoaded = false;
		});

		throw error;
	}
}

// ============================================================================
// LOAD DRAFT FROM CACHE
// ============================================================================

/**
 * Load work-in-progress draft from Dexie cache
 *
 * Restores previously saved draft data to resume work.
 * This allows users to continue where they left off.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 *
 * @example
 * ```typescript
 * await loadDraftFromCache(set, get, 'plan-123', 'DH001');
 * ```
 */
export async function loadDraftFromCache(
	set: (fn: (state: Draft<CreateDrillHoleState>) => void) => void,
	get: () => CreateDrillHoleState,
	drillPlanId: string,
	plannedHoleNm: string,
): Promise<void> {
	console.log("📂 [LOADERS:DRAFT] Loading draft from cache");
	console.log("  📋 Drill Plan ID:", drillPlanId);
	console.log("  🎯 Planned Hole Name:", plannedHoleNm);

	try {
		// TODO: Load from Dexie createDrillHoleDrafts table when it exists
		// const draftRecords = await db.createDrillHoleDrafts
		//   .where({ drillPlanId, plannedHoleNm })
		//   .toArray();

		// Temporary placeholder
		const draftRecords: any[] = [];

		if (draftRecords.length === 0) {
			console.log("ℹ️  [LOADERS:DRAFT] No draft records found");
			return;
		}

		console.log(`📦 [LOADERS:DRAFT] Found ${draftRecords.length} draft sections`);

		set((state) => {
			state.drillPlanId = drillPlanId;
			state.plannedHoleNm = plannedHoleNm;

			// Restore each section from draft
			for (const draft of draftRecords) {
				const section = state.sections[draft.sectionKey as keyof typeof state.sections];
				if (section) {
					console.log(`📝 [LOADERS:DRAFT] Restoring section: ${draft.sectionKey}`);
					section.data = draft.data;
					section.isDirty = false; // Draft is saved, not dirty
					section.metadata = draft.metadata || {};

					// Restore section status
					if (draft.metadata?.RowStatus) {
						section.setRowStatus(draft.metadata.RowStatus);
					}
				}
			}

			// Recalculate completion percentage
			const completedSections = Object.entries(state.sections)
				.filter(([_, section]) => section.getRowStatus() === 4) // RowStatus.Complete = 4
				.map(([key, _]) => key as any);

			state.sectionsCompleted = completedSections;
			// state.completionPercentage = getCompletionPercentage(state.sections); // TODO: Import helper

			state.isLoaded = true;
			state.isLoading = false;
		});

		console.log("✅ [LOADERS:DRAFT] Draft loaded successfully");
		console.log(`  📊 Completion: ${get().completionPercentage}%`);
		console.log(`  ✅ Completed sections: ${get().sectionsCompleted.length}`);
	} catch (error) {
		console.error("❌ [LOADERS:DRAFT] Failed to load draft:", error);
		throw error;
	}
}

// ============================================================================
// CHECK FOR EXISTING DRAFT
// ============================================================================

/**
 * Check if a draft exists for this drill plan and hole name
 *
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 * @returns True if draft exists, false otherwise
 */
async function checkForExistingDraft(
	drillPlanId: string,
	plannedHoleNm: string,
): Promise<boolean> {
	console.log("🔍 [LOADERS:CHECK] Checking for existing draft");

	try {
		// TODO: Query Dexie createDrillHoleDrafts table when it exists
		// const count = await db.createDrillHoleDrafts
		//   .where({ drillPlanId, plannedHoleNm })
		//   .count();

		// Temporary placeholder
		const count = 0;

		const exists = count > 0;
		console.log(`${exists ? "✅" : "ℹ️"} [LOADERS:CHECK] Draft ${exists ? "exists" : "does not exist"}`);

		return exists;
	} catch (error) {
		console.error("❌ [LOADERS:CHECK] Error checking for draft:", error);
		return false; // Assume no draft on error
	}
}

// ============================================================================
// RESET DRAFT
// ============================================================================

/**
 * Clear draft cache for a drill hole
 *
 * Removes all saved draft data from Dexie.
 * Use this after successful submission or when discarding work.
 *
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 *
 * @example
 * ```typescript
 * await resetDraft('plan-123', 'DH001');
 * ```
 */
export async function resetDraft(drillPlanId: string, plannedHoleNm: string): Promise<void> {
	console.log("🗑️  [LOADERS:RESET] Clearing draft cache");
	console.log("  📋 Drill Plan ID:", drillPlanId);
	console.log("  🎯 Planned Hole Name:", plannedHoleNm);

	try {
		// TODO: Delete from Dexie createDrillHoleDrafts table when it exists
		// const deleted = await db.createDrillHoleDrafts
		//   .where({ drillPlanId, plannedHoleNm })
		//   .delete();

		// Temporary placeholder
		const deleted = 0;

		console.log(`✅ [LOADERS:RESET] Cleared ${deleted} draft records`);
	} catch (error) {
		console.error("❌ [LOADERS:RESET] Error clearing draft:", error);
		throw error;
	}
}

// ============================================================================
// GET DRAFT SUMMARY
// ============================================================================

/**
 * Get summary information about a draft
 *
 * Returns metadata about draft without loading full data.
 * Useful for showing draft list or resume confirmation.
 *
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 * @returns Draft summary or null if no draft exists
 *
 * @example
 * ```typescript
 * const summary = await getDraftSummary('plan-123', 'DH001');
 * if (summary) {
 *   console.log(`Last modified: ${summary.lastModified}`);
 *   console.log(`Completion: ${summary.completionPercentage}%`);
 * }
 * ```
 */
export async function getDraftSummary(
	drillPlanId: string,
	plannedHoleNm: string,
): Promise<{
	drillPlanId: string;
	plannedHoleNm: string;
	lastModified: Date;
	sectionsWithData: string[];
	completionPercentage: number;
} | null> {
	console.log("📊 [LOADERS:SUMMARY] Getting draft summary");

	try {
		// TODO: Query Dexie createDrillHoleDrafts table when it exists
		// const drafts = await db.createDrillHoleDrafts
		//   .where({ drillPlanId, plannedHoleNm })
		//   .toArray();

		// Temporary placeholder
		const drafts: any[] = [];

		if (drafts.length === 0) {
			console.log("ℹ️  [LOADERS:SUMMARY] No draft found");
			return null;
		}

		// Find most recent modification
		const lastModified = drafts.reduce(
			(latest, draft) =>
				draft.lastModified > latest ? draft.lastModified : latest,
			new Date(0),
		);

		// Get sections with data
		const sectionsWithData = drafts.map((d) => d.sectionKey);

		// Calculate completion (simple: sections with data / total sections)
		const totalSections = 24; // From section-config.ts
		const completionPercentage = Math.round((sectionsWithData.length / totalSections) * 100);

		const summary = {
			drillPlanId,
			plannedHoleNm,
			lastModified,
			sectionsWithData,
			completionPercentage,
		};

		console.log("✅ [LOADERS:SUMMARY] Draft summary:", summary);
		return summary;
	} catch (error) {
		console.error("❌ [LOADERS:SUMMARY] Error getting draft summary:", error);
		return null;
	}
}

// ============================================================================
// LIST DRAFTS
// ============================================================================

/**
 * List all drafts for a user
 *
 * Returns summary of all in-progress drill holes.
 * Useful for "Resume Work" UI.
 *
 * @returns Array of draft summaries
 *
 * @example
 * ```typescript
 * const drafts = await listDrafts();
 * drafts.forEach(draft => {
 *   console.log(`${draft.plannedHoleNm}: ${draft.completionPercentage}% complete`);
 * });
 * ```
 */
export async function listDrafts(): Promise<
	Array<{
		drillPlanId: string;
		plannedHoleNm: string;
		lastModified: Date;
		completionPercentage: number;
	}>
> {
	console.log("📋 [LOADERS:LIST] Listing all drafts");

	try {
		// TODO: Query Dexie createDrillHoleDrafts table when it exists
		// Group by drillPlanId + plannedHoleNm and get summary for each

		// Temporary placeholder
		const drafts: any[] = [];

		console.log(`✅ [LOADERS:LIST] Found ${drafts.length} drafts`);
		return drafts;
	} catch (error) {
		console.error("❌ [LOADERS:LIST] Error listing drafts:", error);
		return [];
	}
}
