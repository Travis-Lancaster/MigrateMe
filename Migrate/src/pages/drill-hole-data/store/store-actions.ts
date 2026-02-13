/**
 * Store Actions
 * 
 * Business logic for store actions (save, submit, review, approve, reject).
 * 
 * @module drill-hole-data/store
 */

import { saveSectionData, saveRowData } from "../services/drill-hole-data-service";
import type { ActionResult, SectionKey } from "../types/data-contracts";
import { getSectionConfig, isSingleSection } from "./section-config";

/**
 * Update section data (single-object sections)
 * 
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section identifier
 * @param partialData - Partial data to update
 */
export function updateSectionData<TData>(
	set: any,
	get: any,
	sectionKey: SectionKey,
	partialData: Partial<TData>,
): void {
	console.log(`[StoreActions] 📝 Updating section data:`, {
		sectionKey,
		fields: Object.keys(partialData),
		timestamp: new Date().toISOString(),
	});

	set((state: any) => {
		const section = state.sections[sectionKey];
		if (section) {
			section.data = { ...section.data, ...partialData };
			section.isDirty = true;
			
			console.log(`[StoreActions] ✅ Section data updated:`, {
				sectionKey,
				isDirty: section.isDirty,
			});
		}
	});
}

/**
 * Save section (validates and saves to service)
 * 
 * @param get - Zustand get function
 * @param sectionKey - Section identifier
 * @returns Action result
 */
export async function saveSection(
	get: any,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log(`[StoreActions] 💾 Saving section:`, {
		sectionKey,
		timestamp: new Date().toISOString(),
	});

	try {
		const state = get();
		const section = state.sections[sectionKey];
		const drillPlanId = state.drillPlanId;

		if (!drillPlanId) {
			return {
				success: false,
				message: "No drill plan loaded",
				errors: ["Drill plan ID is missing"],
			};
		}

		if (!section) {
			return {
				success: false,
				message: `Section '${sectionKey}' not found`,
				errors: ["Invalid section key"],
			};
		}

		// Validate section
		const validation = section.validate();

		if (!validation.canSave) {
			console.error(`[StoreActions] ❌ Validation failed:`, {
				sectionKey,
				errors: validation.database.errors,
			});

			return {
				success: false,
				message: "Validation failed - please fix errors before saving",
				errors: validation.database.errors.map((e: any) => e.message),
			};
		}

		// Save via service
		const result = await saveSectionData(drillPlanId, sectionKey, section.data);

		if (result.success) {
			// Mark section as not dirty
			section.isDirty = false;
			section.originalData = section.data;

			console.log(`[StoreActions] ✅ Section saved successfully:`, sectionKey);
		}

		return result;
	} catch (error) {
		console.error(`[StoreActions] ❌ Save failed:`, {
			sectionKey,
			error,
		});

		return {
			success: false,
			message: error instanceof Error ? error.message : "Save failed",
			errors: [error instanceof Error ? error.message : "Unknown error"],
		};
	}
}

/**
 * Submit section (save + change RowStatus to Submitted)
 * 
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section identifier
 * @returns Action result
 */
export async function submitSection(
	set: any,
	get: any,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log(`[StoreActions] ✅ Submitting section:`, {
		sectionKey,
		timestamp: new Date().toISOString(),
	});

	try {
		// First save the section
		const saveResult = await saveSection(get, sectionKey);

		if (!saveResult.success) {
			return saveResult;
		}

		// Update RowStatus to Submitted (1)
		set((state: any) => {
			const section = state.sections[sectionKey];
			if (section && section.data) {
				section.data.RowStatus = 1;
			}
		});

		// Save with new status
		const statusResult = await saveSection(get, sectionKey);

		if (statusResult.success) {
			console.log(`[StoreActions] ✅ Section submitted successfully:`, sectionKey);
		}

		return statusResult;
	} catch (error) {
		console.error(`[StoreActions] ❌ Submit failed:`, {
			sectionKey,
			error,
		});

		return {
			success: false,
			message: error instanceof Error ? error.message : "Submit failed",
			errors: [error instanceof Error ? error.message : "Unknown error"],
		};
	}
}

/**
 * Reject section (change RowStatus to Rejected)
 * 
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section identifier
 * @returns Action result
 */
export async function rejectSection(
	set: any,
	get: any,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log(`[StoreActions] ❌ Rejecting section:`, {
		sectionKey,
		timestamp: new Date().toISOString(),
	});

	set((state: any) => {
		const section = state.sections[sectionKey];
		if (section && section.data) {
			section.data.RowStatus = 4; // Rejected
		}
	});

	return await saveSection(get, sectionKey);
}

/**
 * Review section (change RowStatus to Reviewed)
 * 
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section identifier
 * @returns Action result
 */
export async function reviewSection(
	set: any,
	get: any,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log(`[StoreActions] 👁️ Reviewing section:`, {
		sectionKey,
		timestamp: new Date().toISOString(),
	});

	set((state: any) => {
		const section = state.sections[sectionKey];
		if (section && section.data) {
			section.data.RowStatus = 2; // Reviewed
		}
	});

	return await saveSection(get, sectionKey);
}

/**
 * Approve section (change RowStatus to Approved)
 * 
 * @param set - Zustand set function
 * @param get - Zustand get function
 * @param sectionKey - Section identifier
 * @returns Action result
 */
export async function approveSection(
	set: any,
	get: any,
	sectionKey: SectionKey,
): Promise<ActionResult> {
	console.log(`[StoreActions] ✔️ Approving section:`, {
		sectionKey,
		timestamp: new Date().toISOString(),
	});

	set((state: any) => {
		const section = state.sections[sectionKey];
		if (section && section.data) {
			section.data.RowStatus = 3; // Approved
		}
	});

	return await saveSection(get, sectionKey);
}
