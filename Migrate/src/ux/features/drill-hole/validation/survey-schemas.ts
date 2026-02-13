/**
 * Survey/SurveyLog Validation Schemas
 *
 * Defines Zod schemas for validating Survey (header) and SurveyLog (detail) data.
 * Survey represents the survey header information with only 1 active per Collar.
 * SurveyLog represents individual survey readings at specific depths.
 *
 * Pattern: Master-Detail relationship
 * - Survey (1) has many SurveyLog (*)
 * - Only 1 Survey can be active (ActiveInd=true) per Collar at a time
 */

import { z } from "zod";
import { createLookupSchema } from "./base-schemas";

// ============================================================================
// Survey (Header) Schema
// ============================================================================

/**
 * Core Survey validation schema (header/form data)
 */
export const surveySchema = z.object({
	// Primary Keys
	SurveyId: z.string().uuid(),
	CollarId: z.string().uuid(),
	Organization: z.string().min(1, "Organization is required"),

	// Foreign Keys
	LoggingEventId: z.string().uuid(),

	// Survey Method (Required)
	DownHoleSurveyMethod: z.string().min(1, "Survey method is required"),

	// Survey Details
	SurveyedOnDt: z.string().optional(), // ISO date string
	SurveyCompany: createLookupSchema("SurveyCompany", false),
	SurveyOperator: createLookupSchema("SurveyOperator", false),
	SurveyInstrument: createLookupSchema("SurveyInstrument", false),
	SurveyReliability: createLookupSchema("SurveyReliability", false),
	Grid: createLookupSchema("Grid", false),
	Comments: z.string().max(1000).optional(),
	Validation: z.boolean().optional(),
	DataSource: z.string(),

	// Standard Metadata
	ReportIncludeInd: z.boolean().default(false),
	ValidationStatus: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
	ValidationErrors: z.string().nullable().optional(),
	RowStatus: z.number().int().min(0).max(255).default(0),
	SupersededById: z.string().uuid().nullable().optional(),
	ActiveInd: z.boolean().default(true),

	// Audit Fields
	CreatedOnDt: z.union([z.string(), z.date()]),
	CreatedBy: z.string(),
	ModifiedOnDt: z.union([z.string(), z.date()]).optional(),
	ModifiedBy: z.string().optional(),
	rv: z.string(),

	// Navigation properties (optional, populated by backend)
	collar: z.any().optional(),
	downHoleSurveyMethod: z.any().optional(),
	grid: z.any().optional(),
	loggingEvent: z.any().optional(),
	organization2: z.any().optional(),
	rowStatus2: z.any().optional(),
	surveyCompany: z.any().optional(),
	surveyInstrument: z.any().optional(),
	surveyOperator: z.any().optional(),
	surveyReliability: z.any().optional(),
	surveyLogs: z.any().optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type SurveyData = z.infer<typeof surveySchema>;

/**
 * Create empty Survey record with sensible defaults
 */
export function createEmptySurveyData(): Partial<SurveyData> {
	const now = new Date().toISOString();

	return {
		SurveyId: crypto.randomUUID(),
		CollarId: "",
		Organization: "",
		LoggingEventId: "",
		DownHoleSurveyMethod: "",
		SurveyedOnDt: now,
		SurveyCompany: "",
		SurveyOperator: "",
		SurveyInstrument: "",
		SurveyReliability: "",
		Grid: "",
		Comments: "",
		Validation: false,
		DataSource: "User Entry",
		ReportIncludeInd: false,
		ValidationStatus: 0,
		ValidationErrors: null,
		RowStatus: 0,
		ActiveInd: true,
		CreatedOnDt: now,
		CreatedBy: "system",
		ModifiedOnDt: now,
		ModifiedBy: "system",
		rv: "",
	};
}

// ============================================================================
// SurveyLog (Detail) Schema
// ============================================================================

/**
 * Core SurveyLog validation schema (detail/grid data)
 * Represents individual survey readings at specific depths
 */
export const surveyLogSchema = z.object({
	// Primary Keys
	SurveyLogId: z.string().uuid(),
	SurveyId: z.string().uuid(),
	Organization: z.string().min(1, "Organization is required"),

	// Foreign Keys
	LoggingEventId: z.string().uuid(),

	// Depth (Required, single value not interval)
	Depth: z.number().min(0, "Depth must be positive"),

	// Survey Method
	DownHoleSurveyMethod: z.string().min(1, "Survey method is required"),

	// Dip and Azimuth Measurements
	Dip: z.number().min(-90).max(90).optional(),
	AzimuthMagnetic: z.number().optional(),
	AzimuthUTMField: z.number().optional(),
	AzimuthUTM: z.number().optional(),

	// Magnetic Measurements
	MagneticStatus: z.string().max(20).optional(),
	AzimuthDeviation: z.number().optional(),
	AzimuthMagneticReversed: z.number().optional(),
	DipDeviation: z.number().optional(),
	MagneticFieldStrength: z.number().optional(),
	MagneticInclination: z.number().optional(),

	// Inherited from Survey header
	SurveyedOnDt: z.string().optional(),
	SurveyCompany: z.string().optional(),
	SurveyOperator: z.string().optional(),
	SurveyInstrument: z.string().optional(),
	SurveyReliability: z.string().optional(),
	Grid: z.string().optional(),
	Deviation: z.string().max(1).optional(),
	Comments: z.string().max(1000).optional(),
	Validation: z.boolean().optional(),
	DataSource: z.string(),

	// Standard Metadata
	ReportIncludeInd: z.boolean().default(false),
	ValidationStatus: z.union([z.literal(0), z.literal(1), z.literal(2)]).default(0),
	ValidationErrors: z.string().nullable().optional(),
	RowStatus: z.number().int().min(0).max(255).default(0),
	SupersededById: z.string().uuid().nullable().optional(),
	ActiveInd: z.boolean().default(true),

	// Audit Fields
	CreatedOnDt: z.union([z.string(), z.date()]),
	CreatedBy: z.string(),
	ModifiedOnDt: z.union([z.string(), z.date()]).optional(),
	ModifiedBy: z.string().optional(),
	rv: z.string(),

	// Navigation properties (optional, populated by backend)
	downHoleSurveyMethod: z.any().optional(),
	grid: z.any().optional(),
	loggingEvent: z.any().optional(),
	organization2: z.any().optional(),
	rowStatus2: z.any().optional(),
	survey: z.any().optional(),
	surveyCompany: z.any().optional(),
	surveyInstrument: z.any().optional(),
	surveyOperator: z.any().optional(),
	surveyReliability: z.any().optional(),
}).refine(
	(data) => {
		// Validate Dip is within range if provided
		if (data.Dip !== undefined && data.Dip !== null) {
			return data.Dip >= -90 && data.Dip <= 90;
		}
		return true;
	},
	{
		message: "Dip must be between -90 and 90 degrees",
		path: ["Dip"],
	},
);

/**
 * Infer TypeScript type from schema
 */
export type SurveyLogData = z.infer<typeof surveyLogSchema>;

/**
 * Create empty SurveyLog record with sensible defaults
 *
 * @param surveyHeader - Parent Survey header to copy metadata from
 * @param depth - Starting depth for the new log entry
 */
export function createEmptySurveyLogData(surveyHeader?: Partial<SurveyData>,	depth: number = 0): Partial<SurveyLogData> {
	const now = new Date().toISOString();

	return {
		SurveyLogId: crypto.randomUUID(),
		SurveyId: surveyHeader?.SurveyId || "",
		Organization: surveyHeader?.Organization || "",
		LoggingEventId: surveyHeader?.LoggingEventId || "",
		Depth: depth,
		DownHoleSurveyMethod: surveyHeader?.DownHoleSurveyMethod || "",
		Dip: undefined,
		AzimuthMagnetic: undefined,
		AzimuthUTMField: undefined,
		AzimuthUTM: undefined,
		MagneticStatus: "",
		AzimuthDeviation: undefined,
		AzimuthMagneticReversed: undefined,
		DipDeviation: undefined,
		MagneticFieldStrength: undefined,
		MagneticInclination: undefined,
		// Inherit from Survey header
		SurveyedOnDt: surveyHeader?.SurveyedOnDt,
		SurveyCompany: surveyHeader?.SurveyCompany,
		SurveyOperator: surveyHeader?.SurveyOperator,
		SurveyInstrument: surveyHeader?.SurveyInstrument,
		SurveyReliability: surveyHeader?.SurveyReliability,
		Grid: surveyHeader?.Grid,
		Comments: "",
		Validation: false,
		DataSource: surveyHeader?.DataSource || "User Entry",
		ReportIncludeInd: false,
		ValidationStatus: 0,
		ValidationErrors: null,
		RowStatus: 0,
		ActiveInd: true,
		CreatedOnDt: now,
		CreatedBy: "system",
		ModifiedOnDt: now,
		ModifiedBy: "system",
		rv: "",
	};
}

// ============================================================================
// Combined Schema (Master-Detail)
// ============================================================================

/**
 * Combined Survey + SurveyLog schema for section storage
 * This is the structure used in the store
 */
export const surveyWithLogsSchema = z.object({
	header: surveySchema,
	logs: z.array(surveyLogSchema),
});

/**
 * Infer TypeScript type for combined data
 */
export type SurveyWithLogs = z.infer<typeof surveyWithLogsSchema>;

/**
 * Create empty SurveyWithLogs structure
 */
export function createEmptySurveyWithLogs(): SurveyWithLogs {
	return {
		header: createEmptySurveyData() as SurveyData,
		logs: [],
	};
}

// ============================================================================
// Array Schemas (for API responses)
// ============================================================================

/**
 * Schema for an array of Survey records
 */
export const surveyArraySchema = z.array(surveySchema);

/**
 * Type for array of Survey records
 */
export type SurveyArray = z.infer<typeof surveyArraySchema>;

/**
 * Schema for an array of SurveyLog records
 */
export const surveyLogArraySchema = z.array(surveyLogSchema);

/**
 * Type for array of SurveyLog records
 */
export type SurveyLogArray = z.infer<typeof surveyLogArraySchema>;
