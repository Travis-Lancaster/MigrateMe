/**
 * Status Transition Service
 *
 * Manages DrillPlan status transitions with state machine validation,
 * readiness checks, and permission enforcement.
 */

import type { TransitionStatusDto } from "#src/api/database/data-contracts";

import type {
	DrillPlan,
	DrillPlanStatusEnum,
	ReadinessCheck,
	ReadinessCheckResult,
	StatusTransition,
	StatusTransitionMetadata,
} from "../types";
import apiClient from "#src/services/apiClient.js";

export class StatusTransitionService {
	/**
	 * Valid status transitions (state machine)
	 */
	private readonly TRANSITIONS: Record<DrillPlanStatusEnum, DrillPlanStatusEnum[]> = {
		"Draft": ["Planned", "Cancelled"],
		"Planned": ["Draft", "In progress", "Cancelled", "Inaccessible"],
		"In progress": ["Completed", "Suspended", "Stopped", "Abandoned", "Inaccessible"],
		"Suspended": ["In progress", "Abandoned", "Cancelled"],
		"Stopped": ["In progress", "Abandoned"],
		"Inaccessible": ["Planned", "Cancelled", "Abandoned"],
		"Completed": [],
		"Cancelled": [],
		"Abandoned": [],
	};

	/**
	 * Check if transition is valid per state machine
	 */
	canTransition(from: DrillPlanStatusEnum, to: DrillPlanStatusEnum): boolean {
		return this.TRANSITIONS[from]?.includes(to) ?? false;
	}

	/**
	 * Get available transitions from current status
	 */
	getAvailableTransitions(from: DrillPlanStatusEnum): DrillPlanStatusEnum[] {
		return this.TRANSITIONS[from] ?? [];
	}

	/**
	 * Check if status is terminal (no further transitions)
	 */
	isTerminalStatus(status: DrillPlanStatusEnum): boolean {
		return ["Completed", "Cancelled", "Abandoned"].includes(status);
	}

	/**
	 * Check if status is exceptional (requires reason)
	 */
	isExceptionalStatus(status: DrillPlanStatusEnum): boolean {
		return ["Abandoned", "Cancelled", "Suspended", "Stopped", "Inaccessible"].includes(status);
	}

	/**
	 * Check if transition is on happy path
	 */
	isHappyPathTransition(from: DrillPlanStatusEnum, to: DrillPlanStatusEnum): boolean {
		const happyPath: DrillPlanStatusEnum[] = ["Draft", "Planned", "In progress", "Completed"];
		return happyPath.includes(from) && happyPath.includes(to);
	}

	/**
	 * Check readiness for transition
	 */
	checkReadiness(plan: DrillPlan, toStatus: DrillPlanStatusEnum): ReadinessCheckResult {
		const checks = this.getReadinessChecks(plan.DrillPlanStatus as DrillPlanStatusEnum, toStatus);
		const results = checks.map(check => ({
			...check,
			passed: check.check(plan),
		}));

		const allRequiredPass = results
			.filter(r => r.required)
			.every(r => r.passed);

		return {
			ready: allRequiredPass,
			checks: results,
		};
	}

	/**
	 * Get readiness checks for specific transition
	 */
	private getReadinessChecks(
		from: DrillPlanStatusEnum,
		to: DrillPlanStatusEnum,
	): Array<Omit<ReadinessCheck, "passed"> & { check: (plan: DrillPlan) => boolean }> {
		const key = `${from}->${to}`;

		const readinessMap: Record<string, Array<any>> = {
			"Draft->Planned": [
				{
					field: "coordinates",
					label: "Collar coordinates defined",
					required: true,
					check: (p: DrillPlan) => !!(p.PlannedEasting && p.PlannedNorthing),
				},
				{
					field: "depth",
					label: "Target depth specified",
					required: true,
					check: (p: DrillPlan) => !!p.PlannedTotalDepth && p.PlannedTotalDepth > 0,
				},
				{
					field: "target",
					label: "Target defined",
					required: true,
					check: (p: DrillPlan) => !!p.Target,
				},
			],
			"Planned->In progress": [
				{
					field: "coordinates",
					label: "Collars defined",
					required: true,
					check: (p: DrillPlan) => !!(p.PlannedEasting && p.PlannedNorthing),
				},
				{
					field: "startDate",
					label: "Start date set",
					required: true,
					check: (p: DrillPlan) => !!p.PlannedStartDt,
				},
			],
		};

		return readinessMap[key] || [];
	}

	/**
	 * Validate transition is allowed
	 */
	async validateTransition(
		plan: DrillPlan,
		toStatus: DrillPlanStatusEnum,
	): Promise<{ valid: boolean, errors: string[] }> {
		const errors: string[] = [];

		// Check state machine
		if (!this.canTransition(plan.DrillPlanStatus as DrillPlanStatusEnum, toStatus)) {
			errors.push(`Cannot transition from ${plan.DrillPlanStatus} to ${toStatus}`);
		}

		// Check readiness for happy path
		if (this.isHappyPathTransition(plan.DrillPlanStatus as DrillPlanStatusEnum, toStatus)) {
			const readiness = this.checkReadiness(plan, toStatus);
			if (!readiness.ready) {
				const failedChecks = readiness.checks
					.filter(c => c.required && !c.passed)
					.map(c => c.label);
				errors.push(`Not ready: ${failedChecks.join(", ")}`);
			}
		}

		return { valid: errors.length === 0, errors };
	}

	/**
	 * Perform status transition (with API call)
	 */
	async performTransition(
		planId: string,
		toStatus: DrillPlanStatusEnum,
		metadata: StatusTransitionMetadata,
	): Promise<void> {
		// Require reason for exceptional transitions
		if (this.isExceptionalStatus(toStatus) && !metadata.reason) {
			throw new Error("Reason required for exceptional status");
		}

		// Call API to perform transition
		const transitionDto: TransitionStatusDto = {
			toStatus,
			reason: metadata.reason,
			comments: metadata.comments,
			expectedResumeOnDt: metadata.ExpectedResumeOnDt?.toISOString(),
		};

		await apiClient.drillPlanControllerTransitionStatus(planId, transitionDto);
	}

	/**
	 * Get status history for a drill plan
	 */
	async getStatusHistory(planId: string): Promise<StatusTransition[]> {
		const response = await apiClient.drillPlanControllerGetStatusHistory(planId);
		return response.data as StatusTransition[];
	}
}

// Export singleton instance
export const statusTransitionService = new StatusTransitionService();
