/**
 * SectionWrapper Component (LiveQuery Compatible)
 *
 * Simplified layout container for drill-hole sections that works with LiveQuery pattern.
 * Instead of receiving a section object, it receives discrete props for state.
 *
 * Handles:
 * - Loading states with spinner
 * - Validation error display
 * - Read-only indicator
 * - Consistent padding and styling
 */

import { LockOutlined } from "@ant-design/icons";
import { Alert, Card, Space, Spin } from "antd";
import React from "react";

interface SectionWrapperProps {
	/** Section title */
	title?: string

	/** Loading state */
	loading?: boolean

	/** Whether section is editable */
	isEditable?: boolean

	/** Validation errors to display */
	validationErrors?: string[]

	/** Show header with title */
	showHeader?: boolean

	/** Show validation error summary */
	showValidationSummary?: boolean

	/** Section content */
	children: React.ReactNode

	/** Additional CSS class */
	className?: string

	/** Inline styles */
	style?: React.CSSProperties

	/** Header extra content (e.g., action buttons) */
	extra?: React.ReactNode
}

/**
 * SectionWrapper Component
 *
 * Wraps section content with:
 * - Optional header with title and extra content
 * - Loading spinner overlay
 * - Validation error summary
 * - Read-only indicator when not editable
 * - Consistent styling
 *
 * @example
 * ```typescript
 * <SectionWrapper
 *   title="Collar Information"
 *   loading={!collar}
 *   isEditable={collar?.RowStatus === RowStatus.Draft}
 *   validationErrors={validationErrors}
 *   extra={<Button onClick={save}>Save</Button>}
 * >
 *   <CollarForm data={collar} />
 * </SectionWrapper>
 * ```
 */
export const SectionWrapper: React.FC<SectionWrapperProps> = ({
	title,
	loading = false,
	isEditable = true,
	validationErrors = [],
	showHeader = true,
	showValidationSummary = true,
	children,
	className,
	style,
	extra,
}) => {
	const hasErrors = validationErrors.length > 0;

	return (
		<Card
			className={className}
			style={style}
			styles={{
				body: { padding: 0 },
			}}
		>
			{/* Header with title and extra content */}
			{showHeader && (title || extra) && (
				<div
					style={{
						padding: "12px 16px",
						borderBottom: "1px solid #f0f0f0",
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					{title && (
						<h3
							style={{
								margin: 0,
								fontSize: "16px",
								fontWeight: 600,
							}}
						>
							{title}
						</h3>
					)}
					{extra && <div>{extra}</div>}
				</div>
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

				{/* Read-only indicator when not editable */}
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
