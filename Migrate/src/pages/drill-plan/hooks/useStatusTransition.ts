/**
 * useStatusTransition Hook
 *
 * Hook for status transition logic
 */

import type { DrillPlan, DrillPlanStatusEnum, StatusTransitionMetadata } from "../types";
import { message } from "antd";
import { useState } from "react";
import { statusTransitionService } from "../services/statusTransitionService";
import { useDrillPlanStore } from "../store/drill-plan-store";

export function useStatusTransition() {
	const {
		statusTransitionModal,
		openStatusTransitionModal,
		closeStatusTransitionModal,
		transitionStatus,
	} = useDrillPlanStore();

	const [loading, setLoading] = useState(false);

	const handleTransition = async (
		planId: string,
		toStatus: DrillPlanStatusEnum,
		metadata: StatusTransitionMetadata,
	) => {
		setLoading(true);
		try {
			await transitionStatus(planId, toStatus, metadata);
			message.success(`Status changed to ${toStatus}`);
			closeStatusTransitionModal();
		}
		catch (error: any) {
			message.error(error.message || "Failed to change status");
			throw error;
		}
		finally {
			setLoading(false);
		}
	};

	const checkReadiness = (plan: DrillPlan, toStatus: DrillPlanStatusEnum) => {
		return statusTransitionService.checkReadiness(plan, toStatus);
	};

	const isExceptional = (status: DrillPlanStatusEnum) => {
		return statusTransitionService.isExceptionalStatus(status);
	};

	return {
		statusTransitionModal,
		openStatusTransitionModal,
		closeStatusTransitionModal,
		handleTransition,
		checkReadiness,
		isExceptional,
		loading,
	};
}
