/* eslint-disable unused-imports/no-unused-vars */
/**
 * DrillHoleListView Component - Cache-Aside Pattern with Auto-Refresh
 *
 * Main list view with AG Grid Server-Side Row Model (SSRM), filtering, and search capabilities.
 * Implements cache-aside pattern for instant rendering with automatic updates.
 *
 * CACHE-ASIDE IMPLEMENTATION:
 * - SSRM service checks Dexie cache first (instant rendering)
 * - useLiveQuery watches for dexie-syncable updates
 * - Grid auto-refreshes when sync updates local cache
 * - Users see instant loads + always-fresh data
 *
 * WHY THIS WORKS:
 * - Dexie-syncable keeps cache current via background sync
 * - When server data changes, sync updates local Dexie
 * - useLiveQuery detects cache changes automatically
 * - useEffect triggers grid refresh with new data
 * - No manual refresh button needed!
 *
 * @see plans/cache-aside-ssrm-with-sync-final.md
 */

import type { ColDef, GridReadyEvent } from "ag-grid-enterprise";
import { fetchAllDrillHolesLocal, fetchDrillHolesSSRM } from "#src/data/domain/collar/collar-ssrm-service.js";
import { db } from "#src/data/index.js";
import { getCommonGridProps } from "#src/ux/config/ag-grid-config.js";
import { useServerSideDatasource } from "#src/ux/core/hooks/useServerSideDatasource.js";

import { getHoleStatusColors2 } from "#src/ux/core/index.js";
import { safeCellRenderer } from "#src/ux/shared/util/grid-util.js";
import { ReloadOutlined } from "@ant-design/icons";
import { AllEnterpriseModule, ModuleRegistry } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { Alert, Button, Input, message, Space, Tag } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

// Register AG Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

const { Search } = Input;

type HoleStatusFilter = "all" | "planned" | "inprogress";

