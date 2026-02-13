/**
 * QAQC Configuration Service
 *
 * API service layer for QAQC configuration management
 * Uses existing apiClient for all database operations
 */

import type {
	AssayElement,
	AssayLab,
	AssayLabElementAlias,
	AssayLabMethod,
	AssayMethodGeneric,
	CreateQcReferenceDto,
	CreateQcReferenceValueDto,
	CreateQcRuleDto,
	CreateQcStatisticalLimitsDto,
	QcFilteredset,
	QcInsertionRule,
	QcInsertionRuleStandardSequence,
	QcReference,
	QcReferenceType,
	QcReferenceValue,
	QcRule,
	QcStatisticalLimits,
	UpdateQcReferenceDto,
	UpdateQcRuleDto,
	UpdateQcStatisticalLimitsDto,
} from "#src/api/database/data-contracts";
import apiClient from "#src/services/apiClient";
import { message } from "antd";

class QaqcConfigService {
	// ============================================================================
	// Module A: Reference Materials (Standards)
	// ============================================================================

	/**
	 * Get all reference materials/standards
	 */
	async getStandards(): Promise<QcReference[]> {
		try {
			const response = await apiClient.qcReferenceControllerFindAll({
				page: 1,
				take: 1000,
			});

			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load standards:", error);
			message.error("Failed to load standards. Please try again.");
			throw error;
		}
	}

	/**
	 * Get detailed information for a specific standard including all element values
	 */
	async getStandardDetail(qcReferenceId: string): Promise<{ standard: QcReference, values: QcReferenceValue[] }> {
		try {
			const standardResponse = await apiClient.qcReferenceControllerFindOne(qcReferenceId);
			const standard = standardResponse.data;

			// Get all reference values for this standard
			const valuesResponse = await apiClient.qcReferenceValueControllerFindAll({
				page: 1,
				take: 1000,
			});

			const allValues = (valuesResponse.data?.data || []) as QcReferenceValue[];
			const values = allValues.filter(v => v.StandardId === standard?.StandardId);

			return { standard: standard!, values };
		}
		catch (error) {
			console.error("Failed to load standard detail:", error);
			message.error("Failed to load standard details. Please try again.");
			throw error;
		}
	}

	/**
	 * Create a new reference material with its element values
	 */
	async createStandard(
		standard: CreateQcReferenceDto,
		values: CreateQcReferenceValueDto[],
	): Promise<QcReference> {
		try {
			// Create the standard first
			const createdResponse = await apiClient.qcReferenceControllerCreate(standard);
			const createdStandard = createdResponse.data;

			// Then create all the reference values
			if (values && values.length > 0) {
				await Promise.all(
					values.map(value =>
						apiClient.qcReferenceValueControllerCreate({
							...value,
							StandardId: createdStandard.StandardId,
						}),
					),
				);
			}

			message.success("Standard created successfully");
			return createdStandard;
		}
		catch (error) {
			console.error("Failed to create standard:", error);
			message.error("Failed to create standard. Please check your data.");
			throw error;
		}
	}

	/**
	 * Update an existing reference material
	 */
	async updateStandard(
		qcReferenceId: string,
		standard: UpdateQcReferenceDto,
		values: CreateQcReferenceValueDto[],
	): Promise<void> {
		try {
			// Update the standard
			await apiClient.qcReferenceControllerUpdate(qcReferenceId, standard);

			// Get existing values
			const existingValuesResponse = await apiClient.qcReferenceValueControllerFindAll({
				page: 1,
				take: 1000,
			});
			const standardData = await apiClient.qcReferenceControllerFindOne(qcReferenceId);
			const allExistingValues = (existingValuesResponse.data?.data || []) as QcReferenceValue[];
			const existingValues = allExistingValues.filter(
				v => v.StandardId === standardData.data?.StandardId,
			);

			// Delete existing values (simple approach - can be optimized)
			await Promise.all(
				existingValues.map(v =>
					apiClient.qcReferenceValueControllerRemove(v.QCReferenceValueId!),
				),
			);

			// Create new values
			await Promise.all(
				values.map(value =>
					apiClient.qcReferenceValueControllerCreate({
						...value,
						StandardId: standardData.data?.StandardId,
					}),
				),
			);

			message.success("Standard updated successfully");
		}
		catch (error) {
			console.error("Failed to update standard:", error);
			message.error("Failed to update standard. Please check your data.");
			throw error;
		}
	}

