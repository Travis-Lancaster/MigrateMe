/**
 * DrillPattern Store
 *
 * Zustand state management for drill patterns.
 * Includes program filtering support.
 */

import type { PaginationMeta } from "#src/pages/drill-program/services/drillProgramService";

import type {
	CreateDrillPatternDto,
	DrillPattern,
	DrillPatternFilters,
	UpdateDrillPatternDto,
} from "../types";
import apiClient from "#src/services/apiClient.js";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface DrillPatternState {
	// State
	patterns: DrillPattern[]
	selectedPattern: DrillPattern | null
	isLoading: boolean
	isSaving: boolean
	error: string | null
	pagination: PaginationMeta
	appliedFilters: DrillPatternFilters
	searchQuery: string
	programFilter: string | null // Filter by specific drill program

	// Actions
	loadPatterns: (page?: number, take?: number) => Promise<void>
	loadPatternById: (id: string) => Promise<void>
	loadPatternsForProgram: (programId: string) => Promise<void>
	createPattern: (data: CreateDrillPatternDto) => Promise<DrillPattern>
	updatePattern: (id: string, data: UpdateDrillPatternDto) => Promise<DrillPattern>
	deletePattern: (id: string) => Promise<void>
	setFilters: (filters: DrillPatternFilters) => void
	setSearchQuery: (query: string) => void
	setProgramFilter: (programId: string | null) => void
	applyFilters: () => Promise<void>
	clearFilters: () => Promise<void>
	setSelectedPattern: (pattern: DrillPattern | null) => void
	refreshPatterns: () => Promise<void>
	loadPage: (page: number, take: number) => Promise<void>
}

export const useDrillPatternStore = create<DrillPatternState>()(
	immer((set, get) => ({
		// Initial state
		patterns: [],
		selectedPattern: null,
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
		programFilter: null,

		// Actions
		loadPatterns: async (page = 1, take = 20) => {
			console.log("[drill-pattern-store] loadPatterns: Starting...", { page, take });
			set({ isLoading: true, error: null });
			try {
				const { appliedFilters, searchQuery, programFilter } = get();

				// Add program filter if set
				const filters = { ...appliedFilters };
				if (programFilter) {
					filters.drillProgram = programFilter;
				}

				console.log("[drill-pattern-store] loadPatterns: Fetching with filters", filters, "search:", searchQuery);

				// Build query object for API
				const query: any = { page, take };
				if (searchQuery?.trim()) {
					query.search = searchQuery.trim();
				}
				if (filters && Object.keys(filters).length > 0) {
					query.filters = JSON.stringify(filters);
				}

				const response = await apiClient.drillPatternControllerFindAll(query);
				const patterns = response.data?.data || [];

				console.log("[drill-pattern-store] loadPatterns: Received", patterns.length, "patterns");

				// Calculate pagination metadata since API doesn't return it
				const itemCount = patterns.length;
				const pageCount = Math.ceil(itemCount / take);

				set({
					patterns,
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
				console.log("[drill-pattern-store] loadPatterns: Store updated successfully");
			}
			catch (error: any) {
				console.error("[drill-pattern-store] loadPatterns: Error", error);
				set({ error: error.message, isLoading: false });
			}
		},

		loadPatternById: async (id: string) => {
			console.log("[drill-pattern-store] loadPatternById:", id);
			set({ isLoading: true, error: null });
			try {
				const response = await apiClient.drillPatternControllerFindOne(id);
				const pattern = response.data;
				console.log("[drill-pattern-store] loadPatternById: Loaded pattern", pattern?.DrillPattern);
				set({ selectedPattern: pattern, isLoading: false });
			}
			catch (error: any) {
				console.error("[drill-pattern-store] loadPatternById: Error", error);
				set({ error: error.message, isLoading: false });
			}
		},

		loadPatternsForProgram: async (programId: string) => {
			console.log("[drill-pattern-store] loadPatternsForProgram:", programId);
			set({ programFilter: programId });
			await get().loadPatterns(1, get().pagination.take);
		},

		createPattern: async (data: CreateDrillPatternDto) => {
			console.log("[drill-pattern-store] createPattern:", data);
			set({ isSaving: true, error: null });
			try {
				const response = await apiClient.drillPatternControllerCreate(data);
				const pattern = response.data;
				console.log("[drill-pattern-store] createPattern: Created", pattern?.DrillPatternId);
				set((state) => {
					if (pattern) {
						state.patterns.unshift(pattern);
					}
					state.isSaving = false;
				});
				return pattern!;
			}
			catch (error: any) {
				console.error("[drill-pattern-store] createPattern: Error", error);
				set({ error: error.message, isSaving: false });
				throw error;
			}
		},

		updatePattern: async (id: string, data: UpdateDrillPatternDto) => {
			console.log("[drill-pattern-store] updatePattern:", id, data);
			set({ isSaving: true, error: null });
			try {
				const response = await apiClient.drillPatternControllerUpdate(id, data);
				const pattern = response.data;
				console.log("[drill-pattern-store] updatePattern: Updated", pattern?.DrillPatternId);
				set((state) => {
					if (pattern) {
						const index = state.patterns.findIndex(p => p.DrillPatternId === id);
						if (index !== -1) {
							state.patterns[index] = pattern;
						}
						state.selectedPattern = pattern;
					}
					state.isSaving = false;
				});
				return pattern!;
			}
			catch (error: any) {
				console.error("[drill-pattern-store] updatePattern: Error", error);
				set({ error: error.message, isSaving: false });
				throw error;
			}
		},

		deletePattern: async (id: string) => {
			console.log("[drill-pattern-store] deletePattern:", id);
			set({ isLoading: true, error: null });
			try {
				await apiClient.drillPatternControllerRemove(id);
				console.log("[drill-pattern-store] deletePattern: Deleted", id);
				set((state) => {
					state.patterns = state.patterns.filter(p => p.DrillPatternId !== id);
					state.isLoading = false;
				});
			}
			catch (error: any) {
				console.error("[drill-pattern-store] deletePattern: Error", error);
				set({ error: error.message, isLoading: false });
				throw error;
			}
		},

		setFilters: (filters: DrillPatternFilters) => {
			console.log("[drill-pattern-store] setFilters:", filters);
			set({ appliedFilters: filters });
		},

		setSearchQuery: (query: string) => {
			console.log("[drill-pattern-store] setSearchQuery:", query);
			set({ searchQuery: query });
		},

		setProgramFilter: (programId: string | null) => {
			console.log("[drill-pattern-store] setProgramFilter:", programId);
			set({ programFilter: programId });
		},

		applyFilters: async () => {
			console.log("[drill-pattern-store] applyFilters: Applying current filters");
			await get().loadPatterns(1, get().pagination.take);
		},

		clearFilters: async () => {
			console.log("[drill-pattern-store] clearFilters: Clearing all filters");
			set({ appliedFilters: {}, searchQuery: "", programFilter: null });
			await get().loadPatterns(1, get().pagination.take);
		},

		setSelectedPattern: (pattern: DrillPattern | null) => {
			console.log("[drill-pattern-store] setSelectedPattern:", pattern?.DrillPattern);
			set({ selectedPattern: pattern });
		},

		refreshPatterns: async () => {
			console.log("[drill-pattern-store] refreshPatterns: Refreshing current page");
			const { pagination } = get();
			await get().loadPatterns(pagination.page, pagination.take);
		},

		loadPage: async (page: number, take: number) => {
			console.log("[drill-pattern-store] loadPage:", { page, take });
			await get().loadPatterns(page, take);
		},
	})),
);
