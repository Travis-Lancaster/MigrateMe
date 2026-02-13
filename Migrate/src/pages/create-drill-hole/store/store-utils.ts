/**
 * Store Utilities
 *
 * Shared helper functions used across store modules.
 * Single source of truth for ID mapping, metadata, and temp ID generation.
 *
 * This module eliminates duplication across:
 * - drillhole-store.ts
 * - store-row-operations.ts
 * - useGridSection.ts
 */

import type { ArraySectionKey, RowMetadata } from "#src/lib/db/dexie";

import { DrillHoleState } from "#src/pages/drill-hole/store/drillhole-store.js";

// import type { DrillHoleState } from "./drillhole-store";

/**
 * Map ArraySectionKey (from Dexie) to store section key
 * Handles 'surveylog' → 'survey' mapping
 *
 * @param sectionKey - Array section key from Dexie
 * @returns Corresponding key in DrillHoleState['sections']
 *
 * @example
 * ```typescript
 * mapToStoreSectionKey('surveylog') // Returns 'survey'
 * mapToStoreSectionKey('drillmethod') // Returns 'drillmethod'
 * ```
 */
export function mapToStoreSectionKey(
	sectionKey: ArraySectionKey,
): keyof DrillHoleState["sections"] {
	const keyMap: Record<ArraySectionKey, keyof DrillHoleState["sections"]> = {
		drillmethod: "drillmethod",
		surveylog: "survey", // Map surveylog to survey
		geocombined: "geocombined",
		sample: "sample",
	};
	return keyMap[sectionKey];
}

/**
 * Get ID field name for array section
 * Handles both store keys ('survey') and Dexie keys ('surveylog')
 *
 * @param sectionKey - Section key (can be store or Dexie format)
 * @returns Name of the ID field for that section
 *
 * @example
 * ```typescript
 * getIdField('drillmethod') // Returns 'DrillMethodId'
 * getIdField('survey') // Returns 'SurveyLogId'
 * getIdField('surveylog') // Returns 'SurveyLogId'
 * ```
 */
export function getIdField(sectionKey: ArraySectionKey | string): string {
	const fieldMap: Record<string, string> = {
		drillmethod: "DrillMethodId",
		survey: "SurveyLogId",
		surveylog: "SurveyLogId",
		geocombined: "GeologyCombinedLogId",
		sample: "SampleId",
	};
	return fieldMap[sectionKey] || "id";
}

/**
 * Generate temporary ID for new rows
 *
 * Creates a unique identifier using timestamp and random string.
 * Format: temp_[timestamp]_[random9chars]
 *
 * @returns Unique temporary ID string
 *
 * @example
 * ```typescript
 * generateTempId() // Returns 'temp_1706345678901_a7b3c9d2e'
 * ```
 */
export function generateTempId(): string {
	return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Create empty row metadata with default values
 *
 * Returns a fresh RowMetadata object with all flags set to false.
 * Used when initializing new row tracking.
 *
 * @returns Empty RowMetadata object
 *
 * @example
 * ```typescript
 * const metadata = createEmptyMetadata();
 * // Returns: { isDirty: false, isNew: false, isDeleted: false, isStale: false }
 * ```
 */
export function createEmptyMetadata(): RowMetadata {
	return {
		isDirty: false,
		isNew: false,
		isDeleted: false,
		isStale: false,
	};
}
