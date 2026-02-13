/**
 * AdvancedFilterModal Component
 *
 * Advanced filtering modal with date ranges and multi-criteria
 */

import type { DrillPlanFilters } from "../types";
import { FilterOutlined } from "@ant-design/icons";
import { Button, DatePicker, Form, Input, Modal, Select, Space } from "antd";
import React from "react";

const { RangePicker } = DatePicker;
const { Option } = Select;

interface AdvancedFilterModalProps {
	visible: boolean
	currentFilters: DrillPlanFilters
	onApply: (filters: DrillPlanFilters) => void
	onCancel: () => void
}

export const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
	visible,
	currentFilters,
	onApply,
	onCancel,
}) => {
	const [form] = Form.useForm();

	const handleApply = () => {
		const values = form.getFieldsValue();
		const filters: DrillPlanFilters = {};

		if (values.project)
			filters.project = values.project;
		if (values.organization)
			filters.organization = values.organization;
		if (values.target)
			filters.target = values.target;
		if (values.createdBy)
			filters.createdBy = values.createdBy;

		if (values.dateRange && values.dateRange.length === 2) {
			filters.dateFrom = values.dateRange[0].toDate();
			filters.dateTo = values.dateRange[1].toDate();
		}

		onApply(filters);
	};

	const handleReset = () => {
		form.resetFields();
		onApply({});
	};

	return (
		<Modal
			open={visible}
			title={(
				<Space>
					<FilterOutlined />
					<span>Advanced Filters</span>
				</Space>
			)}
			onCancel={onCancel}
			footer={[
				<Button key="reset" onClick={handleReset}>
					Reset
				</Button>,
				<Button key="cancel" onClick={onCancel}>
					Cancel
				</Button>,
				<Button key="apply" type="primary" onClick={handleApply}>
					Apply Filters
				</Button>,
			]}
			width={600}
		>
			<Form
				form={form}
				layout="vertical"
				initialValues={{
					project: currentFilters.project,
					organization: currentFilters.organization,
					target: currentFilters.target,
					createdBy: currentFilters.createdBy,
				}}
			>
				<Form.Item label="Project" name="project">
					<Input placeholder="Filter by project" />
				</Form.Item>

				<Form.Item label="Organization" name="organization">
					<Input placeholder="Filter by organization" />
				</Form.Item>

				<Form.Item label="Target" name="target">
					<Input placeholder="Filter by target" />
				</Form.Item>

				<Form.Item label="Planned By" name="createdBy">
					<Input placeholder="Filter by planner" />
				</Form.Item>

				<Form.Item label="Date Range" name="dateRange">
					<RangePicker
						style={{ width: "100%" }}
						format="YYYY-MM-DD"
						placeholder={["Start Date", "End Date"]}
					/>
				</Form.Item>
			</Form>
		</Modal>
	);
};
