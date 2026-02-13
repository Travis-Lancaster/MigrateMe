/**
 * DrillPlan Zustand Store
 *
 * Central state management for DrillPlan workflow.
 * Follows pattern from drill-hole store.
 */

import type { PaginationMeta } from "../services/drillPlanService";
import type {
	CreateDrillPlanDto,
	DrillPlan,
	DrillPlanFilters,
	DrillPlanFilterType,
	DrillPlanStatusEnum,
	StatusTransitionMetadata,
	UpdateDrillPlanDto,
} from "../types";
import { create } from "zustand";

import { devtools } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { drillPlanService } from "../services/drillPlanService";
import { statusTransitionService } from "../services/statusTransitionService";

interface DrillPlanState {
	// Data
	plans: DrillPlan[]
	currentPlan: DrillPlan | null
	pagination: PaginationMeta

	// Filters
	activeFilter: DrillPlanFilterType
	searchQuery: string
	appliedFilters: DrillPlanFilters

	// UI State
	selectedPlanIds: string[]
	isLoading: boolean
	isSaving: boolean
	error: string | null

	// Modals
	statusTransitionModal: {
		visible: boolean
		planId?: string
		toStatus?: DrillPlanStatusEnum
	}

	// Actions - Data
	loadPlans: (page?: number, take?: number) => Promise<void>
	loadPlanById: (planId: string, forceRefresh?: boolean) => Promise<void>
	createPlan: (data: CreateDrillPlanDto) => Promise<DrillPlan>
	updatePlan: (planId: string, data: UpdateDrillPlanDto) => Promise<DrillPlan>
	deletePlan: (planId: string) => Promise<void>
	refreshPlans: () => Promise<void>
	loadPage: (page: number, take: number) => Promise<void>

	// Actions - Status Transitions
	transitionStatus: (
		planId: string,
		toStatus: DrillPlanStatusEnum,
		metadata: StatusTransitionMetadata,
	) => Promise<void>

	// Actions - Filters
	setActiveFilter: (filter: DrillPlanFilterType) => void
	setSearchQuery: (query: string) => void
	applyFilters: (filters: DrillPlanFilters) => void
	clearFilters: () => void

	// Actions - Selection
	selectPlan: (planId: string) => void
	deselectPlan: (planId: string) => void
	selectAll: () => void
	clearSelection: () => void

	// Actions - Bulk Operations
	bulkDeletePlans: (planIds: string[]) => Promise<void>

	// Actions - Modals
	openStatusTransitionModal: (planId: string, toStatus?: DrillPlanStatusEnum) => void
	closeStatusTransitionModal: () => void

	// Computed
	getFilteredPlans: () => DrillPlan[]
}

