/**
 * RowStatusBadge Component
 * Displays the workflow/approval status of a database record
 *
 * Used for: Draft, Completed, Reviewed, Approved, Superseded, Imported, Rejected
 * Status Type: Numeric (0-4)
 * Used in: Grid views, headers, forms for record approval workflow
 */

// import type { ValidationError } from "#src/data/api/database/data-contracts.js";

import { Badge, BadgeProps, Tooltip } from "antd";

import { ValidationError } from "#src/api/database/data-contracts.js";
// import { rowStatusConfig } from "#src/ux/core/index.js";
import { rowStatusConfig } from "#src/ux/core/constants/index.js";
// import type { BadgeProps } from "antd";
// import { ValidationError } from "#src/types/drillhole.js";
// import { rowStatusConfig } from "#src/ux/core/constants/row-status.js";
import { useRef } from "react";

export interface RowStatusBadgeProps {
	status: number
	validationErrors?: ValidationError[]
	showLabel?: boolean
	size?: "small" | "default"
}

export function RowStatusBadge({
	status,
	validationErrors,
	showLabel = true,
	size = "default",
}: RowStatusBadgeProps) {
	const hasErrors = validationErrors && validationErrors.length > 0;
	const badgeRef = useRef<HTMLSpanElement>(null);

	// If there are validation errors, show error badge
	if (hasErrors) {
		const errorMessages = validationErrors.map(e => e.ValidationErrors || e.ErrorsJson || "Validation error").join(", ");

		return (
			<Tooltip title={errorMessages} getPopupContainer={() => (badgeRef.current?.parentNode as HTMLElement) || document.body}>
				<span ref={badgeRef}>
					<Badge
						status="error"
						text={showLabel ? `Invalid (${validationErrors.length})` : undefined}
						className={size === "small" ? "text-sm" : ""}
					/>
				</span>
			</Tooltip>
		);
	}

	const statusNum = typeof status === "string" ? Number.parseInt(status, 10) : status;
	const config = rowStatusConfig[statusNum];

	// If status not found in config, show default
	if (!config) {
		return (
			<Badge
				status="default"
				text={showLabel ? status : undefined}
				className={size === "small" ? "text-sm" : ""}
			/>
		);
	}

	return (
		<Tooltip title={config.description} getPopupContainer={() => (badgeRef.current?.parentNode as HTMLElement) || document.body}>
			<span ref={badgeRef}>
				<Badge
					status={config.badgeStatus as BadgeProps["status"]}
					text={showLabel ? config.label : undefined}
					style={{ color: config.color }}
					className={size === "small" ? "text-sm" : ""}
				/>
			</span>
		</Tooltip>
	);
}
