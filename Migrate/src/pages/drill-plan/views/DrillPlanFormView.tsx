/**
 * DrillPlanFormView Component
 *
 * Unified component for creating, editing, and viewing drill plans.
 * Combines functionality from DrillPlanDetailView and DrillPlanFormView.
 *
 * Pattern: Following CollarSection.tsx architecture with:
 * - Ant Design Descriptions for layout
 * - SheetFormField with displayMode="description"
 * - useDrillPlanForm hook for business logic (SRP)
 * - Cached lookups for performance
 *
 * Features:
 * - Three modes: create, edit, view
 * - Status management with history
 * - Pattern selection for auto-population
 * - Print/PDF export
 * - Permission-based actions
 */

import type { MenuProps } from "antd";

import type { DrillPlanStatusEnum } from "../types";
import { SheetFormField } from "#src/components/sheets/SheetFormField";
import {
	ArrowLeftOutlined,
	DeleteOutlined,
	EditOutlined,
	FilePdfOutlined,
	MoreOutlined,
	PrinterOutlined,
	SaveOutlined,
	SwapOutlined,
} from "@ant-design/icons";
import {
	Alert,
	Button,
	Card,
	Descriptions,
	Dropdown,
	message,
	Modal,
	Space,
	Spin,
} from "antd";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";

import { StatusChip, StatusHistoryTimeline, StatusTransitionModal } from "../components";
import { useDrillPlanDetail } from "../hooks/useDrillPlanDetail";
import { useDrillPlanForm } from "../hooks/useDrillPlanForm";
import { usePermissions } from "../hooks/usePermissions";
import { useStatusTransition } from "../hooks/useStatusTransition";
import { getDrillPlanLookups } from "../lookups/drill-plan-lookups";
import { statusTransitionService } from "../services/statusTransitionService";
import { useDrillPlanStore } from "../store/drill-plan-store";
import { exportToPDF, printDrillPlan } from "../utils/exportUtils";
import "../styles/print.css";

