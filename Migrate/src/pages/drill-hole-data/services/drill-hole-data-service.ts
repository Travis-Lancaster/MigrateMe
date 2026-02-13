/**
 * Drill-Hole-Data Service
 * 
 * Service layer for drill-hole-data module data operations.
 * Implements offline-first pattern with Dexie → API sync.
 * 
 * CRITICAL REQUIREMENTS:
 * - Use VwCollar, VwDrillPlan, AllSamples (NOT base tables)
 * - HoleId = DrillPlanId = CollarId (all equivalent)
 * - This service does NOT create collars/plans
 * - Offline-first: Dexie cache → API fallback → Update cache
 * 
 * FLOW:
 * 1. Check Dexie cache first (unless forceRefresh)
 * 2. If cache miss or stale, fetch from API
 * 3. Update cache with API response
 * 4. Return data to store
 * 5. Queue writes for background sync
 * 
 * @module drill-hole-data/services
 */

import { db } from "#src/lib/db/dexie";
import { apiClient } from "#src/services/apiClient";
import type {
	DrillHoleDataAggregate,
	SectionKey,
	RowVersionMap,
	ActionResult,
} from "../types/data-contracts";
import type {
	VwCollar,
	VwDrillPlan,
	AllSamples,
	RigSetup,
	CollarCoordinate,
	GeologyCombinedLog,
} from "#src/api/database/data-contracts";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * API response structure for drill hole data
 * Based on existing UiDrillHole but adapted for drill-hole-data views
 */
interface DrillHoleDataResponse {
	DrillHoleId: string;
	vwCollar: VwCollar;
	vwDrillPlan: VwDrillPlan;
	rigSetup: RigSetup | null;
	collarCoordinate: CollarCoordinate | null;
	geologyCombinedLog: GeologyCombinedLog[];
	allSamples: AllSamples[];
	// ... other sections
}

/**
 * Save result from API
 */
interface SaveResponse {
	success: boolean;
	message: string;
	errors?: string[];
	updatedData?: any;
	rv?: string; // Updated rowversion
}

// ============================================================================
// Core Data Loading
// ============================================================================

/**
 * Load complete drill hole data aggregate
 * 
 * Offline-first pattern:
 * 1. Check Dexie cache first (unless forceRefresh)
 * 2. If cache hit and not stale, return cached data
 * 3. If cache miss or forceRefresh, fetch from API
 * 4. Update cache with API response
 * 5. Return data
 * 
 * @param drillPlanId - Drill plan ID (same as CollarId, DrillHoleId)
 * @param forceRefresh - Skip cache and fetch from API
 * @returns Complete drill hole data aggregate
 * 
 * @example
 * const data = await loadDrillHoleData("550e8400-e29b-41d4-a716-446655440000");
 */
