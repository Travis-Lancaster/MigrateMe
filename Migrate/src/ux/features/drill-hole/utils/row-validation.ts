/**
 * Row Validation Utilities
 *
 * Provides row-level validation for grid sections using Zod schemas.
 * Similar to form validation but for individual grid rows.
 *
 * Key Features:
 * - Validates individual rows using Zod schemas
 * - Sets ValidationStatus (0=Unknown, 1=Passed, 2=Failed)
 * - Sets ValidationErrors (JSON string of error details)
 * - Batch validation for entire grids
 *
 * @example Single Row Validation
 * ```typescript
 * const validation = validateDrillMethodRow(rowData);
 * const updatedRow = {
 *   ...rowData,
 *   ValidationStatus: validation.validationStatus,
 *   ValidationErrors: validation.validationErrors
 * };
 * ```
 *
 * @example Grid Validation
 * ```typescript
 * const result = validateDrillMethodGrid(gridData);
 * if (result.hasErrors) {
 *   console.warn(`${result.errorCount} rows have validation errors`);
 * }
 * updateGridData(result.rows);
 * ```
 */

import type { ZodIssue } from "zod";
import type { ValidationError } from "../types/validation";
import type { DrillMethodData } from "../validation/drill-method-schemas";
import { ValidationType } from "../types/validation";
import { drillMethodSchema } from "../validation/drill-method-schemas";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Result of validating a single row
 */
export interface RowValidationResult {
	/** Whether the row passed validation */
	isValid: boolean

	/** Array of validation errors (if any) */
	errors: ValidationError[]

	/** Validation status for StandardRowMetadata (0=Unknown, 1=Passed, 2=Failed) */
	validationStatus: 0 | 1 | 2

	/** JSON string of errors for ValidationErrors field (null if valid) */
	validationErrors: string | null
}

/**
 * Result of validating an entire grid
 */
export interface GridValidationResult<T> {
	/** Grid data with ValidationStatus and ValidationErrors set on each row */
	rows: T[]

	/** Whether any rows have validation errors */
	hasErrors: boolean

	/** Number of rows with validation errors */
	errorCount: number

	/** Array of row indices that have errors */
	errorRowIndices: number[]
}

// ============================================================================
// Zod to ValidationError Conversion
// ============================================================================

/**
 * Converts Zod validation issues to ValidationError format
 */
function zodIssuesToValidationErrors(issues: ZodIssue[]): ValidationError[] {
	return issues.map(issue => ({
		field: issue.path.join("."),
		message: issue.message,
		code: issue.code,
		type: ValidationType.Database,
		severity: "error" as const,
		blocking: true as const,
	}));
}

// ============================================================================
// DrillMethod Row Validation
// ============================================================================

/**
 * Validates a single DrillMethod row using Zod schema
 *
 * @param row - DrillMethod row data to validate
 * @returns Validation result with status and errors
 *
 * @example
 * ```typescript
 * const validation = validateDrillMethodRow(rowData);
 * if (!validation.isValid) {
 *   console.error('Validation errors:', validation.errors);
 * }
 * ```
 */
export function validateDrillMethodRow(row: DrillMethodData): RowValidationResult {
	const result = drillMethodSchema.safeParse(row);

	if (result.success) {
		return {
			isValid: true,
			errors: [],
			validationStatus: 1,
			validationErrors: null,
		};
	}

	const errors = zodIssuesToValidationErrors(result.error.issues);

	return {
		isValid: false,
		errors,
		validationStatus: 2,
		validationErrors: JSON.stringify(errors),
	};
}

/**
 * Validates all rows in a DrillMethod grid
 *
 * Updates each row with ValidationStatus and ValidationErrors fields.
 * Does not modify rows that are soft-deleted (ActiveInd = false).
 *
 * @param rows - Array of DrillMethod rows to validate
 * @returns Grid validation result with updated rows and error summary
 *
 * @example
 * ```typescript
 * const result = validateDrillMethodGrid(gridData);
 * if (result.hasErrors) {
 *   message.warning(`${result.errorCount} rows have validation errors`);
 * }
 * updateGridData(result.rows);
 * ```
 */
export function validateDrillMethodGrid(rows: DrillMethodData[]): GridValidationResult<DrillMethodData> {
	let errorCount = 0;
	const errorRowIndices: number[] = [];

	const validatedRows = rows.map((row, index) => {
		// Skip validation for soft-deleted rows
		if (row.ActiveInd === false) {
			return row;
		}

		const validation = validateDrillMethodRow(row);

		if (!validation.isValid) {
			errorCount++;
			errorRowIndices.push(index);
		}

		return {
			...row,
			ValidationStatus: validation.validationStatus,
			ValidationErrors: validation.validationErrors,
		};
	});

	return {
		rows: validatedRows,
		hasErrors: errorCount > 0,
		errorCount,
		errorRowIndices,
	};
}

