/**
 * Create Drill Hole - Section Configuration
 *
 * Central location for all 24 section definitions and their dependencies.
 * Adapted from drill-hole module for the creation workflow.
 *
 * Sections:
 * - Setup: RigSheet, CollarCoordinates
 * - Geology: GeologyCombinedLog, ShearLog, StructureLog
 * - Geotech: 7 logging sections
 * - Sampling: Sample, Dispatch, LabResults, CycloneCleaning
 * - QAQC, SignOff (Collar), Summary
 *
 * Total: 24 sections (7 main + 17 sub-sections)
 */

import { RowStatus, SectionKey } from "#src/types/drillhole";
import { createPassthroughValidator, createSectionStore, type SectionStore } from "./section-factory";

/**
 * Section configuration interface
 * Makes it easy to see all sections at a glance
 */
export interface SectionConfig {
	/** Unique section key */
	key: SectionKey;
	/** Validation function for this section (legacy single validator) */
	validator?: any;
	/** Two-tier validation functions (database + save) */
	validators?: {
		database: any;
		save: any;
	};
	/** Initial/default data */
	initialData: any;
	/** Section keys this section depends on */
	dependencies: SectionKey[];
	/** Initial row status (defaults to Draft) */
	initialStatus?: RowStatus;
	/** Display name for UI */
	displayName?: string;
	/** Description for UI */
	description?: string;
}

/**
 * All section configurations for create-drill-hole module
 *
 * Defines 24 sections with validators, dependencies, and initial data.
 * Validators will be added as they are created in the validation/ directory.
 *
 * @example
 * ```typescript
 * {
 *   key: SectionKey.RigSheet,
 *   validators: {
 *     database: createRigSheetDatabaseValidator(),
 *     save: createRigSheetSaveValidator(),
 *   },
 *   initialData: createEmptyRigSheetData,
 *   dependencies: [],
 * }
 * ```
 */
