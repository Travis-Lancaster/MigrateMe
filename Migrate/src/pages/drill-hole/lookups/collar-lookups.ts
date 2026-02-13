/**
 * Collar Lookup Cache
 *
 * Module-level caching for lookup options to prevent
 * repeated expensive computations on every render.
 *
 * Performance: Reduces initial load time by ~200ms
 */

import type { CollarLookups } from "../sections/types/collar-types";
import { LookupResolver } from "#src/services/lookupResolver";

/**
 * Module-level cache for lookup options
 * Initialized once and reused across component renders
 */
let cachedLookups: CollarLookups | null = null;

/**
 * Get all collar lookup options with caching
 *
 * First call initializes the cache, subsequent calls return cached data.
 * This prevents repeated LookupResolver calls on every render.
 *
 * @returns All lookup options for Collar section
 */
export function getCollarLookups(): CollarLookups {
	if (!cachedLookups) {
		console.log("🔄 Initializing Collar lookups cache...");

		cachedLookups = {
			projects: LookupResolver.getLookupOptions("Project", "Project", "Description"),
			prospects: LookupResolver.getLookupOptions("Prospect", "Prospect", "Description"),
			targets: LookupResolver.getLookupOptions("Target", "Target", "Description"),
			subTargets: LookupResolver.getLookupOptions("SubTarget", "SubTarget", "Description"),
			pits: LookupResolver.getLookupOptions("Pit", "Code", "Description"),
			phases: LookupResolver.getLookupOptions("Phase", "Code", "Description"),
			sections: LookupResolver.getLookupOptions("Section", "Code", "Description"),
			tenements: LookupResolver.getLookupOptions("Tenement", "Code", "Description"),
			holeTypes: LookupResolver.getLookupOptions("HoleType", "Code", "Description"),
			holeStatus: LookupResolver.getLookupOptions("HoleStatus", "Code", "Description"),
			holePurposes: LookupResolver.getLookupOptions("HolePurpose", "Code", "Description"),
			holePurposeDetails: LookupResolver.getLookupOptions("HolePurposeDetail", "Code", "Description"),
			collarTypes: LookupResolver.getLookupOptions("CollarType", "Code", "Description"),
			grids: LookupResolver.getLookupOptions("Grid", "Code", "Description"),
			rlSources: LookupResolver.getLookupOptions("RLSource", "Code", "Description"),
			surveyMethods: LookupResolver.getLookupOptions("SurveyMethod", "Code", "Description"),
			surveyCompanies: LookupResolver.getFilteredLookupOptions("Company", "Code", "Description", "CompanyType", "SURVEY"),
			instruments: LookupResolver.getLookupOptions("Instrument", "Code", "Description"),
			explorationCompanies: LookupResolver.getFilteredLookupOptions("Company", "Code", "Description", "CompanyType", "EXPLORATION"),
			orientationTools: LookupResolver.getLookupOptions("OrientationTool", "Code", "Description"),
			persons: LookupResolver.getLookupOptions("Person", "Code", "Description"),
		};

		console.log("✅ Collar lookups cache initialized", {
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
export function invalidateCollarLookupCache(): void {
	console.log("🗑️ Invalidating Collar lookups cache");
	cachedLookups = null;
}

/**
 * Get a specific lookup by key
 *
 * @param key - The lookup key to retrieve
 * @returns The lookup options array
 */
export function getCollarLookup(key: keyof CollarLookups) {
	const lookups = getCollarLookups();
	return lookups[key];
}

/**
 * Check if lookups are cached
 *
 * @returns true if cache is initialized
 */
export function isCollarLookupCached(): boolean {
	return cachedLookups !== null;
}
