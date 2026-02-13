/**
 * useCollarForm Hook
 *
 * Encapsulates all form logic for the Collar section following SRP.
 * Handles form initialization, store synchronization, validation,
 * and action handlers.
 *
 * Benefits:
 * - Separation of concerns (business logic separated from presentation)
 * - Testable in isolation
 * - Reusable pattern for other form-based sections
 * - Simplified component (reduces complexity by ~150 lines)
 */

import type { CollarFieldProps, UseCollarFormReturn } from "../sections/types/collar-types";
import type { CollarData } from "../validation/collar-schemas";
import { SectionKey } from "#src/types/drillhole";

import { zodResolver } from "@hookform/resolvers/zod";
import { useCallback, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useDrillHoleStore } from "../store/drillhole-store";
import { collarSchema } from "../validation/collar-schemas";
import { useSectionActions } from "./useSectionActions";

/**
 * Custom hook for Collar form management
 *
 * Manages the complete lifecycle of the Collar form including:
 * - Form initialization with React Hook Form
 * - Bidirectional synchronization with Zustand store
 * - Dirty state tracking (form-level and section-level)
 * - Validation orchestration
 * - Save/Submit/Reject action handlers
 *
 * @returns Form control, validation state, and action handlers
 *
 * @example
 * ```tsx
 * const {
 *   control,
 *   isDirty,
 *   errors,
 *   onSave,
 *   getFieldProps,
 * } = useCollarForm();
 * ```
 */
