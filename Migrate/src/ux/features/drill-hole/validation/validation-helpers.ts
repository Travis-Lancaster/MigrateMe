/**
 * Two-Tier Validation Helper
 *
 * Simple helper to execute database (hard) and save (soft) validation.
 * No ceremony, just Zod → structured errors.
 */

import type { z } from "zod";
import type { DatabaseValidationError, SaveValidationError } from "../types/validation";

import { ValidationType } from "../types/validation";

// ============================================================================
// Two-Tier Validation Function
// ============================================================================

/**
 * Validates data using both database and save schemas
 *
 * @param data - Data to validate
 * @param databaseSchema - Zod schema for hard validation (blocks save)
 * @param saveSchema - Zod schema for soft validation (warnings only)
 * @returns Validation result with canSave flag and error arrays
 *
 * @example
 * ```typescript
 * const result = validateTwoTier(
 *   collarData,
 *   collarDatabaseSchema,
 *   collarSaveSchema
 * );
 *
 * if (!result.canSave) {
 *   console.error('Cannot save:', result.databaseErrors);
 * }
 * if (result.saveWarnings.length > 0) {
 *   console.warn('Warnings:', result.saveWarnings);
 * }
 * ```
 */
export function validateTwoTier<T = any>(
	data: Partial<T>,
	databaseSchema: z.ZodSchema,
	saveSchema: z.ZodSchema,
) {
	// Run database validation (hard - blocks save)
	const dbResult = databaseSchema.safeParse(data);

	// Run save validation (soft - warnings only)
	const saveResult = saveSchema.safeParse(data);

	return {
		canSave: dbResult.success,
		databaseErrors: dbResult.success ? [] : dbResult.error.issues.map(toDbError),
		saveWarnings: saveResult.success ? [] : saveResult.error.issues.map(toSaveError),
	};
}

// ============================================================================
// Error Mapping Functions
// ============================================================================

/**
 * Converts Zod issue to DatabaseValidationError format
 * Database errors are blocking (prevent save)
 */
function toDbError(err: z.ZodIssue): DatabaseValidationError {
	return {
		field: err.path.join("."),
		message: err.message,
		code: err.code,
		type: ValidationType.Database,
		severity: "error" as const,
		blocking: true as const,
	};
}

/**
 * Converts Zod issue to SaveValidationError format
 * Save errors are non-blocking (warnings only)
 */
function toSaveError(err: z.ZodIssue): SaveValidationError {
	return {
		field: err.path.join("."),
		message: err.message,
		code: err.code,
		type: ValidationType.Save,
		severity: "warning" as const,
		blocking: false as const,
	};
}
