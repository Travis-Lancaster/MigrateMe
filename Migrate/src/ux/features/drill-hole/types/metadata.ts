/**
 * Standard Row Metadata
 *
 * Metadata fields included in all drillhole data rows.
 * Tracks row lifecycle, validation, versioning, and audit trail.
 */

import { RowStatusEnum } from "#src/data/domain/schema-helpers/enums.js";

/**
 * Standard metadata fields for all drill hole rows
 */
export interface StandardRowMetadata {
	/** Controls whether the row is included in reports and exports */
	ReportIncludeInd: boolean

	/** Validation status: 0=Unknown, 1=Passed, 2=Failed */
	ValidationStatus: 0 | 1 | 2

	/** Serialized Zod validation issues, null if no errors */
	ValidationErrors: string | null

	/** Current lifecycle status of the row */
	RowStatus: number

	/** UUID of the row that supersedes this one, null if not superseded */
	SupersededById: string | null

	/** Soft delete flag - false indicates the row is deleted but retained */
	ActiveInd: boolean

	/** Timestamp when the row was created */
	CreatedOnDt: Date

	/** User identifier who created the row */
	CreatedBy: string

	/** Timestamp when the row was last modified */
	ModifiedOnDt: Date

	/** User identifier who last modified the row */
	ModifiedBy: string

	/** Row version for optimistic concurrency control */
	rv: string
}

/**
 * Creates default metadata for a new row
 *
 * @param createdBy - User identifier creating the row
 * @returns StandardRowMetadata with default values
 */
export function createEmptyMetadata(createdBy: string = "system"): StandardRowMetadata {
	const now = new Date();
	return {
		ReportIncludeInd: true,
		ValidationStatus: 0, // Unknown
		ValidationErrors: null,
		RowStatus: RowStatusEnum.DRAFT,
		SupersededById: null,
		ActiveInd: true,
		CreatedOnDt: now,
		CreatedBy: createdBy,
		ModifiedOnDt: now,
		ModifiedBy: createdBy,
		rv: "1", // Initial row version
	};
}

/**
 * Validates that metadata object has all required fields with correct types
 *
 * @param metadata - Partial metadata object to validate
 * @returns true if metadata is valid, false otherwise
 */
export function isMetadataValid(metadata: Partial<StandardRowMetadata>): boolean {
	if (!metadata)
		return false;

	// Check required boolean fields
	if (typeof metadata.ReportIncludeInd !== "boolean")
		return false;
	if (typeof metadata.ActiveInd !== "boolean")
		return false;

	// Check ValidationStatus is valid
	if (metadata.ValidationStatus !== 0
	  && metadata.ValidationStatus !== 1
	  && metadata.ValidationStatus !== 2) {
		return false;
	}

	// Check ValidationErrors is string or null
	if (metadata.ValidationErrors !== null
	  && typeof metadata.ValidationErrors !== "string") {
		return false;
	}

	// Check RowStatus is valid enum value
	if (typeof metadata.RowStatus !== "number"
	  || ![0, 1, 2, 3, 4, 99, 255].includes(metadata.RowStatus)) {
		return false;
	}

	// Check SupersededById is string or null
	if (metadata.SupersededById !== null
	  && typeof metadata.SupersededById !== "string") {
		return false;
	}

	// Check date fields are Date objects
	if (!(metadata.CreatedOnDt instanceof Date))
		return false;
	if (!(metadata.ModifiedOnDt instanceof Date))
		return false;

	// Check user fields are strings
	if (typeof metadata.CreatedBy !== "string")
		return false;
	if (typeof metadata.ModifiedBy !== "string")
		return false;

	// Check row version is string
	if (typeof metadata.rv !== "string")
		return false;

	return true;
}
