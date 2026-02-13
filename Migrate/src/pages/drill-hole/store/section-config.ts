/**
 * Section Configuration
 *
 * Central location for all section definitions and their dependencies.
 * This makes it easy to add new sections or modify existing ones.
 *
 * Applies DRY principle by eliminating duplication in section initialization.
 */

import { RowStatus, SectionKey } from "#src/types/drillhole";
import { createCollarDatabaseValidator } from "../validation/collar-database-validator";
import { createCollarSaveValidator } from "../validation/collar-save-validator";
import { createEmptyCollarData } from "../validation/collar-schemas";
import { createEmptyLabDispatchData, labDispatchSchema } from "../validation/dispatch-schemas";
import { drillMethodArraySchema } from "../validation/drill-method-schemas";
import { createEmptyRigSheetData, rigSheetSchema } from "../validation/rigsheet-schemas";
// Import NEW master-detail Survey schema (Survey header + SurveyLog array)
import {
	createEmptySurveyWithLogs,
	surveyWithLogsSchema,
} from "../validation/survey-schemas";
import { createPassthroughValidator, createSectionStore, createZodValidator } from "./section-factory";

/**
 * Section configuration interface
 * Makes it easy to see all sections at a glance
 */
export interface SectionConfig {
	/** Unique section key */
	key: SectionKey
	/** Validation function for this section (legacy single validator) */
	validator?: any
	/** Two-tier validation functions (database + save) */
	validators?: {
		database: any
		save: any
	}
	/** Initial/default data */
	initialData: any
	/** Section keys this section depends on */
	dependencies: SectionKey[]
	/** Initial row status (defaults to Draft) */
	initialStatus?: RowStatus
}

/**
 * All section configurations
 *
 * Add new sections here. This replaces the repetitive section initialization
 * code that was previously in drillhole-store.ts.
 *
 * Currently defines 10 sections for the DrillHole module.
 *
 * @example
 * ```typescript
 * {
 *   key: SectionKey.NewSection,
 *   validator: createZodValidator(newSectionSchema),
 *   initialData: createEmptyNewSectionData,
 *   dependencies: [SectionKey.Collar],
 * }
 * ```
 */
export const SECTION_CONFIGS: SectionConfig[] = [
	{
		key: SectionKey.DrillPlan,
		validator: createPassthroughValidator(),
		initialData: {},
		dependencies: [],
	},
	{
		key: SectionKey.Collar,
		// Two-tier validation: database (hard/blocking) + save (soft/non-blocking)
		// Database validator checks required fields and referential integrity
		// Save validator provides business rule warnings that don't block saves
		validators: {
			database: createCollarDatabaseValidator(),
			save: createCollarSaveValidator(),
		},
		initialData: createEmptyCollarData,
		dependencies: [SectionKey.DrillPlan],
	},
	{
		key: SectionKey.CollarCoordinates,
		validator: createPassthroughValidator(),
		initialData: {},
		dependencies: [SectionKey.Collar],
	},
	{
		key: SectionKey.RigSheet,
		validator: createZodValidator(rigSheetSchema),
		initialData: createEmptyRigSheetData,
		dependencies: [SectionKey.DrillPlan, SectionKey.Collar],
	},
	{
		key: SectionKey.DrillMethod,
		validator: createZodValidator(drillMethodArraySchema),
		initialData: [],
		dependencies: [SectionKey.Collar],
	},
	{
		key: SectionKey.Survey,
		// Master-detail pattern: Survey header + SurveyLog array
		// Only 1 Survey can be active (ActiveInd=true) per Collar at a time
		validator: createZodValidator(surveyWithLogsSchema),
		initialData: createEmptySurveyWithLogs,
		dependencies: [SectionKey.Collar],
	},
	{
		key: SectionKey.QuickLog,
		validator: createPassthroughValidator(),
		initialData: {},
		dependencies: [SectionKey.Collar],
	},
	{
		key: SectionKey.GeoCombinedLog,
		validator: createPassthroughValidator(),
		initialData: {},
		dependencies: [SectionKey.Collar],
	},
	{
		key: SectionKey.Sample,
		validator: createPassthroughValidator(),
		initialData: {},
		dependencies: [SectionKey.Collar],
	},
	{
		key: SectionKey.Dispatch,
		validator: createZodValidator(labDispatchSchema),
		initialData: createEmptyLabDispatchData,
		dependencies: [SectionKey.Collar, SectionKey.Sample],
		initialStatus: RowStatus.Draft,
	},
];

/**
 * Creates all section stores from configuration
 *
 * This replaces the repetitive section initialization code that was
 * previously in drillhole-store.ts (lines 211-275).
 *
 * @returns Record of all initialized section stores
 *
 * @example
 * ```typescript
 * const sections = createAllSections();
 * // sections.collar, sections.drillmethod, etc. are now available
 * ```
 */
export function createAllSections(): Record<SectionKey, any> {
	const sections: Record<string, any> = {};

	for (const config of SECTION_CONFIGS) {
		sections[config.key] = createSectionStore({
			sectionKey: config.key,
			validate: config.validator, // Legacy single-tier validator
			validators: config.validators, // Two-tier validators (database + save)
			initialData:
				typeof config.initialData === "function"
					? config.initialData()
					: config.initialData,
			dependencies: config.dependencies,
			initialStatus: config.initialStatus,
		});
	}

	console.log(`✅ [CONFIG] Initialized ${SECTION_CONFIGS.length} sections`);
	return sections as Record<SectionKey, any>;
}

/**
 * Get section configuration by key
 *
 * @param key - The section key to find
 * @returns The section configuration or undefined if not found
 */
export function getSectionConfig(key: SectionKey): SectionConfig | undefined {
	return SECTION_CONFIGS.find(config => config.key === key);
}

/**
 * Get all sections that depend on a specific section
 *
 * Useful for cross-section updates and validation propagation.
 *
 * @param key - The section key to find dependents for
 * @returns Array of section keys that depend on the given section
 *
 * @example
 * ```typescript
 * const dependents = getDependentSections(SectionKey.Collar);
 * // Returns [SectionKey.CollarCoordinates, SectionKey.RigSheet, ...]
 * ```
 */
export function getDependentSections(key: SectionKey): SectionKey[] {
	return SECTION_CONFIGS.filter(config => config.dependencies.includes(key)).map(
		config => config.key,
	);
}
