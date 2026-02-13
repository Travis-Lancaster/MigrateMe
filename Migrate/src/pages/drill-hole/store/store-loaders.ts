/**
 * Store Loaders
 *
 * Handles loading and refreshing drill hole data from API/Dexie.
 * Extracted from drillhole-store.ts to reduce complexity and improve testability.
 *
 * Applies Single Responsibility Principle by isolating data loading logic.
 */

import type { Draft } from "immer";
import type { DrillHoleState } from "./drillhole-store";
import {
	getDrillHoleAggregate,
	loadDrillHole as loadDrillHoleFromService,
} from "#src/services/drillholeService";
import { isLoadConflictError } from "#src/types/errors";
import { useDrillHoleStore } from "./drillhole-store";
import { mapAllSections } from "./section-mappers";

/**
 * Load a drill hole aggregate from Dexie cache or API
 *
 * Implements offline-first pattern:
 * 1. Checks Dexie cache first
 * 2. Falls back to API if cache miss or forceRefresh=true
 * 3. Handles version conflicts with LoadConflictError
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param drillPlanId - Drill plan ID to load
 * @param forceRefresh - If true, bypasses cache and forces API fetch
 *
 * @throws {LoadConflictError} When local changes conflict with server versions
 *
 * @example
 * ```typescript
 * // Normal load (uses cache)
 * await loadDrillHole(set, get, 'abc-123');
 *
 * // Force fresh data from API
 * await loadDrillHole(set, get, 'abc-123', true);
 * ```
 */
export async function loadDrillHole(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	drillPlanId: string,
	forceRefresh = false,
): Promise<void> {
	console.log(`📂 [ROWVERSION] Store.loadDrillHole called: ${drillPlanId}${forceRefresh ? " (FORCE REFRESH)" : ""}`);
	const startTime = performance.now();

	// Check if we're already loading the same drill hole to prevent infinite loops
	const currentState = get();

	// Skip reload check if forceRefresh is true
	if (!forceRefresh && currentState.drillPlanId === drillPlanId && currentState.isLoaded) {
		console.log("⏭️ [ROWVERSION] Already loaded, skipping reload");
		return; // Already loaded, no need to reload
	}

	// Also check if we're already loading to prevent duplicate loading
	if (currentState.isLoading) {
		console.log("⏳ [ROWVERSION] Already loading, waiting for completion");
		return; // Already loading, wait for completion
	}

	set((state) => {
		state.isLoading = true;
		state.error = null;
	});

	try {
		// Load from service (Dexie → API fallback)
		// Pass forceRefresh to skip cache
		console.log("🔄 [ROWVERSION] Calling loadDrillHoleFromService...");
		const drillHoleData = await loadDrillHoleFromService(drillPlanId, forceRefresh);

		console.log("✅ [ROWVERSION] DrillHole data loaded from service:", {
			drillPlanId,
			dataSize: `${JSON.stringify(drillHoleData).length} bytes`,
		});

		set((state) => {
			// Set IDs
			state.drillPlanId = drillPlanId;

			// Map all sections from API data
			mapAllSections(state, drillHoleData);

			state.isLoaded = true;
			state.isLoading = false;
		});

		// Set isStale flags based on staleSections from Dexie
		console.log("🔍 [ROWVERSION] Reading staleSections from Dexie...");
		const aggregate = await getDrillHoleAggregate(drillPlanId);
		if (aggregate && aggregate.staleSections && aggregate.staleSections.length > 0) {
			console.log(`⚠️ [ROWVERSION] Found ${aggregate.staleSections.length} stale sections: ${aggregate.staleSections.join(", ")}`);
			set((state) => {
				aggregate.staleSections.forEach((sectionKey: string) => {
					const section = (state.sections as Record<string, any>)[sectionKey];
					if (section) {
						section.isStale = true;
						console.log(`🔴 [ROWVERSION] Section marked as stale in store: ${sectionKey}`);
					}
				});
			});
		}
		else {
			console.log("✅ [ROWVERSION] No stale sections found");
		}

		const duration = (performance.now() - startTime).toFixed(0);
		console.log(`✅ [ROWVERSION] Store.loadDrillHole completed in ${duration}ms`);
	}
	catch (error) {
		// Check if this is a LoadConflictError (version conflict with dirty local changes)
		if (isLoadConflictError(error)) {
			console.log("⚠️ [ROWVERSION] LoadConflictError caught - setting conflict state for modal");
			set((state) => {
				state.loadConflict = {
					visible: true,
					staleSections: error.staleSections,
					serverVersions: error.serverVersions,
				};
				state.isLoading = false;
				state.isLoaded = false;
			});
			// Don't throw - let UI show modal instead
			return;
		}

		// Other errors - set error state and throw
		set((state) => {
			state.error = error instanceof Error ? error.message : "Failed to load DrillHole";
			state.isLoading = false;
			state.isLoaded = false;
		});
		console.error("❌ [ROWVERSION] Store.loadDrillHole failed:", error);
		throw error;
	}
}

