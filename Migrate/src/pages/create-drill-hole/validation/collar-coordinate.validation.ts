/**
 * CollarCoordinate Section Validation
 *
 * Two-tier validation: Database (hard/blocking) + Save (soft/warnings)
 *
 * References:
 * - MiningDb7/DrillHole.CollarCoordinate.Table.sql
 * - constraint-error-messages.ts (CollarCoordinate constraints)
 */

import { z } from "zod";
import {
	lookupCodeOptional,
	uuid,
} from "./base-schemas";
import { COORDINATE_BOUNDS, STATUS_CODES } from "./constants";

// ============================================================================
// Database Schema (Hard Validation - Blocks Save)
// ============================================================================

/**
 * Database-level validation for CollarCoordinate section
 * Enforces SQL constraints and referential integrity
 * Validation failures BLOCK save operations
 */
export const collarCoordinateDatabaseSchema = z.object({
	// Primary Keys & Foreign Keys
	CollarCoordinateId: uuid.optional().nullable(), // Generated if not provided
	CollarId: uuid,
	Organization: z.string().min(1, "Organization is required").max(30),

	// Required fields
	Grid: z.string().min(1, "Grid is required").max(50),
	DataSource: z.string().min(1, "Data source is required").max(255),

	// Coordinate fields
	East: z.number().finite().optional().nullable(),
	North: z.number().finite().optional().nullable(),
	RL: z.number().finite().optional().nullable(), // Reduced Level (elevation)

	// Survey information
	SurveyBy: lookupCodeOptional,
	SurveyMethod: lookupCodeOptional,
	SurveyCompany: lookupCodeOptional,
	SurveyOnDt: z.string().datetime({ offset: true }).optional().nullable(),

	// Priority and status
	PriorityStatus: z.string().max(50).optional().nullable(),
	Priority: z.number().int().min(0).max(255).optional().nullable(),

	// Validation fields
	RLSource: lookupCodeOptional,
	Instrument: lookupCodeOptional,
	Validated: z.boolean().optional().nullable(),
	ValidatedStatus: z.number().int().min(0).max(255).optional().nullable(),
})
// CK_CollarCoordinate: PriorityStatus must be "Calculated" or "Archived"
	.refine(
		(data) => {
			if (data.PriorityStatus) {
				return data.PriorityStatus === "Calculated" || data.PriorityStatus === "Archived";
			}
			return true;
		},
		{
			message: "Priority status must be either \"Calculated\" or \"Archived\"",
			path: ["PriorityStatus"],
		},
	)
// CK_CollHistory_SurveyOnDt: SurveyOnDt <= now
	.refine(
		(data) => {
			if (data.SurveyOnDt) {
				return new Date(data.SurveyOnDt) <= new Date();
			}
			return true;
		},
		{
			message: "Survey date cannot be in the future",
			path: ["SurveyOnDt"],
		},
	);

// ============================================================================
// Save Schema (Soft Validation - Warnings Only)
// ============================================================================

/**
 * Save-level validation for CollarCoordinate section
 * Data quality checks and business rule recommendations
 * Validation failures DO NOT block save operations
 */
export const collarCoordinateSaveSchema = z.object({
	// Coordinate values - warn if extreme
	East: z.number().finite().optional().nullable(),
	North: z.number().finite().optional().nullable(),
	RL: z.number().finite().optional().nullable(),

	// Survey date quality check
	SurveyOnDt: z.string().datetime({ offset: true }).optional().nullable(),

	// Priority value
	Priority: z.number().int().min(0).max(255).optional().nullable(),
	ValidatedStatus: z.number().int().min(0).max(255).optional().nullable(),
})
// Warn if coordinates seem outside reasonable local grid bounds
	.refine(
		(data) => {
			if (data.East != null) {
				return data.East >= COORDINATE_BOUNDS.LOCAL_GRID.min
				  && data.East <= COORDINATE_BOUNDS.LOCAL_GRID.max;
			}
			return true;
		},
		{
			message: `East coordinate outside typical range (${COORDINATE_BOUNDS.LOCAL_GRID.min} to ${COORDINATE_BOUNDS.LOCAL_GRID.max}m)`,
			path: ["East"],
		},
	)
	.refine(
		(data) => {
			if (data.North != null) {
				return data.North >= COORDINATE_BOUNDS.LOCAL_GRID.min
				  && data.North <= COORDINATE_BOUNDS.LOCAL_GRID.max;
			}
			return true;
		},
		{
			message: `North coordinate outside typical range (${COORDINATE_BOUNDS.LOCAL_GRID.min} to ${COORDINATE_BOUNDS.LOCAL_GRID.max}m)`,
			path: ["North"],
		},
	)
// Warn if elevation seems unusual
	.refine(
		(data) => {
			if (data.RL != null) {
				return data.RL >= COORDINATE_BOUNDS.ELEVATION.min
				  && data.RL <= COORDINATE_BOUNDS.ELEVATION.max;
			}
			return true;
		},
		{
			message: `Elevation outside typical range (${COORDINATE_BOUNDS.ELEVATION.min} to ${COORDINATE_BOUNDS.ELEVATION.max}m)`,
			path: ["RL"],
		},
	)
// Recommend validation for high-priority coordinates
	.refine(
		(data) => {
			// If Priority is 0 (highest) and not validated, warn
			if (data.Priority === 0 && data.ValidatedStatus !== STATUS_CODES.VALIDATION.PASSED) {
				return false; // Trigger warning
			}
			return true;
		},
		{
			message: "High-priority coordinate should be validated",
			path: ["ValidatedStatus"],
		},
	);

// ============================================================================
// Type Exports
// ============================================================================

/**
 * TypeScript type for CollarCoordinate data
 * Combines required database fields with optional save fields
 */
export type CollarCoordinateData = z.infer<typeof collarCoordinateDatabaseSchema>
  & Partial<z.infer<typeof collarCoordinateSaveSchema>>;

/**
 * Type for database validation only
 */
export type CollarCoordinateDatabaseData = z.infer<typeof collarCoordinateDatabaseSchema>;

/**
 * Type for save validation only
 */
export type CollarCoordinateSaveData = z.infer<typeof collarCoordinateSaveSchema>;
