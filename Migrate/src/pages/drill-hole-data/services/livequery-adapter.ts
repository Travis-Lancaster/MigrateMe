/**
 * LiveQuery Adapter for Drill-Hole-Data
 * 
 * Provides real-time data synchronization using Dexie LiveQuery.
 * Automatically updates store when data changes in IndexedDB.
 * 
 * USAGE:
 * ```typescript
 * // Subscribe to drill hole changes
 * const unsubscribe = subscribeToDrillHole(drillPlanId, (data) => {
 *   store.setState({ data });
 * });
 * 
 * // Cleanup on unmount
 * useEffect(() => unsubscribe, []);
 * ```
 * 
 * @module drill-hole-data/services
 */

import { liveQuery } from "dexie";
import { db } from "#src/lib/db/dexie";
import type { Subscription } from "dexie";
import type { DrillHoleDataAggregate, SectionKey } from "../types/data-contracts";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Callback for data updates
 */
type DataUpdateCallback<T> = (data: T | null) => void;

/**
 * Subscription cleanup function
 */
type UnsubscribeFunction = () => void;

// ============================================================================
// Drill Hole LiveQuery
// ============================================================================

/**
 * Subscribe to drill hole data changes
 * 
 * Uses Dexie liveQuery to automatically detect IndexedDB changes
 * and notify subscribers in real-time.
 * 
 * @param drillPlanId - Drill plan ID
 * @param onUpdate - Callback when data changes
 * @returns Unsubscribe function
 * 
 * @example
 * const unsubscribe = subscribeToDrillHole(drillPlanId, (data) => {
 *   if (data) {
 *     console.log("Data updated:", data);
 *     store.setState({ drillHoleData: data });
 *   }
 * });
 * 
 * // Cleanup
 * return () => unsubscribe();
 */
export function subscribeToDrillHole(
	drillPlanId: string,
	onUpdate: DataUpdateCallback<DrillHoleDataAggregate>,
): UnsubscribeFunction {
	console.log(`🔄 [LiveQuery] Subscribing to drill hole:`, drillPlanId);

	let subscription: Subscription | null = null;

	try {
		// Create liveQuery observable
		const observable = liveQuery(async () => {
			console.log(`🔍 [LiveQuery] Querying drill hole:`, drillPlanId);
			
			const cached = await db.drillHoleAggregates.get(drillPlanId);
			if (!cached) {
				console.log(`⚠️ [LiveQuery] No data found for:`, drillPlanId);
				return null;
			}

			// Transform cached data to DrillHoleDataAggregate
			const data = cached.data as any;
			return {
				drillPlanId: cached.drillPlanId,
				vwCollar: data.vwCollar,
				vwDrillPlan: data.vwDrillPlan,
				rigSetup: data.RigSetup || null,
				collarCoordinate: data.CollarCoordinate || null,
				geologyCombinedLog: data.GeologyCombinedLog || [],
				shearLog: [],
				structureLog: [],
				coreRecoveryRunLog: [],
				fractureCountLog: [],
				magSusLog: [],
				rockMechanicLog: [],
				rockQualityDesignationLog: [],
				specificGravityPtLog: [],
				allSamples: data.Sample || [],
				loadedAt: cached.modifiedAt || new Date(),
				modifiedAt: cached.modifiedAt || new Date(),
				staleSections: cached.staleSections || [],
				sectionVersions: cached.sectionVersions || {},
				rowVersions: cached.rowVersions || {} as any,
			} as DrillHoleDataAggregate;
		});

		// Subscribe to observable
		subscription = observable.subscribe({
			next: (data) => {
				console.log(`✅ [LiveQuery] Data updated:`, {
					drillPlanId,
					hasData: data !== null,
					timestamp: new Date().toISOString(),
				});
				onUpdate(data);
			},
			error: (error) => {
				console.error(`❌ [LiveQuery] Subscription error:`, {
					drillPlanId,
					error,
				});
			},
		});

		console.log(`✅ [LiveQuery] Subscribed successfully:`, drillPlanId);

		// Return unsubscribe function
		return () => {
			console.log(`🔌 [LiveQuery] Unsubscribing:`, drillPlanId);
			if (subscription) {
				subscription.unsubscribe();
				subscription = null;
			}
		};
	} catch (error) {
		console.error(`❌ [LiveQuery] Failed to subscribe:`, {
			drillPlanId,
			error,
		});

		// Return no-op unsubscribe
		return () => {};
	}
}

