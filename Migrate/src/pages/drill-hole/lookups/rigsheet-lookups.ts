/**
 * RigSheet Lookup Cache
 *
 * Module-level caching for lookup options to prevent
 * repeated expensive computations on every render.
 *
 * Follows the same pattern as collar-lookups.ts for consistency.
 */

import type { RigSheetLookups } from "../sections/types/rigsheet-types";
import { LookupResolver } from "#src/services/lookupResolver";

/**
 * Module-level cache for lookup options
 * Initialized once and reused across component renders
 */
let cachedLookups: RigSheetLookups | null = null;

/**
 * Get all RigSheet lookup options with caching
 *
 * First call initializes the cache, subsequent calls return cached data.
 * This prevents repeated LookupResolver calls on every render.
 *
 * @returns All lookup options for RigSheet section
 */
export function getRigSheetLookups(): RigSheetLookups {
	if (!cachedLookups) {
		console.log("🔄 Initializing RigSheet lookups cache...");

		cachedLookups = {
			organizations: LookupResolver.getLookupOptions("Organization", "Description", "Description"),
			drillingCompanies: LookupResolver.getFilteredLookupOptions("Company", "Code", "Description", "CompanyType", "DRILLING"),
			persons: LookupResolver.getLookupOptions("Person", "Code", "Description"),
			surveyReferences: LookupResolver.getLookupOptions("SurveyReference", "Code", "Description"),
		};

		console.log("✅ RigSheet lookups cache initialized", {
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
export function invalidateRigSheetLookupCache(): void {
	console.log("🗑️ Invalidating RigSheet lookups cache");
	cachedLookups = null;
}

/**
 * Get a specific lookup by key
 *
 * @param key - The lookup key to retrieve
 * @returns The lookup options array
 */
export function getRigSheetLookup(key: keyof RigSheetLookups) {
	const lookups = getRigSheetLookups();
	return lookups[key];
}

/**
 * Check if lookups are cached
 *
 * @returns true if cache is initialized
 */
export function isRigSheetLookupCached(): boolean {
	return cachedLookups !== null;
}
