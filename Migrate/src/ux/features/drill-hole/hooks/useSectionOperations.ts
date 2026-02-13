/**
 * Section Operations Hook
 *
 * Provides operations for drill hole sections (save, validate, status transitions).
 * Works with Dexie directly - no Zustand involved.
 *
 * Usage:
 *   const { saveCollar, validateCollar, transitionStatus } = useSectionOperations();
 *   await saveCollar(drillHoleId, collarData);
 */

import type { DrillMethod, VwCollar } from "#src/data/api/database/data-contracts.js";
import { db } from "#src/data/index.js";

import { useCallback } from "react";
import { canTransition, SectionKey } from "../constants";
import { RowStatusEnum } from "../constants/row-status";

/**
 * Operations for drill hole sections
 */
export function useSectionOperations() {
	/**
	 * Save collar data
	 */
	const saveCollar = useCallback(async (collarId: string, data: Partial<VwCollar>) => {
		console.log("[useSectionOperations] Saving collar", { collarId });

		try {
			// Get existing collar
			const existing = await db.DrillHole_Collar.get(collarId);

			if (!existing) {
				throw new Error(`Collar not found: ${collarId}`);
			}

			// Update with new data
			const updated: VwCollar = {
				...existing,
				...data,
				ModifiedOnDt: new Date().toISOString(),
				ModifiedBy: "current-user", // TODO: Get from auth context
			};

			// Save to Dexie (will trigger LiveQuery updates)
			await db.DrillHole_Collar.put(updated);

			console.log("[useSectionOperations] Collar saved successfully");

			return { success: true };
		}
		catch (error) {
			console.error("[useSectionOperations] Error saving collar", error);
			return { success: false, error: error as Error };
		}
	}, []);

	/**
	 * Add drill method row
	 */
	const addDrillMethod = useCallback(async (collarId: string, data: Partial<DrillMethod>) => {
		console.log("[useSectionOperations] Adding drill method", { collarId });

		try {
			const newDrillMethod: DrillMethod = {
				DrillMethodId: crypto.randomUUID(),
				CollarId: collarId,
				ActiveInd: true,
				ReportIncludeInd: true,
				RowStatus: RowStatusEnum.DRAFT,
				ValidationStatus: 0,
				ValidationErrors: null,
				CreatedOnDt: new Date().toISOString(),
				CreatedBy: "current-user",
				ModifiedOnDt: new Date().toISOString(),
				ModifiedBy: "current-user",
				...data,
			} as DrillMethod;

			await db.DrillHole_DrillMethod.add(newDrillMethod);

			console.log("[useSectionOperations] Drill method added successfully");

			return { success: true, id: newDrillMethod.DrillMethodId };
		}
		catch (error) {
			console.error("[useSectionOperations] Error adding drill method", error);
			return { success: false, error: error as Error };
		}
	}, []);

	/**
	 * Update drill method row
	 */
	const updateDrillMethod = useCallback(async (drillMethodId: string, data: Partial<DrillMethod>) => {
		console.log("[useSectionOperations] Updating drill method", { drillMethodId });

		try {
			const existing = await db.DrillHole_DrillMethod.get(drillMethodId);

			if (!existing) {
				throw new Error(`Drill method not found: ${drillMethodId}`);
			}

			const updated: DrillMethod = {
				...existing,
				...data,
				ModifiedOnDt: new Date().toISOString(),
				ModifiedBy: "current-user",
			};

			await db.DrillHole_DrillMethod.put(updated);

			console.log("[useSectionOperations] Drill method updated successfully");

			return { success: true };
		}
		catch (error) {
			console.error("[useSectionOperations] Error updating drill method", error);
			return { success: false, error: error as Error };
		}
	}, []);

	/**
	 * Delete drill method row (soft delete)
	 */
	const deleteDrillMethod = useCallback(async (drillMethodId: string) => {
		console.log("[useSectionOperations] Deleting drill method", { drillMethodId });

		try {
			const existing = await db.DrillHole_DrillMethod.get(drillMethodId);

			if (!existing) {
				throw new Error(`Drill method not found: ${drillMethodId}`);
			}

			const updated: DrillMethod = {
				...existing,
				ActiveInd: false,
				ModifiedOnDt: new Date().toISOString(),
				ModifiedBy: "current-user",
			};

			await db.DrillHole_DrillMethod.put(updated);

			console.log("[useSectionOperations] Drill method deleted successfully");

			return { success: true };
		}
		catch (error) {
			console.error("[useSectionOperations] Error deleting drill method", error);
			return { success: false, error: error as Error };
		}
	}, []);

	/**
	 * Transition section status
	 */
	const transitionStatus = useCallback(async (
		sectionKey: SectionKey,
		entityId: string,
		newStatus: number,
	) => {
		console.log("[useSectionOperations] Transitioning status", {
			sectionKey,
			entityId,
			newStatus,
		});

		try {
			// Get the appropriate table based on section key
			let table;
			switch (sectionKey) {
				case SectionKey.Collar:
					table = db.DrillHole_Collar;
					break;
				case SectionKey.DrillMethod:
					table = db.DrillHole_DrillMethod;
					break;
				case SectionKey.Survey:
					table = db.DrillHole_Survey;
					break;
				default:
					throw new Error(`Section not supported: ${sectionKey}`);
			}

			const existing = await table.get(entityId);

			if (!existing) {
				throw new Error(`Entity not found: ${entityId}`);
			}

			// Validate transition
			if (existing.RowStatus !== undefined && !canTransition(existing.RowStatus as number, newStatus)) {
				throw new Error(`Invalid status transition from ${existing.RowStatus} to ${newStatus}`);
			}

			// Update status
			const updated = {
				...existing,
				RowStatus: newStatus,
				ModifiedOnDt: new Date().toISOString(),
				ModifiedBy: "current-user",
			} as any;

			await table.put(updated);

			console.log("[useSectionOperations] Status transitioned successfully");

			return { success: true };
		}
		catch (error) {
			console.error("[useSectionOperations] Error transitioning status", error);
			return { success: false, error: error as Error };
		}
	}, []);

	return {
		// Collar operations
		saveCollar,

		// Drill method operations
		addDrillMethod,
		updateDrillMethod,
		deleteDrillMethod,

		// Status operations
		transitionStatus,
	};
}
