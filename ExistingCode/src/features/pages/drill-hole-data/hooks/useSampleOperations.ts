/**
 * Sample Operations Hook
 * 
 * Encapsulates grid operations for AllSamples section.
 * Handles complex sample workflows with modal dialogs.
 * 
 * @module drill-hole-data/hooks
 */

import { useCallback, useMemo } from "react";
import { message, Modal } from "antd";
import { useDrillHoleDataStore } from "../store";
import { SectionKey } from "../types/data-contracts";

/**
 * Sample Operations Hook
 * 
 * Provides grid operations for AllSamples section.
 * 
 * NOTE: AllSamples has complex workflows (modal dialogs, dispatch, lab results)
 * This hook provides the foundation - extend as needed.
 * 
 * @returns Sample operations and state
 */
export function useSampleOperations() {
	console.log(`[useSampleOperations] 🎣 Hook initialized`);

	// ========================================================================
	// Store Selectors
	// ========================================================================

	const section = useDrillHoleDataStore(state => state.sections.allSamples);
	const dispatchSection = useDrillHoleDataStore(state => state.sections.dispatch);
	const drillPlanId = useDrillHoleDataStore(state => state.drillPlanId || "");
	const vwCollar = useDrillHoleDataStore(state => state.vwCollar);
	const addRow = useDrillHoleDataStore(state => state.addRow);
	const updateRow = useDrillHoleDataStore(state => state.updateRow);
	const deleteRow = useDrillHoleDataStore(state => state.deleteRow);
	const updateSectionData = useDrillHoleDataStore(state => state.updateSectionData);
	const saveSection = useDrillHoleDataStore(state => state.saveSection);
	const canEdit = useDrillHoleDataStore(state => state.canEdit(SectionKey.AllSamples));
	const openDrawer = useDrillHoleDataStore(state => state.openDrawer);
	const setActiveLens = useDrillHoleDataStore(state => state.setActiveLens);

	// ========================================================================
	// Grid Data
	// ========================================================================

	const samples = useMemo(() => {
		// Filter out soft-deleted samples
		return section.data.filter((sample: any) => {
			const sampleId = sample.SampleId;
			const metadata = section.rowMetadata[sampleId];
			return !metadata?.isDeleted;
		});
	}, [section.data, section.rowMetadata]);

	console.log(`[useSampleOperations] Grid state:`, {
		sampleCount: samples.length,
		canEdit,
		isDirty: section.isDirty,
	});

	// ========================================================================
	// Sample Operations
	// ========================================================================

	/**
	 * Add new sample using existing row operation pipeline.
	 */
	const handleAddSample = useCallback(() => {
		console.log(`[useSampleOperations] ➕ Adding new sample`);

		if (!canEdit) {
			message.warning("Cannot add sample - data is read-only");
			return;
		}


		const nextDepthFrom = samples.length > 0
			? Math.max(...samples.map((s: any) => Number(s?.DepthTo || s?.DepthFrom || 0)))
			: 0;
		const nextDepthTo = Number((nextDepthFrom + 1).toFixed(2));

		const sampleId = crypto.randomUUID();
		const row = {
			SampleId: sampleId,
			CollarId: drillPlanId,
			Organization: (vwCollar as any)?.Organization || "",
			SampleNm: `SMP-${String(samples.length + 1).padStart(4, "0")}`,
			DepthFrom: nextDepthFrom,
			DepthTo: nextDepthTo,
			RowStatus: 0,
			ActiveInd: true,
			rv: "",
		};

		addRow(SectionKey.AllSamples, row);
		message.success("Sample row added");
	}, [canEdit, samples, drillPlanId, vwCollar, addRow]);

	/**
	 * Handle cell value changed
	 */
	const handleCellValueChanged = useCallback((params: any) => {
		const { data, colDef, newValue } = params;
		const sampleId = data.SampleId;
		const fieldName = colDef.field;

		console.log(`[useSampleOperations] 📝 Cell changed:`, {
			sampleId,
			field: fieldName,
			newValue,
		});

		if (!canEdit) {
			message.warning("Cannot edit - data is read-only");
			params.api.refreshCells({ force: true });
			return;
		}

		updateRow(SectionKey.AllSamples, sampleId, {
			[fieldName]: newValue,
		});
	}, [canEdit, updateRow]);

	/**
	 * Delete sample
	 */
	const handleDeleteSample = useCallback((sampleId: string) => {
		console.log(`[useSampleOperations] 🗑️ Deleting sample:`, sampleId);

		if (!canEdit) {
			message.warning("Cannot delete - data is read-only");
			return;
		}

		Modal.confirm({
			title: "Delete Sample",
			content: "Are you sure you want to delete this sample?",
			okText: "Delete",
			okType: "danger",
			cancelText: "Cancel",
			onOk: () => {
				deleteRow(SectionKey.AllSamples, sampleId);
				message.success("Sample deleted");
			},
		});
	}, [canEdit, deleteRow]);

	/**
	 * Edit sample in modal/drawer
	 */
	const handleEditSample = useCallback((sample: any) => {
		console.log(`[useSampleOperations] ✏️ Editing sample:`, sample.SampleId);
		openDrawer("allSamples", sample);
	}, [openDrawer]);

	/**
	 * Dispatch samples to lab via existing dispatch section in the same store.
	 */
	const handleDispatchSamples = useCallback((sampleIds: string[]) => {
		console.log(`[useSampleOperations] 📤 Dispatching samples:`, sampleIds);

		if (!canEdit) {
			message.warning("Cannot dispatch - data is read-only");
			return;
		}


		if (sampleIds.length === 0) {
			message.warning("Select at least one sample to dispatch");
			return;
		}

		const selectedSamples = samples.filter(sample => sampleIds.includes(sample.SampleId));
		const totalWeight = selectedSamples.reduce((sum, sample: any) => sum + Number(sample?.SampleWeight || 0), 0);

		const nowIso = new Date().toISOString();
		const existingDispatch = (dispatchSection?.data || {}) as Record<string, any>;
		const dispatchId = existingDispatch.LabDispatchId || crypto.randomUUID();

		updateSectionData(SectionKey.Dispatch, {
			...existingDispatch,
			LabDispatchId: dispatchId,
			CollarId: drillPlanId,
			HoleNm: existingDispatch.HoleNm || (vwCollar as any)?.HoleNm || "",
			Organization: existingDispatch.Organization || (vwCollar as any)?.Organization || "",
			DispatchNumber: existingDispatch.DispatchNumber || `DSP-${Date.now()}`,
			DispatchedDt: existingDispatch.DispatchedDt || nowIso,
			DispatchStatus: existingDispatch.DispatchStatus || "Draft",
			LabCode: existingDispatch.LabCode || "TBD",
			SubmittedBy: existingDispatch.SubmittedBy || "system",
			AuthorizedByName: existingDispatch.AuthorizedByName || "system",
			CertificateInd: Boolean(existingDispatch.CertificateInd),
			EmailNotificationInd: Boolean(existingDispatch.EmailNotificationInd),
			WebNotificationInd: Boolean(existingDispatch.WebNotificationInd),
			PulpDiscardAfter90Days: Boolean(existingDispatch.PulpDiscardAfter90Days),
			PulpPaidStorageAfter90Days: Boolean(existingDispatch.PulpPaidStorageAfter90Days),
			PulpReturnAfter90Days: Boolean(existingDispatch.PulpReturnAfter90Days),
			PulpReturnInd: Boolean(existingDispatch.PulpReturnInd),
			RejectDiscardAfter90Days: Boolean(existingDispatch.RejectDiscardAfter90Days),
			RejectPaidStorageAfter90Days: Boolean(existingDispatch.RejectPaidStorageAfter90Days),
			RejectReturnAfter90Days: Boolean(existingDispatch.RejectReturnAfter90Days),
			RejectReturnInd: Boolean(existingDispatch.RejectReturnInd),
			SampleTypeDrillCore: existingDispatch.SampleTypeDrillCore ?? true,
			SampleTypePercussion: Boolean(existingDispatch.SampleTypePercussion),
			SampleTypeRock: Boolean(existingDispatch.SampleTypeRock),
			SampleTypeSediment: Boolean(existingDispatch.SampleTypeSediment),
			SampleTypeSoil: Boolean(existingDispatch.SampleTypeSoil),
			TotalSampleCount: sampleIds.length,
			TotalWeight: Number(totalWeight.toFixed(3)),
			SpecialInstructions: existingDispatch.SpecialInstructions || `Prepared from ${sampleIds.length} sample(s)`,
		});

		message.success(`Prepared dispatch data for ${sampleIds.length} sample(s)`);
	}, [canEdit, samples, dispatchSection?.data, updateSectionData, drillPlanId, vwCollar]);

	/**
	 * Import lab results
	 * 
	 * TODO: Copy from visual-mapper/TemplateLibrary.tsx
	 */
	const handleImportLabResults = useCallback(() => {
		console.log(`[useSampleOperations] 📥 Importing lab results`);
		setActiveLens("Sampling", "LabResults");
		message.info("Switched to Lab Results importer");
	}, [setActiveLens]);

	/**
	 * Save all changes
	 */
	const handleSaveAll = useCallback(async () => {
		console.log(`[useSampleOperations] 💾 Saving all changes`);

		try {
			const result = await saveSection(SectionKey.AllSamples);

			if (result.success) {
				message.success("Samples saved successfully");
			} else {
				message.error(result.message || "Save failed");
			}
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : "Save failed";
			message.error(errorMessage);
			console.error(`[useSampleOperations] ❌ Save error:`, error);
		}
	}, [saveSection]);

	// ========================================================================
	// Return Hook API
	// ========================================================================

	return {
		// Data
		samples,
		sampleCount: samples.length,
		
		// State
		isReadOnly: !canEdit,
		isDirty: section.isDirty,
		hasUnsavedChanges: section.hasUnsavedChanges(),
		
		// Metadata
		rowMetadata: section.rowMetadata,
		
		// Basic Operations
		handleAddSample,
		handleCellValueChanged,
		handleDeleteSample,
		handleEditSample,
		handleSaveAll,
		
		// Sample-Specific Operations
		handleDispatchSamples,
		handleImportLabResults,
		
		// Validation
		validateRow: section.validateRow,
		validateAll: section.validateAll,
	};
}
