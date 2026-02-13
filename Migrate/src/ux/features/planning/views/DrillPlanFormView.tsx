/**
 * DrillPlanFormView - Create/Edit Drill Plans
 *
 * Uses Dexie LiveQuery for real-time data updates and offline-first functionality
 */

import type { VwDrillPlan } from "#src/data/api/database/data-contracts";
import { drillPlanRepo } from "#src/data/domain/drill-plan/drill-plan.repo";
import { drillPlanService } from "#src/data/domain/drill-plan/drill-plan.service";

import { HoleStatusBadge } from "#src/ux/shared/components/index";
import {
	ArrowLeftOutlined,
	DeleteOutlined,
	EditOutlined,
	SaveOutlined,
} from "@ant-design/icons";
import {
	Button,
	Card,
	Form,
	message,
	Modal,
	Space,
	Spin,
} from "antd";
import { useLiveQuery } from "dexie-react-hooks";
// import type { DrillPlanBase, HoleStatusCode } from '#src/ux/core/types/drill-plan.types';
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { DrillPlanForm } from "../components/DrillPlanForm";

/**
 * DrillPlanFormView
 *
 * Modes:
 * - Create: /exploration/planning/plans/new
 * - Edit: /exploration/planning/plans/:drillHoleId/edit
 * - View: /exploration/planning/plans/:drillHoleId
 */
export function DrillPlanFormView(): JSX.Element {
	const navigate = useNavigate();
	const { drillHoleId } = useParams<{ drillHoleId: string }>();
	const [form] = Form.useForm();

	const [saving, setSaving] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);

	const isCreate = !drillHoleId || drillHoleId === "new";
	const isViewMode = !isCreate && !isEditMode;

	// LiveQuery - automatically updates when drill plan changes in IndexedDB
	const plan = useLiveQuery(
		async () => {
			if (!drillHoleId || drillHoleId === "new")
				return null;

			console.log("[DrillPlanFormView] LiveQuery loading plan:", drillHoleId);
			const result = await drillPlanRepo.getById(drillHoleId);
			return result || null;
		},
		[drillHoleId],
		null,
	);

	const loading = plan === undefined && !isCreate;

	// Initialize form when plan loads or changes
	useEffect(() => {
		if (plan) {
			console.log("[DrillPlanFormView] Setting form values from plan:", plan);
			form.setFieldsValue(plan);
		}
	}, [plan, form]);

	// Set edit mode for new plans
	useEffect(() => {
		if (isCreate) {
			setIsEditMode(true);
		}
	}, [isCreate]);

	// Load plan from API if not in cache
	useEffect(() => {
		if (drillHoleId && drillHoleId !== "new") {
			loadPlanFromApi(drillHoleId);
		}
	}, [drillHoleId]);

	const loadPlanFromApi = async (planId: string) => {
		try {
			console.log("[DrillPlanFormView] Fetching plan from API:", planId);
			// This will update IndexedDB, which will trigger LiveQuery
			await drillPlanService.fetchById(planId);
		}
		catch (error: any) {
			message.error("Failed to load drill plan");
			console.error("[DrillPlanFormView] Load error:", error);
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			const values = await form.validateFields();

			console.log("[DrillPlanFormView] Saving plan:", values);

			// Prepare plan data
			const planData: Partial<VwDrillPlan> = {
				...plan,
				...values,
				DrillPlanId: plan?.DrillPlanId || undefined,
			};

			// Save via service (will update both API and IndexedDB)
			await drillPlanService.save(planData as VwDrillPlan);

			if (isCreate) {
				message.success("Drill plan created successfully");
				navigate("/exploration/planning/plans");
			}
			else {
				message.success("Drill plan updated successfully");
				setIsEditMode(false);
				// LiveQuery will automatically update the form
			}
		}
		catch (error: any) {
			// Validation errors are automatically displayed by Ant Design Form
			// Only show message for non-validation errors
			if (!error.errorFields) {
				message.error("Failed to save drill plan");
				console.error("[DrillPlanFormView] Save error:", error);
			}
		}
		finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		if (isCreate) {
			navigate("/exploration/planning/plans");
		}
		else {
			setIsEditMode(false);
			// Reset form to original values
			if (plan) {
				form.setFieldsValue(plan);
			}
		}
	};

	const handleEdit = () => {
		setIsEditMode(true);
	};

	const handleDelete = () => {
		if (!drillHoleId)
			return;

		Modal.confirm({
			title: "Delete Drill Plan",
			content: "Are you sure you want to delete this drill plan? This action cannot be undone.",
			okText: "Delete",
			okType: "danger",
			onOk: async () => {
				try {
					console.log("[DrillPlanFormView] Deleting plan:", drillHoleId);
					await drillPlanService.delete(drillHoleId);
					message.success("Drill plan deleted successfully");
					navigate("/exploration/planning/plans");
				}
				catch (error: any) {
					message.error("Failed to delete drill plan");
					console.error("[DrillPlanFormView] Delete error:", error);
				}
			},
		});
	};

	if (loading) {
		return (
			<div style={{ padding: "24px", textAlign: "center" }}>
				<Spin size="large" tip="Loading drill plan..." />
			</div>
		);
	}

	return (
		<div style={{ padding: "24px" }}>

			{/* Header */}
			<div style={{ marginBottom: "24px" }}>
				<Space style={{ width: "100%", justifyContent: "space-between" }}>
					<Space>
						<Button
							icon={<ArrowLeftOutlined />}
							onClick={() => navigate("/exploration/planning/plans")}
						>
							Back to List
						</Button>
						<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
							{isCreate ? "Create Drill Plan" : plan?.PlannedHoleNm || "Drill Plan"}
						</h1>
					</Space>

					{/* View Mode Actions */}
					{isViewMode && (
						<Space>
							<Button
								icon={<EditOutlined />}
								onClick={handleEdit}
							>
								Edit
							</Button>
							<Button
								danger
								icon={<DeleteOutlined />}
								onClick={handleDelete}
							>
								Delete
							</Button>
						</Space>
					)}
				</Space>
			</div>

			{/* Status Badge - View Mode Only */}
			{!isCreate && plan && (
				<Card style={{ marginBottom: "16px" }} size="small">
					<Space>
						<span style={{ fontWeight: 600 }}>Status:</span>
						<HoleStatusBadge status={plan.HoleStatus || "Draft"} />
					</Space>
				</Card>
			)}

			{/* Form */}
			<Form
				form={form}
				layout="vertical"
				initialValues={{
					HoleStatus: "Draft",
					PlannedDip: -60,
					PlannedAzimuth: 0,
					Grid: "MGA94-Z50",
					Priority: "MEDIUM",
				}}
				onFinish={handleSave}
			>
				<DrillPlanForm
					form={form}
					initialValues={plan as any}
					readOnly={isViewMode}
				/>

				{/* Edit/Create Mode Actions - Inside Form */}
				{(isEditMode || isCreate) && (
					<div style={{ marginTop: "24px" }}>
						<Space>
							<Button onClick={handleCancel}>
								Cancel
							</Button>
							<Button
								type="primary"
								icon={<SaveOutlined />}
								loading={saving}
								htmlType="submit"
							>
								{isCreate ? "Create" : "Save Changes"}
							</Button>
						</Space>
					</div>
				)}
			</Form>

		</div>
	);
}
