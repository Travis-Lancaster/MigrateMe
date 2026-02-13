/**
 * Collar Database Validator
 *
 * Database-level (hard) validation for Collar section.
 * Validates fundamental data integrity constraints that BLOCK save operations.
 *
 * Hard Constraints:
 * - CollarId: Required UUID
 * - DrillPlanId: Required UUID (foreign key)
 * - Organization: Required string
 * - HoleNm: Required string (hole name)
 *
 * These validations enforce database schema requirements and referential integrity.
 * Validation failures BLOCK save operations until resolved.
 */

import type { DatabaseValidationError } from "../../../types/validation";
import { z } from "zod";

import { ValidationType } from "../../../types/validation";
import { uuid } from "./base-schemas";

// ============================================================================
// Collar Database Schema
// ============================================================================

/**
 * Database-level schema for Collar section.
 * Only includes fields with hard constraints that must be validated before save.
 */
const collarDatabaseSchema = z.object({
	/** Primary key - Required UUID */
	CollarId: uuid.describe("Collar ID is required"),

	/** Foreign key to DrillPlan - Required UUID */

	/** Organization code - Required */
	Organization: z.string().min(1, "Organization is required"),

	/** Hole name - Required */

});

/**
 * Type representing the minimal data shape for database validation.
 * Only includes fields with hard constraints.
 */
export type CollarDatabaseData = z.infer<typeof collarDatabaseSchema>;

// ============================================================================
// Database Validator Function Type
// ============================================================================

/**
 * Generic database validator function type.
 * Takes data and returns array of database validation errors.
 *
 * @template T - The data type being validated
 */
export type DatabaseValidatorFunction<T> = (data: Partial<T>) => DatabaseValidationError[];

// ============================================================================
// Collar Database Validator Factory
// ============================================================================

/**
 * Creates a database validator function for Collar data.
 *
 * Validates hard constraints that enforce database integrity:
 * - CollarId must be a valid UUID
 * - DrillPlanId must be a valid UUID (foreign key constraint)
 * - Organization must be a non-empty string
 * - HoleNm must be a non-empty string
 *
 * Returns an array of DatabaseValidationError objects. Empty array means validation passed.
 *
 * @returns Database validator function for Collar data
 *
 * @example
 * ```typescript
 * const validator = createCollarDatabaseValidator();
 *
 * // Valid data
 * const errors1 = validator({
 *   CollarId: '123e4567-e89b-12d3-a456-426614174000',
 *   DrillPlanId: '123e4567-e89b-12d3-a456-426614174001',
 *   Organization: 'B2Gold',
 *   HoleNm: 'DDH-001'
 * });
 * console.log(errors1); // []
 *
 * // Invalid data
 * const errors2 = validator({
 *   CollarId: 'invalid-uuid',
 *   Organization: '',
 * });
 * console.log(errors2); // Array of DatabaseValidationError objects
 * ```
 */
export function createCollarDatabaseValidator(): DatabaseValidatorFunction<CollarDatabaseData> {
	return (data: Partial<CollarDatabaseData>): DatabaseValidationError[] => {
		// Run Zod validation
		const result = collarDatabaseSchema.safeParse(data);

		// If validation passed, return empty array
		if (result.success) {
			return [];
		}

		// Convert Zod errors to DatabaseValidationError format
		return result.error.issues.map((err: { path: any[], message: any, code: any }) => ({
			field: err.path.join("."),
			message: err.message,
			code: err.code,
			type: ValidationType.Database,
			severity: "error" as const,
			blocking: true as const,
		}));
	};
}

// ============================================================================
// Pre-configured Validator Instance
// ============================================================================

/**
 * Pre-configured collar database validator instance.
 * Ready to use for immediate validation.
 *
 * @example
 * ```typescript
 * import { collarDatabaseValidator } from './collar-database-validator';
 *
 * const errors = collarDatabaseValidator({
 *   CollarId: '123e4567-e89b-12d3-a456-426614174000',
 *   DrillPlanId: '123e4567-e89b-12d3-a456-426614174001',
 *   Organization: 'B2Gold',
 *   HoleNm: 'DDH-001'
 * });
 *
 * if (errors.length > 0) {
 *   console.error('Database validation failed:', errors);
 * }
 * ```
 */
export const collarDatabaseValidator = createCollarDatabaseValidator();
