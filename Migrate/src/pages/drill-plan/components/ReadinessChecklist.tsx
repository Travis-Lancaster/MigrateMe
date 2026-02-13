/**
 * ReadinessChecklist Component
 *
 * Displays readiness checks before status transition
 */

import type { ReadinessCheck } from "../types";
import { CheckCircleFilled, CloseCircleFilled, WarningFilled } from "@ant-design/icons";
import { Alert, Progress, Space, Typography } from "antd";
import React from "react";

const { Text } = Typography;

interface ReadinessChecklistProps {
	checks: ReadinessCheck[]
}

export const ReadinessChecklist: React.FC<ReadinessChecklistProps> = ({ checks }) => {
	const allRequired = checks.filter(c => c.required);
	const passedRequired = allRequired.filter(c => c.passed);
	const progress = allRequired.length > 0
		? (passedRequired.length / allRequired.length) * 100
		: 100;

	return (
		<div className="readiness-checklist">
			<Space direction="vertical" style={{ width: "100%" }} size="middle">
				{/* Progress indicator */}
				<div>
					<Text strong>Readiness Check</Text>
					<Progress
						percent={Math.round(progress)}
						status={progress === 100 ? "success" : "active"}
						strokeColor={progress === 100 ? "#52c41a" : "#1890ff"}
					/>
				</div>

				{/* Checklist items */}
				<div>
					{checks.map((check, index) => (
						<div key={index} style={{ marginBottom: "8px" }}>
							<Space>
								{check.passed
									? (
										<CheckCircleFilled style={{ color: "#52c41a", fontSize: "16px" }} />
									)
									: check.required
										? (
											<CloseCircleFilled style={{ color: "#ff4d4f", fontSize: "16px" }} />
										)
										: (
											<WarningFilled style={{ color: "#faad14", fontSize: "16px" }} />
										)}
								<Text
									style={{
										textDecoration: check.passed ? "line-through" : "none",
										color: check.passed ? "#8c8c8c" : "inherit",
									}}
								>
									{check.label}
									{check.required && <Text type="danger"> *</Text>}
								</Text>
							</Space>
						</div>
					))}
				</div>

				{progress < 100 && (
					<Alert
						type="warning"
						message="Requirements not met"
						description="Complete all required items before proceeding"
						showIcon
					/>
				)}

				{progress === 100 && (
					<Alert
						type="success"
						message="Ready to proceed"
						description="All requirements met for this status transition"
						showIcon
					/>
				)}
			</Space>
		</div>
	);
};
