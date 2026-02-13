/**
 * Geotech Section Validations
 *
 * Two-tier validation for all geotechnical logging sections:
 * - CoreRecoveryRunLog
 * - RockQualityDesignationLog
 * - MagSusLog
 * - FractureCountLog
 * - RockMechanicLog
 *
 * References:
 * - MiningDb7/Geotech.CoreRecoveryRunLog.Table.sql
 * - MiningDb7/Geotech.RockQualityDesignationLog.Table.sql
 * - MiningDb7/Geotech.MagSusLog.Table.sql
 * - MiningDb7/Geotech.FractureCountLog.Table.sql
 * - MiningDb7/Geotech.RockMechanicLog.Table.sql
 * - constraint-error-messages.ts (Geotech constraints)
 */

import { z } from "zod";
import {
	depthSchema,
	lookupCodeOptional,
	uuid,
} from "./base-schemas";
import { GEOTECH_BOUNDS } from "./constants";

// ============================================================================
// CoreRecoveryRunLog Validation
// ============================================================================

/**
 * Database schema for CoreRecoveryRunLog
 * Enforces core recovery measurements and RQD constraints
 */
export const coreRecoveryRunLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	CoreRecoveryRunLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	// Required depth interval
	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Priority
	Priority: z.number().int().min(0).max(255),

	// Recovery measurements (0-110%, can exceed 100%)
	Recovery_pct: z.number()
		.min(GEOTECH_BOUNDS.RECOVERY_PCT.min)
		.max(GEOTECH_BOUNDS.RECOVERY_PCT.max, "Recovery cannot exceed 110%")
		.optional()
		.nullable(),

	// RQD measurements (0-100%)
	RQD_pct: z.number()
		.min(GEOTECH_BOUNDS.RQD_PCT.min)
		.max(GEOTECH_BOUNDS.RQD_PCT.max, "RQD cannot exceed 100%")
		.optional()
		.nullable(),

	// Solid recovery (0-110%)
	Solid_Recovery_pct: z.number()
		.min(GEOTECH_BOUNDS.RECOVERY_PCT.min)
		.max(GEOTECH_BOUNDS.RECOVERY_PCT.max, "Solid recovery cannot exceed 110%")
		.optional()
		.nullable(),

	// Total core recovery (0-100%)
	Total_Core_Recovery_pct: z.number()
		.min(0)
		.max(100, "Total core recovery cannot exceed 100%")
		.optional()
		.nullable(),

	// Core recovery intervals
	Recovery_Interval: z.number().nonnegative().optional().nullable(),
	RQD_Interval: z.number().nonnegative().optional().nullable(),
	Solid_Recovery_Interval: z.number().nonnegative().optional().nullable(),

	// Core characteristics
	CoreDiameter: lookupCodeOptional,
	CoreOrientated: z.boolean(),
	OrientationQuality: lookupCodeOptional,

	// Degree of offset (0-360°)
	Degree_Of_Offset: z.number()
		.min(GEOTECH_BOUNDS.DEGREE_OF_OFFSET.min)
		.max(GEOTECH_BOUNDS.DEGREE_OF_OFFSET.max, "Degree of offset must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	// Logged date
	LoggedDt: z.string().datetime({ offset: true }).optional().nullable(),
})
// CK_CoreRecoveryRun_DepthFrom_DepthTo
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	)
// CK_CoreRecoveryRun_RQD_Interval: RQD_Interval <= Solid_Recovery_Interval
	.refine(
		(data) => {
			if (data.RQD_Interval != null && data.Solid_Recovery_Interval != null) {
				return data.RQD_Interval <= data.Solid_Recovery_Interval;
			}
			return true;
		},
		{
			message: "RQD interval cannot exceed solid recovery interval",
			path: ["RQD_Interval"],
		},
	)
