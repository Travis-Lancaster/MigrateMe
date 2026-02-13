/**
 * Collar Section Type Definitions
 *
 * Centralized type definitions for the Collar section including
 * field configurations, lookup types, and form state management.
 */

import type { Control } from "react-hook-form";
import type { CollarData } from "../../validation/collar-schemas";

/**
 * Field types supported by CollarSection
 */
export type CollarFieldType
	= | "text"
	  | "number"
	  | "select"
	  | "date"
	  | "autocomplete"
	  | "area";

/**
 * Field grouping for logical organization and visual layout
 */
export enum CollarFieldGroup {
	PERSONNEL = "personnel",
	TIMELINE = "timeline",
	MEASUREMENTS = "measurements",
	TECHNICAL = "technical",
	METADATA = "metadata",
	COMMENTS = "comments",
}

/**
 * Field configuration interface for declarative field definitions
 */
export interface CollarFieldConfig {
	/** Field name from CollarData schema */
	name: keyof CollarData

	/** Display label for the field */
	label: string

	/** Input type for the field */
	type: CollarFieldType

	/** Lookup key for autocomplete/select fields */
	lookupKey?: keyof CollarLookups

	/** Logical grouping for organization */
	group: CollarFieldGroup

	/** Grid span (1-3 for 3-column layout) */
	span?: number

	/** Whether field is required */
	required?: boolean

	/** Placeholder text */
	placeholder?: string

	/** Display order within group */
	order: number

	/** Read-only fields (shown but not editable) */
	readOnly?: boolean
}

/**
 * Field properties returned by getFieldProps helper
 */
export interface CollarFieldProps {
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
 * All lookup options used in Collar section
 */
export interface CollarLookups {
	projects: LookupOption[]
	prospects: LookupOption[]
	targets: LookupOption[]
	subTargets: LookupOption[]
	pits: LookupOption[]
	phases: LookupOption[]
	sections: LookupOption[]
	tenements: LookupOption[]
	holeTypes: LookupOption[]
	holeStatus: LookupOption[]
	holePurposes: LookupOption[]
	holePurposeDetails: LookupOption[]
	collarTypes: LookupOption[]
	grids: LookupOption[]
	rlSources: LookupOption[]
	surveyMethods: LookupOption[]
	surveyCompanies: LookupOption[]
	instruments: LookupOption[]
	explorationCompanies: LookupOption[]
	orientationTools: LookupOption[]
	persons: LookupOption[]
}

/**
 * Return type for useCollarForm hook
 */
export interface UseCollarFormReturn {
	/** React Hook Form control object */
	control: Control<CollarData>

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
	getFieldProps: (fieldName: keyof CollarData) => CollarFieldProps
}

/**
 * Layout constants
 */
export const COLLAR_LAYOUT = {
	COLUMNS: 3,
	FIELD_SPAN_FULL: 3,
	FIELD_SPAN_HALF: 1,
} as const;

/**
 * Group display configuration
 */
export interface GroupConfig {
	title?: string
	columns?: number
	description?: string
}

export const COLLAR_GROUP_CONFIG: Record<CollarFieldGroup, GroupConfig> = {
	[CollarFieldGroup.PERSONNEL]: {
		title: "Personnel Information",
		columns: 2,
	},
	[CollarFieldGroup.TIMELINE]: {
		title: "Timeline",
		columns: 2,
	},
	[CollarFieldGroup.MEASUREMENTS]: {
		title: "Measurements",
		columns: 2,
	},
	[CollarFieldGroup.TECHNICAL]: {
		title: "Technical Information",
		columns: 2,
	},
	[CollarFieldGroup.METADATA]: {
		title: "Metadata",
		columns: 2,
	},
	[CollarFieldGroup.COMMENTS]: {
		columns: 1,
	},
};
