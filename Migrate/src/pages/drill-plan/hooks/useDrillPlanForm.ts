/**
 * useDrillPlanForm Hook
 *
 * Encapsulates all form logic for Drill Plan form following SRP.
 * Handles form initialization, validation, and CRUD operations.
 *
 * Pattern: Following useCollarForm.ts architecture
 *
 * Benefits:
 * - Separation of concerns (business logic separated from presentation)
 * - Testable in isolation
 * - Simplified component (reduces complexity)
 */

import type { UiDrillPlan } from "#src/api/database/data-contracts.js";
import type { CreateDrillPlanDto, UpdateDrillPlanDto } from "../types";

import { message } from "antd";
import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import { useDrillPlanStore } from "../store/drill-plan-store";

export interface DrillPlanFormData extends Partial<UiDrillPlan> {
	// Form-specific fields if needed
}

export interface DrillPlanFieldProps {
	isDirty?: boolean
	validateStatus?: "error" | "success" | "warning" | "validating" | ""
	readOnly?: boolean
}

export interface UseDrillPlanFormReturn {
	control: any // React Hook Form control
	errors: Record<string, any>
	isValid: boolean
	isDirty: boolean
	onCreate: () => Promise<void>
	onUpdate: () => Promise<void>
	onCancel: () => void
	getFieldProps: (fieldName: keyof DrillPlanFormData) => DrillPlanFieldProps
}

/**
 * Custom hook for Drill Plan form management
 *
 * Manages the complete lifecycle of the Drill Plan form including:
 * - Form initialization with React Hook Form
 * - Validation orchestration
 * - Create/Update action handlers
 *
 * @param planId - Optional plan ID for edit mode
 * @param initialData - Initial form data (existing plan or defaults)
 * @param readOnly - Whether form is in read-only mode
 * @returns Form control, validation state, and action handlers
 */
