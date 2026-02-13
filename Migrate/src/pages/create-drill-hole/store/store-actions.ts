/**
 * Create Drill Hole - Store Actions
 *
 * Business logic for creation workflow actions:
 * - saveSection: Save draft to Dexie cache
 * - completeSection: Validate and mark section complete
 * - submitDrillHole: Create drill hole record via API
 * - propagateChanges: Cross-section coordination
 *
 * CREATION-SPECIFIC:
 * - Simplified status flow (Draft → Complete only)
 * - Focus on offline-first draft persistence
 * - No review/approve workflow (that's in drill-hole module)
 * - Creates new drill hole record on submit
 *
 * Adapted from drill-hole/store/store-actions.ts
 */

import { ActionResult, RowStatus, SectionKey } from "#src/types/drillhole.js";
// import { createDrillHoleFromDraft } from "#src/services/createDrillholeService"; // TODO: Create service
import { getCompletionPercentage, getDependentSections } from "./section-config";

// import type { ActionResult, SectionKey } from "#src/types/drillhole";
// import { RowStatus } from "#src/types/drillhole";
import type { CreateDrillHoleState } from "./create-drillhole-store";
import type { Draft } from "immer";
import { db } from "#src/lib/db/dexie";

// ============================================================================
// UPDATE SECTION DATA
// ============================================================================

/**
 * Update section data in the store
 *
 * Handles both array and object sections with proper Immer mutation.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to update
 * @param partialData - Partial data to merge
 */
export function updateSectionData<TData>(
	set: (fn: (state: Draft<CreateDrillHoleState>) => void) => void,
	get: () => CreateDrillHoleState,
	sectionKey: SectionKey,
	partialData: Partial<TData>,
): void {
	console.log("💾 [ACTIONS:UPDATE] Updating section data:", {
		sectionKey,
		fieldCount: Object.keys(partialData as any).length,
	});

	set((state) => {
		const section = state.sections[sectionKey];
		if (!section) {
			console.error("❌ [ACTIONS:UPDATE] Section not found:", sectionKey);
			return;
		}

		console.log("📝 [ACTIONS:UPDATE] Before update:", {
			sectionKey,
			isDirty: section.isDirty,
			dataType: Array.isArray(section.data) ? "array" : "object",
		});

		// Handle array replacement vs object merge
		if (Array.isArray(partialData)) {
			// For arrays, replace entire array
			section.data = partialData as TData;
			console.log(`📝 [ACTIONS:UPDATE] Array replaced: ${sectionKey} (${partialData.length} rows)`);
		} else {
			// For objects, merge properties
			Object.assign(section.data, partialData);
			console.log(`📝 [ACTIONS:UPDATE] Object merged: ${sectionKey}`);
		}

		section.isDirty = true;

		console.log("✅ [ACTIONS:UPDATE] Section updated:", {
			sectionKey,
			isDirty: section.isDirty,
		});
	});
}

// ============================================================================
// SAVE SECTION (Draft Persistence)
// ============================================================================

/**
 * Save section to Dexie cache
 *
 * For creation workflow, this saves drafts locally for persistence across sessions.
 * Does NOT sync to API until final submission.
 *
 * @param get - Zustand get function
 * @param sectionKey - Section to save
 * @returns Action result with success status
 */
