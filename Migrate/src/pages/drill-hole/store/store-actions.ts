/**
 * Store Actions
 *
 * Business logic for section operations: save, submit, reject, and propagate changes.
 * Extracted from drillhole-store.ts to reduce complexity and improve testability.
 *
 * Applies Single Responsibility Principle by isolating action logic.
 */

import { ActionResult, RowStatus, SectionKey, StandardRowMetadata } from "#src/types/drillhole.js";
import { getDrillHoleAggregate, saveDrillHoleSection } from "#src/services/drillholeService";

import type { Draft } from "immer";
import type { DrillHoleState } from "./drillhole-store";
import { db } from "#src/lib/db/dexie";
import { processSyncQueue } from "#src/lib/services/sync-service.js";
import { useDrillHoleStore } from "./drillhole-store";

/**
 * Update section data in the store
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to update
 * @param partialData - Partial data to merge
 */
export function updateSectionData<TData>(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
	partialData: Partial<TData>,
): void {
	console.log("🔄 Store.updateSectionData called:", {
		sectionKey,
		partialData,
		fieldCount: Object.keys(partialData).length,
	});

	set((state) => {
		const section = state.sections[sectionKey];
		if (section) {
			const oldRv = (section.data as any)?.rv;

			console.log("📝 [SECTION IsDirty 1 of 4] Before update:", {
				sectionKey,
				isDirty: section.isDirty,
				currentRv: oldRv,
				dataSnapshot: JSON.stringify(section.data).substring(0, 100),
			});

			// Handle array replacement vs object merge
			if (Array.isArray(partialData)) {
				// For arrays, replace entire array (don't merge)
				section.data = partialData as TData;
				console.log(`📝 [ARRAY REPLACE] Replaced array data for ${sectionKey}:`, {
					newRowCount: partialData.length,
				});
			}
			else {
				// For objects, merge properties
				const dataToMerge = { ...partialData } as any;

				// Preserve the current rv - it should only be updated by API responses
				if (oldRv && dataToMerge.rv && dataToMerge.rv !== oldRv) {
					console.warn("⚠️ [ROWVERSION] Preventing rv overwrite in updateSectionData:", {
						sectionKey,
						attemptedRv: dataToMerge.rv,
						preservedRv: oldRv,
					});
					delete dataToMerge.rv; // Don't overwrite rv from form data
				}

				// Merge object properties
				Object.assign(section.data, dataToMerge);
			}

			section.isDirty = true;

			const newRv = (section.data as any)?.rv;
			console.log("📝 [SECTION IsDirty 2 of 4] After data mutation (isDirty set to TRUE):", {
				sectionKey,
				isDirty: section.isDirty,
				rvPreserved: newRv === oldRv ? "✅" : "❌",
				finalRv: newRv,
				dataSnapshot: JSON.stringify(section.data).substring(0, 100),
			});
		}
		else {
			console.error("❌ Section not found:", sectionKey);
		}
	});

	// Log state after set completes
	setTimeout(() => {
		const currentState = get();
		const section = currentState.sections[sectionKey];
		console.log("📝 [SECTION IsDirty 3 of 4] State after set() completed:", {
			sectionKey,
			isDirty: section?.isDirty,
			hasUnsavedChanges: section?.hasUnsavedChanges(),
		});
	}, 0);
}

/**
 * Save section to Dexie and API
 *
 * @param get - Zustand get function
 * @param sectionKey - Section to save
 * @returns Action result with success status and message
 */
