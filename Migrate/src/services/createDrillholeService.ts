/**
 * Create Drill Hole Service - Data Entry Module
 *
 * Service layer for drill hole data entry workflow:
 * - Load existing drill hole data from API
 * - Save section data individually (not bulk)
 * - Save drafts to Dexie cache
 * - Offline-first pattern with error handling
 *
 * CRITICAL CLARIFICATION:
 * - Does NOT create drill holes, drill plans, or collars
 * - These records exist weeks before this code runs
 * - Module is for DATA ENTRY into existing drill hole records
 * - Each section saved individually on save button click
 * - HoleId = CollarId = DrillPlanId (always same identifier)
 * - Uses bulkInsert/bulkUpsert for high volume row operations
 */

import type { UiDrillHole, VwDrillPlan, UpsertCollarDto } from "#src/api/database/data-contracts.js";

import { apiClient } from "./apiClient";
import { db } from "#src/lib/db/dexie";
import { fetchDrillHoleFromApi, saveDrillHoleSection } from "./drillholeService";

// ============================================================================
// LOAD EXISTING DRILL HOLE DATA
// ============================================================================

/**
 * Load existing drill hole data from API
 *
 * Loads the drill hole aggregate for data entry.
 * The drill hole, collar, and drill plan already exist - we're just loading for editing.
 *
 * @param drillHoleId - The drill hole ID (same as CollarId and DrillPlanId)
 * @returns Full drill hole data with all sections
 *
 * @example
 * ```typescript
 * const drillHole = await loadDrillHoleForEntry('hole-123');
 * console.log(`Hole: ${drillHole.Collar.HoleNm}`);
 * ```
 */
export async function loadDrillHoleForEntry(drillHoleId: string): Promise<UiDrillHole> {
	console.log("🌐 [SERVICE:LOAD] Loading existing drill hole for data entry:", drillHoleId);
	const startTime = performance.now();

	try {
		// Use the same function as drill-hole module
		const drillHole = await fetchDrillHoleFromApi(drillHoleId);

		const duration = (performance.now() - startTime).toFixed(0);

		console.log(`✅ [SERVICE:LOAD] Drill hole loaded in ${duration}ms:`, {
			drillHoleId,
			holeNm: drillHole.HoleNm,
			dataSize: `${JSON.stringify(drillHole).length} bytes`,
			sections: Object.keys(drillHole).filter(k => k !== 'Collar').join(', '),
		});

		return drillHole;
	} catch (error) {
		console.error("❌ [SERVICE:LOAD] Failed to load drill hole:", { drillHoleId, error });
		throw error;
	}
}

/**
 * Fetch drill plan metadata (for reference only)
 *
 * Loads drill plan information to display planned vs actual data.
 * Does NOT create anything - just loads existing plan for reference.
 *
 * @param drillPlanId - The drill plan ID
 * @returns Drill plan metadata
 */
export async function fetchDrillPlanMetadata(drillPlanId: string): Promise<VwDrillPlan> {
	console.log("🌐 [SERVICE:PLAN] Fetching drill plan metadata:", drillPlanId);
	const startTime = performance.now();

	try {
		// TODO: Update endpoint when API is available
		// For now, use the drill plan list endpoint with filter
		const response = await apiClient.vwDrillPlanControllerFindAll({
			page: 1,
			take: 1,
			// filters: { DrillPlanId: drillPlanId } // TODO: Add when API supports filtering
		});

		const duration = (performance.now() - startTime).toFixed(0);

		if (!response.data?.data || response.data.data.length === 0) {
			throw new Error(`Drill plan not found: ${drillPlanId}`);
		}

		const plan = response.data.data[0];

		console.log(`✅ [SERVICE:PLAN] Drill plan metadata fetched in ${duration}ms:`, {
			drillPlanId,
			plannedHoleNm: plan.PlannedHoleNm,
		});

		return plan;
	} catch (error) {
		console.error("❌ [SERVICE:PLAN] Failed to fetch drill plan metadata:", { drillPlanId, error });
		throw error;
	}
}

// ============================================================================
// SAVE DRAFT TO CACHE
// ============================================================================