export async function loadDrillHoleData(
	drillPlanId: string,
	forceRefresh: boolean = false,
): Promise<DrillHoleDataAggregate> {
	console.log(`📂 [DrillHoleData Service] Loading drill hole data:`, {
		drillPlanId,
		forceRefresh,
		timestamp: new Date().toISOString(),
	});

	const startTime = performance.now();

	try {
		// Step 1: Always try API first (source of truth)
		console.log(`🌐 [DrillHoleData Service] Fetching from API (source of truth)...`);
		
		try {
			const apiData = await fetchDrillHoleDataFromApi(drillPlanId);

			// Step 2: Transform API response to aggregate
			const aggregate = transformApiToAggregate(apiData);

			// Step 3: Update Dexie cache for offline use
			await saveDrillHoleDataToCache(aggregate);

			console.log(`✅ [DrillHoleData Service] Loaded from API and cached:`, {
				drillPlanId,
				duration: `${(performance.now() - startTime).toFixed(0)}ms`,
				sections: Object.keys(aggregate).filter(k =>
					!['drillPlanId', 'loadedAt', 'modifiedAt', 'staleSections', 'sectionVersions', 'rowVersions'].includes(k)
				),
			});

			return aggregate;
		} catch (apiError) {
			// Step 4: Fallback to cache only if API fails
			console.warn(`⚠️ [DrillHoleData Service] API failed, trying cache fallback:`, {
				drillPlanId,
				error: apiError instanceof Error ? apiError.message : 'Unknown error',
			});
			
			const cached = await getDrillHoleDataFromCache(drillPlanId);
			if (cached) {
				const cacheAge = Date.now() - cached.loadedAt.getTime();
				const cacheAgeMinutes = Math.floor(cacheAge / 60000);
				
				console.log(`✅ [DrillHoleData Service] Loaded from Dexie cache (offline mode):`, {
					drillPlanId,
					cacheAge: `${cacheAgeMinutes}m`,
					duration: `${(performance.now() - startTime).toFixed(0)}ms`,
				});
				
				return cached;
			}
			
			// No cache available, re-throw API error
			throw apiError;
		}
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] Failed to load drill hole data:`, {
			drillPlanId,
			error,
		});
		throw error;
	}
}

/**
 * Fetch drill hole data from API
 * 
 * @param drillPlanId - Drill plan ID
 * @returns API response with drill hole data
 */
async function fetchDrillHoleDataFromApi(drillPlanId: string): Promise<DrillHoleDataResponse> {
	console.log(`🌐 [DrillHoleData Service] API: Fetching drill hole:`, drillPlanId);

	try {
		// Use existing API endpoint (similar to drillholeService.ts)
		console.log(`🌐 [DrillHoleData Service] API: Calling apiClient.uiDrillHoleControllerFindOne(${drillPlanId})`);
		const response = await apiClient.uiDrillHoleControllerFindOne(drillPlanId);
		
		console.log(`🌐 [DrillHoleData Service] API: Response received:`, {
			status: response.status,
			hasData: !!response.data,
			dataKeys: response.data ? Object.keys(response.data) : [],
		});
		
		// Transform to drill-hole-data response structure
		// Note: This assumes API returns UiDrillHole, we extract what we need
		const data = response.data as any;
		
		// DIAGNOSTIC: Log all available keys to identify field names
		console.log(`🔍 [DrillHoleData Service] API: Full response structure:`, {
			allKeys: Object.keys(data),
			totalKeys: Object.keys(data).length,
		});
		
		// DIAGNOSTIC: Check both PascalCase and camelCase variants
		console.log(`🔍 [DrillHoleData Service] API: Field name inspection:`, {
			rigSetup: {
				PascalCase: data.RigSetup,
				camelCase: data.rigSetup,
				hasPascalCase: 'RigSetup' in data,
				hasCamelCase: 'rigSetup' in data,
				value: data.RigSetup || data.rigSetup,
			},
			collarCoordinate: {
				PascalCase: data.CollarCoordinate,
				camelCase: data.collarCoordinate,
				hasPascalCase: 'CollarCoordinate' in data,
				hasCamelCase: 'collarCoordinate' in data,
				value: data.CollarCoordinate || data.collarCoordinate,
			},
		});
		
		console.log(`🌐 [DrillHoleData Service] API: Extracting data fields:`, {
			DrillHoleId: data.DrillHoleId,
			hasVwCollar: !!data.vwCollar,
			hasVwDrillPlan: !!data.vwDrillPlan,
			hasRigSetup: !!(data.RigSetup || data.rigSetup),
			hasCollarCoordinate: !!(data.CollarCoordinate || data.collarCoordinate),
			geologyCombinedLogCount: (data.GeologyCombinedLog || []).length,
			allSamplesCount: (data.Sample || []).length,
		});
		
		const result = {
			DrillHoleId: data.DrillHoleId,
			vwCollar: data.vwCollar || extractVwCollar(data),
			vwDrillPlan: data.vwDrillPlan || extractVwDrillPlan(data),
			rigSetup: data.RigSetup || data.rigSetup || null,
			collarCoordinate: data.CollarCoordinate || data.collarCoordinate || null,
			geologyCombinedLog: data.GeologyCombinedLog || [],
			allSamples: data.Sample || [],
		};
		
		console.log(`🌐 [DrillHoleData Service] API: Transformation complete:`, {
			DrillHoleId: result.DrillHoleId,
			vwCollarId: result.vwCollar?.vwCollarId,
			vwDrillPlanId: result.vwDrillPlan?.vwDrillPlanId,
		});
		
		return result;
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] API: Failed to fetch:`, {
			drillPlanId,
			error,
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
			errorStack: error instanceof Error ? error.stack : undefined,
		});
		throw new Error(`Failed to fetch drill hole data: ${error instanceof Error ? error.message : 'Unknown error'}`);
	}
}

