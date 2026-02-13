/**
 * DrillHole Service
 *
 * Implements proper Dexie-first pattern with synchronous version checking.
 * Flow: Dexie → Check versions → Show conflict modal if needed → Store (immediate)
 */

import type { SectionVersionDto, UiDrillHole } from "#src/api/database/data-contracts.js";
import type { ArraySectionKey, DrillHoleAggregate, RowMetadata, RowVersionMap } from "#src/lib/db/dexie";

import type { SectionKey } from "#src/types/drillhole";
import { db } from "#src/lib/db/dexie";
import { getSectionConfig } from "#src/lib/services/sync-config";
import { processSyncQueue } from "#src/lib/services/sync-service.js";
import { LoadConflictError } from "#src/types/errors";
import { apiClient } from "./apiClient";

// Section version response from API
interface SectionVersion {
	Description: string // "Collar", "RigSetup", etc.
	EntityId: string
	EntityTypeId: number
	rv: string
}

// Map API Description to sectionKey
const DESCRIPTION_TO_SECTION_KEY: Record<string, string> = {
	Collar: "collar",
	RigSetup: "rigsheet",
	DrillMethod: "drillmethod",
	Survey: "survey",
	SurveyLog: "survey",
	GeologyCombinedLog: "geocombined",
	Sample: "sample",
};

/**
 * Extract section versions from UiDrillHole
 */
function extractSectionVersions(data: UiDrillHole): Record<string, string> {
	return {
		drillplan: data.DrillHoleId || "",
		collar: data.Collar?.rv || "",
		collarcoordinates: data.CollarCoordinate?.rv || "",
		rigsheet: data.RigSetup?.rv || "",
		survey: data.Survey?.rv || "", // Survey header
	};
}

/**
 * Convert array to version map: { rowId: rowversion }
 */
function extractRowVersions<T extends { rv?: string }>(
	arr: T[] | undefined,
	idField: keyof T,
): RowVersionMap {
	if (!arr || arr.length === 0)
		return {};

	return Object.fromEntries(
		arr
			.filter(row => row[idField]) // Skip rows without ID
			.map(row => [String(row[idField]), row.rv || ""]),
	);
}

/**
 * Map status code to human-readable string
 */
function mapRowStatus(status?: number): "Draft" | "Active" | "Submitted" | "Approved" | "Rejected" {
	switch (status) {
		case 1: return "Draft";
		case 2: return "Active";
		case 3: return "Submitted";
		case 4: return "Approved";
		case 5: return "Rejected";
		default: return "Draft";
	}
}

/**
 * Map validation status code to human-readable string
 */
function mapValidationStatus(status?: number): "Valid" | "Invalid" | "NotValidated" {
	switch (status) {
		case 1: return "Valid";
		case 2: return "Invalid";
		case 0:
		default: return "NotValidated";
	}
}

/**
 * Extract row metadata from array
 */
function extractRowMetadata<T extends {
	RowStatus?: number
	ValidationStatus?: number
	ValidationErrors?: string | null
}>(
	arr: T[] | undefined,
	idField: keyof T,
): Record<string, RowMetadata> {
	if (!arr || arr.length === 0)
		return {};

	return Object.fromEntries(
		arr
			.filter(row => row[idField])
			.map(row => [
				String(row[idField]),
				{
					isDirty: false, // Will be updated on user edit
					isNew: false,
					isDeleted: false,
					isStale: false,
					validationStatus: mapValidationStatus(row.ValidationStatus),
					validationErrors: row.ValidationErrors ? [row.ValidationErrors] : undefined,
					rowStatus: mapRowStatus(row.RowStatus),
				},
			]),
	);
}

/**
 * Extracted versions interface
 */
interface ExtractedVersions {
	sectionVersions: Record<string, string>
	rowVersions: Record<ArraySectionKey, RowVersionMap>
	rowMetadata: Record<ArraySectionKey, Record<string, RowMetadata>>
}

/**
 * Extract both section-level and row-level versions from UiDrillHole
 */
function extractVersions(data: UiDrillHole): ExtractedVersions {
	return {
		// Single-object sections (unchanged)
		sectionVersions: extractSectionVersions(data),

		// Array sections (row-level)
		rowVersions: {
			drillmethod: extractRowVersions(data.DrillMethod, "DrillMethodId"),
			surveylog: extractRowVersions(data.SurveyLog, "SurveyLogId"),
			geocombined: extractRowVersions(data.GeologyCombinedLog, "GeologyCombinedLogId"),
			sample: extractRowVersions(data.Sample, "SampleId"),
		},

		// Row metadata
		rowMetadata: {
			drillmethod: extractRowMetadata(data.DrillMethod, "DrillMethodId"),
			surveylog: extractRowMetadata(data.SurveyLog, "SurveyLogId"),
			geocombined: extractRowMetadata(data.GeologyCombinedLog, "GeologyCombinedLogId"),
			sample: extractRowMetadata(data.Sample, "SampleId"),
		},
	};
}