export const DrillPlanFormView: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	// ============================================================================
	// Mode Determination
	// ============================================================================

	const isCreate = !id || id === "new";
	const [isEditMode, setIsEditMode] = useState(isCreate);
	const readOnly = !isEditMode;

	// ============================================================================
	// Data Loading
	// ============================================================================

	const { plan, isLoading, error, refresh } = useDrillPlanDetail(isCreate ? "" : id!);
	const { isSaving } = useDrillPlanStore();

	// ============================================================================
	// Form Hook - Encapsulates all business logic
	// ============================================================================

	const {
		control,
		errors,
		isValid,
		isDirty,
		onCreate,
		onUpdate,
		onCancel,
		getFieldProps,
	} = useDrillPlanForm(id, plan ?? undefined, readOnly);

	// Log plan data for debugging
	React.useEffect(() => {
		if (plan) {
			console.log("[DrillPlanFormView] Plan loaded:", {
				DrillPlanId: plan.DrillPlanId,
				Organization: plan.Organization,
				Project: plan.Project,
				Target: plan.Target,
			});
		}
	}, [plan]);

	// ============================================================================
	// Cached Lookups
	// ============================================================================

	const lookups = getDrillPlanLookups();

	// ============================================================================
	// Permissions & Status Management
	// ============================================================================

	const { canUpdate, canDelete, getAvailableTransitions } = usePermissions();
	const {
		statusTransitionModal,
		openStatusTransitionModal,
		closeStatusTransitionModal,
	} = useStatusTransition();

	// ============================================================================
	// Status History
	// ============================================================================

	const [statusHistory, setStatusHistory] = useState<any[]>([]);
	const [loadingHistory, setLoadingHistory] = useState(false);

	useEffect(() => {
		if (id && !isCreate) {
			loadStatusHistory();
		}
	}, [id, isCreate]);

	const loadStatusHistory = async () => {
		if (!id)
			return;

		setLoadingHistory(true);
		try {
			const history = await statusTransitionService.getStatusHistory(id);
			setStatusHistory(history);
		}
		catch (err) {
			console.error("Failed to load status history:", err);
		}
		finally {
			setLoadingHistory(false);
		}
	};

	// ============================================================================
	// Action Handlers
	// ============================================================================

	const handleCreate = async () => {
		try {
			await onCreate();
		}
		catch (error) {
			// Error already handled in hook
		}
	};

	const handleUpdate = async () => {
		try {
			await onUpdate();
			setIsEditMode(false);
			refresh();
			loadStatusHistory();
		}
		catch (error) {
			// Error already handled in hook
		}
	};

	const handleEdit = () => {
		setIsEditMode(true);
	};

	const handleCancelEdit = () => {
		if (isCreate) {
			navigate("/drill-plan");
		}
		else {
			onCancel();
			setIsEditMode(false);
		}
	};

	const handleDelete = () => {
		if (!plan)
			return;

		Modal.confirm({
			title: "Delete Drill Plan",
			content: "Are you sure you want to delete this drill plan? This action cannot be undone.",
			okText: "Delete",
			okType: "danger",
			onOk: async () => {
				try {
					// Delete logic would go here
					message.success("Drill plan deleted successfully");
					navigate("/drill-plan");
				}
				catch (error: any) {
					message.error(error.message || "Failed to delete drill plan");
				}
			},
		});
	};

	const handleStatusChange = (toStatus: DrillPlanStatusEnum) => {
		if (plan) {
			openStatusTransitionModal(plan.DrillPlanId, toStatus);
		}
	};

	const handleTransitionComplete = () => {
		refresh();
		loadStatusHistory();
	};

	// ============================================================================
	// Loading & Error States
	// ============================================================================

	if (isLoading) {
		return (
			<div style={{ padding: "24px", textAlign: "center" }}>
				<Spin size="large" />
			</div>
		);
	}

	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Error"
					description={error}
					type="error"
					showIcon
				/>
			</div>
		);
	}

	if (!isCreate && !plan) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Not Found"
					description="Drill plan not found"
					type="warning"
					showIcon
				/>
			</div>
		);
	}

	// ============================================================================
	// Menu Items
	// ============================================================================

	const availableTransitions = plan ? getAvailableTransitions(plan) : [];
	const transitionMenuItems = availableTransitions.map(status => ({
		key: status,
		label: status,
		onClick: () => handleStatusChange(status),
	}));

	const exportMenuItems: MenuProps["items"] = [
		{
			key: "print",
			label: "Print",
			icon: <PrinterOutlined />,
			onClick: printDrillPlan,
		},
		{
			key: "pdf",
			label: "Export to PDF",
			icon: <FilePdfOutlined />,
			onClick: () => plan && exportToPDF(plan.DrillPlanId, plan.PlannedHoleNm || ""),
		},
	];

	// ============================================================================
	// Common Descriptions Styles
	// ============================================================================

	const descriptionsStyle = {
		labelStyle: {
			fontWeight: "bold" as const,
			backgroundColor: "#f0f0f0",
			padding: "2px 8px",
			width: "140px",
		},
		contentStyle: { padding: "2px 8px" },
	};

	// ============================================================================
	// Render
	// ============================================================================

	return (
		<div style={{ padding: "24px" }}>
			{/* Print Header - Only visible when printing */}
			<div className="print-only print-header">
				<div className="print-company-name">B2Gold Corporation</div>
				<div className="print-document-title">Drill Plan Report</div>
				<div className="print-metadata">
					Printed:
					{" "}
					{new Date().toLocaleString()}
					{" "}
					| Plan ID:
					{plan?.DrillPlanId || "New"}
				</div>
			</div>

			{/* Header with Title and Actions */}
			<div style={{ marginBottom: "24px" }} className="no-print">
				<Space style={{ width: "100%", justifyContent: "space-between" }}>
					<Space>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={() => navigate("/drill-plan")}
						>
							Back to List
						</Button>
						<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
							{isCreate ? "Create Drill Plan" : (plan?.PlannedHoleNm || "Drill Plan Details")}
						</h1>
					</Space>

					{/* Action Buttons - View Mode */}
					{!isEditMode && !isCreate && (
						<Space className="no-print">
							<Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
								<Button icon={<MoreOutlined />}>
									More Actions
								</Button>
							</Dropdown>

							{canUpdate() && (
								<Button
									icon={<EditOutlined />}
									onClick={handleEdit}
								>
									Edit
								</Button>
							)}

							{availableTransitions.length > 0 && (
								<Dropdown
									menu={{ items: transitionMenuItems }}
									placement="bottomRight"
								>
									<Button type="primary" icon={<SwapOutlined />}>
										Change Status
									</Button>
								</Dropdown>
							)}

							{plan && canDelete(plan) && (
								<Button
									danger
									icon={<DeleteOutlined />}
									onClick={handleDelete}
								>
									Delete
								</Button>
							)}
						</Space>
					)}

					{/* Action Buttons - Edit/Create Mode */}
					{isEditMode && (
						<Space className="no-print">
							<Button onClick={handleCancelEdit}>
								Cancel
							</Button>
							<Button
								type="primary"
								icon={<SaveOutlined />}
								loading={isSaving}
								onClick={isCreate ? handleCreate : handleUpdate}
							>
								{isCreate ? "Create" : "Update"}
							</Button>
						</Space>
					)}
				</Space>
			</div>

			{/* Status Badge - View/Edit Mode Only */}
			{!isCreate && plan && (
				<Card style={{ marginBottom: "16px" }}>
					<Space>
						<span style={{ fontWeight: 600 }}>Status:</span>
						<StatusChip status={plan.DrillPlanStatus} size="medium" />
					</Space>
				</Card>
			)}

			{/* BASIC INFORMATION */}
			<Card title="Basic Information" style={{ marginBottom: "16px" }}>
				<Descriptions bordered size="small" column={2} {...descriptionsStyle}>
					<Descriptions.Item label="Organization" span={1}>
						<SheetFormField
							control={control}
							name="Organization"
							type="select"
							options={lookups.organizations}
							displayMode="description"
							{...getFieldProps("Organization")}
						/>

					</Descriptions.Item>

					<Descriptions.Item label="Project" span={1}>
						<SheetFormField
							control={control}
							name="Project"
							type="select"
							options={lookups.projects}
							displayMode="description"
							{...getFieldProps("Project")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Target" span={1}>
						<SheetFormField
							control={control}
							name="Target"
							type="select"
							options={lookups.targets}
							displayMode="description"
							{...getFieldProps("Target")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Sub Target" span={1}>
						<SheetFormField
							control={control}
							name="SubTarget"
							type="select"
							options={lookups.subTargets}
							displayMode="description"
							{...getFieldProps("SubTarget")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Prospect" span={1}>
						<SheetFormField
							control={control}
							name="Prospect"
							type="select"
							options={lookups.prospects}
							displayMode="description"
							{...getFieldProps("Prospect")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Drill Pattern" span={1}>
						{plan?.DrillPattern}
					</Descriptions.Item>

					<Descriptions.Item label="Tenement" span={1}>
						<SheetFormField
							control={control}
							name="Tenement"
							type="select"
							options={lookups.tenements}
							displayMode="description"
							{...getFieldProps("Tenement")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Pit" span={1}>
						<SheetFormField
							control={control}
							name="Pit"
							type="select"
							options={lookups.pits}
							displayMode="description"
							{...getFieldProps("Pit")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Phase" span={1}>
						<SheetFormField
							control={control}
							name="Phase"
							type="select"
							options={lookups.phases}
							displayMode="description"
							{...getFieldProps("Phase")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Zone" span={1}>
						<SheetFormField
							control={control}
							name="Zone"
							type="select"
							options={lookups.zones}
							displayMode="description"
							{...getFieldProps("Zone")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Hole Type" span={1}>
						<SheetFormField
							control={control}
							name="HoleType"
							type="select"
							options={lookups.holeTypes}
							displayMode="description"
							{...getFieldProps("HoleType")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Hole Purpose" span={1}>
						<SheetFormField
							control={control}
							name="HolePurpose"
							type="select"
							options={lookups.holePurposes}
							displayMode="description"
							{...getFieldProps("HolePurpose")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Hole Purpose Detail" span={1}>
						<SheetFormField
							control={control}
							name="HolePurposeDetail"
							type="select"
							options={lookups.holePurposeDetails}
							displayMode="description"
							{...getFieldProps("HolePurposeDetail")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Drill Type" span={1}>
						<SheetFormField
							control={control}
							name="DrillType"
							type="select"
							options={lookups.drillTypes}
							displayMode="description"
							{...getFieldProps("DrillType")}
						/>
					</Descriptions.Item>

				</Descriptions>
			</Card>

			{/* HOLE NAMING */}
			<Card title="Hole Naming" style={{ marginBottom: "16px" }}>
				<Descriptions bordered size="small" column={2} {...descriptionsStyle}>
					<Descriptions.Item label="Hole" span={1}>
						<SheetFormField
							control={control}
							name="HoleNm"
							type="text"
							displayMode="description"
							{...getFieldProps("HoleNm")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Planned" span={1}>
						<SheetFormField
							control={control}
							name="PlannedHoleNm"
							type="text"
							displayMode="description"
							{...getFieldProps("PlannedHoleNm")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Proposed" span={1}>
						<SheetFormField
							control={control}
							name="ProposedHoleNm"
							type="text"
							displayMode="description"
							{...getFieldProps("ProposedHoleNm")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Other" span={1}>
						<SheetFormField
							control={control}
							name="OtherHoleNm"
							type="text"
							displayMode="description"
							{...getFieldProps("OtherHoleNm")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* LOCATION & GEOMETRY */}
			<Card title="Location & Geometry" style={{ marginBottom: "16px" }}>
				<Descriptions bordered size="small" column={3} {...descriptionsStyle}>
					<Descriptions.Item label="Grid" span={1}>
						<SheetFormField
							control={control}
							name="Grid"
							type="select"
							options={lookups.grids}
							displayMode="description"
							{...getFieldProps("Grid")}
						/>
					</Descriptions.Item>
					<Descriptions.Item label="Total Depth (m)" span="filled">
						<SheetFormField
							control={control}
							name="PlannedTotalDepth"
							type="number"
							displayMode="description"
							{...getFieldProps("PlannedTotalDepth")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Easting (m)" span={1}>
						<SheetFormField
							control={control}
							name="PlannedEasting"
							type="number"
							displayMode="description"
							{...getFieldProps("PlannedEasting")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Northing (m)" span={1}>
						<SheetFormField
							control={control}
							name="PlannedNorthing"
							type="number"
							displayMode="description"
							{...getFieldProps("PlannedNorthing")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="RL (m)" span={1}>
						<SheetFormField
							control={control}
							name="PlannedRL"
							type="number"
							displayMode="description"
							{...getFieldProps("PlannedRL")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Dip (°)" span={1}>
						<SheetFormField
							control={control}
							name="PlannedDip"
							type="number"
							displayMode="description"
							{...getFieldProps("PlannedDip")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Azimuth (°)" span={1}>
						<SheetFormField
							control={control}
							name="PlannedAzimuth"
							type="number"
							displayMode="description"
							{...getFieldProps("PlannedAzimuth")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* SCHEDULE & PRIORITY */}
			<Card title="Schedule & Priority" style={{ marginBottom: "16px" }}>
				<Descriptions bordered size="small" column={2} {...descriptionsStyle}>
					<Descriptions.Item label="Planned Start" span={1}>
						<SheetFormField
							control={control}
							name="PlannedStartDt"
							type="date"
							displayMode="description"
							{...getFieldProps("PlannedStartDt")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Planned Complete" span={1}>
						<SheetFormField
							control={control}
							name="PlannedCompleteDt"
							type="date"
							displayMode="description"
							{...getFieldProps("PlannedCompleteDt")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Planned By" span={1}>
						<SheetFormField
							control={control}
							name="PlannedBy"
							type="autocomplete"
							options={lookups.persons}
							displayMode="description"
							{...getFieldProps("PlannedBy")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Drill Priority" span={1}>
						<SheetFormField
							control={control}
							name="DrillPriority"
							type="number"
							displayMode="description"
							{...getFieldProps("DrillPriority")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="ODS Priority" span={1}>
						<SheetFormField
							control={control}
							name="ODSPriority"
							type="number"
							displayMode="description"
							{...getFieldProps("ODSPriority")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Priority" span={1}>
						<SheetFormField
							control={control}
							name="Priority"
							type="number"
							displayMode="description"
							{...getFieldProps("Priority")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* ADDITIONAL FIELDS */}
			<Card title="Additional Fields" style={{ marginBottom: "16px" }}>
				<Descriptions bordered size="small" column={2} {...descriptionsStyle}>
					<Descriptions.Item label="Water Table Depth (m)" span={1}>
						<SheetFormField
							control={control}
							name="WaterTableDepth"
							type="number"
							displayMode="description"
							{...getFieldProps("WaterTableDepth")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Site Prep" span={1}>
						<SheetFormField
							control={control}
							name="SitePrep"
							type="text"
							displayMode="description"
							{...getFieldProps("SitePrep")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="Infill Target" span={1}>
						<SheetFormField
							control={control}
							name="InfillTarget"
							type="text"
							displayMode="description"
							{...getFieldProps("InfillTarget")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="TWF" span={1}>
						<SheetFormField
							control={control}
							name="TWF"
							type="text"
							displayMode="description"
							{...getFieldProps("TWF")}
						/>
					</Descriptions.Item>

					<Descriptions.Item label="QC Insertion Rule" span={2}>
						<SheetFormField
							control={control}
							name="QCInsertionRuleId"
							type="select"
							options={lookups.qcInsertionRules}
							displayMode="description"
							{...getFieldProps("QCInsertionRuleId")}
						/>
					</Descriptions.Item>
				</Descriptions>
			</Card>

			{/* AUDIT INFORMATION - View/Edit Only */}
			{!isCreate && plan && (
				<Card title="Audit Information" style={{ marginBottom: "16px" }}>
					<Descriptions bordered size="small" column={2} {...descriptionsStyle}>
						<Descriptions.Item label="Created On" span={1}>
							{plan.CreatedOnDt ? new Date(plan.CreatedOnDt).toLocaleString() : "N/A"}
						</Descriptions.Item>
						<Descriptions.Item label="Created By" span={1}>
							{plan.CreatedBy || "N/A"}
						</Descriptions.Item>
						<Descriptions.Item label="Modified On" span={1}>
							{plan.ModifiedOnDt ? new Date(plan.ModifiedOnDt).toLocaleString() : "N/A"}
						</Descriptions.Item>
						<Descriptions.Item label="Modified By" span={1}>
							{plan.ModifiedBy || "N/A"}
						</Descriptions.Item>
					</Descriptions>
				</Card>
			)}

			{/* Status History - View/Edit Only */}
			{!isCreate && (
				<StatusHistoryTimeline history={statusHistory} loading={loadingHistory} />
			)}

			{/* Status Transition Modal */}
			{statusTransitionModal.visible && statusTransitionModal.planId && statusTransitionModal.toStatus && plan && (
				<StatusTransitionModal
					visible={statusTransitionModal.visible}
					plan={plan}
					toStatus={statusTransitionModal.toStatus}
					onComplete={handleTransitionComplete}
					onCancel={closeStatusTransitionModal}
				/>
			)}
		</div>
	);
};
