/**
 * RigSheet (Rig Setup Sheet) Validation Schemas
 *
 * Defines Zod schemas for validating RigSheet data entry.
 * Covers all fields from RigSetupSheetDto including drilling personnel,
 * survey data, signatures, and setup information.
 */

import { z } from "zod";

/**
 * Core RigSheet validation schema
 */
export const rigSheetSchema = z.object({
	// Metadata (required fields)
	ReportIncludeInd: z.boolean(),
	ValidationStatus: z.number(), // RigSetupValidationStatusEnum (0 | 1 | 2)
	ValidationErrors: z.string().nullable().optional(),
	RowStatus: z.number(), // RigSetupRowStatusEnum (0 | 1 | 2 | 3 | 4)
	SupersededById: z.string().optional(),
	ActiveInd: z.boolean(),
	rv: z.string(),

	// Audit Fields (required fields)
	CreatedOnDt: z.string(),
	CreatedBy: z.string(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),

	// Primary Key
	RigSetupId: z.string(),

	// General Fields
	Comments: z.string().optional(),
	DataSource: z.string(),

	// Down Hole Survey Information (required fields)
	DownHoleSurveyDriller: z.string(),
	DownHoleSurveyDrillerSignature: z.string().optional(),
	DownHoleSurveyDrillerSignatureDt: z.string().optional(),
	DownHoleSurveyDrillingContractor: z.string(),
	DownHoleSurveyRigNo: z.string(),

	// Drilling Company Information (required field)
	DrillingCompany: z.string(),
	DrillingSignature: z.string().optional(),
	DrillingSignatureDt: z.string().optional(),

	// Drill Plan Reference (required field)
	DrillPlanId: z.string(),

	// Drill Supervisor (required field)
	DrillSupervisor: z.string(),

	// Final Geologist Information (required field)
	FinalGeologist: z.string(),
	FinalGeologistSignature: z.string().optional(),
	FinalGeologistSignatureDt: z.string().optional(),

	// Final Survey Measurements
	FinalInclination: z.number().optional(),
	FinalMagAzimuth: z.number().optional(),

	// Final Setup Information (required fields)
	FinalSetupApprovedBy: z.string(),
	FinalSetupDrillSupervisor: z.string(),
	FinalSetupDrillSupervisorSignature: z.string().optional(),
	FinalSetupDrillSupervisorSignatureDt: z.string().optional(),
	FinalSetupSignature: z.string().optional(),
	FinalSetupSignatureDt: z.string().optional(),

	// Organization (required field)
	Organization: z.string(),

	// Pad Inspection (required field)
	PadInspectionCompletedBy: z.string(),
	PadInspectionSignature: z.string().optional(),
	PadInspectionSignatureDt: z.string().optional(),

	// Rig Alignment Tool Measurements
	RigAlignmentToolDip: z.number().optional(),
	RigAlignmentToolMagAzi: z.number().optional(),

	// Survey Measurements
	SurveyDepth: z.number().optional(),
	SurveyDip: z.number().optional(),
	SurveyMagAzi: z.number().optional(),
	SurveyReference: z.string().optional(),
});

/**
 * Infer TypeScript type from schema
 */
export type RigSheetData = z.infer<typeof rigSheetSchema>;

/**
 * Create empty RigSheet data with sensible defaults
 */
export function createEmptyRigSheetData(): Partial<RigSheetData> {
	return {
		ReportIncludeInd: false,
		ActiveInd: true,
	};
}
