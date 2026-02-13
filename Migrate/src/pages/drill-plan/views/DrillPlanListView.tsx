/**
 * DrillPlanListView Component
 *
 * Main list view with AG Grid Server-Side Row Model (SSRM), filtering, and bulk operations
 */

import { AllEnterpriseModule, ModuleRegistry } from "ag-grid-enterprise";
import { Button, Dropdown, Input, Space, Tag, message } from "antd";
import type { ColDef, GridReadyEvent } from "ag-grid-enterprise";
import { DownloadOutlined, PlusOutlined, ReloadOutlined, ThunderboltOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchAllDrillPlansLocal, fetchDrillPlansSSRM } from "../utils/ssrm-adapter";

import { AgGridReact } from "ag-grid-react";
import { BulkCreateModal } from "../components/BulkCreateModal";
import type { DrillPlanFilterType } from "../types";
import type { MenuProps } from "antd";
import { QuickCreateButton } from "../components/QuickCreateButton";
import { exportToExcel } from "../utils/exportUtils";
import { getCommonGridProps } from "#src/config/ag-grid-config";
import { getStatusColors } from "#src/pages/_shared/utils/misc.js";
import { safeCellRenderer } from "#src/pages/_shared/utils/agGridUtils";
import { useNavigate } from "react-router";
import { usePermissions } from "../hooks/usePermissions";
import { useServerSideDatasource } from "#src/pages/_shared/hooks/useServerSideDatasource";

// Register AG Grid modules
ModuleRegistry.registerModules([AllEnterpriseModule]);

const { Search } = Input;

