/**
 * BulkPreviewGrid Component
 *
 * Preview grid showing all calculated drill plans before bulk creation
 */

import { Alert, Col, Row, Space, Statistic } from "antd";
import { CheckCircleOutlined, WarningOutlined } from "@ant-design/icons";

import { AgGridReact } from "ag-grid-react";
import type { ColDef } from "ag-grid-enterprise";
import type { CreateDrillPlanDto } from "../types";
import React from "react";
import type { ValidationWarning } from "../services/bulkCreationService";
import { getCommonGridProps } from "#src/config/ag-grid-config";

interface BulkPreviewGridProps {
	plans: CreateDrillPlanDto[]
	validationWarnings: ValidationWarning[]
}

export const BulkPreviewGrid: React.FC<BulkPreviewGridProps> = ({
	plans,
	validationWarnings,
}) => {
	const columnDefs: ColDef[] = [
		{
			headerName: "Hole Id",
			field: "HoleNm",
			width: 180,
			pinned: "left",
		},
		{
			headerName: "Planned",
			field: "PlannedHoleNm",
			width: 180,
			pinned: "left",
		},
		{
			headerName: "Proposed",
			field: "ProposedHoleNm",
			width: 180,
			pinned: "left",
		},
		{
			headerName: "ODSPriority]",
			field: "ODSPriority]",
			width: 180,
			pinned: "left",
		},

		{
			headerName: "Easting (m)",
			field: "PlannedEasting",
			width: 130,
			valueFormatter: params => params.value?.toFixed(2) || "",
		},
		{
			headerName: "Northing (m)",
			field: "PlannedNorthing",
			width: 130,
			valueFormatter: params => params.value?.toFixed(2) || "",
		},
		{
			headerName: "RL (m)",
			field: "PlannedRL",
			width: 100,
			valueFormatter: params => params.value?.toFixed(2) || "",
		},
		{
			headerName: "Azimuth (°)",
			field: "PlannedAzimuth",
			width: 110,
			valueFormatter: params => params.value?.toFixed(1) || "",
		},
		{
			headerName: "Depth (m)",
			field: "PlannedTotalDepth",
			width: 110,
			valueFormatter: params => params.value?.toFixed(1) || "",
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
			headerName: "Pattern",
			field: "DrillPattern",
			width: 150,
		},
	];

	const errorCount = validationWarnings.filter(w => w.severity === "error").length;
	const warningCount = validationWarnings.filter(w => w.severity === "warning").length;

	return (
		<Space direction="vertical" style={{ width: "100%" }} size="large">
			{/* Summary Statistics */}
			<Row gutter={16}>
				<Col span={8}>
					<Statistic
						title="Total Drill Plans"
						value={plans.length}
						prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
					/>
				</Col>
				{errorCount > 0 && (
					<Col span={8}>
						<Statistic
							title="Errors"
							value={errorCount}
							valueStyle={{ color: "#cf1322" }}
							prefix={<WarningOutlined />}
						/>
					</Col>
				)}
				{warningCount > 0 && (
					<Col span={8}>
						<Statistic
							title="Warnings"
							value={warningCount}
							valueStyle={{ color: "#fa8c16" }}
							prefix={<WarningOutlined />}
						/>
					</Col>
				)}
			</Row>

			{/* Validation Warnings */}
			{validationWarnings.length > 0 && (
				<Space direction="vertical" style={{ width: "100%" }}>
					{validationWarnings.map((warning, idx) => (
						<Alert
							key={idx}
							type={warning.severity === "error" ? "error" : "warning"}
							message={warning.message}
							showIcon
						/>
					))}
				</Space>
			)}

			{/* Preview Grid */}
			{plans.length > 0
				? (
					<div style={{ height: "450px", width: "100%" }}>
						<AgGridReact
							columnDefs={columnDefs}
							rowData={plans}
							domLayout="normal"
							pagination={true}
							paginationPageSize={20}
							paginationPageSizeSelector={[10, 20, 50, 100]}
							{...getCommonGridProps()}
						/>
					</div>
				)
				: (
					<Alert
						type="info"
						message="No drill plans to preview"
						description="Complete the configuration to generate preview"
						showIcon
					/>
				)}

			{/* Summary Footer */}
			{plans.length > 0 && (
				<Alert
					type="success"
					message={`Ready to create ${plans.length} drill plan${plans.length !== 1 ? "s" : ""}`}
					description={errorCount > 0 ? "Please resolve errors before continuing" : "Review the preview and click Create to proceed"}
					showIcon
				/>
			)}
		</Space>
	);
};
