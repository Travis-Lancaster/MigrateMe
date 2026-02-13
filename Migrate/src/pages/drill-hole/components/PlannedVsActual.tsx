import type { UiDrillHole } from "#src/api/database/data-contracts.js";

import { EditOutlined } from "@ant-design/icons";
import { Button, Card, Col, Collapse, Descriptions, Row } from "antd";

const { Panel } = Collapse;

interface PlannedVsActualProps {
	drillHoleData: UiDrillHole | null | undefined
	onEditCollarCoordinates: () => void
}

export function PlannedVsActual({ drillHoleData, onEditCollarCoordinates }: PlannedVsActualProps) {
	console.log("PlannedVsActual");
	const drillPlanData = drillHoleData?.DrillPlan;
	const plannedCoords = `${drillPlanData?.PlannedEasting || "-"} / ${drillPlanData?.PlannedNorthing || "-"} / ${drillPlanData?.PlannedRL || "-"}`;
	const actualCoords = `${drillHoleData?.CollarCoordinate?.East || "-"} / ${drillHoleData?.CollarCoordinate?.North || "-"} / ${drillHoleData?.CollarCoordinate?.RL || "-"}`;
	return (
		<Collapse defaultActiveKey={["2"]}>
			<Panel header="Planned vs Collar (Actual) Data" key="2">
				<Row gutter={16}>
					{/* Planned Data */}
					<Col span={12}>
						<Card title="Planned Data" size="small">
							<Descriptions bordered column={3} size="small">
								<Descriptions.Item label="Proposed Name" span="filled">{drillHoleData?.PlannedHoleNm || "-"}</Descriptions.Item>
								<Descriptions.Item label="Easting/Northing/RL" span="filled">{plannedCoords}</Descriptions.Item>
								<Descriptions.Item label="Azimuth" span={1}>{drillPlanData?.PlannedAzimuth || "-"}</Descriptions.Item>
								<Descriptions.Item label="Dip" span="filled">{drillPlanData?.PlannedDip || "-"}</Descriptions.Item>
								<Descriptions.Item label="Total Depth">{drillPlanData?.PlannedTotalDepth || "-"}</Descriptions.Item>
							</Descriptions>
						</Card>
					</Col>

					{/* Actual/Collar Data */}
					<Col span={12}>
						<Card title="Collar (Actual) Data" size="small">
							<Descriptions bordered column={3} size="small">
								<Descriptions.Item label="HoleID" span="filled">{drillHoleData?.HoleNm || "-"}</Descriptions.Item>
								<Descriptions.Item label="Easting/Northing/RL" span="filled">
									<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
										<span>{actualCoords}</span>
										<Button
											type="text"
											icon={<EditOutlined />}
											size="small"
											onClick={onEditCollarCoordinates}
											title="Edit Collar Coordinates"
										/>
									</div>
								</Descriptions.Item>
								<Descriptions.Item label="Azimuth">{drillHoleData?.SurveyLog?.[0]?.AzimuthMagnetic || "-"}</Descriptions.Item>
								<Descriptions.Item label="Dip" span="filled">{drillHoleData?.SurveyLog?.[0]?.Dip || "-"}</Descriptions.Item>
								<Descriptions.Item label="Total Depth" span="filled">{drillHoleData?.Collar?.TotalDepth || "-"}</Descriptions.Item>
							</Descriptions>
						</Card>
					</Col>
				</Row>
			</Panel>
		</Collapse>
	);
}