export const SECTION_CONFIGS: SectionConfig[] = [
	// ========================================
	// SETUP SECTIONS (2)
	// ========================================
	{
		key: SectionKey.RigSheet,
		validator: createPassthroughValidator(), // TODO: Add rigSheetSchema when created
		// validators: {
		// 	database: createRigSheetDatabaseValidator(),
		// 	save: createRigSheetSaveValidator(),
		// },
		initialData: {}, // TODO: createEmptyRigSheetData when created
		dependencies: [],
		displayName: "Rig Setup",
		description: "Drill rig configuration and setup parameters",
	},
	{
		key: SectionKey.CollarCoordinates,
		validator: createPassthroughValidator(), // TODO: Add collarCoordinateSchema when created
		// validators: {
		// 	database: createCollarCoordinateDatabaseValidator(),
		// 	save: createCollarCoordinateSaveValidator(),
		// },
		initialData: {}, // TODO: createEmptyCollarCoordinateData when created
		dependencies: [],
		displayName: "Collar Coordinates",
		description: "Drill hole collar location coordinates",
	},

	// ========================================
	// GEOLOGY LOG SECTIONS (3)
	// ========================================
	{
		key: SectionKey.GeoCombinedLog,
		validator: createPassthroughValidator(), // TODO: Add geologyCombinedLogSchema when created
		// validators: {
		// 	database: createGeologyCombinedLogDatabaseValidator(),
		// 	save: createGeologyCombinedLogSaveValidator(),
		// },
		initialData: [], // Array section
		dependencies: [],
		displayName: "Geology Log",
		description: "Primary geological logging intervals",
	},
	{
		key: SectionKey.ShearLog,
		validator: createPassthroughValidator(), // TODO: Add shearLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Shear Log",
		description: "Shear zone logging",
	},
	{
		key: SectionKey.StructureLog,
		validator: createPassthroughValidator(), // TODO: Add structureLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Structure Log",
		description: "Structural geology logging",
	},

	// ========================================
	// GEOTECH SECTIONS (7)
	// ========================================
	{
		key: SectionKey.CoreRecoveryRunLog,
		validator: createPassthroughValidator(), // TODO: Add coreRecoveryRunLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Core Recovery Run",
		description: "Core recovery run logging",
	},
	{
		key: SectionKey.FractureCountLog,
		validator: createPassthroughValidator(), // TODO: Add fractureCountLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Fracture Count",
		description: "Fracture count logging",
	},
	{
		key: SectionKey.MagSusLog,
		validator: createPassthroughValidator(), // TODO: Add magSusLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Magnetic Susceptibility",
		description: "Magnetic susceptibility logging",
	},
	{
		key: SectionKey.RockMechanicLog,
		validator: createPassthroughValidator(), // TODO: Add rockMechanicLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Rock Mechanic",
		description: "Rock mechanic properties logging",
	},
	{
		key: SectionKey.RockQualityDesignationLog,
		validator: createPassthroughValidator(), // TODO: Add rqdLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Rock Quality Designation (RQD)",
		description: "RQD logging",
	},
	{
		key: SectionKey.SpecificGravityPtLog,
		validator: createPassthroughValidator(), // TODO: Add specificGravityLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Specific Gravity",
		description: "Specific gravity point logging",
	},
	{
		key: SectionKey.StructurePtLog,
		validator: createPassthroughValidator(), // TODO: Add structurePtLogSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Structure Point",
		description: "Structure point logging",
	},

	// ========================================
	// SAMPLING SECTIONS (4)
	// ========================================
	{
		key: SectionKey.Sample,
		validator: createPassthroughValidator(), // TODO: Add sampleSchema when created
		// validators: {
		// 	database: createSampleDatabaseValidator(),
		// 	save: createSampleSaveValidator(),
		// },
		initialData: [], // Array section
		dependencies: [SectionKey.GeoCombinedLog],
		displayName: "Samples",
		description: "Sample generation and management",
	},
	{
		key: SectionKey.Dispatch,
		validator: createPassthroughValidator(), // TODO: Add dispatchSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.Sample],
		displayName: "Dispatch",
		description: "Sample dispatch to laboratory",
	},
	{
		key: SectionKey.LabResults,
		validator: createPassthroughValidator(), // TODO: Add labResultsSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.Dispatch],
		displayName: "Lab Results",
		description: "Laboratory assay results",
	},
	{
		key: SectionKey.CycloneCleaning,
		validator: createPassthroughValidator(), // TODO: Add cycloneCleaningSchema when created
		initialData: [], // Array section
		dependencies: [SectionKey.Sample],
		displayName: "Cyclone Cleaning",
		description: "Cyclone cleaning records",
	},

	// ========================================
	// QAQC SECTION (1)
	// ========================================
	{
		key: SectionKey.Qaqc,
		validator: createPassthroughValidator(), // TODO: Add qaqcSchema when created
		initialData: {}, // Composite section
		dependencies: [SectionKey.Sample],
		displayName: "QAQC",
		description: "Quality assurance and quality control validation",
	},

	// ========================================
	// SIGNOFF SECTION (1 - Collar)
	// ========================================
	{
		key: SectionKey.Collar,
		validator: createPassthroughValidator(), // TODO: Add collarSchema when created
		// validators: {
		// 	database: createCollarDatabaseValidator(),
		// 	save: createCollarSaveValidator(),
		// },
		initialData: {}, // TODO: createEmptyCollarData when created
		dependencies: [
			SectionKey.RigSheet,
			SectionKey.CollarCoordinates,
			SectionKey.GeoCombinedLog,
		],
		displayName: "Sign Off (Collar)",
		description: "Final drill hole collar sign-off",
	},

	// ========================================
	// SUMMARY SECTION (1)
	// ========================================
	{
		key: "summary" as SectionKey, // TODO: Add to SectionKey enum if needed
		validator: createPassthroughValidator(),
		initialData: {}, // Read-only computed from all sections
		dependencies: [
			SectionKey.RigSheet,
			SectionKey.CollarCoordinates,
			SectionKey.GeoCombinedLog,
			SectionKey.Sample,
			SectionKey.Collar,
		],
		displayName: "Summary",
		description: "Drill hole creation summary and completion status",
	},

	// ========================================
	// DRILL PLAN REFERENCE (1)
	// ========================================
	{
		key: SectionKey.DrillPlan,
		validator: createPassthroughValidator(),
		initialData: {}, // Loaded from API, read-only
		dependencies: [],
		displayName: "Drill Plan",
		description: "Reference drill plan data (read-only)",
	},
];

/**
 * Creates all section stores from configuration
 *
 * Replaces repetitive section initialization code.
 * Called once when the store is initialized.
 *
 * @returns Record of all initialized section stores (24 sections)
 *
 * @example
 * ```typescript
 * const sections = createAllSections();
 * // sections.rigsheet, sections.geologycombinedlog, etc. are now available
 * ```
 */
