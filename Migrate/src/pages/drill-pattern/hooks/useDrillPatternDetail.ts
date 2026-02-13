/**
 * useDrillPatternDetail Hook
 *
 * Custom hook for managing drill pattern detail state.
 * Follows the same pattern as useDrillProgramDetail.
 */

import { useEffect } from "react";
import { useDrillPatternStore } from "../store/drill-pattern-store";

export function useDrillPatternDetail(id: string) {
	const {
		selectedPattern,
		isLoading,
		error,
		loadPatternById,
		setSelectedPattern,
	} = useDrillPatternStore();

	useEffect(() => {
		if (id && id !== "new") {
			console.log("[useDrillPatternDetail] Loading pattern:", id);
			loadPatternById(id);
		}

		return () => {
			// Clear selected pattern on unmount
			setSelectedPattern(null);
		};
	}, [id]);

	console.log("[useDrillPatternDetail] State:", {
		patternId: selectedPattern?.DrillPatternId,
		isLoading,
		hasError: !!error,
	});

	return {
		pattern: selectedPattern,
		isLoading,
		error,
	};
}
