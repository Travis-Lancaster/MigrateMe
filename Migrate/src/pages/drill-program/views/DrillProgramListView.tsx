/**
 * DrillProgramListView Component
 *
 * List view for drill programs with AG Grid, pagination, filtering, and search.
 * Follows the same pattern as DrillPlanListView.
 */

import { Alert, Button, Input, Space, Spin } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import React, { useCallback, useMemo } from "react";

import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-enterprise";
import type { DrillProgram } from "../types";
import { getCommonGridProps } from "#src/config/ag-grid-config";
import { useDrillProgramList } from "../hooks";
import { useDrillProgramStore } from "../store/drill-program-store";
import { useNavigate } from "react-router";

// Safe cell renderer wrapper (consistent with drill-plan)
function safeCellRenderer(renderer: (params: any) => any) {
	return (params: any) => {
		try {
			if (!params.data)
				return null;
			return renderer(params);
		}
		catch (error) {
			console.error("[DrillProgramListView] Cell renderer error:", error);
			return "Error";
		}
	};
}

export const DrillProgramListView: React.FC = () => {
	const navigate = useNavigate();
	const { programs, isLoading, error, pagination, loadPage } = useDrillProgramList();
	const { searchQuery, setSearchQuery, applyFilters } = useDrillProgramStore();

	// Handle search with debounce effect
	const handleSearch = useCallback((value: string) => {
		setSearchQuery(value);
		// Debounce is handled in the store via the applyFilters action
		const timer = setTimeout(() => {
			applyFilters();
		}, 500);
		return () => clearTimeout(timer);
	}, [setSearchQuery, applyFilters]);

	// Column definitions
	const columnDefs: ColDef<DrillProgram>[] = useMemo(() => [
		{
			headerName: "Program Name",
			field: "DrillProgram",
			width: 200,
			cellRenderer: safeCellRenderer((params: any) => {
				return (
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							console.log("[DrillProgramListView] Navigating to program:", params.data.DrillProgramId);
							navigate(`/drill-program/${params.data.DrillProgramId}`);
						}}
					>
						{params.value || "N/A"}
					</a>
				);
			}),
		},
		{
			headerName: "Program Code",
			field: "ProgramCode",
			width: 150,
		},
		{
			headerName: "Organization",
			field: "Organization",
			width: 150,
		},
		{
			headerName: "Project",
			field: "Project",
			width: 150,
		},
		{
			headerName: "Status",
			field: "Status",
			width: 120,
		},
		{
			headerName: "Contractor",
			field: "Contractor",
			width: 150,
		},
		{
			headerName: "Program Type",
			field: "ProgramType",
			width: 150,
		},
		{
			headerName: "Planned Start",
			field: "PlannedStart",
			width: 150,
			valueFormatter: params =>
				params.value ? new Date(params.value).toLocaleDateString() : "N/A",
		},
		{
			headerName: "Planned End",
			field: "PlannedEnd",
			width: 150,
			valueFormatter: params =>
				params.value ? new Date(params.value).toLocaleDateString() : "N/A",
		},
		{
			headerName: "Budget",
			field: "Budget",
			width: 120,
			valueFormatter: params =>
				params.value ? `$${params.value.toLocaleString()}` : "N/A",
		},
		{
			headerName: "Created By",
			field: "CreatedBy",
			width: 150,
		},
		{
			headerName: "Created On",
			field: "CreatedOnDt",
			width: 150,
			valueFormatter: params =>
				params.value ? new Date(params.value).toLocaleDateString() : "N/A",
		},
	], [navigate]);

	// Data validation
	if (!Array.isArray(programs)) {
		console.error("[DrillProgramListView] ❌ Invalid programs data:", programs);
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Data Error"
					description="Invalid drill program data structure. Please refresh the page."
					type="error"
					showIcon
					action={(
						<Button onClick={() => window.location.reload()} loading={isLoading}>
							Refresh
						</Button>
					)}
				/>
			</div>
		);
	}

	console.log("[DrillProgramListView] Rendering with:", {
		programsCount: programs.length,
		pagination,
		isLoading,
	});

	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Programs"
					description={error}
					type="error"
					showIcon
					action={(
						<Button onClick={() => window.location.reload()}>
							Refresh
						</Button>
					)}
				/>
			</div>
		);
	}

	return (
		<div style={{ padding: "24px", height: "100%", display: "flex", flexDirection: "column" }}>
			{/* Header */}
			<div style={{ marginBottom: "16px" }}>
				<Space style={{ width: "100%", justifyContent: "space-between" }}>
					<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
						Drill Programs
					</h1>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => navigate("/drill-program/new")}
					>
						Create Program
					</Button>
				</Space>
			</div>

			{/* Search and Filters */}
			<div style={{ marginBottom: "16px" }}>
				<Space>
					<Input
						placeholder="Search programs..."
						prefix={<SearchOutlined />}
						value={searchQuery}
						onChange={e => handleSearch(e.target.value)}
						style={{ width: 300 }}
						allowClear
					/>
					{/* TODO: Add advanced filter button */}
				</Space>
			</div>

			{/* Loading State */}
			{isLoading && programs.length === 0 && (
				<div style={{ textAlign: "center", padding: "40px" }}>
					<Spin size="large" />
					<p style={{ marginTop: "16px" }}>Loading drill programs...</p>
				</div>
			)}

			{/* Grid */}
			{!isLoading || programs.length > 0 ? (
				<div style={{ flex: 1, minHeight: "400px" }}>
					<AgGridReact
						{...getCommonGridProps()}
						rowData={programs}
						columnDefs={columnDefs}
						pagination={true}
						paginationPageSize={pagination.take}
						paginationPageSizeSelector={[10, 20, 50, 100]}
						suppressPaginationPanel={false}
						domLayout="normal"
						loading={isLoading}
						onGridReady={(params) => {
							console.log("[AG Grid] ✅ Grid ready", {
								rowCount: params.api.getDisplayedRowCount(),
							});
							// Set total row count for server-side pagination
							if (pagination.itemCount > 0) {
								params.api.setGridOption("paginationPageSize", pagination.take);
							}
						}}
						onPaginationChanged={(params) => {
							const currentPage = params.api.paginationGetCurrentPage() + 1;
							const pageSize = params.api.paginationGetPageSize();
							console.log("[AG Grid] Pagination changed:", { currentPage, pageSize });
							if (currentPage !== pagination.page || pageSize !== pagination.take) {
								loadPage(currentPage, pageSize);
							}
						}}
					/>
				</div>
			) : null}

			{/* No Data Message */}
			{!isLoading && programs.length === 0 && (
				<div style={{ textAlign: "center", padding: "40px" }}>
					<p>No drill programs found. Create your first program to get started.</p>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => navigate("/drill-program/new")}
						style={{ marginTop: "16px" }}
					>
						Create Program
					</Button>
				</div>
			)}
		</div>
	);
};
