/**
 * Dispatch Validation Schemas
 *
 * Defines Zod schemas for validating LabDispatch and SampleDispatch data.
 * Handles validation for sample dispatch batches sent to laboratories.
 */

import { z } from "zod";
import { createLookupSchema, depthSchema } from "./base-schemas";

/**
 * Lab Dispatch validation schema
 *
 * Validates dispatch header information including lab details, sample types,
 * instructions, addresses, and authorization.
 */
export const labDispatchSchema = z.object({
	// Primary Keys
	LabDispatchId: z.string().uuid("Invalid dispatch ID format"),
	DispatchNumber: z.string().min(1, "Dispatch number is required"),
	Organization: z.string().min(1, "Organization is required"),

	// Drill Hole Context
	CollarId: z.string().uuid("Invalid collar ID format"),
	HoleNm: z.string().min(1, "Hole name is required"),
	Project: z.string().optional(),

	// Laboratory Details - Required
	LabCode: createLookupSchema("Lab", true),
	ClientCode: z.string().optional(),

	// Dispatch Details - Required
	DispatchedDt: z.string().regex(
		/^\d{4}-\d{2}-\d{2}$/,
		"Date must be in YYYY-MM-DD format",
	),
	SubmittedBy: z.string().min(1, "Submitted by is required"),
	CourierName: z.string().optional(),
	WaybillNo: z.string().optional(),
	WorkorderNo: z.string().optional(),
	QuoteNo: z.string().optional(),
	OrderNo: z.string().optional(),

	// Sample Type Categories
	SampleTypeRock: z.boolean(),
	SampleTypeSediment: z.boolean(),
	SampleTypeDrillCore: z.boolean(),
	SampleTypeSoil: z.boolean(),
	SampleTypePercussion: z.boolean(),
	SampleTypeOther: z.string().optional(),

	// Analysis Details
	ElementsOrMethods: z.string().optional(),
	SpecialInstructions: z.string().optional(),
	Priority: z.string().optional(),

	// Pulp Instructions
	PulpReturnInd: z.boolean(),
	PulpReturnAfter90Days: z.boolean(),
	PulpDiscardAfter90Days: z.boolean(),
	PulpPaidStorageAfter90Days: z.boolean(),

	// Reject Instructions
	RejectReturnInd: z.boolean(),
	RejectReturnAfter90Days: z.boolean(),
	RejectDiscardAfter90Days: z.boolean(),
	RejectPaidStorageAfter90Days: z.boolean(),

	// Addresses
	ReturnAddressLine1: z.string().optional(),
	ReturnAddressLine2: z.string().optional(),
	ReturnAddressLine3: z.string().optional(),
	CopyToName: z.string().optional(),
	CopyToAddressLine1: z.string().optional(),
	CopyToAddressLine2: z.string().optional(),
	InvoiceToName: z.string().optional(),
	InvoiceToAddressLine1: z.string().optional(),
	InvoiceToAddressLine2: z.string().optional(),

	// Authorization - Required
	AuthorizedByName: z.string().min(1, "Authorization name is required"),
	AuthorizedBySignature: z.string().optional(),

	// Certificates
	CertificateInd: z.boolean(),
	CertificateEmail: z.string().email("Invalid email format").optional().or(z.literal("")),
	CertificateFax: z.string().optional(),

	// Notifications
	WebNotificationInd: z.boolean(),
	EmailNotificationInd: z.boolean(),
	EmailAddress: z.string().email("Invalid email format").optional().or(z.literal("")),
	FaxNumber: z.string().optional(),

	// Summary
	TotalSampleCount: z.number().nonnegative("Sample count cannot be negative"),
	TotalWeight: z.number().nonnegative("Total weight cannot be negative").optional(),

	// Lab Tracking
	LabReceivedDt: z.string().regex(
		/^\d{4}-\d{2}-\d{2}$/,
		"Date must be in YYYY-MM-DD format",
	).optional(),
	LabReceivedBy: z.string().optional(),
	DateReceived: z.string().regex(
		/^\d{4}-\d{2}-\d{2}$/,
		"Date must be in YYYY-MM-DD format",
	).optional(),

	// Status
	DispatchStatus: z.string().min(1, "Dispatch status is required"),

	// Standard Metadata
	ActiveInd: z.boolean().default(true),
	RowStatus: z.number().default(0),
	ReportIncludeInd: z.boolean().default(true),
	ValidationStatus: z.number().default(0).optional(),
	ValidationErrors: z.string().nullable().optional(),
	SupersededById: z.string().uuid().optional(),
	rv: z.string().optional(),
	CreatedOnDt: z.string().optional(),
	CreatedBy: z.string().optional(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),
}).refine(
	(data) => {
		// At least one sample type must be selected
		return (
			data.SampleTypeRock
			|| data.SampleTypeSediment
			|| data.SampleTypeDrillCore
			|| data.SampleTypeSoil
			|| data.SampleTypePercussion
			|| (data.SampleTypeOther && data.SampleTypeOther.trim().length > 0)
		);
	},
	{
		message: "At least one sample type must be selected",
		path: ["SampleTypeRock"],
	},
).refine(
	(data) => {
		// If pulp return is indicated, at least one return option must be selected
		if (data.PulpReturnInd) {
			return (
				data.PulpReturnAfter90Days
				|| data.PulpDiscardAfter90Days
				|| data.PulpPaidStorageAfter90Days
			);
		}
		return true;
	},
	{
		message: "Select at least one pulp handling option when pulp return is requested",
		path: ["PulpReturnAfter90Days"],
	},
).refine(
	(data) => {
		// If reject return is indicated, at least one return option must be selected
		if (data.RejectReturnInd) {
			return (
				data.RejectReturnAfter90Days
				|| data.RejectDiscardAfter90Days
				|| data.RejectPaidStorageAfter90Days
			);
		}
		return true;
	},
	{
		message: "Select at least one reject handling option when reject return is requested",
		path: ["RejectReturnAfter90Days"],
	},
).refine(
	(data) => {
		// Dispatch date cannot be in the future
		if (data.DispatchedDt) {
			const dispatchDate = new Date(data.DispatchedDt);
			const today = new Date();
			today.setHours(0, 0, 0, 0); // Compare dates only
			return dispatchDate <= today;
		}
		return true;
	},
	{
		message: "Dispatch date cannot be in the future",
		path: ["DispatchedDt"],
	},
);

