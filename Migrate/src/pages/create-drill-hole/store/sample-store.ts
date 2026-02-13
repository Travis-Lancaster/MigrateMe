/**
 * Sample Store - QAQC Rule Management Only
 *
 * This store manages QAQC insertion rules and standard sequences.
 * Sample data itself is managed through the DrillHole aggregate store.
 *
 * Pattern: Minimal focused store for QAQC configuration
 */

import type { QaqcInsertionRule, StandardSequenceEntry } from "../validation/sample-schemas";
import apiClient from "#src/services/apiClient";
import { create } from "zustand";

/**
 * QAQC Rule Store State
 */
interface QaqcRuleStore {
	/** Currently loaded QAQC insertion rule */
	qcInsertionRule: QaqcInsertionRule | null

	/** Fetch a specific QAQC insertion rule by ID */
	fetchQCInsertionRule: (qcInsertionRuleId: string) => Promise<void>

	/** Fetch all QAQC insertion rules for an organization */
	fetchAllQCInsertionRules: (organization: string) => Promise<QaqcInsertionRule[]>

	/** Save or update a QAQC insertion rule */
	saveQCInsertionRule: (rule: QaqcInsertionRule) => Promise<void>

	/** Set the current QAQC rule without saving to API */
	setQCInsertionRule: (rule: QaqcInsertionRule | null) => void

	/** Clear the current QAQC rule */
	clearQCInsertionRule: () => void

	/** Save standard sequence for a QAQC rule */
	saveStandardSequence: (ruleId: string, sequence: StandardSequenceEntry[]) => Promise<void>

	/** Load standard sequence for a QAQC rule */
	loadStandardSequence: (ruleId: string) => Promise<StandardSequenceEntry[]>
}

/**
 * QAQC Rule Store
 *
 * Manages QAQC insertion rules independently of sample data.
 * Sample data is managed through the DrillHole aggregate store.
 */
