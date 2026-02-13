/**
 * NamingConfigForm Component
 *
 * Form for configuring drill hole naming conventions
 */

import type { NamingConfig } from "../services/bulkCreationService";
import { Alert, Form, Input, InputNumber, Radio, Space, Tag } from "antd";
import React from "react";

interface NamingConfigFormProps {
	value: NamingConfig
	onChange: (config: NamingConfig) => void
	previewNames?: string[]
}

export const NamingConfigForm: React.FC<NamingConfigFormProps> = ({
	value,
	onChange,
	previewNames = [],
}) => {
	return (
		<Space direction="vertical" style={{ width: "100%" }} size="large">
			<Alert
				type="info"
				message="Naming Convention"
				description="Choose how drill hole names will be generated"
				showIcon
			/>

			<Form layout="vertical">
				<Form.Item label="Naming Type">
					<Radio.Group
						value={value.type}
						onChange={e => onChange({ ...value, type: e.target.value })}
					>
						<Space direction="vertical">
							<Radio value="sequential">
								<strong>Sequential Numbering</strong>
								<div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
									Generate names with sequential numbers (e.g., DH_001, DH_002, ...)
								</div>
							</Radio>
							<Radio value="grid">
								<strong>Grid-Based Naming</strong>
								<div style={{ fontSize: "12px", color: "#666", marginTop: "4px" }}>
									Generate names with row/column labels (e.g., DH_R01C01, DH_R01C02, ...)
								</div>
							</Radio>
						</Space>
					</Radio.Group>
				</Form.Item>

				<Form.Item
					label="Name Prefix"
					extra="This prefix will be added to all generated hole names"
				>
					<Input
						value={value.prefix}
						onChange={e => onChange({ ...value, prefix: e.target.value })}
						placeholder="e.g., DH_ or RC_ZONE_A_"
						maxLength={50}
					/>
				</Form.Item>

				{value.type === "sequential" && (
					<Form.Item
						label="Starting Number"
						extra="The first hole will use this number"
					>
						<InputNumber
							min={1}
							max={9999}
							value={value.startNumber || 1}
							onChange={num => num && onChange({ ...value, startNumber: num })}
							style={{ width: "200px" }}
						/>
					</Form.Item>
				)}

				{previewNames.length > 0 && (
					<Form.Item label="Preview Examples">
						<Space wrap>
							{previewNames.slice(0, 10).map((name, idx) => (
								<Tag key={idx} color="blue">{name}</Tag>
							))}
							{previewNames.length > 10 && (
								<Tag>
									... and
									{previewNames.length - 10}
									{" "}
									more
								</Tag>
							)}
						</Space>
					</Form.Item>
				)}

				{!value.prefix && (
					<Alert
						type="warning"
						message="No prefix specified"
						description="Consider adding a prefix to help identify these drill holes"
						showIcon
					/>
				)}
			</Form>
		</Space>
	);
};
