/**
 * Permission Service
 *
 * Simplified role-based permissions.
 * No ownership/assignment logic.
 */

import type { DrillPlan, DrillPlanStatusEnum } from "../types";
import { statusTransitionService } from "./statusTransitionService";

// Roles from Auth.Role table
export enum Role {
	Admin = "admin",
	Geologist = "geologist",
	Driller = "driller",
	Viewer = "viewer",
}

export class PermissionService {
	constructor(private userRole: string) {}

	/**
	 * Can create new drill plans
	 */
	canCreate(): boolean {
		return ["admin", "geologist"].includes(this.userRole.toLowerCase());
	}

	/**
	 * Can read drill plans
	 */
	canRead(): boolean {
		return true; // All authenticated users
	}

	/**
	 * Can update drill plan
	 */
	canUpdate(): boolean {
		return ["admin", "geologist"].includes(this.userRole.toLowerCase());
	}

	/**
	 * Can delete drill plan
	 */
	canDelete(plan: DrillPlan): boolean {
		// Only admin or geologist can delete
		if (!["admin", "geologist"].includes(this.userRole.toLowerCase())) {
			return false;
		}

		// Cannot delete if drilling has started
		return plan.DrillPlanStatus === "Draft" || plan.DrillPlanStatus === "Planned";
	}

	/**
	 * Can transition to specific status
	 */
	canTransitionTo(plan: DrillPlan, toStatus: DrillPlanStatusEnum): boolean {
		const role = this.userRole.toLowerCase();

		// Check state machine first
		if (!statusTransitionService.canTransition(plan.DrillPlanStatus as DrillPlanStatusEnum, toStatus)) {
			return false;
		}

		// Admin can do anything
		if (role === "admin") {
			return true;
		}

		// Geologist permissions
		if (role === "geologist") {
			// Can manage Draft -> Planned -> In progress
			if (["Draft", "Planned", "In progress", "Cancelled"].includes(toStatus)) {
				return true;
			}
			return false;
		}

		// Driller permissions
		if (role === "driller") {
			// Can update operational statuses
			if (["In progress", "Suspended", "Stopped", "Completed"].includes(toStatus)) {
				return true;
			}
			return false;
		}

		// Viewer cannot transition
		return false;
	}

	/**
	 * Get available status transitions for user
	 */
	getAvailableStatusTransitions(plan: DrillPlan): DrillPlanStatusEnum[] {
		const allTransitions = statusTransitionService.getAvailableTransitions(plan.DrillPlanStatus as DrillPlanStatusEnum);
		return allTransitions.filter(status => this.canTransitionTo(plan, status));
	}

	/**
	 * Can view status history
	 */
	canViewHistory(): boolean {
		return true; // All authenticated users
	}
}
