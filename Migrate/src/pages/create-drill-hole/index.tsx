/**
 * Create Drill Hole Module Entry Point
 *
 * Route configuration for drill hole creation workflow.
 * All views wrapped with shared ErrorBoundary for consistent error handling.
 *
 * Pattern based on: src/pages/drill-hole/index.tsx
 */

import { ErrorBoundary } from "#src/pages/_shared/components";
import React, { lazy } from "react";

/**
 * Lazy-load the main view component for code splitting
 */
const CreateDrillHoleViewComponent = lazy(() =>
	import("./views/CreateDrillHoleView").then(m => ({ default: m.CreateDrillHoleView })),
);

/**
 * Create Drill Hole View (Wrapped)
 *
 * Production export with error boundary for resilient error handling.
 * Lazy-loaded for performance optimization.
 */
export const CreateDrillHoleView: React.FC = () => {
	console.log("📂 [ROUTE:CREATE] Initializing CreateDrillHoleView with ErrorBoundary");

	return (
		<ErrorBoundary moduleName="Create Drill Hole">
			<React.Suspense fallback={<div style={{ padding: "24px", textAlign: "center" }}>Loading...</div>}>
				<CreateDrillHoleViewComponent />
			</React.Suspense>
		</ErrorBoundary>
	);
};

// Export store for external use (e.g., navigation components)
export { useCreateDrillHoleStore } from "./store/create-drillhole-store";

// TODO: Export additional components when created
// export * from "./types";
// export * from "./components";
// export * from "./hooks";
