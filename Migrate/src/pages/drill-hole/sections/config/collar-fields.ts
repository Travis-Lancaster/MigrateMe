/**
 * Collar Field Configuration
 *
 * Declarative field definitions for the Collar section.
 * Single source of truth for field configuration following DRY principle.
 */

import type { CollarFieldConfig } from "../types/collar-types";
import { CollarFieldGroup } from "../types/collar-types";

/**
 * Complete field configuration for Collar section
 * Organized by logical groups with proper ordering
 */
export const COLLAR_FIELD_CONFIG: readonly CollarFieldConfig[] = [
	// ============================================================================
	// PERSONNEL GROUP
	// ============================================================================
	{
		name: "ResponsiblePerson",
		label: "Geologist 1",
		type: "autocomplete",
		lookupKey: "persons",
		group: CollarFieldGroup.PERSONNEL,
		required: true,
		placeholder: "Select Geologist 1",
		span: 1,
		order: 1,
	},
	{
		name: "ResponsiblePerson2",
		label: "Geologist 2",
		type: "autocomplete",
		lookupKey: "persons",
		group: CollarFieldGroup.PERSONNEL,
		required: false,
		placeholder: "Select Geologist 2",
		span: 1,
		order: 2,
	},
	{
		name: "ExplorationCompany",
		label: "Company",
		type: "autocomplete",
		lookupKey: "explorationCompanies",
		group: CollarFieldGroup.PERSONNEL,
		required: true,
		span: 1,
		order: 3,
		readOnly: true, // Display only
	},

	// ============================================================================
	// TIMELINE GROUP
	// ============================================================================
	{
		name: "StartedOnDt",
		label: "Start Date",
		type: "date",
		group: CollarFieldGroup.TIMELINE,
		required: false,
		span: 1,
		order: 1,
	},
	{
		name: "FinishedOnDt",
		label: "Complete Date",
		type: "date",
		group: CollarFieldGroup.TIMELINE,
		required: false,
		span: 1,
		order: 2,
	},

	// ============================================================================
	// MEASUREMENTS GROUP
	// ============================================================================
	{
		name: "WaterTableDepth",
		label: "Water Table Depth",
		type: "number",
		group: CollarFieldGroup.MEASUREMENTS,
		required: false,
		span: 1,
		order: 1,
	},
	{
		name: "WaterTableDepthMeasuredOnDt",
		label: "Measured Date",
		type: "date",
		group: CollarFieldGroup.MEASUREMENTS,
		required: false,
		span: 1,
		order: 2,
	},
	{
		name: "TotalDepth",
		label: "Total Depth",
		type: "number",
		group: CollarFieldGroup.MEASUREMENTS,
		required: false,
		span: 1,
		order: 3,
	},
	{
		name: "CasingDepth",
		label: "Casing Depth",
		type: "number",
		group: CollarFieldGroup.MEASUREMENTS,
		required: false,
		span: 1,
		order: 4,
	},

	// ============================================================================
	// TECHNICAL GROUP
	// ============================================================================
	{
		name: "Redox",
		label: "Redox",
		type: "text",
		group: CollarFieldGroup.TECHNICAL,
		required: false,
		span: 1,
		order: 1,
	},
	{
		name: "PreCollarId",
		label: "Pre-Collar ID",
		type: "text",
		group: CollarFieldGroup.TECHNICAL,
		required: false,
		span: 1,
		order: 2,
	},
	{
		name: "OrientationTool",
		label: "Orientation Tool",
		type: "autocomplete",
		lookupKey: "orientationTools",
		group: CollarFieldGroup.TECHNICAL,
		required: false,
		span: 1,
		order: 3,
	},
	{
		name: "CollarType",
		label: "Collar Type",
		type: "autocomplete",
		lookupKey: "collarTypes",
		group: CollarFieldGroup.TECHNICAL,
		required: true,
		span: 1,
		order: 4,
		readOnly: true, // Display only
	},

	// ============================================================================
	// COMMENTS GROUP
	// ============================================================================
	{
		name: "Comments",
		label: "Comments",
		type: "area",
		group: CollarFieldGroup.COMMENTS,
		required: false,
		span: 3, // Full width
		order: 1,
	},
] as const;

/**
 * Get fields by group for organized rendering
 */
export function getFieldsByGroup(group: CollarFieldGroup): readonly CollarFieldConfig[] {
	return COLLAR_FIELD_CONFIG
		.filter(field => field.group === group)
		.sort((a, b) => a.order - b.order);
}

/**
 * Get field configuration by name
 */
export function getFieldConfig(name: string): CollarFieldConfig | undefined {
	return COLLAR_FIELD_CONFIG.find(field => field.name === name);
}

/**
 * Get all groups in display order
 */
export const COLLAR_GROUP_ORDER: readonly CollarFieldGroup[] = [
	CollarFieldGroup.PERSONNEL,
	CollarFieldGroup.TIMELINE,
	CollarFieldGroup.MEASUREMENTS,
	CollarFieldGroup.TECHNICAL,
	CollarFieldGroup.COMMENTS,
] as const;

/**
 * Get all required field names
 */
export function getRequiredFields(): readonly string[] {
	return COLLAR_FIELD_CONFIG
		.filter(field => field.required)
		.map(field => field.name);
}

/**
 * Check if a field is editable
 */
export function isFieldEditable(name: string): boolean {
	const config = getFieldConfig(name);
	return config ? !config.readOnly : true;
}