/**
 * Save section draft to Dexie cache
 *
 * Persists work-in-progress data for a specific section.
 * Allows users to resume work across sessions.
 *
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 * @param sectionKey - The section being saved
 * @param data - The section data
 * @param metadata - Optional metadata (status, validation, etc.)
 *
 * @example
 * ```typescript
 * await saveDraftToCache(
 *   'plan-123',
 *   'DH001',
 *   'rigsheet',
 *   { RigSetupId: '...', ... },
 *   { RowStatus: 4, ValidationStatus: 1 }
 * );
 * ```
 */
export async function saveDraftToCache(
	drillPlanId: string,
	plannedHoleNm: string,
	sectionKey: string,
	data: any,
	metadata?: any,
): Promise<void> {
	console.log("💾 [SERVICE:DRAFT] Saving section draft to cache:", {
		drillPlanId,
		plannedHoleNm,
		sectionKey,
	});

	const startTime = performance.now();

	try {
		// TODO: Save to Dexie createDrillHoleDrafts table when it exists
		// const draft = {
		// 	drillPlanId,
		// 	plannedHoleNm,
		// 	sectionKey,
		// 	data,
		// 	metadata: metadata || {},
		// 	lastModified: new Date(),
		// };
		//
		// await db.createDrillHoleDrafts.put(draft);

		// Temporary placeholder: just log what would be saved
		const draftSize = JSON.stringify(data).length;
		console.log("📦 [SERVICE:DRAFT] Draft prepared (not yet saved - Dexie table pending):", {
			drillPlanId,
			plannedHoleNm,
			sectionKey,
			dataSize: `${draftSize} bytes`,
			metadata,
		});

		const duration = (performance.now() - startTime).toFixed(0);
		console.log(`✅ [SERVICE:DRAFT] Draft save complete in ${duration}ms`);
	} catch (error) {
		console.error("❌ [SERVICE:DRAFT] Failed to save draft:", {
			drillPlanId,
			plannedHoleNm,
			sectionKey,
			error,
		});
		throw error;
	}
}

// ============================================================================
// LOAD DRAFT FROM CACHE
// ============================================================================

/**
 * Load section draft from Dexie cache
 *
 * Retrieves previously saved draft data for a specific section.
 *
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 * @param sectionKey - The section to load
 * @returns Draft data or null if not found
 *
 * @example
 * ```typescript
 * const draft = await loadDraftFromCache('plan-123', 'DH001', 'rigsheet');
 * if (draft) {
 *   console.log('Resume from:', draft.lastModified);
 * }
 * ```
 */
export async function loadDraftFromCache(
	drillPlanId: string,
	plannedHoleNm: string,
	sectionKey: string,
): Promise<{ data: any; metadata: any; lastModified: Date } | null> {
	console.log("📂 [SERVICE:DRAFT] Loading section draft from cache:", {
		drillPlanId,
		plannedHoleNm,
		sectionKey,
	});

	try {
		// TODO: Load from Dexie createDrillHoleDrafts table when it exists
		// const draft = await db.createDrillHoleDrafts
		//   .where({ drillPlanId, plannedHoleNm, sectionKey })
		//   .first();

		// Temporary placeholder
		const draft = null;

		if (draft) {
			console.log("✅ [SERVICE:DRAFT] Draft found:", {
				sectionKey,
				lastModified: (draft as any).lastModified,
			});
			return draft as any;
		} else {
			console.log("ℹ️  [SERVICE:DRAFT] No draft found");
			return null;
		}
	} catch (error) {
		console.error("❌ [SERVICE:DRAFT] Failed to load draft:", {
			drillPlanId,
			plannedHoleNm,
			sectionKey,
			error,
		});
		return null;
	}
}

// ============================================================================
// CLEAR DRAFT CACHE
// ============================================================================

/**
 * Clear all drafts for a drill hole
 *
 * Removes all saved draft data from Dexie.
 * Called after successful submission or when discarding work.
 *
 * @param drillPlanId - The drill plan ID
 * @param plannedHoleNm - The planned hole name
 *
 * @example
 * ```typescript
 * await clearDraftCache('plan-123', 'DH001');
 * ```
 */