	/**
	 * Delete a reference material
	 */
	async deleteStandard(qcReferenceId: string): Promise<void> {
		try {
			// Get standard to find StandardId
			const standardData = await apiClient.qcReferenceControllerFindOne(qcReferenceId);

			// First delete all associated values
			const valuesResponse = await apiClient.qcReferenceValueControllerFindAll({
				page: 1,
				take: 1000,
			});
			const allValues = (valuesResponse.data?.data || []) as QcReferenceValue[];
			const values = allValues.filter(
				v => v.StandardId === standardData.data?.StandardId,
			);

			await Promise.all(
				values.map(v => apiClient.qcReferenceValueControllerRemove(v.QCReferenceValueId!)),
			);

			// Then delete the standard
			await apiClient.qcReferenceControllerRemove(qcReferenceId);

			message.success("Standard deleted successfully");
		}
		catch (error) {
			console.error("Failed to delete standard:", error);
			message.error("Failed to delete standard.");
			throw error;
		}
	}

	/**
	 * Upload certificate file for a standard
	 */
	async uploadCertificate(standardId: string, file: File): Promise<string> {
		// TODO: Implement file upload if needed
		console.log("Certificate upload not yet implemented:", standardId, file.name);
		message.warning("Certificate upload feature coming soon");
		return `/certificates/${standardId}/${file.name}`;
	}

	/**
	 * Get standard types for dropdown
	 */
	async getStandardTypes(): Promise<QcReferenceType[]> {
		try {
			const response = await apiClient.qcReferenceTypeControllerFindAll({
				page: 1,
				take: 100,
			});
			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load standard types:", error);
			return [];
		}
	}

	// ============================================================================
	// Module B: Statistical Limits & Rules
	// ============================================================================

	/**
	 * Get all statistical limits (σ thresholds)
	 */
	async getStatisticalLimits(): Promise<QcStatisticalLimits[]> {
		try {
			const response = await apiClient.qcStatisticalLimitsControllerFindAll({
				page: 1,
				take: 1000,
			});

			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load statistical limits:", error);
			message.error("Failed to load statistical limits.");
			throw error;
		}
	}

	/**
	 * Create a statistical limit
	 */
	async createStatisticalLimit(limit: CreateQcStatisticalLimitsDto): Promise<QcStatisticalLimits> {
		try {
			const response = await apiClient.qcStatisticalLimitsControllerCreate(limit);
			message.success("Statistical limit created successfully");
			return response.data;
		}
		catch (error) {
			console.error("Failed to create statistical limit:", error);
			message.error("Failed to create statistical limit.");
			throw error;
		}
	}

	/**
	 * Update statistical limit
	 */
	async updateStatisticalLimit(id: string, limit: UpdateQcStatisticalLimitsDto): Promise<void> {
		try {
			await apiClient.qcStatisticalLimitsControllerUpdate(id, limit);
			message.success("Statistical limit updated successfully");
		}
		catch (error) {
			console.error("Failed to update statistical limit:", error);
			message.error("Failed to update statistical limit.");
			throw error;
		}
	}

	/**
	 * Delete statistical limit
	 */
	async deleteStatisticalLimit(id: string): Promise<void> {
		try {
			await apiClient.qcStatisticalLimitsControllerRemove(id);
			message.success("Statistical limit deleted successfully");
		}
		catch (error) {
			console.error("Failed to delete statistical limit:", error);
			message.error("Failed to delete statistical limit.");
			throw error;
		}
	}