export const useSampleStore = create<QaqcRuleStore>((set, get) => ({
	qcInsertionRule: null,

	/**
	 * Fetch QAQC insertion rule for a specific rule ID
	 */
	fetchQCInsertionRule: async (qcInsertionRuleId: string) => {
		console.log(`[SampleStore] fetchQCInsertionRule for: ${qcInsertionRuleId}`);
		try {
			const response = await apiClient.qcInsertionRuleControllerFindOne(qcInsertionRuleId);

			// Get the rule from the response
			const apiRule: any = response.data;
			const sortedSequences = (apiRule.qcInsertionRuleStandardSequences as StandardSequenceEntry[] || [])
				.slice() // Create a shallow copy to avoid mutating the original
				.sort((a, b) => (a.SortOrder ?? 0) - (b.SortOrder ?? 0));

			// Transform API type to local type
			const { qcInsertionRuleStandardSequences, ...ruleWithoutSequences } = apiRule;
			const qaqcInsertionRule: QaqcInsertionRule = {
				...ruleWithoutSequences,
				StandardSequence: sortedSequences,
			};

			set({
				qcInsertionRule: qaqcInsertionRule,
			});
		}
		catch (error) {
			// If rule doesn't exist, that's okay - user will create one
			console.log(`[SampleStore] No QAQC rule found for: ${qcInsertionRuleId}`);
			set({
				qcInsertionRule: null,
			});
		}
	},

	/**
	 * Fetch all QAQC insertion rules for an organization with their standard sequences
	 */
	fetchAllQCInsertionRules: async (organization: string): Promise<QaqcInsertionRule[]> => {
		console.log(`[SampleStore] fetchAllQCInsertionRules for organization: ${organization}`);
		try {
			const response = await apiClient.qcInsertionRuleControllerFindAll({
				filters: JSON.stringify([{ field: "Organization", operator: "=", value: organization }]),
			});

			// API returns PageDto, so extract the data array
			const pageDto = response as any;
			const rules = pageDto?.data?.data || [];

			// Load standard sequences for each rule
			if (Array.isArray(rules)) {
				const rulesWithSequences = await Promise.all(
					rules.map(async (rule: any) => {
						if (rule.QCInsertionRuleId) {
							try {
								const sequence = await get().loadStandardSequence(rule.QCInsertionRuleId);
								return { ...rule, StandardSequence: sequence };
							}
							catch (error) {
								console.warn(`[SampleStore] Failed to load sequence for rule ${rule.QCInsertionRuleId}`, error);
								return { ...rule, StandardSequence: [] };
							}
						}
						return { ...rule, StandardSequence: [] };
					}),
				);
				return rulesWithSequences;
			}

			return [];
		}
		catch (error) {
			console.warn("[SampleStore] No QAQC rules found for organization:", organization, error);
			return [];
		}
	},

	/**
	 * Save QAQC insertion rule with standard sequence
	 */
	saveQCInsertionRule: async (rule: QaqcInsertionRule) => {
		console.log("[SampleStore] saveQCInsertionRule", rule);

		try {
			let response;
			if (rule.QCInsertionRuleId) {
				// Update existing rule
				response = await apiClient.qaqcInsertionRulesControllerUpdate(
					rule.QCInsertionRuleId,
					rule as any,
				);
			}
			else {
				// Create new rule
				response = await apiClient.qaqcInsertionRulesControllerCreate(rule as any);
			}

			const savedRule = response.data as any;

			// Save standard sequence if provided
			if (rule.StandardSequence && rule.StandardSequence.length > 0 && savedRule.QCInsertionRuleId) {
				// Convert to required format
				const standardSequence = rule.StandardSequence.map((seq, idx) => ({
					StandardId: seq.StandardId,
					SortOrder: seq.SortOrder ?? idx + 1,
					IsRepeatStart: seq.IsRepeatStart ?? false,
				}));
				await get().saveStandardSequence(savedRule.QCInsertionRuleId, standardSequence);
			}

			set({
				qcInsertionRule: savedRule,
			});

			console.log("[SampleStore] QAQC rule saved successfully");
		}
		catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Failed to save QAQC rule";
			console.error("[SampleStore] Error saving QAQC rule:", errorMessage);
			throw error;
		}
	},

	/**
	 * Set QAQC rule without saving to API
	 */
	setQCInsertionRule: (rule: QaqcInsertionRule | null) => {
		set({ qcInsertionRule: rule });
	},

	/**
	 * Clear QAQC rule
	 */
	clearQCInsertionRule: () => {
		set({ qcInsertionRule: null });
	},

	/**
	 * Save standard sequence for a QAQC rule using the replace endpoint
	 */
	saveStandardSequence: async (ruleId: string, sequence: StandardSequenceEntry[]) => {
		console.log(`[SampleStore] saveStandardSequence for rule: ${ruleId}`, sequence);

		try {
			// Use the replace-for-rule endpoint to atomically replace all sequences
			// Map sequence entries to the format expected by the API
			const sequenceData = sequence.map((entry, index) => ({
				QCInsertionRuleId: ruleId,
				StandardId: entry.StandardId,
				SortOrder: index + 1,
				IsRepeatStart: entry.IsRepeatStart || false,
			}));

			await apiClient.qcInsertionRuleStandardSequenceControllerReplaceForQcInsertionRule(
				ruleId,
				sequenceData as any,
			);

			console.log("[SampleStore] Standard sequence saved successfully");
		}
		catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : "Failed to save standard sequence";
			console.error("[SampleStore] Error saving standard sequence:", errorMessage, error);
			throw error;
		}
	},

	/**
	 * Load standard sequence for a QAQC rule using the dedicated endpoint
	 */
	loadStandardSequence: async (ruleId: string): Promise<StandardSequenceEntry[]> => {
		console.log(`[SampleStore] loadStandardSequence for rule: ${ruleId}`);

		try {
			const response = await apiClient.qcInsertionRuleStandardSequenceControllerFindByQcInsertionRuleId(ruleId);

			// API returns array directly, not wrapped in PageDto
			const sequence = response.data || [];

			// Sort by SortOrder
			if (Array.isArray(sequence)) {
				return sequence.sort((a: any, b: any) => (a.SortOrder || 0) - (b.SortOrder || 0));
			}

			return [];
		}
		catch (error) {
			console.warn("[SampleStore] No standard sequence found for rule:", ruleId, error);
			return [];
		}
	},
}));
