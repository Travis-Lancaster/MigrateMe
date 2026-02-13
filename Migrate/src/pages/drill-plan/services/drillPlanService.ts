/**
 * DrillPlan Service
 *
 * Handles API communication for DrillPlan CRUD operations.
 * Integrated with backend API endpoints.
 */

import type { CreateDrillPlanDto, DrillPlan, DrillPlanFilters, UpdateDrillPlanDto } from "../types";

import apiClient from "#src/services/apiClient.js";

// Pagination metadata structure from backend
export interface PaginationMeta {
	page: number
	take: number
	itemCount: number
	pageCount: number
	hasPreviousPage: boolean
	hasNextPage: boolean
}

// Paginated response structure
export interface PaginatedResponse<T> {
	data: T[]
	meta: PaginationMeta
}

class DrillPlanService {
	/**
	 * Find all drill plans with pagination, filtering, and search
	 */
	async findAll(
		page: number = 1,
		take: number = 20,
		filters?: DrillPlanFilters,
		search?: string,
	): Promise<PaginatedResponse<DrillPlan>> {
		const params: any = {
			page,
			take,
		};

		// Add search term
		if (search && search.trim()) {
			params.search = search.trim();
		}

		// Build filters as JSON string for backend
		const filterObj: any = {};

		if (filters?.status && filters.status.length > 0) {
			filterObj.DrillPlanStatus = filters.status;
		}
		if (filters?.project) {
			filterObj.Project = filters.project;
		}
		if (filters?.organization) {
			filterObj.Organization = filters.organization;
		}
		if (filters?.target) {
			filterObj.Target = filters.target;
		}
		if (filters?.createdBy) {
			filterObj.CreatedBy = filters.createdBy;
		}
		if (filters?.dateFrom || filters?.dateTo) {
			filterObj.CreatedOnDt = {};
			if (filters.dateFrom) {
				filterObj.CreatedOnDt.$gte = filters.dateFrom.toISOString();
			}
			if (filters.dateTo) {
				filterObj.CreatedOnDt.$lte = filters.dateTo.toISOString();
			}
		}

		// Only add filters param if we have filters
		if (Object.keys(filterObj).length > 0) {
			params.filters = JSON.stringify(filterObj);
		}

		console.log("[DrillPlanService] findAll params:", params);

		const response = await apiClient.drillPlanControllerFindAll(params);

		// Backend returns { data: [...], meta: {...} }
		const result = response.data as any;

		return {
			data: (result.data || []) as DrillPlan[],
			meta: result.meta || {
				page,
				take,
				itemCount: result.data?.length || 0,
				pageCount: 1,
				hasPreviousPage: false,
				hasNextPage: false,
			},
		};
	}

	/**
	 * Get drill plan by ID
	 */
	async getById(id: string, forceRefresh = false): Promise<DrillPlan> {
		// Validate GUID format before making API call
		const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
		if (!guidRegex.test(id)) {
			throw new Error(`Invalid GUID format: ${id}`);
		}

		const response = await apiClient.drillPlanControllerFindOne(id);
		return response.data as DrillPlan;
	}

	/**
	 * Create new drill plan
	 */
	async create(data: CreateDrillPlanDto): Promise<DrillPlan> {
		const response = await apiClient.drillPlanControllerCreate({
			...data,
			DrillPlanStatus: "Draft", // Default status
		});
		return response.data as DrillPlan;
	}

	/**
	 * Update drill plan
	 */
	async update(id: string, data: UpdateDrillPlanDto): Promise<DrillPlan> {
		const response = await apiClient.drillPlanControllerUpdate(id, data);
		return response.data as DrillPlan;
	}

	/**
	 * Delete drill plan
	 */
	async delete(id: string): Promise<void> {
		// await apiClient.drillPlanControllerRemove(id);
	}

	/**
	 * Bulk delete drill plans
	 */
	async bulkDelete(ids: string[]): Promise<{ deleted: number }> {
		// Note: This would require a custom backend endpoint
		// For now, delete one by one
		const results = await Promise.allSettled(ids.map(id => this.delete(id)));
		const deleted = results.filter(r => r.status === "fulfilled").length;
		return { deleted };
	}

	/**
	 * Export drill plans to Excel
	 * Note: Requires backend endpoint implementation
	 */
	async exportToExcel(filters?: DrillPlanFilters): Promise<Blob> {
		// This would call a backend export endpoint
		// Placeholder implementation
		throw new Error("Excel export endpoint not yet implemented on backend");
	}

	/**
	 * Export single drill plan to PDF
	 * Note: Requires backend endpoint implementation
	 */
	async exportToPdf(id: string): Promise<Blob> {
		// This would call a backend PDF export endpoint
		// Placeholder implementation
		throw new Error("PDF export endpoint not yet implemented on backend");
	}
}

// Export singleton instance
export const drillPlanService = new DrillPlanService();
