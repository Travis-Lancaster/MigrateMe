/**
 * Drill Hole Constants
 * Centralized export for enums and constant values
 */

export {
	canTransition,
	convertApiRowStatus,
	getAvailableTransitions,
	getRowStatusDisplay,
	RowStatusTransitions,
} from "./row-status";

export {
	type ArraySectionKey,
	type ObjectSectionKey,
	SectionKey,
} from "./section-keys";

/**
 * Section action types
 */
export type SectionAction
	= | "save"
	  | "submit"
	  | "reject"
	  | "review"
	  | "approve";

/**
 * Visual section status indicators
 */
export type SectionStatus
	= | "valid" // ✓ green - complete and valid
	  | "invalid" // ! orange - has validation errors
	  | "draft" // ○ gray - not started or in draft
	  | "dirty" // * blue - has unsaved changes
	  | "locked"; // 🔒 - approved, read-only
