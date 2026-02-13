/**
 * Drill Hole Types
 * Core TypeScript types and interfaces for the drill-hole module
 */

// Re-export constants for convenience
export {
	type ArraySectionKey,
	type ObjectSectionKey,
	type SectionAction,
	SectionKey,
	type SectionStatus,
} from "../constants";

// Metadata types
export type {
	StandardRowMetadata,
} from "./metadata";

export {
	createEmptyMetadata,
	isMetadataValid,
} from "./metadata";

// Section types
export type {
	ActionResult,
	DrillHoleSection,
	ValidationError,
	ValidationResult,
} from "./section";

// Storage types
export type {
	DrillHoleSectionData,
	SectionOutboxItem,
	SectionValidationData,
} from "./storage";