export function DrillHoleListView(): JSX.Element {
	console.log("[DrillHoleListView] ===== Component Rendering =====");

	const gridRef = useRef<AgGridReact>(null);
	const navigate = useNavigate();

	// Local state for external filters
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [activeFilter, setActiveFilter] = useState<HoleStatusFilter>("all");
	const [searchQuery, setSearchQuery] = useState("");

	// Convert chip filters to array
	const statusFilters = useMemo(() => {
		if (activeFilter === "all")
			return [];
		return [activeFilter];
	}, [activeFilter]);

	// ============================================
	// LiveQuery: Watch Dexie for sync updates
	// ============================================
	// When dexie-syncable updates local cache, this triggers
	// and causes the grid to refresh with new data
	const dexieData = useLiveQuery(() => {
		console.log("[DrillHoleListView] 👀 LiveQuery watching for sync updates");
		return db.DrillHole_Collar.toArray();
	}, []);

	// ============================================
	// Auto-Refresh: When cache changes, refresh grid
	// ============================================
	// This is the magic that makes cache-aside work with SSRM:
	// 1. Dexie-syncable detects server changes
	// 2. Sync updates local Dexie cache
	// 3. LiveQuery detects cache change
	// 4. This effect triggers grid refresh
	// 5. SSRM fetches from cache (instant!)
	// 6. User sees updated data automatically
	useEffect(() => {
		if (dexieData && gridRef.current?.api && !isLoading) {
			console.log("[DrillHoleListView] 🔄 Cache updated by sync - auto-refreshing grid", {
				recordCount: dexieData.length,
			});

			// Refresh grid to show updated data from cache
			// purge: true ensures we reload from cache (not stale in-memory data)
			gridRef.current.api.refreshServerSide({ purge: true });
		}
	}, [dexieData, isLoading]);

	console.log("[DrillHoleListView] State:", {
		dexieDataCount: dexieData?.length || 0,
		activeFilter,
		searchQuery,
		isLoading,
	});

	// Create SSRM datasource - recreate when filters change
	const datasourceConfig = useMemo(() => ({
		fetchData: fetchDrillHolesSSRM,
		fallbackFetch: fetchAllDrillHolesLocal,
		onError: (error: Error) => {
			message.error(`Failed to load drill holes: ${error.message}`);
		},
		cacheBlockSize: 100,
	}), []);

	const externalFilters = useMemo(() => ({
		searchText: searchQuery,
		statusFilters,
	}), [searchQuery, statusFilters]);

	const createDatasource = useServerSideDatasource(datasourceConfig, externalFilters);

	// Add mount/unmount logging
	useEffect(() => {
		console.log("[DrillHoleListView] ✅ Component MOUNTED (SSRM)");
		return () => {
			console.log("[DrillHoleListView] ❌ Component UNMOUNTING");
		};
	}, []);

	// Update datasource and refresh grid when external filters change
	useEffect(() => {
		if (gridRef.current?.api && !isLoading) {
			console.log("[DrillHoleListView] Updating datasource with new filters:", {
				searchQuery,
				statusFilters,
			});
			// Recreate datasource with new filters
			const newDatasource = createDatasource();
			gridRef.current.api.updateGridOptions({
				serverSideDatasource: newDatasource,
			});
		}
	}, [searchQuery, statusFilters, isLoading, createDatasource]);

	// Grid ready handler
	const onGridReady = useCallback(
		(params: GridReadyEvent) => {
			console.log("[DrillHoleListView] Grid ready, setting SSRM datasource");
			const datasource = createDatasource();
			// AG Grid 35.0 uses gridOptions to set datasource
			if (gridRef.current) {
				gridRef.current.api.updateGridOptions({
					serverSideDatasource: datasource,
				});
			}
		},
		[createDatasource],
	);

	// First data rendered handler
	const onFirstDataRendered = useCallback(() => {
		console.log("[DrillHoleListView] First data rendered");
		setIsLoading(false);
	}, []);

	// Refresh handler
	const handleRefresh = useCallback(() => {
		console.log("[DrillHoleListView] Manual refresh triggered");
		if (gridRef.current?.api) {
			gridRef.current.api.refreshServerSide({ purge: true });
		}
	}, []);

	// Column definitions
	const columnDefs = useMemo<ColDef[]>(
		() => [
			{
				headerName: "Collar ID",
				field: "CollarId",
				width: 250,
				hide: true,
			},
			{
				headerName: "Hole ID",
				field: "HoleNm",
				width: 80,
				pinned: "left",
				cellRenderer: safeCellRenderer((params: any) => {
					return (
						<a
							href="#"
							onClick={(e) => {
								e.preventDefault();
								console.log("[DrillHoleListView] Navigating to drill hole:", params.data.DrillHoleId);
								navigate(`/drill-hole/${params.data.DrillHoleId}`);
							}}
						>
							{params.value || "N/A"}
						</a>
					);
				}),
			},
			{
				headerName: "Planned",
				field: "PlannedHoleNm",
				width: 80,
			},
			{
				headerName: "Project",
				field: "Project",
				width: 150,
				filter: "agTextColumnFilter",
				floatingFilter: true,
				filterParams: {
					filterOptions: ["contains", "notContains", "equals", "notEqual", "startsWith", "endsWith"],
					defaultOption: "contains",
					maxNumConditions: 2,
					buttons: ["apply", "reset"],
				},
			},
			{
				headerName: "Prospect",
				field: "Prospect",
				width: 150,
				filter: "agTextColumnFilter",
				floatingFilter: true,
				filterParams: {
					filterOptions: ["contains", "notContains", "equals", "notEqual", "startsWith", "endsWith"],
					defaultOption: "contains",
					maxNumConditions: 2,
					buttons: ["apply", "reset"],
				},
			},
			{
				headerName: "Target",
				field: "Target",
				width: 150,
				filter: "agTextColumnFilter",
				floatingFilter: true,
				filterParams: {
					filterOptions: ["contains", "notContains", "equals", "notEqual", "startsWith", "endsWith"],
					defaultOption: "contains",
					maxNumConditions: 2,
					buttons: ["apply", "reset"],
				},
			},
			{
				headerName: "Type",
				field: "HoleType",
				width: 120,
				filter: "agTextColumnFilter",
				floatingFilter: true,
				filterParams: {
					filterOptions: ["equals", "notEqual", "contains", "notContains"],
					defaultOption: "equals",
					maxNumConditions: 2,
					buttons: ["apply", "reset"],
				},
			},
			{
				headerName: "Status",
				field: "HoleStatus",
				width: 120,
				filter: "agTextColumnFilter",
				floatingFilter: true,
				filterParams: {
					filterOptions: ["equals", "notEqual", "contains", "notContains"],
					defaultOption: "equals",
					maxNumConditions: 2,
					buttons: ["apply", "reset"],
				},
				cellStyle: params =>
					params.value
						? {
							display: "flex",
							alignItems: "center",
							color: getHoleStatusColors2(params.value).text,
							border: `1px solid ${getHoleStatusColors2(params.value).border}`,
							backgroundColor: getHoleStatusColors2(params.value).bg,
						}
						: undefined,
			},
			{
				headerName: "Purpose",
				field: "HolePurpose",
				width: 150,
			},
			{
				headerName: "Depth (m)",
				field: "TotalDepth",
				width: 100,
				valueFormatter: params => (params.value ? `${params.value}m` : ""),
			},
			{
				headerName: "Started",
				field: "StartedOnDt",
				width: 120,
				valueFormatter: params =>
					params.value ? new Date(params.value).toLocaleDateString() : "",
			},
			{
				headerName: "Finished",
				field: "FinishedOnDt",
				width: 120,
				valueFormatter: params =>
					params.value ? new Date(params.value).toLocaleDateString() : "",
			},
			{
				headerName: "Organization",
				field: "Organization",
				width: 150,
			},
		],
		[navigate],
	);

	// Filter tabs configuration
	const filterTabs: { key: HoleStatusFilter, label: string, color: string }[] = [
		{ key: "all", label: "All", color: "#8c8c8c" },
		{ key: "planned", label: "Planned", color: "#4a90c8" },
		{ key: "inprogress", label: "In Progress", color: "#52c41a" },
	];

	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Drill Holes"
					description={error}
					type="error"
					showIcon
				// action={
				//   <Button onClick={loadDrillHoles} loading={isLoading}>
				//     Retry
				//   </Button>
				// }
				/>
			</div>
		);
	}

	return (
		<div
			style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}
		>
			{/* Header */}
			<div
				style={{
					marginBottom: "16px",
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
				}}
			>
				<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>Drill Holes</h1>

				<Space>
					<Button
						icon={<ReloadOutlined />}
						onClick={handleRefresh}
						loading={isLoading}
					>
						Refresh
					</Button>
					{/* Optional: Add create button if needed */}
					{/* <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/drill-hole/new')}>
            Create Hole
          </Button> */}
				</Space>
			</div>

			{/* Search and filters */}
			<div style={{ marginBottom: "16px" }}>
				<Space direction="vertical" style={{ width: "100%" }} size="middle">
					<Search
						placeholder="Search by hole name, project, or target..."
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						onSearch={value => setSearchQuery(value)}
						allowClear
						style={{ width: "400px" }}
					/>

					<Space size="middle">
						{filterTabs.map(tab => (
							<Tag
								key={tab.key}
								color={activeFilter === tab.key ? tab.color : undefined}
								onClick={() => setActiveFilter(tab.key)}
								style={{
									fontSize: "12px",
									padding: "4px 12px",
									borderRadius: "12px",
									cursor: "pointer",
									border:
										activeFilter === tab.key
											? `2px solid ${tab.color}`
											: "1px solid #d9d9d9",
									backgroundColor: activeFilter === tab.key ? tab.color : "#fafafa",
									color: activeFilter === tab.key ? "#fff" : "#595959",
									fontWeight: activeFilter === tab.key ? 600 : 400,
								}}
							>
								{tab.label}
							</Tag>
						))}
					</Space>
				</Space>
			</div>

			{/* AG Grid with SSRM */}
			<div style={{ flex: 1, width: "100%", position: "relative", minHeight: 0, height: "100%" }}>
				<AgGridReact
					ref={gridRef}
					columnDefs={columnDefs}
					rowModelType="serverSide"
					cacheBlockSize={100}
					maxBlocksInCache={10}
					pagination={true}
					paginationPageSize={100}
					paginationPageSizeSelector={[50, 100, 200, 500]}
					suppressPaginationPanel={false}
					getRowId={params => params.data.CollarId}
					onGridReady={onGridReady}
					onFirstDataRendered={onFirstDataRendered}
					{...getCommonGridProps()}
					animateRows={true}
				/>
			</div>
		</div>
	);
}