// ============================================================================
// Section-Specific LiveQuery
// ============================================================================

/**
 * Subscribe to specific section changes
 * 
 * More granular subscription for individual sections.
 * Use when you only care about changes to a specific section.
 * 
 * @param drillPlanId - Drill plan ID
 * @param sectionKey - Section identifier
 * @param onUpdate - Callback when section data changes
 * @returns Unsubscribe function
 * 
 * @example
 * const unsubscribe = subscribeToSection(drillPlanId, "rigSetup", (data) => {
 *   if (data) {
 *     console.log("RigSetup updated:", data);
 *     store.updateSection("rigSetup", data);
 *   }
 * });
 */
export function subscribeToSection<T = any>(
	drillPlanId: string,
	sectionKey: SectionKey,
	onUpdate: DataUpdateCallback<T>,
): UnsubscribeFunction {
	console.log(`🔄 [LiveQuery] Subscribing to section:`, {
		drillPlanId,
		sectionKey,
	});

	let subscription: Subscription | null = null;

	try {
		const observable = liveQuery(async () => {
			const cached = await db.drillHoleAggregates.get(drillPlanId);
			if (!cached) return null;

			const data = cached.data as any;
			
			// Extract section data based on key
			const sectionMap: Record<string, any> = {
				rigSetup: data.RigSetup,
				collarCoordinate: data.CollarCoordinate,
				geologyCombinedLog: data.GeologyCombinedLog,
				allSamples: data.Sample,
				vwCollar: data.vwCollar,
				vwDrillPlan: data.vwDrillPlan,
			};

			return sectionMap[sectionKey] || null;
		});

		subscription = observable.subscribe({
			next: (data) => {
				console.log(`✅ [LiveQuery] Section updated:`, {
					drillPlanId,
					sectionKey,
					hasData: data !== null,
					timestamp: new Date().toISOString(),
				});
				onUpdate(data);
			},
			error: (error) => {
				console.error(`❌ [LiveQuery] Section subscription error:`, {
					drillPlanId,
					sectionKey,
					error,
				});
			},
		});

		return () => {
			console.log(`🔌 [LiveQuery] Unsubscribing section:`, {
				drillPlanId,
				sectionKey,
			});
			if (subscription) {
				subscription.unsubscribe();
				subscription = null;
			}
		};
	} catch (error) {
		console.error(`❌ [LiveQuery] Failed to subscribe to section:`, {
			drillPlanId,
			sectionKey,
			error,
		});

		return () => {};
	}
}

// ============================================================================
// Sync Queue LiveQuery
// ============================================================================

/**
 * Subscribe to sync queue changes
 * 
 * Monitor pending sync operations for the drill hole.
 * Useful for showing sync status indicators.
 * 
 * @param drillPlanId - Drill plan ID
 * @param onUpdate - Callback when sync queue changes
 * @returns Unsubscribe function
 * 
 * @example
 * const unsubscribe = subscribeToSyncQueue(drillPlanId, (pending) => {
 *   console.log("Pending syncs:", pending.length);
 *   setHasPendingSync(pending.length > 0);
 * });
 */