// ============================================================================
// Generic Grid Validation (for reuse with other grid sections)
// ============================================================================

/**
 * Generic grid row validator that can be used with any Zod schema
 *
 * @param row - Row data to validate
 * @param schema - Zod schema to validate against
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const validation = validateGridRow(sampleRow, sampleSchema);
 * ```
 */
export function validateGridRow<T>(
	row: T,
	schema: { safeParse: (data: unknown) => { success: boolean, error?: { issues: ZodIssue[] } } },
): RowValidationResult {
	const result = schema.safeParse(row);

	if (result.success) {
		return {
			isValid: true,
			errors: [],
			validationStatus: 1,
			validationErrors: null,
		};
	}

	const errors = zodIssuesToValidationErrors(result.error!.issues);

	return {
		isValid: false,
		errors,
		validationStatus: 2,
		validationErrors: JSON.stringify(errors),
	};
}

// ============================================================================
// Cross-Row Validation (Intervals, Gaps, Total Depth)
// ============================================================================

/**
 * Cross-row validation context
 */
export interface CrossRowValidationContext {
	/** Total depth from collar (for final depth check) */
	totalDepth?: number | null

	/** Tolerance for depth matching (e.g., 0.01m = 1cm) */
	depthTolerance?: number
}

/**
 * Cross-row validation error for a single row
 */
export interface CrossRowError {
	/** Row index where error occurs (in sorted array) */
	rowIndex: number

	/** Row ID (DrillMethodId) */
	rowId: string

	/** Error message */
	message: string

	/** Field name related to error */
	field: "DepthFrom" | "DepthTo"

	/** Type of cross-row error */
	type: "gap" | "overlap" | "totalDepth"
}

/**
 * Validates DrillMethod intervals for gaps, overlaps, and total depth
 *
 * Checks:
 * - No gaps between adjacent intervals (DepthTo[n] should equal DepthFrom[n+1])
 * - No overlaps between intervals
 * - Final interval's DepthTo should match Collar.TotalDepth
 *
 * @param rows - Array of DrillMethod rows (will be sorted internally)
 * @param context - Validation context (totalDepth, tolerance)
 * @returns Cross-row validation result with errors
 *
 * @example
 * ```typescript
 * const result = validateDrillMethodIntervals(gridData, {
 *   totalDepth: 50.00,
 *   depthTolerance: 0.01
 * });
 * if (result.hasErrors) {
 *   console.warn('Interval issues:', result.errors);
 * }
 * ```
 */
export function validateDrillMethodIntervals(
	rows: DrillMethodData[],
	context: CrossRowValidationContext = {},
): {
	errors: CrossRowError[]
	hasErrors: boolean
} {
	const errors: CrossRowError[] = [];
	const tolerance = context.depthTolerance || 0.001; // 1mm default tolerance

	// Filter and sort active rows by DepthFrom
	const activeRows = rows
		.filter(r => r.ActiveInd !== false && r.DrillMethodId)
		.sort((a, b) => (a.DepthFrom || 0) - (b.DepthFrom || 0));

	if (activeRows.length === 0) {
		return { errors: [], hasErrors: false };
	}

	// Check for gaps/overlaps between adjacent rows
	for (let i = 0; i < activeRows.length - 1; i++) {
		const currentRow = activeRows[i];
		const nextRow = activeRows[i + 1];

		const currentDepthTo = currentRow.DepthTo || 0;
		const nextDepthFrom = nextRow.DepthFrom || 0;

		const diff = nextDepthFrom - currentDepthTo;

		if (Math.abs(diff) > tolerance) {
			if (diff > 0) {
				// Gap detected
				errors.push({
					rowIndex: i + 1,
					rowId: nextRow.DrillMethodId,
					message: `Gap detected: previous interval ended at ${currentDepthTo.toFixed(2)}m, this interval starts at ${nextDepthFrom.toFixed(2)}m`,
					field: "DepthFrom",
					type: "gap",
				});
			}
			else {
				// Overlap detected
				errors.push({
					rowIndex: i + 1,
					rowId: nextRow.DrillMethodId,
					message: `Overlap detected: previous interval ended at ${currentDepthTo.toFixed(2)}m, this interval starts at ${nextDepthFrom.toFixed(2)}m`,
					field: "DepthFrom",
					type: "overlap",
				});
			}
		}
	}

	// Check final depth against collar total depth
	if (context.totalDepth != null && context.totalDepth > 0) {
		const lastRow = activeRows[activeRows.length - 1];
		const lastDepthTo = lastRow.DepthTo || 0;
		const diff = lastDepthTo - context.totalDepth;

		if (Math.abs(diff) > tolerance) {
			const verb = lastDepthTo < context.totalDepth ? "doesn't reach" : "exceeds";
			errors.push({
				rowIndex: activeRows.length - 1,
				rowId: lastRow.DrillMethodId,
				message: `Final depth ${verb} collar total depth: ${lastDepthTo.toFixed(2)}m vs ${context.totalDepth.toFixed(2)}m`,
				field: "DepthTo",
				type: "totalDepth",
			});
		}
	}

	return {
		errors,
		hasErrors: errors.length > 0,
	};
}

