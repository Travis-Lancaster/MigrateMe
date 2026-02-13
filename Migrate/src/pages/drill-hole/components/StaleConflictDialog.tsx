/**
 * StaleConflictDialog Component
 *
 * Centralized modal that detects and resolves stale section conflicts.
 * Shows when server data has changed while user has unsaved local changes.
 * Displays who modified the data and when.
 */

import type { SectionVersionDto } from "#src/api/database/data-contracts.js";
import type { SectionKey } from "#src/types/drillhole";

import { ClockCircleOutlined, ExclamationCircleOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Modal, Space, Typography } from "antd";
import React from "react";

const { Text, Title } = Typography;

interface StaleConflictDialogProps {
	visible: boolean
	staleSections: SectionKey[]
	serverVersions: SectionVersionDto[]
	onRefresh: () => Promise<void>
	onCancel: () => void
}

// Map API Description to section display names
const SECTION_DISPLAY_NAMES: Record<string, string> = {
	Collar: "Collar",
	RigSetup: "Rig Sheet",
	DrillMethod: "Drill Method",
	Survey: "Survey",
	SurveyLog: "Survey Log",
	GeologyCombinedLog: "Geology Combined Log",
	Sample: "Sample",
};

// Map sectionKey to API Description
const SECTION_KEY_TO_DESCRIPTION: Record<string, string> = {
	collar: "Collar",
	rigsheet: "RigSetup",
	drillmethod: "DrillMethod",
	survey: "Survey",
	geocombined: "GeologyCombinedLog",
	sample: "Sample",
};

/**
 * Dialog that prompts user to resolve conflicts when sections are stale
 * Shows who modified each section and when
 */
export const StaleConflictDialog: React.FC<StaleConflictDialogProps> = ({
	visible,
	staleSections,
	serverVersions,
	onRefresh,
	onCancel,
}) => {
	const [loading, setLoading] = React.useState(false);

	const handleRefresh = async () => {
		setLoading(true);
		try {
			await onRefresh();
		}
		finally {
			setLoading(false);
		}
	};

	// Find server version info for a section key
	const getVersionInfo = (sectionKey: SectionKey): SectionVersionDto | undefined => {
		const description = SECTION_KEY_TO_DESCRIPTION[sectionKey];
		return serverVersions.find(v => v.Description === description);
	};

	// Format date/time for display
	const formatDateTime = (dateStr: string): string => {
		try {
			const date = new Date(dateStr);
			return date.toLocaleString("en-US", {
				month: "short",
				day: "numeric",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		}
		catch {
			return dateStr;
		}
	};

	return (
		<Modal
			title={(
				<Space>
					<ExclamationCircleOutlined style={{ color: "#faad14" }} />
					<span>Server Data Has Changed</span>
				</Space>
			)}
			open={visible}
			onOk={handleRefresh}
			onCancel={onCancel}
			okText="Refresh from Server"
			cancelText="Keep Working"
			okButtonProps={{
				danger: true,
				loading,
			}}
			closable={!loading}
			maskClosable={!loading}
			width={600}
		>
			<Space direction="vertical" size="middle" style={{ width: "100%" }}>
				<Alert
					message="Version Conflict Detected"
					description="The server has newer versions of some sections while you have unsaved local changes."
					type="warning"
					showIcon
				/>

				<div>
					<Text strong style={{ fontSize: "14px" }}>Affected Sections:</Text>
					<div style={{ marginTop: "12px" }}>
						{staleSections.map((sectionKey) => {
							const versionInfo = getVersionInfo(sectionKey);
							const displayName = SECTION_DISPLAY_NAMES[SECTION_KEY_TO_DESCRIPTION[sectionKey]] || sectionKey;

							return (
								<div
									key={sectionKey}
									style={{
										padding: "12px",
										marginBottom: "8px",
										border: "1px solid #ffd591",
										borderRadius: "4px",
										backgroundColor: "#fffbe6",
									}}
								>
									<div style={{ marginBottom: "8px" }}>
										<Text strong style={{ fontSize: "13px" }}>
											{displayName}
										</Text>
									</div>

									{versionInfo && (
										<Space direction="vertical" size="small" style={{ fontSize: "12px" }}>
											<Space>
												<UserOutlined style={{ color: "#1890ff" }} />
												<Text type="secondary">
													Modified by:
													{" "}
													<Text strong>{versionInfo.ModifiedBy || "Unknown"}</Text>
												</Text>
											</Space>
											<Space>
												<ClockCircleOutlined style={{ color: "#1890ff" }} />
												<Text type="secondary">
													Modified on:
													{" "}
													<Text strong>{versionInfo.ModifiedOnDt ? formatDateTime(versionInfo.ModifiedOnDt) : "Unknown"}</Text>
												</Text>
											</Space>
										</Space>
									)}

									{!versionInfo && (
										<Text type="secondary" style={{ fontSize: "12px", fontStyle: "italic" }}>
											Version information not available
										</Text>
									)}
								</div>
							);
						})}
					</div>
				</div>

				<Alert
					message="What happens if you refresh?"
					description={(
						<ul style={{ marginBottom: 0, paddingLeft: "20px" }}>
							<li>
								Your unsaved changes in these sections will be
								<strong>discarded</strong>
							</li>
							<li>Latest data from the server will be loaded</li>
							<li>You can then make your changes again</li>
						</ul>
					)}
					type="info"
					showIcon
				/>

				<Text type="secondary" style={{ fontSize: "12px" }}>
					If you choose "Keep Working", you can continue editing but saving may fail due to version conflicts.
				</Text>
			</Space>
		</Modal>
	);
};

export default StaleConflictDialog;
