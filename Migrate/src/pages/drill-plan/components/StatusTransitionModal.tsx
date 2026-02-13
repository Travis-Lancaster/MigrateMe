/**
 * StatusTransitionModal Component
 *
 * Guided modal for status transitions with readiness checks
 */

import type { DrillPlan, DrillPlanStatusEnum } from "../types";
import { useUserStore } from "#src/store/user";
import { Button, DatePicker, Form, Input, Modal, Select, Space } from "antd";
import React from "react";
import { useStatusTransition } from "../hooks/useStatusTransition";
import { ReadinessChecklist } from "./ReadinessChecklist";

const { TextArea } = Input;
const { Option } = Select;

interface StatusTransitionModalProps {
	visible: boolean
	plan: DrillPlan | null
	toStatus?: DrillPlanStatusEnum
	onComplete: () => void
	onCancel: () => void
}

export const StatusTransitionModal: React.FC<StatusTransitionModalProps> = ({
	visible,
	plan,
	toStatus,
	onComplete,
	onCancel,
}) => {
	const [form] = Form.useForm();
	const user = useUserStore();
	const { handleTransition, checkReadiness, isExceptional, loading } = useStatusTransition();

	if (!plan || !toStatus)
		return null;

	const readiness = checkReadiness(plan, toStatus);
	const isExceptionalTransition = isExceptional(toStatus);

	const onSubmit = async (values: any) => {
		try {
			await handleTransition(plan.DrillPlanId, toStatus, {
				userRole: user.roles?.[0] || "viewer",
				reason: values.reason,
				comments: values.comments,
				ExpectedResumeOnDt: values.ExpectedResumeOnDt,
			});
			form.resetFields();
			onComplete();
		}
		catch (error) {
			// Error already shown by handleTransition
		}
	};

	return (
		<Modal
			open={visible}
			title={`Change Status: ${plan.DrillPlanStatus} → ${toStatus}`}
			onCancel={onCancel}
			footer={null}
			width={600}
			destroyOnClose
		>
			{/* Readiness checks for happy path */}
			{!isExceptionalTransition && readiness.checks.length > 0 && (
				<div style={{ marginBottom: "24px" }}>
					<ReadinessChecklist checks={readiness.checks} />
				</div>
			)}

			{/* Form for exceptional transitions */}
			{isExceptionalTransition && (
				<Form
					form={form}
					layout="vertical"
					onFinish={onSubmit}
					style={{ marginTop: "16px" }}
				>
					<Form.Item
						name="reason"
						label="Reason"
						rules={[{ required: true, message: "Reason is required" }]}
					>
						<Select placeholder="Select reason">
							<Option value="Weather">Weather conditions</Option>
							<Option value="Access">Access blocked</Option>
							<Option value="RigFailure">Rig failure</Option>
							<Option value="Safety">Safety concern</Option>
							<Option value="Permitting">Permitting issues</Option>
							<Option value="Other">Other</Option>
						</Select>
					</Form.Item>

					<Form.Item
						name="comments"
						label="Comments"
					>
						<TextArea rows={4} placeholder="Additional details..." />
					</Form.Item>

					{toStatus === "Suspended" && (
						<Form.Item
							name="ExpectedResumeOnDt"
							label="Expected Resume Date"
						>
							<DatePicker style={{ width: "100%" }} />
						</Form.Item>
					)}

					<Form.Item>
						<Space style={{ width: "100%", justifyContent: "flex-end" }}>
							<Button onClick={onCancel}>
								Cancel
							</Button>
							<Button
								type="primary"
								htmlType="submit"
								loading={loading}
							>
								{toStatus}
							</Button>
						</Space>
					</Form.Item>
				</Form>
			)}

			{/* Simple confirmation for happy path */}
			{!isExceptionalTransition && (
				<Space direction="vertical" style={{ width: "100%", marginTop: "16px" }}>
					<Button
						type="primary"
						loading={loading}
						onClick={() => onSubmit({})}
						disabled={!readiness.ready}
						block
					>
						{toStatus}
					</Button>
					<Button onClick={onCancel} block>
						Cancel
					</Button>
				</Space>
			)}
		</Modal>
	);
};
