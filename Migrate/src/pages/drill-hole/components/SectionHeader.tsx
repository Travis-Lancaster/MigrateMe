/**
 * SectionHeader Component
 *
 * Consistent header for DrillHole sections showing:
 * - Section title
 * - StatusIndicator
 * - RowStatus badge
 * - Action buttons
 * - Sync status
 */

import type { DrillHoleSection } from "#src/types/drillhole";
import { getRowStatusDisplay as getStatusLabel, RowStatus } from "#src/types/drillhole";
import {
	CloudOutlined,
	CloudSyncOutlined,
	CloudUploadOutlined,
	ExclamationCircleOutlined,
	UploadOutlined,
} from "@ant-design/icons";
import { Button, Space, Tag, Tooltip } from "antd";
import React from "react";
import { ActionButtons } from "./ActionButtons";
import { StatusIndicator } from "./StatusIndicator";

interface SectionHeaderProps {
	section: DrillHoleSection
	title: string
	loading?: boolean
	syncStatus?: "idle" | "pending" | "syncing" | "synced" | "error"
	onSave?: () => void | Promise<void>
	onSubmit?: () => void | Promise<void>
	onReject?: () => void | Promise<void>
	onReview?: () => void | Promise<void>
	onApprove?: () => void | Promise<void>
	onExclude?: () => void | Promise<void>
	onImport?: () => void // NEW: Import button callback
	extra?: React.ReactNode
	hideActions?: boolean // NEW: Hide action buttons for read-only sections
}

/**
 * Get RowStatus display properties
 */
function getRowStatusDisplay(status: RowStatus): {
	color: string
	label: string
} {
	switch (status) {
		case RowStatus.Draft:
			return { color: "default", label: "Draft" };
		case RowStatus.Complete:
			return { color: "processing", label: "Complete" };
		case RowStatus.Reviewed:
			return { color: "warning", label: "Reviewed" };
		case RowStatus.Approved:
			return { color: "success", label: "Approved" };
		case RowStatus.Superseded:
			return { color: "default", label: "Superseded" };
		case RowStatus.Imported:
			return { color: "cyan", label: "Imported" };
		case RowStatus.Rejected:
			return { color: "error", label: "Rejected" };
		default:
			return { color: "default", label: getStatusLabel(status) };
	}
}

/**
 * Get sync status display properties
 */
function getSyncStatusDisplay(status?: "idle" | "pending" | "syncing" | "synced" | "error"): {
	icon: React.ReactNode
	color: string
	tooltip: string
} {
	switch (status) {
		case "pending":
			return {
				icon: <CloudUploadOutlined />,
				color: "#faad14", // warning color
				tooltip: "Changes pending sync",
			};
		case "syncing":
			return {
				icon: <CloudSyncOutlined spin />,
				color: "#1890ff", // primary color
				tooltip: "Syncing to server...",
			};
		case "synced":
			return {
				icon: <CloudOutlined />,
				color: "#52c41a", // success color
				tooltip: "Synced with server",
			};
		case "error":
			return {
				icon: <ExclamationCircleOutlined />,
				color: "#ff4d4f", // error color
				tooltip: "Sync error - will retry",
			};
		case "idle":
		default:
			return {
				icon: <CloudOutlined />,
				color: "#d9d9d9", // gray
				tooltip: "Not synced",
			};
	}
}

/**
 * Get stale warning display properties
 */
function getStaleWarningDisplay(): {
	icon: React.ReactNode
	color: string
	tooltip: string
} {
	return {
		icon: <ExclamationCircleOutlined />,
		color: "#faad14", // warning color
		tooltip: "Server data has changed - review before saving",
	};
}

/**
 * SectionHeader Component
 *
 * Renders a consistent header for all DrillHole sections.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
	section,
	title,
	loading = false,
	syncStatus = "idle",
	onSave,
	onSubmit,
	onReject,
	onReview,
	onApprove,
	onExclude,
	onImport,
	extra,
	hideActions = false,
}) => {
	const rowStatus = section.getRowStatus();
	const rowStatusDisplay = getRowStatusDisplay(rowStatus);
	const syncStatusDisplay = getSyncStatusDisplay(syncStatus);
	const staleWarningDisplay = getStaleWarningDisplay();

	// Show stale warning only if section is stale AND has unsaved changes
	const showStaleWarning = section.isStale && section.isDirty;

	return (
		<div
			style={{
				display: "flex",
				justifyContent: "space-between",
				alignItems: "center",
				padding: "12px 16px",
				borderBottom: "1px solid #f0f0f0",
				background: "#fafafa",
			}}
		>
			{/* Left side: Title, Status Indicator, RowStatus Badge */}
			<Space size="middle">
				<h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>
					{title}
				</h3>

				<StatusIndicator section={section} />

				<Tag color={rowStatusDisplay.color}>
					{rowStatusDisplay.label}
				</Tag>

				<Tooltip title={syncStatusDisplay.tooltip}>
					<span style={{ color: syncStatusDisplay.color, fontSize: "16px" }}>
						{syncStatusDisplay.icon}
					</span>
				</Tooltip>

				{showStaleWarning && (
					<Tooltip title={staleWarningDisplay.tooltip}>
						<span style={{ color: staleWarningDisplay.color, fontSize: "16px" }}>
							{staleWarningDisplay.icon}
						</span>
					</Tooltip>
				)}
			</Space>

			{/* Right side: Action Buttons and Extra */}
			<Space>
				{onImport && (
					<Button
						icon={<UploadOutlined />}
						onClick={onImport}
						size="small"
					>
						Import
					</Button>
				)}

				{extra}

				{!hideActions && (
					<ActionButtons
						section={section}
						loading={loading}
						onSave={onSave}
						onSubmit={onSubmit}
						onReject={onReject}
						onReview={onApprove}
						onApprove={onApprove}
						onExclude={onExclude}
					/>
				)}
			</Space>
		</div>
	);
};

export default SectionHeader;