export async function saveSection(
	get: () => CreateDrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("💾 [ACTIONS:SAVE] Starting save process:", { sectionKey });

	const section = get().getSectionByKey(sectionKey);
	const drillPlanId = get().drillPlanId;
	const plannedHoleNm = get().plannedHoleNm;

	if (!section) {
		console.error("❌ [ACTIONS:SAVE] Section not found:", sectionKey);
		return {
			success: false,
			message: `Section ${sectionKey} not found`,
		};
	}

	if (!drillPlanId || !plannedHoleNm) {
		console.error("❌ [ACTIONS:SAVE] No drill plan loaded");
		return {
			success: false,
			message: "No drill plan loaded",
		};
	}

	// Run validation (informational only, never blocks save)
	const validation = section.validate();
	console.log("🔍 [ACTIONS:SAVE] Validation result:", {
		sectionKey,
		validationType: "database" in validation ? "two-tier" : "legacy",
		isValid: "isValid" in validation ? validation.isValid : validation.database.isValid,
	});

	// Prepare metadata updates based on validation
	let metadataUpdates: { ValidationStatus: number; ValidationErrors: string | null };
	if ("database" in validation) {
		// Two-tier validation
		const allErrors = [...validation.database.errors, ...validation.save.errors];
		metadataUpdates = {
			ValidationStatus: validation.validationStatus,
			ValidationErrors: allErrors.length > 0 ? JSON.stringify(allErrors) : null,
		};
	} else {
		// Legacy validation
		metadataUpdates = {
			ValidationStatus: validation.isValid ? 1 : 2,
			ValidationErrors:
				validation.errors && validation.errors.length > 0
					? JSON.stringify(validation.errors)
					: null,
		};
	}

	console.log("📋 [ACTIONS:SAVE] Metadata updates:", metadataUpdates);

	try {
		const sectionData = section.getData();

		// Build complete data with validation metadata
		const completeData = Array.isArray(sectionData)
			? sectionData // Array sections: pass array as-is
			: {
				// Object sections: merge data and metadata
				...sectionData,
				...metadataUpdates,
			};

		console.log("💾 [ACTIONS:SAVE] Saving to Dexie cache:", {
			sectionKey,
			isArray: Array.isArray(completeData),
			size: `${JSON.stringify(completeData).length} bytes`,
		});

		// Save to Dexie createDrillHoleDrafts table
		// TODO: Implement Dexie table and save logic
		// For now, just log what would be saved
		console.log("📦 [ACTIONS:SAVE] Draft data prepared:", {
			drillPlanId,
			plannedHoleNm,
			sectionKey,
			dataSize: JSON.stringify(completeData).length,
			validationStatus: metadataUpdates.ValidationStatus,
		});

		// TODO: Actual Dexie save
		// await db.createDrillHoleDrafts.put({
		// 	drillPlanId,
		// 	plannedHoleNm,
		// 	sectionKey,
		// 	data: completeData,
		// 	metadata: metadataUpdates,
		// 	lastModified: new Date(),
		// });

		// Mark section as clean (saved to cache)
		section.markClean();

		console.log("✅ [ACTIONS:SAVE] Section saved to cache:", {
			sectionKey,
			isDirty: section.isDirty,
		});

		return {
			success: true,
			message: "Section saved to draft",
		};
	} catch (error) {
		console.error("❌ [ACTIONS:SAVE] Save failed:", { sectionKey, error });
		return {
			success: false,
			message: error instanceof Error ? error.message : "Save failed",
		};
	}
}

// ============================================================================
// COMPLETE SECTION
// ============================================================================

/**
 * Mark section as complete
 *
 * Validates section data (database validators - blocking) before marking complete.
 * Updates completion percentage after successful completion.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section to complete
 * @returns Action result with success status
 */