	/**
	 * Get all QC evaluation rules
	 */
	async getQCRules(): Promise<QcRule[]> {
		try {
			const response = await apiClient.qcRuleControllerFindAll({
				page: 1,
				take: 1000,
			});

			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load QC rules:", error);
			message.error("Failed to load QC rules.");
			throw error;
		}
	}

	/**
	 * Create a new QC rule
	 */
	async createQCRule(rule: CreateQcRuleDto): Promise<QcRule> {
		try {
			const response = await apiClient.qcRuleControllerCreate(rule);
			message.success("QC rule created successfully");
			return response.data;
		}
		catch (error) {
			console.error("Failed to create QC rule:", error);
			message.error("Failed to create QC rule.");
			throw error;
		}
	}

	/**
	 * Update an existing QC rule
	 */
	async updateQCRule(id: string, rule: UpdateQcRuleDto): Promise<void> {
		try {
			await apiClient.qcRuleControllerUpdate(id, rule);
			message.success("QC rule updated successfully");
		}
		catch (error) {
			console.error("Failed to update QC rule:", error);
			message.error("Failed to update QC rule.");
			throw error;
		}
	}

	/**
	 * Delete a QC rule
	 */
	async deleteQCRule(id: string): Promise<void> {
		try {
			await apiClient.qcRuleControllerRemove(id);
			message.success("QC rule deleted successfully");
		}
		catch (error) {
			console.error("Failed to delete QC rule:", error);
			message.error("Failed to delete QC rule.");
			throw error;
		}
	}

	// ============================================================================
	// Module C: QC Insertion Patterns
	// ============================================================================

	/**
	 * Get all insertion rules
	 */
	async getInsertionRules(): Promise<QcInsertionRule[]> {
		try {
			const response = await apiClient.qcInsertionRuleControllerFindAll({
				page: 1,
				take: 1000,
			});

			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load insertion rules:", error);
			return [];
		}
	}

	/**
	 * Get detailed information for an insertion rule including sequence
	 */
	async getInsertionRuleDetail(ruleId: string): Promise<{ rule: QcInsertionRule, sequence: QcInsertionRuleStandardSequence[] }> {
		try {
			const ruleResponse = await apiClient.qcInsertionRuleControllerFindOne(ruleId);
			const rule = ruleResponse.data;

			const sequenceResponse = await apiClient.qcInsertionRuleStandardSequenceControllerFindByQcInsertionRuleId(
				ruleId,
			);

			const sequence = sequenceResponse.data || [];

			return { rule, sequence };
		}
		catch (error) {
			console.error("Failed to load insertion rule detail:", error);
			throw error;
		}
	}

	// ============================================================================
	// Module D: Lab & Method Configuration
	// ============================================================================

	/**
	 * Get element aliases for a laboratory
	 */
	async getElementAliases(labCode: string): Promise<AssayLabElementAlias[]> {
		try {
			const response = await apiClient.assayLabElementAliasControllerFindAll({
				page: 1,
				take: 1000,
			});

			const allAliases = (response.data?.data || []) as AssayLabElementAlias[];
			const labAliases = allAliases.filter(
				alias => alias.LabCode === labCode,
			);

			return labAliases;
		}
		catch (error) {
			console.error("Failed to load element aliases:", error);
			message.error("Failed to load element aliases.");
			throw error;
		}
	}

	/**
	 * Create or update an element alias
	 */
	async saveElementAlias(alias: Partial<AssayLabElementAlias>): Promise<void> {
		try {
			await apiClient.assayLabElementAliasControllerCreate(alias);
			message.success("Element alias saved successfully");
		}
		catch (error) {
			console.error("Failed to save element alias:", error);
			message.error("Failed to save element alias.");
			throw error;
		}
	}

	/**
	 * Delete an element alias
	 */
	async deleteElementAlias(aliasId: string): Promise<void> {
		try {
			await apiClient.assayLabElementAliasControllerRemove(aliasId);
			message.success("Element alias deleted successfully");
		}
		catch (error) {
			console.error("Failed to delete element alias:", error);
			message.error("Failed to delete element alias.");
			throw error;
		}
	}