/**
 * Fetch DrillHole from API by DrillPlanId
 */
export async function fetchDrillHoleFromApi(drillPlanId: string): Promise<UiDrillHole> {
	console.log("🌐 [ROWVERSION] API: Fetching DrillHole:", drillPlanId);
	const startTime = performance.now();

	try {
		const response = await apiClient.uiDrillHoleControllerFindOne(drillPlanId);
		const duration = (performance.now() - startTime).toFixed(0);

		console.log(`✅ [ROWVERSION] API: DrillHole fetched in ${duration}ms:`, {
			drillPlanId,
			dataSize: `${JSON.stringify(response.data).length} bytes`,
		});

		return response.data;
	}
	catch (error) {
		console.error("❌ [ROWVERSION] API: Failed to fetch DrillHole:", { drillPlanId, error });
		throw error;
	}
}

/**
 * Store DrillHole aggregate in Dexie (new table)
 */
export async function storeDrillHoleAggregate(data: UiDrillHole): Promise<void> {
	console.log(`💾 [ROWVERSION] Storing DrillHole aggregate: ${data.DrillHoleId}`);
	const startTime = performance.now();

	try {
		// Extract all versions (section + row)
		const versions = extractVersions(data);

		const aggregate: DrillHoleAggregate = {
			drillPlanId: data.DrillHoleId,
			data,

			// Single-object sections
			sectionVersions: versions.sectionVersions,

			// Array sections
			rowVersions: versions.rowVersions,

			// Extract initial metadata from data
			rowMetadata: versions.rowMetadata,

			dirtySections: [],
			staleSections: [],
			dirtyRows: {
				drillmethod: [],
				surveylog: [],
				geocombined: [],
				sample: [],
			},
			staleRows: {
				drillmethod: [],
				surveylog: [],
				geocombined: [],
				sample: [],
			},

			lastFetchedAt: new Date(),
			lastModifiedAt: new Date(),
			syncStatus: "clean",
		};

		await db.drillHoles.put(aggregate);
		const duration = (performance.now() - startTime).toFixed(0);

		console.log(`✅ [ROWVERSION] Aggregate stored in ${duration}ms with row-level tracking:`, {
			drillPlanId: data.DrillHoleId,
			sections: Object.keys(versions.sectionVersions).length,
			sectionVersions: Object.entries(versions.sectionVersions).map(([key, version]) => ({
				section: key,
				rowversion: version || "(empty)",
			})),
			rowCounts: {
				drillmethod: Object.keys(versions.rowVersions.drillmethod).length,
				surveylog: Object.keys(versions.rowVersions.surveylog).length,
				geocombined: Object.keys(versions.rowVersions.geocombined).length,
				sample: Object.keys(versions.rowVersions.sample).length,
			},
			dataSize: `${JSON.stringify(data).length} bytes`,
		});
	}
	catch (error) {
		console.error("❌ [ROWVERSION] Failed to store aggregate:", { drillPlanId: data.DrillHoleId, error });
		throw error;
	}
}

/**
 * Get DrillHole aggregate from Dexie
 */
export async function getDrillHoleAggregate(drillPlanId: string): Promise<DrillHoleAggregate | undefined> {
	console.log(`💾 [ROWVERSION] Reading DrillHole aggregate: ${drillPlanId}`);
	const startTime = performance.now();

	try {
		const aggregate = await db.drillHoles.get(drillPlanId);
		const duration = (performance.now() - startTime).toFixed(0);

		if (aggregate) {
			console.log(`✅ [ROWVERSION] Aggregate found in ${duration}ms:`, {
				drillPlanId,
				syncStatus: aggregate.syncStatus,
				dirtySections: aggregate.dirtySections.length > 0 ? aggregate.dirtySections : "none",
				staleSections: aggregate.staleSections?.length > 0 ? aggregate.staleSections : "none",
				lastFetchedAt: aggregate.lastFetchedAt,
				sectionVersions: Object.entries(aggregate.sectionVersions).map(([key, version]) => ({
					section: key,
					rowversion: version || "(empty)",
				})),
			});
		}
		else {
			console.log(`⚠️ [ROWVERSION] Aggregate not found in ${duration}ms: ${drillPlanId}`);
		}

		return aggregate;
	}
	catch (error) {
		console.error("❌ [ROWVERSION] Failed to read aggregate:", { drillPlanId, error });
		return undefined;
	}
}

/**
 * Check section versions against server
 */
export async function checkSectionVersions(drillPlanId: string): Promise<SectionVersionDto[]> {
	console.log(`📋 [ROWVERSION] Checking section versions on server for: ${drillPlanId}`);
	const startTime = performance.now();

	try {
		const response = await apiClient.uiDrillHoleControllerGetSectionVersion(drillPlanId);
		const duration = (performance.now() - startTime).toFixed(0);

		console.log(`✅ [ROWVERSION] Server versions received in ${duration}ms:`, {
			drillPlanId,
			sectionsCount: response.data?.length || 0,
			versions: response.data?.map((v: any) => ({
				section: v.Description,
				rowversion: v.rv,
			})),
		});

		return response.data as SectionVersionDto[];
	}
	catch (error) {
		console.error("❌ [ROWVERSION] Failed to check section versions:", { drillPlanId, error });
		return [];
	}
}