export const useDrillPlanStore = create<DrillPlanState>()(
	devtools(
		immer((set, get) => ({
			// Initial state
			plans: [],
			currentPlan: null,
			pagination: {
				page: 1,
				take: 20,
				itemCount: 0,
				pageCount: 0,
				hasPreviousPage: false,
				hasNextPage: false,
			},
			activeFilter: "inprogress",
			searchQuery: "",
			appliedFilters: { status: "In progress" },
			selectedPlanIds: [],
			isLoading: false,
			isSaving: false,
			error: null,
			statusTransitionModal: { visible: false },

			// Load all plans with pagination
			loadPlans: async (page = 1, take = 20) => {
				console.log("[drill-plan-store] loadPlans: Starting...", { page, take });
				set({ isLoading: true, error: null });
				try {
					const { appliedFilters, searchQuery } = get();
					console.log("[drill-plan-store] loadPlans: Fetching with filters", appliedFilters, "search:", searchQuery);

					const response = await drillPlanService.findAll(
						page,
						take,
						appliedFilters,
						searchQuery,
					);

					console.log("[drill-plan-store] loadPlans: Received", response.data.length, "plans, meta:", response.meta);
					set({
						plans: response.data,
						pagination: response.meta,
						isLoading: false,
					});
					console.log("[drill-plan-store] loadPlans: Store updated successfully");
				}
				catch (error: any) {
					console.error("[drill-plan-store] loadPlans: Error", error);
					set({ error: error.message, isLoading: false });
				}
			},

			// Load specific page
			loadPage: async (page: number, take: number) => {
				console.log("[drill-plan-store] loadPage:", { page, take });
				await get().loadPlans(page, take);
			},

			// Load single plan
			loadPlanById: async (planId: string, forceRefresh = false) => {
				set({ isLoading: true, error: null });
				try {
					const plan = await drillPlanService.getById(planId, forceRefresh);
					set({ currentPlan: plan, isLoading: false });
				}
				catch (error: any) {
					set({ error: error.message, isLoading: false });
				}
			},

			// Create plan
			createPlan: async (data: CreateDrillPlanDto) => {
				set({ isSaving: true, error: null });
				try {
					const plan = await drillPlanService.create(data);
					set((state) => {
						state.plans.unshift(plan);
						state.isSaving = false;
					});
					return plan;
				}
				catch (error: any) {
					set({ error: error.message, isSaving: false });
					throw error;
				}
			},

			// Update plan
			updatePlan: async (planId: string, data: UpdateDrillPlanDto) => {
				set({ isSaving: true, error: null });
				try {
					const plan = await drillPlanService.update(planId, data);
					set((state) => {
						const index = state.plans.findIndex(p => p.DrillPlanId === planId);
						if (index !== -1) {
							state.plans[index] = plan;
						}
						if (state.currentPlan?.DrillPlanId === planId) {
							state.currentPlan = plan;
						}
						state.isSaving = false;
					});
					return plan;
				}
				catch (error: any) {
					set({ error: error.message, isSaving: false });
					throw error;
				}
			},

			// Delete plan
			deletePlan: async (planId: string) => {
				set({ isSaving: true, error: null });
				try {
					await drillPlanService.delete(planId);
					set((state) => {
						state.plans = state.plans.filter(p => p.DrillPlanId !== planId);
						if (state.currentPlan?.DrillPlanId === planId) {
							state.currentPlan = null;
						}
						state.isSaving = false;
					});
				}
				catch (error: any) {
					set({ error: error.message, isSaving: false });
					throw error;
				}
			},

			// Refresh plans
			refreshPlans: async () => {
				const { pagination } = get();
				await get().loadPlans(pagination.page, pagination.take);
			},

			// Transition status
			transitionStatus: async (
				planId: string,
				toStatus: DrillPlanStatusEnum,
				metadata: StatusTransitionMetadata,
			) => {
				set({ isSaving: true, error: null });
				try {
					await statusTransitionService.performTransition(planId, toStatus, metadata);

					// Reload plan to get updated status
					await get().loadPlanById(planId, true);

					// Update in list
					const plans = get().plans;
					const index = plans.findIndex(p => p.DrillPlanId === planId);
					if (index !== -1) {
						const updatedPlan = await drillPlanService.getById(planId, true);
						set((state) => {
							state.plans[index] = updatedPlan;
						});
					}

					set({ isSaving: false });
				}
				catch (error: any) {
					set({ error: error.message, isSaving: false });
					throw error;
				}
			},

			// Set active filter
			setActiveFilter: (filter: DrillPlanFilterType) => {
				set({ activeFilter: filter });

				// Apply filter to appliedFilters
				let statusFilter: DrillPlanStatusEnum[] | undefined;

				switch (filter) {
					case "draft":
						statusFilter = ["Draft"];
						break;
					case "planned":
						statusFilter = ["Planned"];
						break;
					case "inprogress":
						statusFilter = ["In progress"];
						break;
					case "completed":
						statusFilter = ["Completed"];
						break;
					case "exceptions":
						statusFilter = ["Abandoned", "Cancelled", "Suspended", "Stopped", "Inaccessible"];
						break;
					default:
						statusFilter = undefined;
				}

				set((state) => {
					state.appliedFilters.status = statusFilter;
				});

				// Reload with new filter from page 1
				get().loadPlans(1, get().pagination.take);
			},

			// Set search query
			setSearchQuery: (query: string) => {
				set({ searchQuery: query });
			},

			// Apply filters
			applyFilters: (filters: DrillPlanFilters) => {
				set({ appliedFilters: filters });
				// Reset to page 1 when applying new filters
				get().loadPlans(1, get().pagination.take);
			},

			// Clear filters
			clearFilters: () => {
				set({ appliedFilters: {}, activeFilter: "all", searchQuery: "" });
				get().loadPlans(1, get().pagination.take);
			},

			// Select plan
			selectPlan: (planId: string) => {
				set((state) => {
					if (!state.selectedPlanIds.includes(planId)) {
						state.selectedPlanIds.push(planId);
					}
				});
			},

			// Deselect plan
			deselectPlan: (planId: string) => {
				set((state) => {
					state.selectedPlanIds = state.selectedPlanIds.filter(id => id !== planId);
				});
			},

			// Select all
			selectAll: () => {
				const filtered = get().getFilteredPlans();
				set({ selectedPlanIds: filtered.map(p => p.DrillPlanId) });
			},

			// Clear selection
			clearSelection: () => {
				set({ selectedPlanIds: [] });
			},

			// Bulk delete plans
			bulkDeletePlans: async (planIds: string[]) => {
				set({ isSaving: true, error: null });
				try {
					const result = await drillPlanService.bulkDelete(planIds);
					set((state) => {
						state.plans = state.plans.filter(p => !planIds.includes(p.DrillPlanId));
						state.selectedPlanIds = [];
						state.isSaving = false;
					});
				}
				catch (error: any) {
					set({ error: error.message, isSaving: false });
					throw error;
				}
			},

			// Open status transition modal
			openStatusTransitionModal: (planId: string, toStatus?: DrillPlanStatusEnum) => {
				set({
					statusTransitionModal: {
						visible: true,
						planId,
						toStatus,
					},
				});
			},

			// Close status transition modal
			closeStatusTransitionModal: () => {
				set({
					statusTransitionModal: { visible: false },
				});
			},

			// Get filtered plans (now handled server-side, just return plans)
			getFilteredPlans: () => {
				// Server-side filtering and search is now handled in loadPlans
				// This method now just returns the current plans from state
				return get().plans;
			},
		})),
		{ name: "DrillPlanStore" },
	),
);
