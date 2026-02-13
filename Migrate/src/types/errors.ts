/**
 * Custom Error Classes for DrillHole Conflict Handling
 */

import type { SectionVersionDto } from "#src/api/database/data-contracts.js";
import type { SectionKey } from "./drillhole";

/**
 * Thrown when loading cached data that has version conflicts with server
 */
export class LoadConflictError extends Error {
	public readonly staleSections: SectionKey[];
	public readonly serverVersions: SectionVersionDto[];
	public readonly localVersions: Record<string, string>;
	public readonly dirtySections: string[];

	constructor(data: {
		staleSections: SectionKey[]
		serverVersions: SectionVersionDto[]
		localVersions: Record<string, string>
		dirtySections: string[]
	}) {
		super("Load conflict: Local cache has unsaved changes and server has newer versions");
		this.name = "LoadConflictError";
		this.staleSections = data.staleSections;
		this.serverVersions = data.serverVersions;
		this.localVersions = data.localVersions;
		this.dirtySections = data.dirtySections;

		// Maintain proper stack trace for where error was thrown (V8 only)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, LoadConflictError);
		}
	}
}

/**
 * Thrown when saving data that conflicts with server version (409)
 */
export class SaveConflictError extends Error {
	public readonly sectionKey: SectionKey;
	public readonly localVersion: string;
	public readonly serverVersion?: string;
	public readonly drillPlanId: string;

	constructor(data: {
		sectionKey: SectionKey
		localVersion: string
		serverVersion?: string
		drillPlanId: string
	}) {
		super(`Save conflict: Section ${data.sectionKey} was modified by another user`);
		this.name = "SaveConflictError";
		this.sectionKey = data.sectionKey;
		this.localVersion = data.localVersion;
		this.serverVersion = data.serverVersion;
		this.drillPlanId = data.drillPlanId;

		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, SaveConflictError);
		}
	}
}

/**
 * Type guard to check if error is LoadConflictError
 */
export function isLoadConflictError(error: unknown): error is LoadConflictError {
	return error instanceof LoadConflictError;
}

/**
 * Type guard to check if error is SaveConflictError
 */
export function isSaveConflictError(error: unknown): error is SaveConflictError {
	return error instanceof SaveConflictError;
}