/**
 * Interface for load conflict information
 */
interface LoadConflictInfo {
	staleSections: SectionKey[]
	serverVersions: SectionVersionDto[]
}

/**
 * Check for version conflicts between local cache and server
 * This is called synchronously before returning cached data to user
 *
 * Handles two cases:
 * 1. Stale + Clean → Auto-refresh from server, return 'auto-refreshed'
 * 2. Stale + Dirty → Return conflict (modal will show)
 *
 * @returns LoadConflictInfo if conflicts exist, 'auto-refreshed' if refreshed, null if current
 */
async function checkForLoadConflict(
	drillPlanId: string,
	localAggregate: DrillHoleAggregate,
): Promise<LoadConflictInfo | "auto-refreshed" | null> {
	console.log(`🔍 [ROWVERSION] Checking server versions for: ${drillPlanId}`);
	const startTime = performance.now();

	try {
		// Get server versions
		const serverVersions = await checkSectionVersions(drillPlanId);

		const staleSections: SectionKey[] = [];
		const staleButClean: SectionKey[] = [];
		const conflictDetails: SectionVersionDto[] = [];

		// Compare versions
		for (const serverVersion of serverVersions) {
			const sectionKey = DESCRIPTION_TO_SECTION_KEY[serverVersion.Description] as SectionKey;
			if (!sectionKey) {
				console.warn(`⚠️ [ROWVERSION] Unknown section description: ${serverVersion.Description}`);
				continue;
			}

			const localRv = localAggregate.sectionVersions[sectionKey];
			const isDirty = localAggregate.dirtySections.includes(sectionKey);
			const isStale = localRv && localRv !== serverVersion.rv;

			if (isStale) {
				if (isDirty) {
					// CONFLICT: User has unsaved changes AND server has newer version
					staleSections.push(sectionKey);
					conflictDetails.push(serverVersion);
					console.log(`🔴 [ROWVERSION] CONFLICT: ${sectionKey} - dirty locally + stale on server`, {
						local: localRv,
						server: serverVersion.rv,
						modifiedBy: serverVersion.ModifiedBy,
						modifiedOnDt: serverVersion.ModifiedOnDt,
					});
				}
				else {
					// AUTO-REFRESH: Server has newer version but no local changes
					staleButClean.push(sectionKey);
					console.log(`🟡 [ROWVERSION] STALE (will auto-refresh): ${sectionKey}`, {
						local: localRv,
						server: serverVersion.rv,
					});
				}
			}
			else {
				console.log(`🟢 [ROWVERSION] CURRENT: ${sectionKey}`);
			}
		}

		const duration = (performance.now() - startTime).toFixed(0);

		// If there are stale sections without local changes, auto-refresh from server
		if (staleButClean.length > 0 && staleSections.length === 0) {
			console.log(`🔄 [ROWVERSION] Auto-refreshing ${staleButClean.length} stale sections (no conflicts)`);
			const freshData = await fetchDrillHoleFromApi(drillPlanId);
			await storeDrillHoleAggregate(freshData);
			console.log(`✅ [ROWVERSION] Auto-refresh completed in ${duration}ms`);
			return "auto-refreshed";
		}

		// Only return conflict if there are dirty + stale sections
		if (staleSections.length > 0) {
			console.log(`⚠️ [ROWVERSION] Conflict detected in ${duration}ms:`, {
				conflictCount: staleSections.length,
				sections: staleSections,
			});

			return {
				staleSections,
				serverVersions: conflictDetails,
			};
		}

		console.log(`✅ [ROWVERSION] Version check completed in ${duration}ms - cache is current`);
		return null;
	}
	catch (error) {
		console.error("❌ [ROWVERSION] Version check failed:", error);
		// On error, don't block - return null to allow load
		return null;
	}
}

/**
 * Background revalidation - checks if local data is stale
 * Detects stale sections and stores them for UI warning
 */
