/**
 * Base Zod Validation Schemas for DrillHole Sections
 *
 * Simplified, reusable schemas following KISS principles.
 * Uses industry-standard bounds from constants.ts
 */

import { z } from "zod";
import {
	ANGLE_BOUNDS,
	DEPTH_BOUNDS,
	PERCENTAGE_BOUNDS,
	STRING_LENGTHS,
} from "./constants";

// ============================================================================
// Core Field Schemas
// ============================================================================

/** UUID validation */
export const uuid = z.string().uuid("Invalid UUID format");

/** Depth value (non-negative, max 5000m) */
export const depthSchema = z
	.number()
	.nonnegative("Depth cannot be negative")
	.max(DEPTH_BOUNDS.MAX, `Depth cannot exceed ${DEPTH_BOUNDS.MAX}m`);

/** Azimuth angle (0-360°) */
export const azimuthSchema = z
	.number()
	.min(ANGLE_BOUNDS.AZIMUTH.min)
	.max(ANGLE_BOUNDS.AZIMUTH.max, "Azimuth must be between 0 and 360 degrees");

/** Dip angle (-90 to 90°) */
export const dipSchema = z
	.number()
	.min(ANGLE_BOUNDS.DIP.min, "Dip must be between -90 and 90 degrees")
	.max(ANGLE_BOUNDS.DIP.max, "Dip must be between -90 and 90 degrees");

/** Alpha angle (0-90°) */
export const alphaSchema = z
	.number()
	.min(ANGLE_BOUNDS.ALPHA.min)
	.max(ANGLE_BOUNDS.ALPHA.max, "Alpha must be between 0 and 90 degrees");

/** Strike angle (0-360°) */
export const strikeSchema = azimuthSchema; // Same range as azimuth

/** Coordinate value (finite number) */
export const coordinateSchema = z
	.number()
	.finite("Coordinate must be a valid number");

/** Standard percentage (0-100%) */
export const percentageSchema = z
	.number()
	.min(PERCENTAGE_BOUNDS.STANDARD.min, "Percentage cannot be negative")
	.max(PERCENTAGE_BOUNDS.STANDARD.max, "Percentage cannot exceed 100%");

/** Recovery percentage (0-110%, allows core swelling) */
export const recoveryPercentageSchema = z
	.number()
	.min(PERCENTAGE_BOUNDS.RECOVERY.min)
	.max(PERCENTAGE_BOUNDS.RECOVERY.max, "Recovery cannot exceed 110%");

// ============================================================================
// Date/Time Schemas
// ============================================================================

/** ISO datetime string */
export const isoDateTime = z.string().datetime({ offset: true });

/** Optional ISO datetime */
export const isoDateTimeOptional = z.string().datetime({ offset: true }).optional().nullable();

/** Date that cannot be in the future (for historical data) */
export const dateNotFuture = z
	.string()
	.datetime({ offset: true })
	.refine(
		date => new Date(date) <= new Date(),
		{ message: "Date cannot be in the future" },
	);

/** Optional date that cannot be in the future */
export const dateNotFutureOptional = dateNotFuture.optional().nullable();

// ============================================================================
// String Schemas
// ============================================================================

/** String with max length from constants */
export const nvarchar = (max: number) => z.string().max(max);

/** Optional string with max length */
export const nvarcharOptional = (max: number) => z.string().max(max).optional().nullable();

/** Generic optional string */
export const stringOptional = z.string().optional().nullable();

/** Organization code (30 chars) */
export const organizationSchema = z
	.string()
	.min(1, "Organization is required")
	.max(STRING_LENGTHS.ORGANIZATION);

/** Comments (short - 1000 chars) */
export const commentsShort = z
	.string()
	.max(STRING_LENGTHS.COMMENTS_SHORT, `Comments cannot exceed ${STRING_LENGTHS.COMMENTS_SHORT} characters`)
	.optional()
	.nullable();

/** Comments (long - 5000 chars) */
export const commentsLong = z
	.string()
	.max(STRING_LENGTHS.COMMENTS_LONG, `Comments cannot exceed ${STRING_LENGTHS.COMMENTS_LONG} characters`)
	.optional()
	.nullable();

/** Data source (255 chars) */
export const dataSourceSchema = z
	.string()
	.min(1, "Data source is required")
	.max(STRING_LENGTHS.DATA_SOURCE);

/** Lookup code (50 chars) */
export const lookupCode = z
	.string()
	.max(STRING_LENGTHS.LOOKUP_CODE);

/** Optional lookup code */
export const lookupCodeOptional = lookupCode.optional().nullable();

// ============================================================================
// Refinement Helpers
// ============================================================================

/**
 * Refinement: DepthTo must be greater than DepthFrom
 * Use with .refine() on schemas with DepthFrom/DepthTo fields
 */
export function depthIntervalRefinement(data: { DepthFrom?: number, DepthTo?: number }) {
	if (data.DepthFrom !== undefined && data.DepthTo !== undefined) {
		return data.DepthTo > data.DepthFrom;
	}
	return true;
}

/**
 * Refinement: Date range validation (end >= start)
 * Use with .refine() on schemas with date range fields
 */
export function dateRangeRefinement(startDate?: string, endDate?: string) {
	if (!startDate || !endDate)
		return true;
	return new Date(endDate) >= new Date(startDate);
}

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

/** @deprecated Use lookupCode instead */
export function createLookupSchema(fieldName: string, required = false) {
	const schema = z.string().max(50, `${fieldName} must be 50 characters or less`);
	return required ? schema.min(1, `${fieldName} is required`) : schema.optional();
}
