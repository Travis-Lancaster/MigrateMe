/**
 * Row Status Constants and Configuration
 *
 * Consolidates RowStatus from the canonical source in schema-helpers/enums.ts
 * Provides UI-specific configuration for status display and editing rules.
 */

import { RowStatusEnum } from "#src/data/domain/schema-helpers/enums.js";

export { RowStatusEnum } from "#src/data/domain/schema-helpers/enums.js";
export type { RowStatus } from "#src/data/domain/schema-helpers/enums.js";

/**
 * UI Configuration for each RowStatus value
 */
export interface RowStatusConfig {
	label: string
	color: string
	badgeStatus: "success" | "processing" | "error" | "default" | "warning"
	icon: string
	allowEdit: boolean
	description: string
}

/**
 * Status configuration mapping numeric values to UI properties
 * Uses canonical RowStatusEnum values
 */
export const rowStatusConfig: Record<number, RowStatusConfig> = {
	[RowStatusEnum.DRAFT]: {
		label: "Draft",
		color: "#1890ff",
		badgeStatus: "processing",
		icon: "EditOutlined",
		allowEdit: true,
		description: "Currently being edited by a geologist",
	},
	[RowStatusEnum.COMPLETED]: {
		label: "Completed",
		color: "#52c41a",
		badgeStatus: "success",
		icon: "CheckCircleOutlined",
		allowEdit: true,
		description: "Ready for senior geologist review",
	},
	[RowStatusEnum.REVIEWED]: {
		label: "Reviewed",
		color: "#722ed1",
		badgeStatus: "default",
		icon: "EyeOutlined",
		allowEdit: false,
		description: "Reviewed by senior geologist",
	},
	[RowStatusEnum.APPROVED]: {
		label: "Approved",
		color: "#531dab",
		badgeStatus: "success",
		icon: "SafetyOutlined",
		allowEdit: false,
		description: "Locked and ready for reporting",
	},
	[RowStatusEnum.SUPERSEDED]: {
		label: "Superseded",
		color: "#8c8c8c",
		badgeStatus: "default",
		icon: "DeleteOutlined",
		allowEdit: false,
		description: "Replaced by a newer version",
	},
	[RowStatusEnum.IMPORTED]: {
		label: "Imported",
		color: "#faad14",
		badgeStatus: "warning",
		icon: "ImportOutlined",
		allowEdit: true,
		description: "Data imported from external source",
	},
	[RowStatusEnum.REJECTED]: {
		label: "Rejected",
		color: "#ff4d4f",
		badgeStatus: "error",
		icon: "CloseCircleOutlined",
		allowEdit: true,
		description: "Rejected and requires fixes",
	},
};

/**
 * Get UI color for a status value
 */
export function getStatusColor(status: number | string): string {
	const statusNum = typeof status === "string" ? Number.parseInt(status, 10) : status;
	return rowStatusConfig[statusNum]?.color || "#d9d9d9";
}

/**
 * Check if a status allows editing
 */
export function canEditRow(status: number | string): boolean {
	const statusNum = typeof status === "string" ? Number.parseInt(status, 10) : status;
	return rowStatusConfig[statusNum]?.allowEdit ?? false;
}

console.log("[CONFIG] RowStatus configuration loaded");