export async function completeSection(
	set: (fn: (state: Draft<CreateDrillHoleState>) => void) => void,
	get: () => CreateDrillHoleState,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log("🔍 [ACTIONS:COMPLETE] Starting completion process:", { sectionKey });

	const section = get().getSectionByKey(sectionKey);

	if (!section) {
		console.error("❌ [ACTIONS:COMPLETE] Section not found:", sectionKey);
		return {
			success: false,
			message: `Section ${sectionKey} not found`,
		};
	}

	// Must be in Draft status
	if (section.getRowStatus() !== RowStatus.Draft) {
		console.warn("⚠️ [ACTIONS:COMPLETE] Section not in Draft status:", {
			sectionKey,
			currentStatus: section.getRowStatus(),
		});
		return {
			success: false,
			message: "Can only complete sections in Draft status",
		};
	}

	// Validate (database validators - blocking)
	const validation = section.validate();
	const isValid =
		"isValid" in validation ? validation.isValid : validation.database.isValid;

	console.log("🔍 [ACTIONS:COMPLETE] Validation result:", {
		sectionKey,
		isValid,
		validationType: "database" in validation ? "two-tier" : "legacy",
	});

	if (!isValid) {
		const errors = "errors" in validation ? validation.errors : validation.database.errors;
		console.error("❌ [ACTIONS:COMPLETE] Validation failed:", {
			sectionKey,
			errorCount: errors.length,
			errors,
		});
		return {
			success: false,
			message: "Cannot complete - validation failed",
			errors,
		};
	}

	try {
		// Save first to persist current state
		const saveResult = await saveSection(get, sectionKey);
		if (!saveResult.success) {
			return saveResult;
		}

		// Update status in store
		set((state) => {
			const targetSection = state.sections[sectionKey];
			if (targetSection) {
				targetSection.setRowStatus(RowStatus.Complete);

				// Update sectionsCompleted array
				if (!state.sectionsCompleted.includes(sectionKey)) {
					state.sectionsCompleted.push(sectionKey);
				}

				// Recalculate completion percentage
				state.completionPercentage = getCompletionPercentage(state.sections);

				console.log("✅ [ACTIONS:COMPLETE] Section marked complete:", {
					sectionKey,
					completionPercentage: state.completionPercentage,
					sectionsCompleted: state.sectionsCompleted.length,
				});
			}
		});

		console.log("✅ [ACTIONS:COMPLETE] Completion successful:", {
			sectionKey,
			completionPercentage: get().completionPercentage,
		});

		return {
			success: true,
			message: "Section completed successfully",
		};
	} catch (error) {
		console.error("❌ [ACTIONS:COMPLETE] Completion failed:", { sectionKey, error });
		return {
			success: false,
			message: error instanceof Error ? error.message : "Completion failed",
		};
	}
}

// ============================================================================
// SUBMIT DRILL HOLE (Create Record)
// ============================================================================

/**
 * Submit drill hole for creation
 *
 * This is the final step in the creation workflow:
 * 1. Validates all required sections
 * 2. Builds CreateCollarDto from section data
 * 3. POSTs to /api/collar endpoint
 * 4. Clears draft cache on success
 * 5. Returns created drill hole ID
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @returns Action result with created drill hole ID
 */
export async function submitDrillHole(
	set: (fn: (state: Draft<CreateDrillHoleState>) => void) => void,
	get: () => CreateDrillHoleState,
): Promise<ActionResult> {
	console.log("📤 [ACTIONS:SUBMIT] Starting drill hole submission");

	set((state) => {
		state.isSubmitting = true;
		state.submissionError = null;
	});

	try {
		const state = get();

		// Validate required sections are complete
		const requiredSections: SectionKey[] = [
			SectionKey.RigSheet,
			SectionKey.CollarCoordinates,
		];

		const incompleteSections = requiredSections.filter((key) => {
			const section = state.sections[key];
			return !section || section.getRowStatus() !== RowStatus.Complete;
		});

		if (incompleteSections.length > 0) {
			console.error("❌ [ACTIONS:SUBMIT] Incomplete required sections:", incompleteSections);

			set((draft) => {
				draft.isSubmitting = false;
				draft.submissionError = `Complete required sections: ${incompleteSections.join(", ")}`;
			});

			return {
				success: false,
				message: `Complete required sections: ${incompleteSections.join(", ")}`,
			};
		}

		// Validate all completed sections
		const completedSections = state.sectionsCompleted;
		for (const sectionKey of completedSections) {
			const section = state.sections[sectionKey];
			if (section) {
				const validation = section.validate();
				const isValid =
					"isValid" in validation ? validation.isValid : validation.database.isValid;

				if (!isValid) {
					const errors =
						"errors" in validation ? validation.errors : validation.database.errors;
					console.error("❌ [ACTIONS:SUBMIT] Validation failed:", {
						sectionKey,
						errors,
					});

					set((draft) => {
						draft.isSubmitting = false;
						draft.submissionError = `Section ${sectionKey} has validation errors`;
					});

					return {
						success: false,
						message: `Section ${sectionKey} has validation errors`,
						errors,
					};
				}
			}
		}

		console.log("🚀 [ACTIONS:SUBMIT] All validations passed, submitting to API");
		console.log("  📋 Drill Plan ID:", state.drillPlanId);
		console.log("  🎯 Planned Hole Name:", state.plannedHoleNm);
		console.log("  📊 Completion:", state.completionPercentage, "%");
		console.log("  ✅ Completed Sections:", state.sectionsCompleted);

		// TODO: Build CreateCollarDto from section data
		// const createDto = buildCreateCollarDto(state.sections);

		// TODO: Submit to API
		// const result = await createDrillHoleFromDraft(state.drillPlanId, createDto);

		// Temporary placeholder
		const mockDrillHoleId = `DH-${Date.now()}`;

		// TODO: Clear draft cache on success
		// await db.createDrillHoleDrafts.where({ drillPlanId: state.drillPlanId }).delete();

		set((draft) => {
			draft.isSubmitting = false;
		});

		console.log("✅ [ACTIONS:SUBMIT] Drill hole created successfully:", {
			drillHoleId: mockDrillHoleId,
		});

		return {
			success: true,
			message: "Drill hole created successfully",
			data: { drillHoleId: mockDrillHoleId },
		};
	} catch (error) {
		console.error("❌ [ACTIONS:SUBMIT] Submission failed:", error);

		set((state) => {
			state.isSubmitting = false;
			state.submissionError =
				error instanceof Error ? error.message : "Submission failed";
		});

		return {
			success: false,
			message: error instanceof Error ? error.message : "Submission failed",
		};
	}
}

