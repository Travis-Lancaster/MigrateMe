/**
 * RigSetup Form Hook
 *
 * Encapsulates form logic for RigSetup section.
 * Uses React Hook Form + drill-hole-data store integration.
 *
 * @module drill-hole-data/hooks
 */

import type { RigSetupData } from "../validation";
import { SectionKey } from "../types/data-contracts";
import { message } from "antd";
import { useDrillHoleDataStore } from "../store";
import { useForm } from "react-hook-form";

/**
 * RigSetup Form Hook
 *
 * Provides form state, validation, and action handlers for RigSetup form.
 *
 * @returns Form state and handlers
 *
 * @example
 * const {
 *   control,
 *   errors,
 *   isDirty,
 *   isReadOnly,
 *   isValid,
 *   onSave,
 *   onSubmit,
 *   getFieldProps,
 * } = useRigSetupForm();
 */
export function useRigSetupForm() {
	console.log(`[useRigSetupForm] 🎣 Hook initialized`);

	// ========================================================================
	// Store Selectors (granular for performance)
	// ========================================================================

	const section = useDrillHoleDataStore(state => state.sections.rigSetup);
	const updateSectionData = useDrillHoleDataStore(state => state.updateSectionData);
	const saveSection = useDrillHoleDataStore(state => state.saveSection);
	const submitSection = useDrillHoleDataStore(state => state.submitSection);
	const canEdit = useDrillHoleDataStore(state => state.canEdit(SectionKey.RigSetup));

	console.log(`[useRigSetupForm] 📊 Store selectors retrieved:`, {
		hasSection: !!section,
		sectionData: section?.data,
		sectionDataKeys: section?.data ? Object.keys(section.data) : [],
		isDirty: section?.isDirty,
		canEdit,
	});

	// ========================================================================
	// React Hook Form Setup
	// ========================================================================

	const {
		control,
		formState: { isDirty, errors },
		watch,
		setValue,
		reset,
	} = useForm({
		defaultValues: {
			RigSetup: section.data as RigSetupData,
		},
		mode: "onChange",
	});

	console.log(`[useRigSetupForm] 📋 Form initialized:`, {
		isDirty,
		canEdit,
		errorCount: Object.keys(errors).length,
		defaultValuesProvided: !!section.data,
		defaultValuesKeys: section?.data ? Object.keys(section.data) : [],
		sectionDataContent: section?.data,
	});

	// Watch form values to see what's actually in the form
	const formValues = watch();
	console.log(`[useRigSetupForm] 👀 Form values from watch():`, {
		formValuesKeys: Object.keys(formValues),
		formValuesContent: formValues,
	});

	// Log section data in detail
	console.log(`[useRigSetupForm] 📦 Section data details:`, {
		sectionDataKeys: Object.keys(section?.data || {}),
		sectionDataValues: section?.data,
		sectionDataType: typeof section?.data,
	});

	// ========================================================================
	// Sync Form Changes to Store
	// ========================================================================

	const handleChange = (fieldName: keyof RigSetupData, value: any) => {
		console.log(`[useRigSetupForm] 📝 Field changed:`, { fieldName, value });
		updateSectionData<RigSetupData>(SectionKey.RigSetup, { [fieldName]: value } as Partial<RigSetupData>);
	};

	// ========================================================================
	// Action Handlers
	// ========================================================================

	const onSave = async () => {
		console.log(`[useRigSetupForm] 💾 Save clicked`);

		try {
			const result = await saveSection(SectionKey.RigSetup);

			if (result.success) {
				message.success("RigSetup saved successfully");
				console.log(`[useRigSetupForm] ✅ Save successful`);
			} else {
				message.error(result.message || "Save failed");
				console.error(`[useRigSetupForm] ❌ Save failed:`, result.errors);
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Save failed";
			message.error(errorMessage);
			console.error(`[useRigSetupForm] ❌ Save error:`, error);
			throw error;
		}
	};

	const onSubmit = async () => {
		console.log(`[useRigSetupForm] ✅ Submit clicked`);

		try {
			const result = await submitSection(SectionKey.RigSetup);

			if (result.success) {
				message.success("RigSetup submitted successfully");
				console.log(`[useRigSetupForm] ✅ Submit successful`);
			} else {
				message.error(result.message || "Submit failed");
				console.error(`[useRigSetupForm] ❌ Submit failed:`, result.errors);
			}

			return result;
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Submit failed";
			message.error(errorMessage);
			console.error(`[useRigSetupForm] ❌ Submit error:`, error);
			throw error;
		}
	};

	const onReset = () => {
		console.log(`[useRigSetupForm] 🔄 Reset clicked`);
		section.reset();
		reset(section.data as any);
		message.info("Form reset to original values");
	};

	// ========================================================================
	// Field Props Helper
	// ========================================================================

	/**
	 * Get props for a specific field (validation, error state, change handler)
	 *
	 * @param fieldName - Field name
	 * @returns Field props
	 */
	const getFieldProps = (fieldName: keyof RigSetupData) => ({
		// error: errors[fieldName]?.message,
		// validateStatus: errors[fieldName] ? ("error" as const) : undefined,
		// onChange: (value: any) => handleChange(fieldName, value),
	});

	// ========================================================================
	// Validation State
	// ========================================================================

	const validation = section.validation;
	const isValid = section.isValid();

	console.log(`[useRigSetupForm] Validation state:`, {
		isValid,
		canSave: validation.canSave,
		databaseErrors: validation.database.errors.length,
		saveWarnings: validation.save.warnings.length,
	});

	// ========================================================================
	// Return Hook API
	// ========================================================================

	return {
		// Form state
		control,
		errors,
		isDirty: isDirty || section.isDirty,
		isValid,
		isReadOnly: !canEdit,

		// Validation
		validation,

		// Data
		data: section.data as RigSetupData,

		// Actions
		onSave,
		onSubmit,
		onReset,

		// Helpers
		getFieldProps,
		handleChange,

		// Direct form methods (for advanced usage)
		watch,
		setValue,
		reset,
	};
}
