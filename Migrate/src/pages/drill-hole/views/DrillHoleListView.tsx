/**
 * DrillHoleListView Component
 *
 * Main list view with AG Grid Server-Side Row Model (SSRM), filtering, and search capabilities.
 * Displays collar data with status filtering and server-side data handling.
 */

import { Alert, Button, Input, Space, Tag, message } from "antd";
import { AllEnterpriseModule, ModuleRegistry } from "ag-grid-enterprise";
import type { ColDef, GridReadyEvent } from "ag-grid-enterprise";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAllDrillHolesLocal, fetchDrillHolesSSRM } from "../utils/ssrm-adapter";

import { AgGridReact } from "ag-grid-react";
import { ReloadOutlined } from "@ant-design/icons";
import type { UiDrillHole } from "#src/api/database/data-contracts";
import { getCommonGridProps } from "#src/config/ag-grid-config";
import { getStatusColors } from "#src/pages/_shared/utils/misc.js";
import { safeCellRenderer } from "#src/pages/_shared/utils/agGridUtils";
import { useNavigate } from "react-router";
import { useServerSideDatasource } from "#src/pages/_shared/hooks/useServerSideDatasource";

// Register AG Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

const { Search } = Input;

type DrillHoleListItem = UiDrillHole;
type HoleStatusFilter = "all" | "planned" | "inprogress";

export function DrillHoleListView(): JSX.Element {
	console.log("[DrillHoleListView] ===== Component Rendering =====");

	const gridRef = useRef<AgGridReact>(null);
	const navigate = useNavigate();

	// Local state for external filters
	const [drillHoles, setDrillHoles] = useState<DrillHoleListItem[]>([]);
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

	console.log("[DrillHoleListView] State:", {
		drillHolesCount: drillHoles.length,
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
							backgroundColor: getStatusColors(params.value).bg,
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
			<div style={{ flex: 1, width: "100%", position: "relative" }}>
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
					onGridReady={onGridReady}
					onFirstDataRendered={onFirstDataRendered}
					{...getCommonGridProps()}
				/>
			</div>
		</div>
	);
}