export async function saveSection(
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	const section = get().getSectionByKey(sectionKey);
	const drillHoleId = get().drillHoleId;

	// console.log('💾 [SAVE-FLOW 0/5] Store: Starting save process:', {
	// 	sectionKey,
	// 	drillHoleId,
	// 	currentRvInSectionData: currentRvBeforeSave || '(no rv)',
	// 	isDirty: section?.isDirty,
	// 	hasSection: !!section,
	// });

	if (!section) {
		console.error("❌ Store: Section not found:", sectionKey);
		return {
			success: false,
			message: `Section ${sectionKey} not found`,
		};
	}

	if (!drillHoleId) {
		console.error("❌ Store: No drill hole loaded");
		return {
			success: false,
			message: "No drill hole loaded",
		};
	}

	// Run validation (informational only, never blocks save)
	const validation = section.validate();
	console.log("🔍 [VALIDATION 1/5] Raw validation result:", {
		sectionKey,
		validationType: "database" in validation ? "two-tier" : "legacy",
		validationObject: JSON.stringify(validation, null, 2),
	});

	// Handle both ValidationResult and TwoTierValidationResult
	const isValid = "isValid" in validation ? validation.isValid : validation.database.isValid;
	if (!isValid) {
		const errors = "errors" in validation ? validation.errors : validation.database.errors;
		console.warn("⚠️ Store: Validation errors present (not blocking save):", errors);
	}

	// Prepare metadata updates based on validation result
	let metadataUpdates: { ValidationStatus: number, ValidationErrors: string | null };
	if ("database" in validation) {
		// Two-tier validation result
		const twoTierResult = validation;
		const allErrors = [
			...twoTierResult.database.errors,
			...twoTierResult.save.errors,
		];

		metadataUpdates = {
			ValidationStatus: twoTierResult.validationStatus,
			ValidationErrors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
		};

		console.log("📋 [VALIDATION 2/5] Two-tier - Prepared metadata updates:", {
			sectionKey,
			ValidationStatus: twoTierResult.validationStatus,
			validationStatusName: ["Unknown", "Valid", "DatabaseWarnings", "SaveBlocker"][twoTierResult.validationStatus] || "Unknown",
			databaseErrorCount: twoTierResult.database.errors.length,
			saveErrorCount: twoTierResult.save.errors.length,
			totalErrorCount: allErrors.length,
			ValidationErrors: metadataUpdates.ValidationErrors,
		});
	}
	else {
		// Legacy validation result
		const legacyResult = validation;
		metadataUpdates = {
			ValidationStatus: legacyResult.isValid ? 1 : 2,
			ValidationErrors: legacyResult.errors && legacyResult.errors.length > 0
				? JSON.stringify(legacyResult.errors)
				: null,
		};

		console.log("📋 [VALIDATION 2/5] Legacy - Prepared metadata updates:", {
			sectionKey,
			ValidationStatus: metadataUpdates.ValidationStatus,
			validationStatusName: metadataUpdates.ValidationStatus === 1 ? "Valid" : "Invalid",
			errorCount: legacyResult.errors?.length || 0,
			ValidationErrors: metadataUpdates.ValidationErrors,
		});
	}

	try {
		const sectionData = section.getData();
		console.log("📦 [VALIDATION 3/5] Section data retrieved:", {
			sectionKey,
			isArray: Array.isArray(sectionData),
			sectionDataType: typeof sectionData,
			sectionDataKeys: Array.isArray(sectionData) ? `array[${sectionData.length}]` : Object.keys(sectionData).slice(0, 5),
			firstItemKeys: Array.isArray(sectionData) && sectionData.length > 0 ? Object.keys(sectionData[0]).slice(0, 10) : "N/A",
			hasValidationStatus: "ValidationStatus" in sectionData,
			hasValidationErrors: "ValidationErrors" in sectionData,
		});

		// Merge current metadata with validation updates before saving
		// const currentMetadata = section.getMetadata();
		// console.log('🏷️ [VALIDATION 4/5] Current metadata before merge:', {
		// 	sectionKey,
		// 	currentMetadata,
		// 	metadataUpdates,
		// });

		// CRITICAL: Preserve rv from sectionData (for optimistic concurrency control)
		const rvFromData = (sectionData as any).rv;

		// Build metadata without rv (to avoid overwriting sectionData.rv with empty string)
		// const { rv: _unusedRv, ...metadataWithoutRv } = currentMetadata;
		// const metadata = {
		// 	...metadataWithoutRv,
		// 	...metadataUpdates,
		// 	...auditMetadata,
		// };

		// Handle array vs object sections differently
		// For array sections: pass array directly (metadata is stored separately)
		// For object sections: spread both sectionData and metadataUpdates
		const completeData = Array.isArray(sectionData)
			? sectionData // Array sections: pass array as-is
			: { // Object sections: merge data and metadata
				...sectionData,
				...metadataUpdates,
			};

		const currentRv = Array.isArray(completeData) ? undefined : completeData.rv;
		console.log("💾 [VALIDATION 5/5] Complete data prepared for save:", {
			sectionKey,
			isArray: Array.isArray(completeData),
			dataSize: `${JSON.stringify(completeData).length} bytes`,
			currentRv: currentRv || "(no rv)",
			isDirty: section.isDirty,
			arrayLength: Array.isArray(completeData) ? completeData.length : "N/A",
			sectionDataKeys: Array.isArray(completeData) ? "array" : Object.keys(completeData).slice(0, 20),
			ValidationStatus: Array.isArray(completeData) ? metadataUpdates.ValidationStatus : completeData.ValidationStatus,
			ValidationErrors: Array.isArray(completeData) ? metadataUpdates.ValidationErrors : completeData.ValidationErrors,
		});

		// Save to Dexie and queue for API sync
		console.log("📤 [VALIDATION 6/6] Calling saveDrillHoleSection with data:", {
			sectionKey,
			isArray: Array.isArray(completeData),
			ValidationStatus: Array.isArray(completeData) ? metadataUpdates.ValidationStatus : completeData.ValidationStatus,
			ValidationErrors: Array.isArray(completeData)
				? (metadataUpdates.ValidationErrors ? "Has errors" : null)
				: (completeData.ValidationErrors ? "Has errors" : null),
		});
		await saveDrillHoleSection(drillHoleId, sectionKey, completeData);

		// Only mark clean if we're online (API confirmed)
		if (navigator.onLine) {
			console.log("🧹 [SECTION IsDirty 4 of 4] Marking section clean (online save successful):", {
				sectionKey,
				isDirtyBefore: section.isDirty,
			});

			// For array sections, wait a bit for sync-service to update Dexie with API response
			// This ensures we get the full data back from the API, not just what was sent
			if (["drillmethod", "survey", "geocombined", "sample"].includes(sectionKey)) {
				console.log("⏳ [REFRESH-AFTER-SAVE] Waiting for sync-service to update Dexie...");
				// Wait up to 2 seconds for sync to complete
				await new Promise(resolve => setTimeout(resolve, 500));
			}

			// Reload section data from Dexie to get updated records from API
			const freshAggregate = await getDrillHoleAggregate(drillHoleId);

			if (freshAggregate) {
				console.log(`🔄 [REFRESH-AFTER-SAVE] Reloading ${sectionKey} from Dexie...`);

				// Update store with fresh data
				useDrillHoleStore.setState((state) => {
					const targetSection = state.sections[sectionKey];
					if (targetSection) {
						// Update section data with fresh data from Dexie
						switch (sectionKey) {
							case "drillmethod":
								targetSection.data = freshAggregate.data.DrillMethod || [];
								break;
							case "survey":
								targetSection.data = freshAggregate.data.SurveyLog || [];
								break;
							case "geocombined":
								targetSection.data = freshAggregate.data.GeologyCombinedLog || [];
								break;
							case "sample":
								targetSection.data = freshAggregate.data.Sample || [];
								break;
							case "collar":
								targetSection.data = freshAggregate.data.Collar || {};
								break;
							case "rigsheet":
								targetSection.data = freshAggregate.data.RigSetup || {};
								break;
						}

						targetSection.markClean();
						console.log(`✅ [REFRESH-AFTER-SAVE] ${sectionKey} data refreshed:`, {
							isDirtyAfter: targetSection.isDirty,
							hasUnsavedChanges: targetSection.hasUnsavedChanges(),
							rowCount: Array.isArray(targetSection.data) ? targetSection.data.length : "single",
						});
					}
				});
			}

			console.log("✅ Store: Section marked clean and data refreshed after API sync");
		}
		else {
			console.log("📴 Store: Section saved offline, keeping dirty flag");
		}

		// Propagate changes to dependent sections
		get().propagateChanges(sectionKey);

		// Verify final state after save
		const finalSection = get().getSectionByKey(sectionKey);
		const finalRv = (finalSection?.data as any)?.rv;
		console.log("✅ [SAVE-FLOW COMPLETE] Store: Section save completed:", {
			sectionKey,
			finalRvInStore: finalRv || "(no rv)",
			isDirty: finalSection?.isDirty,
			online: navigator.onLine,
		});

		return {
			success: true,
			message: navigator.onLine
				? "Section saved successfully"
				: "Section saved offline, will sync when online",
		};
	}
	catch (error) {
		console.error("❌ Store: Save failed:", { sectionKey, error });
		return {
			success: false,
			message: error instanceof Error ? error.message : "Save failed",
		};
	}
}

