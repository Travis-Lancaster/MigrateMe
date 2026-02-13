import type { UiDrillHole } from "#src/api/database/data-contracts.js";

import type { Control } from "react-hook-form";
import { Card, Collapse, Descriptions, Space, Tag } from "antd";

const { Panel } = Collapse;

interface DrillHoleHeaderProps {
	drillHoleData: UiDrillHole | null | undefined
	control: Control<any>
	lookupOptions: any
	getStatusColor: (status: string) => string
	dirtyFields: Set<string>
}

export function DrillHoleHeader({
	drillHoleData,
	control,
	lookupOptions,
	getStatusColor,
	dirtyFields,
}: DrillHoleHeaderProps) {
	const drillPlan = drillHoleData?.DrillPlan;
	return (
		<Card>
			<Collapse defaultActiveKey={["1"]}>
				<Panel header={`Drill Hole: ${drillHoleData?.HoleNm || drillHoleData?.PlannedHoleNm || drillHoleData?.ProposedHoleNm || "Loading..."}`} key="1">
					<Space direction="vertical" size="middle" style={{ width: "100%" }}>
						<Descriptions bordered column={2} size="small">
							<Descriptions.Item label="Organization">{drillHoleData?.Organization}</Descriptions.Item>
							<Descriptions.Item label="Project">{drillPlan?.Project}</Descriptions.Item>
							<Descriptions.Item label="Prospect">{drillPlan?.Prospect || "-"}</Descriptions.Item>
							<Descriptions.Item label="Tenement">{drillPlan?.Tenement || "-"}</Descriptions.Item>
							{drillPlan?.Phase && <Descriptions.Item label="Phase">{drillPlan?.Phase || "-"}</Descriptions.Item>}
							{drillPlan?.Pit && <Descriptions.Item label="Pit">{drillPlan?.Pit || "-"}</Descriptions.Item>}
							<Descriptions.Item label="Target">{drillPlan?.Target || "-"}</Descriptions.Item>
							{drillPlan?.SubTarget && <Descriptions.Item label="SubTarget">{drillPlan?.SubTarget || "-"}</Descriptions.Item>}
							<Descriptions.Item label="Zone">{drillPlan?.Zone || "-"}</Descriptions.Item>

							<Descriptions.Item label="Purpose">{drillPlan?.HolePurpose || "-"}</Descriptions.Item>
							<Descriptions.Item label="Type">{drillPlan?.HoleType || "-"}</Descriptions.Item>

							<Descriptions.Item label="Hole Status" span={1}>
								{drillHoleData?.Collar?.HoleStatus || "-"}
							</Descriptions.Item>
							<Descriptions.Item label="Progress">
								<Tag color={getStatusColor(drillPlan?.DrillPlanStatus || "")}>
									{drillPlan?.DrillPlanStatus || "Unknown"}
								</Tag>
							</Descriptions.Item>
						</Descriptions>
					</Space>
				</Panel>
			</Collapse>
		</Card>
	);
}