/**
 * Merge cross-row errors into row validation results
 *
 * Takes cross-row errors (gaps, overlaps, total depth) and merges them into
 * the row's ValidationStatus and ValidationErrors fields.
 *
 * @param rows - Array of DrillMethod rows
 * @param crossRowErrors - Array of cross-row errors to merge
 * @returns Updated rows with merged validation errors
 *
 * @example
 * ```typescript
 * const crossRowResult = validateDrillMethodIntervals(rows, { totalDepth: 50 });
 * const updatedRows = mergeCrossRowErrors(rows, crossRowResult.errors);
 * ```
 */
export function mergeCrossRowErrors(
	rows: DrillMethodData[],
	crossRowErrors: CrossRowError[],
): DrillMethodData[] {
	// Create a map of row ID to cross-row errors
	const errorMap = new Map<string, CrossRowError[]>();
	crossRowErrors.forEach((err) => {
		const existing = errorMap.get(err.rowId) || [];
		existing.push(err);
		errorMap.set(err.rowId, existing);
	});

	// Update rows with cross-row errors
	return rows.map((row) => {
		const crossErrors = errorMap.get(row.DrillMethodId) || [];

		if (crossErrors.length === 0) {
			return row;
		}

		// Parse existing ValidationErrors
		let existingErrors: ValidationError[] = [];
		if (row.ValidationErrors) {
			try {
				existingErrors = JSON.parse(row.ValidationErrors);
			}
			catch (e) {
				console.warn("[mergeCrossRowErrors] Failed to parse ValidationErrors:", e);
			}
		}

		// Convert cross-row errors to ValidationError format
		const newErrors: ValidationError[] = crossErrors.map(err => ({
			field: err.field,
			message: err.message,
			code: `CROSS_ROW_${err.type.toUpperCase()}`,
			type: ValidationType.Save, // Cross-row = soft validation
			severity: "warning" as const,
			blocking: false as const,
		}));

		// Merge errors (cross-row errors appended to existing)
		const allErrors = [...existingErrors, ...newErrors];

		// Update ValidationStatus if cross-row errors exist
		// Keep existing status if it's already failed (2)
		const validationStatus = row.ValidationStatus === 2
			? 2
			: (newErrors.length > 0 ? 2 : row.ValidationStatus);

		return {
			...row,
			ValidationStatus: validationStatus,
			ValidationErrors: JSON.stringify(allErrors),
		};
	});
}

/**
 * Generic grid validator that can be used with any schema
 *
 * @param rows - Array of rows to validate
 * @param schema - Zod schema to validate against
 * @param isActiveRow - Optional function to determine if row should be validated
 * @returns Grid validation result
 */
export function validateGrid<T extends { ActiveInd?: boolean }>(
	rows: T[],
	schema: { safeParse: (data: unknown) => { success: boolean, error?: { issues: ZodIssue[] } } },
	isActiveRow: (row: T) => boolean = row => row.ActiveInd !== false,
): GridValidationResult<T> {
	let errorCount = 0;
	const errorRowIndices: number[] = [];

	const validatedRows = rows.map((row, index) => {
		// Skip validation for inactive rows
		if (!isActiveRow(row)) {
			return row;
		}

		const validation = validateGridRow(row, schema);

		if (!validation.isValid) {
			errorCount++;
			errorRowIndices.push(index);
		}

		return {
			...row,
			ValidationStatus: validation.validationStatus,
			ValidationErrors: validation.validationErrors,
		} as T;
	});

	return {
		rows: validatedRows,
		hasErrors: errorCount > 0,
		errorCount,
		errorRowIndices,
	};
}