/**
 * Submit section (Draft → Complete)
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to submit
 * @returns Action result with success status and message
 */
export async function submitSection(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("submitSection");
	const section = get().getSectionByKey(sectionKey);
	const drillHoleId = get().drillHoleId;

	if (!section) {
		return {
			success: false,
			message: `Section ${sectionKey} not found`,
		};
	}

	if (!drillHoleId) {
		return {
			success: false,
			message: "No drill hole loaded",
		};
	}

	// Must be in Draft status
	if (section.getRowStatus() !== RowStatus.Draft) {
		return {
			success: false,
			message: "Can only submit sections in Draft status",
		};
	}

	// Validate
	const validation = section.validate();
	// Handle both ValidationResult and TwoTierValidationResult
	const isValid = "isValid" in validation ? validation.isValid : validation.database.isValid;
	if (!isValid) {
		const errors = "errors" in validation ? validation.errors : validation.database.errors;
		return {
			success: false,
			message: "Cannot submit - validation failed",
			errors,
		};
	}

	try {
		// Save first
		// const saveResult = await saveSection(get, sectionKey);
		// if (!saveResult.success) {
		// 	return saveResult;
		// }

		// Transition to Complete
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				targetSection.setRowStatus(RowStatus.Complete);
			}
		});

		// Persist status change to API
		console.log("📤 [SUBMIT] Persisting status change to API:", {
			sectionKey,
			newStatus: RowStatus.Complete,
		});
		await persistStatusChange(drillHoleId, sectionKey, RowStatus.Complete);

		return {
			success: true,
			message: "Section submitted successfully",
		};
	}
	catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Submit failed",
		};
	}
}

