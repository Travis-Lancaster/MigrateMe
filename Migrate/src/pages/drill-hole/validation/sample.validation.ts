/**
 * Sample Section Validation
 *
 * Two-tier validation: Database (hard/blocking) + Save (soft/warnings)
 *
 * References:
 * - MiningDb7/Sample.Sample.Table.sql
 * - constraint-error-messages.ts (Sample constraints)
 */

import { z } from "zod";
import {
	dateNotFutureOptional,
	lookupCodeOptional,
	uuid,
} from "./base-schemas";

import { DEPTH_BOUNDS, SAMPLE_BOUNDS } from "./constants";

// ============================================================================
// Database Schema (Hard Validation - Blocks Save)
// ============================================================================

/**
 * Database-level validation for Sample section
 * Enforces SQL constraints and referential integrity
 * Validation failures BLOCK save operations
 */
export const sampleDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	SampleId: uuid,
	CollarId: uuid,
	SampleNm: z.string(),
	Organization: z.string().min(1, "Organization is required").max(30),

	// Required depth interval
	DepthFrom: z.number()
		.nonnegative("Depth From cannot be negative")
		.max(DEPTH_BOUNDS.MAX, `Depth From cannot exceed ${DEPTH_BOUNDS.MAX}m`),

	DepthTo: z.number()
		.nonnegative("Depth To cannot be negative")
		.max(DEPTH_BOUNDS.MAX, `Depth To cannot exceed ${DEPTH_BOUNDS.MAX}m`),

	// Required data source
	DataSource: z.string().min(1, "Data source is required").max(255),

	// Optional fields
	SampleType: lookupCodeOptional,
	SampleClassification: lookupCodeOptional,
	SampleMethod: lookupCodeOptional,
	SampleCondition: lookupCodeOptional,
	Priority: z.number().int().min(0).max(SAMPLE_BOUNDS.PRIORITY.max).optional().nullable(),
})
// CK_Samp_DepthFrom_DepthTo: DepthFrom <= DepthTo
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	)
// Ensure minimum interval
	.refine(
		data => (data.DepthTo - data.DepthFrom) >= SAMPLE_BOUNDS.INTERVAL.min,
		{
			message: `Sample interval must be at least ${SAMPLE_BOUNDS.INTERVAL.min}m`,
			path: ["DepthTo"],
		},
	);

// ============================================================================
// Save Schema (Soft Validation - Warnings Only)
// ============================================================================

/**
 * Save-level validation for Sample section
 * Data quality checks and business rule recommendations
 * Validation failures DO NOT block save operations
 */
export const sampleSaveSchema = z.object({
	// Interval length
	DepthFrom: z.number().nonnegative().optional().nullable(),
	DepthTo: z.number().nonnegative().optional().nullable(),

	// Sample measurements
	SampleWeight: z.number().nonnegative("Sample weight cannot be negative").optional().nullable(),
	FieldSampleWeight: z.number().nonnegative().optional().nullable(),
	DryFieldSampleWeight: z.number().nonnegative().optional().nullable(),
	LabSpWeight: z.number().nonnegative().optional().nullable(),

	// Recovery percentage (can exceed 100%)
	Sample_Recovery_pct: z.number()
		.min(0, "Recovery percentage cannot be negative")
		.max(110, "Recovery percentage cannot exceed 110%")
		.optional()
		.nullable(),

	// Rod number
	RodNo: z.number().int().min(SAMPLE_BOUNDS.ROD_NUMBER.min).max(SAMPLE_BOUNDS.ROD_NUMBER.max).optional().nullable(),

	// Sampled date
	SampledDt: dateNotFutureOptional,
	SampledBy: lookupCodeOptional,
})
// Warn if interval length exceeds typical sampling
	.refine(
		(data) => {
			if (data.DepthFrom != null && data.DepthTo != null) {
				const intervalLength = data.DepthTo - data.DepthFrom;
				return intervalLength <= SAMPLE_BOUNDS.INTERVAL.warning;
			}
			return true;
		},
		{
			message: `Sample interval exceeds ${SAMPLE_BOUNDS.INTERVAL.warning}m - unusual for detailed exploration`,
			path: ["DepthTo"],
		},
	)
// Warn if sample weight is heavy
	.refine(
		(data) => {
			if (data.SampleWeight != null) {
				return data.SampleWeight <= SAMPLE_BOUNDS.WEIGHT.warning;
			}
			return true;
		},
		{
			message: `Sample weight exceeds ${SAMPLE_BOUNDS.WEIGHT.warning}kg - verify handling requirements`,
			path: ["SampleWeight"],
		},
	)
// Warn if recovery is unusually high
	.refine(
		(data) => {
			if (data.Sample_Recovery_pct != null) {
				return data.Sample_Recovery_pct <= 105;
			}
			return true;
		},
		{
			message: "Sample recovery exceeds 105% - please verify measurement",
			path: ["Sample_Recovery_pct"],
		},
	)
// Warn if recovery is very low
	.refine(
		(data) => {
			if (data.Sample_Recovery_pct != null) {
				return data.Sample_Recovery_pct >= 50;
			}
			return true;
		},
		{
			message: "Sample recovery below 50% - indicates poor sample quality",
			path: ["Sample_Recovery_pct"],
		},
	);

// ============================================================================
// Type Exports
// ============================================================================

/**
 * TypeScript type for Sample data
 * Combines required database fields with optional save fields
 */
export type SampleData = z.infer<typeof sampleDatabaseSchema>
  & Partial<z.infer<typeof sampleSaveSchema>>;

/**
 * Type for database validation only
 */
export type SampleDatabaseData = z.infer<typeof sampleDatabaseSchema>;

/**
 * Type for save validation only
 */
export type SampleSaveData = z.infer<typeof sampleSaveSchema>;
