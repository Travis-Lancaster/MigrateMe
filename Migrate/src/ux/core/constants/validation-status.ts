/**
 * Validation Status Constants
 * Defines validation states for data quality
 */

export enum ValidationStatus {
	Valid = "Valid",
	Warning = "Warning",
	Error = "Error",
	Pending = "Pending",
}

export interface ValidationStatusConfig {
	label: string
	color: string
	icon: string
	severity: "low" | "medium" | "high"
}

export const validationStatusConfig: Record<ValidationStatus, ValidationStatusConfig> = {
	[ValidationStatus.Valid]: {
		label: "Valid",
		color: "#52c41a",
		icon: "CheckCircleOutlined",
		severity: "low",
	},
	[ValidationStatus.Warning]: {
		label: "Warning",
		color: "#faad14",
		icon: "WarningOutlined",
		severity: "medium",
	},
	[ValidationStatus.Error]: {
		label: "Error",
		color: "#ff4d4f",
		icon: "CloseCircleOutlined",
		severity: "high",
	},
	[ValidationStatus.Pending]: {
		label: "Pending",
		color: "#d9d9d9",
		icon: "ClockCircleOutlined",
		severity: "low",
	},
};

console.log("[CONFIG] ValidationStatus configuration loaded");
