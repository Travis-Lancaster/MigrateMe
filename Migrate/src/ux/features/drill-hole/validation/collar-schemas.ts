/**
 * Collar Section Validation Schemas
 *
 * Zod validation for Collar data section
 */

import { z } from "zod";

import {
	createLookupSchema,
	depthSchema,
	isoDateTimeOptional,
	nvarchar,
	nvarcharOptional,
	stringOptional,
	uuid,
} from "./base-schemas";

export const collarSchema = z.object({
	CollarId: uuid,

	Organization: nvarchar(30).min(1, "Organization is required"),
	ParentCollarId: uuid.optional(),
	LoggingEventId: uuid.optional(),

	Project: createLookupSchema("Project", true),
	Prospect: createLookupSchema("Prospect", true),
	Tenement: createLookupSchema("Tenement", false),
	Target: createLookupSchema("Target", false),
	SubTarget: createLookupSchema("SubTarget", false),
	Pit: createLookupSchema("Pit", false),
	Phase: createLookupSchema("Phase", false),
	Section: createLookupSchema("Section", false),

	HoleType: createLookupSchema("HoleType", true),
	HoleStatus: createLookupSchema("HoleStatus", true),
	HolePurpose: createLookupSchema("HolePurpose", true),
	HolePurposeDetail: createLookupSchema("HolePurposeDetail", true),

	CollarType: createLookupSchema("CollarType", true),
	PreCollarId: nvarcharOptional(50),
	Redox: nvarcharOptional(50),
	CasingDepth: depthSchema.optional().nullable(),
	PreCollarDepth: depthSchema.optional().nullable(),
	StartDepth: depthSchema.optional().nullable(),
	TotalDepth: depthSchema.optional().nullable(),
	StartedOnDt: isoDateTimeOptional,
	FinishedOnDt: isoDateTimeOptional,
	ValidatedStatus: z.number().int().min(0).max(255),
	ApprovedInd: z.boolean(),
	ResponsiblePerson: createLookupSchema("Person", true),
	ResponsiblePerson2: createLookupSchema("Person", true),
	ExplorationCompany: createLookupSchema("Company", true),
	Priority: z.number().int().optional().nullable(),
	WaterTableDepth: depthSchema.optional(),
	WaterTableDepthMeasuredOnDt: isoDateTimeOptional,
	OrientationTool: createLookupSchema("Company", true), // ToDo: Find Correct LookUp
	ModelUseInd: z.boolean().optional().nullable(),
	DataSource: nvarchar(255).min(1, "Data source is required"),

	rv: stringOptional,
	JsonData: stringOptional,

	RowStatus: z.number().int().min(0).max(255),
	ActiveInd: z.boolean(),
	Comments: stringOptional,
});

/**
 * TypeScript type inferred from schema
 */
export type CollarData = z.infer<typeof collarSchema>;

/**
 * Initial/empty collar data factory
 */
export function createEmptyCollarData(): Partial<CollarData> {
	return {
	// ValidatedStatus: 0,
	// DataSource: 'UI',
	// RowStatus: 0,
	// ActiveInd: true
	};
}
