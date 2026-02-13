/**
 * Drill Hole Data Hook - Cache-Aside Pattern
 *
 * Provides reactive access to drill hole data via useLiveQuery.
 * Data is stored in Dexie and automatically updates when changed.
 *
 * Pattern:
 * 1. useLiveQuery watches Dexie (instant UI updates)
 * 2. useEffect ensures cache is populated (background fetch)
 * 3. dexie-syncable automatically syncs changes to API
 *
 * This hook does NOT use Zustand - data comes directly from Dexie.
 *
 * Usage:
 *   const { collar, rigSheet, drillMethods } = useDrillHoleData(drillHoleId);
 */

import { collarService } from "#src/data/domain/collar/collar.service.js";

import { collarRepo, db } from "#src/data/index.js";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";

/**
 * Get all drill hole data for a specific drill hole
 * Uses LiveQuery for automatic reactivity with cache-aside pattern
 */
export function useDrillHoleData(drillHoleId: string | undefined) {
	// ============================================
	// 1. THE OBSERVER: Watch Dexie for changes
	// ============================================
	// This is reactive - automatically re-runs when IndexedDB changes
	// Returns cached data instantly (no API call)
	const collar = useLiveQuery(
		async () => {
			try {
				if (!drillHoleId) {
					console.log("[useDrillHoleData] 🔍 No drillHoleId provided");
					return undefined;
				}

				console.log("[useDrillHoleData] 🔍 Querying Dexie for collar:", { drillHoleId });
				console.log("[useDrillHoleData] 🔍 db.DrillHole_Collar exists:", !!db.DrillHole_Collar);

				const result = await collarRepo.getById(drillHoleId);

				console.log("[useDrillHoleData] ✅ Dexie query complete:", {
					Redox: result?.Redox,
					drillHoleId,
					found: !!result,
					keys: result ? Object.keys(result).length : 0,
					firstFewKeys: result ? Object.keys(result).slice(0, 5) : [],
				});

				return result;
			}
			catch (error) {
				console.error("[useDrillHoleData] ❌ Error querying Dexie:", error);
				return undefined;
			}
		},
		[drillHoleId],
	);

	// ============================================
	// 2. THE FETCHER: Ensure cache is populated
	// ============================================
	// This runs in background, doesn't block UI
	// Only fetches if cache is empty
	useEffect(() => {
		if (!drillHoleId)
			return;

		const ensureCollarData = async () => {
			try {
				// This method handles:
				// - Cache check
				// - API fetch if needed
				// - Cache update
				// - Offline fallback
				await collarService.fetchById(drillHoleId);

				// No need to do anything after this!
				// If data was fetched and cached, useLiveQuery above
				// will automatically detect the change and re-render
			}
			catch (error) {
				console.error("[useDrillHoleData] ❌ Failed to ensure data", {
					drillHoleId,
					error,
				});
				// Don't throw - useLiveQuery will return cached data (if any)
				// UI should show cached data + error banner
			}
		};

		ensureCollarData();
	}, [drillHoleId]);

	// Drill methods (array)
	const drillMethods = useLiveQuery(
		async () => {
			if (!drillHoleId)
				return [];
			return await db.DrillHole_DrillMethod
				.where("CollarId")
				.equals(drillHoleId)
				.and(dm => dm.ActiveInd === true)
				.toArray();
		},
		[drillHoleId],
	);

	// Surveys (array)
	const surveys = useLiveQuery(
		async () => {
			if (!drillHoleId)
				return [];
			return await db.DrillHole_Survey
				.where("CollarId")
				.equals(drillHoleId)
				.and(s => s.ActiveInd === true)
				.toArray();
		},
		[drillHoleId],
	);

	// Geology combined logs (array)
	const geologyCombinedLogs = useLiveQuery(
		async () => {
			if (!drillHoleId)
				return [];
			return await db.Geology_GeologyCombinedLog
				.where("CollarId")
				.equals(drillHoleId)
				.and(g => g.ActiveInd === true)
				.sortBy("DepthFrom");
		},
		[drillHoleId],
	);

	// Samples (array)
	const samples = useLiveQuery(
		async () => {
			if (!drillHoleId)
				return [];
			return await db.Sample
				.where("CollarId")
				.equals(drillHoleId)
				.and(s => s.ActiveInd === true)
				.toArray();
		},
		[drillHoleId],
	);

	// Core recovery run logs (array)
	const coreRecoveryRunLogs = useLiveQuery(
		async () => {
			if (!drillHoleId)
				return [];
			return await db.Geotech_CoreRecoveryRunLog
				.where("CollarId")
				.equals(drillHoleId)
				.and(c => c.ActiveInd === true)
				.toArray();
		},
		[drillHoleId],
	);

	// Loading state - true if any query is still loading
	const isLoading
		= collar === undefined
		|| drillMethods === undefined
		|| surveys === undefined
		|| geologyCombinedLogs === undefined
		|| samples === undefined
		|| coreRecoveryRunLogs === undefined;

	return {
		// Data (reactive from Dexie)
		collar,
		drillMethods,
		surveys,
		geologyCombinedLogs,
		samples,
		coreRecoveryRunLogs,

		// State
		isLoading,
		hasData: !!collar,
	};
}

/**
 * Get summary counts for a drill hole
 * Useful for master grid display
 */
export function useDrillHoleCounts(drillHoleId: string | undefined) {
	const counts = useLiveQuery(
		async () => {
			if (!drillHoleId)
				return null;

			const [
				drillMethodCount,
				surveyCount,
				geologyCount,
				sampleCount,
				coreRecoveryCount,
			] = await Promise.all([
				db.DrillHole_DrillMethod.where("CollarId").equals(drillHoleId).count(),
				db.DrillHole_Survey.where("CollarId").equals(drillHoleId).count(),
				db.Geology_GeologyCombinedLog.where("CollarId").equals(drillHoleId).count(),
				db.Sample.where("CollarId").equals(drillHoleId).count(),
				db.Geotech_CoreRecoveryRunLog.where("CollarId").equals(drillHoleId).count(),
			]);

			return {
				drillMethodCount,
				surveyCount,
				geologyCount,
				sampleCount,
				coreRecoveryCount,
				totalRows: drillMethodCount + surveyCount + geologyCount + sampleCount + coreRecoveryCount,
			};
		},
		[drillHoleId],
	);

	return counts;
}
