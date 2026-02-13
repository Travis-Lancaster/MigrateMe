/**
 * Two-Tier Validation Type System
 *
 * This module defines a two-tier validation system for drillhole data:
 *
 * 1. **Database Validation** (Hard Validation):
 *    - Enforces data integrity constraints (required fields, data types, foreign keys)
 *    - BLOCKS save operations when validation fails
 *    - Used for fundamental data quality that must be met before persisting to database
 *    - Examples: Required fields, valid foreign keys, data type constraints
 *
 * 2. **Save Validation** (Soft Validation):
 *    - Enforces business rules and data quality checks
 *    - ALLOWS save but warns user about issues
 *    - Used for best practices, recommendations, and non-critical quality checks
 *    - Examples: Recommended ranges, formatting preferences, business logic warnings
 *
 * Usage:
 * - Database validation must pass (canSave = true) before data can be persisted
 * - Save validation provides feedback but doesn't block operations
 * - validationStatus maps to StandardRowMetadata: 0=Unknown, 1=Passed, 2=Failed
 */

// ============================================================================
// Validation Type Enum
// ============================================================================

/**
 * Defines the type of validation being performed.
 * Determines whether validation errors block save operations.
 */
export enum ValidationType {
	/**
	 * Hard validation - enforces data integrity constraints.
	 * Validation failures BLOCK save operations.
	 * Used for: Required fields, data types, foreign keys, fundamental constraints.
	 */
	Database = "database",

	/**
	 * Soft validation - enforces business rules and quality checks.
	 * Validation failures ALLOW save but show warnings.
	 * Used for: Business logic, recommended ranges, formatting, quality suggestions.
	 */
	Save = "save",
}

// ============================================================================
// Extended Validation Error Interface
// ============================================================================

/**
 * Extended validation error with type, severity, and blocking indicators.
 * Extends the base ValidationError from drillhole.ts types.
 */
export interface ValidationError {
	/** Field name that failed validation */
	field: string

	/** Human-readable error message */
	message: string

	/** Optional error code for programmatic handling */
	code?: string

	/** Type of validation that produced this error */
	type: ValidationType

	/** Severity level of the error */
	severity: "error" | "warning"

	/** Whether this error blocks save operations */
	blocking: boolean
}

// ============================================================================
// Database Validation Error
// ============================================================================

/**
 * Database validation error - represents hard validation failures.
 * These errors BLOCK save operations and must be resolved before persisting data.
 *
 * Characteristics:
 * - type: ValidationType.Database
 * - severity: 'error' (always)
 * - blocking: true (always)
 *
 * @example
 * ```typescript
 * const dbError: DatabaseValidationError = {
 *   field: 'HoleID',
 *   message: 'HoleID is required',
 *   code: 'REQUIRED_FIELD',
 *   type: ValidationType.Database,
 *   severity: 'error',
 *   blocking: true
 * };
 * ```
 */
export interface DatabaseValidationError extends ValidationError {
	type: ValidationType.Database
	severity: "error"
	blocking: true
}

// ============================================================================
// Save Validation Error
// ============================================================================

/**
 * Save validation error - represents soft validation failures.
 * These errors ALLOW save but provide warnings or recommendations to the user.
 *
 * Characteristics:
 * - type: ValidationType.Save
 * - severity: 'warning' | 'error' (user can choose emphasis level)
 * - blocking: false (always)
 *
 * @example
 * ```typescript
 * const saveWarning: SaveValidationError = {
 *   field: 'Depth',
 *   message: 'Depth exceeds typical range for this project',
 *   code: 'DEPTH_OUT_OF_RANGE',
 *   type: ValidationType.Save,
 *   severity: 'warning',
 *   blocking: false
 * };
 * ```
 */
export interface SaveValidationError extends ValidationError {
	type: ValidationType.Save
	severity: "warning" | "error"
	blocking: false
}

// ============================================================================
// Two-Tier Validation Result
// ============================================================================

