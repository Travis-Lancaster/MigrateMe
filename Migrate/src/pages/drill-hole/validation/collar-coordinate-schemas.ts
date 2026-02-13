/**
 * CollarCoordinate Section Validation Schemas
 *
 * Zod validation for CollarCoordinate data section
 */

import { z } from "zod";

import {
	coordinateSchema,
	createLookupSchema,
	isoDateTimeOptional,
	nvarchar,
	stringOptional,
	uuid,
} from "./base-schemas";

export const collarCoordinateSchema = z.object({
	CollarCoordinateId: uuid.optional(),
	Organization: nvarchar(30).min(1, "Organization is required"),
	CollarId: uuid,

	Grid: createLookupSchema("Grid", true),
	East: coordinateSchema.optional().nullable(),
	North: coordinateSchema.optional().nullable(),
	RL: coordinateSchema.optional().nullable(),

	SurveyBy: createLookupSchema("Person", false),
	SurveyMethod: createLookupSchema("SurveyMethod", true),
	SurveyCompany: createLookupSchema("Company", true),
	SurveyOnDt: isoDateTimeOptional,

	PriorityStatus: nvarchar(50),
	Priority: z.number().int().min(0).max(255),

	RLSource: createLookupSchema("RLSource", false),
	Instrument: createLookupSchema("Instrument", false),
	Validated: z.boolean().optional().nullable(),
	ValidatedStatus: z.number().int().min(0).max(255),

	GeoPoint: z.any().optional().nullable(),
	GeoPointWGS: z.any().optional().nullable(),
	IsDeleted: z.boolean().optional().nullable(),

	DataSource: nvarchar(255).min(1, "Data source is required"),
	rv: stringOptional,

	RowStatus: z.number().int().min(0).max(255),
	ReportIncludeInd: z.boolean(),
	ActiveInd: z.boolean(),
	CreatedBy: nvarchar(100),
	CreatedOnDt: z.string(),
	Comments: stringOptional,
});

/**
 * TypeScript type inferred from schema
 */
export type CollarCoordinateData = z.infer<typeof collarCoordinateSchema>;

/**
 * Initial/empty collar coordinate data factory
 */
export function createEmptyCollarCoordinateData(): Partial<CollarCoordinateData> {
	return {
		Priority: 0,
		PriorityStatus: "Archived",
		ValidatedStatus: 0,
		DataSource: "UI",
		RowStatus: 0,
		ReportIncludeInd: false,
		ActiveInd: true,

	};
}
