/**
 * Dashboard Component - Mission Control with Dual Naming
 * Main entry point showing active drill holes with planning and execution identifiers
 *
 * Uses LiveQuery for reactive data from Dexie
 */

import { db } from "#src/data/index.js";
import { PageHeader } from "#src/ux/shared/components/index.js";

import { Card, Tabs } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import { useState } from "react";
import { AlertPanel, CollarCard, SyncStatusWidget } from "./components";

type FilterType = "all" | "planned" | "inprogress" | "completed";

export function Dashboard() {
	const [activeFilter, setActiveFilter] = useState<FilterType>("all");
	console.log("[Dashboard]", { activeFilter });
	// Reactive data from Dexie using LiveQuery
	const collars = useLiveQuery(
		async () => {
			console.log("[Dashboard] Loading drill plans from Dexie");
			const collars = await db.DrillHole_Collar.toArray();

			console.log("[Dashboard] Drill plans loaded:", {
				count: collars.length,
				statuses: collars.map(c => c.HoleStatus),
			});

			return collars;
		},
		[],
	);

	// Loading state - collars is undefined while query is pending
	const isLoading = collars === undefined;
	const collar = collars || [];

	// Filter drill plans based on active filter
	const filteredPlans = collar.filter((collar) => {
		if (activeFilter === "all")
			return true;
		if (activeFilter === "planned")
			return collar.HoleStatus === "Planned";
		if (activeFilter === "inprogress")
			return collar.HoleStatus === "In progress";
		if (activeFilter === "completed")
			return collar.HoleStatus === "Completed";
		return true;
	});

	const countByStatus = {
		all: collar.length,
		planned: collar.filter(p => p.HoleStatus === "Planned").length,
		inprogress: collar.filter(p => p.HoleStatus === "In progress").length,
		completed: collar.filter(p => p.HoleStatus === "Completed").length,
	};

	return (
		<div className="p-6">
			<PageHeader
				title="🏔️ Mission Control"
				subtitle="Gold Rush 2026 Drill Program"
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Main content area - Drill Holes */}
				<div className="lg:col-span-2">
					<Card
						title={`My Drill Holes (${filteredPlans.length})`}
						loading={isLoading}
						extra={(
							<Tabs
								activeKey={activeFilter}
								onChange={key => setActiveFilter(key as FilterType)}
								size="small"
								items={[
									{ key: "all", label: `All (${countByStatus.all})` },
									{ key: "planned", label: `Planned (${countByStatus.planned})` },
									{ key: "inprogress", label: `In Progress (${countByStatus.inprogress})` },
									{ key: "completed", label: `Completed (${countByStatus.completed})` },
								]}
							/>
						)}
					>
						<div className="space-y-3">
							{filteredPlans.length === 0 && !isLoading && (
								<div className="text-center text-gray-500 py-8">
									{collar.length === 0
										? "No drill plans in database. Sync data or create collar to get started."
										: "No drill holes in this category"}
								</div>
							)}

							{filteredPlans.map(collar => (
								<CollarCard key={collar.CollarId} plan={collar} />
							))}
						</div>
					</Card>
				</div>

				{/* Sidebar - Alerts and Sync Status */}
				<div className="space-y-4">
					<AlertPanel />
					<SyncStatusWidget />
				</div>
			</div>
		</div>
	);
}

export default Dashboard;