/**
 * Extract VwCollar from UiDrillHole response
 * Temporary until API provides VwCollar directly
 */
function extractVwCollar(data: any): VwCollar {
	const collar = data.Collar || {};
	return {
		...collar,
		vwCollarId: collar.CollarId || data.DrillHoleId,
		DrillHoleId: data.DrillHoleId,
	} as VwCollar;
}

/**
 * Extract VwDrillPlan from UiDrillHole response
 * Temporary until API provides VwDrillPlan directly
 */
function extractVwDrillPlan(data: any): VwDrillPlan {
	const drillPlan = data.DrillPlan || {};
	return {
		...drillPlan,
		vwDrillPlanId: drillPlan.DrillPlanId || data.DrillHoleId,
		DrillHoleId: data.DrillHoleId,
	} as VwDrillPlan;
}

/**
 * Transform API response to DrillHoleDataAggregate
 * 
 * @param apiData - API response
 * @returns Drill hole data aggregate
 */
function transformApiToAggregate(apiData: DrillHoleDataResponse): DrillHoleDataAggregate {
	const now = new Date();
	
	console.log(`🔄 [DrillHoleData Service] Transforming API data to aggregate:`, {
		drillPlanId: apiData.DrillHoleId,
		vwCollarId: apiData.vwCollar?.vwCollarId,
		vwDrillPlanId: apiData.vwDrillPlan?.vwDrillPlanId,
	});
	
	const aggregate = {
		drillPlanId: apiData.DrillHoleId,
		
		// Core data
		vwCollar: apiData.vwCollar,
		vwDrillPlan: apiData.vwDrillPlan,
		
		// Sections
		rigSetup: apiData.rigSetup,
		collarCoordinate: apiData.collarCoordinate,
		geologyCombinedLog: apiData.geologyCombinedLog,
		shearLog: [],
		structureLog: [],
		coreRecoveryRunLog: [],
		fractureCountLog: [],
		magSusLog: [],
		rockMechanicLog: [],
		rockQualityDesignationLog: [],
		specificGravityPtLog: [],
		allSamples: apiData.allSamples,
		
		// Metadata
		loadedAt: now,
		modifiedAt: now,
		staleSections: [],
		sectionVersions: extractSectionVersions(apiData),
		rowVersions: extractRowVersions(apiData),
	};
	
	console.log(`🔄 [DrillHoleData Service] Aggregate transformation complete:`, {
		drillPlanId: aggregate.drillPlanId,
		hasVwCollar: !!aggregate.vwCollar,
		hasVwDrillPlan: !!aggregate.vwDrillPlan,
		hasRigSetup: !!aggregate.rigSetup,
		hasCollarCoordinate: !!aggregate.collarCoordinate,
		geologyCombinedLogCount: aggregate.geologyCombinedLog.length,
		allSamplesCount: aggregate.allSamples.length,
	});
	
	return aggregate;
}

/**
 * Extract section-level rowversions from API data
 */
function extractSectionVersions(apiData: DrillHoleDataResponse): Record<string, string> {
	return {
		rigSetup: apiData.rigSetup?.rv || "",
		collarCoordinate: apiData.collarCoordinate?.rv || "",
		vwCollar: apiData.vwCollar?.rv || "",
		vwDrillPlan: apiData.vwDrillPlan?.rv || "",
	};
}

/**
 * Extract row-level rowversions from API data
 */
