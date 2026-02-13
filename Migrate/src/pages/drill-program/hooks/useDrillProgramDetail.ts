/**
 * useDrillProgramDetail Hook
 *
 * Custom hook for managing drill program detail state.
 * Follows the same pattern as useDrillPlanDetail.
 */

import { useEffect } from "react";
import { useDrillProgramStore } from "../store/drill-program-store";

export function useDrillProgramDetail(id: string) {
	const {
		selectedProgram,
		isLoading,
		error,
		loadProgramById,
		setSelectedProgram,
	} = useDrillProgramStore();

	useEffect(() => {
		if (id && id !== "new") {
			console.log("[useDrillProgramDetail] Loading program:", id);
			loadProgramById(id);
		}

		return () => {
			// Clear selected program on unmount
			setSelectedProgram(null);
		};
	}, [id]);

	console.log("[useDrillProgramDetail] State:", {
		programId: selectedProgram?.DrillProgramId,
		isLoading,
		hasError: !!error,
	});

	return {
		program: selectedProgram,
		isLoading,
		error,
	};
}
