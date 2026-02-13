/**
 * DrillPatternFormView Component
 *
 * Form for creating and editing drill patterns.
 * Includes DrillProgram selector dropdown.
 */

import type { DrillProgram } from "#src/pages/drill-program/types";
import type { CreateDrillPatternDto, UpdateDrillPatternDto } from "../types";
import { drillProgramService } from "#src/pages/drill-program/services";
import { ArrowLeftOutlined, SaveOutlined } from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Col,
	Form,
	Input,
	InputNumber,
	message,
	Row,
	Select,
	Space,
	Spin,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useDrillPatternDetail } from "../hooks";
import { useDrillPatternStore } from "../store/drill-pattern-store";

export const DrillPatternFormView: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [form] = Form.useForm();
	const isEdit = id && id !== "new";

	const { pattern, isLoading, error } = useDrillPatternDetail(isEdit ? id : "");
	const { createPattern, updatePattern, isSaving } = useDrillPatternStore();
	const [programs, setPrograms] = useState<DrillProgram[]>([]);
	const [loadingPrograms, setLoadingPrograms] = useState(false);

	// Load programs for dropdown
	useEffect(() => {
		const loadPrograms = async () => {
			setLoadingPrograms(true);
			try {
				const response = await drillProgramService.findAll(1, 1000);
				setPrograms(response.data);
			}
			catch (error) {
				console.error("[DrillPatternFormView] Failed to load programs:", error);
				message.error("Failed to load drill programs");
			}
			finally {
				setLoadingPrograms(false);
			}
		};
		loadPrograms();
	}, []);

	useEffect(() => {
		if (isEdit && pattern) {
			// Populate form with existing pattern data
			form.setFieldsValue({
				...pattern,
			});
		}
	}, [pattern, isEdit, form]);

	const handleSubmit = async (values: any) => {
		try {
			const formData = {
				...values,
			};

			console.log("[DrillPatternFormView] Submitting:", formData);

			if (isEdit) {
				await updatePattern(id, formData as UpdateDrillPatternDto);
				message.success("Drill pattern updated successfully");
				navigate(`/drill-pattern/${id}`);
			}
			else {
				const newPattern = await createPattern(formData as CreateDrillPatternDto);
				message.success("Drill pattern created successfully");
				navigate(`/drill-pattern/${newPattern.DrillPatternId}`);
			}
		}
		catch (error: any) {
			console.error("[DrillPatternFormView] Submit error:", error);
			message.error(error.message || "Failed to save drill pattern");
		}
	};

	if (isEdit && isLoading) {
		return (
			<div style={{ padding: "24px", textAlign: "center" }}>
				<Spin size="large" />
				<p style={{ marginTop: "16px" }}>Loading pattern details...</p>
			</div>
		);
	}

	if (isEdit && error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error Loading Pattern"
					description={error}
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

	return (
		<div style={{ padding: "24px" }}>
			{/* Header */}
			<div style={{ marginBottom: "24px" }}>
				<Space>
					<Button
						icon={<ArrowLeftOutlined />}
						onClick={() => navigate(isEdit ? `/drill-pattern/${id}` : "/drill-pattern")}
					>
						Back
					</Button>
					<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
						{isEdit ? "Edit Drill Pattern" : "Create Drill Pattern"}
					</h1>
				</Space>
			</div>

			<Form
				form={form}
				layout="vertical"
				onFinish={handleSubmit}
				initialValues={{
					ReportIncludeInd: true,
					ValidationStatus: 0,
					RowStatus: 1,
					ActiveInd: true,
				}}
			>
				{/* Parent Program Selection */}
				<Card title="Parent Program" style={{ marginBottom: "16px" }}>
					<Alert
						message="Select the drill program this pattern belongs to"
						type="info"
						showIcon
						style={{ marginBottom: "16px" }}
					/>
					<Form.Item
						label="Drill Program"
						name="DrillProgram"
						rules={[{ required: true, message: "Drill program is required" }]}
					>
						<Select
							placeholder="Select a drill program"
							loading={loadingPrograms}
							showSearch
							optionFilterProp="children"
							style={{ width: "100%" }}
						>
							{programs.map(program => (
								<Select.Option key={program.DrillProgramId} value={program.DrillProgram}>
									{program.DrillProgram}
									{" "}
									-
									{program.Project}
								</Select.Option>
							))}
						</Select>
					</Form.Item>
				</Card>

				{/* Basic Information */}
				<Card title="Pattern Information" style={{ marginBottom: "16px" }}>
					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Pattern Name"
								name="DrillPattern"
								rules={[{ required: true, message: "Pattern name is required" }]}
							>
								<Input placeholder="Enter pattern name" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Pattern Code"
								name="DrillPatternCode"
								rules={[{ required: true, message: "Pattern code is required" }]}
							>
								<Input placeholder="Enter pattern code" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Pattern Type"
								name="DrillPatternType"
								rules={[{ required: true, message: "Pattern type is required" }]}
							>
								<Input placeholder="Enter pattern type (e.g., Grid, Infill, Step-out)" />
							</Form.Item>
						</Col>
						<Col span={12}>
							<Form.Item
								label="Organization"
								name="Organization"
								rules={[{ required: true, message: "Organization is required" }]}
							>
								<Input placeholder="Enter organization" />
							</Form.Item>
						</Col>
					</Row>

					<Row gutter={16}>
						<Col span={12}>
							<Form.Item
								label="Target"
								name="Target"
								rules={[{ required: true, message: "Target is required" }]}
							>
								<Input placeholder="Enter target" />
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* Pattern Geometry */}
				<Card title="Pattern Geometry" style={{ marginBottom: "16px" }}>
					<Alert
						message="Define the spacing and orientation of drill holes in this pattern"
						type="info"
						showIcon
						style={{ marginBottom: "16px" }}
					/>

					<Row gutter={16}>
						<Col span={8}>
							<Form.Item
								label="Spacing X (meters)"
								name="SpacingX"
								tooltip="Horizontal spacing between drill holes"
							>
								<InputNumber
									style={{ width: "100%" }}
									placeholder="Enter X spacing"
									min={0}
									precision={2}
									step={10}
								/>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item
								label="Spacing Y (meters)"
								name="SpacingY"
								tooltip="Vertical spacing between drill holes"
							>
								<InputNumber
									style={{ width: "100%" }}
									placeholder="Enter Y spacing"
									min={0}
									precision={2}
									step={10}
								/>
							</Form.Item>
						</Col>
						<Col span={8}>
							<Form.Item
								label="Orientation (degrees)"
								name="Orientation"
								tooltip="Pattern orientation relative to north (0-360°)"
							>
								<InputNumber
									style={{ width: "100%" }}
									placeholder="Enter orientation"
									min={0}
									max={360}
									precision={1}
									step={15}
								/>
							</Form.Item>
						</Col>
					</Row>
				</Card>

				{/* Comments */}
				<Card title="Comments & Notes" style={{ marginBottom: "16px" }}>
					<Form.Item
						label="Pattern Comments"
						name="Comments"
					>
						<Input.TextArea
							rows={6}
							placeholder="Enter pattern description, notes, or special instructions..."
						/>
					</Form.Item>
				</Card>

				{/* Hidden Fields (required by backend) */}
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
							onClick={() => navigate(isEdit ? `/drill-pattern/${id}` : "/drill-pattern")}
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
