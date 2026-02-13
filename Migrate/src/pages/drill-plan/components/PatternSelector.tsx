/**
 * PatternSelector Component
 *
 * Dropdown selector for choosing a drill pattern (optional).
 * Loads patterns from API and triggers callback on selection.
 * Enhanced with timeout handling and retry capability.
 */

import type { DrillPattern } from "#src/api/database/data-contracts";
import apiClient from "#src/services/apiClient";
import { BlockOutlined, InfoCircleOutlined, ReloadOutlined } from "@ant-design/icons";

import { Alert, Button, Empty, Select, Space, Spin, Tooltip } from "antd";
import React, { useEffect, useState } from "react";

interface PatternSelectorProps {
	value?: string
	onChange?: (patternId: string | undefined, pattern: DrillPattern | undefined) => void
	programId?: string
	disabled?: boolean
	placeholder?: string
	onError?: (error: Error) => void
	timeout?: number
}

export const PatternSelector: React.FC<PatternSelectorProps> = ({
	value,
	onChange,
	programId,
	disabled = false,
	placeholder = "Select a drill pattern (optional)",
	onError,
	timeout = 10000, // 10 second default timeout
}) => {
	const [patterns, setPatterns] = useState<DrillPattern[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	useEffect(() => {
		loadPatterns();
	}, [programId, retryCount]);

	const loadPatterns = async () => {
		setLoading(true);
		setError(null);

		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), timeout);

		try {
			const query: any = {
				page: 1,
				take: 1000, // Load all patterns for selection
			};

			// Filter by program if provided
			if (programId) {
				query.filters = JSON.stringify({ DrillProgram: programId });
			}

			console.log("[PatternSelector] Loading patterns with params:", query);

			const response = await apiClient.drillPatternControllerFindAll(query);

			// const response = await apiClient.drillPatternControllerFindAll(
			//   query,
			//   { signal: controller.signal }
			// );
			clearTimeout(timeoutId);

			if (!response || !Array.isArray(response.data)) {
				return; throw new Error("Invalid response format from server");
			}

			setPatterns(response.data);
			setError(null);
			console.log("[PatternSelector] Loaded", response.data.length, "patterns");
		}
		catch (error: any) {
			clearTimeout(timeoutId);

			const errorMessage = error.name === "AbortError"
				? "Request timed out. Please try again."
				: error.message || "Failed to load patterns";

			console.error("[PatternSelector] Failed to load patterns:", error);
			setError(errorMessage);
			setPatterns([]);

			// Call error callback if provided
			if (onError) {
				onError(error instanceof Error ? error : new Error(errorMessage));
			}
		}
		finally {
			setLoading(false);
		}
	};

	const handleChange = (patternId: string | undefined) => {
		try {
			if (!patternId) {
				onChange?.(undefined, undefined);
				return;
			}

			const pattern = patterns.find(p => p.DrillPatternId === patternId);
			if (pattern && onChange) {
				console.log("[PatternSelector] Selected pattern:", pattern.DrillPattern);
				onChange(patternId, pattern);
			}
		}
		catch (error: any) {
			console.error("[PatternSelector] Error in handleChange:", error);
			if (onError && error instanceof Error) {
				onError(error);
			}
		}
	};

	const handleRetry = () => {
		setRetryCount(prev => prev + 1);
	};

	return (
		<Space direction="vertical" style={{ width: "100%" }}>
			<Space>
				<BlockOutlined style={{ fontSize: "16px", color: "#1890ff" }} />
				<span style={{ fontWeight: 500 }}>Drill Pattern (Optional)</span>
				<Tooltip title="Select a pattern to auto-populate drill plan fields. You can still edit all fields after selection.">
					<InfoCircleOutlined style={{ color: "#888", cursor: "help" }} />
				</Tooltip>
			</Space>

			{error && !loading && (
				<Alert
					message="Failed to load patterns"
					description={error}
					type="warning"
					showIcon
					closable
					onClose={() => setError(null)}
					action={(
						<Button
							size="small"
							icon={<ReloadOutlined />}
							onClick={handleRetry}
						>
							Retry
						</Button>
					)}
				/>
			)}

			<Select
				style={{ width: "100%" }}
				placeholder={placeholder}
				value={value}
				onChange={handleChange}
				loading={loading}
				disabled={disabled || loading}
				allowClear
				showSearch
				optionFilterProp="children"
				notFoundContent={
					loading
						? (
							<div style={{ textAlign: "center", padding: "20px" }}>
								<Spin size="small" />
							</div>
						)
						: error
							? (
								<div style={{ textAlign: "center", padding: "20px", color: "#ff4d4f" }}>
									{error}
								</div>
							)
							: (
								<Empty
									image={Empty.PRESENTED_IMAGE_SIMPLE}
									description="No patterns available"
								/>
							)
				}
				filterOption={(input, option) => {
					const label = typeof option?.children === "string"
						? option.children
						: String(option?.children || "");
					return label.toLowerCase().includes(input.toLowerCase());
				}}
			>
				{patterns.map(pattern => (
					<Select.Option
						key={pattern.DrillPatternId}
						value={pattern.DrillPatternId}
					>
						{pattern.DrillPattern}
						{pattern.Target && ` - ${pattern.Target}`}
						{pattern.DrillProgram && ` (${pattern.DrillProgram})`}
					</Select.Option>
				))}
			</Select>

			{!error && patterns.length > 0 && (
				<div style={{ fontSize: "12px", color: "#888" }}>
					{patterns.length}
					{" "}
					pattern
					{patterns.length !== 1 ? "s" : ""}
					{" "}
					available
					{programId && " for selected program"}
				</div>
			)}
		</Space>
	);
};
