/**
 * Geology Section Validations
 *
 * Two-tier validation for all geology logging sections:
 * - GeologyCombinedLog
 * - ShearLog
 * - StructureLog
 * - StructurePtLog
 *
 * References:
 * - MiningDb7/Geology.GeologyCombinedLog.Table.sql
 * - MiningDb7/Geology.ShearLog.Table.sql
 * - MiningDb7/Geology.StructureLog.Table.sql
 * - MiningDb7/Geology.StructurePtLog.Table.sql
 * - constraint-error-messages.ts (Geology constraints)
 */

import { z } from "zod";
import {
	dateNotFuture,
	depthSchema,
	lookupCodeOptional,
	percentageSchema,
	uuid,
} from "./base-schemas";
import { ANGLE_BOUNDS, GEOLOGY_BOUNDS } from "./constants";

// ============================================================================
// GeologyCombinedLog Validation
// ============================================================================

/**
 * Database schema for GeologyCombinedLog
 * Enforces depth intervals and percentage constraints
 */
export const geologyCombinedLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	GeologyCombinedLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	// Required fields
	LoggedDt: dateNotFuture,
	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Lithology & classification
	Lithology: lookupCodeOptional,
	Weathering: lookupCodeOptional,
	Colour: lookupCodeOptional,

	// Alteration percentages (0-100%) - all optional
	AltAlbite: percentageSchema.optional().nullable(),
	AltBiotite: percentageSchema.optional().nullable(),
	AltCarbonate: percentageSchema.optional().nullable(),
	AltChlorite: percentageSchema.optional().nullable(),
	AltEpidote: percentageSchema.optional().nullable(),
	AltHematite: percentageSchema.optional().nullable(),
	AltLimonite: percentageSchema.optional().nullable(),
	AltMagnetite: percentageSchema.optional().nullable(),
	AltPyrite: percentageSchema.optional().nullable(),
	AltSericite: percentageSchema.optional().nullable(),
	AltSilica: percentageSchema.optional().nullable(),

	// Vein percentages (0-100%)
	VeinPct: percentageSchema.optional().nullable(),
	Vein1_Pct: percentageSchema.optional().nullable(),
	Vein2_Pct: percentageSchema.optional().nullable(),
	Vein3_Pct: percentageSchema.optional().nullable(),
	Vein4_Pct: percentageSchema.optional().nullable(),
	Vein5_Pct: percentageSchema.optional().nullable(),
	Vein6_Pct: percentageSchema.optional().nullable(),
	MSVN_Pct: percentageSchema.optional().nullable(),
})
// CK_GeologyCombinedLog_DepthFrom_DepthTo
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

/**
 * Save schema for GeologyCombinedLog
 * Data quality checks and warnings
 */
export const geologyCombinedLogSaveSchema = z.object({
	// Vein thickness warnings
	Vein1_Thickness_cm: z.number().nonnegative().optional().nullable(),
	Vein2_Thickness_cm: z.number().nonnegative().optional().nullable(),
	Vein3_Thickness_cm: z.number().nonnegative().optional().nullable(),

	// Interval length check
	DepthFrom: z.number().optional().nullable(),
	DepthTo: z.number().optional().nullable(),
})
// Warn if vein thickness exceeds 1m (100cm)
	.refine(
		(data) => {
			if (data.Vein1_Thickness_cm != null) {
				return data.Vein1_Thickness_cm <= GEOLOGY_BOUNDS.VEIN_THICKNESS.warning;
			}
			return true;
		},
		{
			message: "Vein 1 thickness exceeds 100cm (1m) - please verify",
			path: ["Vein1_Thickness_cm"],
		},
	)
// Warn if interval is very long
	.refine(
		(data) => {
			if (data.DepthFrom != null && data.DepthTo != null) {
				return (data.DepthTo - data.DepthFrom) <= 10; // 10m warning
			}
			return true;
		},
		{
			message: "Logging interval exceeds 10m - consider more detailed logging",
			path: ["DepthTo"],
		},
	);

export type GeologyCombinedLogData = z.infer<typeof geologyCombinedLogDatabaseSchema>
  & Partial<z.infer<typeof geologyCombinedLogSaveSchema>>;

// ============================================================================
// ShearLog Validation
// ============================================================================

/**
 * Database schema for ShearLog
 * Enforces shear zone measurements and angle constraints
 */
export const shearLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	ShearLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	// Required depth interval
	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Shear zone measurements - all optional but constrained when present
	SZ_Alpha: z.number()
		.min(ANGLE_BOUNDS.ALPHA.min)
		.max(ANGLE_BOUNDS.ALPHA.max, "Shear zone alpha must be between 0 and 90 degrees")
		.optional()
		.nullable(),

	SZ_Dip: z.number()
		.min(ANGLE_BOUNDS.DIP.min)
		.max(ANGLE_BOUNDS.DIP.max, "Shear zone dip must be between -90 and 90 degrees")
		.optional()
		.nullable(),

	SZ_Strike: z.number()
		.min(ANGLE_BOUNDS.STRIKE.min)
		.max(ANGLE_BOUNDS.STRIKE.max, "Shear zone strike must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	// Shear characteristics
	ShearType: lookupCodeOptional,
	ShearIntensity: lookupCodeOptional,
})
// CK_Shear_DepthFrom_DepthTo
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

