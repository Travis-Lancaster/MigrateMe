/**
 * useSectionActions Hook
 *
 * Provides consistent action handlers for all DrillHole sections.
 * Eliminates code duplication by centralizing action orchestration.
 *
 * SOLID Principles Applied:
 * - Single Responsibility: Only handles action delegation to store
 * - Open/Closed: Extensible via callbacks, closed for modification
 * - Liskov Substitution: Works for any section type
 * - Interface Segregation: Clean, focused interface
 * - Dependency Inversion: Depends on store abstractions
 *
 * Benefits:
 * - DRY: Single implementation for all 6 actions
 * - KISS: Simple API, just pass sectionKey
 * - Type-safe: Returns properly typed handlers
 * - Testable: Can be tested independently
 * - Consistent: Same behavior across all sections
 * - Flexible: Optional callbacks for custom logic
 *
 * @example Grid Section
 * ```tsx
 * const actions = useSectionActions(SectionKey.Sample);
 * return <SectionWrapper {...actions}>content</SectionWrapper>;
 * ```
 *
 * @example Form Section with Callbacks
 * ```tsx
 * const actions = useSectionActions(SectionKey.Collar, {
 *   beforeSave: () => updateSectionData(getValues()),
 *   afterSave: () => reset(section.data)
 * });
 * ```
 */

import type { SectionKey } from "#src/types/drillhole";
import { App } from "antd";
import { useCallback } from "react";
import { useCreateDrillHoleStore } from "../store/create-drillhole-store";

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Optional configuration for section actions
 */
export interface SectionActionsOptions {
	/** Called before save to prepare data (e.g., sync form to store) */
	beforeSave?: () => void | Promise<void>

	/** Called after successful save (e.g., reset form, clear selections) */
	afterSave?: () => void | Promise<void>

	/** Called after any successful action */
	onSuccess?: (action: string, message: string) => void

	/** Called on any error */
	onError?: (action: string, error: string) => void
}

/**
 * Action handlers returned by the hook
 */
