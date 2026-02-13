/**
 * MasterGrid Component
 *
 * Collapsible summary display showing DrillPlan, Collar, and RigSheet data.
 * Persists collapse state to localStorage.
 */

import type { DrillHoleSection } from "#src/types/drillhole.js";
import { DownOutlined, UpOutlined } from "@ant-design/icons";
import { Button, Descriptions } from "antd";

import React, { useEffect, useState } from "react";
// import type { DrillHoleSection } from '../store/create-drillhole-store';

const COLLAPSE_STORAGE_KEY = "drillhole-master-grid-collapsed";

interface MasterGridProps {
	drillPlanSection: DrillHoleSection<any, any> | undefined
	collarSection: DrillHoleSection<any, any> | undefined
	rigSheetSection: DrillHoleSection<any, any> | undefined
}

export const MasterGrid: React.FC<MasterGridProps> = ({
	drillPlanSection,
	collarSection,
	rigSheetSection,
}) => {
	// Load collapse state from localStorage
	const [collapsed, setCollapsed] = useState<boolean>(() => {
		const stored = localStorage.getItem(COLLAPSE_STORAGE_KEY);
		return stored ? JSON.parse(stored) : false;
	});

	// Persist collapse state to localStorage
	useEffect(() => {
		localStorage.setItem(COLLAPSE_STORAGE_KEY, JSON.stringify(collapsed));
	}, [collapsed]);

	const drillPlanData = drillPlanSection?.getData() || {};
	const collarData = collarSection?.getData() || {};
	const rigSheetData = rigSheetSection?.getData() || {};

	return (
		<div className="border-b border-gray-200 bg-gray-50">
			{/* Collapse Header */}
			<div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
				<h3 className="text-sm font-semibold text-gray-700">Summary</h3>
				<Button
					type="text"
					size="small"
					icon={collapsed ? <DownOutlined /> : <UpOutlined />}
					onClick={() => setCollapsed(!collapsed)}
				>
					{collapsed ? "Show" : "Hide"}
				</Button>
			</div>

			{/* Collapsible Content */}
			{!collapsed && (
				<div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
					{/* DrillPlan Summary */}
					<div className="bg-white p-3 rounded border border-gray-200">
						<h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Drill Plan</h4>
						<Descriptions column={1} size="small" className="text-xs">
							<Descriptions.Item label="Drill Plan ID">
								{drillPlanData.drillPlanId || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Status">
								{drillPlanSection?.getRowStatus() || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Hole ID">
								{drillPlanData.holeId || "-"}
							</Descriptions.Item>
						</Descriptions>
					</div>

					{/* Collar Summary */}
					<div className="bg-white p-3 rounded border border-gray-200">
						<h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Collar</h4>
						<Descriptions column={1} size="small" className="text-xs">
							<Descriptions.Item label="Collar ID">
								{collarData.collarId || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Status">
								{collarSection?.getRowStatus() || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Location">
								{collarData.easting && collarData.northing
									? `${collarData.easting}, ${collarData.northing}`
									: "-"}
							</Descriptions.Item>
						</Descriptions>
					</div>

					{/* RigSheet Summary */}
					<div className="bg-white p-3 rounded border border-gray-200">
						<h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase">Rig Sheet</h4>
						<Descriptions column={1} size="small" className="text-xs">
							<Descriptions.Item label="Rig Sheet ID">
								{rigSheetData.rigSheetId || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Status">
								{rigSheetSection?.getRowStatus() || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Rig">
								{rigSheetData.rigId || "-"}
							</Descriptions.Item>
						</Descriptions>
					</div>
				</div>
			)}
		</div>
	);
};
