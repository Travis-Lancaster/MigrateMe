/**
 * Collar Save Validator
 *
 * Business-rule (soft) validation for Collar section.
 * Validates data quality and business logic but DOES NOT block save operations.
 *
 * Soft Validations:
 * - TotalDepth: Warning if missing (data quality recommendation)
 * - TotalDepth: Error if negative (business rule violation)
 * - TotalDepth: Warning if > 10000 (unusual value requiring verification)
 * - StartedOnDt vs FinishedOnDt: Error if FinishedOnDt < StartedOnDt
 * - Azimuth: Warning if outside 0-360 range
 *
 * These validations provide feedback and recommendations but allow save to proceed.
 * Users see warnings/errors but can choose to save anyway.
 */

import type { SaveValidationError } from "../../../types/validation";
import type { CollarData } from "./collar-schemas";
import { ValidationType } from "../../../types/validation";

// ============================================================================
// Save Validator Function Type
// ============================================================================

/**
 * Generic save validator function type.
 * Takes data and returns array of save validation errors/warnings.
 *
 * @template T - The data type being validated
 */
export type SaveValidatorFunction<T> = (data: Partial<T>) => SaveValidationError[];

// ============================================================================
// Business Rule Constants
// ============================================================================

/**
 * Maximum reasonable total depth for a drill hole (in meters).
 * Values exceeding this trigger a warning for verification.
 */
const MAX_REASONABLE_DEPTH = 10000;

/**
 * Valid azimuth range boundaries
 */
const MIN_AZIMUTH = 0;
const MAX_AZIMUTH = 360;

// ============================================================================
// Collar Save Validator Factory
// ============================================================================

/**
 * Creates a save validator function for Collar data.
 *
 * Validates business rules and data quality checks:
 * - Recommended fields that improve data quality
 * - Business logic constraints
 * - Unusual value detection
 * - Date consistency checks
 *
 * Returns an array of SaveValidationError objects. Empty array means all checks passed.
 * Unlike database validation, these errors/warnings DO NOT block save operations.
 *
 * @returns Save validator function for Collar data
 *
 * @example
 * ```typescript
 * const validator = createCollarSaveValidator();
 *
 * // Data with warnings but allowed to save
 * const errors = validator({
 *   CollarId: '123e4567-e89b-12d3-a456-426614174000',
 *   TotalDepth: 15000, // Warning: exceeds reasonable depth
 *   StartedOnDt: '2024-01-15T10:00:00Z',
 *   FinishedOnDt: '2024-01-10T10:00:00Z' // Error: finished before started
 * });
 *
 * // errors array contains warnings/errors but save can still proceed
 * console.log(errors.length > 0); // true
 * console.log(errors[0].blocking); // false
 * ```
 */
export function createCollarSaveValidator(): SaveValidatorFunction<CollarData> {
	return (data: Partial<CollarData>): SaveValidationError[] => {
		const errors: SaveValidationError[] = [];

		// ========================================================================
		// 1. TotalDepth: Warning if missing (data quality)
		// ========================================================================
		if (data.TotalDepth === null || data.TotalDepth === undefined) {
			errors.push({
				field: "TotalDepth",
				message: "Total Depth is recommended for complete records",
				code: "MISSING_TOTAL_DEPTH",
				type: ValidationType.Save,
				severity: "warning",
				blocking: false,
			});
		}
		else {
			// ======================================================================
			// 2. TotalDepth: Error if negative
			// ======================================================================
			if (data.TotalDepth < 0) {
				errors.push({
					field: "TotalDepth",
					message: "Total Depth cannot be negative",
					code: "NEGATIVE_TOTAL_DEPTH",
					type: ValidationType.Save,
					severity: "error",
					blocking: false,
				});
			}

			// ======================================================================
			// 3. TotalDepth: Warning if > 10000 (unusual, please verify)
			// ======================================================================
			if (data.TotalDepth > MAX_REASONABLE_DEPTH) {
				errors.push({
					field: "TotalDepth",
					message: `Total Depth exceeds ${MAX_REASONABLE_DEPTH}m. Please verify this unusual value.`,
					code: "EXCESSIVE_TOTAL_DEPTH",
					type: ValidationType.Save,
					severity: "warning",
					blocking: false,
				});
			}
		}

		// ========================================================================
		// 4. StartedOnDt vs FinishedOnDt: Error if FinishedOnDt < StartedOnDt
		// ========================================================================
		if (data.StartedOnDt && data.FinishedOnDt) {
			const startDate = new Date(data.StartedOnDt);
			const finishDate = new Date(data.FinishedOnDt);

			// Check if dates are valid
			if (!isNaN(startDate.getTime()) && !isNaN(finishDate.getTime())) {
				if (finishDate < startDate) {
					errors.push({
						field: "FinishedOnDt",
						message: "Finished date cannot be earlier than Started date",
						code: "INVALID_DATE_RANGE",
						type: ValidationType.Save,
						severity: "error",
						blocking: false,
					});
				}
			}
		}

		// ========================================================================
		// 5. Azimuth: Warning if outside 0-360 range
		// ========================================================================
		// Note: Azimuth is not in the current CollarData schema but included
		// for future compatibility and as per requirements
		if ("Azimuth" in data) {
			const azimuth = (data as any).Azimuth;
			if (typeof azimuth === "number") {
				if (azimuth < MIN_AZIMUTH || azimuth > MAX_AZIMUTH) {
					errors.push({
						field: "Azimuth",
						message: `Azimuth should be between ${MIN_AZIMUTH}° and ${MAX_AZIMUTH}°`,
						code: "AZIMUTH_OUT_OF_RANGE",
						type: ValidationType.Save,
						severity: "warning",
						blocking: false,
					});
				}
			}
		}

		return errors;
	};
}

// ============================================================================
// Pre-configured Validator Instance
// ============================================================================

/**
 * Pre-configured collar save validator instance.
 * Ready to use for immediate validation.
 *
 * @example
 * ```typescript
 * import { collarSaveValidator } from './collar-save-validator';
 *
 * const errors = collarSaveValidator({
 *   TotalDepth: -100, // Error: negative depth
 *   StartedOnDt: '2024-01-15T10:00:00Z',
 *   FinishedOnDt: '2024-01-10T10:00:00Z' // Error: date inconsistency
 * });
 *
 * if (errors.length > 0) {
 *   // Show warnings/errors to user but allow save
 *   errors.forEach(err => {
 *     console.log(`${err.severity.toUpperCase()}: ${err.message}`);
 *   });
 * }
 * ```
 */
export const collarSaveValidator = createCollarSaveValidator();
