/**
 * DrillProgram Types
 *
 * Type definitions for the DrillProgram management system.
 */

import type {
	CreateDrillProgramDto as CreateDto,
	DrillProgram as DrillProgramBase,
	UpdateDrillProgramDto as UpdateDto,
} from "#src/api/database/data-contracts";

// ============================================================================
// DrillProgram Interface
// ============================================================================

/**
 * Extended DrillProgram interface with computed fields
 */
export interface DrillProgram extends DrillProgramBase {
	// Add any computed fields if needed
	patternCount?: number
}

// ============================================================================
// Filter Types
// ============================================================================

export interface DrillProgramFilters {
	status?: string | string[]
	organization?: string
	project?: string
	contractor?: string
	programType?: string
	dateFrom?: Date
	dateTo?: Date
}

export interface DrillProgramListParams {
	page?: number
	take?: number
	filters?: DrillProgramFilters
	search?: string
}

// ============================================================================
// DTOs (re-export from API with custom extensions)
// ============================================================================

export type CreateDrillProgramDto = CreateDto;
export type UpdateDrillProgramDto = UpdateDto;

// ============================================================================
// Utility Types
// ============================================================================

export interface ActionResult {
	success: boolean
	message?: string
	error?: string
}