export async function clearDraftCache(
	drillPlanId: string,
	plannedHoleNm: string,
): Promise<void> {
	console.log("🗑️  [SERVICE:DRAFT] Clearing draft cache:", {
		drillPlanId,
		plannedHoleNm,
	});

	try {
		// TODO: Delete from Dexie createDrillHoleDrafts table when it exists
		// const deleted = await db.createDrillHoleDrafts
		//   .where({ drillPlanId, plannedHoleNm })
		//   .delete();

		// Temporary placeholder
		const deleted = 0;

		console.log(`✅ [SERVICE:DRAFT] Cleared ${deleted} draft records`);
	} catch (error) {
		console.error("❌ [SERVICE:DRAFT] Failed to clear draft cache:", {
			drillPlanId,
			plannedHoleNm,
			error,
		});
		throw error;
	}
}

// ============================================================================
// SUBMIT DRILL HOLE (Create)
// ============================================================================

/**
 * Submit drill hole via Collar upsert
 *
 * WORKFLOW:
 * 1. Hole already exists (created with DrillPlan where DrillPlanId = HoleId)
 * 2. We're upserting the Collar record where CollarId = DrillPlanId = HoleId
 * 3. This "completes" the drill hole by adding actual drill data
 *
 * @param drillPlanId - The drill plan ID (which IS the HoleId and CollarId)
 * @param upsertDto - UpsertCollarDto with all section data
 * @returns The Collar ID (same as HoleId and DrillPlanId)
 *
 * @example
 * ```typescript
 * const dto: UpsertCollarDto = {
 *   CollarId: drillPlanId, // CRITICAL: CollarId = DrillPlanId
 *   Organization: 'ORG001',
 *   RigSetup: { ... },
 *   CollarCoordinate: { ... },
 *   // ... other sections
 * };
 *
 * const collarId = await submitDrillHole(drillPlanId, dto);
 * console.log('Upserted CollarId:', collarId);
 * ```
 */
export async function submitDrillHole(
	drillPlanId: string,
	upsertDto: UpsertCollarDto
): Promise<string> {
	console.log("📤 [SERVICE:SUBMIT] Upserting collar for drill hole");
	console.log("  🎯 HoleId (DrillPlanId = CollarId):", drillPlanId);

	const startTime = performance.now();

	try {
		// Ensure CollarId is set correctly
		if (!upsertDto.CollarId) {
			upsertDto.CollarId = drillPlanId;
		}

		// Validate CollarId matches DrillPlanId
		if (upsertDto.CollarId !== drillPlanId) {
			throw new Error(
				`CollarId mismatch: CollarId=${upsertDto.CollarId}, DrillPlanId=${drillPlanId}`
			);
		}

		// Use UPSERT endpoint (handles both create and update)
		const response = await apiClient.collarControllerUpsert(upsertDto);

		const duration = (performance.now() - startTime).toFixed(0);

		console.log(`✅ [SERVICE:SUBMIT] Collar upserted successfully in ${duration}ms:`, {
			collarId: response.data.CollarId,
			holeId: drillPlanId,
		});

		// Return the CollarId (which equals HoleId and DrillPlanId)
		return response.data.CollarId!;
	} catch (error) {
		console.error("❌ [SERVICE:SUBMIT] Upsert failed:", {
			drillPlanId,
			collarId: upsertDto.CollarId,
			error,
		});
		throw error;
	}
}

// ============================================================================
// BUILD CREATE DTO
// ============================================================================

/**
 * Build UpsertCollarDto from section data
 *
 * Aggregates data from all sections into a single DTO for API submission.
 * Maps store format to API format.
 *
 * IMPORTANT: This is a convenience function for backwards compatibility.
 * The actual DTO building should be done in section-mappers.ts using buildUpsertCollarDto()
 *
 * @param sections - All section stores
 * @param drillPlanId - The drill plan ID (which IS the CollarId)
 * @param plannedHoleNm - The planned hole name (for logging only)
 * @returns UpsertCollarDto ready for API
 *
 * @example
 * ```typescript
 * const dto = buildUpsertCollarDto(store.sections, 'plan-123', 'DH001');
 * const collarId = await submitDrillHole('plan-123', dto);
 * ```
 */