export function useCollarForm(): UseCollarFormReturn {
	// ============================================================================
	// Store Integration - Optimized selector pattern
	// ============================================================================

	const section = useDrillHoleStore(state => state.sections.collar);
	const updateSectionData = useDrillHoleStore(state => state.updateSectionData);
	const saveSection = useDrillHoleStore(state => state.saveSection);
	const submitSection = useDrillHoleStore(state => state.submitSection);
	const rejectSection = useDrillHoleStore(state => state.rejectSection);

	const sectionData = section.data;

	// ============================================================================
	// Form Initialization
	// ============================================================================

	const {
		control,
		formState: { isDirty, dirtyFields },
		reset,
		getValues,
		watch,
	} = useForm<CollarData>({
		defaultValues: sectionData,
		mode: "onChange",
		resolver: zodResolver(collarSchema),
	});

	// ============================================================================
	// Lifecycle Management - 3 Clear Stages
	// ============================================================================

	// Flag to prevent updateSectionData during post-save reset
	const isResettingAfterSaveRef = useRef(false);

	// Stage 1: Initial Load
	const initialLoadRef = useRef(true);

	useEffect(() => {
		if (initialLoadRef.current) {
			console.log("🔵 [CollarForm] Initial data load - resetting form:", {
				sectionDataKeys: Object.keys(sectionData).slice(0, 10),
				formIsDirty: isDirty,
				sectionIsDirty: section.isDirty,
			});
			initialLoadRef.current = false;
			reset(sectionData);
			console.log("✅ [CollarForm] Form reset complete after initial load");
		}
	}, [sectionData, reset, isDirty, section.isDirty]);

	// Stage 2: Background Sync Reset
	const previousIsDirtyRef = useRef(section.isDirty);

	useEffect(() => {
		const wasDirty = previousIsDirtyRef.current;
		const isNowClean = !section.isDirty;

		// If section was dirty and is now clean (e.g., background sync), reset form
		if (wasDirty && isNowClean && isDirty) {
			console.log("🔄 [CollarForm] Section synced - resetting form:", {
				formIsDirtyBefore: isDirty,
				sectionIsDirtyBefore: wasDirty,
				sectionIsDirtyAfter: section.isDirty,
			});
			reset(section.data);
			console.log("✅ [CollarForm] Form reset complete after sync");
		}

		previousIsDirtyRef.current = section.isDirty;
	}, [section.isDirty, section.data, isDirty, reset]);

	// Stage 3: Form Changes → Store Sync
	useEffect(() => {
		const subscription = watch((formData, { name, type }) => {
			// Skip store update if we're resetting after a successful save
			if (isResettingAfterSaveRef.current) {
				console.log("✏️ [CollarForm] Skipping store update during post-save reset");
				return;
			}

			console.log("✏️ [CollarForm] Field changed - syncing to store:", {
				changedField: name,
				changeType: type,
				formIsDirty: isDirty,
				sectionIsDirtyBefore: section.isDirty,
				dirtyFieldsCount: Object.keys(dirtyFields).length,
			});

			// Always update store on change - the store handles dirty state tracking
			updateSectionData<CollarData>(SectionKey.Collar, formData as CollarData);

			// Log after store update
			setTimeout(() => {
				console.log("✏️ [CollarForm] After store update:", {
					changedField: name,
					formIsDirty: isDirty,
					sectionIsDirtyAfter: section.isDirty,
					sectionHasUnsavedChanges: section.hasUnsavedChanges(),
				});
			}, 0);
		});

		return () => subscription.unsubscribe();
	}, [watch, updateSectionData, isDirty, dirtyFields, section]);

	// ============================================================================
	// Validation
	// ============================================================================

	const validation = section.validate();
	const allErrors = "database" in validation
		? [...validation.database.errors, ...validation.save.errors, ...validation.save.warnings]
		: validation.errors || [];
	const errorsByField = allErrors.reduce(
		(acc: Record<string, string>, err: { field: string, message: string }) => {
			acc[err.field] = err.message;
			return acc;
		},
		{} as Record<string, string>,
	);

	console.log("[CollarForm] Store validation errors:", errorsByField);

	// ============================================================================
	// Action Handlers
	// ============================================================================

	const onSave = useCallback(async () => {
		console.log("💾 [CollarForm] Save button clicked:", {
			formIsDirtyBefore: isDirty,
			sectionIsDirtyBefore: section.isDirty,
			dirtyFieldsCount: Object.keys(dirtyFields).length,
			dirtyFieldNames: Object.keys(dirtyFields),
		});

		const data = getValues();
		updateSectionData<CollarData>(SectionKey.Collar, data);
		const result = await saveSection(SectionKey.Collar);

		console.log("💾 [CollarForm] Save completed:", {
			success: result.success,
			formIsDirtyAfter: isDirty,
			sectionIsDirtyAfter: section.isDirty,
			sectionHasUnsavedChanges: section.hasUnsavedChanges(),
			dirtyFieldsCountAfter: Object.keys(dirtyFields).length,
			message: result.message,
		});

		// If save was successful and we're online, reset the form to clear form-level isDirty
		if (result.success && navigator.onLine) {
			console.log("🔄 [CollarForm] Resetting form after successful save:", {
				formIsDirtyBeforeReset: isDirty,
			});
			// Set flag to prevent watch() from marking section dirty during reset
			isResettingAfterSaveRef.current = true;
			reset(section.data);
			// Clear flag after reset completes
			setTimeout(() => {
				isResettingAfterSaveRef.current = false;
				console.log("✅ [CollarForm] Form reset after save complete");
			}, 0);
		}
	}, [isDirty, section, dirtyFields, getValues, updateSectionData, saveSection, reset]);

	const onSubmit = useCallback(async () => {
		const data = getValues();
		updateSectionData<CollarData>(SectionKey.Collar, data);
		await submitSection(SectionKey.Collar);
	}, [getValues, updateSectionData, submitSection]);

	const onReject = useCallback(async () => {
		await rejectSection(SectionKey.Collar);
	}, [rejectSection]);

	// Get remaining actions (review, approve, exclude) from shared hook
	const { onReview, onApprove, onExclude } = useSectionActions(SectionKey.Collar, {
		beforeSave: async () => {
			const data = getValues();
			updateSectionData<CollarData>(SectionKey.Collar, data);
		},
	});

	// ============================================================================
	// Field Helpers
	// ============================================================================

	const getFieldProps = useCallback(
		(fieldName: keyof CollarData): CollarFieldProps => {
			const isFieldDirty = !!dirtyFields[fieldName];
			const hasError = !!errorsByField[fieldName];
			const isReadOnly = !section.isEditable();

			return {
				isDirty: isFieldDirty,
				validateStatus: hasError ? "error" : undefined,
				readOnly: isReadOnly,
			};
		},
		[dirtyFields, errorsByField, section],
	);

	// ============================================================================
	// Return Hook Interface
	// ============================================================================

	// Handle both ValidationResult and TwoTierValidationResult for isValid
	const isValid = "isValid" in validation ? validation.isValid : validation.database.isValid;

	return {
		control,
		isDirty,
		errors: errorsByField,
		isValid,
		onSave,
		onSubmit,
		onReject,
		onReview,
		onApprove,
		onExclude,
		getFieldProps,
	};
}
