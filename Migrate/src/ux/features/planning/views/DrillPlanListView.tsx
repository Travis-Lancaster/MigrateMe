/**
 * DrillPlanListView Component - Cache-Aside Pattern with Auto-Refresh
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

// import { Alert, Button, Dropdown, Input, Space, Tag, message } from 'antd';
// import { AllEnterpriseModule, ModuleRegistry } from 'ag-grid-enterprise';
// import type { ColDef, IServerSideDatasource, IServerSideGetRowsParams } from 'ag-grid-enterprise';
// import {
// 	DownloadOutlined,
// 	PlusOutlined,
// 	ReloadOutlined,
// 	ThunderboltOutlined
// } from '@ant-design/icons';
// import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// import { AgGridReact } from 'ag-grid-react';
// import { BulkCreateModal } from '../components/BulkCreateModal';
// import { DrillPlanFilterType } from '../types';
// import type { MenuProps } from 'antd';
// import { HoleStatusBadge } from '#src/ux/shared/components/index.js';
// import { getHoleStatusColor } from '#src/ux/core/constants/drill-plan-status.js';
//  */

// import { DrillPlanFilterType } from '../types';
// // import { DrillPlanListViewService } from '#src/data/domain/drill-plan/drill-plan-list.service.js';
// import { HoleStatusBadge } from '#src/ux/shared/components/index.js';
import type { VwDrillPlan } from "#src/data/api/database/data-contracts.js";
import type { ColDef, GridReadyEvent } from "ag-grid-enterprise";
import type { MenuProps } from "antd";
import type { DrillPlanFilterType } from "../types";
import { fetchAllDrillPlanLocal, fetchDrillPlanSSRM } from "#src/data/domain/drill-plan/drill-plan-ssrm.service.js";
import { db } from "#src/data/index";
import { getCommonGridProps } from "#src/ux/config/ag-grid-config";

