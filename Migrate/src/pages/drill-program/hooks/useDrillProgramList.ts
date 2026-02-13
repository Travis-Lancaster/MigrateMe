/**
 * useDrillProgramList Hook
 *
 * Custom hook for managing drill program list state and operations.
 * Follows the same pattern as useDrillPlanList.
 */

import { useEffect, useRef } from "react";
import { useDrillProgramStore } from "../store/drill-program-store";

export function useDrillProgramList() {
	const {
		programs,
		isLoading,
		error,
		pagination,
		searchQuery,
		appliedFilters,
		loadPrograms,
		refreshPrograms,
		loadPage,
		setSearchQuery,
		applyFilters,
	} = useDrillProgramStore();

	const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

	// Load programs on mount
	useEffect(() => {
		console.log("[useDrillProgramList] useEffect: Loading programs on mount...");
		loadPrograms();
		return () => {
			console.log("[useDrillProgramList] useEffect: Cleanup");
			if (searchDebounceTimer.current) {
				clearTimeout(searchDebounceTimer.current);
			}
		};
	}, []);

	// Log store state for debugging
	console.log("[useDrillProgramList] Store state:", {
		programsCount: programs.length,
		pagination,
		appliedFilters,
		searchQuery,
		isLoading,
		hasError: !!error,
	});

	return {
		programs,
		isLoading,
		error,
		pagination,
		searchQuery,
		appliedFilters,
		refresh: refreshPrograms,
		loadPage,
		setSearchQuery,
		applyFilters,
	};
}
