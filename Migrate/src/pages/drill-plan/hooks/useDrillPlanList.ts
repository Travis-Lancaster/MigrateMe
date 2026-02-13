/**
 * useDrillPlanList Hook
 *
 * Hook for list view logic with server-side pagination and search
 */

import { useCallback, useEffect, useRef } from "react";
import { useDrillPlanStore } from "../store/drill-plan-store";

let renderCount = 0; // Track render count for debugging

export function useDrillPlanList() {
	renderCount++;
	console.log(`[useDrillPlanList] Hook executing - Render #${renderCount}`);

	const {
		plans,
		pagination,
		activeFilter,
		setActiveFilter,
		searchQuery,
		setSearchQuery: setStoreSearchQuery,
		selectedPlanIds,
		selectPlan,
		deselectPlan,
		clearSelection,
		isLoading,
		error,
		loadPlans,
		refreshPlans,
		loadPage,
	} = useDrillPlanStore();

	console.log("[useDrillPlanList] Store state:", {
		plansCount: plans.length,
		pagination,
		activeFilter,
		searchQuery,
		isLoading,
		hasError: !!error,
	});

	// Debounce timer ref
	const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

	// Load plans on mount
	useEffect(() => {
		console.log("[useDrillPlanList] useEffect: Loading plans on mount...");
		loadPlans();
		return () => {
			console.log("[useDrillPlanList] useEffect: Cleanup");
			if (searchDebounceTimer.current) {
				clearTimeout(searchDebounceTimer.current);
			}
		};
	}, []); // Keep empty - loadPlans is stable from Zustand

	// Debounced search handler
	const setSearchQuery = useCallback((query: string) => {
		// Update store immediately for UI responsiveness
		setStoreSearchQuery(query);

		// Clear existing timer
		if (searchDebounceTimer.current) {
			clearTimeout(searchDebounceTimer.current);
		}

		// Set new timer to trigger server-side search
		searchDebounceTimer.current = setTimeout(() => {
			console.log("[useDrillPlanList] Debounced search triggered:", query);
			// Reload from page 1 with new search
			loadPlans(1, pagination.take);
		}, 500); // 500ms debounce
	}, [setStoreSearchQuery, loadPlans, pagination.take]);

	console.log(`[useDrillPlanList] Returning ${plans.length} plans`);

	return {
		plans, // Server-side filtered/searched plans
		pagination,
		activeFilter,
		setActiveFilter,
		searchQuery,
		setSearchQuery,
		selectedPlanIds,
		selectPlan,
		deselectPlan,
		clearSelection,
		isLoading,
		error,
		refresh: refreshPlans,
		loadPage,
	};
}
