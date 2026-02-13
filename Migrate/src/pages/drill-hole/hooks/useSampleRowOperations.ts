/**
 * useSampleRowOperations Hook
 *
 * Consolidated hook for all sample row operations with consistent signatures.
 * Encapsulates business logic for row manipulation, QAQC insertion, and resampling.
 *
 * Key Features:
 * - Index-based operations (startIndex, endIndex) instead of AG Grid API dependency
 * - Consistent interface across all operations
 * - Row-level dirty tracking for sync
 * - Proper TypeScript typing
 * - Testable without React components
 *
 * @example
 * ```typescript
 * const {
 *   insertRowAt,
 *   deleteRows,
 *   unDeleteRows,
 *   addQaqcSample,
 *   resample,
 *   selectRowsInRange,
 * } = useSampleRowOperations({
 *   gridRef,
 *   gridData: activeGridData,
 *   updateGridData,
 *   getDrillHoleContext,
 *   qcInsertionRule,
 *   holeCounter,
 *   currentDrillHoleId,
 * });
 * ```
 */

import type { AgGridReact } from "ag-grid-react";
import type { RefObject } from "react";
import type { QaqcInsertionRule, SampleData } from "../validation/sample-schemas";

import { SectionKey } from "#src/types/drillhole";
import { App } from "antd";
import { useCallback } from "react";
import { useDrillHoleStore } from "../store/drillhole-store";
import {
	getRowsInRange,
	selectRowsInRange as selectRowsHelper,
} from "../utils/cell-selection-helper";
import { insertQaqcSamples } from "../utils/qaqcInserter";
import { SampleIdGenerator } from "../utils/sampleIdGenerator";
import { createEmptySampleData } from "../validation/sample-schemas";

/**
 * Drill hole context information
 */
export interface DrillHoleContext {
	drillHoleId: string | null
	organization: string
}

/**
 * Hook options
 */
export interface UseSampleRowOperationsOptions {
	/** Reference to AG Grid */
	gridRef: RefObject<AgGridReact<SampleData>>
	/** Current grid data */
	gridData: SampleData[]
	/** State updater for grid data */
	updateGridData: (updater: (prev: SampleData[]) => SampleData[]) => void
	/** Get drill hole context (ID, organization) */
	getDrillHoleContext: () => DrillHoleContext
	/** QAQC insertion rule configuration */
	qcInsertionRule?: QaqcInsertionRule
	/** Hole counter for sample naming */
	holeCounter?: string
	/** Current drill hole ID fallback */
	currentDrillHoleId: string
	/** Hole name for QAQC generation */
	holeNm?: string
	/** Project code for QAQC generation */
	project?: string
}

/**
 * Hook return interface
 */
export interface SampleRowOperations {
	/** Insert a new row at specified index */
	insertRowAt: (index: number) => Promise<void>

	/** Delete rows in range (soft delete: ActiveInd=false) */
	deleteRows: (startIndex: number, endIndex: number) => Promise<void>

	/** Restore deleted rows in range (set ActiveInd=true) */
	unDeleteRows: (startIndex: number, endIndex: number) => Promise<void>

	/** Add QAQC sample after specified row */
	addQaqcSample: (
		qaqcType: "BLK" | "STD" | "PREPDUP" | "FDUP",
		rowIndex: number,
		standardId?: string,
	) => Promise<void>

	/** Create resamples from rows in range */
	resample: (startIndex: number, endIndex: number) => Promise<void>

	/** Select rows in range (converts cell range to row selection) */
	selectRowsInRange: (startIndex: number, endIndex: number) => void

	/** Get row data in range */
	getRowsInRange: (startIndex: number, endIndex: number) => SampleData[]
}

/**
 * Consolidated hook for all sample row operations
 * Follows Single Responsibility Principle by encapsulating sample-specific business logic
 */