	/**
	 * Get method mappings for a laboratory
	 */
	async getMethodMappings(labCode: string): Promise<AssayLabMethod[]> {
		try {
			const response = await apiClient.assayLabMethodControllerFindAll({
				page: 1,
				take: 1000,
			});

			const allMethods = (response.data?.data || []) as AssayLabMethod[];
			const labMethods = allMethods.filter(
				method => method.LabCode === labCode,
			);

			return labMethods;
		}
		catch (error) {
			console.error("Failed to load method mappings:", error);
			message.error("Failed to load method mappings.");
			throw error;
		}
	}

	/**
	 * Create or update a method mapping
	 */
	async saveMethodMapping(mapping: Partial<AssayLabMethod>): Promise<void> {
		try {
			await apiClient.assayLabMethodControllerCreate(mapping);
			message.success("Method mapping saved successfully");
		}
		catch (error) {
			console.error("Failed to save method mapping:", error);
			message.error("Failed to save method mapping.");
			throw error;
		}
	}

	/**
	 * Delete a method mapping
	 */
	async deleteMethodMapping(methodId: string): Promise<void> {
		try {
			await apiClient.assayLabMethodControllerRemove(methodId);
			message.success("Method mapping deleted successfully");
		}
		catch (error) {
			console.error("Failed to delete method mapping:", error);
			message.error("Failed to delete method mapping.");
			throw error;
		}
	}

	/**
	 * Get detection limits for a laboratory (uses QcFilteredset)
	 */
	async getDetectionLimits(labCode: string): Promise<QcFilteredset[]> {
		try {
			const response = await apiClient.qcFilteredsetControllerFindAll({
				page: 1,
				take: 1000,
			});

			const allLimits = (response.data?.data || []) as QcFilteredset[];
			// Filter by FilterType to get detection limits only
			const limits = allLimits.filter(
				limit => limit.FilterType === "DETECTION_LIMIT",
			);

			return limits;
		}
		catch (error) {
			console.error("Failed to load detection limits:", error);
			message.error("Failed to load detection limits.");
			throw error;
		}
	}

	/**
	 * Create or update a detection limit
	 */
	async saveDetectionLimit(limit: Partial<QcFilteredset>): Promise<void> {
		try {
			await apiClient.qcFilteredsetControllerCreate(limit);
			message.success("Detection limit saved successfully");
		}
		catch (error) {
			console.error("Failed to save detection limit:", error);
			message.error("Failed to save detection limit.");
			throw error;
		}
	}

	/**
	 * Delete a detection limit
	 */
	async deleteDetectionLimit(limitId: string): Promise<void> {
		try {
			await apiClient.qcFilteredsetControllerRemove(limitId);
			message.success("Detection limit deleted successfully");
		}
		catch (error) {
			console.error("Failed to delete detection limit:", error);
			message.error("Failed to delete detection limit.");
			throw error;
		}
	}

	// ============================================================================
	// Lookup Data
	// ============================================================================

	/**
	 * Get all elements for dropdowns
	 */
	async getElements(): Promise<AssayElement[]> {
		try {
			const response = await apiClient.assayElementControllerFindAll({
				page: 1,
				take: 1000,
			});
			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load elements:", error);
			return [];
		}
	}

	/**
	 * Get all generic methods for dropdowns
	 */
	async getGenericMethods(): Promise<AssayMethodGeneric[]> {
		try {
			const response = await apiClient.assayMethodGenericControllerFindAll({
				page: 1,
				take: 1000,
			});
			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load generic methods:", error);
			return [];
		}
	}

	/**
	 * Get all laboratories for dropdowns
	 */
	async getLaboratories(): Promise<AssayLab[]> {
		try {
			const response = await apiClient.assayLabControllerFindAll({
				page: 1,
				take: 1000,
			});
			return response.data?.data || [];
		}
		catch (error) {
			console.error("Failed to load laboratories:", error);
			return [];
		}
	}
}

export const qaqcConfigService = new QaqcConfigService();
