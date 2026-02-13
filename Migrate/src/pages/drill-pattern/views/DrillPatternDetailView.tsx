/**
 * DrillPatternDetailView Component
 *
 * Detail view for a single drill pattern with related drill plans.
 * Shows parent DrillProgram and pattern-specific fields.
 */

import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, LinkOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, message, Modal, Space, Spin, Tag } from "antd";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDrillPatternDetail } from "../hooks";
import { useDrillPatternStore } from "../store/drill-pattern-store";

const { confirm } = Modal;

export const DrillPatternDetailView: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { pattern, isLoading, error } = useDrillPatternDetail(id!);
	const { deletePattern } = useDrillPatternStore();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = () => {
		if (!pattern)
			return;

		confirm({
			title: "Delete Drill Pattern",
			icon: <ExclamationCircleOutlined />,
			content: `Are you sure you want to delete pattern "${pattern.DrillPattern}"? This action cannot be undone.`,
			okText: "Delete",
			okType: "danger",
			cancelText: "Cancel",
			onOk: async () => {
				setIsDeleting(true);
				try {
					await deletePattern(pattern.DrillPatternId);
					message.success("Drill pattern deleted successfully");
					navigate("/drill-pattern");
				}
				catch (error: any) {
					message.error(error.message || "Failed to delete drill pattern");
				}
				finally {
					setIsDeleting(false);
				}
			},
		});
	};

	if (isLoading) {
		return (
			<div style={{ padding: "24px", textAlign: "center" }}>
				<Spin size="large" />
				<p style={{ marginTop: "16px" }}>Loading pattern details...</p>
			</div>
		);
	}

	if (error || !pattern) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Pattern"
					description={error || "Pattern not found"}
					type="error"
					showIcon
					action={(
						<Button onClick={() => navigate("/drill-pattern")}>
							Back to List
						</Button>
					)}
				/>
			</div>
		);
	}

	console.log("[DrillPatternDetailView] Rendering pattern:", pattern.DrillPattern);

	return (
		<div style={{ padding: "24px" }}>
			{/* Header */}
			<div style={{ marginBottom: "24px" }}>
				<Space style={{ width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
					<Space>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={() => navigate("/drill-pattern")}
						>
							Back to List
						</Button>
						<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
							{pattern.DrillPattern}
						</h1>
					</Space>
					<Space>
						<Button
							icon={<EditOutlined />}
							onClick={() => navigate(`/drill-pattern/${id}/edit`)}
						>
							Edit
						</Button>
						<Button
							danger
							icon={<DeleteOutlined />}
							onClick={handleDelete}
							loading={isDeleting}
						>
							Delete
						</Button>
					</Space>
				</Space>
			</div>

			{/* Parent Program Link */}
			{pattern.DrillProgram && (
				<Card style={{ marginBottom: "16px", backgroundColor: "#f0f5ff" }}>
					<Space>
						<LinkOutlined />
						<span style={{ fontWeight: 500 }}>Parent Program:</span>
						<Button
							type="link"
							style={{ padding: 0 }}
							onClick={() => {
								// TODO: Navigate to program detail when we have the DrillProgramId
								message.info(`Navigate to program: ${pattern.DrillProgram}`);
							}}
						>
							{pattern.DrillProgram}
						</Button>
					</Space>
				</Card>
			)}

			{/* Pattern Information */}
			<Card title="Pattern Information" style={{ marginBottom: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Pattern Name" span={2}>
						{pattern.DrillPattern}
					</Descriptions.Item>
					<Descriptions.Item label="Pattern Code">
						{pattern.DrillPatternCode || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Pattern Type">
						{pattern.DrillPatternType || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Organization">
						{pattern.Organization}
					</Descriptions.Item>
					<Descriptions.Item label="Target">
						{pattern.Target}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* Pattern Geometry */}
			<Card title="Pattern Geometry" style={{ marginBottom: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Spacing X (m)">
						{pattern.SpacingX != null
							? (
								<Tag color="blue">
									{pattern.SpacingX.toFixed(2)}
									{" "}
									m
								</Tag>
							)
							: (
								"N/A"
							)}
					</Descriptions.Item>
					<Descriptions.Item label="Spacing Y (m)">
						{pattern.SpacingY != null
							? (
								<Tag color="blue">
									{pattern.SpacingY.toFixed(2)}
									{" "}
									m
								</Tag>
							)
							: (
								"N/A"
							)}
					</Descriptions.Item>
					<Descriptions.Item label="Orientation (°)" span={2}>
						{pattern.Orientation != null
							? (
								<Tag color="green">
									{pattern.Orientation.toFixed(1)}
									°
								</Tag>
							)
							: (
								"N/A"
							)}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* Comments */}
			{pattern.Comments && (
				<Card title="Comments" style={{ marginBottom: "16px" }}>
					<p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{pattern.Comments}</p>
				</Card>
			)}

			{/* Pattern Visualization Placeholder */}
			<Card title="Pattern Visualization" style={{ marginBottom: "16px" }}>
				<div style={{
					padding: "40px",
					textAlign: "center",
					backgroundColor: "#f5f5f5",
					borderRadius: "8px",
				}}
				>
					<p style={{ color: "#888", margin: 0 }}>
						Pattern visualization will be displayed here in a future update.
					</p>
					<p style={{ color: "#888", fontSize: "12px", marginTop: "8px" }}>
						(SVG-based grid showing spacing and orientation)
					</p>
				</div>
			</Card>

			{/* Drill Plans Using This Pattern */}
			<Card title="Drill Plans Using This Pattern">
				<p style={{ color: "#888" }}>
					Drill plans using this pattern will be displayed here once drill plan integration is complete (Phase 3).
				</p>
				{/* TODO: Add linked drill plans table in Phase 3 */}
			</Card>

			{/* Audit Information */}
			<Card title="Audit Information" style={{ marginTop: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Created On">
						{pattern.CreatedOnDt ? new Date(pattern.CreatedOnDt).toLocaleString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Created By">
						{pattern.CreatedBy || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Modified On">
						{pattern.ModifiedOnDt ? new Date(pattern.ModifiedOnDt).toLocaleString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Modified By">
						{pattern.ModifiedBy || "N/A"}
					</Descriptions.Item>
				</Descriptions>
			</Card>
		</div>
	);
};
