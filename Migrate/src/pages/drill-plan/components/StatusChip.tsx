/**
 * StatusChip Component
 *
 * Visual status indicator with muted mining colors
 */

import type { DrillPlanStatusEnum } from "../types";
import { Tag } from "antd";
import React from "react";

interface StatusChipProps {
	status: DrillPlanStatusEnum
	size?: "small" | "medium" | "large"
	onClick?: () => void
}

export const StatusChip: React.FC<StatusChipProps> = ({
	status,
	size = "medium",
	onClick,
}) => {
	const colors = getStatusColors(status);
	const isClickable = !!onClick;

	const fontSize = size === "small" ? "11px" : size === "large" ? "14px" : "12px";
	const padding = size === "small" ? "1px 1px" : "4px 12px";

	return (
		<Tag
			style={{
				background: colors.bg,
				color: colors.text,
				border: `1px solid ${colors.border}`,
				cursor: isClickable ? "pointer" : "default",
				fontSize,
				padding: 1,
				borderRadius: "12px",
				fontWeight: 500,
				margin: 0,
			}}
			onClick={onClick}
		>
			{status}
		</Tag>
	);
};

function getStatusColors(status: DrillPlanStatusEnum) {
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