export function createAllSections(): Record<string, any> {
	console.log("📂 [CONFIG:CREATE] Initializing all sections for create-drill-hole");

	const sections: Record<string, any> = {};

	for (const config of SECTION_CONFIGS) {
		console.log(`📝 [CONFIG:CREATE] Creating section: ${config.key} (${config.displayName})`);

		sections[config.key] = createSectionStore({
			sectionKey: config.key,
			validate: config.validator, // Legacy single-tier validator
			validators: config.validators, // Two-tier validators (database + save)
			initialData:
				typeof config.initialData === "function" ? config.initialData() : config.initialData,
			dependencies: config.dependencies,
			initialStatus: config.initialStatus || RowStatus.Draft,
		});
	}

	console.log(
		`✅ [CONFIG:CREATE] Initialized ${SECTION_CONFIGS.length} sections for create-drill-hole`,
	);
	return sections;
}

/**
 * Get section configuration by key
 *
 * @param key - The section key to find
 * @returns The section configuration or undefined if not found
 */
export function getSectionConfig(key: SectionKey | string): SectionConfig | undefined {
	return SECTION_CONFIGS.find((config) => config.key === key);
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
 * const dependents = getDependentSections(SectionKey.GeoCombinedLog);
 * // Returns [SectionKey.ShearLog, SectionKey.StructureLog, SectionKey.Sample, ...]
 * ```
 */
export function getDependentSections(key: SectionKey | string): Array<SectionKey | string> {
	return SECTION_CONFIGS.filter((config) => config.dependencies.includes(key as SectionKey)).map(
		(config) => config.key,
	);
}

/**
 * Get section configs by category
 *
 * Returns section configuration metadata for a given category.
 * This returns the static configs, not runtime store instances.
 *
 * @param category - The category to filter by
 * @returns Array of section configurations in that category
 */
export function getSectionsByCategory(
	category: "setup" | "drilling" | "survey" | "geology" | "geotech" | "sampling" | "summary",
): SectionConfig[] {
	const categoryMap: Record<string, Array<SectionKey | string>> = {
		setup: [SectionKey.RigSheet, SectionKey.CollarCoordinates],
		geology: [SectionKey.GeoCombinedLog, SectionKey.ShearLog, SectionKey.StructureLog],
		geotech: [
			SectionKey.CoreRecoveryRunLog,
			SectionKey.FractureCountLog,
			SectionKey.MagSusLog,
			SectionKey.RockMechanicLog,
			SectionKey.RockQualityDesignationLog,
			SectionKey.SpecificGravityPtLog,
			SectionKey.StructurePtLog,
		],
		sampling: [
			SectionKey.Sample,
			SectionKey.Dispatch,
			SectionKey.LabResults,
			SectionKey.CycloneCleaning,
		],
		other: [SectionKey.Qaqc, SectionKey.Collar, "summary", SectionKey.DrillPlan],
	};

	const keys = categoryMap[category] || [];
	return SECTION_CONFIGS.filter((config) => keys.includes(config.key));
}

/**
	* Get section stores by category
	*
	* Returns actual runtime section store instances for a given category.
	* Different from getSectionsByCategory which returns static configs.
	*
	* @param sections - Record of all section stores
	* @param category - Category to filter by
	* @returns Array of section stores in that category
	*
	* @example
	* ```typescript
	* const setupSections = getSectionStoresByCategory(store.sections, "setup");
	* const completedCount = setupSections.filter(s => s.isComplete).length;
	* ```
	*/
export function getSectionStoresByCategory(
	sections: Record<string, SectionStore<any>>,
	category: "setup" | "drilling" | "survey" | "geology" | "geotech" | "sampling" | "summary",
): SectionStore<any>[] {
	// Get config keys for this category
	const configs = getSectionsByCategory(category);
	
	// Map to actual store instances, filter out undefined
	return configs
		.map(config => sections[config.key])
		.filter((section): section is SectionStore<any> => section !== undefined);
}

/**
 * Get completion percentage based on section statuses
 *
 * Used for progress tracking in the UI.
 *
 * @param sections - The section stores
 * @returns Completion percentage (0-100)
 */
export function getCompletionPercentage(sections: Record<string, any>): number {
	const completableSections = SECTION_CONFIGS.filter(
		(config) =>
			config.key !== SectionKey.DrillPlan, // Exclude read-only sections
	);

	let completedCount = 0;
	for (const config of completableSections) {
		const section = sections[config.key];
		if (section && section.getRowStatus() === RowStatus.Complete) {
			completedCount++;
		}
	}

	const percentage = Math.round((completedCount / completableSections.length) * 100);
	console.log(
		`📊 [CONFIG:CREATE] Completion: ${completedCount}/${completableSections.length} sections (${percentage}%)`,
	);

	return percentage;
}
