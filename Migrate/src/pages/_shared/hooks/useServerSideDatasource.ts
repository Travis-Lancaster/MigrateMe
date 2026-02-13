/**
 * useServerSideDatasource Hook
 *
 * Creates a hybrid server-side datasource for AG Grid Enterprise SSRM
 * with graceful fallback to local data when server is unavailable.
 *
 * Features:
 * - Server-first data fetching
 * - Automatic fallback to local cache on error
 * - External filter integration (search bar, status chips)
 * - Type-safe with TypeScript generics
 * - Reusable across multiple list views
 */

import type {
	IServerSideDatasource,
	IServerSideGetRowsParams,
	SSRMDatasourceConfig,
	SSRMRequestWithExternal,
} from "../types/ssrm-types";
import { message } from "antd";
import { useCallback } from "react";

/**
 * External filters passed from UI components
 */
interface ExternalFilters {
	/** Search text from search bar */
	searchText?: string
	/** Active status filters from chips */
	statusFilters?: string[]
}

/**
 * Creates a server-side datasource with local fallback
 *
 * @param config - Datasource configuration
 * @param externalFilters - External UI filters (search, status chips)
 * @returns Function to create IServerSideDatasource
 *
 * @example
 * ```typescript
 * const createDatasource = useServerSideDatasource({
 *   fetchData: fetchDrillPlansSSRM,
 *   fallbackFetch: fetchAllDrillPlansLocal,
 *   onError: (error) => message.error(error.message),
 * }, {
 *   searchText: searchQuery,
 *   statusFilters: [activeFilter],
 * });
 *
 * // In onGridReady
 * const datasource = createDatasource();
 * params.api.setServerSideDatasource(datasource);
 * ```
 */
export function useServerSideDatasource<T>(
	config: SSRMDatasourceConfig<T>,
	externalFilters: ExternalFilters,
) {
	const createDatasource = useCallback((): IServerSideDatasource => {
		return {
			getRows: async (params: IServerSideGetRowsParams) => {
				console.log("[SSRM] Requesting rows:", {
					startRow: params.request.startRow,
					endRow: params.request.endRow,
					sortModel: params.request.sortModel,
					filterModel: params.request.filterModel,
					externalFilters,
				});

				try {
					// Build request payload
					const requestPayload: SSRMRequestWithExternal = {
						startRow: params.request.startRow || 0,
						endRow: params.request.endRow || 100,
						sortModel: params.request.sortModel || [],
						filterModel: params.request.filterModel || {},
						quickFilterText: externalFilters.searchText,
						statusFilters: externalFilters.statusFilters?.filter(Boolean),
					};

					// Attempt server fetch
					const response = await config.fetchData(requestPayload);

					console.log("[SSRM] Server response:", {
						rowCount: response.data.length,
						totalCount: response.totalCount,
						page: response.page,
						take: response.take,
					});

					// Success: Return server data with total count
					params.success({
						rowData: response.data,
						rowCount: response.totalCount,
					});
				}
				catch (error) {
					console.error("[SSRM] Server fetch failed:", error);

					// Attempt fallback to local data
					if (config.fallbackFetch) {
						try {
							console.warn("[SSRM] Attempting local fallback...");
							const localData = await config.fallbackFetch();

							console.warn("[SSRM] Using local fallback data:", {
								rowCount: localData.length,
							});

							// Show warning to user
							message.warning({
								content: "Operating in Offline Mode - Using cached data",
								duration: 5,
								key: "offline-mode",
							});

							// Return all local data (client-side operations)
							params.success({
								rowData: localData,
								rowCount: localData.length,
							});
						}
						catch (fallbackError) {
							console.error("[SSRM] Fallback also failed:", fallbackError);

							// Call error handler
							if (config.onError) {
								config.onError(fallbackError as Error);
							}

							// Notify grid of failure
							params.fail();
						}
					}
					else {
						// No fallback configured
						console.error("[SSRM] No fallback configured, failing request");

						// Call error handler
						if (config.onError) {
							config.onError(error as Error);
						}

						// Notify grid of failure
						params.fail();
					}
				}
			},
		};
	}, [config, externalFilters]);

	return createDatasource;
}
