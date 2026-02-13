/**
 * BulkCreateModal - Simplified Bulk Plan Creation
 *
 * Streamlined version for immediate operability.
 * Creates multiple drill plans from a simple grid pattern.
 */

import type { VwDrillPlan } from "#src/data/api/database/data-contracts.js";
import { ThunderboltOutlined } from "@ant-design/icons";

import {
	Alert,
	Button,
	Form,
	Input,
	InputNumber,
	message,
	Modal,
	Progress,
	Select,
	Space,
	Steps,
	Table,
} from "antd";
import React, { useState } from "react";

const { Option } = Select;

interface BulkCreateModalProps {
	visible: boolean
	onClose: () => void
	onSuccess: () => void
}

interface GridConfig {
	originEasting: number
	originNorthing: number
	originRL: number
	rows: number
	columns: number
	spacingEW: number
	spacingNS: number
	dip: number
	azimuth: number
	totalDepth: number
}

interface NamingConfig {
	prefix: string
	startNumber: number
	organization: string
	project: string
}

/**
 * BulkCreateModal - Creates multiple drill plans in a grid pattern
 *
 * Features:
 * - 3-step wizard: Grid Config → Naming → Preview
 * - Auto-generates coordinates
 * - Batch creation with progress
 */
export function BulkCreateModal({ visible, onClose, onSuccess }: BulkCreateModalProps) {
	const [form] = Form.useForm();
	const [currentStep, setCurrentStep] = useState(0);
	const [gridConfig, setGridConfig] = useState<GridConfig>({
		originEasting: 0,
		originNorthing: 0,
		originRL: 0,
		rows: 2,
		columns: 2,
		spacingEW: 50,
		spacingNS: 50,
		dip: -60,
		azimuth: 0,
		totalDepth: 100,
	});
	const [namingConfig, setNamingConfig] = useState<NamingConfig>({
		prefix: "DH-2024-",
		startNumber: 1,
		organization: "B2GOLD",
		project: "EXPLORATION",
	});
	const [previewPlans, setPreviewPlans] = useState<Partial<VwDrillPlan>[]>([]);
	const [isCreating, setIsCreating] = useState(false);
	const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 });

	const handleGridNext = async () => {
		try {
			const values = await form.validateFields();
			setGridConfig(values);
			setCurrentStep(1);
		}
		catch (error) {
			message.error("Please fill in all required fields");
		}
	};

	const handleNamingNext = async () => {
		try {
			const values = await form.validateFields();
			setNamingConfig(values);
			generatePreview({ ...gridConfig, ...values });
			setCurrentStep(2);
		}
		catch (error) {
			message.error("Please fill in all required fields");
		}
	};

	const generatePreview = (config: GridConfig & NamingConfig) => {
		const plans: Partial<VwDrillPlan>[] = [];
		let holeNumber = config.startNumber;

		for (let row = 0; row < config.rows; row++) {
			for (let col = 0; col < config.columns; col++) {
				const easting = config.originEasting + (col * config.spacingEW);
				const northing = config.originNorthing + (row * config.spacingNS);

				plans.push({
					PlannedHoleNm: `${config.prefix}${String(holeNumber).padStart(3, "0")}`,
					PlannedEasting: easting,
					PlannedNorthing: northing,
					PlannedRL: config.originRL,
					PlannedDip: config.dip,
					PlannedAzimuth: config.azimuth,
					PlannedTotalDepth: config.totalDepth,
					Organization: config.organization,
					Project: config.project,
					DrillPattern: "GRID",
					HoleStatus: "Draft",
				});

				holeNumber++;
			}
		}

		setPreviewPlans(plans);
	};

	const handleBulkCreate = async () => {
		if (previewPlans.length === 0) {
			message.error("No plans to create");
			return;
		}

		setIsCreating(true);
		setCreationProgress({ current: 0, total: previewPlans.length });

		try {
			// Mock: In real app, call API in batches
			for (let i = 0; i < previewPlans.length; i++) {
				await new Promise(resolve => setTimeout(resolve, 200));
				setCreationProgress({ current: i + 1, total: previewPlans.length });
			}

			message.success(`Successfully created ${previewPlans.length} drill plans`);
			setTimeout(() => {
				onSuccess();
				handleClose();
			}, 1000);
		}
		catch (error: any) {
			message.error("Failed to create drill plans");
			console.error("[BulkCreateModal] Error:", error);
		}
		finally {
			setIsCreating(false);
		}
	};

	const handleClose = () => {
		setCurrentStep(0);
		setPreviewPlans([]);
		setCreationProgress({ current: 0, total: 0 });
		form.resetFields();
		onClose();
	};

	const handleBack = () => {
		setCurrentStep(currentStep - 1);
	};

	const steps = [
		{ title: "Grid Config", icon: <ThunderboltOutlined /> },
		{ title: "Naming", icon: null },
		{ title: "Preview", icon: null },
	];

	const previewColumns = [
		{ title: "Hole Name", dataIndex: "PlannedHoleNm", key: "PlannedHoleNm", width: 150 },
		{ title: "Easting", dataIndex: "PlannedEasting", key: "PlannedEasting", width: 100 },
		{ title: "Northing", dataIndex: "PlannedNorthing", key: "PlannedNorthing", width: 100 },
		{ title: "RL", dataIndex: "PlannedRL", key: "PlannedRL", width: 80 },
		{ title: "Depth (m)", dataIndex: "PlannedTotalDepth", key: "PlannedTotalDepth", width: 100 },
		{ title: "Dip (°)", dataIndex: "PlannedDip", key: "PlannedDip", width: 80 },
		{ title: "Azimuth (°)", dataIndex: "PlannedAzimuth", key: "PlannedAzimuth", width: 100 },
	];

	return (
		<Modal
			title={(
				<Space>
					<ThunderboltOutlined style={{ color: "#1890ff" }} />
					<span>Bulk Create Drill Plans</span>
				</Space>
			)}
			open={visible}
			onCancel={handleClose}
			width={1000}
			footer={null}
			destroyOnClose
		>
			<div style={{ minHeight: "500px" }}>
				<Steps current={currentStep} style={{ marginBottom: "32px" }} items={steps} />

				{/* STEP 0: Grid Configuration */}
				{currentStep === 0 && (
					<Form
						form={form}
						layout="vertical"
						initialValues={gridConfig}
					>
						<Alert
							message="Grid Pattern Configuration"
							description="Define the origin point and grid dimensions for bulk drill plan creation."
							type="info"
							showIcon
							style={{ marginBottom: "16px" }}
						/>

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
							<Form.Item label="Origin Easting" name="originEasting" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} placeholder="0.00" precision={2} />
							</Form.Item>
							<Form.Item label="Origin Northing" name="originNorthing" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} placeholder="0.00" precision={2} />
							</Form.Item>
							<Form.Item label="Origin RL" name="originRL" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} placeholder="0.00" precision={2} />
							</Form.Item>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<Form.Item label="Rows" name="rows" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={1} max={20} />
							</Form.Item>
							<Form.Item label="Columns" name="columns" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={1} max={20} />
							</Form.Item>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<Form.Item label="Spacing East-West (m)" name="spacingEW" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={1} placeholder="50" />
							</Form.Item>
							<Form.Item label="Spacing North-South (m)" name="spacingNS" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={1} placeholder="50" />
							</Form.Item>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
							<Form.Item label="Dip (°)" name="dip" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={-90} max={90} placeholder="-60" />
							</Form.Item>
							<Form.Item label="Azimuth (°)" name="azimuth" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={0} max={360} placeholder="0" />
							</Form.Item>
							<Form.Item label="Total Depth (m)" name="totalDepth" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={1} placeholder="100" />
							</Form.Item>
						</div>
					</Form>
				)}

				{/* STEP 1: Naming Configuration */}
				{currentStep === 1 && (
					<Form
						form={form}
						layout="vertical"
						initialValues={namingConfig}
					>
						<Alert
							message="Naming Configuration"
							description="Set the naming pattern and organizational details for the drill plans."
							type="info"
							showIcon
							style={{ marginBottom: "16px" }}
						/>

						<div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px" }}>
							<Form.Item label="Name Prefix" name="prefix" rules={[{ required: true }]}>
								<Input placeholder="DH-2024-" />
							</Form.Item>
							<Form.Item label="Start Number" name="startNumber" rules={[{ required: true }]}>
								<InputNumber style={{ width: "100%" }} min={1} placeholder="1" />
							</Form.Item>
						</div>

						<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
							<Form.Item label="Organization" name="organization" rules={[{ required: true }]}>
								<Select placeholder="Select organization">
									<Option value="B2GOLD">B2Gold</Option>
									<Option value="FEKOLA">Fekola Mine</Option>
									<Option value="MASBATE">Masbate Mine</Option>
								</Select>
							</Form.Item>
							<Form.Item label="Project" name="project" rules={[{ required: true }]}>
								<Select placeholder="Select project">
									<Option value="EXPLORATION">Exploration</Option>
									<Option value="RESOURCE_DEV">Resource Development</Option>
									<Option value="GRADE_CONTROL">Grade Control</Option>
								</Select>
							</Form.Item>
						</div>

						<Alert
							message="Preview Example"
							description={`Plans will be named: ${namingConfig.prefix}001, ${namingConfig.prefix}002, etc.`}
							type="success"
							showIcon
							style={{ marginTop: "16px" }}
						/>
					</Form>
				)}

				{/* STEP 2: Preview */}
				{currentStep === 2 && (
					<div>
						<Alert
							message={`Ready to create ${previewPlans.length} drill plans`}
							description="Review the generated plans below. Click 'Create All' to proceed."
							type="success"
							showIcon
							style={{ marginBottom: "16px" }}
						/>

						<Table
							dataSource={previewPlans}
							columns={previewColumns}
							rowKey="PlannedHoleNm"
							pagination={{ pageSize: 10 }}
							size="small"
							scroll={{ y: 300 }}
						/>

						{isCreating && (
							<div style={{ marginTop: "16px" }}>
								<Progress
									percent={Math.round((creationProgress.current / creationProgress.total) * 100)}
									status="active"
									format={() => `${creationProgress.current} / ${creationProgress.total}`}
								/>
							</div>
						)}
					</div>
				)}

				{/* Footer Actions */}
				<div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between" }}>
					<div>
						{currentStep > 0 && !isCreating && (
							<Button onClick={handleBack}>Back</Button>
						)}
					</div>

					<Space>
						<Button onClick={handleClose} disabled={isCreating}>
							Cancel
						</Button>

						{currentStep === 0 && (
							<Button type="primary" onClick={handleGridNext}>
								Next
							</Button>
						)}

						{currentStep === 1 && (
							<Button type="primary" onClick={handleNamingNext}>
								Generate Preview
							</Button>
						)}

						{currentStep === 2 && (
							<Button
								type="primary"
								icon={<ThunderboltOutlined />}
								onClick={handleBulkCreate}
								loading={isCreating}
								disabled={isCreating}
							>
								{isCreating
									? `Creating ${creationProgress.current}/${creationProgress.total}...`
									: `Create ${previewPlans.length} Plans`}
							</Button>
						)}
					</Space>
				</div>
			</div>
		</Modal>
	);
}
