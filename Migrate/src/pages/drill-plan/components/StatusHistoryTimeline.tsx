/**
 * StatusHistoryTimeline Component
 *
 * Displays the history of status transitions in a timeline format
 */

import type { TimelineItemProps } from "antd";
import type { StatusTransition } from "../types";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Card, Empty, Tag, Timeline, Typography } from "antd";
import React from "react";
import { StatusChip } from "./StatusChip";

const { Text } = Typography;

interface StatusHistoryTimelineProps {
	history: StatusTransition[]
	loading?: boolean
}

/**
 * Renders the content for a single timeline item
 */
function renderTimelineContent(transition: StatusTransition, isFirst: boolean) {
	const transitionDate = new Date(transition.TransitionOnDt);

	return (
		<div style={{ marginBottom: "8px" }}>
			<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
				<StatusChip status={transition.FromStatus} size="small" />
				<Text type="secondary">→</Text>
				<StatusChip status={transition.ToStatus} size="small" />
				{isFirst && (
					<Tag color="green" style={{ marginLeft: "8px" }}>
						Current
					</Tag>
				)}
			</div>

			<div style={{ marginTop: "8px" }}>
				<Text type="secondary" style={{ fontSize: "12px" }}>
					{transitionDate.toLocaleString()}
				</Text>
				<Text type="secondary" style={{ fontSize: "12px", marginLeft: "8px" }}>
					by
					{" "}
					{transition.TransitionBy}
				</Text>
			</div>

			{transition.Reason && (
				<div style={{ marginTop: "4px" }}>
					<Text strong style={{ fontSize: "12px" }}>
						Reason:
					</Text>
					<Text style={{ fontSize: "12px", marginLeft: "4px" }}>
						{transition.Reason}
					</Text>
				</div>
			)}

			{transition.Comments && (
				<div style={{ marginTop: "4px" }}>
					<Text strong style={{ fontSize: "12px" }}>
						Comments:
					</Text>
					<Text style={{ fontSize: "12px", marginLeft: "4px" }}>
						{transition.Comments}
					</Text>
				</div>
			)}

			{transition.ExpectedResumeOnDt && (
				<div style={{ marginTop: "4px" }}>
					<Text strong style={{ fontSize: "12px" }}>
						Expected Resume:
					</Text>
					<Text style={{ fontSize: "12px", marginLeft: "4px" }}>
						{new Date(transition.ExpectedResumeOnDt).toLocaleDateString()}
					</Text>
				</div>
			)}
		</div>
	);
}

export const StatusHistoryTimeline: React.FC<StatusHistoryTimelineProps> = ({
	history,
	loading = false,
}) => {
	if (!history || history.length === 0) {
		return (
			<Card>
				<Empty
					image={Empty.PRESENTED_IMAGE_SIMPLE}
					description="No status history available"
				/>
			</Card>
		);
	}

	// Sort by date descending (newest first)
	const sortedHistory = [...history].sort(
		(a, b) => new Date(b.TransitionOnDt).getTime() - new Date(a.TransitionOnDt).getTime(),
	);

	// Transform history into Timeline items using modern Ant Design 5.x API
	const timelineItems: TimelineItemProps[] = sortedHistory.map((transition, index) => {
		const isFirst = index === 0;

		return {
			key: transition.DrillPlanStatusHistoryId,
			color: isFirst ? "green" : "gray",
			dot: isFirst ? <ClockCircleOutlined style={{ fontSize: "16px" }} /> : undefined,
			children: renderTimelineContent(transition, isFirst),
		};
	});

	return (
		<Card title="Status History" loading={loading}>
			<Timeline items={timelineItems} />
		</Card>
	);
};
