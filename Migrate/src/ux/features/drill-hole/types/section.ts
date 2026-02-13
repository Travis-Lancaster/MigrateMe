/**
 * Section Contract Interface
 *
 * Generic interface that all DrillHole sections must implement.
 * Provides consistent API for data management, validation, and state.
 */

import type { StandardRowMetadata } from "./metadata";

/**
 * Generic section interface - all sections implement this contract
 *
 * @template TData - The data type for this section
 * @template TValidation - The validation result type
 */
export interface DrillHoleSection<TData = any, TValidation = any> {
	/** Unique identifier for this section */
	sectionKey: string

	/** Current data for this section */
	data: TData

	/** Current validation state */
	validation: TValidation | null

	/** Current row status */
	rowStatus: number

	/** Tracks if section has unsaved changes */
	isDirty: boolean

	/** Tracks if section cache is stale (server has newer version) */
	isStale: boolean

	/** Row version for optimistic locking */
	rowVersion?: string

	/**
	 * Optional metadata for this section
	 * Partial allows sections to only store relevant metadata fields
	 */
	metadata?: Partial<StandardRowMetadata>

	// Data management methods
	getData: () => TData
	setData: (data: Partial<TData>) => void
	resetData: () => void

	// Status management methods
	getRowStatus: () => number
	setRowStatus: (status: number) => boolean

	// Validation methods
	validate: () => TValidation
	getValidationErrors: () => string[]
	isValid: () => boolean

	// State query methods
	isEditable: () => boolean
	hasUnsavedChanges: () => boolean

	/**
	 * Get synchronization status (optional)
	 * Returns sync status string (e.g., 'Synced', 'Pending', 'Error')
	 */
	getSyncStatus?: () => string

	// Metadata management methods
	/**
	 * Get current metadata for this section
	 * Returns empty object if no metadata is set
	 */
	getMetadata: () => Partial<StandardRowMetadata>

	/**
	 * Update metadata fields for this section
	 * Merges provided metadata with existing metadata
	 */
	updateMetadata: (metadata: Partial<StandardRowMetadata>) => void

	// Dependency tracking
	getDependencies: () => string[]
}

/**
 * Section validation result
 */
export interface ValidationError {
	field: string
	message: string
	code?: string
}

/**
 * Generic validation result structure
 */
export interface ValidationResult {
	isValid: boolean
	errors: ValidationError[]
	warnings?: ValidationError[]
}

/**
 * Action result returned from section operations
 */
export interface ActionResult {
	success: boolean
	message?: string
	errors?: ValidationError[]
}