// CK_CoreRecoveryRun_LoggedDt: LoggedDt <= now
	.refine(
		(data) => {
			if (data.LoggedDt) {
				return new Date(data.LoggedDt) <= new Date();
			}
			return true;
		},
		{
			message: "Logged date cannot be in the future",
			path: ["LoggedDt"],
		},
	);

/**
 * Save schema for CoreRecoveryRunLog
 * Data quality warnings
 */
export const coreRecoveryRunLogSaveSchema = z.object({
	Recovery_pct: z.number().optional().nullable(),
	RQD_pct: z.number().optional().nullable(),
	Solid_Recovery_pct: z.number().optional().nullable(),
})
// Warn if recovery is unusually high
	.refine(
		(data) => {
			if (data.Recovery_pct != null) {
				return data.Recovery_pct <= 105;
			}
			return true;
		},
		{
			message: "Recovery exceeds 105% - verify measurement (swelling common but review)",
			path: ["Recovery_pct"],
		},
	)
// Warn if RQD indicates poor rock quality
	.refine(
		(data) => {
			if (data.RQD_pct != null && data.RQD_pct < GEOTECH_BOUNDS.RQD_PCT.POOR) {
				return false; // Trigger warning
			}
			return true;
		},
		{
			message: "RQD below 50% indicates poor rock quality",
			path: ["RQD_pct"],
		},
	);

export type CoreRecoveryRunLogData = z.infer<typeof coreRecoveryRunLogDatabaseSchema>
  & Partial<z.infer<typeof coreRecoveryRunLogSaveSchema>>;

// ============================================================================
// RockQualityDesignationLog Validation (simplified RQD logging)
// ============================================================================

/**
 * Database schema for standalone RQD logging
 */
export const rockQualityDesignationLogDatabaseSchema = z.object({
	RQDLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	RQD_pct: z.number()
		.min(GEOTECH_BOUNDS.RQD_PCT.min)
		.max(GEOTECH_BOUNDS.RQD_PCT.max, "RQD cannot exceed 100%"),
})
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

export const rockQualityDesignationLogSaveSchema = z.object({
	RQD_pct: z.number().optional().nullable(),
})
	.refine(
		(data) => {
			if (data.RQD_pct != null && data.RQD_pct < GEOTECH_BOUNDS.RQD_PCT.POOR) {
				return false;
			}
			return true;
		},
		{
			message: "RQD below 50% indicates poor rock quality",
			path: ["RQD_pct"],
		},
	);

export type RockQualityDesignationLogData = z.infer<typeof rockQualityDesignationLogDatabaseSchema>
  & Partial<z.infer<typeof rockQualityDesignationLogSaveSchema>>;

// ============================================================================
// MagSusLog Validation (Magnetic Susceptibility)
// ============================================================================

/**
 * Database schema for MagSusLog
 */
export const magSusLogDatabaseSchema = z.object({
	MagSusLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Magnetic susceptibility (SI units x 10^-5)
	MagSus: z.number()
		.nonnegative("Magnetic susceptibility cannot be negative")
		.max(GEOTECH_BOUNDS.MAG_SUS.max, "Magnetic susceptibility exceeds maximum")
		.optional()
		.nullable(),
})
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

/**
 * Save schema for MagSusLog
 */
export const magSusLogSaveSchema = z.object({
	MagSus: z.number().optional().nullable(),
})
// Warn if highly magnetic
	.refine(
		(data) => {
			if (data.MagSus != null) {
				return data.MagSus <= GEOTECH_BOUNDS.MAG_SUS.warning;
			}
			return true;
		},
		{
			message: "Magnetic susceptibility exceeds 10,000 - indicates highly magnetic rock",
			path: ["MagSus"],
		},
	);

export type MagSusLogData = z.infer<typeof magSusLogDatabaseSchema>
  & Partial<z.infer<typeof magSusLogSaveSchema>>;

// ============================================================================
// FractureCountLog Validation
// ============================================================================

/**
 * Database schema for FractureCountLog
 */
