/**
 * DrillPattern Module Entry Point
 *
 * All views wrapped with shared ErrorBoundary for consistent error handling.
 * Follows the same pattern as drill-program/index.tsx
 */

import { ErrorBoundary } from "#src/pages/_shared/components";
import React from "react";
import { DrillPatternDetailView as DrillPatternDetailViewBase } from "./views/DrillPatternDetailView";
import { DrillPatternFormView as DrillPatternFormViewBase } from "./views/DrillPatternFormView";
import { DrillPatternListView as DrillPatternListViewBase } from "./views/DrillPatternListView";

// Wrap DrillPatternListView with error boundary
export const DrillPatternListView: React.FC = () => {
	console.log("[FLOW:drill-pattern-list] [ACTION] Rendering DrillPatternListView");
	return (
		<ErrorBoundary moduleName="DrillPattern - List View">
			<DrillPatternListViewBase />
		</ErrorBoundary>
	);
};

// Wrap DrillPatternDetailView with error boundary
export const DrillPatternDetailView: React.FC = () => {
	console.log("[FLOW:drill-pattern-detail] [ACTION] Rendering DrillPatternDetailView");
	return (
		<ErrorBoundary moduleName="DrillPattern - Detail View">
			<DrillPatternDetailViewBase />
		</ErrorBoundary>
	);
};

// Wrap DrillPatternFormView with error boundary
export const DrillPatternFormView: React.FC = () => {
	console.log("[FLOW:drill-pattern-form] [ACTION] Rendering DrillPatternFormView");
	return (
		<ErrorBoundary moduleName="DrillPattern - Form View">
			<DrillPatternFormViewBase />
		</ErrorBoundary>
	);
};
export * from "./hooks";
export { useDrillPatternStore } from "./store/drill-pattern-store";
export * from "./types";