import { useServerSideDatasource } from "#src/ux/core/hooks/useServerSideDatasource.js";
import { getHoleStatusColor } from "#src/ux/core/index.js";
import { HoleStatusBadge } from "#src/ux/shared/components/index.js";
import { safeCellRenderer } from "#src/ux/shared/util/grid-util";
import { DownloadOutlined, PlusOutlined, ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { AllEnterpriseModule, ModuleRegistry } from "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { Button, Dropdown, Input, message, Space, Tag } from "antd";
import { useLiveQuery } from "dexie-react-hooks";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

// import { fetchAllDrillPlanLocal, fetchDrillPlanSSRM } from '#src/data/domain/drill-plan';
// import { getHoleStatusColor, getHoleStatusColors2 } from '#src/ux/core/index';

// Register AG Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

const { Search } = Input;

type HoleStatusFilter = "all" | "planned" | "inprogress";

export function DrillPlanListView(): JSX.Element {
	console.log("[DrillPlanListView] Component rendering");

	const gridRef = useRef<AgGridReact>(null);
	const navigate = useNavigate();

	// Local state for filters
	const [activeFilter, setActiveFilter] = useState<DrillPlanFilterType>("All");
	const [searchQuery, setSearchQuery] = useState("");
	const [bulkCreateVisible, setBulkCreateVisible] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const statusFilters = useMemo(() => {
		if (activeFilter === "All")
			return [];
		return [activeFilter];
	}, [activeFilter]);

	// Track filter state for server - side datasource
	const filtersRef = useRef({ status: statusFilters, searchText: searchQuery });

	// Update filters ref when they change
	useEffect(() => {
		filtersRef.current = { status: statusFilters, searchText: searchQuery };
	}, [statusFilters, searchQuery]);

	// Create SSRM datasource - recreate when filters change
	const datasourceConfig = useMemo(() => ({
		fetchData: fetchDrillPlanSSRM,
		fallbackFetch: fetchAllDrillPlanLocal,
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

	// ============================================
	// LiveQuery: Watch Dexie for sync updates
	// ============================================
	// When dexie-syncable updates local cache, this triggers
	// and causes the grid to refresh with new data
	const dexieData = useLiveQuery(() => {
		console.log("[DrillPlanListView] 👀 LiveQuery watching for sync updates");
		return db.Planning_DrillPlan.limit(1).toArray();
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
			console.log("[DrillPlanListView] 🔄 Cache updated by sync - auto-refreshing grid", {
				recordCount: dexieData.length,
			});

			// Refresh grid to show updated data from cache
			// purge: true ensures we reload from cache (not stale in-memory data)
			gridRef.current.api.refreshServerSide({ purge: true });
		}
	}, [dexieData, isLoading]);

	console.log("[DrillPlanListView] State:", {
		dexieDataCount: dexieData?.length || 0,
		activeFilter,
		filtersRef,
		searchQuery,
		isLoading,
	});

	// Update datasource and refresh grid when external filters change
	useEffect(() => {
		if (gridRef.current?.api && !isLoading) {
			console.log("[DrillPlanListView] Updating datasource with new filters:", {
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
			console.log("[DrillPlanListView] Grid ready, setting SSRM datasource");
			// console.log('[DrillPlanListView] Grid element classes:', params.api.getGridElement()?.className);
			// console.log('[DrillPlanListView] Grid theme from API:', (params.api as any).gos?.get('theme'));

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

	// Refresh grid when f / ilters change
	useEffect(() => {
		if (gridRef.current?.api) {
			console.log("[DrillPlanListView] Filters changed, refreshing grid");
			gridRef.current.api.refreshServerSide({ purge: true });
		}
	}, [statusFilters, searchQuery]);

	// Debounced search handler
	const debouncedSearch = useMemo(() => {
		let timeout: NodeJS.Timeout;
		return (value: string) => {
			clearTimeout(timeout);
			timeout = setTimeout(() => {
				console.log("[DrillPlanListView] Debounced search", { value });
				setSearchQuery(value);
			}, 300);
		};
	}, []);

	// Refresh handler
	const handleRefresh = useCallback(() => {
		console.log("[DrillPlanListView] Manual refresh triggered");
		gridRef.current?.api?.refreshServerSide({ purge: true });
	}, []);
	// First data rendered handler
	const onFirstDataRendered = useCallback(() => {
		console.log("[DrillPlanListView] First data rendered");
		setIsLoading(false);
	}, []);

	// ✅ CORRECT: Column definitions using camelCase field names (from business types)
	const columnDefs: ColDef<VwDrillPlan>[] = [
		{
			headerName: "Plan ID",
			field: "DrillPlanId",
			width: 200,
			hide: true,
		},
		{
			headerName: "Planned Hole",
			field: "PlannedHoleNm", // ✅ camelCase
			width: 150,
			pinned: "left",
			cellRenderer: safeCellRenderer((params: any) => {
				return (
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							console.log("[DrillPlanListView] Navigating to plan:", params.data.DrillPlanId);
							navigate(`/drill-plan/${params.data.DrillPlanId}`);
						}}
						className="text-blue-600 hover:text-blue-800"
					>
						{params.value || "N/A"}
					</a>
				);
			}),
		},
		{
			headerName: "Actual Hole ID",
			field: "HoleNm", // ✅ camelCase (maps from API's HoleNm)
			width: 150,
			cellRenderer: safeCellRenderer((params: any) => {
				if (!params.value)
					return <span className="text-gray-400">—</span>;
				return <span className="font-medium">{params.value}</span>;
			}),
		},
		{
			headerName: "Proposed",
			field: "ProposedHoleNm", // ✅ camelCase
			width: 130,
			cellRenderer: safeCellRenderer((params: any) => {
				if (!params.value)
					return <span className="text-gray-400">—</span>;
				return <span className="text-gray-600">{params.value}</span>;
			}),
		},
		{
			headerName: "Status",
			field: "HoleStatus", // ✅ camelCase
			width: 130,
			filter: "agTextColumnFilter",
			floatingFilter: true,
			cellRenderer: safeCellRenderer((params: any) => {
				if (!params.value)
					return null;
				return <HoleStatusBadge status={params.value} />;
			}),
			cellStyle: (params) => {
				if (!params.value)
					return undefined;
				return {
					display: "flex",
					alignItems: "center",
					backgroundColor: `${getHoleStatusColor(params.value)}15`, // 15% opacity
				};
			},
		},
		{
			headerName: "Project",
			field: "Project",
			width: 150,
			filter: "agTextColumnFilter",
			floatingFilter: true,
		},
		{
			headerName: "Target",
			field: "Target",
			width: 150,
			filter: "agTextColumnFilter",
			floatingFilter: true,
		},
		{
			headerName: "Depth (m)",
			field: "PlannedTotalDepth",
			width: 120,
			type: "numericColumn",
			valueFormatter: params => params.value ? `${params.value.toFixed(0)}m` : "",
		},
		{
			headerName: "Dip (°)",
			field: "PlannedDip",
			width: 100,
			type: "numericColumn",
			valueFormatter: params => params.value ? `${params.value.toFixed(0)}°` : "",
		},
		{
			headerName: "Azimuth (°)",
			field: "PlannedAzimuth",
			width: 120,
			type: "numericColumn",
			valueFormatter: params => params.value ? `${params.value.toFixed(0)}°` : "",
		},
		{
			headerName: "Start Date",
			field: "PlannedStartDt",
			width: 120,
			valueFormatter: params => params.value ? new Date(params.value).toLocaleDateString() : "",
		},
		{
			headerName: "Planned By",
			field: "PlannedBy",
			width: 140,
		},
		{
			headerName: "Modified",
			field: "ModifiedOnDt",
			width: 160,
			valueFormatter: params => params.value ? new Date(params.value).toLocaleString() : "",
		},
	];

	// Filter tabs configuration
	const filterTabs: { key: DrillPlanFilterType, label: string, color: string }[] = [
		{ key: "All", label: "All", color: "#8c8c8c" },
		{ key: "Draft", label: "Draft", color: "#a8a8a8" },
		{ key: "Planned", label: "Planned", color: "#4a90c8" },
		{ key: "In Progress", label: "In Progress", color: "#52c41a" },
		{ key: "Completed", label: "Completed", color: "#389e0d" },
		{ key: "Exceptions", label: "Exceptions", color: "#ff7875" },
	];

	const exportMenuItems: MenuProps["items"] = [
		{
			key: "excel",
			label: "Export to Excel/CSV",
			onClick: () => {
				console.log("[DrillPlanListView] Export to Excel");
				message.info("Export functionality to be implemented");
			},
		},
	];

	return (
		<div className="p-4 h-full flex flex-col">
			{/* Header */}
			<div className="mb-4 flex justify-between items-center">
				<div>
					<h1 className="text-2xl font-semibold m-0">Drill Plans</h1>
					<div className="mt-1 text-sm text-gray-500">
						☁️ Server-Side Pagination •
						{" "}
						{activeFilter !== "All" ? `Filtered by ${activeFilter}` : "All plans"}
					</div>
				</div>

				<Space>
					<Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
						<Button icon={<DownloadOutlined />}>
							Export
						</Button>
					</Dropdown>
					<Button
						icon={<ReloadOutlined />}
						onClick={() => {
							console.log("[DrillPlanListView] Manual refresh triggered");
							gridRef.current?.api?.refreshServerSide({ purge: true });
						}}
					>
						Refresh
					</Button>
					<Button
						icon={<ThunderboltOutlined />}
						onClick={() => setBulkCreateVisible(true)}
						className="border-blue-500 text-blue-500"
					>
						Bulk Create
					</Button>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => navigate("/exploration/planning/plans/new")}
					>
						Create Plan
					</Button>
				</Space>
			</div>

			{/* Search and filters */}
			<div className="mb-4">
				<Space direction="vertical" className="w-full" size="middle">
					<Search
						placeholder="Search by hole name, project, target..."
						value={searchQuery}
						onChange={(e) => {
							setSearchQuery(e.target.value);
							debouncedSearch(e.target.value);
						}}
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
					paginationPageSize={10}
					paginationPageSizeSelector={[10, 50, 100, 200, 500]}
					suppressPaginationPanel={false}
					getRowId={params => params.data.DrillPlanId as string}
					onGridReady={onGridReady}
					onFirstDataRendered={onFirstDataRendered}
					{...getCommonGridProps()}
					animateRows={true}
				/>
			</div>
		</div>
	);
}
