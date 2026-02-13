/**
 * Sample Validation Schemas
 *
 * Defines Zod schemas for validating Sample data.
 * Sample records track drill core/chip samples and QAQC materials.
 */

import { z } from "zod";

import { createLookupSchema, depthSchema } from "./base-schemas";

/**
 * Core Sample validation schema
 */
export const sampleSchema = z.object({
	// Primary Keys
	SampleId: z.string().uuid(),
	SampleNm: z.string().min(1, "Sample ID is required"),
	CollarId: z.string().uuid(),
	Organization: z.string(),

	// Depth Interval - Required fields
	DepthFrom: depthSchema,
	DepthTo: depthSchema,
	IntervalLength: z.number().optional(),

	// Sample Details
	SampleType: createLookupSchema("SampleType", false),
	SampleClassification: z.string().optional(), // ORIG, BLK, STD, PREPDUP, FDUP
	RodNo: z.number().optional(),
	SampleMethod: z.string().optional(),

	// QAQC Fields
	StandardId: z.string().optional(),
	OriginalSampleId: z.string().optional(),
	OriginalSampleNm: z.string().optional(),
	SourceTable: z.string().optional(),

	// Personnel and Dates
	SampledBy: z.string().optional(),
	SampledDt: z.string().optional(), // ISO date string

	// Weights (all in kg)
	SampleWeight: z.number().optional(),
	FieldSampleWeight: z.number().optional(),
	LabSpWeight: z.number().optional(),
	WitSpWeight: z.number().optional(),
	LogSpWeight: z.number().optional(),

	// Recovery
	SubjectiveRecovery: z.string().optional(),

	// Contamination
	Contamination: z.string().optional(),

	// Comments
	Comments: z.string().optional(),

	// Metadata
	ActiveInd: z.boolean().default(true),
	RowStatus: z.number().default(-99),
	IsLab: z.boolean().default(false),
	ReportIncludeInd: z.boolean().default(false).optional(),

	// Audit Fields
	rv: z.string().optional(),
	CreatedOnDt: z.string().optional(),
	CreatedBy: z.string().optional(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),
	ValidationStatus: z.string().optional(),
	ValidationErrors: z.string().nullable().optional(),
	SupersededById: z.string().optional(),
}).refine(
	(data) => {
		// Validate depth interval: DepthTo must be greater than DepthFrom
		if (data.DepthFrom !== undefined && data.DepthTo !== undefined) {
			return data.DepthTo > data.DepthFrom;
		}
		return true;
	},
	{
		message: "Depth To must be greater than Depth From",
		path: ["DepthTo"],
	},
);

/**
 * Infer TypeScript type from schema
 */
export type SampleData = z.infer<typeof sampleSchema>;

/**
 * Create empty Sample record with sensible defaults
 *
 * @param depthFrom - Starting depth for the sample (default 0)
 * @returns Partial sample data with required fields populated
 */
export function createEmptySampleData(depthFrom = 0): Partial<SampleData> {
	return {
		SampleId: crypto.randomUUID(),
		SampleNm: "",
		CollarId: "",
		Organization: "",
		DepthFrom: depthFrom,
		DepthTo: 0,
		IntervalLength: 0,
		ActiveInd: true,
		RowStatus: 0,
		IsLab: false,
		rv: "",
		CreatedOnDt: new Date().toISOString(),
		CreatedBy: "",
	};
}

/**
 * Schema for an array of Sample records
 */
export const sampleArraySchema = z.array(sampleSchema);

/**
 * Type for array of Sample records
 */
export type SampleArray = z.infer<typeof sampleArraySchema>;

/**
 * Standard Sequence Entry Schema
 * Defines a single entry in the standard rotation sequence
 */
export const standardSequenceEntrySchema = z.object({
	QCInsertionRuleStandardSequenceId: z.string().optional(),
	StandardId: z.string().min(1, "StandardId is required"),
	SortOrder: z.number().min(1, "Order must be at least 1"),
	IsRepeatStart: z.boolean(),
});

export type StandardSequenceEntry = z.infer<typeof standardSequenceEntrySchema>;

/**
 * QAQC Insertion Rule schema
 * Defines the configuration for automatic QAQC sample insertion
 */
export const qaqcInsertionRuleSchema = z.object({
	QCInsertionRuleId: z.string().optional(),
	Code: z.string().min(1, "Code is required"), // Rule name/code for identification
	Description: z.string().min(1, "Description is required"), // Rule description
	IsDefaultInd: z.boolean(), // Whether this is the default rule
	Organization: z.string().min(1, "Organization is required"),
	Laboratory: z.string().optional(),
	RackSize: z.number().optional(),

	// Sample Generation
	SampleIntervalSize: z.number().positive("Must be positive"), // meters between samples

	// QAQC Sample Type Frequencies
	BlankFrequency: z.number().min(1, "Must be at least 1"),
	StandardFrequency: z.number().min(1, "Must be at least 1"),
	PrepDupFrequency: z.number().min(1, "Must be at least 1"),
	FDupFrequency: z.number().min(1, "Must be at least 1"),

	// Sample ID Configuration
	SampleIdPrefix: z.string().min(1, "Prefix is required"),

	// Standard Sequence Configuration
	StandardSequence: z.array(standardSequenceEntrySchema),

	// Metadata
	ActiveInd: z.boolean().default(true).optional(),
	rv: z.string().optional(),
	CreatedOnDt: z.string().optional(),
	CreatedBy: z.string().optional(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),
}).refine((data) => {
	// Validate only one repeat start marker in sequence
	if (data.StandardSequence && data.StandardSequence.length > 0) {
		const repeatStartCount = data.StandardSequence.filter(s => s.IsRepeatStart).length;
		return repeatStartCount <= 1;
	}
	return true;
}, {
	message: "Only one repeat start marker allowed in standard sequence",
	path: ["StandardSequence"],
});

/**
 * Type for QAQC insertion rule
 */
export type QaqcInsertionRule = z.infer<typeof qaqcInsertionRuleSchema>;

/**
 * QAQC statistics interface
 */
export interface QaqcStatistics {
	totalSamples: number
	regularSamples: number
	qaqcSamples: number
	blanks: number
	standards: number
	duplicates: number
	qaqcPercentage: number
}

/**
 * Sample generation options interface
 */
export interface SampleGenerationOptions {
	totalDepth: number
	intervalSize: number
	existingSamples: SampleData[]
	collarId: string
	organization: string
	holeNm: string
	project: string
}
