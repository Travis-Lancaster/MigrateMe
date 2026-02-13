/**
 * DrillProgramDetailView Component
 *
 * Detail view for a single drill program with related patterns.
 * Follows the same pattern as DrillPlanDetailView.
 */

import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, message, Modal, Space, Spin } from "antd";
import React, { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDrillProgramDetail } from "../hooks";
import { useDrillProgramStore } from "../store/drill-program-store";

const { confirm } = Modal;

export const DrillProgramDetailView: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { program, isLoading, error } = useDrillProgramDetail(id!);
	const { deleteProgram } = useDrillProgramStore();
	const [isDeleting, setIsDeleting] = useState(false);

	const handleDelete = () => {
		if (!program)
			return;

		confirm({
			title: "Delete Drill Program",
			icon: <ExclamationCircleOutlined />,
			content: `Are you sure you want to delete program "${program.DrillProgram}"? This action cannot be undone.`,
			okText: "Delete",
			okType: "danger",
			cancelText: "Cancel",
			onOk: async () => {
				setIsDeleting(true);
				try {
					await deleteProgram(program.DrillProgramId);
					message.success("Drill program deleted successfully");
					navigate("/drill-program");
				}
				catch (error: any) {
					message.error(error.message || "Failed to delete drill program");
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
				<p style={{ marginTop: "16px" }}>Loading program details...</p>
			</div>
		);
	}

	if (error || !program) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Program"
					description={error || "Program not found"}
					type="error"
					showIcon
					action={(
						<Button onClick={() => navigate("/drill-program")}>
							Back to List
						</Button>
					)}
				/>
			</div>
		);
	}

	console.log("[DrillProgramDetailView] Rendering program:", program.DrillProgram);

	return (
		<div style={{ padding: "24px" }}>
			{/* Header */}
			<div style={{ marginBottom: "24px" }}>
				<Space style={{ width: "100%", justifyContent: "space-between", alignItems: "flex-start" }}>
					<Space>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={() => navigate("/drill-program")}
						>
							Back to List
						</Button>
						<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
							{program.DrillProgram}
						</h1>
					</Space>
					<Space>
						<Button
							icon={<EditOutlined />}
							onClick={() => navigate(`/drill-program/${id}/edit`)}
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

			{/* Program Information */}
			<Card title="Program Information" style={{ marginBottom: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Program Name" span={2}>
						{program.DrillProgram}
					</Descriptions.Item>
					<Descriptions.Item label="Program Code">
						{program.ProgramCode || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Program Type">
						{program.ProgramType || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Organization">
						{program.Organization}
					</Descriptions.Item>
					<Descriptions.Item label="Project">
						{program.Project}
					</Descriptions.Item>
					<Descriptions.Item label="Tenement">
						{program.Tenement || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Status">
						{program.Status}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* Contractor & Equipment */}
			<Card title="Contractor & Equipment" style={{ marginBottom: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Contractor">
						{program.Contractor || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Rig Type">
						{program.RigType || "N/A"}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* Schedule & Budget */}
			<Card title="Schedule & Budget" style={{ marginBottom: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Planned Start">
						{program.PlannedStart ? new Date(program.PlannedStart).toLocaleDateString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Planned End">
						{program.PlannedEnd ? new Date(program.PlannedEnd).toLocaleDateString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Actual Start">
						{program.ActualStart ? new Date(program.ActualStart).toLocaleDateString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Actual End">
						{program.ActualEnd ? new Date(program.ActualEnd).toLocaleDateString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Budget" span={2}>
						{program.Budget ? `$${program.Budget.toLocaleString()}` : "N/A"}
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* Objectives */}
			{program.Objectives && (
				<Card title="Objectives" style={{ marginBottom: "16px" }}>
					<p style={{ whiteSpace: "pre-wrap", margin: 0 }}>{program.Objectives}</p>
				</Card>
			)}

			{/* Drill Patterns */}
			<Card title="Drill Patterns">
				<p style={{ color: "#888" }}>
					Drill patterns for this program will be displayed here once the DrillPattern module is implemented.
				</p>
				{/* TODO: Add linked patterns table in Phase 2 */}
			</Card>

			{/* Audit Information */}
			<Card title="Audit Information" style={{ marginTop: "16px" }}>
				<Descriptions column={2} bordered>
					<Descriptions.Item label="Created On">
						{program.CreatedOnDt ? new Date(program.CreatedOnDt).toLocaleString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Created By">
						{program.CreatedBy || "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Modified On">
						{program.ModifiedOnDt ? new Date(program.ModifiedOnDt).toLocaleString() : "N/A"}
					</Descriptions.Item>
					<Descriptions.Item label="Modified By">
						{program.ModifiedBy || "N/A"}
					</Descriptions.Item>
				</Descriptions>
			</Card>
		</div>
	);
};
