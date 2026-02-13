/**
 * QuickCreateButton Component
 *
 * Provides a dropdown menu to quickly create a drill plan from a pattern.
 * Enhanced with error handling, timeout, and retry capability.
 */

import type { MenuProps } from "antd";
import type { DrillPattern } from "../../drill-pattern/types";
import { apiClient } from "#src/services/apiClient";

import { ReloadOutlined, ThunderboltOutlined, WarningOutlined } from "@ant-design/icons";
import { Button, Dropdown, message, Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";

interface QuickCreateButtonProps {
	disabled?: boolean
	timeout?: number
}

export const QuickCreateButton: React.FC<QuickCreateButtonProps> = ({
	disabled = false,
	timeout = 10000, // 10 second default timeout
}) => {
	const navigate = useNavigate();
	const [patterns, setPatterns] = useState<DrillPattern[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		loadPatterns();
	}, [retryCount]);

	const loadPatterns = async () => {
		setLoading(true);
		setError(null);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const response = await apiClient.drillPatternControllerFindAll({ page: 1, take: 100 });
			// .request({
			//   method: 'GET',
			//   path: '/api/v1/drill-pattern',
			//   query: {
			//     page: '1',
			//     take: '100'
			//   },
			//   signal: controller.signal
			// });

			clearTimeout(timeoutId);

			if (!response || !Array.isArray(response.data)) {
				throw new Error("Invalid response format from server");
			}

			setPatterns(response.data);
			setError(null);
		}
		catch (error: any) {
			clearTimeout(timeoutId);

			const errorMessage = error.name === "AbortError"
				? "Request timed out"
				: error.message || "Failed to load patterns";

			console.error("[QuickCreateButton] Error loading patterns:", error);
			setError(errorMessage);
			setPatterns([]);
			message.error(`Failed to load drill patterns: ${errorMessage}`);
		}
		finally {
			setLoading(false);
		}
	};

	const handlePatternSelect = (patternId: string) => {
		try {
			// Navigate to create form with pattern pre-selected via state
			navigate("/drill-plan/new", { state: { patternId } });
			message.success("Creating drill plan from pattern...");
		}
		catch (error: any) {
			console.error("[QuickCreateButton] Navigation error:", error);
			message.error("Failed to navigate to create form");
		}
	};

	const handleRetry = () => {
		setRetryCount(prev => prev + 1);
	};

	const menuItems: MenuProps["items"] = error
		? [
			{
				key: "error",
				label: (
					<div style={{ color: "#ff4d4f" }}>
						<WarningOutlined />
						{" "}
						{error}
					</div>
				),
				disabled: true,
			},
			{
				key: "retry",
				label: (
					<div>
						<ReloadOutlined />
						{" "}
						Retry
					</div>
				),
				onClick: handleRetry,
			},
		]
		: patterns.length > 0
			? patterns.map(pattern => ({
				key: pattern.DrillPatternId,
				label: (
					<div>
						<div style={{ fontWeight: 500 }}>{pattern.DrillPattern}</div>
						<div style={{ fontSize: "12px", color: "#8c8c8c" }}>
							{pattern.Organization}
							{" "}
							•
							{pattern.Target}
						</div>
					</div>
				),
				onClick: () => handlePatternSelect(pattern.DrillPatternId),
			}))
			: [
				{
					key: "no-patterns",
					label: "No patterns available",
					disabled: true,
				},
			];

	const button = (
		<Button
			type="default"
			icon={loading ? <Spin size="small" /> : error ? <WarningOutlined /> : <ThunderboltOutlined />}
			disabled={disabled || loading}
			danger={!!error}
			style={{
				borderColor: error ? "#ff4d4f" : "#52c41a",
				color: error ? "#ff4d4f" : "#52c41a",
			}}
		>
			Quick Create from Pattern
		</Button>
	);

	return (
		<Dropdown
			menu={{ items: menuItems }}
			placement="bottomRight"
			disabled={disabled || loading}
			trigger={["click"]}
		>
			{error
				? (
					<Tooltip title={`Error: ${error}. Click to retry.`}>
						{button}
					</Tooltip>
				)
				: (
					button
				)}
		</Dropdown>
	);
};
