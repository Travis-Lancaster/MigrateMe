/**
 * Create Drill Hole Header
 *
 * Header bar showing drill hole identity and primary actions.
 * Displays completion progress and provides submit/back navigation.
 *
 * Pattern based on: src/pages/drill-hole/components/DrillHoleHeader.tsx
 */

import { ArrowLeftOutlined, CheckCircleOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, Progress, Space, Typography } from "antd";

const { Title, Text } = Typography;

export interface CreateDrillHoleHeaderProps {
	drillPlanId: string
	plannedHoleNm: string | null
	completionPercentage: number
	onBack: () => void
	onSubmit: () => void
	isSubmitting: boolean
}

/**
 * Header component for create drill hole view
 */
export function CreateDrillHoleHeader({
	drillPlanId,
	plannedHoleNm,
	completionPercentage,
	onBack,
	onSubmit,
	isSubmitting,
}: CreateDrillHoleHeaderProps): JSX.Element {
	console.log("🎨 [HEADER] Rendering CreateDrillHoleHeader", { drillPlanId, plannedHoleNm, completionPercentage });

	return (
		<div style={{
			backgroundColor: "white",
			borderBottom: "1px solid #f0f0f0",
			padding: "16px 24px",
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
		}}>
			{/* Left: Identity and progress */}
			<Space size="large" style={{ flex: 1 }}>
				{/* Drill hole identity */}
				<div>
					<Title level={4} style={{ margin: 0 }}>
						Create Drill Hole
					</Title>
					<Text type="secondary">
						{plannedHoleNm || "Unnamed Hole"}
					</Text>
					<Text type="secondary" style={{ marginLeft: "12px", fontSize: "12px" }}>
						Plan: {drillPlanId}
					</Text>
				</div>

				{/* Progress indicator */}
				<div style={{ minWidth: "200px" }}>
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<Progress
							percent={completionPercentage}
							size="small"
							status={completionPercentage === 100 ? "success" : "active"}
							style={{ margin: 0, flex: 1 }}
						/>
						<Text type="secondary" style={{ fontSize: "12px", minWidth: "45px" }}>
							{completionPercentage}% done
						</Text>
					</div>
				</div>
			</Space>

			{/* Right: Actions */}
			<Space>
				<Button
					icon={<ArrowLeftOutlined />}
					onClick={onBack}
					disabled={isSubmitting}
				>
					Back to List
				</Button>

				<Button
					type="primary"
					icon={<CheckCircleOutlined />}
					onClick={onSubmit}
					loading={isSubmitting}
					disabled={completionPercentage < 100}
					title={completionPercentage < 100 ? "Complete all required sections to submit" : "Submit drill hole"}
				>
					{isSubmitting ? "Creating..." : "Create Drill Hole"}
				</Button>
			</Space>
		</div>
	);
}
