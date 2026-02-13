/**
 * useDrillPlanDetail Hook
 *
 * Hook for detail view logic
 */

import { useEffect } from "react";
import { useDrillPlanStore } from "../store/drill-plan-store";

export function useDrillPlanDetail(planId: string) {
	const {
		currentPlan,
		isLoading,
		error,
		loadPlanById,
		updatePlan,
	} = useDrillPlanStore();

	// Load plan on mount or planId change
	useEffect(() => {
		if (planId) {
			loadPlanById(planId);
		}
	}, [planId]);

	const refresh = () => {
		if (planId) {
			loadPlanById(planId, true);
		}
	};

	return {
		plan: currentPlan,
		isLoading,
		error,
		updatePlan,
		refresh,
	};
}