/**
 * Comprehensive validation result containing both database and save validation results.
 *
 * Structure:
 * - database: Hard validation results that block save
 * - save: Soft validation results that warn but don't block
 * - canSave: Computed flag - true only if database.isValid === true
 * - validationStatus: Maps to StandardRowMetadata.ValidationStatus (0=Unknown, 1=Passed, 2=Failed)
 *
 * Validation Flow:
 * 1. Run database validation first
 * 2. If database validation fails (isValid=false), canSave=false and validationStatus=2
 * 3. If database validation passes, run save validation
 * 4. Save validation results are informational only
 * 5. canSave is true as long as database validation passes
 *
 * @example
 * ```typescript
 * // All validations pass
 * const cleanResult: TwoTierValidationResult = {
 *   database: {
 *     isValid: true,
 *     errors: []
 *   },
 *   save: {
 *     isValid: true,
 *     errors: [],
 *     warnings: []
 *   },
 *   canSave: true,
 *   validationStatus: 1
 * };
 *
 * // Database validation fails - blocks save
 * const blockedResult: TwoTierValidationResult = {
 *   database: {
 *     isValid: false,
 *     errors: [{
 *       field: 'HoleID',
 *       message: 'HoleID is required',
 *       type: ValidationType.Database,
 *       severity: 'error',
 *       blocking: true
 *     }]
 *   },
 *   save: {
 *     isValid: true,
 *     errors: [],
 *     warnings: []
 *   },
 *   canSave: false,  // Blocked by database validation
 *   validationStatus: 2
 * };
 *
 * // Database passes, save has warnings - allows save
 * const warningResult: TwoTierValidationResult = {
 *   database: {
 *     isValid: true,
 *     errors: []
 *   },
 *   save: {
 *     isValid: false,
 *     errors: [],
 *     warnings: [{
 *       field: 'Depth',
 *       message: 'Depth exceeds typical range',
 *       type: ValidationType.Save,
 *       severity: 'warning',
 *       blocking: false
 *     }]
 *   },
 *   canSave: true,  // Allowed despite save warnings
 *   validationStatus: 1  // Considered passed since database validation passed
 * };
 * ```
 */
export interface TwoTierValidationResult {
	/**
	 * Database (hard) validation results.
	 * If isValid=false, save operation is blocked.
	 */
	database: {
		/** Whether database validation passed */
		isValid: boolean

		/** List of database validation errors (blocking) */
		errors: DatabaseValidationError[]
	}

	/**
	 * Save (soft) validation results.
	 * Provides warnings and recommendations but doesn't block save.
	 */
	save: {
		/** Whether save validation passed (informational only) */
		isValid: boolean

		/** List of save validation errors (non-blocking but may be shown as errors) */
		errors: SaveValidationError[]

		/** List of save validation warnings (non-blocking, shown as warnings) */
		warnings: SaveValidationError[]
	}

	/**
	 * Computed flag indicating whether save operation can proceed.
	 * true ONLY if database.isValid === true
	 * Save validation results do not affect this flag.
	 */
	canSave: boolean

	/**
	 * Overall validation status for StandardRowMetadata.ValidationStatus field.
	 * - 0: Unknown (validation not yet performed)
	 * - 1: Passed (database validation passed)
	 * - 2: Failed (database validation failed)
	 *
	 * Note: This status is based on database validation only.
	 * Save validation warnings don't affect this status.
	 */
	validationStatus: 0 | 1 | 2
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Type guard to check if a validation error is a database validation error.
 */
export function isDatabaseValidationError(error: ValidationError): error is DatabaseValidationError {
	return error.type === ValidationType.Database;
}

/**
 * Type guard to check if a validation error is a save validation error.
 */
export function isSaveValidationError(error: ValidationError): error is SaveValidationError {
	return error.type === ValidationType.Save;
}

// ============================================================================
// Validation Result Helpers
// ============================================================================

/**
 * Creates an empty two-tier validation result (all validations passed).
 * Useful for initialization or when no validation errors exist.
 */
export function createEmptyValidationResult(): TwoTierValidationResult {
	return {
		database: {
			isValid: true,
			errors: [],
		},
		save: {
			isValid: true,
			errors: [],
			warnings: [],
		},
		canSave: true,
		validationStatus: 1,
	};
}

/**
 * Creates a validation result from separate database and save errors.
 * Automatically computes canSave and validationStatus based on database errors.
 *
 * @param databaseErrors - Array of database validation errors
 * @param saveErrors - Array of save validation errors (shown as errors)
 * @param saveWarnings - Array of save validation warnings (shown as warnings)
 * @returns Complete two-tier validation result
 */
export function createValidationResult(
	databaseErrors: DatabaseValidationError[] = [],
	saveErrors: SaveValidationError[] = [],
	saveWarnings: SaveValidationError[] = [],
): TwoTierValidationResult {
	const databaseIsValid = databaseErrors.length === 0;
	const saveIsValid = saveErrors.length === 0 && saveWarnings.length === 0;

	return {
		database: {
			isValid: databaseIsValid,
			errors: databaseErrors,
		},
		save: {
			isValid: saveIsValid,
			errors: saveErrors,
			warnings: saveWarnings,
		},
		canSave: databaseIsValid,
		validationStatus: databaseIsValid ? 1 : 2,
	};
}

/**
 * Merges multiple validation results into a single result.
 * Combines all errors and warnings, recomputes canSave and validationStatus.
 *
 * @param results - Array of validation results to merge
 * @returns Merged validation result
 */
export function mergeValidationResults(results: TwoTierValidationResult[]): TwoTierValidationResult {
	const allDatabaseErrors = results.flatMap(r => r.database.errors);
	const allSaveErrors = results.flatMap(r => r.save.errors);
	const allSaveWarnings = results.flatMap(r => r.save.warnings);

	return createValidationResult(allDatabaseErrors, allSaveErrors, allSaveWarnings);
}