export function useSampleRowOperations(
	options: UseSampleRowOperationsOptions,
): SampleRowOperations {
	const {
		gridRef,
		gridData,
		updateGridData,
		getDrillHoleContext,
		qcInsertionRule,
		holeCounter,
		currentDrillHoleId,
		holeNm,
		project,
	} = options;

	const { message } = App.useApp();

	/**
	 * Insert a new row at specified index
	 */
	const insertRowAt = useCallback(
		async (index: number) => {
			const context = getDrillHoleContext();
			const prevRow = index > 0 ? gridData[index - 1] : null;
			const depthFrom = prevRow?.DepthTo || 0;

			const newRow: SampleData = {
				...createEmptySampleData(depthFrom),
				SampleId: crypto.randomUUID(),
				CollarId: context.drillHoleId || currentDrillHoleId,
				Organization: context.organization || "",
			} as SampleData;

			updateGridData((prev) => {
				const newData = [...prev];
				newData.splice(index, 0, newRow);
				return newData;
			});

			// Mark new row as dirty for row-level sync
			const markRowDirty = useDrillHoleStore.getState().markRowDirty;
			if (newRow.SampleId) {
				await markRowDirty(SectionKey.Sample, newRow.SampleId);
			}

			console.log(`➕ [Sample] Inserted row at index ${index}, marked as dirty`);
		},
		[gridData, getDrillHoleContext, currentDrillHoleId, updateGridData],
	);

	/**
	 * Delete rows in range (soft delete)
	 */
	const deleteRows = useCallback(
		async (startIndex: number, endIndex: number) => {
			const rowsToDelete = getRowsInRange(gridRef, startIndex, endIndex);
			if (rowsToDelete.length === 0)
				return;

			console.log(`🗑️ [Sample] Marking ${rowsToDelete.length} rows as inactive`);

			// Soft delete: set ActiveInd=false
			updateGridData(prev =>
				prev.map((row) => {
					const isSelected = rowsToDelete.some(sel => sel.SampleId === row.SampleId);
					return isSelected ? { ...row, ActiveInd: false } : row;
				}),
			);

			// Mark rows as dirty for sync
			const markRowDirty = useDrillHoleStore.getState().markRowDirty;
			for (const row of rowsToDelete) {
				if (row.SampleId) {
					await markRowDirty(SectionKey.Sample, row.SampleId);
				}
			}

			message.success(`Deleted ${rowsToDelete.length} sample(s)`);
		},
		[gridRef, updateGridData, message],
	);

	/**
	 * Restore deleted rows in range
	 */
	const unDeleteRows = useCallback(
		async (startIndex: number, endIndex: number) => {
			const rowsToRestore = getRowsInRange(gridRef, startIndex, endIndex);
			if (rowsToRestore.length === 0)
				return;

			console.log(`♻️ [Sample] Restoring ${rowsToRestore.length} rows`);

			// Restore: set ActiveInd=true
			updateGridData(prev =>
				prev.map((row) => {
					const isSelected = rowsToRestore.some(sel => sel.SampleId === row.SampleId);
					return isSelected && row.ActiveInd === false ? { ...row, ActiveInd: true } : row;
				}),
			);

			// Mark rows as dirty for sync
			const markRowDirty = useDrillHoleStore.getState().markRowDirty;
			for (const row of rowsToRestore) {
				if (row.SampleId) {
					await markRowDirty(SectionKey.Sample, row.SampleId);
				}
			}

			message.success(`Restored ${rowsToRestore.length} sample(s)`);
		},
		[gridRef, updateGridData, message],
	);

	/**
	 * Add individual QAQC sample after specified row
	 */
	const addQaqcSample = useCallback(
		async (
			qaqcType: "BLK" | "STD" | "PREPDUP" | "FDUP",
			rowIndex: number,
			standardId?: string,
		) => {
			if (!qcInsertionRule) {
				message.warning("No QAQC rule configured");
				return;
			}

			const context = getDrillHoleContext();
			const parentSample = getRowsInRange(gridRef, rowIndex, rowIndex)[0];

			if (!parentSample) {
				message.error("Parent sample not found");
				return;
			}

			// Get next sequence number
			const maxSequence = SampleIdGenerator.findMaxSequence(
				gridData,
				qcInsertionRule.SampleIdPrefix,
			);
			const nextSequence = maxSequence > 0 ? maxSequence + 1 : 1;

			// Create base QAQC sample
			const baseSample: Partial<SampleData> = {
				SampleId: crypto.randomUUID(),
				CollarId: context.drillHoleId || currentDrillHoleId,
				Organization: context.organization || "",
				DepthFrom: (parentSample.DepthFrom || 0) + 0.01,
				RodNo: parentSample.RodNo,
				SampledBy: parentSample.SampledBy,
				SampleMethod: parentSample.SampleMethod,
				SampledDt: parentSample.SampledDt,
				Comments: parentSample.Comments,
				RowStatus: 0,
				ActiveInd: true,
			};

			let newSample: SampleData;

			// Type-specific properties
			switch (qaqcType) {
				case "BLK":
					newSample = {
						...createEmptySampleData(baseSample.DepthFrom!),
						...baseSample,
						SampleType: "Chips",
						StandardId: "BLANK",
						SampleWeight: 1.5,
						SourceTable: "StandardSample",
						SampleClassification: "BLK",
						ChkType: "BLK",

					} as SampleData;
					break;

				case "STD":
					newSample = {
						...createEmptySampleData(baseSample.DepthFrom!),
						...baseSample,
						SampleType: "Pulp",
						SampleWeight: 0.06,
						StandardId: standardId || "",
						SourceTable: "StandardSample",
						ChkType: "STD",
						SampleClassification: "STD",
					} as SampleData;
					break;

				case "PREPDUP":
					newSample = {
						...createEmptySampleData(baseSample.DepthFrom!),
						...baseSample,
						SampleType: parentSample.SampleType,
						OriginalSampleId: parentSample.SampleId,
						OriginalSampleNm: parentSample.SampleNm,
						SampleWeight: parentSample.SampleWeight,
						DepthTo: parentSample.DepthTo,
						SampleClassification: "PREPDUP",

						SourceTable: "SampleQC",
						ChkType: "PREPDUP",
						QCClassification: "PREPDUP",
					} as SampleData;
					break;

				case "FDUP":
					newSample = {
						...createEmptySampleData(baseSample.DepthFrom!),
						...baseSample,
						SampleType: parentSample.SampleType,
						OriginalSampleId: parentSample.SampleId,
						OriginalSampleNm: parentSample.SampleNm,
						SampleWeight: parentSample.SampleWeight,
						DepthTo: parentSample.DepthTo,
						SampleClassification: "FDUP",
						SourceTable: "SampleQC",
						ChkType: "FDUP",
						QCClassification: "FDUP",
					} as SampleData;
					break;
			}

			// Generate sample name
			const generator = new SampleIdGenerator({
				prefix: qcInsertionRule.SampleIdPrefix,
				startingSequence: nextSequence,
				format: "standard",
			});
			newSample.SampleNm = generator.getNextId(holeCounter || "");

			// Insert after current row
			updateGridData((prev) => {
				const newData = [...prev];
				newData.splice(rowIndex + 1, 0, newSample);
				return newData;
			});

			// Mark new QAQC sample as dirty for row-level sync
			const markRowDirty = useDrillHoleStore.getState().markRowDirty;
			if (newSample.SampleId) {
				await markRowDirty(SectionKey.Sample, newSample.SampleId);
			}

			message.success(`Added ${qaqcType} sample after row ${rowIndex + 1}`);
		},
		[
			qcInsertionRule,
			gridData,
			getDrillHoleContext,
			currentDrillHoleId,
			holeCounter,
			gridRef,
			updateGridData,
			message,
		],
	);

	/**
	 * Create resamples from rows in range
	 */
	const resample = useCallback(
		async (startIndex: number, endIndex: number) => {
			if (!qcInsertionRule) {
				message.warning("No QAQC rule configured");
				return;
			}

			const selectedSamples = getRowsInRange(gridRef, startIndex, endIndex);
			if (selectedSamples.length === 0) {
				message.warning("No samples selected");
				return;
			}

			try {
				// Filter out QAQC samples - only resample regular samples
				const regularSamples = selectedSamples.filter(
					sample =>
						!sample.SampleClassification
						|| !["BLK", "STD", "PREPDUP", "FDUP"].includes(sample.SampleClassification),
				);

				if (regularSamples.length === 0) {
					message.warning("No regular samples selected. QAQC samples cannot be resampled.");
					return;
				}

				const context = getDrillHoleContext();

				// Create resample copies
				const resampleCopies: SampleData[] = regularSamples.map(sample => ({
					...sample,
					SampleId: crypto.randomUUID(),
					SampleNm: "", // Will be assigned during renumbering
					OriginalSampleId: sample.SampleId,
					OriginalSampleNm: sample.SampleNm,
					SampleClassification: "Resample",
					RowStatus: 0,
					ActiveInd: true,
				}));

				// Get next sequence from database
				const nextSequence
					= SampleIdGenerator.findMaxSequence(gridData, qcInsertionRule.SampleIdPrefix) + 1;

				// Insert QAQC for resamples
				const standardSequence = qcInsertionRule.StandardSequence?.filter(
					(seq): seq is { StandardId: string, SortOrder: number, IsRepeatStart: boolean } =>
						seq.SortOrder !== undefined && seq.IsRepeatStart !== undefined,
				);

				const { samples: resamplesWithQaqc, qaqcCount } = insertQaqcSamples(
					resampleCopies,
					qcInsertionRule,
					holeNm || "",
					project || "",
					undefined,
					standardSequence,
					[],
				);

				// Renumber resamples
				const renumberedResamples = SampleIdGenerator.renumberSamplesByDepth(
					resamplesWithQaqc,
					qcInsertionRule.SampleIdPrefix,
					nextSequence,
					holeCounter || "",
				);

				// Combine with existing samples
				const updatedSamples = [...gridData, ...renumberedResamples];

				// Sort by depth
				const sortedSamples = updatedSamples.sort(
					(a, b) => (a.DepthFrom || 0) - (b.DepthFrom || 0),
				);

				// Update store
				updateGridData(() => sortedSamples);

				// Mark all new resamples and QAQC samples as dirty for row-level sync
				const markRowDirty = useDrillHoleStore.getState().markRowDirty;
				for (const sample of renumberedResamples) {
					if (sample.SampleId) {
						await markRowDirty(SectionKey.Sample, sample.SampleId);
					}
				}

				message.success(
					`Created ${regularSamples.length} resamples with ${qaqcCount.total} QAQC samples `
					+ `(${qaqcCount.blanks} blanks, ${qaqcCount.standards} standards, ${qaqcCount.duplicates} duplicates)`,
				);
			}
			catch (error) {
				console.error("Error creating resamples:", error);
				message.error(`Failed to create resamples: ${(error as Error).message}`);
			}
		},
		[
			qcInsertionRule,
			gridData,
			getDrillHoleContext,
			holeNm,
			project,
			holeCounter,
			gridRef,
			updateGridData,
			message,
		],
	);

	/**
	 * Select rows in range (wrapper for helper)
	 */
	const selectRowsInRange = useCallback(
		(startIndex: number, endIndex: number) => {
			selectRowsHelper(gridRef, startIndex, endIndex);
		},
		[gridRef],
	);

	/**
	 * Get rows in range (wrapper for helper)
	 */
	const getRowsInRangeCallback = useCallback(
		(startIndex: number, endIndex: number) => {
			return getRowsInRange(gridRef, startIndex, endIndex);
		},
		[gridRef],
	);

	return {
		insertRowAt,
		deleteRows,
		unDeleteRows,
		addQaqcSample,
		resample,
		selectRowsInRange,
		getRowsInRange: getRowsInRangeCallback,
	};
}