export interface SectionActionHandlers {
	onSave: () => Promise<void>
	onSubmit: () => Promise<void>
	onReject: () => Promise<void>
	onReview: () => Promise<void>
	onApprove: () => Promise<void>
	onExclude: () => Promise<void>
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * Hook that provides all section action handlers
 *
 * @param sectionKey - The section key (e.g., SectionKey.Collar)
 * @param options - Optional configuration for callbacks
 * @returns Object with all 6 action handlers
 */
export function useSectionActions(
	sectionKey: SectionKey,
	options: SectionActionsOptions = {},
): SectionActionHandlers {
	const { message } = App.useApp();

	// ============================================================================
	// Store Actions - Get all action functions from store
	// ============================================================================

	const saveSection = useCreateDrillHoleStore(state => state.saveSection);
	const submitSection = useCreateDrillHoleStore(state => state.submitSection);
	const rejectSection = useCreateDrillHoleStore(state => state.rejectSection);
	const completedSection = useCreateDrillHoleStore(state => state.completedSection);
	const reviewSection = useCreateDrillHoleStore(state => state.reviewSection);
	const approveSection = useCreateDrillHoleStore(state => state.approveSection);
	const excludeFromReport = useCreateDrillHoleStore(state => state.excludeFromReport);

	// ============================================================================
	// Destructure Options
	// ============================================================================

	const {
		beforeSave,
		afterSave,
		onSuccess,
		onError,
	} = options;

	// ============================================================================
	// Generic Action Handler Wrapper
	// ============================================================================

	/**
	 * Generic wrapper that handles action execution, success/error messaging,
	 * and optional callback invocation.
	 *
	 * @param actionName - Human-readable action name (e.g., "Save", "Submit")
	 * @param actionFn - Store action function to execute
	 * @param successMessage - Default success message if action doesn't provide one
	 */
	const handleAction = useCallback(
		async (
			actionName: string,
			actionFn: () => Promise<any>,
			successMessage: string,
		) => {
			console.log(`🔹 [${sectionKey}] ${actionName} clicked`);

			try {
				// Execute the store action
				const result = await actionFn();
				console.log(`🔹 [${sectionKey}] ${actionName} result:`, result);

				if (result.success) {
					// Success: Show message and call optional callback
					const msg = result.message || successMessage;
					message.success(msg);
					onSuccess?.(actionName, msg);
				}
				else {
					// Failure: Show error and call optional callback
					const errMsg = result.message || `Failed to ${actionName.toLowerCase()}`;
					message.error(errMsg);
					onError?.(actionName, errMsg);

					if (result.errors) {
						console.error(`❌ [${sectionKey}] ${actionName} validation errors:`, result.errors);
					}
				}
			}
			catch (error) {
				// Exception: Show error and call optional callback
				const errMsg = error instanceof Error ? error.message : `${actionName} failed`;
				console.error(`❌ [${sectionKey}] ${actionName} error:`, error);
				message.error(errMsg);
				onError?.(actionName, errMsg);
			}
		},
		[sectionKey, message, onSuccess, onError],
	);

	// ============================================================================
	// Action Handlers - One for each action type
	// ============================================================================

	/**
	 * Save handler - Saves section data
	 * Calls beforeSave → save → afterSave
	 */
	const onSave = useCallback(async () => {
		try {
			await beforeSave?.();
			await handleAction("Save", () => saveSection(sectionKey), "Section saved successfully");
			await afterSave?.();
		}
		catch (error) {
			console.error(`❌ [${sectionKey}] beforeSave/afterSave error:`, error);
			const errMsg = error instanceof Error ? error.message : "Save callback failed";
			message.error(errMsg);
		}
	}, [beforeSave, afterSave, handleAction, saveSection, sectionKey, message]);

	/**
	 * Submit handler - Transitions Draft → Complete (with validation)
	 * Validates before transitioning, rejects if validation fails
	 */
	const onSubmit = useCallback(async () => {
		try {
			await beforeSave?.();
			await handleAction(
				"Submit",
				() => submitSection(sectionKey),
				"Section submitted successfully",
			);
		}
		catch (error) {
			console.error(`❌ [${sectionKey}] beforeSave error:`, error);
			const errMsg = error instanceof Error ? error.message : "Submit callback failed";
			message.error(errMsg);
		}
	}, [beforeSave, handleAction, submitSection, sectionKey, message]);

	/**
	 * Reject handler - Returns section back to Draft status
	 * Available from Complete or Reviewed status
	 */
	const onReject = useCallback(async () => {
		await handleAction(
			"Reject",
			() => rejectSection(sectionKey),
			"Section rejected - moved back to Draft",
		);
	}, [handleAction, rejectSection, sectionKey]);

	/**
	 * Review handler - Transitions Complete → Reviewed
	 * Requires review permission (checked by ActionButtons component)
	 */
	const onReview = useCallback(async () => {
		await handleAction(
			"Review",
			() => reviewSection(sectionKey),
			"Section marked as reviewed",
		);
	}, [handleAction, reviewSection, sectionKey]);

	/**
	 * Approve handler - Transitions Reviewed → Approved
	 * Sets ReportIncludeInd to true by default
	 * Requires approve permission (checked by ActionButtons component)
	 */
	const onApprove = useCallback(async () => {
		await handleAction(
			"Approve",
			() => approveSection(sectionKey),
			"Section approved and included in reports",
		);
	}, [handleAction, approveSection, sectionKey]);

	/**
	 * Exclude handler - Toggles ReportIncludeInd for Approved sections
	 * Section remains in Approved status, just excluded from reports
	 * Requires exclude permission (checked by ActionButtons component)
	 */
	const onExclude = useCallback(async () => {
		await handleAction(
			"Exclude",
			() => excludeFromReport(sectionKey),
			"Section excluded from reports",
		);
	}, [handleAction, excludeFromReport, sectionKey]);

	// ============================================================================
	// Return All Handlers
	// ============================================================================

	return {
		onSave,
		onSubmit,
		onReject,
		onReview,
		onApprove,
		onExclude,
	};
}

/**
 * Re-export types for convenience
 */
export type { SectionActionsOptions as UseSectionActionsOptions };
export type { SectionActionHandlers as UseSectionActionsReturn };
