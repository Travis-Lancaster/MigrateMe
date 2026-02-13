/**
 * Survey Section Validations
 *
 * Two-tier validation for survey-related sections:
 * - Survey (survey header)
 * - SurveyLog (individual survey measurements)
 *
 * References:
 * - MiningDb7/DrillHole.Survey.Table.sql
 * - MiningDb7/DrillHole.SurveyLog.Table.sql
 * - constraint-error-messages.ts (Survey constraints)
 */

import { z } from "zod";
import {
	lookupCodeOptional,
	uuid,
} from "./base-schemas";
import { DEPTH_BOUNDS } from "./constants";

// ============================================================================
// Survey (Header) Validation
// ============================================================================

/**
 * Database schema for Survey header
 */
export const surveyDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	SurveyId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),

	// Survey metadata
	SurveyMethod: lookupCodeOptional,
	SurveyCompany: lookupCodeOptional,
	SurveyedBy: lookupCodeOptional,
	SurveyedOnDt: z.string().datetime({ offset: true }).optional().nullable(),

	// Equipment
	Instrument: lookupCodeOptional,
})
// CK_Survey_SurveyedOnDt: SurveyedOnDt <= now
	.refine(
		(data) => {
			if (data.SurveyedOnDt) {
				return new Date(data.SurveyedOnDt) <= new Date();
			}
			return true;
		},
		{
			message: "Survey date cannot be in the future",
			path: ["SurveyedOnDt"],
		},
	);

/**
 * Save schema for Survey header
 */
export const surveySaveSchema = z.object({
	SurveyedOnDt: z.string().datetime({ offset: true }).optional().nullable(),
	SurveyMethod: z.string().optional().nullable(),
})
// Recommend survey method is specified
	.refine(
		data => data.SurveyMethod != null,
		{
			message: "Survey method recommended for data quality",
			path: ["SurveyMethod"],
		},
	);

export type SurveyData = z.infer<typeof surveyDatabaseSchema>
  & Partial<z.infer<typeof surveySaveSchema>>;

// ============================================================================
// SurveyLog (Individual Measurements) Validation
// ============================================================================

/**
 * Database schema for SurveyLog
 * Individual downhole survey measurements
 */
export const surveyLogDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	SurveyLogId: uuid.optional().nullable(),
	CollarId: uuid,
	Organization: z.string().min(1).max(30),
	SurveyId: uuid.optional().nullable(), // Link to Survey header

	// Depth of measurement
	Depth: z.number()
		.nonnegative("Depth cannot be negative")
		.max(DEPTH_BOUNDS.MAX, `Depth cannot exceed ${DEPTH_BOUNDS.MAX}m`),

	// Orientation measurements
	Azimuth: z.number()
		.min(0)
		.max(360, "Azimuth must be between 0 and 360 degrees")
		.optional()
		.nullable(),

	Dip: z.number()
		.min(-90, "Dip must be between -90 and 90 degrees")
		.max(90, "Dip must be between -90 and 90 degrees")
		.optional()
		.nullable(),

	// Survey metadata
	SurveyedOnDt: z.string().datetime({ offset: true }).optional().nullable(),
	SurveyMethod: lookupCodeOptional,
})
// CK_SurveyLog_SurveyedOnDt: SurveyedOnDt <= now
	.refine(
		(data) => {
			if (data.SurveyedOnDt) {
				return new Date(data.SurveyedOnDt) <= new Date();
			}
			return true;
		},
		{
			message: "Survey date cannot be in the future",
			path: ["SurveyedOnDt"],
		},
	);

/**
 * Save schema for SurveyLog
 * Data quality checks and warnings
 */
export const surveyLogSaveSchema = z.object({
	Depth: z.number().optional().nullable(),
	Dip: z.number().optional().nullable(),
	Azimuth: z.number().optional().nullable(),
})
// Warn if survey depth exceeds typical drilling
	.refine(
		(data) => {
			if (data.Depth != null) {
				return data.Depth <= DEPTH_BOUNDS.WARNING;
			}
			return true;
		},
		{
			message: `Survey depth exceeds ${DEPTH_BOUNDS.WARNING}m - verify deep drilling survey`,
			path: ["Depth"],
		},
	)
// Warn if dip is very steep upward (unusual)
	.refine(
		(data) => {
			if (data.Dip != null) {
				return data.Dip >= -80; // Less than -80° is very steep upward
			}
			return true;
		},
		{
			message: "Dip exceeds -80° (very steep upward drilling) - verify measurement",
			path: ["Dip"],
		},
	)
// Recommend both azimuth and dip are recorded
	.refine(
		(data) => {
			if (data.Azimuth == null || data.Dip == null) {
				return false; // Trigger warning
			}
			return true;
		},
		{
			message: "Both azimuth and dip should be recorded for complete survey data",
			path: ["Azimuth"],
		},
	);

export type SurveyLogData = z.infer<typeof surveyLogDatabaseSchema>
  & Partial<z.infer<typeof surveyLogSaveSchema>>;