/**
 * Infer TypeScript type from lab dispatch schema
 */
export type LabDispatchData = z.infer<typeof labDispatchSchema>;

/**
 * Sample Dispatch validation schema
 *
 * Validates individual sample records within a dispatch batch.
 */
export const sampleDispatchSchema = z.object({
	// Primary Key
	SampleDispatchId: z.string().uuid("Invalid sample dispatch ID format"),

	// Foreign Keys
	SampleId: z.string().uuid("Invalid sample ID format"),
	LabDispatchId: z.string().uuid("Invalid lab dispatch ID format"),
	CollarId: z.string().uuid("Invalid collar ID format"),
	Organization: z.string().min(1, "Organization is required"),

	// Sample Information (denormalized)
	SampleNm: z.string().min(1, "Sample name is required"),
	DepthFrom: depthSchema,
	DepthTo: depthSchema,
	SampleWeight: z.number().nonnegative("Weight cannot be negative").optional(),
	SampleType: z.string().optional(),

	// Dispatch Details
	DispatchSequence: z.number().positive("Sequence must be positive"),
	ElementsOrMethodCodes: z.string().optional(),
	RushInd: z.boolean().default(false),
	DispatchStatus: z.string().min(1, "Status is required"),

	// Standard Metadata
	ActiveInd: z.boolean().default(true),
	RowStatus: z.number().default(0),
	ReportIncludeInd: z.boolean().default(true),
	ValidationStatus: z.number().default(0).optional(),
	ValidationErrors: z.string().nullable().optional(),
	SupersededById: z.string().uuid().optional(),
	rv: z.string().optional(),
	CreatedOnDt: z.string().optional(),
	CreatedBy: z.string().optional(),
	ModifiedOnDt: z.string().optional(),
	ModifiedBy: z.string().optional(),
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
 * Infer TypeScript type from sample dispatch schema
 */
export type SampleDispatchData = z.infer<typeof sampleDispatchSchema>;

/**
 * Create empty Lab Dispatch data with sensible defaults
 *
 * Provides a new dispatch record with all required fields populated
 * and sensible default values for common scenarios.
 *
 * @returns Partial lab dispatch data ready for form initialization
 */
export function createEmptyLabDispatchData(): Partial<LabDispatchData> {
	return {
		LabDispatchId: crypto.randomUUID(),
		DispatchNumber: "", // Generated server-side
		Organization: "",
		CollarId: "",
		HoleNm: "",
		Project: "",
		LabCode: "",
		ClientCode: "",
		DispatchedDt: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
		SubmittedBy: "",
		CourierName: "",
		WaybillNo: "",
		WorkorderNo: "",
		QuoteNo: "",
		OrderNo: "",

		// Sample types - Default to drill core for drill hole context
		SampleTypeRock: false,
		SampleTypeSediment: false,
		SampleTypeDrillCore: true,
		SampleTypeSoil: false,
		SampleTypePercussion: false,
		SampleTypeOther: "",

		ElementsOrMethods: "",
		SpecialInstructions: "",
		Priority: "Normal",

		// Pulp/Reject defaults - all false
		PulpReturnInd: false,
		PulpReturnAfter90Days: false,
		PulpDiscardAfter90Days: false,
		PulpPaidStorageAfter90Days: false,
		RejectReturnInd: false,
		RejectReturnAfter90Days: false,
		RejectDiscardAfter90Days: false,
		RejectPaidStorageAfter90Days: false,

		// Addresses
		ReturnAddressLine1: "",
		ReturnAddressLine2: "",
		ReturnAddressLine3: "",
		CopyToName: "",
		CopyToAddressLine1: "",
		CopyToAddressLine2: "",
		InvoiceToName: "",
		InvoiceToAddressLine1: "",
		InvoiceToAddressLine2: "",

		// Authorization
		AuthorizedByName: "",
		AuthorizedBySignature: "",

		// Certificates - Default to enabled
		CertificateInd: true,
		CertificateEmail: "",
		CertificateFax: "",

		// Notifications - Default to enabled
		WebNotificationInd: true,
		EmailNotificationInd: true,
		EmailAddress: "",
		FaxNumber: "",

		// Summary
		TotalSampleCount: 0,
		TotalWeight: 0,

		// Lab tracking
		LabReceivedDt: undefined,
		LabReceivedBy: "",
		DateReceived: undefined,

		// Status
		DispatchStatus: "Draft",

		// Standard metadata
		ActiveInd: true,
		RowStatus: 0,
		ReportIncludeInd: true,
		ValidationStatus: 0,
		ValidationErrors: null,
		SupersededById: undefined,
		rv: "",
		CreatedOnDt: new Date().toISOString(),
		CreatedBy: "",
		ModifiedOnDt: undefined,
		ModifiedBy: "",
	};
}

/**
 * Create empty Sample Dispatch data with sensible defaults
 *
 * Provides a new sample dispatch record with required fields populated.
 * Used when adding samples to a dispatch batch.
 *
 * @param sampleId - UUID of the sample being dispatched
 * @param labDispatchId - UUID of the parent lab dispatch
 * @param sequence - Order in the dispatch manifest
 * @returns Partial sample dispatch data ready for insertion
 */
export function createEmptySampleDispatchData(sampleId: string,	labDispatchId: string,	sequence: number = 1): Partial<SampleDispatchData> {
	return {
		SampleDispatchId: crypto.randomUUID(),
		SampleId: sampleId,
		LabDispatchId: labDispatchId,
		CollarId: "",
		Organization: "",
		SampleNm: "",
		DepthFrom: 0,
		DepthTo: 0,
		SampleWeight: undefined,
		SampleType: "",
		DispatchSequence: sequence,
		ElementsOrMethodCodes: "",
		RushInd: false,
		DispatchStatus: "Pending",
		ActiveInd: true,
		RowStatus: 0,
		ReportIncludeInd: true,
		ValidationStatus: 0,
		ValidationErrors: null,
		SupersededById: undefined,
		rv: "",
		CreatedOnDt: new Date().toISOString(),
		CreatedBy: "",
		ModifiedOnDt: undefined,
		ModifiedBy: "",
	};
}

/**
 * Schema for an array of Sample Dispatch records
 */
export const sampleDispatchArraySchema = z.array(sampleDispatchSchema);

/**
 * Type for array of Sample Dispatch records
 */
export type SampleDispatchArray = z.infer<typeof sampleDispatchArraySchema>;

/**
 * Dispatch status values
 * Used for status workflow validation
 */
export const DispatchStatusValues = [
	"Draft",
	"Submitted",
	"InTransit",
	"Received",
	"Processing",
	"Complete",
] as const;

export type DispatchStatus = typeof DispatchStatusValues[number];

/**
 * Validate dispatch status transition
 *
 * Ensures status changes follow the defined workflow
 *
 * @param currentStatus - Current dispatch status
 * @param newStatus - Proposed new status
 * @returns true if transition is valid
 */
export function isValidDispatchStatusTransition(
	currentStatus: DispatchStatus,
	newStatus: DispatchStatus,
): boolean {
	const transitions: Record<DispatchStatus, DispatchStatus[]> = {
		Draft: ["Submitted"],
		Submitted: ["InTransit", "Draft"],
		InTransit: ["Received", "Submitted"],
		Received: ["Processing", "InTransit"],
		Processing: ["Complete", "Received"],
		Complete: [], // Terminal state
	};

	return transitions[currentStatus]?.includes(newStatus) ?? false;
}
