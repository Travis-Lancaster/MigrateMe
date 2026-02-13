/**
 * RowStatus Re-exports and Helpers
 *
 * Consolidates RowStatus from the canonical source in schema-helpers/enums.ts
 * Provides UI-specific helpers for status display and transitions.
 */

import { RowStatusEnum } from "#src/data/domain/schema-helpers/enums.js";

export { RowStatusEnum } from "#src/data/domain/schema-helpers/enums.js";
export type { RowStatus } from "#src/data/domain/schema-helpers/enums.js";

/**
 * Valid RowStatus transitions - enforces the state machine
 * Maps to the canonical RowStatusEnum values
 */
export const RowStatusTransitions: Record<number, number[]> = {
	[RowStatusEnum.DRAFT]: [RowStatusEnum.COMPLETED],
	[RowStatusEnum.COMPLETED]: [RowStatusEnum.DRAFT, RowStatusEnum.REVIEWED, RowStatusEnum.REJECTED],
	[RowStatusEnum.REVIEWED]: [RowStatusEnum.DRAFT, RowStatusEnum.APPROVED, RowStatusEnum.REJECTED],
	[RowStatusEnum.APPROVED]: [RowStatusEnum.SUPERSEDED],
	[RowStatusEnum.SUPERSEDED]: [],
	[RowStatusEnum.IMPORTED]: [RowStatusEnum.DRAFT, RowStatusEnum.COMPLETED],
	[RowStatusEnum.REJECTED]: [RowStatusEnum.DRAFT],
} as const;

/**
 * Check if a RowStatus transition is valid
 */
export function canTransition(from: number, to: number): boolean {
	const validTransitions = RowStatusTransitions[from as keyof typeof RowStatusTransitions];
	return validTransitions?.includes(to) ?? false;
}

/**
 * Get available transitions from a given status
 */
export function getAvailableTransitions(from: number): number[] {
	const validTransitions = RowStatusTransitions[from as keyof typeof RowStatusTransitions];
	return validTransitions ?? [];
}

/**
 * Convert numeric API RowStatus to enum value
 * Handles all status values: 0-4, 99, 255
 */
export function convertApiRowStatus(apiStatus: number | undefined | null): number {
	if (apiStatus === null || apiStatus === undefined) {
		return RowStatusEnum.DRAFT;
	}

	// Validate against known values
	const validValues = [
		RowStatusEnum.DRAFT,
		RowStatusEnum.COMPLETED,
		RowStatusEnum.REVIEWED,
		RowStatusEnum.APPROVED,
		RowStatusEnum.SUPERSEDED,
		RowStatusEnum.IMPORTED,
		RowStatusEnum.REJECTED,
	];
	if (validValues.includes(apiStatus)) {
		return apiStatus;
	}

	console.warn(`Unknown RowStatus value: ${apiStatus}, defaulting to Draft`);
	return RowStatusEnum.DRAFT;
}

/**
 * Get display text for RowStatus
 */
export function getRowStatusDisplay(status: number): string {
	switch (status) {
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
