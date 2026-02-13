/**
 * CollarFormView - Create/Edit Collars (Cache-Aside Pattern)
 *
 * Uses Dexie LiveQuery for real-time data updates and offline-first functionality.
 * Implements cache-aside pattern via collarService.fetchById().
 *
 * CACHE-ASIDE IMPLEMENTATION:
 * - useLiveQuery watches Dexie for instant rendering
 * - useEffect calls collarService.fetchById() in background
 * - fetchById() checks cache first, fetches API if miss
 * - Dexie-syncable keeps cache current via background sync
 * - Form auto-updates when sync changes data
 *
 * WHY THIS WORKS:
 * - Instant rendering from cached collar data (50ms)
 * - Background refresh ensures data is current
 * - useLiveQuery detects cache changes automatically
 * - No manual refresh needed - always up to date!
 *
 * @see plans/cache-aside-implementation-plan.md
 * @see src/ux/features/planning/views/DrillPlanFormView.tsx (reference pattern)
 */

import type { VwCollar } from "#src/data/api/database/data-contracts";
import { collarRepo } from "#src/data/domain/collar/collar.repo";
import { collarService } from "#src/data/domain/collar/collar.service";
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
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { CollarForm } from "../../collar/components/CollarForm";

/**
 * CollarFormView Component
 *
 * Modes:
 * - Create: /drill-holes/new
 * - Edit: /drill-holes/:collarId/edit
 * - View: /drill-holes/:collarId
 */
export function CollarFormView(): JSX.Element {
	const navigate = useNavigate();
	const { collarId } = useParams<{ collarId: string }>();
	const [form] = Form.useForm();

	const [saving, setSaving] = useState(false);
	const [isEditMode, setIsEditMode] = useState(false);

	const isCreate = !collarId || collarId === "new";
	const isViewMode = !isCreate && !isEditMode;

	// ============================================
	// LiveQuery: Watch Dexie for instant rendering
	// ============================================
	// Automatically updates when collar changes in IndexedDB
	// Provides instant rendering from cache (cache-aside pattern)
	const collar = useLiveQuery(
		async () => {
			if (!collarId || collarId === "new")
				return null;

			console.log("[CollarFormView] 👀 LiveQuery loading collar:", collarId);
			const result = await collarRepo.getById(collarId);
			return result || null;
		},
		[collarId],
		null,
	);

	const loading = collar === undefined && !isCreate;

	// Initialize form when collar loads or changes
	useEffect(() => {
		if (collar) {
			console.log("[CollarFormView] Setting form values from collar:", collar);
			form.setFieldsValue(collar);
		}
	}, [collar, form]);

	// Set edit mode for new collars
	useEffect(() => {
		if (isCreate) {
			setIsEditMode(true);
		}
	}, [isCreate]);

	// ============================================
	// Load collar from API if not in cache (Cache-Aside Pattern)
	// ============================================
	// This is the background refresh that ensures data is current
	// collarService.fetchById() implements full cache-aside logic:
	// 1. Check Dexie cache first
	// 2. If cache hit → return instantly (no API call)
	// 3. If cache miss → fetch from API + save to cache
	// 4. On error → offline fallback to stale cache
	useEffect(() => {
		if (collarId && collarId !== "new") {
			loadCollarFromApi(collarId);
		}
	}, [collarId]);

	const loadCollarFromApi = async (id: string) => {
		try {
			console.log("[CollarFormView] Ensuring collar data cached:", id);
			// This method implements cache-aside pattern
			// Will return instantly if cached, fetch from API if not
			await collarService.fetchById(id);
		}
		catch (error: any) {
			message.error("Failed to load collar");
			console.error("[CollarFormView] Load error:", error);
		}
	};

	const handleSave = async () => {
		try {
			setSaving(true);
			const values = await form.validateFields();

			console.log("[CollarFormView] Saving collar:", values);

			// Prepare collar data
			const collarData: Partial<VwCollar> = {
				...collar,
				...values,
				CollarId: collar?.CollarId || undefined,
			};

			// Save via service (will update both Dexie and sync to API via dexie-syncable)
			await collarService.save(collarData as VwCollar);

			if (isCreate) {
				message.success("Collar created successfully");
				navigate("/drill-holes");
			}
			else {
				message.success("Collar updated successfully");
				setIsEditMode(false);
				// LiveQuery will automatically update the form
			}
		}
		catch (error: any) {
			// Validation errors are automatically displayed by Ant Design Form
			// Only show message for non-validation errors
			if (!error.errorFields) {
				message.error("Failed to save collar");
				console.error("[CollarFormView] Save error:", error);
			}
		}
		finally {
			setSaving(false);
		}
	};

	const handleCancel = () => {
		if (isCreate) {
			navigate("/drill-holes");
		}
		else {
			setIsEditMode(false);
			// Reset form to original values
			if (collar) {
				form.setFieldsValue(collar);
			}
		}
	};

	const handleEdit = () => {
		setIsEditMode(true);
	};

	const handleDelete = () => {
		if (!collarId)
			return;

		Modal.confirm({
			title: "Delete Collar",
			content: "Are you sure you want to delete this collar? This action cannot be undone.",
			okText: "Delete",
			okType: "danger",
			onOk: async () => {
				try {
					console.log("[CollarFormView] Deleting collar:", collarId);
					await collarService.delete(collarId);
					message.success("Collar deleted successfully");
					navigate("/drill-holes");
				}
				catch (error: any) {
					message.error("Failed to delete collar");
					console.error("[CollarFormView] Delete error:", error);
				}
			},
		});
	};

	if (loading) {
		return (
			<div style={{ padding: "24px", textAlign: "center" }}>
				<Spin size="large" tip="Loading collar..." />
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
							onClick={() => navigate("/drill-holes")}
						>
							Back to List
						</Button>
						<h1 style={{ margin: 0, fontSize: "24px", fontWeight: 600 }}>
							{isCreate ? "Create Collar" : collar?.HoleNm || "Collar"}
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
			{!isCreate && collar && (
				<Card style={{ marginBottom: "16px" }} size="small">
					<Space>
						<span style={{ fontWeight: 600 }}>Status:</span>
						<HoleStatusBadge status={collar.HoleStatus || "Draft"} />
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
				}}
				onFinish={handleSave}
			>
				<CollarForm
					form={form}
					initialValues={collar as any}
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
