/**
 * DrillProgramFormView Component
 *
 * Form for creating and editing drill programs.
 * Follows the same pattern as DrillPlanFormView.
 */

import type { CreateDrillProgramDto, UpdateDrillProgramDto } from "../types";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	DatePicker,
	Form,
	Input,
	InputNumber,
	message,
	Row,
	Space,
	Spin,
} from "antd";
import dayjs from "dayjs";
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router";
import { useDrillProgramDetail } from "../hooks";
import { useDrillProgramStore } from "../store/drill-program-store";

export const DrillProgramFormView: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const isEdit = id && id !== "new";

	const { program, isLoading, error } = useDrillProgramDetail(isEdit ? id : "");
	const { createProgram, updateProgram, isSaving } = useDrillProgramStore();

	useEffect(() => {
		if (isEdit && program) {
			// Populate form with existing program data
			form.setFieldsValue({
				...program,
				PlannedStart: program.PlannedStart ? dayjs(program.PlannedStart) : undefined,
				PlannedEnd: program.PlannedEnd ? dayjs(program.PlannedEnd) : undefined,
				ActualStart: program.ActualStart ? dayjs(program.ActualStart) : undefined,
				ActualEnd: program.ActualEnd ? dayjs(program.ActualEnd) : undefined,
			});
		}
	}, [program, isEdit, form]);

	const handleSubmit = async (values: any) => {
		try {
			const formData = {
				...values,
				PlannedStart: values.PlannedStart?.toISOString(),
				PlannedEnd: values.PlannedEnd?.toISOString(),
				ActualStart: values.ActualStart?.toISOString(),
				ActualEnd: values.ActualEnd?.toISOString(),
			};

			console.log("[DrillProgramFormView] Submitting:", formData);

			if (isEdit) {
				await updateProgram(id, formData as UpdateDrillProgramDto);
				message.success("Drill program updated successfully");
				navigate(`/drill-program/${id}`);
			}
			else {
				const newProgram = await createProgram(formData as CreateDrillProgramDto);
				message.success("Drill program created successfully");
				navigate(`/drill-program/${newProgram.DrillProgramId}`);
			}
		}
		catch (error: any) {
			console.error("[DrillProgramFormView] Submit error:", error);
			message.error(error.message || "Failed to save drill program");
		}
	};

	if (isEdit && isLoading) {
		return (
			<div style={{ padding: "24px", textAlign: "center" }}>
				<Spin size="large" />
				<p style={{ marginTop: "16px" }}>Loading program details...</p>
			</div>
		);
	}

	if (isEdit && error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Program"
					description={error}
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

	return (
		<div style={{ padding: "24px" }}>
			{/* Header */}
			<div style={{ marginBottom: "24px" }}>
				<Space>
					<Button
						icon={<ArrowLeftOutlined />}
						onClick={() => navigate(isEdit ? `/drill-program/${id}` : "/drill-program")}
					>
						Back
					</Button>
					<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
						{isEdit ? "Edit Drill Program" : "Create Drill Program"}
					</h1>
				</Space>
			</div>

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					DataSource: "Manual Entry",
					Status: "Draft",
					ReportIncludeInd: true,
					ValidationStatus: 0,
					RowStatus: 1,
					ActiveInd: true,
				}}
			>
				{/* Basic Information */}
				<Card title="Basic Information" style={{ marginBottom: "16px" }}>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Program Name"
								name="DrillProgram"
								rules={[{ required: true, message: "Program name is required" }]}
							>
								<Input placeholder="Enter program name" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Program Code"
								name="ProgramCode"
							>
								<Input placeholder="Enter program code" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Program Type"
								name="ProgramType"
							>
								<Input placeholder="Enter program type (e.g., Exploration, Production)" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Status"
								name="Status"
								rules={[{ required: true, message: "Status is required" }]}
							>
								<Input placeholder="Enter status (e.g., Draft, Planning, Active)" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Organization"
								name="Organization"
								rules={[{ required: true, message: "Organization is required" }]}
							>
								<Input placeholder="Enter organization" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Project"
								name="Project"
								rules={[{ required: true, message: "Project is required" }]}
							>
								<Input placeholder="Enter project" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Tenement"
								name="Tenement"
							>
								<Input placeholder="Enter tenement" />
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* Contractor & Equipment */}
				<Card title="Contractor & Equipment" style={{ marginBottom: "16px" }}>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Contractor"
								name="Contractor"
								rules={[{ required: true, message: "Contractor is required" }]}
							>
								<Input placeholder="Enter contractor name" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Rig Type"
								name="RigType"
								rules={[{ required: true, message: "Rig type is required" }]}
							>
								<Input placeholder="Enter rig type" />
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* Schedule & Budget */}
				<Card title="Schedule & Budget" style={{ marginBottom: "16px" }}>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Planned Start Date"
								name="PlannedStart"
							>
								<DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Planned End Date"
								name="PlannedEnd"
							>
								<DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Actual Start Date"
								name="ActualStart"
							>
								<DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Actual End Date"
								name="ActualEnd"
							>
								<DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Budget"
								name="Budget"
							>
								<InputNumber
									style={{ width: "100%" }}
									placeholder="Enter budget amount"
									min={0}
									precision={2}
									formatter={value => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
									parser={value => value!.replace(/\$\s?|(,*)/g, "") as any}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* Objectives */}
				<Card title="Objectives & Notes" style={{ marginBottom: "16px" }}>
					<Form.Item
						label="Program Objectives"
						name="Objectives"
					>
						<Input.TextArea
							rows={6}
							placeholder="Enter program objectives, goals, and notes..."
						/>
					</Form.Item>
				</Card>

				{/* Hidden Fields (required by backend) */}
				<Form.Item name="DataSource" hidden>
					<Input />
				</Form.Item>
				<Form.Item name="ReportIncludeInd" hidden valuePropName="checked">
					<Input type="checkbox" />
				</Form.Item>
				<Form.Item name="ValidationStatus" hidden>
					<InputNumber />
				</Form.Item>
				<Form.Item name="RowStatus" hidden>
					<InputNumber />
				</Form.Item>
				<Form.Item name="ActiveInd" hidden valuePropName="checked">
					<Input type="checkbox" />
				</Form.Item>

				{/* Actions */}
				<Card>
					<Space style={{ width: "100%", justifyContent: "flex-end" }}>
						<Button
							onClick={() => navigate(isEdit ? `/drill-program/${id}` : "/drill-program")}
						>
							Cancel
						</Button>
						<Button
							type="primary"
							htmlType="submit"
							icon={<SaveOutlined />}
							loading={isSaving}
						>
							{isEdit ? "Update" : "Create"}
						</Button>
					</Space>
				</Card>
			</Form>
		</div>
	);
};
