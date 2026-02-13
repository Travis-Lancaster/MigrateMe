/**
 * Section Helper Utilities
 *
 * Common helper functions for drill-hole sections working with LiveQuery pattern.
 * Provides utilities for validation parsing, editability checks, and status display.
 */

import type { ValidationError } from "../types/validation";
import { getRowStatusValue, RowStatusEnum } from "#src/data/domain/schema-helpers/index.js";

/**
 * Parse validation errors from JSON string
 *
 * Extracts validation error messages from the ValidationErrors field
 * stored in database rows. Returns empty array if no errors.
 *
 * @param data - Row data with optional ValidationErrors field
 * @returns Array of error message strings
 *
 * @example
 * ```typescript
 * const errors = getValidationErrors(collar);
 * // Returns: ['Depth cannot be negative', 'Organization is required']
 * ```
 */
export function getValidationErrors(data: any): string[] {
	if (!data?.ValidationErrors)
		return [];

	try {
		const errors: ValidationError[] = JSON.parse(data.ValidationErrors);
		return errors.map(e => e.message);
	}
	catch (error) {
		console.warn("[getValidationErrors] Failed to parse ValidationErrors:", error);
		return [];
	}
}

/**
 * Determine if a row can be edited
 *
 * Checks row status and edit mode to determine editability.
 * Only Draft rows in edit mode can be edited.
 *
 * Handles both numeric RowStatus and RowStatus interface types.
 *
 * @param rowStatus - Current row status (number, enum, or interface)
 * @param editMode - Whether edit mode is active
 * @returns True if row can be edited
 *
 * @example
 * ```typescript
 * const editable = canEdit(collar?.RowStatus, editMode);
 * <Input disabled={!editable} />
 * ```
 */
export function canEdit(
	rowStatus?: number | { Code: number } | undefined,
	editMode: boolean = true,
): boolean {
	const statusValue = getRowStatusValue(rowStatus);
	if (statusValue === undefined)
		return false;
	return statusValue === RowStatusEnum.DRAFT && editMode;
}

/**
 * Get badge/tag color for row status
 *
 * Returns Ant Design color for status badges.
 *
 * Handles both numeric RowStatus and RowStatus interface types.
 *
 * @param status - Row status (number, enum, or interface)
 * @returns Ant Design color string
 *
 * @example
 * ```typescript
 * const color = getRowStatusColor(collar.RowStatus);
 * <Tag color={color}>{getRowStatusLabel(collar.RowStatus)}</Tag>
 * ```
 */
export function getRowStatusColor(status: number | { Code: number } | undefined): string {
	const statusValue = getRowStatusValue(status);

	switch (statusValue) {
		case RowStatusEnum.DRAFT:
			return "default";
		case RowStatusEnum.COMPLETED:
			return "processing";
		case RowStatusEnum.REVIEWED:
			return "warning";
		case RowStatusEnum.APPROVED:
			return "success";
		case RowStatusEnum.SUPERSEDED:
			return "default";
		case RowStatusEnum.IMPORTED:
			return "cyan";
		case RowStatusEnum.REJECTED:
			return "error";
		default:
			return "default";
	}
}

/**
 * Get display label for row status
 *
 * Handles both numeric RowStatus and RowStatus interface types.
 *
 * @param status - Row status (number, enum, or interface)
 * @returns Human-readable status label
 *
 * @example
 * ```typescript
 * const label = getRowStatusLabel(collar.RowStatus);
 * // Returns: 'Draft', 'Completed', etc.
 * ```
 */
export function getRowStatusLabel(status: number | RowStatusEnum | { Code: number } | undefined): string {
	const statusValue = getRowStatusValue(status);

	switch (statusValue) {
		case RowStatusEnum.DRAFT:
			return "Draft";
		case RowStatusEnum.COMPLETED:
			return "Completed";
		case RowStatusEnum.REVIEWED:
			return "Reviewed";
		case RowStatusEnum.APPROVED:
			return "Approved";
		case RowStatusEnum.SUPERSEDED:
			return "Superseded";
		case RowStatusEnum.IMPORTED:
			return "Imported";
		case RowStatusEnum.REJECTED:
			return "Rejected";
		default:
			return "Unknown";
	}
}

/**
 * Check if row has validation errors
 *
 * @param data - Row data with optional ValidationStatus field
 * @returns True if validation has failed
 *
 * @example
 * ```typescript
 * if (hasValidationErrors(collar)) {
 *   message.error('Fix validation errors before submitting');
 * }
 * ```
 */
export function hasValidationErrors(data: any): boolean {
	return data?.ValidationStatus === 2;
}

/**
 * Check if row has validation warnings (from save validation)
 *
 * @param data - Row data
 * @returns True if has non-blocking warnings
 */
export function hasValidationWarnings(data: any): boolean {
	const errors = getValidationErrors(data);
	return errors.length > 0 && data?.ValidationStatus !== 2;
}

/**
 * Format depth value for display
 *
 * @param depth - Depth in meters
 * @returns Formatted depth string with unit
 *
 * @example
 * ```typescript
 * formatDepth(150.5) // Returns: '150.5m'
 * formatDepth(null)  // Returns: '-'
 * ```
 */
export function formatDepth(depth: number | null | undefined): string {
	if (depth === null || depth === undefined)
		return "-";
	return `${depth.toFixed(1)}m`;
}

/**
 * Check if row is active (not soft-deleted)
 *
 * @param data - Row data with ActiveInd field
 * @returns True if row is active
 */
export function isActive(data: any): boolean {
	return data?.ActiveInd !== false;
}

/**
 * Check if row status allows transition to target status
 *
 * @param currentStatus - Current row status
 * @param targetStatus - Desired target status
 * @returns True if transition is allowed
 *
 * @example
 * ```typescript
 * if (canTransitionTo(collar.RowStatus, RowStatus.Complete)) {
 *   // Show "Mark Complete" button
 * }
 * ```
 */
export function canTransitionTo(currentStatus: number, targetStatus: number): boolean {
	// Define allowed transitions
	const transitions: Record<number, number[]> = {
		[RowStatusEnum.DRAFT]: [RowStatusEnum.COMPLETED],
		[RowStatusEnum.COMPLETED]: [RowStatusEnum.DRAFT, RowStatusEnum.REVIEWED],
		[RowStatusEnum.REVIEWED]: [RowStatusEnum.COMPLETED, RowStatusEnum.APPROVED, RowStatusEnum.REJECTED],
		[RowStatusEnum.APPROVED]: [RowStatusEnum.SUPERSEDED],
		[RowStatusEnum.REJECTED]: [RowStatusEnum.DRAFT],
		[RowStatusEnum.SUPERSEDED]: [],
		[RowStatusEnum.IMPORTED]: [RowStatusEnum.DRAFT],
	};

	return transitions[currentStatus]?.includes(targetStatus) ?? false;
}
