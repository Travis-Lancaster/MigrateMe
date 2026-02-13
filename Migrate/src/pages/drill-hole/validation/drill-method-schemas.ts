/**
 * DrillMethod Validation Schemas
 *
 * Defines Zod schemas for validating DrillMethod interval data.
 * DrillMethod records track drilling techniques used across different depth intervals.
 */

import { z } from "zod";

import { createLookupSchema, depthSchema } from "./base-schemas";

/**
 * Core DrillMethod validation schema
 */
export const drillMethodSchema = z.object({
	// Metadata
	ReportIncludeInd: z.boolean().default(false),
	ValidationStatus: z.union([
		z.literal(0),
		z.literal(1),
		z.literal(2),
		z.string(), // Keep string for backward compatibility
	]).optional().transform((val) => {
		// Normalize to number
		if (typeof val === "string") {
			const num = Number.parseInt(val, 10);
			return isNaN(num) ? 0 : num as 0 | 1 | 2;
		}
		return (val || 0) as 0 | 1 | 2;
	}),
	ValidationErrors: z.string().nullable().optional(),
	RowStatus: z.string().optional(),
	SupersededById: z.string().optional(),
	ActiveInd: z.boolean().default(true),

	// Audit Fields
	rv: z.string().optional(),
	CreatedOnDt: z.string().optional(),
	CreatedBy: z.string().optional(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),

	// Primary Keys
	DrillMethodId: z.string().uuid(),
	CollarId: z.string().uuid(),

	// Comments
	Comments: z.string().optional(),

	// Depth Interval - Required fields
	DepthFrom: depthSchema,
	DepthTo: depthSchema,

	// Drilling Details
	DrillCompany: createLookupSchema("DrillCompany", false),
	Driller1: z.string().optional(),
	Driller2: z.string().optional(),
	DrillRigType: createLookupSchema("DrillRigType", false),
	DrillSize: createLookupSchema("DrillSize", false),
	DrillType: createLookupSchema("DrillType", false),

	// Dates
	EndDt: z.string().optional(), // ISO date string

	Organization: createLookupSchema("Organization", false),

	// Sample Information
	SampleType: createLookupSchema("SampleType", false),

	StartDt: z.string().optional(),

	// Navigation properties (optional, populated by backend)
	collar2: z.any().optional(),
	drillCompany2: z.any().optional(),
	drillRigType2: z.any().optional(),
	drillSize2: z.any().optional(),
	drillType2: z.any().optional(),
	organization2: z.any().optional(),
	rowStatus2: z.any().optional(),
	sampleType2: z.any().optional(),
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
export type DrillMethodData = z.infer<typeof drillMethodSchema>;

/**
 * Create empty DrillMethod record with sensible defaults
 */
export function createEmptyDrillMethodData(): Partial<DrillMethodData> {
	return {
		DrillMethodId: crypto.randomUUID(),
		CollarId: "",
		Organization: "",
		DepthFrom: 0,
		DepthTo: 0,
		DrillCompany: "",
		DrillRigType: "",
		DrillSize: "",
		DrillType: "",
		SampleType: "",
		ActiveInd: true,
		ReportIncludeInd: false,
		rv: "",
		CreatedOnDt: new Date().toISOString(),
		CreatedBy: "",
	};
}

/**
 * Schema for an array of DrillMethod records
 */
export const drillMethodArraySchema = z.array(drillMethodSchema);

/**
 * Type for array of DrillMethod records
 */
export type DrillMethodArray = z.infer<typeof drillMethodArraySchema>;
