/**
 * useDrillPatternList Hook
 *
 * Custom hook for managing drill pattern list state and operations.
 * Follows the same pattern as useDrillProgramList.
 */

import { useEffect, useRef } from "react";
import { useDrillPatternStore } from "../store/drill-pattern-store";

export function useDrillPatternList() {
	const {
		patterns,
		isLoading,
		error,
		pagination,
		searchQuery,
		appliedFilters,
		programFilter,
		loadPatterns,
		refreshPatterns,
		loadPage,
		setSearchQuery,
		applyFilters,
		setProgramFilter,
		loadPatternsForProgram,
	} = useDrillPatternStore();

	const searchDebounceTimer = useRef<NodeJS.Timeout | null>(null);

	// Load patterns on mount
	useEffect(() => {
		console.log("[useDrillPatternList] useEffect: Loading patterns on mount...");
		loadPatterns();
		return () => {
			console.log("[useDrillPatternList] useEffect: Cleanup");
			if (searchDebounceTimer.current) {
				clearTimeout(searchDebounceTimer.current);
			}
		};
	}, []);

	// Log store state for debugging
	console.log("[useDrillPatternList] Store state:", {
		patternsCount: patterns.length,
		pagination,
		appliedFilters,
		searchQuery,
		programFilter,
		isLoading,
		hasError: !!error,
	});

	return {
		patterns,
		isLoading,
		error,
		pagination,
		searchQuery,
		appliedFilters,
		programFilter,
		refresh: refreshPatterns,
		loadPage,
		setSearchQuery,
		applyFilters,
		setProgramFilter,
		loadPatternsForProgram,
	};
}
