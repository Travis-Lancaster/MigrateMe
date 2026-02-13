/**
 * Collar Section Validation
 *
 * Two-tier validation: Database (hard/blocking) + Save (soft/warnings)
 *
 * References:
 * - MiningDb7/DrillHole.Collar.Table.sql
 * - constraint-error-messages.ts (Collar constraints)
 */

import { z } from "zod";
import { lookupCodeOptional, uuid } from "./base-schemas";
import { DEPTH_BOUNDS } from "./constants";

// ============================================================================
// Database Schema (Hard Validation - Blocks Save)
// ============================================================================

/**
 * Database-level validation for Collar section
 * Enforces SQL constraints and referential integrity
 * Validation failures BLOCK save operations
 */
export const collarDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	CollarId: uuid,
	LoggingEventId: uuid,
	Organization: z.string().min(1, "Organization is required").max(30),
	Prospect: z.string().min(1, "Prospect is required").max(30),

	// Optional fields that have constraints when present
	TotalDepth: z.number().nonnegative().max(DEPTH_BOUNDS.MAX).optional().nullable(),
	PreCollarDepth: z.number().nonnegative().optional().nullable(),
	WaterTableDepth: z.number().nonnegative().optional().nullable(),
	StartedOnDt: z.string().datetime({ offset: true }).optional().nullable(),
	FinishedOnDt: z.string().datetime({ offset: true }).optional().nullable(),
	ResponsiblePerson: lookupCodeOptional,
	ResponsiblePerson2: lookupCodeOptional,
})
// CK_Coll_PreCollarDepth: TotalDepth >= PreCollarDepth
	.refine(
		(data) => {
			if (data.TotalDepth != null && data.PreCollarDepth != null) {
				return data.TotalDepth >= data.PreCollarDepth;
			}
			return true;
		},
		{
			message: "Total depth must be greater than or equal to pre-collar depth",
			path: ["TotalDepth"],
		},
	)
// CK_Coll_WaterTableDepth: TotalDepth >= WaterTableDepth
	.refine(
		(data) => {
			if (data.TotalDepth != null && data.WaterTableDepth != null) {
				return data.TotalDepth >= data.WaterTableDepth;
			}
			return true;
		},
		{
			message: "Water table depth must be less than or equal to total depth",
			path: ["WaterTableDepth"],
		},
	)
// CK_Coll_ResponsiblePerson2: ResponsiblePerson2 != ResponsiblePerson
	.refine(
		(data) => {
			if (data.ResponsiblePerson && data.ResponsiblePerson2) {
				return data.ResponsiblePerson2 !== data.ResponsiblePerson;
			}
			return true;
		},
		{
			message: "Secondary responsible person must be different from primary responsible person",
			path: ["ResponsiblePerson2"],
		},
	)
// CK_Coll_FinishedOnDt: FinishedOnDt >= StartedOnDt AND FinishedOnDt <= now
	.refine(
		(data) => {
			if (data.FinishedOnDt && data.StartedOnDt) {
				const finished = new Date(data.FinishedOnDt);
				const started = new Date(data.StartedOnDt);
				return finished >= started;
			}
			return true;
		},
		{
			message: "Finish date must be after or equal to start date",
			path: ["FinishedOnDt"],
		},
	)
	.refine(
		(data) => {
			if (data.FinishedOnDt) {
				return new Date(data.FinishedOnDt) <= new Date();
			}
			return true;
		},
		{
			message: "Finish date cannot be in the future",
			path: ["FinishedOnDt"],
		},
	)
// CK_Coll_StartedOnDt: StartedOnDt <= now
	.refine(
		(data) => {
			if (data.StartedOnDt) {
				return new Date(data.StartedOnDt) <= new Date();
			}
			return true;
		},
		{
			message: "Start date cannot be in the future",
			path: ["StartedOnDt"],
		},
	);

// ============================================================================
// Save Schema (Soft Validation - Warnings Only)
// ============================================================================

/**
 * Save-level validation for Collar section
 * Data quality checks and business rule recommendations
 * Validation failures DO NOT block save operations
 */
export const collarSaveSchema = z.object({
	// Depth warnings
	TotalDepth: z.number()
		.nonnegative("Total depth cannot be negative")
		.optional()
		.nullable(),

	PreCollarDepth: z.number()
		.nonnegative("Pre-collar depth cannot be negative")
		.optional()
		.nullable(),

	CasingDepth: z.number()
		.nonnegative("Casing depth cannot be negative")
		.optional()
		.nullable(),

	StartDepth: z.number()
		.nonnegative("Start depth cannot be negative")
		.optional()
		.nullable(),

	WaterTableDepth: z.number()
		.nonnegative("Water table depth cannot be negative")
		.optional()
		.nullable(),

	// Date quality checks
	StartedOnDt: z.string().datetime({ offset: true }).optional().nullable(),
	FinishedOnDt: z.string().datetime({ offset: true }).optional().nullable(),
	WaterTableDepthMeasuredOnDt: z.string().datetime({ offset: true }).optional().nullable(),
})
// Warn if depth exceeds typical exploration depth
	.refine(
		(data) => {
			if (data.TotalDepth != null) {
				return data.TotalDepth <= DEPTH_BOUNDS.WARNING;
			}
			return true;
		},
		{
			message: `Total depth exceeds ${DEPTH_BOUNDS.WARNING}m - please verify this deep drilling depth`,
			path: ["TotalDepth"],
		},
	)
// Warn if pre-collar depth is unusually deep
	.refine(
		(data) => {
			if (data.PreCollarDepth != null) {
				return data.PreCollarDepth <= 100; // Pre-collar typically < 100m
			}
			return true;
		},
		{
			message: "Pre-collar depth exceeds 100m - please verify",
			path: ["PreCollarDepth"],
		},
	);

// ============================================================================
// Type Exports
// ============================================================================

/**
 * TypeScript type for Collar data
 * Combines required database fields with optional save fields
 */
export type CollarData = z.infer<typeof collarDatabaseSchema>
  & Partial<z.infer<typeof collarSaveSchema>>;

/**
 * Type for database validation only
 */
export type CollarDatabaseData = z.infer<typeof collarDatabaseSchema>;

/**
 * Type for save validation only
 */
export type CollarSaveData = z.infer<typeof collarSaveSchema>;