export function subscribeToSyncQueue(
	drillPlanId: string,
	onUpdate: (pendingSyncs: any[]) => void,
): UnsubscribeFunction {
	console.log(`🔄 [LiveQuery] Subscribing to sync queue:`, drillPlanId);

	let subscription: Subscription | null = null;

	try {
		const observable = liveQuery(async () => {
			// Query pending syncs for this drill hole
			const pending = await db.syncQueue
				.where("entityId")
				.equals(drillPlanId)
				.toArray();

			return pending;
		});

		subscription = observable.subscribe({
			next: (pending) => {
				console.log(`✅ [LiveQuery] Sync queue updated:`, {
					drillPlanId,
					pendingCount: pending.length,
					timestamp: new Date().toISOString(),
				});
				onUpdate(pending);
			},
			error: (error) => {
				console.error(`❌ [LiveQuery] Sync queue error:`, {
					drillPlanId,
					error,
				});
			},
		});

		return () => {
			console.log(`🔌 [LiveQuery] Unsubscribing sync queue:`, drillPlanId);
			if (subscription) {
				subscription.unsubscribe();
				subscription = null;
			}
		};
	} catch (error) {
		console.error(`❌ [LiveQuery] Failed to subscribe to sync queue:`, {
			drillPlanId,
			error,
		});

		return () => {};
	}
}

// ============================================================================
// Batch Subscription Management
// ============================================================================

/**
 * Subscribe to multiple sections at once
 * 
 * Convenience function for subscribing to multiple sections.
 * Returns a single unsubscribe function that cleans up all subscriptions.
 * 
 * @param drillPlanId - Drill plan ID
 * @param sections - Array of section keys
 * @param onUpdate - Callback with section key and data
 * @returns Unsubscribe function
 * 
 * @example
 * const unsubscribe = subscribeToSections(
 *   drillPlanId,
 *   ["rigSetup", "geologyCombinedLog"],
 *   (sectionKey, data) => {
 *     store.updateSection(sectionKey, data);
 *   }
 * );
 */
export function subscribeToSections(
	drillPlanId: string,
	sections: SectionKey[],
	onUpdate: (sectionKey: SectionKey, data: any) => void,
): UnsubscribeFunction {
	console.log(`🔄 [LiveQuery] Subscribing to multiple sections:`, {
		drillPlanId,
		sections,
	});

	// Create subscriptions for each section
	const unsubscribers = sections.map(sectionKey =>
		subscribeToSection(drillPlanId, sectionKey, (data) => {
			onUpdate(sectionKey, data);
		})
	);

	// Return combined unsubscribe function
	return () => {
		console.log(`🔌 [LiveQuery] Unsubscribing multiple sections:`, {
			drillPlanId,
			sections,
		});
		unsubscribers.forEach(unsub => unsub());
	};
}

// ============================================================================
// React Hook Integration
// ============================================================================

/**
 * Example React hook for LiveQuery integration
 * 
 * NOTE: This is a reference implementation.
 * Actual React hooks should be in hooks/ folder.
 * 
 * @example
 * function MyComponent() {
 *   const [data, setData] = useState(null);
 *   
 *   useEffect(() => {
 *     const unsubscribe = subscribeToDrillHole(drillPlanId, setData);
 *     return unsubscribe;
 *   }, [drillPlanId]);
 *   
 *   return <div>{data ? "Loaded" : "Loading..."}</div>;
 * }
 */

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if LiveQuery is supported in current browser
 * 
 * @returns True if LiveQuery is supported
 */
export function isLiveQuerySupported(): boolean {
	try {
		// Dexie liveQuery requires modern browser features
		return typeof liveQuery === "function" && typeof Proxy !== "undefined";
	} catch {
		return false;
	}
}

/**
 * Log LiveQuery diagnostics
 * 
 * @param drillPlanId - Drill plan ID
 */
export async function logLiveQueryDiagnostics(drillPlanId: string): Promise<void> {
	console.log(`🔍 [LiveQuery] Diagnostics:`, {
		drillPlanId,
		supported: isLiveQuerySupported(),
		dbOpen: db.isOpen(),
		tables: db.tables.map(t => t.name),
		timestamp: new Date().toISOString(),
	});

	try {
		const cached = await db.drillHoleAggregates.get(drillPlanId);
		console.log(`📊 [LiveQuery] Cache status:`, {
			exists: cached !== null,
			modifiedAt: cached?.modifiedAt,
			staleSections: cached?.staleSections,
		});
	} catch (error) {
		console.error(`❌ [LiveQuery] Diagnostics error:`, error);
	}
}
