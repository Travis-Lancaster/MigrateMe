/**
 * DrillProgram Service
 *
 * Handles API communication for DrillProgram CRUD operations.
 * Integrated with backend API endpoints.
 */

import type {
	CreateDrillProgramDto,
	DrillProgram,
	DrillProgramFilters,
	UpdateDrillProgramDto,
} from "../types";

import apiClient from "#src/services/apiClient.js";

// Pagination metadata structure from backend (consistent with drill-plan)
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

class DrillProgramService {
	private readonly basePath = "/api/v1/drill-program";

	/**
	 * Find all drill programs with pagination, filtering, and search
	 */
	async findAll(
		page: number = 1,
		take: number = 20,
		filters?: DrillProgramFilters,
		search?: string,
	): Promise<PaginatedResponse<DrillProgram>> {
		const query: any = {
			page,
			take,
		};

		// Add search term
		if (search && search.trim()) {
			query.search = search.trim();
		}

		// Build filters as JSON string for backend
		const filterObj: any = {};

		if (filters?.status) {
			filterObj.Status = Array.isArray(filters.status) ? filters.status : [filters.status];
		}
		if (filters?.organization) {
			filterObj.Organization = filters.organization;
		}
		if (filters?.project) {
			filterObj.Project = filters.project;
		}
		if (filters?.contractor) {
			filterObj.Contractor = filters.contractor;
		}
		if (filters?.programType) {
			filterObj.ProgramType = filters.programType;
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
			query.filters = JSON.stringify(filterObj);
		}

		console.log("[DrillProgramService] findAll with query:", query);

		const response = await apiClient.drillProgramControllerFindAll(query);
		const programs = response.data?.data || [];

		console.log("[DrillProgramService] findAll response:", {
			count: programs.length,
		});

		// Calculate pagination metadata since API doesn't return it
		const itemCount = programs.length;
		const pageCount = Math.ceil(itemCount / take);

		return {
			data: programs,
			meta: {
				page,
				take,
				itemCount,
				pageCount,
				hasPreviousPage: page > 1,
				hasNextPage: page < pageCount,
			},
		};
	}

	/**
	 * Find a single drill program by ID
	 */
	async findOne(id: string): Promise<DrillProgram> {
		console.log("[DrillProgramService] findOne:", id);
		const response = await apiClient.drillProgramControllerFindOne(id);
		return response.data!;
	}

	/**
	 * Create a new drill program
	 */
	async create(data: CreateDrillProgramDto): Promise<DrillProgram> {
		console.log("[DrillProgramService] create:", data);
		const response = await apiClient.drillProgramControllerCreate(data);
		return response.data!;
	}

	/**
	 * Update an existing drill program
	 */
	async update(id: string, data: UpdateDrillProgramDto): Promise<DrillProgram> {
		console.log("[DrillProgramService] update:", id, data);
		const response = await apiClient.drillProgramControllerUpdate(id, data);
		return response.data!;
	}

	/**
	 * Delete a drill program
	 */
	async remove(id: string): Promise<void> {
		console.log("[DrillProgramService] remove:", id);
		await apiClient.drillProgramControllerRemove(id);
	}

	/**
	 * Get drill patterns for a program
	 * Note: This requires backend endpoint implementation
	 */
	async getPatterns(programId: string): Promise<any[]> {
		console.log("[DrillProgramService] getPatterns for program:", programId);
		// TODO: Implement backend endpoint for patterns
		return [];
	}

	/**
	 * Export drill programs to Excel
	 * Note: Requires backend endpoint implementation
	 */
	// async exportToExcel(filters?: DrillProgramFilters): Promise<Blob> {
	//   const params: any = {};

	//   if (filters) {
	//     params.filters = JSON.stringify(filters);
	//   }

	//   return apiClient
	//     .get(`${this.basePath}/export/excel`, { searchParams: params })
	//     .blob();
	// }

	// /**
	//  * Export single drill program to PDF
	//  * Note: Requires backend endpoint implementation
	//  */
	// async exportToPDF(id: string): Promise<Blob> {
	//   return apiClient
	//     .get(`${this.basePath}/${id}/export/pdf`)
	//     .blob();
	// }
}

export const drillProgramService = new DrillProgramService();
