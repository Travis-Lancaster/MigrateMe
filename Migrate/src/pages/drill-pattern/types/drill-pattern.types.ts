/**
 * DrillPattern Types
 *
 * Type definitions for the DrillPattern management system.
 */

import type {
	CreateDrillPatternDto as CreateDto,
	DrillPattern as DrillPatternBase,
	UpdateDrillPatternDto as UpdateDto,
} from "#src/api/database/data-contracts";

// ============================================================================
// DrillPattern Interface
// ============================================================================

/**
 * Extended DrillPattern interface with computed fields
 */
export interface DrillPattern extends DrillPatternBase {
	// Add any computed fields if needed
	drillPlanCount?: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface DrillPatternFilters {
	drillProgram?: string | string[]
	organization?: string
	target?: string
	patternType?: string
	dateFrom?: Date
	dateTo?: Date
}

export interface DrillPatternListParams {
	page?: number
	take?: number
	filters?: DrillPatternFilters
	search?: string
}

// ============================================================================
// DTOs (re-export from API with custom extensions)
// ============================================================================

export type CreateDrillPatternDto = CreateDto;
export type UpdateDrillPatternDto = UpdateDto;

// ============================================================================
// Utility Types
// ============================================================================

export interface ActionResult {
	success: boolean
	message?: string
	error?: string
}
