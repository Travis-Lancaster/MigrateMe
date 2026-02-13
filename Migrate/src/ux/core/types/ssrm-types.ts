/**
 * Server-Side Row Model (SSRM) Type Definitions
 *
 * TypeScript interfaces for AG Grid Enterprise SSRM implementation
 * Used by DrillPlanListView and DrillHoleListView
 */

import type { IServerSideDatasource, IServerSideGetRowsParams } from "ag-grid-enterprise";

/**
 * SSRM request payload matching AG Grid's IServerSideGetRowsRequest
 */
export interface SSRMRequest {
	/** Starting row index for pagination (0-based) */
	startRow: number
	/** Ending row index for pagination (exclusive) */
	endRow: number
	/** Column sorting configuration */
	sortModel: {
		colId: string
		sort: "asc" | "desc"
	}[]
	/** Column filtering configuration */
	filterModel: Record<string, any>
}

/**
 * Extended request including external UI state
 * (search bar, status chips, etc.)
 */
export interface SSRMRequestWithExternal extends SSRMRequest {
	/** Quick search text from global search bar */
	quickFilterText?: string
	/** Status filters from status chips */
	statusFilters?: string[]
}

/**
 * Paginated server response format
 */
export interface SSRMResponse<T> {
	/** Array of data items for current page */
	data: T[]
	/** Total count of all items (across all pages) */
	totalCount: number
	/** Current page number */
	page: number
	/** Items per page */
	take: number
}

/**
 * Configuration for creating SSRM datasource
 */
export interface SSRMDatasourceConfig<T> {
	/** Function to fetch data from server */
	fetchData: (request: SSRMRequestWithExternal) => Promise<SSRMResponse<T>>
	/** Optional fallback function to fetch all data locally (offline mode) */
	fallbackFetch?: () => Promise<T[]>
	/** Optional error handler callback */
	onError?: (error: Error) => void
	/** Optional cache block size (default: 100) */
	cacheBlockSize?: number
}

/**
 * Re-export AG Grid types for convenience
 */
export type { IServerSideDatasource, IServerSideGetRowsParams };
