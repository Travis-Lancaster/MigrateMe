/**
 * VerticalTabs Component
 *
 * Vertical tab navigation for drill hole sections with collapsible icon-only mode.
 * Does NOT use router - pure React state management.
 *
 * Tab colors based on RowStatus:
 * - Draft: black
 * - Complete: light blue (#1890ff)
 * - Reviewed: dark blue (#003a8c)
 * - Approved: green (#52c41a)
 *
 * Red badge indicator when validation errors exist
 */

import type { DrillHoleSection } from "#src/types/drillhole";
import type { TabsProps } from "antd";

import { useVisibleSections } from "#src/hooks/use-section-visibility";
import { RowStatus, SectionKey } from "#src/types/drillhole";
import {
	AimOutlined,
	BarChartOutlined,
	BlockOutlined,
	CloudUploadOutlined,
	ColumnHeightOutlined,
	CompassOutlined,
	DashboardOutlined,
	DotChartOutlined,
	EditOutlined,
	ExperimentFilled,
	ExperimentOutlined,
	FileTextOutlined,
	FormOutlined,
	LineChartOutlined,
	MenuFoldOutlined,
	MenuUnfoldOutlined,
	SafetyCertificateOutlined,
	ScissorOutlined,
	SendOutlined,
	ToolOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import { Badge, Button, Tabs, Tooltip } from "antd";
import React, { useMemo } from "react";

interface TabSection {
	key: SectionKey
	label: string
	icon: React.ReactNode
}

const TAB_SECTIONS: TabSection[] = [
	{ key: SectionKey.DrillPlan, label: "Drill Plan", icon: <FileTextOutlined /> },
	{ key: SectionKey.Collar, label: "Collar", icon: <AimOutlined /> },
	{ key: SectionKey.RigSheet, label: "Rig Sheet", icon: <ExperimentOutlined /> },
	{ key: SectionKey.DrillMethod, label: "Drill Method", icon: <FileTextOutlined /> },
	{ key: SectionKey.Sample, label: "Sample", icon: <ExperimentFilled /> },
	{ key: SectionKey.Dispatch, label: "Dispatch", icon: <SendOutlined /> },
	{ key: SectionKey.Qaqc, label: "QAQC", icon: <SafetyCertificateOutlined /> },
	{ key: SectionKey.Survey, label: "DH Survey", icon: <LineChartOutlined /> },

	// Geological Logging Sections
	{ key: SectionKey.QuickLog, label: "Quick Log", icon: <FormOutlined /> },
	{ key: SectionKey.Logging, label: "Logging", icon: <EditOutlined /> },
	{ key: SectionKey.CycloneCleaning, label: "Cyclone Cleaning", icon: <ExperimentOutlined /> },
	{ key: SectionKey.ShearLog, label: "Shear Log", icon: <ScissorOutlined /> },
	{ key: SectionKey.StructureLog, label: "Structure Log", icon: <BlockOutlined /> },
	{ key: SectionKey.CoreRecoveryRunLog, label: "Core Recovery", icon: <ColumnHeightOutlined /> },
	{ key: SectionKey.FractureCountLog, label: "Fracture Count", icon: <DashboardOutlined /> },
	{ key: SectionKey.MagSusLog, label: "Mag Sus", icon: <CompassOutlined /> },
	{ key: SectionKey.RockMechanicLog, label: "Rock Mechanic", icon: <ToolOutlined /> },
	{ key: SectionKey.RockQualityDesignationLog, label: "RQD", icon: <BarChartOutlined /> },
	{ key: SectionKey.SpecificGravityPtLog, label: "Specific Gravity", icon: <DotChartOutlined /> },
];

interface VerticalTabsProps {
	activeKey: SectionKey
	onChange: (key: SectionKey) => void
	collapsed?: boolean
	onCollapseChange?: (collapsed: boolean) => void
	sections: Record<string, DrillHoleSection<any, any>>
}

/**
 * Get color based on RowStatus
 */
function getRowStatusColor(status: RowStatus): string {
	switch (status) {
		case RowStatus.Draft:
			return "#000000"; // black
		case RowStatus.Complete:
			return "#1890ff"; // light blue
		case RowStatus.Reviewed:
			return "#003a8c"; // dark blue
		case RowStatus.Approved:
			return "#52c41a"; // green
		case RowStatus.Superseded:
			return "#8c8c8c"; // gray
		case RowStatus.Imported:
			return "#13c2c2"; // cyan
		case RowStatus.Rejected:
			return "#ff4d4f"; // red
		default:
			return "#000000";
	}
}

/**
 * Check if section has validation errors
 */
function hasValidationErrors(section: DrillHoleSection<any, any> | undefined): boolean {
	if (!section)
		return false;
	return !section.isValid();
}

export const VerticalTabs: React.FC<VerticalTabsProps> = ({
	activeKey,
	onChange,
	collapsed = false,
	onCollapseChange,
	sections,
}) => {
	// Get visible sections based on permissions
	const visibleSections = useVisibleSections();

	// Filter tabs to only show visible sections
	const items: TabsProps["items"] = useMemo(() => {
		return TAB_SECTIONS
			.filter(tabDef => visibleSections.includes(tabDef.key))
			.map((tabDef) => {
				const section = sections[tabDef.key];
				const rowStatus = section?.getRowStatus() || RowStatus.Draft;
				const hasErrors = hasValidationErrors(section);
				// Show indicator if section is dirty OR in sync queue
				const hasUnsavedChanges = section?.isDirty || false;
				const statusColor = getRowStatusColor(rowStatus);

				return {
					key: tabDef.key,
					label: collapsed
						? null
						: (
							<span style={{ color: statusColor }}>
								{tabDef.label}
								{hasErrors && (
									<WarningOutlined
										className="ml-1"
										style={{ color: "#ff4d4f" }}
									/>
								)}
								{hasUnsavedChanges && !hasErrors && (
									<Tooltip title="Unsaved changes" placement="right">
										<CloudUploadOutlined
											className="ml-1"
											style={{ color: "#faad14" }}
										/>
									</Tooltip>
								)}
							</span>
						),
					icon: hasErrors
						? (
							<Badge dot color="red" offset={[-2, 2]}>
								<span style={{ color: statusColor }}>{tabDef.icon}</span>
							</Badge>
						)
						: hasUnsavedChanges
							? (
								<Badge dot color="orange" offset={[-2, 2]}>
									<Tooltip title="Unsaved changes" placement="right">
										<span style={{ color: statusColor }}>{tabDef.icon}</span>
									</Tooltip>
								</Badge>
							)
							: (
								<span style={{ color: statusColor }}>{tabDef.icon}</span>
							),
				};
			});
	}, [visibleSections, sections, collapsed, activeKey]);

	return (
		<div className="flex flex-col h-full border-r border-gray-200">
			{/* Collapse Button */}
			{onCollapseChange && (
				<div className="p-2 border-b border-gray-200">
					<Tooltip title={collapsed ? "Expand" : "Collapse"} placement="right">
						<Button
							type="text"
							icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
							onClick={() => onCollapseChange(!collapsed)}
							className="w-full"
						/>
					</Tooltip>
				</div>
			)}

			{/* Vertical Tabs */}
			<Tabs
				activeKey={activeKey}
				onChange={key => onChange(key as SectionKey)}
				tabPosition="left"
				items={items}
				className="flex-1"
				style={{
					width: collapsed ? "60px" : "200px",
					transition: "width 0.2s",
				}}
			/>
		</div>
	);
};
