/**
 * DrillPlan Module Entry Point
 *
 * All views wrapped with shared ErrorBoundary for consistent error handling
 */

import { ErrorBoundary } from "#src/pages/_shared/components";
import React from "react";
import { DrillPlanFormView as DrillPlanFormViewBase } from "./views/DrillPlanFormView";
// import { DrillPlanDetailView as DrillPlanDetailViewBase } from './views/DrillPlanDetailView';
// import { DrillPlanFormView as DrillPlanFormViewBase } from './views/DrillPlanFormView';
import { DrillPlanListView as DrillPlanListViewBase } from "./views/DrillPlanListView";

// Wrap DrillPlanListView with error boundary
export const DrillPlanListView: React.FC = () => {
	console.log("[FLOW:drill-plan-list] [ACTION] Rendering DrillPlanListView");
	return (
		<ErrorBoundary moduleName="DrillPlan - List View">
			<DrillPlanListViewBase />
		</ErrorBoundary>
	);
};

// Wrap DrillPlanDetailView with error boundary
// export const DrillPlanDetailView: React.FC = () => {
//   console.log('[FLOW:drill-plan-detail] [ACTION] Rendering DrillPlanDetailView');
//   return (
//     <ErrorBoundary moduleName="DrillPlan - Detail View">
//       <DrillPlanDetailViewBase />
//     </ErrorBoundary>
//   );
// };

// // Wrap DrillPlanFormView with error boundary
// export const DrillPlanFormView: React.FC = () => {
//   console.log('[FLOW:drill-plan-form] [ACTION] Rendering DrillPlanFormView');
//   return (
//     <ErrorBoundary moduleName="DrillPlan - Form View">
//       <DrillPlanFormViewBase />
//     </ErrorBoundary>
//   );
// };

// Wrap DrillPlanFormView with error boundary (unified view/edit/create component)
export const DrillPlanFormView: React.FC = () => {
	console.log("[FLOW:drill-plan-unified] [ACTION] Rendering DrillPlanFormView");
	return (
		<ErrorBoundary moduleName="DrillPlan - Unified Form View">
			<DrillPlanFormViewBase />
		</ErrorBoundary>
	);
};

export * from "./components";
export * from "./hooks";
export * from "./services";
export { useDrillPlanStore } from "./store/drill-plan-store";
export * from "./types";
