/**
 * StatusIndicator Component
 *
 * Visual indicator for section status.
 * Shows: ✓ (valid), ! (invalid), ○ (draft), * (dirty), 🔒 (locked)
 */

import { Badge, Tooltip } from "antd";
import {
	CheckCircleOutlined,
	EditOutlined,
	ExclamationCircleOutlined,
	LockOutlined,
	MinusCircleOutlined,
} from "@ant-design/icons";
// import type { DrillHoleSection, SectionStatus } from "../features/drill-hole";
import { DrillHoleSection, SectionStatus, getSectionStatus } from "#src/types/drillhole.js";

import React from "react";

// import { getSectionStatus } from "../types/drillhole";
// import { getSectionStatus, type SectionStatus, type DrillHoleSection } from '#src/types/drillhole';

interface StatusIndicatorProps {
	section: DrillHoleSection
	showText?: boolean
}

/**
 * Get icon and color for a section status
 */
function getStatusDisplay(status: SectionStatus): {
	icon: React.ReactNode
	color: string
	text: string
} {
	switch (status) {
		case "valid":
			return {
				icon: <CheckCircleOutlined />,
				color: "#52c41a", // green
				text: "Valid",
			};
		case "invalid":
			return {
				icon: <ExclamationCircleOutlined />,
				color: "#fa8c16", // orange
				text: "Has Errors",
			};
		case "dirty":
			return {
				icon: <EditOutlined />,
				color: "#1890ff", // blue
				text: "Unsaved Changes",
			};
		case "locked":
			return {
				icon: <LockOutlined />,
				color: "#8c8c8c", // gray
				text: "Approved (Read-Only)",
			};
		case "draft":
		default:
			return {
				icon: <MinusCircleOutlined />,
				color: "#d9d9d9", // light gray
				text: "Draft",
			};
	}
}

/**
 * StatusIndicator Component
 *
 * Displays the current status of a section with an icon and optional text.
 * Shows a tooltip with more details on hover.
 */
export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
	section,
	showText = false,
}) => {
	const status = getSectionStatus(section);
	const display = getStatusDisplay(status);

	// Build tooltip content
	const tooltipContent = (
		<div>
			<div>
				<strong>Status:</strong>
				{" "}
				{display.text}
			</div>
			<div>
				<strong>Row Status:</strong>
				{" "}
				{section.getRowStatus()}
			</div>
			{section.hasUnsavedChanges() && <div>Unsaved changes</div>}
			{!section.isValid() && (
				<div>
					<strong>Errors:</strong>
					<ul style={{ margin: "4px 0", paddingLeft: "20px" }}>
						{section.getValidationErrors().map((err, idx) => (
							<li key={idx}>{err}</li>
						))}
					</ul>
				</div>
			)}
		</div>
	);

	return (
		<Tooltip title={tooltipContent}>
			<Badge
				status="processing"
				color={display.color}
				text={showText ? display.text : undefined}
				style={{ cursor: "help" }}
			/>
			<span style={{ marginLeft: 8, color: display.color }}>
				{display.icon}
			</span>
		</Tooltip>
	);
};

export default StatusIndicator;
