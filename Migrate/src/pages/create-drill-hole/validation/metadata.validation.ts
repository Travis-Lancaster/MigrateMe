/**
 * MetaDataLog Section Validation
 *
 * Two-tier validation: Database (hard/blocking) + Save (soft/warnings)
 *
 * References:
 * - MiningDb7/DrillHole.MetaDataLog.Table.sql
 * - constraint-error-messages.ts (MetaData constraints)
 */

import { z } from "zod";
import { lookupCodeOptional, uuid } from "./base-schemas";
import { DEPTH_BOUNDS } from "./constants";

// ============================================================================
// Database Schema (Hard Validation - Blocks Save)
// ============================================================================

/**
 * Database-level validation for MetaDataLog section
 * Enforces SQL constraints and referential integrity
 * Validation failures BLOCK save operations
 */
export const metadataLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	MetaDataLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),

	// Required depth interval
	DepthFrom: z.number()
		.nonnegative("Depth From cannot be negative")
		.max(DEPTH_BOUNDS.MAX),

	DepthTo: z.number()
		.nonnegative("Depth To cannot be negative")
		.max(DEPTH_BOUNDS.MAX),

	// Casing depth
	CasingDepth: z.number()
		.nonnegative("Casing depth cannot be negative")
		.optional()
		.nullable(),

	// Drill method
	DrillMethod: lookupCodeOptional,
	DrillCompany: lookupCodeOptional,
})
// CK_MetaData_DepthFrom_DepthTo: DepthFrom <= DepthTo
	.refine(
		data => data.DepthTo >= data.DepthFrom,
		{
			message: "Depth To must be greater than or equal to Depth From",
			path: ["DepthTo"],
		},
	)
// CK_MetaData_CasingDepth: CasingDepth between DepthFrom and DepthTo
	.refine(
		(data) => {
			if (data.CasingDepth != null) {
				return data.CasingDepth >= data.DepthFrom && data.CasingDepth <= data.DepthTo;
			}
			return true;
		},
		{
			message: "Casing depth must be between Depth From and Depth To",
			path: ["CasingDepth"],
		},
	);

// ============================================================================
// Save Schema (Soft Validation - Warnings Only)
// ============================================================================

/**
 * Save-level validation for MetaDataLog section
 * Data quality checks and business rule recommendations
 * Validation failures DO NOT block save operations
 */
export const metadataLogSaveSchema = z.object({
	DepthFrom: z.number().optional().nullable(),
	DepthTo: z.number().optional().nullable(),
	CasingDepth: z.number().optional().nullable(),
	DrillMethod: z.string().optional().nullable(),
})
// Warn if interval length is very long
	.refine(
		(data) => {
			if (data.DepthFrom != null && data.DepthTo != null) {
				const intervalLength = data.DepthTo - data.DepthFrom;
				return intervalLength <= 100; // 100m warning
			}
			return true;
		},
		{
			message: "Metadata interval exceeds 100m - consider more detailed logging",
			path: ["DepthTo"],
		},
	)
// Warn if casing depth is very deep
	.refine(
		(data) => {
			if (data.CasingDepth != null) {
				return data.CasingDepth <= 1000; // 1000m warning
			}
			return true;
		},
		{
			message: "Casing depth exceeds 1000m - verify deep casing",
			path: ["CasingDepth"],
		},
	)
// Recommend drill method is specified
	.refine(
		data => data.DrillMethod != null,
		{
			message: "Drill method recommended for metadata completeness",
			path: ["DrillMethod"],
		},
	);

// ============================================================================
// Type Exports
// ============================================================================

/**
 * TypeScript type for MetaDataLog data
 * Combines required database fields with optional save fields
 */
export type MetaDataLogData = z.infer<typeof metadataLogDatabaseSchema>
  & Partial<z.infer<typeof metadataLogSaveSchema>>;

/**
 * Type for database validation only
 */
export type MetaDataLogDatabaseData = z.infer<typeof metadataLogDatabaseSchema>;

/**
 * Type for save validation only
 */
export type MetaDataLogSaveData = z.infer<typeof metadataLogSaveSchema>;
