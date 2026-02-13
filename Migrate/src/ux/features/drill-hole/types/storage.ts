/**
 * Dexie Storage Types
 *
 * Type definitions for offline storage using Dexie IndexedDB wrapper.
 */

import type { ValidationResult } from "./section";

/**
 * Section data as stored in Dexie
 */
export interface DrillHoleSectionData {
	id: string
	drillHoleId: string
	sectionKey: string
	data: any
	rowStatus: number
	rowVersion: string
	isDirty: boolean
	lastModified: Date
	createdAt: Date
	createdBy: string
	modifiedBy?: string
}

/**
 * Validation results as stored in Dexie
 */
export interface SectionValidationData {
	id: string
	drillHoleId: string
	sectionKey: string
	validationResult: ValidationResult
	timestamp: Date
}

/**
 * Outbox item for offline sync queue
 */
export interface SectionOutboxItem {
	id?: number
	drillHoleId: string
	sectionKey: string
	operation: "upsert"
	payload: any
	validationResults: ValidationResult
	rowVersion?: string
	timestamp: Date
	retryCount: number
	maxRetries: number
	nextRetryAt: Date
	error?: string
}
