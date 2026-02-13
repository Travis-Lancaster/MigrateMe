/**
 * RigSheet Section Type Definitions
 *
 * Centralized type definitions for the RigSheet section including
 * field configurations, lookup types, and form state management.
 *
 * Follows the same pattern as collar-types.ts for consistency.
 */

import type { Control } from "react-hook-form";
import type { RigSheetData } from "../../validation/rigsheet-schemas";

/**
 * Field types supported by RigSheetSection
 */
export type RigSheetFieldType
	= | "text"
	  | "number"
	  | "select"
	  | "date"
	  | "autocomplete"
	  | "area";

/**
 * Field grouping for logical organization and visual layout
 */
export enum RigSheetFieldGroup {
	ORGANIZATION = "organization",
	DRILLING = "drilling",
	SUPERVISOR = "supervisor",
	DOWN_HOLE_SURVEY = "downHoleSurvey",
	FINAL_GEOLOGIST = "finalGeologist",
	FINAL_SETUP = "finalSetup",
	FINAL_SURVEY = "finalSurvey",
	PAD_INSPECTION = "padInspection",
	RIG_ALIGNMENT = "rigAlignment",
	SURVEY = "survey",
	GENERAL = "general",
}

/**
 * Field properties returned by getFieldProps helper
 */
export interface RigSheetFieldProps {
	isDirty: boolean
	validateStatus?: "" | "success" | "warning" | "error" | "validating"
	readOnly?: boolean
}

/**
 * Lookup options type (value/label pairs)
 */
export interface LookupOption {
	value: string | number
	label: string | number
}

/**
 * All lookup options used in RigSheet section
 */
export interface RigSheetLookups {
	organizations: LookupOption[]
	drillingCompanies: LookupOption[]
	persons: LookupOption[]
	surveyReferences: LookupOption[]
}

/**
 * Return type for useRigSheetForm hook
 */
export interface UseRigSheetFormReturn {
	/** React Hook Form control object */
	control: Control<RigSheetData>

	/** Form-level dirty state */
	isDirty: boolean

	/** Field-level validation errors */
	errors: Record<string, string>

	/** Form-level validation state */
	isValid: boolean

	/** Save handler */
	onSave: () => Promise<void>

	/** Submit handler */
	onSubmit: () => Promise<void>

	/** Reject handler */
	onReject: () => Promise<void>

	/** Review handler */
	onReview: () => Promise<void>

	/** Approve handler */
	onApprove: () => Promise<void>

	/** Exclude handler */
	onExclude: () => Promise<void>

	/** Get field-specific props (validation, dirty state) */
	getFieldProps: (fieldName: keyof RigSheetData) => RigSheetFieldProps
}

/**
 * Layout constants
 */
export const RIGSHEET_LAYOUT = {
	COLUMNS: 3,
	FIELD_SPAN_FULL: 3,
	FIELD_SPAN_HALF: 1,
} as const;