/**
 * Unload current drill hole and reset state
 *
 * Clears all section data and resets the store to initial state.
 *
 * @param set - Zustand set function
 *
 * @example
 * ```typescript
 * unloadDrillHole(set);
 * ```
 */
export function unloadDrillHole(set: (fn: (state: Draft<DrillHoleState>) => void) => void): void {
	console.log("📂 [UNLOAD] Unloading drill hole");

	set((state) => {
		state.drillHoleId = null;
		state.drillPlanId = null;
		state.isLoaded = false;
		state.error = null;

		// Reset all sections
		Object.values(state.sections).forEach((section) => {
			section.resetData();
		});
	});

	console.log("✅ [UNLOAD] Drill hole unloaded");
}

/**
 * Refresh a stale section from the server
 *
 * Discards local changes for that section and reloads from server.
 * Use this to resolve conflicts when server has newer data.
 *
 * @param get - Zustand get function
 * @param sectionKey - Section to refresh
 * @returns Action result with success status and message
 *
 * @example
 * ```typescript
 * const result = await refreshStaleSection(get, SectionKey.Collar);
 * if (result.success) {
 *   message.success('Section refreshed from server');
 * }
 * ```
 */
export async function refreshStaleSection(
	get: () => DrillHoleState,
	sectionKey: string,
): Promise<{ success: boolean, message: string }> {
	console.log(`🔄 [REFRESH 1/5] refreshStaleSection called for: ${sectionKey}`);

	try {
		const drillPlanId = get().drillPlanId;
		if (!drillPlanId) {
			console.log("❌ [REFRESH 2/5] No drill plan loaded");
			return {
				success: false,
				message: "No drill plan loaded",
			};
		}

		console.log(`🔄 [REFRESH 2/5] Drill plan ID: ${drillPlanId}`);
		console.log("🔄 [REFRESH 3/5] Calling loadDrillHole with forceRefresh=true");

		// Reload drill hole with force refresh (bypasses cache)
		// Note: This reloads the entire drill hole, not just the specific section
		// A future optimization could reload only the specific section
		await useDrillHoleStore.getState().loadDrillHole(drillPlanId, true);

		console.log("✅ [REFRESH 4/5] loadDrillHole completed");

		// Verify the section was updated
		const updatedSection = (get().sections as Record<string, any>)[sectionKey];
		console.log("✅ [REFRESH 5/5] Section verification after refresh:", {
			sectionKey,
			hasData: !!updatedSection.data,
			isArray: Array.isArray(updatedSection.data),
			dataCount: Array.isArray(updatedSection.data) ? updatedSection.data.length : "N/A",
			isDirty: updatedSection.isDirty,
			isStale: updatedSection.isStale,
		});

		return {
			success: true,
			message: "Section refreshed from server",
		};
	}
	catch (error) {
		console.error("❌ [REFRESH ERROR] Error refreshing stale section:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Refresh failed",
		};
	}
}
