/**
 * Survey (Down Hole Survey) Validation Schemas
 *
 * Defines Zod schemas for validating survey log data.
 * Survey logs track hole trajectory measurements at specific depths.
 */

import { z } from "zod";

import { azimuthSchema, createLookupSchema, depthSchema, dipSchema } from "./base-schemas";

/**
 * Core Survey (SurveyLog) validation schema
 */
export const surveySchema = z.object({
	// Primary Keys
	SurveyLogId: z.string().uuid().optional(),
	SurveyId: z.string().uuid().optional(),
	LoggingEventId: z.string().uuid().optional(),
	Organization: createLookupSchema("Organization", false),

	// Core Survey Measurements - Required fields
	Depth: depthSchema,
	Dip: dipSchema,

	// Azimuth Measurements
	AzimuthMagnetic: azimuthSchema.optional(),
	AzimuthMagneticReversed: azimuthSchema.optional(),
	AzimuthUTM: azimuthSchema.optional(),
	AzimuthUTMField: azimuthSchema.optional(),

	// Deviation Measurements
	AzimuthDeviation: z.number().optional(),
	DipDeviation: z.number().min(-90).max(90).optional(),
	Deviation: z.string().optional(),

	// Survey Details
	DownHoleSurveyMethod: createLookupSchema("DownHoleSurveyMethod", false),
	SurveyCompany: createLookupSchema("SurveyCompany", false),
	SurveyOperator: z.string().optional(),
	SurveyInstrument: z.string().optional(),
	SurveyReliability: createLookupSchema("SurveyReliability", false),

	// Magnetic Information
	MagneticFieldStrength: z.number().optional(),
	MagneticInclination: z.number().min(-90).max(90).optional(),
	MagneticStatus: z.string().optional(),

	// Survey Metadata
	Grid: createLookupSchema("Grid", false),
	SurveyedOnDt: z.string().optional(), // ISO date string
	Validation: z.boolean().optional(),
	DataSource: z.string().optional(),

	// Comments
	Comments: z.string().optional(),

	// Metadata
	ReportIncludeInd: z.boolean().optional(),
	ValidationStatus: z.string().optional(),
	ValidationErrors: z.string().nullable().optional(),
	RowStatus: z.string().optional(),
	SupersededById: z.string().uuid().optional(),
	ActiveInd: z.boolean().default(true),

	// Audit Fields
	rv: z.string().nullable().optional(),
	CreatedOnDt: z.string().nullable().optional(),
	CreatedBy: z.string().optional(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),
}).refine(
	(data) => {
		// At least one azimuth measurement should be provided
		if (data.Depth !== undefined && data.Dip !== undefined) {
			return (
				data.AzimuthMagnetic !== undefined
				|| data.AzimuthUTM !== undefined
				|| data.AzimuthUTMField !== undefined
				|| data.AzimuthMagneticReversed !== undefined
			);
		}
		return true;
	},
	{
		message: "At least one azimuth measurement (Magnetic, UTM, or UTM Field) is required",
		path: ["AzimuthMagnetic"],
	},
);

/**
 * Infer TypeScript type from schema
 */
export type SurveyData = z.infer<typeof surveySchema>;

/**
 * Create empty Survey record with sensible defaults
 */
export function createEmptySurveyData(): SurveyData {
	return {
		SurveyLogId: crypto.randomUUID(),
		Organization: undefined,
		Depth: 0,
		Dip: 0,
		AzimuthMagnetic: 0,
		DownHoleSurveyMethod: undefined,
		SurveyCompany: undefined,
		SurveyReliability: undefined,
		Grid: undefined,

		ReportIncludeInd: false,
		// ValidationStatus: 0,
		// RowStatus: 0,
		ActiveInd: true,

		SurveyId: "",
		// CollarId: '',
		DataSource: "",
		// DownHoleSurveyMethod: '',
		// Grid: '',
		LoggingEventId: "",
		// Organization: '',
		// SurveyCompany: '',
		SurveyInstrument: "",
		SurveyOperator: "",
	// SurveyReliability: ''
	};
}

/**
 * Schema for an array of Survey records
 */
// export const surveyArraySchema = z.array(surveySchema);

/**
 * Type for array of Survey records
 */
// export type SurveyArray = z.infer<typeof surveyArraySchema>;