function extractRowVersions(apiData: DrillHoleDataResponse): Record<SectionKey, RowVersionMap> {
	return {
		geologyCombinedLog: createRowVersionMap(apiData.geologyCombinedLog, "GeologyCombinedLogId"),
		allSamples: createRowVersionMap(apiData.allSamples, "SampleId"),
		shearLog: {},
		structureLog: {},
		coreRecoveryRunLog: {},
		fractureCountLog: {},
		magSusLog: {},
		rockMechanicLog: {},
		rockQualityDesignationLog: {},
		specificGravityPtLog: {},
	} as any;
}

/**
 * Create row version map from array
 */
function createRowVersionMap<T extends { rv?: string }>(
	rows: T[],
	idField: keyof T,
): RowVersionMap {
	return Object.fromEntries(
		rows
			.filter(row => row[idField])
			.map(row => [String(row[idField]), row.rv || ""])
	);
}

// ============================================================================
// Dexie Cache Operations
// ============================================================================

/**
 * Get drill hole data from Dexie cache
 * 
 * @param drillPlanId - Drill plan ID
 * @returns Cached aggregate or null if not found
 */
async function getDrillHoleDataFromCache(
	drillPlanId: string,
): Promise<DrillHoleDataAggregate | null> {
	try {
		console.log(`💾 [DrillHoleData Service] Cache: Attempting to get from Dexie:`, drillPlanId);
		
		// Using drillHoleAggregates table from existing Dexie schema
		// Assuming we extend it to support drill-hole-data or use same structure
		const cached = await db.drillHoleAggregates.get(drillPlanId);
		
		if (!cached) {
			console.log(`🔍 [DrillHoleData Service] Cache miss:`, drillPlanId);
			return null;
		}
		
		console.log(`💾 [DrillHoleData Service] Cache hit:`, {
			drillPlanId,
			hasData: !!cached.data,
			dataKeys: cached.data ? Object.keys(cached.data) : [],
		});
		
		// DIAGNOSTIC: Check field names in cached data
		console.log(`🔍 [DrillHoleData Service] Cache: Field name inspection:`, {
			rigSetup: {
				PascalCase: (cached.data as any).RigSetup,
				camelCase: (cached.data as any).rigSetup,
				hasPascalCase: 'RigSetup' in (cached.data || {}),
				hasCamelCase: 'rigSetup' in (cached.data || {}),
				value: (cached.data as any).RigSetup || (cached.data as any).rigSetup,
			},
			collarCoordinate: {
				PascalCase: (cached.data as any).CollarCoordinate,
				camelCase: (cached.data as any).collarCoordinate,
				hasPascalCase: 'CollarCoordinate' in (cached.data || {}),
				hasCamelCase: 'collarCoordinate' in (cached.data || {}),
				value: (cached.data as any).CollarCoordinate || (cached.data as any).collarCoordinate,
			},
		});
		
		// Transform stored format to DrillHoleDataAggregate
		const result = {
			drillPlanId: cached.drillPlanId,
			vwCollar: (cached.data as any).vwCollar,
			vwDrillPlan: (cached.data as any).vwDrillPlan,
			rigSetup: (cached.data as any).RigSetup || (cached.data as any).rigSetup || null,
			collarCoordinate: (cached.data as any).CollarCoordinate || (cached.data as any).collarCoordinate || null,
			geologyCombinedLog: (cached.data as any).GeologyCombinedLog || [],
			shearLog: [],
			structureLog: [],
			coreRecoveryRunLog: [],
			fractureCountLog: [],
			magSusLog: [],
			rockMechanicLog: [],
			rockQualityDesignationLog: [],
			specificGravityPtLog: [],
			allSamples: (cached.data as any).Sample || [],
			loadedAt: cached.modifiedAt || new Date(),
			modifiedAt: cached.modifiedAt || new Date(),
			staleSections: (cached.staleSections || []) as SectionKey[],
			sectionVersions: cached.sectionVersions || {},
			rowVersions: cached.rowVersions || {} as any,
		};
		
		console.log(`💾 [DrillHoleData Service] Cache: Transformation complete:`, {
			drillPlanId: result.drillPlanId,
			hasVwCollar: !!result.vwCollar,
			hasVwDrillPlan: !!result.vwDrillPlan,
			hasRigSetup: !!result.rigSetup,
			hasCollarCoordinate: !!result.collarCoordinate,
			rigSetupValue: result.rigSetup,
			collarCoordinateValue: result.collarCoordinate,
			geologyCombinedLogCount: result.geologyCombinedLog.length,
			allSamplesCount: result.allSamples.length,
		});
		
		return result;
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] Failed to get from cache:`, {
			drillPlanId,
			error,
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
		});
		return null;
	}
}

/**
 * Save drill hole data to Dexie cache
 * 
 * @param aggregate - Drill hole data aggregate
 */
async function saveDrillHoleDataToCache(aggregate: DrillHoleDataAggregate): Promise<void> {
	try {
		console.log(`💾 [DrillHoleData Service] Saving to Dexie cache:`, {
			drillPlanId: aggregate.drillPlanId,
			hasVwCollar: !!aggregate.vwCollar,
			hasVwDrillPlan: !!aggregate.vwDrillPlan,
			geologyCombinedLogCount: aggregate.geologyCombinedLog.length,
			allSamplesCount: aggregate.allSamples.length,
		});
		
		// Store in drillHoleAggregates table
		const cacheEntry = {
			drillPlanId: aggregate.drillPlanId,
			data: aggregate as any, // Store full aggregate
			modifiedAt: aggregate.modifiedAt,
			staleSections: aggregate.staleSections,
			sectionVersions: aggregate.sectionVersions,
			rowVersions: aggregate.rowVersions,
		};
		
		console.log(`💾 [DrillHoleData Service] Cache: Calling db.drillHoleAggregates.put()...`);
		await db.drillHoleAggregates.put(cacheEntry);
		
		console.log(`✅ [DrillHoleData Service] Saved to cache successfully:`, {
			drillPlanId: aggregate.drillPlanId,
		});
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] Failed to save to cache:`, {
			drillPlanId: aggregate.drillPlanId,
			error,
			errorMessage: error instanceof Error ? error.message : 'Unknown error',
		});
		// Don't throw - cache failure shouldn't break data loading
	}
}

