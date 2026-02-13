/**
 * DrillProgram Module Entry Point
 *
 * All views wrapped with shared ErrorBoundary for consistent error handling.
 * Follows the same pattern as drill-plan/index.tsx
 */

import { ErrorBoundary } from "#src/pages/_shared/components";
import React from "react";
import { DrillProgramDetailView as DrillProgramDetailViewBase } from "./views/DrillProgramDetailView";
import { DrillProgramFormView as DrillProgramFormViewBase } from "./views/DrillProgramFormView";
import { DrillProgramListView as DrillProgramListViewBase } from "./views/DrillProgramListView";

// Wrap DrillProgramListView with error boundary
export const DrillProgramListView: React.FC = () => {
	console.log("[FLOW:drill-program-list] [ACTION] Rendering DrillProgramListView");
	return (
		<ErrorBoundary moduleName="DrillProgram - List View">
			<DrillProgramListViewBase />
		</ErrorBoundary>
	);
};

// Wrap DrillProgramDetailView with error boundary
export const DrillProgramDetailView: React.FC = () => {
	console.log("[FLOW:drill-program-detail] [ACTION] Rendering DrillProgramDetailView");
	return (
		<ErrorBoundary moduleName="DrillProgram - Detail View">
			<DrillProgramDetailViewBase />
		</ErrorBoundary>
	);
};

// Wrap DrillProgramFormView with error boundary
export const DrillProgramFormView: React.FC = () => {
	console.log("[FLOW:drill-program-form] [ACTION] Rendering DrillProgramFormView");
	return (
		<ErrorBoundary moduleName="DrillProgram - Form View">
			<DrillProgramFormViewBase />
		</ErrorBoundary>
	);
};
export * from "./hooks";
export * from "./services";
export { useDrillProgramStore } from "./store/drill-program-store";
export * from "./types";