async function revalidateInBackground(drillPlanId: string, localAggregate: DrillHoleAggregate): Promise<void> {
	try {
		// Don't revalidate if offline
		if (!navigator.onLine) {
			console.log("⏸️ [ROWVERSION] Offline, skipping revalidation");
			return;
		}

		console.log(`🔄 [ROWVERSION] Starting background revalidation for: ${drillPlanId}`);
		const startTime = performance.now();

		// Check server versions (returns array)
		const serverVersions = await checkSectionVersions(drillPlanId);

		const staleSections: string[] = [];
		const versionComparisons: any[] = [];

		// Compare versions by mapping Description to sectionKey
		for (const serverVersion of serverVersions) {
			const sectionKey = DESCRIPTION_TO_SECTION_KEY[serverVersion.Description];
			if (!sectionKey) {
				console.warn(`⚠️ [ROWVERSION] Unknown section description: ${serverVersion.Description}`);
				continue;
			}

			const localVersion = localAggregate.sectionVersions[sectionKey];
			const isStale = localVersion && localVersion !== serverVersion.rv;

			versionComparisons.push({
				section: sectionKey,
				local: localVersion || "(not cached)",
				server: serverVersion.rv,
				isStale,
			});

			if (isStale) {
				staleSections.push(sectionKey);
				console.log(`🔴 [ROWVERSION] Section ${sectionKey} is STALE:`, {
					local: localVersion,
					server: serverVersion.rv,
				});
			}
			else {
				console.log(`🟢 [ROWVERSION] Section ${sectionKey} is current:`, {
					version: localVersion || "(not cached)",
				});
			}
		}

		// Log all comparisons
		console.log("📊 [ROWVERSION] Version comparison summary:", versionComparisons);

		// Update staleSections in aggregate (whether empty or not)
		localAggregate.staleSections = staleSections;
		await db.drillHoles.put(localAggregate);
		console.log("💾 [ROWVERSION] Updated Dexie with staleSections:", staleSections);

		if (staleSections.length > 0) {
			console.log(`⚠️ [ROWVERSION] Stale sections detected: ${staleSections.join(", ")}`);

			// If no dirty sections, refresh automatically
			if (localAggregate.dirtySections.length === 0) {
				console.log("✅ [ROWVERSION] No dirty sections - auto-refreshing cache");
				const freshData = await fetchDrillHoleFromApi(drillPlanId);
				await storeDrillHoleAggregate(freshData);
				console.log("✅ [ROWVERSION] Cache auto-refreshed successfully");
			}
			else {
				console.log(`⚠️ [ROWVERSION] Has dirty sections (${localAggregate.dirtySections.join(", ")}) - keeping stale warning for user`);
			}
		}
		else {
			console.log("✅ [ROWVERSION] Cache is up to date - no stale sections");
		}

		const duration = (performance.now() - startTime).toFixed(0);
		console.log(`✅ [ROWVERSION] Background revalidation completed in ${duration}ms`);
	}
	catch (error) {
		console.error("❌ [ROWVERSION] Background revalidation failed:", error);
		// Don't throw - this is a background operation
	}
}

/**
 * Load DrillHole - Dexie first, background revalidation
 *
 * Flow:
 * 1. Check Dexie → Return immediately (fast UX)
 * 2. Background: Check server versions
 * 3. If stale + no dirty → Refresh
 * 4. If stale + dirty → Warn (conflict)
 * 5. If not in Dexie → Fetch from API
 *
 * @param drillPlanId - The drill plan ID to load
 * @param forceRefresh - If true, skip cache and fetch fresh from API
 */
export async function loadDrillHole(drillPlanId: string, forceRefresh = false): Promise<UiDrillHole> {
	console.log(`📂 [ROWVERSION] Loading drill hole: ${drillPlanId}${forceRefresh ? " (FORCE REFRESH)" : ""}`);
	const startTime = performance.now();

	// Force refresh - skip cache and fetch fresh
	if (forceRefresh) {
		console.log("🔄 [ROWVERSION] Force refresh enabled - bypassing cache");
		const apiData = await fetchDrillHoleFromApi(drillPlanId);
		await storeDrillHoleAggregate(apiData);
		const duration = (performance.now() - startTime).toFixed(0);
		console.log(`✅ [ROWVERSION] Force refresh completed in ${duration}ms`);
		return apiData;
	}

	// 1. Try Dexie first (fast path)
	console.log("🔍 [ROWVERSION] Checking Dexie cache...");
	let localAggregate = await getDrillHoleAggregate(drillPlanId);

	if (localAggregate) {
		const duration = (performance.now() - startTime).toFixed(0);
		console.log(`✅ [ROWVERSION] Found in Dexie (${duration}ms)`);
		console.log(`   Cached sections: ${Object.keys(localAggregate.sectionVersions).length}`);
		console.log(`   Dirty sections: ${localAggregate.dirtySections.length > 0 ? localAggregate.dirtySections.join(", ") : "none"}`);
		console.log(`   Sync status: ${localAggregate.syncStatus}`);

		// 2. ALWAYS check server versions when online (not just when dirty)
		if (navigator.onLine) {
			console.log("🔄 [ROWVERSION] Checking server versions...");
			const result = await checkForLoadConflict(drillPlanId, localAggregate);

			if (result === "auto-refreshed") {
				// Auto-refresh happened - re-read from Dexie to get fresh data
				console.log("🔄 [ROWVERSION] Re-reading from Dexie after auto-refresh...");
				localAggregate = await getDrillHoleAggregate(drillPlanId);
				if (!localAggregate) {
					throw new Error("Failed to read refreshed data from Dexie");
				}
			}
			else if (result !== null) {
				// Has dirty sections AND server has newer version - show modal
				console.log("⚠️ [ROWVERSION] Conflict detected - throwing LoadConflictError");
				throw new LoadConflictError({
					staleSections: result.staleSections,
					serverVersions: result.serverVersions,
					localVersions: localAggregate.sectionVersions,
					dirtySections: localAggregate.dirtySections,
				});
			}
			else {
				console.log("✅ [ROWVERSION] Version check passed - cache is current");
			}
		}
		else {
			console.log("📴 [ROWVERSION] Offline - skipping version check");
		}

		return localAggregate.data as UiDrillHole;
	}

	// 3. Not in cache - fetch from API
	console.log("❌ [ROWVERSION] Not found in Dexie - fetching from API");
	const apiData = await fetchDrillHoleFromApi(drillPlanId);

	// Store in Dexie for next time
	console.log("💾 [ROWVERSION] Storing in Dexie for future loads");
	await storeDrillHoleAggregate(apiData);

	const duration = (performance.now() - startTime).toFixed(0);
	console.log(`✅ [ROWVERSION] Initial load completed in ${duration}ms`);

	return apiData;
}

