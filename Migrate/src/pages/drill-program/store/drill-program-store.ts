/**
 * DrillProgram Store
 *
 * Zustand state management for drill programs.
 * Follows the same pattern as drill-plan-store.ts
 */

import type { PaginationMeta } from "../services";
import type {
	CreateDrillProgramDto,
	DrillProgram,
	DrillProgramFilters,
	UpdateDrillProgramDto,
} from "../types";
import apiClient from "#src/services/apiClient.js";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface DrillProgramState {
	// State
	programs: DrillProgram[]
	selectedProgram: DrillProgram | null
	isLoading: boolean
	isSaving: boolean
	error: string | null
	pagination: PaginationMeta
	appliedFilters: DrillProgramFilters
	searchQuery: string

	// Actions
	loadPrograms: (page?: number, take?: number) => Promise<void>
	loadProgramById: (id: string) => Promise<void>
	createProgram: (data: CreateDrillProgramDto) => Promise<DrillProgram>
	updateProgram: (id: string, data: UpdateDrillProgramDto) => Promise<DrillProgram>
	deleteProgram: (id: string) => Promise<void>
	setFilters: (filters: DrillProgramFilters) => void
	setSearchQuery: (query: string) => void
	applyFilters: () => Promise<void>
	clearFilters: () => Promise<void>
	setSelectedProgram: (program: DrillProgram | null) => void
	refreshPrograms: () => Promise<void>
	loadPage: (page: number, take: number) => Promise<void>
}

export const useDrillProgramStore = create<DrillProgramState>()(
	immer((set, get) => ({
		// Initial state
		programs: [],
		selectedProgram: null,
		isLoading: false,
		isSaving: false,
		error: null,
		pagination: {
			page: 1,
			take: 20,
			itemCount: 0,
			pageCount: 0,
			hasPreviousPage: false,
			hasNextPage: false,
		},
		appliedFilters: {},
		searchQuery: "",

		// Actions
		loadPrograms: async (page = 1, take = 20) => {
			console.log("[drill-program-store] loadPrograms: Starting...", { page, take });
			set({ isLoading: true, error: null });
			try {
				const { appliedFilters, searchQuery } = get();
				console.log("[drill-program-store] loadPrograms: Fetching with filters", appliedFilters, "search:", searchQuery);

				// Build query object for API
				const query: any = { page, take };
				if (searchQuery?.trim()) {
					query.search = searchQuery.trim();
				}
				if (appliedFilters && Object.keys(appliedFilters).length > 0) {
					query.filters = JSON.stringify(appliedFilters);
				}

				const response = await apiClient.drillProgramControllerFindAll(query);
				const programs = response.data?.data || [];

				console.log("[drill-program-store] loadPrograms: Received", programs.length, "programs");

				// Calculate pagination metadata since API doesn't return it
				const itemCount = programs.length;
				const pageCount = Math.ceil(itemCount / take);

				set({
					programs,
					pagination: {
						page,
						take,
						itemCount,
						pageCount,
						hasPreviousPage: page > 1,
						hasNextPage: page < pageCount,
					},
					isLoading: false,
				});
				console.log("[drill-program-store] loadPrograms: Store updated successfully");
			}
			catch (error: any) {
				console.error("[drill-program-store] loadPrograms: Error", error);
				set({ error: error.message, isLoading: false });
			}
		},

		loadProgramById: async (id: string) => {
			console.log("[drill-program-store] loadProgramById:", id);
			set({ isLoading: true, error: null });
			try {
				const response = await apiClient.drillProgramControllerFindOne(id);
				const program = response.data;
				console.log("[drill-program-store] loadProgramById: Loaded program", program?.DrillProgram);
				set({ selectedProgram: program, isLoading: false });
			}
			catch (error: any) {
				console.error("[drill-program-store] loadProgramById: Error", error);
				set({ error: error.message, isLoading: false });
			}
		},

		createProgram: async (data: CreateDrillProgramDto) => {
			console.log("[drill-program-store] createProgram:", data);
			set({ isSaving: true, error: null });
			try {
				const response = await apiClient.drillProgramControllerCreate(data);
				const program = response.data;
				console.log("[drill-program-store] createProgram: Created", program?.DrillProgramId);
				set((state) => {
					if (program) {
						state.programs.unshift(program);
					}
					state.isSaving = false;
				});
				return program!;
			}
			catch (error: any) {
				console.error("[drill-program-store] createProgram: Error", error);
				set({ error: error.message, isSaving: false });
				throw error;
			}
		},

		updateProgram: async (id: string, data: UpdateDrillProgramDto) => {
			console.log("[drill-program-store] updateProgram:", id, data);
			set({ isSaving: true, error: null });
			try {
				const response = await apiClient.drillProgramControllerUpdate(id, data);
				const program = response.data;
				console.log("[drill-program-store] updateProgram: Updated", program?.DrillProgramId);
				set((state) => {
					if (program) {
						const index = state.programs.findIndex(p => p.DrillProgramId === id);
						if (index !== -1) {
							state.programs[index] = program;
						}
						state.selectedProgram = program;
					}
					state.isSaving = false;
				});
				return program!;
			}
			catch (error: any) {
				console.error("[drill-program-store] updateProgram: Error", error);
				set({ error: error.message, isSaving: false });
				throw error;
			}
		},

		deleteProgram: async (id: string) => {
			console.log("[drill-program-store] deleteProgram:", id);
			set({ isLoading: true, error: null });
			try {
				await apiClient.drillProgramControllerRemove(id);
				console.log("[drill-program-store] deleteProgram: Deleted", id);
				set((state) => {
					state.programs = state.programs.filter(p => p.DrillProgramId !== id);
					state.isLoading = false;
				});
			}
			catch (error: any) {
				console.error("[drill-program-store] deleteProgram: Error", error);
				set({ error: error.message, isLoading: false });
				throw error;
			}
		},

		setFilters: (filters: DrillProgramFilters) => {
			console.log("[drill-program-store] setFilters:", filters);
			set({ appliedFilters: filters });
		},

		setSearchQuery: (query: string) => {
			console.log("[drill-program-store] setSearchQuery:", query);
			set({ searchQuery: query });
		},

		applyFilters: async () => {
			console.log("[drill-program-store] applyFilters: Applying current filters");
			await get().loadPrograms(1, get().pagination.take);
		},

		clearFilters: async () => {
			console.log("[drill-program-store] clearFilters: Clearing all filters");
			set({ appliedFilters: {}, searchQuery: "" });
			await get().loadPrograms(1, get().pagination.take);
		},

		setSelectedProgram: (program: DrillProgram | null) => {
			console.log("[drill-program-store] setSelectedProgram:", program?.DrillProgram);
			set({ selectedProgram: program });
		},

		refreshPrograms: async () => {
			console.log("[drill-program-store] refreshPrograms: Refreshing current page");
			const { pagination } = get();
			await get().loadPrograms(pagination.page, pagination.take);
		},

		loadPage: async (page: number, take: number) => {
			console.log("[drill-program-store] loadPage:", { page, take });
			await get().loadPrograms(page, take);
		},
	})),
);