export function useDrillPlanForm(
	planId?: string,
	initialData?: UiDrillPlan,
	readOnly: boolean = false,
): UseDrillPlanFormReturn {
	const navigate = useNavigate();
	const { createPlan, updatePlan } = useDrillPlanStore();

	// ============================================================================
	// Form Initialization
	// ============================================================================

	const defaultFormValues: DrillPlanFormData = {
		Organization: "",
		Project: "",
		Target: "",
		PlannedEasting: undefined,
		PlannedNorthing: undefined,
		PlannedTotalDepth: undefined,
		DataSource: "Manual Entry",
		DrillPriority: 5,
	};

	const {
		control,
		formState: { isDirty, dirtyFields, errors: formErrors },
		reset,
		getValues,
	} = useForm<DrillPlanFormData>({
		defaultValues: initialData ? { ...defaultFormValues, ...initialData } : defaultFormValues,
		mode: "onChange",
	});

	// Reset form when initialData changes (e.g., when plan is loaded from API)
	useEffect(() => {
		if (initialData) {
			console.log("🔄 [DrillPlanForm] Resetting form with initialData:", {
				Organization: initialData.Organization,
				Project: initialData.Project,
				Target: initialData.Target,
			});
			reset({ ...defaultFormValues, ...initialData });
		}
	}, [initialData, reset]);

	// ============================================================================
	// Action Handlers
	// ============================================================================

	const onCreate = useCallback(async () => {
		console.log("💾 [DrillPlanForm] Create button clicked:", {
			formIsDirty: isDirty,
			dirtyFieldsCount: Object.keys(dirtyFields).length,
		});

		try {
			const data = getValues();

			// Clean data for creation
			const createDto: CreateDrillPlanDto = {
				Organization: data.Organization || "",
				Project: data.Project || "",
				Target: data.Target || "",
				SubTarget: data.SubTarget,
				Prospect: data.Prospect,
				DrillPattern: data.DrillPattern,
				Tenement: data.Tenement,
				Pit: data.Pit,
				Phase: data.Phase,
				Zone: data.Zone,
				HoleType: data.HoleType,
				HoleStatus: "Draft",
				HolePurpose: data.HolePurpose,
				HolePurposeDetail: data.HolePurposeDetail,
				DrillType: data.DrillType,
				DrillPriority: data.DrillPriority || 0,
				ODSPriority: data.ODSPriority || 0,
				Priority: data.Priority,
				Grid: data.Grid,
				PlannedEasting: data.PlannedEasting,
				PlannedNorthing: data.PlannedNorthing,
				PlannedRL: data.PlannedRL,
				PlannedDip: data.PlannedDip,
				PlannedAzimuth: data.PlannedAzimuth,
				PlannedTotalDepth: data.PlannedTotalDepth,
				PlannedStartDt: data.PlannedStartDt,
				PlannedCompleteDt: data.PlannedCompleteDt,
				WaterTableDepth: data.WaterTableDepth,
				SitePrep: data.SitePrep,
				InfillTarget: data.InfillTarget,
				TWF: data.TWF,
				PlannedBy: data.PlannedBy,
				QCInsertionRuleId: data.QCInsertionRuleId,
				DataSource: "UI",
				HoleNm: data.HoleNm,
				PlannedHoleNm: data.PlannedHoleNm,
				ProposedHoleNm: data.ProposedHoleNm,
				OtherHoleNm: data.OtherHoleNm,
				ReportIncludeInd: false,
				ValidationStatus: 0,
				RowStatus: 0,
				ActiveInd: false,

			};

			const newPlan = await createPlan(createDto);
			message.success("Drill plan created successfully");
			console.log("✅ [DrillPlanForm] Create completed:", { planId: newPlan.DrillPlanId });
		}
		catch (error: any) {
			console.error("❌ [DrillPlanForm] Create failed:", error);
			message.error(error.message || "Failed to create drill plan");
			throw error;
		}
	}, [isDirty, dirtyFields, getValues, createPlan, navigate]);

	const onUpdate = useCallback(async () => {
		if (!planId) {
			message.error("No plan ID provided for update");
			return;
		}

		console.log("💾 [DrillPlanForm] Update button clicked:", {
			planId,
			formIsDirty: isDirty,
			dirtyFieldsCount: Object.keys(dirtyFields).length,
		});

		try {
			const data = getValues();

			console.log("📋 [DrillPlanForm] Form data before update:", {
				Organization: data.Organization,
				Project: data.Project,
				Target: data.Target,
			});

			// Clean data for update
			const updateDto: UpdateDrillPlanDto = {
				DrillPlanId: data.DrillPlanId || planId,
				Organization: data.Organization || "",
				Project: data.Project || "",
				Target: data.Target || "",
				SubTarget: data.SubTarget,
				Prospect: data.Prospect,
				DrillPattern: data.DrillPattern,
				Tenement: data.Tenement,
				Pit: data.Pit,
				Phase: data.Phase,
				Zone: data.Zone,
				HoleType: data.HoleType,
				HoleStatus: data.HoleStatus,
				HolePurpose: data.HolePurpose,
				HolePurposeDetail: data.HolePurposeDetail,
				DrillType: data.DrillType,
				DrillPriority: data.DrillPriority || 0,
				ODSPriority: data.ODSPriority || 0,
				Priority: data.Priority,
				Grid: data.Grid,
				PlannedEasting: data.PlannedEasting,
				PlannedNorthing: data.PlannedNorthing,
				PlannedRL: data.PlannedRL,
				PlannedDip: data.PlannedDip,
				PlannedAzimuth: data.PlannedAzimuth,
				PlannedTotalDepth: data.PlannedTotalDepth,
				PlannedStartDt: data.PlannedStartDt,
				PlannedCompleteDt: data.PlannedCompleteDt,
				WaterTableDepth: data.WaterTableDepth,
				SitePrep: data.SitePrep,
				InfillTarget: data.InfillTarget,
				TWF: data.TWF,
				PlannedBy: data.PlannedBy,
				QCInsertionRuleId: data.QCInsertionRuleId,
				DataSource: data.DataSource || "UI",
				HoleNm: data.HoleNm,
				PlannedHoleNm: data.PlannedHoleNm,
				ProposedHoleNm: data.ProposedHoleNm,
				OtherHoleNm: data.OtherHoleNm,
				ReportIncludeInd: false,
				ValidationStatus: 0,
				RowStatus: 0,
				ActiveInd: true,

			};

			const updatedPlan = await updatePlan(planId, updateDto);
			message.success("Drill plan updated successfully");
			console.log("✅ [DrillPlanForm] Update completed:", {
				planId,
				returnedOrganization: updatedPlan?.Organization,
				returnedProject: updatedPlan?.Project,
			});
		}
		catch (error: any) {
			console.error("❌ [DrillPlanForm] Update failed:", error);
			message.error(error.message || "Failed to update drill plan");
			throw error;
		}
	}, [planId, isDirty, dirtyFields, getValues, updatePlan]);

	const onCancel = useCallback(() => {
		console.log("🔄 [DrillPlanForm] Cancel button clicked - resetting form");
		reset(initialData);
	}, [reset, initialData]);

	// ============================================================================
	// Field Helpers
	// ============================================================================

	const getFieldProps = useCallback(
		(fieldName: keyof DrillPlanFormData): DrillPlanFieldProps => {
			const isFieldDirty = !!dirtyFields[fieldName];
			const hasError = !!formErrors[fieldName];

			return {
				isDirty: isFieldDirty,
				validateStatus: hasError ? "error" : undefined,
				readOnly,
			};
		},
		[dirtyFields, formErrors, readOnly],
	);

	// ============================================================================
	// Return Hook Interface
	// ============================================================================

	return {
		control,
		errors: formErrors,
		isValid: Object.keys(formErrors).length === 0,
		isDirty,
		onCreate,
		onUpdate,
		onCancel,
		getFieldProps,
	};
}