/**
 * Mark section as dirty (has unsaved changes)
 */
export async function markSectionDirty(drillPlanId: string, sectionKey: string): Promise<void> {
	console.log(`🏷️ [ROWVERSION] Marking section as dirty: ${sectionKey} (${drillPlanId})`);
	const aggregate = await getDrillHoleAggregate(drillPlanId);
	if (!aggregate) {
		console.warn(`⚠️ [ROWVERSION] Cannot mark section dirty, aggregate not found: ${drillPlanId}`);
		return;
	}

	if (!aggregate.dirtySections.includes(sectionKey)) {
		console.log(`📝 [ROWVERSION] Adding ${sectionKey} to dirty sections array`);
		aggregate.dirtySections.push(sectionKey);
		aggregate.syncStatus = "dirty";
		aggregate.lastModifiedAt = new Date();
		await db.drillHoles.put(aggregate);
		console.log("✅ [ROWVERSION] Section marked as dirty:", {
			section: sectionKey,
			dirtySections: aggregate.dirtySections,
			syncStatus: aggregate.syncStatus,
		});
	}
	else {
		console.log(`⚠️ [ROWVERSION] Section already marked as dirty: ${sectionKey}`);
	}
}

/**
 * Mark section as clean (saved successfully)
 */
export async function markSectionClean(drillPlanId: string, sectionKey: string): Promise<void> {
	console.log(`✅ [ROWVERSION] Marking section as clean: ${sectionKey} (${drillPlanId})`);
	const aggregate = await getDrillHoleAggregate(drillPlanId);
	if (!aggregate) {
		console.warn(`⚠️ [ROWVERSION] Cannot mark section clean, aggregate not found: ${drillPlanId}`);
		return;
	}

	const beforeCount = aggregate.dirtySections.length;
	aggregate.dirtySections = aggregate.dirtySections.filter(s => s !== sectionKey);
	const afterCount = aggregate.dirtySections.length;

	// If no more dirty sections, mark as clean
	if (aggregate.dirtySections.length === 0) {
		aggregate.syncStatus = "clean";
		console.log("✅ [ROWVERSION] All sections clean - syncStatus set to 'clean'");
	}

	await db.drillHoles.put(aggregate);
	console.log("✅ [ROWVERSION] Section marked as clean:", {
		section: sectionKey,
		dirtySectionsRemoved: beforeCount - afterCount,
		remainingDirtySections: aggregate.dirtySections.length > 0 ? aggregate.dirtySections : "none",
		syncStatus: aggregate.syncStatus,
	});
}

// =============================================================================
// ROW-LEVEL DIRTY TRACKING HELPERS
// =============================================================================

/**
 * Check if row data has changed (shallow comparison, excluding rv)
 */
function hasRowChanged(oldRow: any, newRow: any): boolean {
	// Compare all fields except rv (rowversion) and timestamps
	const fieldsToSkip = ["rv", "CreatedDt", "ModifiedDt", "CreatedBy", "ModifiedBy"];
	const fieldsToCompare = Object.keys(newRow).filter(key => !fieldsToSkip.includes(key));

	for (const field of fieldsToCompare) {
		// Handle null/undefined equality
		if (oldRow[field] !== newRow[field]) {
			// Allow null == undefined
			if ((oldRow[field] === null && newRow[field] === undefined)
			  || (oldRow[field] === undefined && newRow[field] === null)) {
				continue;
			}
			return true;
		}
	}

	return false;
}

/**
 * Identify which rows in the new data are new or modified
 *
 * A row is dirty if:
 * 1. It doesn't exist in rowVersions (NEW row - never synced)
 * 2. It exists but data has changed (MODIFIED row)
 */