/**
 * Save schema for ShearLog
 * Warnings for data quality
 */
export const shearLogSaveSchema = z.object({
	DepthFrom: z.number().optional().nullable(),
	DepthTo: z.number().optional().nullable(),
	SZ_Alpha: z.number().optional().nullable(),
})
// Warn if shear zone interval is very thick
	.refine(
		(data) => {
			if (data.DepthFrom != null && data.DepthTo != null) {
				const thickness = data.DepthTo - data.DepthFrom;
				return thickness <= 5; // 5m warning for shear zone
			}
			return true;
		},
		{
			message: "Shear zone thickness exceeds 5m - verify measurement",
			path: ["DepthTo"],
		},
	);

export type ShearLogData = z.infer<typeof shearLogDatabaseSchema>
  & Partial<z.infer<typeof shearLogSaveSchema>>;

// ============================================================================
// StructureLog Validation
// ============================================================================

/**
 * Database schema for StructureLog
 * Enforces structural measurements and orientation constraints
 */
export const structureLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	StructureLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	// Required depth interval
	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Plane orientation
	Plane_Azimuth: z.number()
		.min(ANGLE_BOUNDS.AZIMUTH.min)
		.max(ANGLE_BOUNDS.AZIMUTH.max, "Plane azimuth must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	Plane_Dip: z.number()
		.min(ANGLE_BOUNDS.DIP.min)
		.max(ANGLE_BOUNDS.DIP.max, "Plane dip must be between -90 and 90 degrees")
		.optional()
		.nullable(),

	// Lineation orientation
	Lineation_Trend: z.number()
		.min(ANGLE_BOUNDS.AZIMUTH.min)
		.max(ANGLE_BOUNDS.AZIMUTH.max, "Lineation trend must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	Lineation_Plunge: z.number()
		.min(ANGLE_BOUNDS.DIP.min)
		.max(ANGLE_BOUNDS.DIP.max, "Lineation plunge must be between -90 and 90 degrees")
		.optional()
		.nullable(),

	Lineation_Delta: z.number()
		.min(ANGLE_BOUNDS.AZIMUTH.min)
		.max(ANGLE_BOUNDS.AZIMUTH.max, "Lineation delta must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	// Structure characteristics
	StructureType: lookupCodeOptional,
})
// CK_Structure_DepthFrom_DepthTo
	.refine(
		data => data.DepthTo > data.DepthFrom,
		{
			message: "Depth To must be greater than Depth From",
			path: ["DepthTo"],
		},
	);

/**
 * Save schema for StructureLog
 * Data quality checks
 */
export const structureLogSaveSchema = z.object({
	DepthFrom: z.number().optional().nullable(),
	DepthTo: z.number().optional().nullable(),
})
// Warn if structure interval is very long
	.refine(
		(data) => {
			if (data.DepthFrom != null && data.DepthTo != null) {
				return (data.DepthTo - data.DepthFrom) <= 2; // 2m warning for structures
			}
			return true;
		},
		{
			message: "Structure interval exceeds 2m - structures are typically discrete features",
			path: ["DepthTo"],
		},
	);

export type StructureLogData = z.infer<typeof structureLogDatabaseSchema>
  & Partial<z.infer<typeof structureLogSaveSchema>>;

// ============================================================================
// StructurePtLog Validation (Point measurements)
// ============================================================================

/**
 * Database schema for StructurePtLog
 * Point-based structural measurements (single depth, not interval)
 */
export const structurePtLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	StructurePtLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	LoggingEventId: uuid,

	// Point depth (not an interval)
	Depth: depthSchema,

	// Orientation measurements
	Alpha: z.number()
		.min(ANGLE_BOUNDS.ALPHA.min)
		.max(ANGLE_BOUNDS.ALPHA.max, "Alpha must be between 0 and 90 degrees")
		.optional()
		.nullable(),

	Azimuth: z.number()
		.min(ANGLE_BOUNDS.AZIMUTH.min)
		.max(ANGLE_BOUNDS.AZIMUTH.max, "Azimuth must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	Dip: z.number()
		.min(ANGLE_BOUNDS.DIP.min)
		.max(ANGLE_BOUNDS.DIP.max, "Dip must be between -90 and 90 degrees")
		.optional()
		.nullable(),

	Strike: z.number()
		.min(ANGLE_BOUNDS.STRIKE.min)
		.max(ANGLE_BOUNDS.STRIKE.max, "Strike must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	// Structure type
	StructureType: lookupCodeOptional,
});

/**
 * Save schema for StructurePtLog
 * Basic data quality checks
 */
export const structurePtLogSaveSchema = z.object({
	Depth: z.number().optional().nullable(),
	LoggedDt: z.string().datetime({ offset: true }).optional().nullable(),
})
// Warn if logged date is missing
	.refine(
		data => data.LoggedDt != null,
		{
			message: "Logged date recommended for audit trail",
			path: ["LoggedDt"],
		},
	);

export type StructurePtLogData = z.infer<typeof structurePtLogDatabaseSchema>
  & Partial<z.infer<typeof structurePtLogSaveSchema>>;
