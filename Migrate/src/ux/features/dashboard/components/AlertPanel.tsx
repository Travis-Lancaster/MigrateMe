/**
 * AlertPanel Component
 * Shows validation alerts and warnings
 */

import { CloseCircleOutlined, InfoCircleOutlined, WarningOutlined } from "@ant-design/icons";
import { Alert, Card } from "antd";

export function AlertPanel() {
	// TODO: Connect to actual alerts from validation system
	const mockAlerts = [
		{ type: "error", message: "DH-03: Gap detected at 145m" },
		{ type: "warning", message: "5 changes pending sync" },
		{ type: "info", message: "New survey data available" },
	];

	return (
		<Card title="⚠️ Alerts" size="small">
			<div className="space-y-2">
				{mockAlerts.map((alert, index) => {
					const icon = alert.type === "error"
						? <CloseCircleOutlined />
						: alert.type === "warning"
							? <WarningOutlined />
							: <InfoCircleOutlined />;

					return (
						<Alert
							key={index}
							message={alert.message}
							type={alert.type as any}
							icon={icon}
							showIcon
							className="text-sm"
						/>
					);
				})}
			</div>
		</Card>
	);
}