function identifyDirtyRows(
	aggregate: DrillHoleAggregate,
	sectionKey: ArraySectionKey,
	newData: any[],
	idField: string,
): string[] {
	const dirtyRowIds: string[] = [];
	const existingRowVersions = aggregate.rowVersions[sectionKey] || {};
	const existingDataArray = getArrayFromAggregate(aggregate.data, sectionKey) || [];

	// Create lookup map for existing data (case-insensitive)
	const existingDataMap = new Map<string, any>();
	for (const row of existingDataArray) {
		const rowId = String(row[idField]).toUpperCase();
		existingDataMap.set(rowId, row);
	}

	for (const row of newData) {
		const rowId = String(row[idField]);
		const rowIdUpper = rowId.toUpperCase();

		// Case 1: New row (no version exists - never been synced to server)
		if (!existingRowVersions[rowId] && !existingRowVersions[rowIdUpper]) {
			dirtyRowIds.push(rowId);
			console.log(`🆕 [ROW-DIRTY] New row detected: ${sectionKey}[${rowId}]`);
			continue;
		}

		// Case 2: Modified row (data changed)
		const existingRow = existingDataMap.get(rowIdUpper);
		if (existingRow && hasRowChanged(existingRow, row)) {
			dirtyRowIds.push(rowId);
			console.log(`✏️ [ROW-DIRTY] Modified row detected: ${sectionKey}[${rowId}]`);
		}
	}

	console.log(`📋 [ROW-DIRTY] Found ${dirtyRowIds.length} dirty rows in ${sectionKey}`, {
		totalRows: newData.length,
		dirtyRows: dirtyRowIds.length,
		sampleIds: dirtyRowIds.slice(0, 5), // Show first 5
	});

	return dirtyRowIds;
}

/**
 * Mark multiple rows as dirty in the aggregate
 */
function markRowsAsDirty(
	aggregate: DrillHoleAggregate,
	sectionKey: ArraySectionKey,
	rowIds: string[],
): void {
	// Initialize structures if needed
	if (!aggregate.dirtyRows[sectionKey]) {
		aggregate.dirtyRows[sectionKey] = [];
	}
	if (!aggregate.rowMetadata[sectionKey]) {
		aggregate.rowMetadata[sectionKey] = {};
	}

	for (const rowId of rowIds) {
		const rowIdUpper = rowId.toUpperCase();

		// Add to dirtyRows if not already there (case-insensitive check)
		const alreadyDirty = aggregate.dirtyRows[sectionKey].some(
			id => id.toUpperCase() === rowIdUpper,
		);

		if (!alreadyDirty) {
			aggregate.dirtyRows[sectionKey].push(rowId);
		}

		// Update or create row metadata
		if (!aggregate.rowMetadata[sectionKey][rowId]) {
			aggregate.rowMetadata[sectionKey][rowId] = {
				isDirty: false,
				isNew: false,
				isDeleted: false,
				isStale: false,
			};
		}

		const metadata = aggregate.rowMetadata[sectionKey][rowId];
		metadata.isDirty = true;

		// Mark as new if no version exists (case-insensitive)
		const hasVersion = aggregate.rowVersions[sectionKey]?.[rowId]
		  || aggregate.rowVersions[sectionKey]?.[rowIdUpper];
		if (!hasVersion) {
			metadata.isNew = true;
		}
	}

	console.log(`✅ [ROW-DIRTY] Marked ${rowIds.length} rows as dirty in ${sectionKey}`);
}

/**
 * Update section data locally (optimistic update)
 * Now with row-level dirty tracking for array sections
 */
export async function updateSectionLocally(
	drillPlanId: string,
	sectionKey: string,
	sectionData: any,
): Promise<void> {
	const aggregate = await getDrillHoleAggregate(drillPlanId);
	if (!aggregate) {
		throw new Error(`DrillHole ${drillPlanId} not found in cache`);
	}

	// Get section config to check if this is an array section
	const config = getSectionConfig(sectionKey);
	const isArray = config.isArraySection;

	// For array sections, identify dirty rows BEFORE updating data
	let dirtyRowIds: string[] = [];
	if (isArray && Array.isArray(sectionData)) {
		console.log(`🔍 [ROW-DIRTY] Analyzing ${sectionKey} for dirty rows...`, {
			newDataCount: sectionData.length,
			sectionKey,
		});

		dirtyRowIds = identifyDirtyRows(
			aggregate,
			sectionKey as ArraySectionKey,
			sectionData,
			config.idField,
		);
	}

	// Update section in aggregate data
	const updatedData = { ...aggregate.data };

	// Map section data back to API structure
	switch (sectionKey) {
		case "collar":
			updatedData.Collar = sectionData;
			break;
		case "rigsheet":
			updatedData.RigSetup = sectionData;
			break;
		case "drillmethod":
			updatedData.DrillMethod = sectionData; // Array section
			break;
		case "surveylog":
			updatedData.SurveyLog = sectionData; // Array section
			break;
		case "survey":
			updatedData.Survey = sectionData; // Object section
			break;
		case "geocombined":
			updatedData.GeologyCombinedLog = sectionData; // Array section - don't wrap
			break;
		case "sample":
			updatedData.Sample = sectionData; // Array section - don't wrap
			break;
	}

	aggregate.data = updatedData;
	aggregate.lastModifiedAt = new Date();

	// Mark individual rows as dirty (NEW FUNCTIONALITY)
	if (isArray && dirtyRowIds.length > 0) {
		markRowsAsDirty(
			aggregate,
			sectionKey as ArraySectionKey,
			dirtyRowIds,
		);
		console.log(`💾 [ROW-DIRTY] Updated aggregate with ${dirtyRowIds.length} dirty rows`, {
			sectionKey,
			dirtyRowIds: aggregate.dirtyRows[sectionKey as ArraySectionKey]?.length || 0,
		});
	}

	await db.drillHoles.put(aggregate);
	await markSectionDirty(drillPlanId, sectionKey);
}

