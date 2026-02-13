/**
 * DrillPlan Module Entry Point
 *
 * All views wrapped with shared ErrorBoundary for consistent error handling
 */

import { ErrorBoundary } from "#src/pages/_shared/components";
import React from "react";
import { DrillHoleDetailView as DrillHoleDetailViewBase } from "./views/DrillHoleDetailView";
// import DrillHoleDetailViewBase from './views/DrillHoleDetailView';
import { DrillHoleListView as DrillHoleListViewBase } from "./views/DrillHoleListView";

// Wrap DrillPlanListView with error boundary
export const DrillHoleDetailView: React.FC = () => {
	console.log("[FLOW:drill-hole-list] [ACTION] Rendering DrillHoleDetailViewBase");
	return (
		<ErrorBoundary moduleName="DrillPlan - List View">
			<DrillHoleDetailViewBase />
		</ErrorBoundary>
	);
};

// Wrap DrillPlanDetailView with error boundarys
export const DrillHoleListView: React.FC = () => {
	console.log("[FLOW:drill-hole-detail] [ACTION] Rendering DrillHoleListViewBase");
	return (

		<ErrorBoundary moduleName="DrillPlan - Detail View">
			<DrillHoleListViewBase />
		</ErrorBoundary>
	);
};

// export { useDrillPlanStore } from './store/drill-hole-store';
// export * from './types';
// export * from './services';
// export * from './hooks';
// export * from './components';
