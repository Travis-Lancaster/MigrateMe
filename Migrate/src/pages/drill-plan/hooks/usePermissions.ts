/**
 * usePermissions Hook
 *
 * Hook for permission checks
 */

import type { DrillPlan, DrillPlanStatusEnum } from "../types";

import { useUserStore } from "#src/store/user";
import { useMemo } from "react";
import { PermissionService } from "../services/permissionService";

export function usePermissions() {
	const user = useUserStore();

	const permissionService = useMemo(() => {
		// Get first role or default to 'viewer'
		const userRole = "admin";// ToDo: remove || user.roles?.[0] || 'viewer';
		return new PermissionService(userRole);
	}, [user.roles]);

	const canCreate = () => permissionService.canCreate();
	const canRead = () => permissionService.canRead();
	const canUpdate = () => permissionService.canUpdate();
	const canDelete = (plan: DrillPlan) => permissionService.canDelete(plan);
	const canTransitionTo = (plan: DrillPlan, toStatus: DrillPlanStatusEnum) =>
		permissionService.canTransitionTo(plan, toStatus);
	const getAvailableTransitions = (plan: DrillPlan) =>
		permissionService.getAvailableStatusTransitions(plan);

	return {
		canCreate,
		canRead,
		canUpdate,
		canDelete,
		canTransitionTo,
		getAvailableTransitions,
		permissionService,
	};
}
