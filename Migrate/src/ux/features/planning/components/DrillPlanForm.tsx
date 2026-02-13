/**
 * DrillPlanForm Component
 *
 * Simplified form for creating and editing drill plans.
 * Uses Ant Design Form components for immediate operability.
 */

import type { VwDrillPlan } from "#src/data/api/database/data-contracts.js";
import type { FormInstance } from "antd";
import {
	Card,
	Col,
	DatePicker,
	Form,

	Input,
	InputNumber,
	Row,
	Select,
	Space,
} from "antd";
import React, { useEffect } from "react";
import { useDrillPlanLookups } from "../hooks";

const { Option } = Select;
const { TextArea } = Input;

export interface DrillPlanFormProps {
	form: FormInstance
	initialValues?: Partial<VwDrillPlan>
	readOnly?: boolean
}

/**
 * DrillPlanForm - Operational form for drill plan creation/editing
 *
 * Features:
 * - Dual naming support (PlannedHoleNm, ProposedHoleNm)
 * - Location and geometry fields
 * - Schedule and priority
 * - Status workflow ready
 */
export function DrillPlanForm({ form, initialValues, readOnly = false }: DrillPlanFormProps) {
	// Fetch lookup data from IndexedDB
	const lookups = useDrillPlanLookups();

	useEffect(() => {
		if (initialValues) {
			form.setFieldsValue(initialValues);
		}
	}, [initialValues, form]);

	const commonProps = {
		disabled: readOnly,
	};

	return (
		<Space direction="vertical" style={{ width: "100%" }} size="large">

			{/* HOLE NAMING */}
			<Card title="Hole Naming" size="small">
				<Row gutter={16}>
					<Col span={12}>

						<Form.Item
							label="Planned Hole Name"
							name="PlannedHoleNm"
							rules={[{ required: true, message: "Planned hole name is required" }]}
							tooltip="Primary identifier used during planning phase"
						>
							<Input {...commonProps} placeholder="e.g., DH-2024-001" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Proposed Hole Name"
							name="ProposedHoleNm"
							tooltip="Alternative identifier for planning"
						>
							<Input {...commonProps} placeholder="Optional alternative name" />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Other Hole Name"
							name="OtherHoleNm"
							tooltip="Additional identifier if needed"
						>
							<Input {...commonProps} placeholder="Optional" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Drill Pattern"
							name="DrillPattern"
							tooltip="Pattern used if created from bulk operation"
						>
							<Input {...commonProps} disabled placeholder="Set automatically for bulk plans" />
						</Form.Item>
					</Col>
				</Row>
			</Card>

			{/* LOCATION & GEOMETRY */}
			<Card title="Location & Geometry" size="small">
				<Row gutter={16}>
					<Col span={8}>
						<Form.Item
							label="Easting (m)"
							name="PlannedEasting"
							rules={[{ required: true, message: "Easting is required" }]}
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="0.00" precision={2} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="Northing (m)"
							name="PlannedNorthing"
							rules={[{ required: true, message: "Northing is required" }]}
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="0.00" precision={2} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="RL (m)"
							name="PlannedRL"
							rules={[{ required: true, message: "RL is required" }]}
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="0.00" precision={2} />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={8}>
						<Form.Item
							label="Total Depth (m)"
							name="PlannedTotalDepth"
							rules={[{ required: true, message: "Total depth is required" }]}
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="0.00" precision={2} min={0} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="Dip (°)"
							name="PlannedDip"
							rules={[{ required: true, message: "Dip is required" }]}
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="-90" min={-90} max={90} precision={1} />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="Azimuth (°)"
							name="PlannedAzimuth"
							rules={[{ required: true, message: "Azimuth is required" }]}
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="0" min={0} max={360} precision={1} />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Grid"
							name="Grid"
						>
							<Select
								{...commonProps}
								placeholder="Select grid system"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.grids.map(grid => (
									<Option key={grid.Code} value={grid.Code}>
										{grid.Description || grid.Code}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>
			</Card>

			{/* ORGANIZATION & PROJECT */}
			<Card title="Organization & Project" size="small">
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Organization"
							name="Organization"
							rules={[{ required: true, message: "Organization is required" }]}
						>
							<Select
								{...commonProps}
								placeholder="Select organization"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.organizations.map(org => (
									<Option key={org.Organization} value={org.Organization}>
										{org.Organization || org.Organization}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Project"
							name="Project"
							rules={[{ required: true, message: "Project is required" }]}
						>
							<Select
								{...commonProps}
								placeholder="Select project"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.projects.map(proj => (
									<Option key={proj.Project} value={proj.Project}>
										{proj.Project || proj.Project}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Target"
							name="Target"
						>
							<Select
								{...commonProps}
								placeholder="Select target"
								showSearch
								allowClear
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.targets.map(target => (
									<Option key={target.Target} value={target.Target}>
										{target.Target || target.Target}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Sub Target"
							name="SubTarget"
						>
							<Select
								{...commonProps}
								placeholder="Select sub target"
								showSearch
								allowClear
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.subTargets.map(subTarget => (
									<Option key={subTarget.SubTarget} value={subTarget.SubTarget}>
										{subTarget.SubTarget || subTarget.SubTarget}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Prospect"
							name="Prospect"
						>
							<Input {...commonProps} placeholder="Prospect name" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Tenement"
							name="Tenement"
						>
							<Input {...commonProps} placeholder="Tenement ID" />
						</Form.Item>
					</Col>
				</Row>
			</Card>

			{/* DRILL SPECIFICATIONS */}
			<Card title="Drill Specifications" size="small">
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Hole Type"
							name="HoleType"
						>
							<Select
								{...commonProps}
								placeholder="Select hole type"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.holeTypes.map(type => (
									<Option key={type.Code} value={type.Code}>
										{type.Description || type.Code}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Drill Type"
							name="DrillType"
						>
							<Select
								{...commonProps}
								placeholder="Select drill type"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.drillTypes.map(type => (
									<Option key={type.Code} value={type.Code}>
										{type.Description || type.Code}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Hole Purpose"
							name="HolePurpose"
						>
							<Select
								{...commonProps}
								placeholder="Select purpose"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.holePurposes.map(purpose => (
									<Option key={purpose.Code} value={purpose.Code}>
										{purpose.Description || purpose.Code}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Hole Purpose Detail"
							name="HolePurposeDetail"
						>
							<Input {...commonProps} placeholder="Additional details" />
						</Form.Item>
					</Col>
				</Row>
			</Card>

			{/* SCHEDULE & PRIORITY */}
			<Card title="Schedule & Priority" size="small">
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Planned Start"
							name="PlannedStart"
						>
							<DatePicker {...commonProps} style={{ width: "100%" }} format="YYYY-MM-DD" />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Planned Complete"
							name="PlannedComplete"
						>
							<DatePicker {...commonProps} style={{ width: "100%" }} format="YYYY-MM-DD" />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={8}>
						<Form.Item
							label="Drill Priority"
							name="DrillPriority"
							tooltip="Priority for drilling operations"
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} min={1} max={100} placeholder="1-100" />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="ODS Priority"
							name="ODSPriority"
							tooltip="Priority in Operations Data System"
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} min={1} max={100} placeholder="1-100" />
						</Form.Item>
					</Col>
					<Col span={8}>
						<Form.Item
							label="Overall Priority"
							name="Priority"
							tooltip="Overall priority ranking"
						>
							<Select
								{...commonProps}
								placeholder="Select priority"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.taskPriorities.map(priority => (
									<Option key={priority.Code} value={priority.Code}>
										{priority.Description || priority.Code}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Planned By"
							name="PlannedBy"
						>
							<Input {...commonProps} placeholder="Planner name" />
						</Form.Item>
					</Col>
				</Row>
			</Card>

			{/* ADDITIONAL INFORMATION */}
			<Card title="Additional Information" size="small">
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Water Table Depth (m)"
							name="WaterTableDepth"
						>
							<InputNumber {...commonProps} style={{ width: "100%" }} placeholder="0.00" precision={2} />
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="Site Prep"
							name="SitePrep"
						>
							<Select
								{...commonProps}
								placeholder="Site preparation status"
								showSearch
								loading={lookups.isLoading}
								filterOption={(input, option) =>
									((option?.children as unknown as string) || "")?.toLowerCase().includes(input.toLowerCase())}
							>
								{lookups.sitePreps.map(prep => (
									<Option key={prep.Code} value={prep.Code}>
										{prep.Description || prep.Code}
									</Option>
								))}
							</Select>
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={12}>
						<Form.Item
							label="Infill Target"
							name="InfillTarget"
						>
							<Select {...commonProps} placeholder="Infill drilling target">
								<Option value="YES">Yes</Option>
								<Option value="NO">No</Option>
							</Select>
						</Form.Item>
					</Col>
					<Col span={12}>
						<Form.Item
							label="TWF"
							name="TWF"
							tooltip="Target Working Face"
						>
							<Input {...commonProps} placeholder="TWF identifier" />
						</Form.Item>
					</Col>
				</Row>
				<Row gutter={16}>
					<Col span={24}>
						<Form.Item
							label="Comments"
							name="Comments"
						>
							<TextArea {...commonProps} rows={3} placeholder="Additional notes or comments" />
						</Form.Item>
					</Col>
				</Row>
			</Card>

		</Space>
	);
}
