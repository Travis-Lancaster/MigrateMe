/**
 * Drill Plan Lookup Cache
 *
 * Module-level caching for lookup options to prevent
 * repeated expensive computations on every render.
 *
 * Pattern: Following collar-lookups.ts architecture
 */

import { LookupResolver } from "#src/services/lookupResolver";

export interface DrillPlanLookups {
	organizations: Array<{ value: string, label: string }>
	drillPatterns: Array<{ value: string, label: string }>
	projects: Array<{ value: string, label: string }>
	prospects: Array<{ value: string, label: string }>
	targets: Array<{ value: string, label: string }>
	subTargets: Array<{ value: string, label: string }>
	pits: Array<{ value: string, label: string }>
	phases: Array<{ value: string, label: string }>
	zones: Array<{ value: string, label: string }>
	tenements: Array<{ value: string, label: string }>
	holeTypes: Array<{ value: string, label: string }>
	holeStatus: Array<{ value: string, label: string }>
	holePurposes: Array<{ value: string, label: string }>
	holePurposeDetails: Array<{ value: string, label: string }>
	drillTypes: Array<{ value: string, label: string }>
	grids: Array<{ value: string, label: string }>
	persons: Array<{ value: string, label: string }>
	qcInsertionRules: Array<{ value: string, label: string }>
}

/**
 * Module-level cache for lookup options
 * Initialized once and reused across component renders
 */
let cachedLookups: DrillPlanLookups | null = null;

/**
 * Get all drill plan lookup options with caching
 *
 * First call initializes the cache, subsequent calls return cached data.
 * This prevents repeated LookupResolver calls on every render.
 *
 * @returns All lookup options for Drill Plan
 */
export function getDrillPlanLookups(): DrillPlanLookups {
	if (!cachedLookups) {
		console.log("🔄 Initializing Drill Plan lookups cache...");

		cachedLookups = {
			organizations: LookupResolver.getLookupOptions("Organization", "Description", "Description"),
			drillPatterns: LookupResolver.getLookupOptions("DrillPattern", "DrillPattern", "Description"),
			projects: LookupResolver.getLookupOptions("Project", "Project", "Description"),
			prospects: LookupResolver.getLookupOptions("Prospect", "Prospect", "Description"),
			targets: LookupResolver.getLookupOptions("Target", "Target", "Description"),
			subTargets: LookupResolver.getLookupOptions("SubTarget", "SubTarget", "Description"),
			pits: LookupResolver.getLookupOptions("Pit", "Code", "Description"),
			phases: LookupResolver.getLookupOptions("Phase", "Code", "Description"),
			zones: LookupResolver.getLookupOptions("Zone", "Code", "Description"),
			tenements: LookupResolver.getLookupOptions("Tenement", "Code", "Description"),
			holeTypes: LookupResolver.getLookupOptions("HoleType", "Code", "Description"),
			holeStatus: LookupResolver.getLookupOptions("HoleStatus", "Code", "Description"),
			holePurposes: LookupResolver.getLookupOptions("HolePurpose", "Code", "Description"),
			holePurposeDetails: LookupResolver.getLookupOptions("HolePurposeDetail", "Code", "Description"),
			drillTypes: LookupResolver.getLookupOptions("DrillType", "Code", "Description"),
			grids: LookupResolver.getLookupOptions("Grid", "Code", "Description"),
			persons: LookupResolver.getLookupOptions("Person", "Code", "Description"),
			qcInsertionRules: LookupResolver.getLookupOptions("QCInsertionRule", "QCInsertionRuleId", "RuleName"),
		};

		console.log("✅ Drill Plan lookups cache initialized", {
			lookupKeys: Object.keys(cachedLookups),
			totalOptions: Object.values(cachedLookups).reduce((sum, arr) => sum + arr.length, 0),
		});
	}

	return cachedLookups;
}

/**
 * Invalidate the lookup cache
 *
 * Call this when lookup data changes (e.g., after admin updates)
 * to force a refresh on next access.
 */
export function invalidateDrillPlanLookupCache(): void {
	console.log("🗑️ Invalidating Drill Plan lookups cache");
	cachedLookups = null;
}

/**
 * Get a specific lookup by key
 *
 * @param key - The lookup key to retrieve
 * @returns The lookup options array
 */
export function getDrillPlanLookup(key: keyof DrillPlanLookups) {
	const lookups = getDrillPlanLookups();
	return lookups[key];
}

/**
 * Check if lookups are cached
 *
 * @returns true if cache is initialized
 */
export function isDrillPlanLookupCached(): boolean {
	return cachedLookups !== null;
}
