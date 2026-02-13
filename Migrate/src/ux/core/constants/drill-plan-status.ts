/**
 * Drill Plan Status State Machine
 *
 * Defines valid status transitions and role-based permissions
 */

import type { HoleStatusCode } from "#src/data/domain/schema-helpers/enums.js";

export interface StatusTransitionRule {
	to: HoleStatusCode[]
	requiredRole?: string[]
	description?: string
}

/**
 * Status transition rules
 * Defines which status changes are allowed and who can perform them
 */
export const DRILL_PLAN_STATUS_TRANSITIONS: Record<HoleStatusCode, StatusTransitionRule> = {
	DRAFT: {
		to: ["PLANNED", "CANCELLED"],
		requiredRole: ["Planner", "Admin"],
		description: "Initial planning state. Can be transitioned to Planned when ready.",
	},
	PLANNED: {
		to: ["IN_PROGRESS", "CANCELLED", "INACCESSIBLE"],
		requiredRole: ["Geologist", "Admin"],
		description: "Ready for execution. Geologist can activate to start drilling.",
	},
	IN_PROGRESS: {
		to: ["COMPLETED", "SUSPENDED", "STOPPED", "ABANDONED"],
		requiredRole: ["Geologist", "Admin"],
		description: "Currently being drilled. Can be completed or paused.",
	},
	COMPLETED: {
		to: [],
		description: "Terminal state. Hole is complete.",
	},
	SUSPENDED: {
		to: ["IN_PROGRESS", "CANCELLED"],
		requiredRole: ["Geologist", "Admin"],
		description: "Temporarily paused. Can be resumed.",
	},
	STOPPED: {
		to: ["CANCELLED"],
		requiredRole: ["Admin"],
		description: "Permanently stopped. Only admin can cancel.",
	},
	ABANDONED: {
		to: [],
		description: "Terminal state. Hole was abandoned.",
	},
	CANCELLED: {
		to: [],
		description: "Terminal state. Plan was cancelled.",
	},
	INACCESSIBLE: {
		to: ["CANCELLED"],
		requiredRole: ["Admin"],
		description: "Location cannot be accessed. Only admin can cancel.",
	},
	ON_HOLD: {
		to: ["PLANNED", "CANCELLED"],
		requiredRole: ["Geologist", "Admin"],
		description: "On hold. Can be resumed to planned state.",
	},
};

/**
 * Check if a status transition is valid
 */
export function canTransitionStatus(
	from: HoleStatusCode,
	to: HoleStatusCode,
	userRole?: string,
): boolean {
	const transition = DRILL_PLAN_STATUS_TRANSITIONS[from];

	if (!transition || !transition.to.includes(to)) {
		return false;
	}

	if (transition.requiredRole && userRole && !transition.requiredRole.includes(userRole)) {
		return false;
	}

	return true;
}

/**
 * Get available transitions from current status
 */
export function getAvailableTransitions(
	from: HoleStatusCode,
	userRole?: string,
): HoleStatusCode[] {
	const transition = DRILL_PLAN_STATUS_TRANSITIONS[from];

	if (!transition) {
		return [];
	}

	// Filter by role if specified
	if (transition.requiredRole && userRole) {
		if (!transition.requiredRole.includes(userRole)) {
			return [];
		}
	}

	return transition.to;
}

export function getHoleStatusColors2(status: HoleStatusCode) {
	const colorMap: Record<string, { bg: string, border: string, text: string }> = {
		"Draft": {
			bg: "#e8e8e8",
			border: "#a8a8a8",
			text: "#5a5a5a",
		},
		"Planned": {
			bg: "#d4e6f4",
			border: "#4a90c8",
			text: "#1e4d7b",
		},
		"In progress": {
			bg: "#d4f0dd",
			border: "#52c41a",
			text: "#237804",
		},
		"Completed": {
			bg: "#c2d9c2",
			border: "#389e0d",
			text: "#135200",
		},
		"Suspended": {
			bg: "#fff7e6",
			border: "#faad14",
			text: "#ad6800",
		},
		"Stopped": {
			bg: "#fff1f0",
			border: "#ff7875",
			text: "#cf1322",
		},
		"Inaccessible": {
			bg: "#fff0e6",
			border: "#ff9c6e",
			text: "#d46b08",
		},
		"Abandoned": {
			bg: "#f0f0f0",
			border: "#8c8c8c",
			text: "#434343",
		},
		"Cancelled": {
			bg: "#ffe6e6",
			border: "#ff4d4f",
			text: "#a8071a",
		},
	};

	return colorMap[status] || colorMap.Draft;
}

/**
 * Get display color for drill plan status
 */
export function getHoleStatusColor(status: HoleStatusCode): string {
	const colorMap: Record<HoleStatusCode, string> = {
		DRAFT: "#8c8c8c",
		PLANNED: "#4a90c8",
		IN_PROGRESS: "#faad14",
		COMPLETED: "#52c41a",
		ABANDONED: "#d9d9d9",
		CANCELLED: "#d9d9d9",
		SUSPENDED: "#fa8c16",
		STOPPED: "#ff4d4f",
		INACCESSIBLE: "#ff7a45",
		ON_HOLD: "#bfbfbf",
	};

	return colorMap[status] || "#8c8c8c";
}

/**
 * Get display icon for drill plan status
 */
export function getHoleStatusIcon(status: HoleStatusCode): string {
	const iconMap: Record<HoleStatusCode, string> = {
		DRAFT: "edit",
		PLANNED: "check-circle",
		IN_PROGRESS: "loading",
		COMPLETED: "check-circle",
		ABANDONED: "close-circle",
		CANCELLED: "close-circle",
		SUSPENDED: "pause-circle",
		STOPPED: "stop",
		INACCESSIBLE: "warning",
		ON_HOLD: "clock-circle",
	};

	return iconMap[status] || "question";
}

console.log("[CONFIG] Drill plan status state machine loaded");
