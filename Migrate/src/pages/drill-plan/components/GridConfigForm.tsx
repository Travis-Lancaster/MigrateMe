/**
 * GridConfigForm Component
 *
 * Form for configuring drill hole grid parameters (rows, columns, origin coordinates)
 */

import type { DrillPattern } from "#src/api/database/data-contracts";
import type { GridConfig } from "../services/bulkCreationService";
import { Alert, Col, Form, InputNumber, Row, Space } from "antd";
import React from "react";

interface GridConfigFormProps {
	value: GridConfig
	onChange: (config: GridConfig) => void
	pattern: DrillPattern | null
}

export const GridConfigForm: React.FC<GridConfigFormProps> = ({
	value,
	onChange,
	pattern,
}) => {
	if (!pattern) {
		return (
			<Alert
				type="warning"
				message="Please select a pattern first"
				showIcon
			/>
		);
	}

	const totalHoles = value.rows * value.columns;
	const spacingInfo = pattern.SpacingX && pattern.SpacingY
		? `${pattern.SpacingX}m x ${pattern.SpacingY}m spacing`
		: "Spacing not configured";

	return (
		<Space direction="vertical" style={{ width: "100%" }} size="large">
			<Alert
				type="info"
				message="Grid Configuration"
				description={`Using pattern: ${pattern.DrillPattern} (${spacingInfo})`}
				showIcon
			/>

			<Form layout="vertical">
				<Form.Item
					label="Grid Dimensions"
					extra={`Total holes: ${totalHoles}`}
				>
					<Row gutter={16}>
						<Col span={12}>
							<InputNumber
								addonBefore="Rows"
								min={1}
								max={100}
								value={value.rows}
								onChange={rows => rows && onChange({ ...value, rows })}
								style={{ width: "100%" }}
								placeholder="Number of rows"
							/>
						</Col>
						<Col span={12}>
							<InputNumber
								addonBefore="Columns"
								min={1}
								max={100}
								value={value.columns}
								onChange={columns => columns && onChange({ ...value, columns })}
								style={{ width: "100%" }}
								placeholder="Number of columns"
							/>
						</Col>
					</Row>
				</Form.Item>

				<Form.Item label="Origin Coordinates">
					<Space direction="vertical" style={{ width: "100%" }}>
						<InputNumber
							addonBefore="Easting (m)"
							precision={2}
							value={value.originEasting}
							onChange={v => v !== null && onChange({ ...value, originEasting: v })}
							style={{ width: "100%" }}
							placeholder="Enter easting coordinate"
						/>
						<InputNumber
							addonBefore="Northing (m)"
							precision={2}
							value={value.originNorthing}
							onChange={v => v !== null && onChange({ ...value, originNorthing: v })}
							style={{ width: "100%" }}
							placeholder="Enter northing coordinate"
						/>
						<InputNumber
							addonBefore="RL (m)"
							precision={2}
							value={value.originRL}
							onChange={v => v !== null && onChange({ ...value, originRL: v })}
							style={{ width: "100%" }}
							placeholder="Enter reduced level"
						/>
					</Space>
				</Form.Item>

				{pattern.Orientation !== null && pattern.Orientation !== 0 && (
					<Alert
						type="info"
						message={`Grid will be rotated ${pattern.Orientation}° from north`}
						showIcon
					/>
				)}

				{totalHoles > 100 && (
					<Alert
						type="warning"
						message={`Creating ${totalHoles} drill plans will take some time`}
						description="Consider creating in smaller batches if this is a very large grid"
						showIcon
					/>
				)}
			</Form>
		</Space>
	);
};
