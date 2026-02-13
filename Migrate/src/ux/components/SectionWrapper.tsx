/**
 * SectionWrapper Component
 *
 * Layout container for DrillHole sections that handles:
 * - Loading states with spinner
 * - Validation error display
 * - Locked state overlay (when not editable)
 * - Consistent padding and styling
 */

// import type { DrillHoleSection } from "../types/drillhole";

import { Alert, Card, Space, Spin } from "antd";

import { DrillHoleSection } from "#src/types/drillhole.js";
// import type { DrillHoleSection } from '#src/types/drillhole';
import { LockOutlined } from "@ant-design/icons";
import React from "react";
import SectionHeader from "#src/pages/drill-hole/components/SectionHeader.js";
import { cn } from "#src/utils/index.js";

// import { SectionHeader } from "./SectionHeader";

// import { cn } from '#src/utils';

interface SectionWrapperProps {
	section: DrillHoleSection
	title: string
	loading?: boolean
	syncStatus?: "idle" | "pending" | "syncing" | "synced" | "error"
	showHeader?: boolean
	showValidationSummary?: boolean
	children: React.ReactNode
	className?: string
	style?: React.CSSProperties
	onSave?: () => void | Promise<void>
	onSubmit?: () => void | Promise<void>
	onReject?: () => void | Promise<void>
	onReview?: () => void | Promise<void>
	onApprove?: () => void | Promise<void>
	onExclude?: () => void | Promise<void>
	onImport?: () => void // NEW: Import button handler
	extra?: React.ReactNode
	hideActions?: boolean // NEW: Hide action buttons for read-only sections
}

/**
 * SectionWrapper Component
 *
 * Wraps section content with:
 * - Optional header with title, status, and actions
 * - Loading spinner overlay
 * - Validation error summary
 * - Locked overlay when not editable
 * - Consistent styling
 */
export const SectionWrapper: React.FC<SectionWrapperProps> = ({
	section,
	title,
	loading = false,
	syncStatus = "idle",
	showHeader = true,
	showValidationSummary = true,
	children,
	className,
	style,
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
	const isEditable = section.isEditable();
	const isValid = section.isValid();
	const validationErrors = section.getValidationErrors();
	const hasErrors = !isValid && validationErrors.length > 0;

	return (
		<Card
			className={cn("drill-hole-section-wrapper", className)}
			style={style}
			styles={{
				body: { padding: 0 },
			}}
		>
			{/* Header with title, status, and actions */}
			{showHeader && (
				<SectionHeader
					section={section}
					title={title}
					loading={loading}
					syncStatus={syncStatus}
					onSave={onSave}
					onSubmit={onSubmit}
					onReject={onReject}
					onReview={onReview}
					onApprove={onApprove}
					onExclude={onExclude}
					onImport={onImport}
					extra={extra}
					hideActions={hideActions}
				/>
			)}

			{/* Content area */}
			<div
				style={{
					position: "relative",
					minHeight: "200px",
				}}
			>
				{/* Loading spinner overlay */}
				{loading && (
					<div
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							background: "rgba(255, 255, 255, 0.8)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							zIndex: 10,
						}}
					>
						<Spin size="large" tip="Loading..." />
					</div>
				)}

				{/* Lock icon indicator when not editable */}
				{!isEditable && (
					<div
						style={{
							position: "absolute",
							top: "16px",
							right: "16px",
							display: "flex",
							alignItems: "center",
							gap: "8px",
							color: "#8c8c8c",
							fontSize: "12px",
							fontWeight: 500,
							zIndex: 5,
							pointerEvents: "none",
						}}
					>
						<LockOutlined />
						<span>Read-Only</span>
					</div>
				)}

				{/* Section content */}
				<div
					style={{
						padding: "16px",
					}}
				>
					{children}
				</div>
			</div>

			{/* Validation error summary */}
			{showValidationSummary && hasErrors && (
				<div style={{ padding: "12px 16px" }}>
					<Alert
						message="Validation Errors"
						description={(
							<Space direction="vertical" size="small" style={{ width: "100%" }}>
								{validationErrors.map((error, idx) => (
									<div key={idx}>
										•
										{error}
									</div>
								))}
							</Space>
						)}
						type="error"
						showIcon
						closable
					/>
				</div>
			)}
		</Card>
	);
};

export default SectionWrapper;