export const DrillPlanListView: React.FC = () => {
	console.log("[DrillPlanListView] ===== Component Rendering (SSRM Mode) =====");

	const gridRef = useRef<AgGridReact>(null);
	const navigate = useNavigate();

	// Local state for external filters
	const [activeFilter, setActiveFilter] = useState<DrillPlanFilterType>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [isInitialLoading, setIsInitialLoading] = useState(true);

	// Convert chip filters to array
	const statusFilters = useMemo(() => {
		if (activeFilter === "all")
			return [];
		return [activeFilter];
	}, [activeFilter]);

	const { canCreate } = usePermissions();
	const [bulkCreateVisible, setBulkCreateVisible] = useState(false);
	const ref = useRef<HTMLDivElement>(null);

	// Create SSRM datasource - recreate when filters change
	const datasourceConfig = useMemo(() => ({
		fetchData: fetchDrillPlansSSRM,
		fallbackFetch: fetchAllDrillPlansLocal,
		onError: (error: Error) => {
			message.error(`Failed to load drill plans: ${error.message}`);
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
		console.log("[DrillPlanListView] ✅ Component MOUNTED (SSRM)");
		return () => {
			console.log("[DrillPlanListView] ❌ Component UNMOUNTING");
		};
	}, []);

	// Update datasource and refresh grid when external filters change
	useEffect(() => {
		if (gridRef.current?.api && !isInitialLoading) {
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
	}, [searchQuery, statusFilters, isInitialLoading, createDatasource]);

	// Grid ready handler
	const onGridReady = useCallback(
		(params: GridReadyEvent) => {
			console.log("[DrillPlanListView] Grid ready, setting SSRM datasource");
			const datasource = createDatasource();
			// AG Grid 35.0 uses updateGridOptions to set datasource
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
		console.log("[DrillPlanListView] First data rendered");
		setIsInitialLoading(false);
	}, []);

	// Refresh handler
	const handleRefresh = useCallback(() => {
		console.log("[DrillPlanListView] Manual refresh triggered");
		if (gridRef.current?.api) {
			gridRef.current.api.refreshServerSide({ purge: true });
		}
	}, []);

	const columnDefs: ColDef[] = [
		// {
		//   headerName: '',
		//   checkboxSelection: true,
		//   headerCheckboxSelection: true,
		//   width: 50,
		//   pinned: 'left',
		//   lockPosition: true,
		// },
		{
			headerName: "Plan ID",
			field: "DrillPlanId",
			width: 200,
			hide: true,
		},

		{
			headerName: "Planned",
			field: "PlannedHoleNm",
			width: 80,
			cellRenderer: safeCellRenderer((params: any) => {
				return (
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							console.log("[DrillPlanListView] Navigating to plan:", params.data.DrillPlanId);
							navigate(`/drill-plan/${params.data.DrillPlanId}`);
						}}
					>
						{params.value || "N/A"}
					</a>
				);
			}),
		},
		{
			headerName: "Hole Id",
			field: "HoleNm",
			width: 80,

		},
		{
			headerName: "Proposed",
			field: "ProposedHoleNm",
			width: 80,
		},
		{
			headerName: "ODSPriority",
			field: "ODSPriority",
			width: 100,
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
			headerName: "Status",
			field: "DrillPlanStatus",
			width: 120,
			filter: "agTextColumnFilter",
			floatingFilter: true,
			filterParams: {
				filterOptions: ["equals", "notEqual", "contains", "notContains"],
				defaultOption: "equals",
				maxNumConditions: 2,
				buttons: ["apply", "reset"],
			},
			cellStyle: params => params.value ? { display: "flex", alignItems: "center", backgroundColor: getStatusColors(params.value).bg } : undefined,
		},
		{
			headerName: "Depth (m)",
			field: "PlannedTotalDepth",
			width: 120,
			valueFormatter: params => params.value ? `${params.value}m` : "",
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
			width: 140,
			valueFormatter: params => params.value ? new Date(params.value).toLocaleString() : "",
		},
	];

	const filterTabs: { key: DrillPlanFilterType, label: string, color: string }[] = [
		{ key: "all", label: "All", color: "#8c8c8c" },
		{ key: "draft", label: "Draft", color: "#a8a8a8" },
		{ key: "planned", label: "Planned", color: "#4a90c8" },
		{ key: "inprogress", label: "In Progress", color: "#52c41a" },
		{ key: "completed", label: "Completed", color: "#389e0d" },
		{ key: "exceptions", label: "Exceptions", color: "#ff7875" },
	];

	const exportMenuItems: MenuProps["items"] = [
		{
			key: "excel",
			label: "Export to Excel/CSV",
			onClick: () => exportToExcel(),
		},
	];

	return (
		<div style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column" }}>
			{/* Header */}
			<div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
				<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>Drill Plans (SSRM)</h1>

				<Space>
					<Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
						<Button icon={<DownloadOutlined />}>
							Export
						</Button>
					</Dropdown>
					<Button
						icon={<ReloadOutlined />}
						onClick={handleRefresh}
						loading={isInitialLoading}
					>
						Refresh
					</Button>
					{canCreate() && (
						<>
							<Button
								icon={<ThunderboltOutlined />}
								onClick={() => setBulkCreateVisible(true)}
								style={{
									borderColor: "#1890ff",
									color: "#1890ff",
								}}
							>
								Bulk Create
							</Button>
							<QuickCreateButton disabled={false} />
							<Button
								type="primary"
								icon={<PlusOutlined />}
								onClick={() => navigate("/drill-plan/new")}
							>
								Create Plan
							</Button>
						</>
					)}
				</Space>
			</div>

			{/* Search and filters */}
			<div style={{ marginBottom: "16px" }}>
				<Space direction="vertical" style={{ width: "100%" }} size="middle">
					<Search
						placeholder="Search by hole name, project, target, or planner..."
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
									border: activeFilter === tab.key ? `2px solid ${tab.color}` : "1px solid #d9d9d9",
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
			<div ref={ref} style={{ flex: 1, width: "100%", position: "relative" }}>
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
					rowSelection="multiple"
					suppressRowClickSelection={true}
					onGridReady={onGridReady}
					onFirstDataRendered={onFirstDataRendered}
					{...getCommonGridProps()}
				/>
			</div>

			{/* Bulk Create Modal */}
			<BulkCreateModal
				visible={bulkCreateVisible}
				onClose={() => setBulkCreateVisible(false)}
				onSuccess={() => {
					setBulkCreateVisible(false);
					handleRefresh(); // Reload grid to show new plans
				}}
			/>
		</div>
	);
};
