/**
 * DrillPlan Workflow Types
 *
 * Core types for the DrillPlan workflow system.
 * Simplified design with no Owner/Executor fields.
 */

import type { CreateDrillPlanDto as CreateDto, DrillPlan as DrillPlanBase, UiDrillPlan } from "#src/api/database/data-contracts";

// ============================================================================
// DrillPlan Status Enum
// ============================================================================

export type DrillPlanStatusEnum
	= | "Draft"
	  | "Planned"
	  | "In progress"
	  | "Completed"
	  | "Abandoned"
	  | "Cancelled"
	  | "Suspended"
	  | "Stopped"
	  | "Inaccessible";

// ============================================================================
// DrillPlan Interface
// ============================================================================

/**
 * Extended DrillPlan interface with relations
 * Uses existing types from API but ensures compatibility
 */
export interface DrillPlan extends Omit<DrillPlanBase, "statusHistory" | "DrillPlanStatus"> {
	// Override DrillPlanStatus to be our enum type
	DrillPlanStatus: DrillPlanStatusEnum

	// Add optional planned hole name (may not exist in base)
	PlannedHoleNm?: string

	// Relations (populated by API)
	statusHistory?: StatusTransition[]
}

// ============================================================================
// Status Transition
// ============================================================================

export interface StatusTransition {
	DrillPlanStatusHistoryId: string
	DrillPlanId: string
	FromStatus: DrillPlanStatusEnum
	ToStatus: DrillPlanStatusEnum
	TransitionOnDt: string
	TransitionBy: string
	Reason?: string
	Comments?: string
	ExpectedResumeOnDt?: string
}

export interface StatusTransitionMetadata {
	userRole: string
	reason?: string
	comments?: string
	ExpectedResumeOnDt?: Date
}

// ============================================================================
// Readiness Check
// ============================================================================

export interface ReadinessCheck {
	field: string
	label: string
	required: boolean
	passed: boolean
}

export interface ReadinessCheckResult {
	ready: boolean
	checks: ReadinessCheck[]
}

// ============================================================================
// Filter Types
// ============================================================================

export type DrillPlanFilterType
	= | "all"
	  | "draft"
	  | "planned"
	  | "inprogress"
	  | "completed"
	  | "exceptions";

export interface DrillPlanFilters {
	status?: DrillPlanStatusEnum | DrillPlanStatusEnum[]
	project?: string
	organization?: string
	target?: string
	createdBy?: string
	dateFrom?: Date
	dateTo?: Date
}

// ============================================================================
// DTOs (re-export from API with custom extensions)
// ============================================================================

export type CreateDrillPlanDto = CreateDto;
export type UpdateDrillPlanDto = UiDrillPlan;

// ============================================================================
// Utility Types
// ============================================================================

export interface ActionResult {
	success: boolean
	message?: string
	error?: string
}
