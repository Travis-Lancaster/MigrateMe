/**
 * useSampleOperations Hook
 *
 * Encapsulates all sample-specific business operations.
 * Provides a clean interface for sample generation, QAQC insertion, and manipulation.
 */

import type { QaqcInsertionRule, SampleData } from "../validation/sample-schemas";
import { RowStatus, SectionKey } from "#src/types/drillhole";
import { App } from "antd";
import { useCallback } from "react";

import { useCreateDrillHoleStore } from "../store/create-drillhole-store";
import { getQaqcStatistics, insertQaqcSamples, removeQaqcSamples } from "../utils/qaqcInserter";
import {
	filterQaqcSamples,
	filterRegularSamples,
	generateSampleIntervals,
	validateSampleIntervals,
} from "../utils/sample-generator";
import { SampleIdGenerator } from "../utils/sampleIdGenerator";

/**
 * Hook for sample-specific operations
 */
export function useSampleOperations() {
	const { message } = App.useApp();
	const updateSectionData = useCreateDrillHoleStore(state => state.updateSectionData);
	const section = useCreateDrillHoleStore(state => state.sections.sample);

	/**
	 * Generate samples from depth intervals
	 * Creates samples from 0 to totalDepth at specified intervals
	 */
	const generateSamples = useCallback(
		async (options: {
			totalDepth: number
			intervalSize: number
			qaqcRule: QaqcInsertionRule | null
			holeNm: string
			project: string
			holeCounter: string
		}) => {
			const { totalDepth, intervalSize, qaqcRule, holeNm, project, holeCounter } = options;

			try {
				// Validate inputs
				if (!totalDepth || totalDepth <= 0) {
					message.error("Invalid total depth. Please set a valid total depth first.");
					return;
				}

				if (!qaqcRule) {
					message.error("No QAQC rule configured. Please configure rules first.");
					return;
				}

				// Validate StandardSequence if StandardFrequency is configured
				if (
					qaqcRule.StandardFrequency
					&& qaqcRule.StandardFrequency > 0
					&& (!qaqcRule.StandardSequence || qaqcRule.StandardSequence.length === 0)
				) {
					message.error(
						"StandardSequence must be configured when StandardFrequency is set. Please configure the Standard sequence in QAQC rules.",
					);
					return;
				}

				// Get current samples
				const currentSamples = Array.isArray(section.data) ? section.data : [];

				// Separate existing samples from DB (RowStatus !== -99)
				const existingFromDB = currentSamples.filter(sample => sample.RowStatus !== -99);
				const existingRegularSamples = filterRegularSamples(existingFromDB);
				const existingQaqcSamples = filterQaqcSamples(existingFromDB);

				// Get context for new samples
				const context = useCreateDrillHoleStore.getState();
				const collarId = context.drillHoleId || "";
				const organization = context.Organization || "";

				// Generate new regular samples
				const generatedSamples = generateSampleIntervals({
					totalDepth,
					intervalSize,
					existingSamples: existingRegularSamples,
					collarId,
					organization,
					holeNm,
					project,
				});

				// Combine existing regular samples with newly generated
				const allRegularSamples = [...existingRegularSamples, ...generatedSamples];

				// Insert NEW QAQC samples (pass existing QAQC for frequency counting)
				// Filter and ensure StandardSequence has required properties
				const standardSequence = qaqcRule.StandardSequence?.filter(
					(seq): seq is { StandardId: string, SortOrder: number, IsRepeatStart: boolean } =>
						seq.SortOrder !== undefined && seq.IsRepeatStart !== undefined,
				);

				const { samples: regularAndNewQaqc, qaqcCount } = insertQaqcSamples(
					allRegularSamples,
					qaqcRule,
					holeNm,
					project,
					undefined, // SampleNm assigned by renumberSamplesByDepth
					standardSequence,
					existingQaqcSamples,
				);

				// Merge existing QAQC back into the final list
				const allSamples = [...regularAndNewQaqc, ...existingQaqcSamples];

				// Find max sequence number and renumber new samples
				const maxExistingSequence = SampleIdGenerator.findMaxSequence(
					allSamples,
					qaqcRule.SampleIdPrefix,
				);
				const nextSequence = maxExistingSequence > 0 ? maxExistingSequence + 1 : 1;

				// Renumber only new samples (RowStatus === -99)
				const renumberedSamples = SampleIdGenerator.renumberSamplesByDepth(
					allSamples,
					qaqcRule.SampleIdPrefix,
					nextSequence,
					holeCounter,
				);

				// Update store
				updateSectionData<SampleData[]>(SectionKey.Sample, renumberedSamples);

				// Mark all newly generated samples as dirty for row-level sync
				const { markRowDirty } = useCreateDrillHoleStore.getState();
				for (const sample of renumberedSamples) {
					if (sample.SampleId && sample.RowStatus === RowStatus.Draft) {
						// Only mark new samples
						await markRowDirty(SectionKey.Sample, sample.SampleId);
					}
				}

				// Success message
				message.success(
					`Generated ${generatedSamples.length} new samples with ${qaqcCount.total} QAQC samples `
					+ `(${qaqcCount.blanks} blanks, ${qaqcCount.standards} standards, ${qaqcCount.duplicates} duplicates). `
					+ `${existingRegularSamples.length} existing samples preserved.`,
				);

				return renumberedSamples;
			}
			catch (error) {
				console.error("Error generating samples:", error);
				message.error(`Failed to generate samples: ${(error as Error).message}`);
				throw error;
			}
		},
		[section.data, updateSectionData, message],
	);

	/**
	 * Insert QAQC samples into existing regular samples
	 * Removes old QAQC and inserts new based on current rule
	 */
	const insertQaqc = useCallback(
		async (qaqcRule: QaqcInsertionRule | null, holeNm: string, project: string) => {
			try {
				if (!qaqcRule) {
					message.error("No QAQC rule configured. Please configure rules first.");
					return;
				}

				// Get current samples
				const currentSamples = Array.isArray(section.data) ? section.data : [];

				// Remove existing QAQC samples first
				const regularSamples = removeQaqcSamples(currentSamples);

				// Get next sequence number
				const maxSequence = SampleIdGenerator.findMaxSequence(
					regularSamples,
					qaqcRule.SampleIdPrefix,
				);
				const nextSequence = maxSequence > 0 ? maxSequence + 1 : 1;

				// Insert QAQC samples
				// Filter and ensure StandardSequence has required properties
				const standardSequence = qaqcRule.StandardSequence?.filter(
					(seq): seq is { StandardId: string, SortOrder: number, IsRepeatStart: boolean } =>
						seq.SortOrder !== undefined && seq.IsRepeatStart !== undefined,
				);

				const { samples: samplesWithQaqc, qaqcCount } = insertQaqcSamples(
					regularSamples,
					qaqcRule,
					holeNm,
					project,
					nextSequence,
					standardSequence,
				);

				// Update store
				updateSectionData<SampleData[]>(SectionKey.Sample, samplesWithQaqc);

				// Mark all newly generated QAQC samples as dirty for row-level sync
				const { markRowDirty } = useCreateDrillHoleStore.getState();
				for (const sample of samplesWithQaqc) {
					if (sample.SampleId && sample.RowStatus === -RowStatus.Imported) {
						await markRowDirty(SectionKey.Sample, sample.SampleId);
					}
				}

				// Success message
				message.success(
					`Generated ${qaqcCount.total} QAQC samples `
					+ `(${qaqcCount.blanks} blanks, ${qaqcCount.standards} standards, ${qaqcCount.duplicates} duplicates)`,
				);

				return samplesWithQaqc;
			}
			catch (error) {
				console.error("Error generating QAQC samples:", error);
				message.error(
					`Failed to generate QAQC samples: ${error instanceof Error ? error.message : "Unknown error"}`,
				);
				throw error;
			}
		},
		[section.data, updateSectionData, message],
	);

	/**
	 * Renumber samples by depth order
	 * Preserves existing samples, only renumbers new ones
	 */
	const renumberByDepth = useCallback(
		async (qaqcRule: QaqcInsertionRule | null, holeCounter: string) => {
			try {
				if (!qaqcRule) {
					message.error("No QAQC rule configured. Please configure rules first.");
					return;
				}

				// Get current samples (exclude empty rows)
				const currentSamples = Array.isArray(section.data) ? section.data : [];
				const allSamples = currentSamples.filter(row => row.DepthTo > 0);

				// Find max existing sequence
				const maxSequence = SampleIdGenerator.findMaxSequence(
					allSamples,
					qaqcRule.SampleIdPrefix,
				);
				const nextSequence = maxSequence > 0 ? maxSequence + 1 : 1;

				// Renumber by depth
				const renumbered = SampleIdGenerator.renumberSamplesByDepth(
					allSamples,
					qaqcRule.SampleIdPrefix,
					nextSequence,
					holeCounter,
				);

				// Update store
				updateSectionData<SampleData[]>(SectionKey.Sample, renumbered);

				message.success(`Renumbered ${renumbered.length} samples by depth order`);

				return renumbered;
			}
			catch (error) {
				console.error("Error renumbering samples:", error);
				message.error(`Failed to renumber samples: ${(error as Error).message}`);
				throw error;
			}
		},
		[section.data, updateSectionData, message],
	);

	/**
	 * Remove QAQC samples from the grid
	 * Keeps only regular samples
	 */
	const removeQaqc = useCallback(async () => {
		try {
			// Get current samples
			const currentSamples = Array.isArray(section.data) ? section.data : [];

			// Remove QAQC samples
			const regularOnly = removeQaqcSamples(currentSamples);

			// Update store
			updateSectionData<SampleData[]>(SectionKey.Sample, regularOnly);

			const removedCount = currentSamples.length - regularOnly.length;
			message.success(`Removed ${removedCount} QAQC samples`);

			return regularOnly;
		}
		catch (error) {
			console.error("Error removing QAQC samples:", error);
			message.error(`Failed to remove QAQC samples: ${(error as Error).message}`);
			throw error;
		}
	}, [section.data, updateSectionData, message]);

	/**
	 * Validate sample intervals
	 * Checks for overlaps and gaps
	 */
	const validateSamples = useCallback(() => {
		const currentSamples = Array.isArray(section.data) ? section.data : [];
		const result = validateSampleIntervals(currentSamples);

		if (!result.isValid) {
			const errorMessage = `Validation errors found:\n${result.errors.map(err => `• ${err}`).join("\n")}`;
			message.error({
				content: errorMessage,
				duration: 5,
				style: { whiteSpace: "pre-line" },
			});
		}

		if (result.warnings.length > 0) {
			const warningMessage = `Validation warnings:\n${result.warnings.map(warn => `• ${warn}`).join("\n")}`;
			message.warning({
				content: warningMessage,
				duration: 5,
				style: { whiteSpace: "pre-line" },
			});
		}

		return result;
	}, [section.data, message]);

	/**
	 * Get QAQC statistics from current samples
	 */
	const getStats = useCallback(() => {
		const currentSamples = Array.isArray(section.data) ? section.data : [];
		const rawStats = getQaqcStatistics(currentSamples);
		return {
			...rawStats,
			blanks: rawStats.byType.BLK,
			standards: rawStats.byType.STD,
			duplicates: rawStats.byType.PREPDUP + rawStats.byType.FDUP,
		};
	}, [section.data]);

	return {
		generateSamples,
		insertQaqc,
		renumberByDepth,
		removeQaqc,
		validateSamples,
		getStats,
	};
}
