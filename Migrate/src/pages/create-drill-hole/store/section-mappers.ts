/**
 * Create Drill Hole - Section Mappers (Data Entry Module)
 *
 * Transforms data between different representations:
 * 1. UiDrillHole (existing data) → Store sections (initialization)
 * 2. (NO BULK SUBMISSION - sections save individually)
 *
 * CRITICAL CLARIFICATION:
 * - Module is for DATA ENTRY into existing drill holes
 * - Does NOT create new drill holes
 * - Loads existing data from UiDrillHole into store sections
 * - No bulk CreateCollarDto building (individual section saves only)
 *
 * Pattern based on: src/pages/drill-hole/store/section-mappers.ts
 */

import type { UiDrillHole, UpsertCollarDto } from "#src/api/database/data-contracts.js";

import type { CreateDrillHoleState } from "./create-drillhole-store";
import type { Draft } from "immer";

// ============================================================================
// PART 1: UiDrillHole (Existing Data) → Store Initialization
// ============================================================================

/**
 * Initialize all store sections from existing drill hole data
 *
 * Called by store-loaders.ts when loading existing drill hole for data entry.
 * Populates sections with EXISTING data (not empty templates).
 *
 * CRITICAL: The drill hole already exists. We're loading its data for editing.
 *
 * @param state - Zustand store state (Draft)
 * @param drillHole - Existing drill hole data from API
 */
export function initializeSectionsFromDrillHole(
	state: Draft<CreateDrillHoleState>,
	drillHole: UiDrillHole,
): void {
	console.log("📊 [MAPPER:INIT] Populating sections from existing drill hole", {
		drillHoleId: drillHole.uiDrillHoleId,
		holeNm: drillHole.HoleNm,
		plannedHoleNm: drillHole.PlannedHoleNm,
	});

	// Map existing drill hole data to sections
	// Only map properties that actually exist in UiDrillHole interface
	
	// Single-value sections (objects)
	if (state.sections.rigsheet && drillHole.RigSetup) {
		state.sections.rigsheet.data = drillHole.RigSetup;
		state.sections.rigsheet.isDirty = false;
	}
	
	if (state.sections.collarcoordinates && drillHole.CollarCoordinate) {
		state.sections.collarcoordinates.data = drillHole.CollarCoordinate;
		state.sections.collarcoordinates.isDirty = false;
	}
	
	// Array sections (rows) - Only map what exists in UiDrillHole
	if (state.sections.drillmethod && drillHole.DrillMethod) {
		state.sections.drillmethod.data = drillHole.DrillMethod;
		state.sections.drillmethod.isDirty = false;
	}
	
	if (state.sections.survey && drillHole.SurveyLog) {
		state.sections.survey.data = drillHole.SurveyLog;
		state.sections.survey.isDirty = false;
	}
	
	if (state.sections.geocombined && drillHole.GeologyCombinedLog) {
		state.sections.geocombined.data = drillHole.GeologyCombinedLog;
		state.sections.geocombined.isDirty = false;
	}
	
	if (state.sections.sample && drillHole.Sample) {
		state.sections.sample.data = drillHole.Sample;
		state.sections.sample.isDirty = false;
	}
	
	// Note: Other sections (CycloneCleaning, CoreRecoveryRunLog, ShearLog, StructureLog,
	// MagSusLog, RockMechanicLog, RockQualityDesignationLog, FractureCountLog) are not
	// present in UiDrillHole interface yet. They will be added during data entry or
	// fetched separately as needed.
	// Sections without data remain with empty arrays/objects from section-factory initialization
	
	console.log("✅ [MAPPER:INIT] All available sections populated from existing drill hole");
}

// ============================================================================
// PART 2: Store → CreateCollarDto for API Submission
// ============================================================================

/**
 * Build UpsertCollarDto from store sections
 *
 * IMPORTANT: CollarId = DrillPlanId (same GUID)
 * The Hole already exists from the DrillPlan.
 * We're upserting the Collar entity for this existing Hole.
 *
 * NOTE: UpsertCollarDto does NOT support child relationship fields.
 * Each section saves independently via its own endpoint (per user requirements).
 * This function only builds the collar-level properties.
 *
 * @param state - Current store state with all section data
 * @returns UpsertCollarDto with collar properties only (no child relationships)
 */