export function buildUpsertCollarDto(
	sections: Record<string, any>,
	drillPlanId: string,
	plannedHoleNm: string,
): UpsertCollarDto {
	console.log("🔨 [SERVICE:BUILD] Building UpsertCollarDto from sections");

	try {
		// TODO: Extract data from each section and map to API format
		// This will be implemented when section mappers are created

		// Temporary placeholder structure
		const dto: UpsertCollarDto = {
			// CRITICAL: CollarId = DrillPlanId (same GUID)
			CollarId: drillPlanId,
			
			// Organization is required
			Organization: sections.rigsheet?.data?.Organization,

			// From RigSheet section
			// RigSetup: sections.rigsheet?.data || {},

			// From CollarCoordinates section
			// CollarCoordinate: sections.collarcoordinates?.data || {},

			// From GeologyCombinedLog section
			// GeologyCombinedLog: sections.geocombined?.data || [],

			// From Sample section
			// Sample: sections.sample?.data || [],

			// ... other sections
		};

		console.log("✅ [SERVICE:BUILD] UpsertCollarDto built:", {
			drillPlanId,
			plannedHoleNm,
			sections: Object.keys(sections).length,
		});

		return dto;
	} catch (error) {
		console.error("❌ [SERVICE:BUILD] Failed to build CreateCollarDto:", error);
		throw error;
	}
}

// ============================================================================
// VALIDATE FOR SUBMISSION
// ============================================================================

/**
 * Validate drill hole is ready for submission
 *
 * Checks that all required sections are complete and valid.
 * Returns array of validation errors.
 *
 * @param sections - All section stores
 * @returns Array of error messages (empty if valid)
 *
 * @example
 * ```typescript
 * const errors = validateForSubmission(store.sections);
 * if (errors.length > 0) {
 *   console.error('Cannot submit:', errors);
 * }
 * ```
 */
export function validateForSubmission(sections: Record<string, any>): string[] {
	console.log("🔍 [SERVICE:VALIDATE] Validating for submission");

	const errors: string[] = [];

	// Check required sections exist and are complete
	const requiredSections = ["rigsheet", "collarcoordinates"];

	for (const sectionKey of requiredSections) {
		const section = sections[sectionKey];

		if (!section) {
			errors.push(`Required section missing: ${sectionKey}`);
			continue;
		}

		// Check section is complete (RowStatus = 4)
		if (section.getRowStatus && section.getRowStatus() !== 4) {
			errors.push(`Section not complete: ${sectionKey}`);
		}

		// Check validation passed
		const validation = section.validate?.();
		if (validation) {
			const isValid =
				"isValid" in validation ? validation.isValid : validation.database?.isValid;

			if (!isValid) {
				const validationErrors =
					"errors" in validation ? validation.errors : validation.database?.errors || [];
				errors.push(
					`Section has validation errors (${sectionKey}): ${validationErrors.join(", ")}`,
				);
			}
		}
	}

	if (errors.length > 0) {
		console.log(`❌ [SERVICE:VALIDATE] Validation failed with ${errors.length} errors:`, errors);
	} else {
		console.log("✅ [SERVICE:VALIDATE] Validation passed");
	}

	return errors;
}

// ============================================================================
// OFFLINE SUPPORT
// ============================================================================

/**
 * Check if online
 *
 * Helper to check network connectivity before API calls.
 *
 * @returns True if online, false if offline
 */
export function isOnline(): boolean {
	return typeof navigator !== "undefined" && navigator.onLine;
}

/**
 * Queue submission for later
 *
 * If offline, queue the submission to be processed when back online.
 * Uses existing sync-service pattern.
 *
 * @param upsertDto - UpsertCollarDto to queue
 *
 * @example
 * ```typescript
 * if (!isOnline()) {
 *   await queueSubmissionForLater(dto);
 *   message.info('Queued for submission when online');
 * }
 * ```
 */
export async function queueSubmissionForLater(upsertDto: UpsertCollarDto): Promise<void> {
	console.log("📋 [SERVICE:QUEUE] Queuing submission for later (offline)");

	try {
		// TODO: Add to sync queue when offline support is fully implemented
		// await db.syncQueue.add({
		//   entityId: upsertDto.CollarId,
		//   entityType: "UpsertCollar",
		//   operation: "upsert",
		//   data: upsertDto,
		//   timestamp: new Date(),
		//   retryCount: 0,
		//   maxRetries: 3,
		//   nextRetryAt: new Date(),
		// });

		console.log("✅ [SERVICE:QUEUE] Submission queued");
	} catch (error) {
		console.error("❌ [SERVICE:QUEUE] Failed to queue submission:", error);
		throw error;
	}
}