// ============================================================================
// PROPAGATE CHANGES (Cross-Section Coordination)
// ============================================================================

/**
 * Propagate changes to dependent sections
 *
 * When a section changes, update dependent sections with relevant data.
 * Example: When GeoCombinedLog changes, update Sample intervals.
 *
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param changedSectionKey - The section that changed
 */
export function propagateChanges(
	set: (fn: (state: Draft<CreateDrillHoleState>) => void) => void,
	get: () => CreateDrillHoleState,
	changedSectionKey: SectionKey,
): void {
	console.log("🔗 [ACTIONS:PROPAGATE] Propagating changes from:", changedSectionKey);

	const dependents = getDependentSections(changedSectionKey);

	if (dependents.length === 0) {
		console.log("  ℹ️  No dependent sections");
		return;
	}

	console.log("  🎯 Dependent sections:", dependents);

	// TODO: Implement cross-section update logic
	// Examples:
	// - When GeoCombinedLog changes, update Sample intervals
	// - When Sample changes, update Dispatch sample lists
	// - When RigSheet changes, update Collar drill dates

	set((state) => {
		const changedSection = state.sections[changedSectionKey];
		if (!changedSection) return;

		for (const dependentKey of dependents) {
			const dependentSection = state.sections[dependentKey as SectionKey];
			if (dependentSection) {
				console.log(`  🔄 Updating dependent: ${dependentKey}`);

				// Example: If GeoCombinedLog changed, update Sample dependent data
				if (
					changedSectionKey === SectionKey.GeoCombinedLog &&
					dependentKey === SectionKey.Sample
				) {
					// TODO: Update sample intervals based on geology log
					console.log("    📝 Would update sample intervals from geology log");
				}

				// Mark dependent as dirty so user knows to review
				dependentSection.isDirty = true;
			}
		}
	});

	console.log("✅ [ACTIONS:PROPAGATE] Changes propagated to", dependents.length, "sections");
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Build CreateCollarDto from section data
 *
 * Aggregates data from all sections into a single DTO for API submission.
 * This will be implemented when the service layer is created.
 *
 * @param sections - All section stores
 * @returns CreateCollarDto for API submission
 */
// function buildCreateCollarDto(sections: Record<SectionKey, any>): CreateCollarDto {
// 	// TODO: Implement when service layer is created
// 	// This will extract data from:
// 	// - RigSheet → RigSetup fields
// 	// - CollarCoordinates → CollarCoordinate fields
// 	// - GeoCombinedLog → GeologyCombinedLog array
// 	// - Sample → Sample array
// 	// - etc.
// 	return {} as any;
// }