/**
 * Reject section (back to Draft)
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to reject
 * @returns Action result with success status and message
 */
export async function rejectSection(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("rejectSection");
	const section = get().getSectionByKey(sectionKey);
	const drillHoleId = get().drillHoleId;

	if (!section) {
		return {
			success: false,
			message: `Section ${sectionKey} not found`,
		};
	}

	if (!drillHoleId) {
		return {
			success: false,
			message: "No drill hole loaded",
		};
	}

	const currentStatus = section.getRowStatus();
	if (currentStatus === RowStatus.Draft) {
		return {
			success: false,
			message: "Section is already in Draft status",
		};
	}

	try {
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				targetSection.setRowStatus(RowStatus.Draft);
			}
		});

		// Persist status change to API
		console.log("📤 [REJECT] Persisting status change to API:", {
			sectionKey,
			newStatus: RowStatus.Draft,
		});
		await persistStatusChange(drillHoleId, sectionKey, RowStatus.Draft);

		return {
			success: true,
			message: "Section rejected - moved back to Draft",
		};
	}
	catch (error) {
		return {
			success: false,
			message: error instanceof Error ? error.message : "Reject failed",
		};
	}
}

/**
 * Helper to safely get drillHoleId with validation
 */
function requireDrillHoleId(get: () => DrillHoleState): string {
	const drillHoleId = get().drillHoleId;
	if (!drillHoleId) {
		throw new Error("Cannot perform operation: Drill hole ID is not set");
	}
	return drillHoleId;
}

/**
 * Helper function to persist status changes with offline support
 * Uses sync-service pattern: queue locally, sync when online
 *
 * @param drillHoleId - ID of the drill hole
 * @param sectionKey - Section being updated
 * @param newStatus - New RowStatus value
 * @param additionalMetadata - Optional additional metadata to update
 */
