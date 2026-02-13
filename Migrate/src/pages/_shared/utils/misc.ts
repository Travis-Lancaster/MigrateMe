import type { DrillPlanStatusEnum } from "#src/pages/drill-plan/types/drill-plan.types.js";

export function getStatusColors(status: DrillPlanStatusEnum) {
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