/**
 * Save section to server
 * - If online: Immediate API call, throws on failure
 * - If offline: Queue for later sync, always succeeds
 */
export async function saveDrillHoleSection(
	drillPlanId: string,
	sectionKey: string,
	sectionData: any,
): Promise<void> {
	const isArray = Array.isArray(sectionData);
	console.log("💾 [VALIDATION-CHECK 1/3] DrillholeService: Received section data:", {
		sectionKey,
		online: navigator.onLine,
		isArray,
		arrayLength: isArray ? sectionData.length : "N/A",
		ValidationStatus: isArray ? "(in metadata)" : sectionData.ValidationStatus,
		ValidationErrors: isArray ? "(in metadata)" : sectionData.ValidationErrors,
		hasValidationStatus: isArray ? false : "ValidationStatus" in sectionData,
		hasValidationErrors: isArray ? false : "ValidationErrors" in sectionData,
		dataKeys: isArray ? "array" : Object.keys(sectionData).slice(0, 20),
	});

	try {
		console.log("Data type check:", {
			isArray,
			keys: isArray ? `array[${sectionData.length}]` : Object.keys(sectionData).slice(0, 5),
			type: typeof sectionData,
		});

		// Update locally first (optimistic)
		await updateSectionLocally(drillPlanId, sectionKey, sectionData);
		console.log("💾 Dexie: Section saved locally");

		// If online, make immediate API call and wait for result
		if (navigator.onLine) {
			console.log("🌐 API: Making immediate API call (online)");

			// Import sync functions

			// Add to queue
			const queueItem = await db.syncQueue.add({
				entityId: drillPlanId,
				entityType: "DrillHoleSection",
				operation: "update",
				data: {
					sectionKey,
					sectionData,
				},
				timestamp: new Date(),
				retryCount: 0,
				maxRetries: 3,
				nextRetryAt: new Date(),
			});

			console.log("📋 [VALIDATION-CHECK 2/3] Dexie: Added to sync queue:", {
				queueItemId: queueItem,
				sectionKey,
				isArray,
				ValidationStatus: isArray ? "(in metadata)" : sectionData.ValidationStatus,
				ValidationErrors: isArray ? "(in metadata)" : sectionData.ValidationErrors,
			});

			// Process immediately and wait for result
			// This will throw if the API call fails with non-retryable error

			// Wait a bit to ensure item is written to Dexie before processing
			await new Promise(resolve => setTimeout(resolve, 50));

			await processSyncQueue();

			// Check if the item was removed from queue (success) or still there (failed)
			const stillInQueue = await db.syncQueue.get(queueItem);
			if (stillInQueue) {
				// Item still in queue means it failed but is retryable
				// Or it's in backoff period - either way, treat as failure for now
				throw new Error("API sync failed - item still in queue");
			}

			console.log("✅ Sync: Immediate sync completed successfully");
		}
		else {
			// Offline - queue for later (always succeeds)
			console.log("📴 Offline: Queuing for later sync");

			// COALESCE: Check for existing queue item for this drillHole + section
			// This prevents duplicate queue items when user saves multiple times offline
			const existingItems = await db.syncQueue
				.where({
					entityId: drillPlanId,
					entityType: "DrillHoleSection",
				})
				.toArray();

			// Find existing item for this specific section
			const existingItem = existingItems.find(
				item => item.data?.sectionKey === sectionKey,
			);

			if (existingItem && existingItem.id) {
				// Update existing queue item with latest data (coalesce multiple saves)
				await db.syncQueue.update(existingItem.id, {
					data: {
						sectionKey,
						sectionData,
					},
					timestamp: new Date(), // Update timestamp to reflect latest change
					// Keep existing retryCount and error state
				});
				console.log("🔄 Dexie: Updated existing queue item (coalesced changes):", {
					queueItemId: existingItem.id,
					sectionKey,
					retryCount: existingItem.retryCount,
				});
			}
			else {
				// Add new queue item
				await db.syncQueue.add({
					entityId: drillPlanId,
					entityType: "DrillHoleSection",
					operation: "update",
					data: {
						sectionKey,
						sectionData,
					},
					timestamp: new Date(),
					retryCount: 0,
					maxRetries: 3,
					nextRetryAt: new Date(),
				});
				console.log("📋 Dexie: Queued for sync when online");
			}
		}
	}
	catch (error) {
		console.error("❌ Failed to save section:", error);
		// Rollback local changes if API failed
		// TODO: Implement rollback from previous version
		throw error;
	}
}