async function persistStatusChange(
	drillHoleId: string,
	sectionKey: SectionKey,
	newStatus: RowStatus,
	additionalMetadata?: Partial<StandardRowMetadata>,
): Promise<void> {
	console.log("📤 [STATUS-CHANGE] Persisting status change:", {
		drillHoleId,
		sectionKey,
		newStatus,
		online: navigator.onLine,
	});

	try {
		// Queue the status change for sync
		const queueItem = await db.syncQueue.add({
			entityId: drillHoleId,
			entityType: "DrillHoleSectionStatus",
			operation: "update",
			data: {
				sectionKey,
				RowStatus: newStatus,
				...additionalMetadata,
			},
			timestamp: new Date(),
			retryCount: 0,
			maxRetries: 3,
			nextRetryAt: new Date(),
		});

		console.log("📋 [STATUS-CHANGE] Queued for sync:", {
			queueItemId: queueItem,
			sectionKey,
			newStatus,
		});

		// If online, process immediately
		if (navigator.onLine) {
			// Wait a bit to ensure item is written to Dexie
			await new Promise(resolve => setTimeout(resolve, 50));

			await processSyncQueue();

			// Check if the item was removed from queue (success) or still there (failed)
			const stillInQueue = await db.syncQueue.get(queueItem);
			if (stillInQueue) {
				throw new Error("Status change sync failed - item still in queue");
			}

			console.log("✅ [STATUS-CHANGE] Status change synced successfully");
		}
		else {
			console.log("📴 [STATUS-CHANGE] Status change queued for later sync");
		}
	}
	catch (error) {
		console.error("❌ [STATUS-CHANGE] Failed to persist status change:", error);
		throw error;
	}
}

/**
 * Helper function to persist metadata changes with offline support
 * Uses sync-service pattern: queue locally, sync when online
 *
 * @param drillHoleId - ID of the drill hole
 * @param sectionKey - Section being updated
 * @param metadata - Metadata fields to update
 */
async function persistMetadataChange(
	drillHoleId: string,
	sectionKey: SectionKey,
	metadata: Partial<StandardRowMetadata>,
): Promise<void> {
	console.log("📤 [METADATA-CHANGE] Persisting metadata change:", {
		drillHoleId,
		sectionKey,
		metadata,
		online: navigator.onLine,
	});

	try {
		// Queue the metadata change for sync
		const queueItem = await db.syncQueue.add({
			entityId: drillHoleId,
			entityType: "DrillHoleSectionMetadata",
			operation: "update",
			data: {
				sectionKey,
				...metadata,
			},
			timestamp: new Date(),
			retryCount: 0,
			maxRetries: 3,
			nextRetryAt: new Date(),
		});

		console.log("📋 [METADATA-CHANGE] Queued for sync:", {
			queueItemId: queueItem,
			sectionKey,
			metadata,
		});

		// If online, process immediately
		if (navigator.onLine) {
			// Wait a bit to ensure item is written to Dexie
			await new Promise(resolve => setTimeout(resolve, 50));

			await processSyncQueue();

			// Check if the item was removed from queue (success) or still there (failed)
			const stillInQueue = await db.syncQueue.get(queueItem);
			if (stillInQueue) {
				throw new Error("Metadata change sync failed - item still in queue");
			}

			console.log("✅ [METADATA-CHANGE] Metadata change synced successfully");
		}
		else {
			console.log("📴 [METADATA-CHANGE] Metadata change queued for later sync");
		}
	}
	catch (error) {
		console.error("❌ [METADATA-CHANGE] Failed to persist metadata change:", error);
		throw error;
	}
}

/**
 * Mark section as Complete (Draft → Complete)
 *
 * This action transitions a section from Draft to Complete status.
 * Unlike submitSection, this does not require validation to pass.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to mark as complete
 * @returns Action result with success status and message
 */
export async function completedSection(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("completedSection");
	const section = get().getSectionByKey(sectionKey);

	// Validate current status
	if (!section || section.getRowStatus() !== RowStatus.Draft) {
		return {
			success: false,
			message: "Can only mark Draft sections as Complete",
		};
	}

	try {
		// Save first
		const saveResult = await saveSection(get, sectionKey);
		if (!saveResult.success) {
			return saveResult;
		}

		// Update status in store
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				targetSection.setRowStatus(RowStatus.Complete);
				// Update metadata directly (Immer-compatible)
				targetSection.metadata = { ...targetSection.metadata, RowStatus: RowStatus.Complete };
			}
		});

		// Persist to API
		const drillHoleId = requireDrillHoleId(get);
		await persistStatusChange(drillHoleId, sectionKey, RowStatus.Complete);

		return {
			success: true,
			message: "Section marked as Complete",
		};
	}
	catch (error) {
		console.error("❌ Failed to mark section as complete:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to mark section as complete",
		};
	}
}

/**
 * Review section (Complete → Reviewed)
 *
 * This action transitions a section from Complete to Reviewed status.
 * Role checking (DBA/Manager/PM) is performed in the UI.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to review
 * @returns Action result with success status and message
 */
