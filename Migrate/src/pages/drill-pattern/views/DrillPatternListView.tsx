/**
 * DrillPatternListView Component
 *
 * List view for drill patterns with AG Grid, pagination, filtering, and search.
 * Includes program filter dropdown.
 */

import { Alert, Button, Input, Select, Space, Spin } from "antd";
import { PlusOutlined, SearchOutlined } from "@ant-design/icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-enterprise";
import type { DrillPattern } from "../types";
import type { DrillProgram } from "#src/pages/drill-program/types";
import { drillProgramService } from "#src/pages/drill-program/services";
import { getCommonGridProps } from "#src/config/ag-grid-config";
import { safeCellRenderer } from "#src/pages/_shared/utils/agGridUtils";
import { useDrillPatternList } from "../hooks";
import { useDrillPatternStore } from "../store/drill-pattern-store";
import { useNavigate } from "react-router";

export const DrillPatternListView: React.FC = () => {
	const navigate = useNavigate();
	const { patterns, isLoading, error, pagination, programFilter, loadPage } = useDrillPatternList();
	const { searchQuery, setSearchQuery, setProgramFilter, applyFilters } = useDrillPatternStore();
	const [programs, setPrograms] = useState<DrillProgram[]>([]);
	const [loadingPrograms, setLoadingPrograms] = useState(false);

	// Load programs for filter
	useEffect(() => {
		const loadPrograms = async () => {
			setLoadingPrograms(true);
			try {
				const response = await drillProgramService.findAll(1, 1000);
				setPrograms(response.data);
			}
			catch (error) {
				console.error("[DrillPatternListView] Failed to load programs:", error);
			}
			finally {
				setLoadingPrograms(false);
			}
		};
		loadPrograms();
	}, []);

	// Handle search with debounce effect
	const handleSearch = useCallback((value: string) => {
		setSearchQuery(value);
		// Debounce is handled in the store via the applyFilters action
		const timer = setTimeout(() => {
			applyFilters();
		}, 500);
		return () => clearTimeout(timer);
	}, [setSearchQuery, applyFilters]);

	// Handle program filter change
	const handleProgramFilterChange = useCallback((programId: string | null) => {
		setProgramFilter(programId);
		applyFilters();
	}, [setProgramFilter, applyFilters]);

	// Column definitions
	const columnDefs: ColDef<DrillPattern>[] = useMemo(() => [
		{
			headerName: "Pattern Name",
			field: "DrillPattern",
			width: 200,
			cellRenderer: safeCellRenderer((params: any) => {
				return (
					<a
						href="#"
						onClick={(e) => {
							e.preventDefault();
							console.log("[DrillPatternListView] Navigating to pattern:", params.data.DrillPatternId);
							navigate(`/drill-pattern/${params.data.DrillPatternId}`);
						}}
					>
						{params.value || "N/A"}
					</a>
				);
			}),
		},
		{
			headerName: "Pattern Code",
			field: "DrillPatternCode",
			width: 150,
		},
		{
			headerName: "Drill Program",
			field: "DrillProgram",
			width: 180,
		},
		{
			headerName: "Organization",
			field: "Organization",
			width: 150,
		},
		{
			headerName: "Target",
			field: "Target",
			width: 150,
		},
		{
			headerName: "Pattern Type",
			field: "DrillPatternType",
			width: 150,
		},
		{
			headerName: "Spacing X (m)",
			field: "SpacingX",
			width: 130,
			valueFormatter: params =>
				params.value != null ? params.value.toFixed(2) : "N/A",
		},
		{
			headerName: "Spacing Y (m)",
			field: "SpacingY",
			width: 130,
			valueFormatter: params =>
				params.value != null ? params.value.toFixed(2) : "N/A",
		},
		{
			headerName: "Orientation (°)",
			field: "Orientation",
			width: 130,
			valueFormatter: params =>
				params.value != null ? params.value.toFixed(1) : "N/A",
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
	if (!Array.isArray(patterns)) {
		console.error("[DrillPatternListView] ❌ Invalid patterns data:", patterns);
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Data Error"
					description="Invalid drill pattern data structure. Please refresh the page."
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

	console.log("[DrillPatternListView] Rendering with:", {
		patternsCount: patterns.length,
		pagination,
		programFilter,
		isLoading,
	});

	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Patterns"
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
						Drill Patterns
					</h1>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => navigate("/drill-pattern/new")}
					>
						Create Pattern
					</Button>
				</Space>
			</div>

			{/* Search and Filters */}
			<div style={{ marginBottom: "16px" }}>
				<Space wrap>
					<Input
						placeholder="Search patterns..."
						prefix={<SearchOutlined />}
						value={searchQuery}
						onChange={e => handleSearch(e.target.value)}
						style={{ width: 300 }}
						allowClear
					/>
					<Select
						placeholder="Filter by Program"
						style={{ width: 250 }}
						value={programFilter}
						onChange={handleProgramFilterChange}
						allowClear
						showSearch
						optionFilterProp="children"
						loading={loadingPrograms}
					>
						{programs.map(program => (
							<Select.Option key={program.DrillProgramId} value={program.DrillProgram}>
								{program.DrillProgram}
							</Select.Option>
						))}
					</Select>
				</Space>
			</div>

			{/* Loading State */}
			{isLoading && patterns.length === 0 && (
				<div style={{ textAlign: "center", padding: "40px" }}>
					<Spin size="large" />
					<p style={{ marginTop: "16px" }}>Loading drill patterns...</p>
				</div>
			)}

			{/* Grid */}
			{!isLoading || patterns.length > 0 ? (
				<div style={{ flex: 1, minHeight: "400px" }}>
					<AgGridReact
						{...getCommonGridProps()}
						rowData={patterns}
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
			{!isLoading && patterns.length === 0 && (
				<div style={{ textAlign: "center", padding: "40px" }}>
					<p>
						{programFilter
							? "No drill patterns found for the selected program."
							: "No drill patterns found. Create your first pattern to get started."}
					</p>
					<Button
						type="primary"
						icon={<PlusOutlined />}
						onClick={() => navigate("/drill-pattern/new")}
						style={{ marginTop: "16px" }}
					>
						Create Pattern
					</Button>
				</div>
			)}
		</div>
	);
};