export const fractureCountLogDatabaseSchema = z.object({
	FractureCountLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	FractureCount: z.number()
		.int("Fracture count must be an integer")
		.nonnegative("Fracture count cannot be negative"),
})
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

/**
 * Save schema for FractureCountLog
 */
export const fractureCountLogSaveSchema = z.object({
	FractureCount: z.number().optional().nullable(),
	DepthFrom: z.number().optional().nullable(),
	DepthTo: z.number().optional().nullable(),
})
// Warn if highly fractured
	.refine(
		(data) => {
			if (data.FractureCount != null) {
				return data.FractureCount <= GEOTECH_BOUNDS.FRACTURE_COUNT.warning;
			}
			return true;
		},
		{
			message: "Fracture count exceeds 100 - indicates highly fractured/poor rock quality",
			path: ["FractureCount"],
		},
	)
// Warn if fracture density is high
	.refine(
		(data) => {
			if (data.FractureCount != null && data.DepthFrom != null && data.DepthTo != null) {
				const intervalLength = data.DepthTo - data.DepthFrom;
				const density = data.FractureCount / intervalLength;
				return density <= 20; // 20 fractures per meter
			}
			return true;
		},
		{
			message: "Fracture density exceeds 20 per meter - very high fracturing",
			path: ["FractureCount"],
		},
	);

export type FractureCountLogData = z.infer<typeof fractureCountLogDatabaseSchema>
  & Partial<z.infer<typeof fractureCountLogSaveSchema>>;

// ============================================================================
// RockMechanicLog Validation
// ============================================================================

/**
 * Database schema for RockMechanicLog
 * Rock strength and elastic properties
 */
export const rockMechanicLogDatabaseSchema = z.object({
	RockMechanicLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Unconfined Compressive Strength (MPa)
	UCS: z.number()
		.nonnegative("UCS cannot be negative")
		.optional()
		.nullable(),

	// Young's Modulus (GPa)
	YoungModulus: z.number()
		.nonnegative("Young's Modulus cannot be negative")
		.optional()
		.nullable(),

	// Poisson's Ratio (dimensionless, 0-0.5)
	PoissonRatio: z.number()
		.min(GEOTECH_BOUNDS.POISSONS_RATIO.min, "Poisson's Ratio cannot be negative")
		.max(GEOTECH_BOUNDS.POISSONS_RATIO.max, "Poisson's Ratio cannot exceed 0.5")
		.optional()
		.nullable(),
})
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

/**
 * Save schema for RockMechanicLog
 */
export const rockMechanicLogSaveSchema = z.object({
	UCS: z.number().optional().nullable(),
	PoissonRatio: z.number().optional().nullable(),
})
// Warn if UCS indicates very weak rock
	.refine(
		(data) => {
			if (data.UCS != null && data.UCS < GEOTECH_BOUNDS.UCS.VERY_WEAK) {
				return false;
			}
			return true;
		},
		{
			message: "UCS below 1 MPa - very weak rock, handle with care",
			path: ["UCS"],
		},
	)
// Warn if UCS indicates extremely strong rock
	.refine(
		(data) => {
			if (data.UCS != null && data.UCS > GEOTECH_BOUNDS.UCS.EXTREMELY_STRONG) {
				return false;
			}
			return true;
		},
		{
			message: "UCS exceeds 250 MPa - extremely strong rock, verify measurement",
			path: ["UCS"],
		},
	)
// Warn if Poisson's Ratio is unusual
	.refine(
		(data) => {
			if (data.PoissonRatio != null) {
				return data.PoissonRatio <= GEOTECH_BOUNDS.POISSONS_RATIO.warning;
			}
			return true;
		},
		{
			message: "Poisson's Ratio exceeds 0.45 - unusual for most rocks, verify",
			path: ["PoissonRatio"],
		},
	);

export type RockMechanicLogData = z.infer<typeof rockMechanicLogDatabaseSchema>
  & Partial<z.infer<typeof rockMechanicLogSaveSchema>>;