export async function reviewSection(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("reviewSection");
	const section = get().getSectionByKey(sectionKey);

	// Validate current status
	if (!section || section.getRowStatus() !== RowStatus.Complete) {
		return {
			success: false,
			message: "Can only review Complete sections",
		};
	}

	try {
		// Update status in store
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				targetSection.setRowStatus(RowStatus.Reviewed);
				// Update metadata directly (Immer-compatible)
				targetSection.metadata = { ...targetSection.metadata, RowStatus: RowStatus.Reviewed };
			}
		});

		// Persist to API
		const drillHoleId = requireDrillHoleId(get);
		await persistStatusChange(drillHoleId, sectionKey, RowStatus.Reviewed);

		return {
			success: true,
			message: "Section marked as Reviewed",
		};
	}
	catch (error) {
		console.error("❌ Failed to review section:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to review section",
		};
	}
}

/**
 * Approve section (Reviewed → Approved)
 *
 * This action transitions a section from Reviewed to Approved status.
 * Also sets ReportIncludeInd to true by default.
 * Role checking (DBA/Manager/PM) is performed in the UI.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to approve
 * @returns Action result with success status and message
 */
export async function approveSection(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("approveSection");
	const section = get().getSectionByKey(sectionKey);

	// Validate current status
	if (!section || section.getRowStatus() !== RowStatus.Reviewed) {
		return {
			success: false,
			message: "Can only approve Reviewed sections",
		};
	}

	try {
		// Update status in store
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				targetSection.setRowStatus(RowStatus.Approved);
				// Update metadata directly (Immer-compatible)
				targetSection.metadata = {
					...targetSection.metadata,
					RowStatus: RowStatus.Approved,
					ReportIncludeInd: true, // Include in reports by default
				};
			}
		});

		// Persist to API with ReportIncludeInd
		const drillHoleId = requireDrillHoleId(get);
		await persistStatusChange(drillHoleId, sectionKey, RowStatus.Approved, { ReportIncludeInd: true });

		return {
			success: true,
			message: "Section approved and included in reports",
		};
	}
	catch (error) {
		console.error("❌ Failed to approve section:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to approve section",
		};
	}
}

/**
 * Exclude section from reports (Approved sections only)
 *
 * This action sets ReportIncludeInd to false for Approved sections.
 * The section remains locked and the RowStatus is unchanged.
 * Role checking (DBA/Manager/PM) is performed in the UI.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to exclude from reports
 * @returns Action result with success status and message
 */
export async function excludeFromReport(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("excludeFromReport");
	const section = get().getSectionByKey(sectionKey);

	// Validate current status - only Approved sections can be excluded
	if (!section || section.getRowStatus() !== RowStatus.Approved) {
		return {
			success: false,
			message: "Can only exclude Approved sections",
		};
	}

	try {
		// Update metadata in store (RowStatus remains unchanged)
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				// Update metadata directly (Immer-compatible)
				targetSection.metadata = {
					...targetSection.metadata,
					ReportIncludeInd: false,
				};
			}
		});

		// Persist metadata change to API
		const drillHoleId = requireDrillHoleId(get);
		await persistMetadataChange(
			drillHoleId,
			sectionKey,
			{
				ReportIncludeInd: false,
			},
		);

		return {
			success: true,
			message: "Section excluded from reports",
		};
	}
	catch (error) {
		console.error("❌ Failed to exclude section from reports:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to exclude section from reports",
		};
	}
}

/**
 * Propagate changes to dependent sections
 *
 * Finds all sections that depend on the changed section and revalidates them.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param changedSectionKey - Section that changed
 */
export function propagateChanges(
	set: (fn: (state: Draft<DrillHoleState>) => void) => void,
	get: () => DrillHoleState,
	changedSectionKey: SectionKey,
): void {
	console.log("propagateChanges");
	const sections = get().sections;

	// Find all sections that depend on the changed section
	Object.entries(sections).forEach(([key, section]) => {
		if (section.getDependencies().includes(changedSectionKey)) {
			// Revalidate dependent section
			set((state) => {
				const targetSection = state.sections[key as SectionKey];
				if (targetSection) {
					targetSection.validate();
				}
			});
		}
	});
}
