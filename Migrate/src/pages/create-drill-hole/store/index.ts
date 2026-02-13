/**
 * Store Barrel Export
 *
 * Central export point for store modules.
 * Follows Feature Blueprint Style Guide for import/export standards.
 */

// Main store
export { useCreateDrillHoleStore } from "./create-drillhole-store";
export type { CreateDrillHoleState } from "./create-drillhole-store";

// Section factory (100% reuse from drill-hole)
export { createSectionStore, createPassthroughValidator } from "./section-factory";
export type { SectionStore } from "./section-factory";

// Section configuration
export {
	SECTION_CONFIGS,
	createAllSections,
	getSectionConfig,
	getDependentSections,
	getSectionsByCategory,
	getCompletionPercentage,
} from "./section-config";
export type { SectionConfig } from "./section-config";

// Store utilities (100% reuse from drill-hole)
export * from "./store-utils";

// Store row operations (100% reuse from drill-hole)
export * from "./store-row-operations";

// Store actions
export * from "./store-actions";

// Store loaders
export * from "./store-loaders";

// Section mappers
export * from "./section-mappers";
