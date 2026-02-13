/**
 * Progress Tracker
 *
 * Visual indicator showing completion status across all sections.
 * Displays section-level completion for quick overview.
 *
 * Mobile/tablet optimized compact view.
 */

import { CheckCircleOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { Card, Progress, Space, Tag, Typography } from "antd";
import type { SectionStore } from "../store/section-factory";
import { getSectionCompletionSummary } from "../store/section-mappers";
import type { CreateDrillHoleState } from "../store/create-drillhole-store";

const { Text } = Typography;

export interface ProgressTrackerProps {
	sections: Record<string, SectionStore<any>>
	completionPercentage: number
}

/**
 * Progress tracker component
 */
export function ProgressTracker({
	sections,
	completionPercentage,
}: ProgressTrackerProps): JSX.Element {
	console.log("🎨 [PROGRESS] Rendering ProgressTracker", { completionPercentage });

	// Get section completion summary
	const summary = getSectionCompletionSummary({
		sections,
	} as CreateDrillHoleState);

	const { total, completed } = summary;
	const remaining = total - completed;

	return (
		<div style={{
			backgroundColor: "#f5f5f5",
			borderBottom: "1px solid #e8e8e8",
			padding: "12px 24px",
		}}>
			<Space size="large" style={{ width: "100%", justifyContent: "space-between" }}>
				{/* Overall progress */}
				<Space size="middle">
					<Text strong style={{ fontSize: "13px" }}>
						Overall Progress:
					</Text>
					<Progress
						percent={completionPercentage}
						size="small"
						status={completionPercentage === 100 ? "success" : "active"}
						style={{ width: "150px", margin: 0 }}
					/>
				</Space>

				{/* Section counts */}
				<Space size="middle">
					<Tag icon={<CheckCircleOutlined />} color="success">
						{completed} Complete
					</Tag>
					<Tag icon={<ClockCircleOutlined />} color="default">
						{remaining} Remaining
					</Tag>
					<Text type="secondary" style={{ fontSize: "12px" }}>
						{completed}/{total} sections
					</Text>
				</Space>
			</Space>
		</div>
	);
}
