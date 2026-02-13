/**
 * DrillPlanSection Component
 *
 * Read-only display of drill plan data. No editing capabilities.
 *
 * ARCHITECTURE:
 * - Pure presentation component (no custom hook)
 * - Direct store access via useCreateDrillHoleStore
 * - Ant Design Descriptions for read-only display
 * - Logical field grouping for easy scanning
 *
 * PATTERNS APPLIED:
 * - SOLID: Single Responsibility (only displays data)
 * - DRY: Reuses SectionWrapper, SectionMetadataPanel
 * - KISS: No unnecessary abstractions
 */

import type { DrillPlanBase } from "#src/api/database/data-contracts";
import { Descriptions, Space, Tag } from "antd";
import React from "react";
import { SectionMetadataPanel } from "../components/SectionMetadataPanel";
import { SectionWrapper } from "../components/SectionWrapper";
import { useCreateDrillHoleStore } from "../store/create-drillhole-store";

export const DrillPlanSection: React.FC = () => {
	// Single store selector for section
	const section = useCreateDrillHoleStore(state => state.sections.drillplan);
	const data = section.getData() as DrillPlanBase;

	// Helper to format optional values
	const formatValue = (value: any): string => {
		if (value === null || value === undefined || value === "")
			return "-";
		return String(value);
	};

	// Helper to format dates
	const formatDate = (dateStr?: string): string => {
		if (!dateStr)
			return "-";
		try {
			const date = new Date(dateStr);
			return date.toLocaleDateString();
		}
		catch {
			return "-";
		}
	};

	// Helper to format numbers
	const formatNumber = (num?: number, decimals: number = 2): string => {
		if (num === null || num === undefined)
			return "-";
		return num.toFixed(decimals);
	};

	return (
		<SectionWrapper
			section={section}
			title="Drill Plan"
			hideActions // Read-only: no action buttons
		>
			<Space direction="vertical" size="large" style={{ width: "100%" }}>
				{/* Classification Group */}
				<Descriptions
					title="Classification"
					bordered
					column={3}
					size="small"
				>
					<Descriptions.Item label="Organization">
						{formatValue(data.Organization)}
					</Descriptions.Item>
					<Descriptions.Item label="Project">
						{formatValue(data.Project)}
					</Descriptions.Item>
					<Descriptions.Item label="Prospect">
						{formatValue(data.Prospect)}
					</Descriptions.Item>
					<Descriptions.Item label="Target">
						{formatValue(data.Target)}
					</Descriptions.Item>
					<Descriptions.Item label="Sub Target">
						{formatValue(data.SubTarget)}
					</Descriptions.Item>
					<Descriptions.Item label="Phase">
						{formatValue(data.Phase)}
					</Descriptions.Item>
					<Descriptions.Item label="Pit">
						{formatValue(data.Pit)}
					</Descriptions.Item>
					<Descriptions.Item label="Zone">
						{formatValue(data.Zone)}
					</Descriptions.Item>
					<Descriptions.Item label="Tenement">
						{formatValue(data.Tenement)}
					</Descriptions.Item>
				</Descriptions>

				{/* Planning Details Group */}
				<Descriptions
					title="Planning Details"
					bordered
					column={3}
					size="small"
				>
					<Descriptions.Item label="Hole Type">
						{formatValue(data.HoleType)}
					</Descriptions.Item>
					<Descriptions.Item label="Hole Status">
						{formatValue(data.HoleStatus)}
					</Descriptions.Item>
					<Descriptions.Item label="Hole Purpose">
						{formatValue(data.HolePurpose)}
					</Descriptions.Item>
					<Descriptions.Item label="Hole Purpose Detail">
						{formatValue(data.HolePurposeDetail)}
					</Descriptions.Item>
					<Descriptions.Item label="Drill Type">
						{formatValue(data.DrillType)}
					</Descriptions.Item>
					<Descriptions.Item label="Grid">
						{formatValue(data.Grid)}
					</Descriptions.Item>
					<Descriptions.Item label="Planned By">
						{formatValue(data.PlannedBy)}
					</Descriptions.Item>
					<Descriptions.Item label="Infill Target">
						{formatValue(data.InfillTarget)}
					</Descriptions.Item>
					<Descriptions.Item label="Site Prep">
						{formatValue(data.SitePrep)}
					</Descriptions.Item>
				</Descriptions>

				{/* Location & Orientation Group */}
				<Descriptions
					title="Planned Location & Orientation"
					bordered
					column={3}
					size="small"
				>
					<Descriptions.Item label="Easting">
						{formatNumber(data.PlannedEasting, 4)}
					</Descriptions.Item>
					<Descriptions.Item label="Northing">
						{formatNumber(data.PlannedNorthing, 4)}
					</Descriptions.Item>
					<Descriptions.Item label="RL">
						{formatNumber(data.PlannedRL, 4)}
					</Descriptions.Item>
					<Descriptions.Item label="Dip (°)">
						{formatNumber(data.PlannedDip, 2)}
					</Descriptions.Item>
					<Descriptions.Item label="Azimuth (°)">
						{formatNumber(data.PlannedAzimuth, 2)}
					</Descriptions.Item>
					<Descriptions.Item label="Total Depth (m)">
						{formatNumber(data.PlannedTotalDepth, 2)}
					</Descriptions.Item>
					<Descriptions.Item label="Water Table Depth (m)">
						{formatNumber(data.WaterTableDepth, 2)}
					</Descriptions.Item>
					<Descriptions.Item label="TWF">
						{formatValue(data.TWF)}
					</Descriptions.Item>
				</Descriptions>

				{/* Schedule Group */}
				<Descriptions
					title="Schedule"
					bordered
					column={3}
					size="small"
				>
					<Descriptions.Item label="Planned Start Date">
						{formatDate(data.PlannedStartDt)}
					</Descriptions.Item>
					<Descriptions.Item label="Planned Complete Date">
						{formatDate(data.PlannedCompleteDt)}
					</Descriptions.Item>
				</Descriptions>

				{/* Priority & Status Group */}
				<Descriptions
					title="Priority & Status"
					bordered
					column={3}
					size="small"
				>
					<Descriptions.Item label="Drill Priority">
						{formatValue(data.DrillPriority)}
					</Descriptions.Item>
					<Descriptions.Item label="ODS Priority">
						{formatValue(data.ODSPriority)}
					</Descriptions.Item>
					<Descriptions.Item label="Priority">
						{formatValue(data.Priority)}
					</Descriptions.Item>
					<Descriptions.Item label="Drill Plan Status" span={2}>
						<Tag color={data.DrillPlanStatus === "ACTIVE" ? "green" : "default"}>
							{formatValue(data.DrillPlanStatus)}
						</Tag>
					</Descriptions.Item>
				</Descriptions>

				{/* Additional Information Group */}
				<Descriptions
					title="Additional Information"
					bordered
					column={3}
					size="small"
				>
					<Descriptions.Item label="Data Source">
						{formatValue(data.DataSource)}
					</Descriptions.Item>
					<Descriptions.Item label="QC Insertion Rule ID" span={2}>
						{formatValue(data.QCInsertionRuleId)}
					</Descriptions.Item>
				</Descriptions>
			</Space>

			{/* Metadata Panel - Audit Trail */}
			<div style={{ marginTop: 24 }}>
				<SectionMetadataPanel section={section} />
			</div>
		</SectionWrapper>
	);
};
