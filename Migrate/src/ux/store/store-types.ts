/**
 * Drill Hole Store Type Definitions
 *
 * Shared types for the drill hole store used across hooks.
 * Prevents duplicate interface definitions and ensures type consistency.
 */

import type { ActionResult, DrillHoleSection, SectionKey, ValidationResult } from "../features/drill-hole";

// import {
//   DrillHoleSection,
//   SectionKey,
//   ActionResult,
//   ValidationResult
// } from '#src/types/drillhole';

/**
 * Drill Hole Store State Interface
 *
 * Defines the shape of the Zustand store for drill hole data management.
 * Use this interface when accessing the store in hooks.
 *
 * @example
 * ```typescript
 * import { DrillHoleStoreState } from '../store/store-types';
 *
 * const section = useDrillHoleStore((state: DrillHoleStoreState) => state.sections.rigsheet);
 * ```
 */
export interface DrillHoleStoreState {
	/** Section data keyed by SectionKey enum */
	sections: {
		[key: string]: DrillHoleSection<any, ValidationResult>
		rigsheet: DrillHoleSection<any, ValidationResult>
		collar: DrillHoleSection<any, ValidationResult>
		sample: DrillHoleSection<any, ValidationResult>
		survey: DrillHoleSection<any, ValidationResult>
	}

	/** Current drill hole ID */
	drillHoleId?: string

	/** Current organization */
	Organization?: string

	// Section data operations
	/** Update section data and mark as dirty */
	updateSectionData: <T>(key: SectionKey, data: T) => void

	// Section lifecycle operations
	/** Save section to Dexie */
	saveSection: (key: SectionKey) => Promise<ActionResult>

	/** Submit section (transition to Complete) */
	submitSection: (key: SectionKey) => Promise<ActionResult>

	/** Reject section (transition to Rejected) */
	rejectSection: (key: SectionKey) => Promise<ActionResult>

	/** Mark section as completed */
	completedSection?: (key: SectionKey) => Promise<ActionResult>

	/** Submit for review */
	reviewSection?: (key: SectionKey) => Promise<ActionResult>

	/** Approve section */
	approveSection?: (key: SectionKey) => Promise<ActionResult>

	/** Exclude from report */
	excludeFromReport?: (key: SectionKey) => Promise<ActionResult>

	// Row-level operations (for grid sections)
	/** Mark individual row as dirty */
	markRowDirty?: (sectionKey: SectionKey, rowId: string) => void

	/** Get list of dirty row IDs for a section */
	getDirtyRows?: (sectionKey: SectionKey) => string[]

	/** Mark section as dirty/clean */
	markDirty: (key: SectionKey, dirty: boolean) => void
}
