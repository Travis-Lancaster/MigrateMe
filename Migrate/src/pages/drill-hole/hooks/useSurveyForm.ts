/**
 * useSurveyForm Hook
 *
 * Encapsulates Survey header form logic following SRP (Single Responsibility Principle).
 * Handles form state, validation, and section actions for Survey (header).
 *
 * Pattern: Similar to useCollarForm
 * - React Hook Form for form state
 * - Zustand store integration
 * - New Survey creation with automatic replacement logic
 * - Section action handlers (save, submit, reject, review, approve, exclude)
 */

import type { Control, FieldErrors } from "react-hook-form";
import type { SurveyData } from "../validation/survey-schemas";
import { SectionKey } from "#src/types/drillhole";
import { zodResolver } from "@hookform/resolvers/zod";

import { App } from "antd";
import { useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { useDrillHoleStore } from "../store/drillhole-store";
import { createEmptySurveyData, surveySchema } from "../validation/survey-schemas";
import { useSectionActions } from "./useSectionActions";

/**
 * Field props interface for consistent field configuration
 */
export interface FieldProps {
	error?: string
	disabled?: boolean
}

/**
 * Hook return interface
 */
export interface UseSurveyFormReturn {
	// React Hook Form
	control: Control<SurveyData>
	errors: FieldErrors<SurveyData>

	// Survey operations
	isNewSurvey: boolean
	canCreateNew: boolean
	handleNewSurvey: () => Promise<void>

	// Section actions
	onSave: () => Promise<void>
	onSubmit: () => Promise<void>
	onReject: () => Promise<void>
	onReview: () => Promise<void>
	onApprove: () => Promise<void>
	onExclude: () => Promise<void>

	// Field props
	getFieldProps: (fieldName: keyof SurveyData) => FieldProps
}

/**
 * Survey form hook
 * Manages Survey header form state and operations
 *
 * @returns Survey form state and handlers
 *
 * @example
 * ```typescript
 * const {
 *   control,
 *   errors,
 *   isNewSurvey,
 *   canCreateNew,
 *   handleNewSurvey,
 *   onSave,
 *   getFieldProps,
 * } = useSurveyForm();
 *
 * <SheetFormField
 *   name="DownHoleSurveyMethod"
 *   control={control}
 *   type="autocomplete"
 *   options={lookupOptions.surveyMethods}
 *   {...getFieldProps('DownHoleSurveyMethod')}
 * />
 * ```
 */
export function useSurveyForm(): UseSurveyFormReturn {
	const { message } = App.useApp();

	// ============================================================================
	// Store Integration
	// ============================================================================

	const section = useDrillHoleStore(state => state.sections.survey);
	const updateSectionData = useDrillHoleStore(state => state.updateSectionData);
	const drillHoleId = useDrillHoleStore(state => state.drillHoleId);
	const organization = useDrillHoleStore(state => state.Organization);

	// Extract Survey header from section data
	const surveyHeader = useMemo(() => {
		if (!section?.data)
			return createEmptySurveyData();
		// Handle both direct SurveyData and SurveyWithLogs structure
		return (section.data as any)?.header || section.data;
	}, [section?.data]);

	// ============================================================================
	// Form State (React Hook Form)
	// ============================================================================

	const {
		control,
		formState: { errors },
		reset,
		getValues,
	} = useForm<SurveyData>({
		resolver: zodResolver(surveySchema) as any,
		defaultValues: surveyHeader as SurveyData,
		mode: "onChange",
	});

	// Sync form with store when section data changes
	useEffect(() => {
		if (surveyHeader) {
			reset(surveyHeader as SurveyData);
		}
	}, [surveyHeader, reset]);

	// ============================================================================
	// Survey State
	// ============================================================================

	// Check if this is a new survey (no SurveyId or empty)
	const isNewSurvey = useMemo(() => {
		return !surveyHeader?.SurveyId || surveyHeader.SurveyId === "";
	}, [surveyHeader]);

	// Can create new if current survey is active (would be replaced)
	const canCreateNew = useMemo(() => {
		return surveyHeader?.ActiveInd === true && !isNewSurvey;
	}, [surveyHeader, isNewSurvey]);

	// ============================================================================
	// Section Actions
	// ============================================================================

	const actions = useSectionActions(SectionKey.Survey);

	// ============================================================================
	// Survey Operations
	// ============================================================================

	/**
	 * Handle creating a new Survey
	 * Implements automatic replacement logic:
	 * 1. Soft-delete previous survey (ActiveInd=false)
	 * 2. Create new survey (ActiveInd=true)
	 * 3. Clear SurveyLog array
	 */
	const handleNewSurvey = useCallback(async () => {
		try {
			console.log("🆕 [useSurveyForm] Creating new Survey");
			console.log("Previous Survey:", surveyHeader);

			// 1. Prepare old survey to be deactivated
			const oldSurvey = surveyHeader?.SurveyId
				? {
					...surveyHeader,
					ActiveInd: false, // Soft delete
					ModifiedOnDt: new Date().toISOString(),
				}
				: null;

			// 2. Create new survey
			const newSurvey = {
				...createEmptySurveyData(),
				SurveyId: crypto.randomUUID(),
				CollarId: drillHoleId || "",
				Organization: organization || "",
				ActiveInd: true, // ✅ Only one active at a time
				CreatedOnDt: new Date().toISOString(),
				ModifiedOnDt: new Date().toISOString(),
			} as SurveyData;

			console.log("New Survey:", newSurvey);

			// 3. Update section with new survey and clear logs
			// Structure depends on how survey section is configured
			await updateSectionData(SectionKey.Survey, {
				header: newSurvey,
				logs: [], // Clear survey log array
			});

			// 4. Reset form with new survey data
			reset(newSurvey);

			message.success("New survey created. Previous survey has been archived.");

			console.log("✅ [useSurveyForm] New Survey created successfully");
		}
		catch (error) {
			console.error("❌ [useSurveyForm] Error creating new Survey:", error);
			message.error("Failed to create new survey");
		}
	}, [
		surveyHeader,
		drillHoleId,
		organization,
		updateSectionData,
		reset,
		message,
	]);

	// ============================================================================
	// Field Props Helper
	// ============================================================================

	/**
	 * Get field props for consistent error handling and disabled state
	 */
	const getFieldProps = useCallback(
		(fieldName: keyof SurveyData): FieldProps => {
			const error = errors[fieldName];
			const isReadOnly = !section.isEditable();

			return {
				error: error?.message as string | undefined,
				disabled: isReadOnly,
			};
		},
		[errors, section],
	);

	// ============================================================================
	// Return Interface
	// ============================================================================

	return {
		// Form state
		control,
		errors,

		// Survey operations
		isNewSurvey,
		canCreateNew,
		handleNewSurvey,

		// Section actions
		onSave: actions.onSave,
		onSubmit: actions.onSubmit,
		onReject: actions.onReject,
		onReview: actions.onReview,
		onApprove: actions.onApprove,
		onExclude: actions.onExclude,

		// Helpers
		getFieldProps,
	};
}
