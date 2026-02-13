// /**
//  * DrillPattern Service
//  *
//  * Handles API communication for DrillPattern CRUD operations.
//  * Integrated with backend API endpoints.
//  */

// import type {
//   CreateDrillPatternDto,
//   DrillPattern,
//   DrillPatternFilters,
//   UpdateDrillPatternDto,
// } from '../types';
// import type { PaginatedResponse, PaginationMeta } from '#src/pages/drill-program/services/drillProgramService';

// import apiClient from '#src/services/apiClient.js';

// class DrillPatternService {
//   private readonly basePath = '/api/v1/drill-pattern';

//   // /**
//   //  * Find all drill patterns with pagination, filtering, and search
//   //  */
//   // async findAll(
//   //   page: number = 1,
//   //   take: number = 20,
//   //   filters?: DrillPatternFilters,
//   //   search?: string
//   // ): Promise<PaginatedResponse<DrillPattern>> {
//   //   const params: any = {
//   //     page,
//   //     take,
//   //   };

//   //   // Add search term
//   //   if (search && search.trim()) {
//   //     params.search = search.trim();
//   //   }

//   //   // Build filters as JSON string for backend
//   //   const filterObj: any = {};

//   //   if (filters?.drillProgram) {
//   //     filterObj.DrillProgram = Array.isArray(filters.drillProgram)
//   //       ? filters.drillProgram
//   //       : [filters.drillProgram];
//   //   }
//   //   if (filters?.organization) {
//   //     filterObj.Organization = filters.organization;
//   //   }
//   //   if (filters?.target) {
//   //     filterObj.Target = filters.target;
//   //   }
//   //   if (filters?.patternType) {
//   //     filterObj.DrillPatternType = filters.patternType;
//   //   }
//   //   if (filters?.dateFrom || filters?.dateTo) {
//   //     filterObj.CreatedOnDt = {};
//   //     if (filters.dateFrom) {
//   //       filterObj.CreatedOnDt.$gte = filters.dateFrom.toISOString();
//   //     }
//   //     if (filters.dateTo) {
//   //       filterObj.CreatedOnDt.$lte = filters.dateTo.toISOString();
//   //     }
//   //   }

//   //   // Only add filters param if we have filters
//   //   if (Object.keys(filterObj).length > 0) {
//   //     params.filters = JSON.stringify(filterObj);
//   //   }

//   //   console.log('[DrillPatternService] findAll with params:', params);

//   //   const response = await apiClient.drillPatternControllerFindAll(this.basePath, { searchParams: params })

//   //   console.log('[DrillPatternService] findAll response:', {
//   //     count: response.data?.length,
//   //     meta: response.meta,
//   //   });

//   //   return response;
//   // }

//   // /**
//   //  * Find a single drill pattern by ID
//   //  */
//   // async findOne(id: string): Promise<DrillPattern> {
//   //   console.log('[DrillPatternService] findOne:', id);
//   //   return apiClient
//   //     .get(`${this.basePath}/${id}`)
//   //     .json<DrillPattern>();
//   // }

//   // /**
//   //  * Create a new drill pattern
//   //  */
//   // async create(data: CreateDrillPatternDto): Promise<DrillPattern> {
//   //   console.log('[DrillPatternService] create:', data);
//   //   return apiClient
//   //     .post(this.basePath, { json: data })
//   //     .json<DrillPattern>();
//   // }

//   // /**
//   //  * Update an existing drill pattern
//   //  */
//   // async update(id: string, data: UpdateDrillPatternDto): Promise<DrillPattern> {
//   //   console.log('[DrillPatternService] update:', id, data);
//   //   return apiClient
//   //     .put(`${this.basePath}/${id}`, { json: data })
//   //     .json<DrillPattern>();
//   // }

//   // /**
//   //  * Delete a drill pattern
//   //  */
//   // async remove(id: string): Promise<void> {
//   //   console.log('[DrillPatternService] remove:', id);
//   //   await apiClient.delete(`${this.basePath}/${id}`);
//   // }

//   // /**
//   //  * Get drill plans using this pattern
//   //  */
//   // async getDrillPlans(patternId: string): Promise<any[]> {
//   //   console.log('[DrillPatternService] getDrillPlans for pattern:', patternId);
//   //   return apiClient
//   //     .get(`${this.basePath}/${patternId}/drill-plans`)
//   //     .json<any[]>();
//   // }

//   // /**
//   //  * Get patterns for a specific drill program
//   //  */
//   // async findByProgram(programId: string): Promise<DrillPattern[]> {
//   //   console.log('[DrillPatternService] findByProgram:', programId);
//   //   const filters = { drillProgram: programId };
//   //   const response = await this.findAll(1, 1000, filters);
//   //   return response.data;
//   // }

//   // /**
//   //  * Export drill patterns to Excel
//   //  * Note: Requires backend endpoint implementation
//   //  */
//   // async exportToExcel(filters?: DrillPatternFilters): Promise<Blob> {
//   //   const params: any = {};

//   //   if (filters) {
//   //     params.filters = JSON.stringify(filters);
//   //   }

//   //   return apiClient
//   //     .get(`${this.basePath}/export/excel`, { searchParams: params })
//   //     .blob();
//   // }
// }

// export const drillPatternService = new DrillPatternService();
