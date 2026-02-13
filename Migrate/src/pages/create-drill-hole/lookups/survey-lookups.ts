/**
 * Survey Lookup Utilities
 *
 * Cached lookup options for Survey/SurveyLog section.
 * Lookups are resolved once and cached for performance.
 *
 * Pattern: Module-level cache to prevent re-resolving on every render
 */

import { LookupResolver } from "#src/services/lookupResolver";

/**
 * Survey lookup options interface
 */
export interface SurveyLookupOptions {
	surveyMethods: Array<{ value: string, label: string }>
	surveyCompanies: Array<{ value: string, label: string }>
	surveyOperators: Array<{ value: string, label: string }>
	surveyInstruments: Array<{ value: string, label: string }>
	surveyReliabilities: Array<{ value: string, label: string }>
	grids: Array<{ value: string, label: string }>
}

/**
 * Module-level cache for lookup options
 * Prevents re-resolving lookups on every render
 */
let cachedLookups: SurveyLookupOptions | null = null;

/**
 * Get cached survey lookup options
 * Resolves lookups once and caches for subsequent calls
 *
 * @returns Cached survey lookup options
 *
 * @example
 * ```typescript
 * const lookupOptions = getSurveyLookups();
 *
 * <SheetFormField
 *   name="DownHoleSurveyMethod"
 *   type="autocomplete"
 *   options={lookupOptions.surveyMethods}
 * />
 * ```
 */
export function getSurveyLookups(): SurveyLookupOptions {
	// Return cached lookups if already resolved
	if (cachedLookups) {
		return cachedLookups;
	}

	// Resolve all lookups and cache
	cachedLookups = {
		// Down-hole survey methods (e.g., 'GYRO', 'MAG', 'EMS', 'ACID')
		surveyMethods: LookupResolver.getLookupOptions(
			"DownHoleSurveyMethod",
			"Code",
			"Description",
		),

		// Survey companies (companies with survey capability)
		// Note: Uses Company lookup table, filtering may be needed
		surveyCompanies: LookupResolver.getLookupOptions(
			"Company",
			"Code",
			"Description",
		),

		// Survey operators (persons who perform surveys)
		surveyOperators: LookupResolver.getLookupOptions(
			"Person",
			"Code",
			"Description",
		),

		// Survey instruments (e.g., specific tool/device models)
		surveyInstruments: LookupResolver.getLookupOptions(
			"Instrument",
			"Code",
			"Description",
		),

		// Survey reliability codes (quality/confidence indicators)
		surveyReliabilities: LookupResolver.getLookupOptions(
			"SurveyReliability",
			"Code",
			"Description",
		),

		// Grid coordinate systems
		grids: LookupResolver.getLookupOptions(
			"Grid",
			"Code",
			"Description",
		),
	};

	return cachedLookups;
}

/**
 * Clear cached lookups
 * Useful for testing or when lookups need to be refreshed
 */
export function clearSurveyLookupsCache(): void {
	cachedLookups = null;
}

/**
 * Get survey method display label by code
 *
 * @param code - Survey method code
 * @returns Display label or code if not found
 */
export function getSurveyMethodLabel(code: string): string {
	const lookups = getSurveyLookups();
	const method = lookups.surveyMethods.find(m => m.value === code);
	return method?.label || code;
}

/**
 * Get survey company display label by code
 *
 * @param code - Company code
 * @returns Display label or code if not found
 */
export function getSurveyCompanyLabel(code: string): string {
	const lookups = getSurveyLookups();
	const company = lookups.surveyCompanies.find(c => c.value === code);
	return company?.label || code;
}

/**
 * Get survey operator display label by code
 *
 * @param code - Person code
 * @returns Display label or code if not found
 */
export function getSurveyOperatorLabel(code: string): string {
	const lookups = getSurveyLookups();
	const operator = lookups.surveyOperators.find(o => o.value === code);
	return operator?.label || code;
}