// =============================================================================
// ROW-LEVEL HELPER FUNCTIONS
// =============================================================================

/**
 * Get ID field name for array section
 */
function getIdField(sectionKey: ArraySectionKey): string {
	const fieldMap: Record<ArraySectionKey, string> = {
		drillmethod: "DrillMethodId",
		surveylog: "SurveyLogId",
		geocombined: "GeologyCombinedLogId",
		sample: "SampleId",
	};
	return fieldMap[sectionKey];
}

/**
 * Get array from UiDrillHole by section key
 */
function getArrayFromAggregate(data: any, sectionKey: ArraySectionKey): any[] | undefined {
	const arrayMap: Record<ArraySectionKey, string> = {
		drillmethod: "DrillMethod",
		surveylog: "SurveyLog",
		geocombined: "GeologyCombinedLog",
		sample: "Sample",
	};
	return data[arrayMap[sectionKey]];
}

/**
 * Create empty row metadata
 */
function createEmptyMetadata(): RowMetadata {
	return {
		isDirty: false,
		isNew: false,
		isDeleted: false,
		isStale: false,
	};
}

/**
 * Mark a specific row as dirty in Dexie
 */
export async function markRowDirtyInDexie(
	drillPlanId: string,
	sectionKey: ArraySectionKey,
	rowId: string,
): Promise<void> {
	console.log(`🏷️ [ROWVERSION] Marking row as dirty: ${sectionKey}[${rowId}]`);

	const aggregate = await getDrillHoleAggregate(drillPlanId);
	if (!aggregate) {
		console.warn("⚠️ [ROWVERSION] Cannot mark row dirty, aggregate not found");
		return;
	}

	// Add to dirtyRows list
	if (!aggregate.dirtyRows[sectionKey].includes(rowId)) {
		aggregate.dirtyRows[sectionKey].push(rowId);
		aggregate.syncStatus = "dirty";
		aggregate.lastModifiedAt = new Date();

		// Update row metadata
		if (!aggregate.rowMetadata[sectionKey][rowId]) {
			aggregate.rowMetadata[sectionKey][rowId] = createEmptyMetadata();
		}
		aggregate.rowMetadata[sectionKey][rowId].isDirty = true;

		await db.drillHoles.put(aggregate);
		console.log("✅ [ROWVERSION] Row marked as dirty");
	}
}

/**
 * Mark a specific row as clean in Dexie (after successful save)
 */
export async function markRowCleanInDexie(
	drillPlanId: string,
	sectionKey: ArraySectionKey,
	rowId: string,
): Promise<void> {
	console.log(`✅ [ROWVERSION] Marking row as clean: ${sectionKey}[${rowId}]`);

	const aggregate = await getDrillHoleAggregate(drillPlanId);
	if (!aggregate) {
		console.warn("⚠️ [ROWVERSION] Cannot mark row clean, aggregate not found");
		return;
	}

	// Remove from dirtyRows list
	aggregate.dirtyRows[sectionKey] = aggregate.dirtyRows[sectionKey].filter(id => id !== rowId);

	// Update row metadata
	if (aggregate.rowMetadata[sectionKey][rowId]) {
		aggregate.rowMetadata[sectionKey][rowId].isDirty = false;
		aggregate.rowMetadata[sectionKey][rowId].isNew = false;
	}

	// If no more dirty rows in any section, mark aggregate as clean
	const hasAnyDirtyRows = Object.values(aggregate.dirtyRows).some(rows => rows.length > 0);
	if (!hasAnyDirtyRows && aggregate.dirtySections.length === 0) {
		aggregate.syncStatus = "clean";
	}

	await db.drillHoles.put(aggregate);
	console.log("✅ [ROWVERSION] Row marked as clean");
}

/**
 * Update row version after successful save
 */
export async function updateRowVersion(
	drillPlanId: string,
	sectionKey: ArraySectionKey,
	rowId: string,
	newRv: string,
	newData?: any,
): Promise<void> {
	console.log(`🔄 [ROWVERSION] Updating row version: ${sectionKey}[${rowId}] → ${newRv}`);

	const aggregate = await getDrillHoleAggregate(drillPlanId);
	if (!aggregate)
		return;

	// Update row version
	aggregate.rowVersions[sectionKey][rowId] = newRv;

	// Update data if provided
	if (newData) {
		const idField = getIdField(sectionKey);
		const dataArray = getArrayFromAggregate(aggregate.data, sectionKey);
		const rowIndex = dataArray?.findIndex((row: any) => row[idField] === rowId);

		if (rowIndex !== undefined && rowIndex >= 0 && dataArray) {
			Object.assign(dataArray[rowIndex], newData);
		}
	}

	// Mark as clean
	await markRowCleanInDexie(drillPlanId, sectionKey, rowId);
}