export function buildUpsertCollarDto(state: CreateDrillHoleState): UpsertCollarDto {
	console.log("🔨 [MAPPER:BUILD] Building UpsertCollarDto from store sections", {
		drillPlanId: state.drillPlanId,
		plannedHoleNm: state.plannedHoleNm,
	});

	// Extract section data for collar-level properties
	const rigsheet = state.sections.rigsheet?.data as any;
	const collarCoords = state.sections.collarcoordinates?.data as any;

	// Build upsert DTO with only collar-level properties
	// CRITICAL: CollarId = DrillPlanId (they're the same GUID!)
	const dto: UpsertCollarDto = {
		// Identity: Set CollarId = DrillPlanId
		CollarId: state.drillPlanId!,
		
		// Organization is required
		Organization: rigsheet?.Organization || collarCoords?.Organization,

		// Metadata
		RowStatus: 1, // Draft
		ActiveInd: true,
	};

	console.log("✅ [MAPPER:BUILD] UpsertCollarDto built successfully (collar properties only)", {
		CollarId: dto.CollarId,
		Organization: dto.Organization,
	});

	return dto;
}

// ============================================================================
// PART 3: Helper Functions
// ============================================================================

/**
 * Validate that required sections are present for submission
 *
 * Called before buildCreateCollarDto to ensure we have minimum required data.
 *
 * @param state - Current store state
 * @returns Validation result with errors if any
 */
export function validateRequiredSectionsForSubmission(state: CreateDrillHoleState): {
	isValid: boolean
	errors: string[]
} {
	console.log("🔍 [MAPPER:VALIDATE] Validating required sections for submission");

	const errors: string[] = [];

	// Check identity
	if (!state.drillPlanId) {
		errors.push("DrillPlanId is required");
	}

	if (!state.plannedHoleNm) {
		errors.push("PlannedHoleNm is required");
	}

	// Check required sections
	const collarCoords = state.sections.collarcoordinates?.data;
	if (!collarCoords || Object.keys(collarCoords).length === 0) {
		errors.push("CollarCoordinates section is required");
	}

	// At least one data section should be completed
	const hasDataSections = [
		state.sections.drillmethod?.data,
		state.sections.geocombined?.data,
		state.sections.sample?.data,
	].some(data => Array.isArray(data) && data.length > 0);

	if (!hasDataSections) {
		errors.push("At least one data section (DrillMethod, GeologyLog, or Sample) must have data");
	}

	const isValid = errors.length === 0;

	if (isValid) {
		console.log("✅ [MAPPER:VALIDATE] All required sections present");
	}
	else {
		console.warn("⚠️ [MAPPER:VALIDATE] Missing required sections", { errors });
	}

	return { isValid, errors };
}

/**
 * Get summary of completed sections
 *
 * Used for progress tracking in UI.
 *
 * @param state - Current store state
 * @returns Summary of section completion
 */
export function getSectionCompletionSummary(state: CreateDrillHoleState): {
	total: number
	completed: number
	percentage: number
	sections: Record<string, boolean>
} {
	const sectionKeys = Object.keys(state.sections);
	const completed = sectionKeys.filter(key => {
		const section = state.sections[key as keyof typeof state.sections];
		if (!section) return false;

		// Check if section has data
		const hasData = Array.isArray(section.data)
			? section.data.length > 0
			: Object.keys(section.data || {}).length > 0;

		// Check if section is marked complete
		return hasData && (section as any)?.isComplete;
	});

	const sections: Record<string, boolean> = {};
	sectionKeys.forEach(key => {
		const section = state.sections[key as keyof typeof state.sections];
		sections[key] = (section as any)?.isComplete || false;
	});

	return {
		total: sectionKeys.length,
		completed: completed.length,
		percentage: Math.round((completed.length / sectionKeys.length) * 100),
		sections,
	};
}
