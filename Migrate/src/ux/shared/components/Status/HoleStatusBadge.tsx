/**
 * HoleStatusBadge Component
 * Displays the operational status of a drill hole
 *
 * Used for: Draft, Planned, In Progress, Completed, Abandoned, Suspended, etc.
 * Status Type: String (e.g., "PLANNED", "IN_PROGRESS", "COMPLETED")
 * Used in: Drill plan lists, drill hole forms, collar views
 */

import { Badge, Tooltip } from "antd";

// import type { HoleStatusCode } from "#src/data/domain/schema-helpers/enums.js";
import type { BadgeProps } from "antd";
import { HoleStatusCode } from "#src/data/domain/schema-helpers/enums.js";
import { getHoleStatusColor } from "#src/ux/core/constants/drill-plan-status.js";
import { useRef } from "react";

export interface HoleStatusBadgeProps {
	status: string | HoleStatusCode
	showLabel?: boolean
	size?: "small" | "default"
}

/**
 * Status configuration for HoleStatus badges
 * Maps string status codes to UI properties
 */
const holeStatusConfig: Record<string, {
	label: string
	badgeStatus: BadgeProps["status"]
	description: string
}> = {
	"DRAFT": {
		label: "Draft",
		badgeStatus: "default",
		description: "Initial planning stage",
	},
	"PLANNED": {
		label: "Planned",
		badgeStatus: "processing",
		description: "Ready for execution",
	},
	"IN_PROGRESS": {
		label: "In Progress",
		badgeStatus: "warning",
		description: "Currently being drilled",
	},
	"COMPLETED": {
		label: "Completed",
		badgeStatus: "success",
		description: "Drilling completed",
	},
	"ABANDONED": {
		label: "Abandoned",
		badgeStatus: "default",
		description: "Hole was abandoned",
	},
	"CANCELLED": {
		label: "Cancelled",
		badgeStatus: "default",
		description: "Plan was cancelled",
	},
	"SUSPENDED": {
		label: "Suspended",
		badgeStatus: "warning",
		description: "Temporarily paused",
	},
	"STOPPED": {
		label: "Stopped",
		badgeStatus: "error",
		description: "Permanently stopped",
	},
	"INACCESSIBLE": {
		label: "Inaccessible",
		badgeStatus: "error",
		description: "Location cannot be accessed",
	},
	"Draft": {
		label: "Draft",
		badgeStatus: "default",
		description: "Initial planning stage",
	},
	"Planned": {
		label: "Planned",
		badgeStatus: "processing",
		description: "Ready for execution",
	},
	"In progress": {
		label: "In Progress",
		badgeStatus: "warning",
		description: "Currently being drilled",
	},
	"Completed": {
		label: "Completed",
		badgeStatus: "success",
		description: "Drilling completed",
	},
	"Abandoned": {
		label: "Abandoned",
		badgeStatus: "default",
		description: "Hole was abandoned",
	},
	"Cancelled": {
		label: "Cancelled",
		badgeStatus: "default",
		description: "Plan was cancelled",
	},
	"Suspended": {
		label: "Suspended",
		badgeStatus: "warning",
		description: "Temporarily paused",
	},
	"Stopped": {
		label: "Stopped",
		badgeStatus: "error",
		description: "Permanently stopped",
	},
	"Inaccessible": {
		label: "Inaccessible",
		badgeStatus: "error",
		description: "Location cannot be accessed",
	},
};

export function HoleStatusBadge({
	status,
	showLabel = true,
	size = "default",
}: HoleStatusBadgeProps) {
	const badgeRef = useRef<HTMLSpanElement>(null);

	if (!status) {
		return (
			<Badge
				status="default"
				text={showLabel ? "Unknown" : undefined}
				className={size === "small" ? "text-sm" : ""}
			/>
		);
	}

	const statusStr = String(status);
	const config = holeStatusConfig[statusStr];
	const color = getHoleStatusColor(statusStr as HoleStatusCode);

	// If status not found in config, show default with the raw value
	if (!config) {
		return (
			<Badge
				status="default"
				text={showLabel ? statusStr : undefined}
				className={size === "small" ? "text-sm" : ""}
			/>
		);
	}

	return (
		<Tooltip title={config.description} getPopupContainer={() => (badgeRef.current?.parentNode as HTMLElement) || document.body}>
			<span ref={badgeRef}>
				<Badge
					status={config.badgeStatus}
					text={showLabel ? config.label : undefined}
					style={{ color }}
					className={size === "small" ? "text-sm" : ""}
				/>
			</span>
		</Tooltip>
	);
}
