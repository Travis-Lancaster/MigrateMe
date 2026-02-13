/**
 * BulkActionsBar Component
 *
 * Action bar for bulk operations on selected drill plans
 */

import { CloseOutlined, DeleteOutlined } from "@ant-design/icons";
import { Button, message, Modal, Space } from "antd";
import React from "react";
import { useDrillPlanStore } from "../store/drill-plan-store";

interface BulkActionsBarProps {
	selectedCount: number
	onClearSelection: () => void
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
	selectedCount,
	onClearSelection,
}) => {
	const { selectedPlanIds, bulkDeletePlans, isSaving } = useDrillPlanStore();

	const handleBulkDelete = () => {
		Modal.confirm({
			title: "Delete Selected Drill Plans",
			content: `Are you sure you want to delete ${selectedCount} drill plan(s)? This action cannot be undone.`,
			okText: "Delete",
			okType: "danger",
			onOk: async () => {
				try {
					await bulkDeletePlans(selectedPlanIds);
					message.success(`Successfully deleted ${selectedCount} drill plan(s)`);
					onClearSelection();
				}
				catch (error: any) {
					message.error(error.message || "Failed to delete drill plans");
				}
			},
		});
	};

	if (selectedCount === 0) {
		return null;
	}

	return (
		<div
			style={{
				position: "fixed",
				bottom: "24px",
				left: "50%",
				transform: "translateX(-50%)",
				background: "#fff",
				padding: "16px 24px",
				borderRadius: "8px",
				boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
				zIndex: 1000,
				display: "flex",
				alignItems: "center",
				gap: "16px",
			}}
		>
			<span style={{ fontWeight: 600 }}>
				{selectedCount}
				{" "}
				item
				{selectedCount > 1 ? "s" : ""}
				{" "}
				selected
			</span>

			<Space>
				<Button
					danger
					icon={<DeleteOutlined />}
					onClick={handleBulkDelete}
					loading={isSaving}
				>
					Delete
				</Button>

				<Button
					icon={<CloseOutlined />}
					onClick={onClearSelection}
				>
					Clear Selection
				</Button>
			</Space>
		</div>
	);
};