// ============================================================================
// Section Save Operations
// ============================================================================

/**
 * Save section data (single-object sections like RigSetup)
 * 
 * Pattern:
 * 1. Save to Dexie immediately (offline-first)
 * 2. Queue for background API sync
 * 3. Return success result
 * 
 * @param drillPlanId - Drill plan ID
 * @param sectionKey - Section identifier
 * @param data - Section data to save
 * @returns Save result
 * 
 * @example
 * const result = await saveSectionData(drillPlanId, "rigSetup", rigSetupData);
 */
export async function saveSectionData(
	drillPlanId: string,
	sectionKey: SectionKey,
	data: any,
): Promise<ActionResult> {
	console.log(`💾 [DrillHoleData Service] Saving section:`, {
		drillPlanId,
		sectionKey,
		timestamp: new Date().toISOString(),
	});

	try {
		// Step 1: Update Dexie cache immediately
		const cached = await getDrillHoleDataFromCache(drillPlanId);
		if (cached) {
			cached[sectionKey as keyof DrillHoleDataAggregate] = data;
			cached.modifiedAt = new Date();
			await saveDrillHoleDataToCache(cached);
		}

		// Step 2: Queue for background API sync
		await queueSectionSync(drillPlanId, sectionKey, data, "update");

		console.log(`✅ [DrillHoleData Service] Section saved:`, {
			drillPlanId,
			sectionKey,
		});

		return {
			success: true,
			message: "Saved successfully",
		};
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] Failed to save section:`, {
			drillPlanId,
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
 * Save row data (array sections like GeologyCombinedLog)
 * 
 * @param drillPlanId - Drill plan ID
 * @param sectionKey - Section identifier
 * @param rowId - Row identifier
 * @param rowData - Row data to save
 * @returns Save result
 */
export async function saveRowData(
	drillPlanId: string,
	sectionKey: SectionKey,
	rowId: string,
	rowData: any,
): Promise<ActionResult> {
	console.log(`💾 [DrillHoleData Service] Saving row:`, {
		drillPlanId,
		sectionKey,
		rowId,
		timestamp: new Date().toISOString(),
	});

	try {
		// Update cache
		const cached = await getDrillHoleDataFromCache(drillPlanId);
		if (cached) {
			const sectionData = cached[sectionKey as keyof DrillHoleDataAggregate] as any[];
			if (Array.isArray(sectionData)) {
				const index = sectionData.findIndex((row: any) => {
					const idField = getRowIdField(sectionKey);
					return row[idField] === rowId;
				});
				
				if (index >= 0) {
					sectionData[index] = { ...sectionData[index], ...rowData };
				} else {
					sectionData.push(rowData);
				}
				
				cached.modifiedAt = new Date();
				await saveDrillHoleDataToCache(cached);
			}
		}

		// Queue for sync
		await queueSectionSync(drillPlanId, sectionKey, rowData, "update");

		return {
			success: true,
			message: "Row saved successfully",
		};
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] Failed to save row:`, {
			drillPlanId,
			sectionKey,
			rowId,
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
 * Get row ID field name for section
 */
function getRowIdField(sectionKey: SectionKey): string {
	const fieldMap: Record<string, string> = {
		geologyCombinedLog: "GeologyCombinedLogId",
		allSamples: "SampleId",
		shearLog: "ShearLogId",
		structureLog: "StructureLogId",
		// ... add more as needed
	};
	
	return fieldMap[sectionKey] || "Id";
}

/**
 * Queue section/row for background API sync
 * 
 * @param drillPlanId - Drill plan ID
 * @param sectionKey - Section identifier
 * @param data - Data to sync
 * @param operation - Operation type
 */
async function queueSectionSync(
	drillPlanId: string,
	sectionKey: string,
	data: any,
	operation: "create" | "update" | "delete",
): Promise<void> {
	try {
		console.log(`⏱️ [DrillHoleData Service] Queuing for sync:`, {
			drillPlanId,
			sectionKey,
			operation,
		});

		// Add to sync queue (using existing Dexie syncQueue table)
		await db.syncQueue.add({
			id: crypto.randomUUID() as any,
			entityType: "drillhole",
			entityId: drillPlanId,
			operation,
			data: { sectionKey, data },
			timestamp: new Date(),
			retryCount: 0,
			maxRetries: 5,
			nextRetryAt: new Date(),
		});

		console.log(`✅ [DrillHoleData Service] Queued for sync successfully`);
	} catch (error) {
		console.error(`❌ [DrillHoleData Service] Failed to queue sync:`, {
			drillPlanId,
			sectionKey,
			error,
		});
		// Don't throw - queue failure shouldn't break save
	}
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Check if drill hole data exists in cache
 * 
 * @param drillPlanId - Drill plan ID
 * @returns True if exists in cache
 */
export async function drillHoleDataExistsInCache(drillPlanId: string): Promise<boolean> {
	const cached = await getDrillHoleDataFromCache(drillPlanId);
	return cached !== null;
}

/**
 * Clear drill hole data from cache
 * 
 * @param drillPlanId - Drill plan ID
 */
export async function clearDrillHoleDataCache(drillPlanId: string): Promise<void> {
	console.log(`🧹 [DrillHoleData Service] Clearing cache:`, drillPlanId);
	await db.drillHoleAggregates.delete(drillPlanId);
}

/**
 * Get cache age in minutes
 * 
 * @param drillPlanId - Drill plan ID
 * @returns Cache age in minutes, or null if not cached
 */
export async function getCacheAge(drillPlanId: string): Promise<number | null> {
	const cached = await getDrillHoleDataFromCache(drillPlanId);
	if (!cached) return null;
	
	const ageMs = Date.now() - cached.loadedAt.getTime();
	return Math.floor(ageMs / 60000);
}
