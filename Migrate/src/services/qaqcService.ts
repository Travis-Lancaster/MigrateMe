/**
 * QAQC Service
 *
 * Service layer for QAQC API calls
 * Connects to backend stored procedures for quality control data
 */

import type {
	SpGetGlobalChartsRequestDto,
	SpGetGlobalChartsResponseDto,
	SpGetGradeRange,
	SpGlobalDashboardRequestDto,
	TimeSeriesDataDto,
} from "#src/api/database/data-contracts.js";

import type {
	GetChartDataRequest,
	GetHoleStatusRequest,
	GetHoleValidationRequest,
	QaqcChartData,
	QaqcFailure,
	QaqcFilterSet,
	QaqcHoleStatus,
	QaqcHoleValidation,
	ReassayRequest,
} from "#src/types/qaqc";

import apiClient from "#src/services/apiClient.js";

class QaqcService {
	/**
	 * Get simple drill hole QAQC status for traffic light display
	 * Uses sp_GetHoleValidation stored procedure
	 */
	async getHoleStatus(request: GetHoleStatusRequest): Promise<QaqcHoleStatus> {
		// Use raw endpoint to get all results without pagination
		const response = await apiClient.spGetHoleValidationControllerFindAllRaw();
		const validationData = response.data || [];

		// Filter by hole ID if provided (backend should filter, but we ensure it here)
		const holeData = validationData.filter(batch =>
			request.collarId ? batch.BatchNo?.startsWith(request.collarId) : true,
		);

		if (holeData.length === 0) {
			return {
				status: "NO_DATA",
				details: "No QC data available for this drill hole",
				failedBatchCount: 0,
				totalBatchCount: 0,
				latestBatchDate: null,
				totalQCSamples: 0,
				totalFailedQC: 0,
			};
		}

		// Aggregate status across all batches
		const totalBatches = holeData.length;
		const failedBatches = holeData.filter(batch =>
			batch.BatchStatus === "FAIL" || (batch.FailureRate_Pct && batch.FailureRate_Pct > 10),
		).length;
		const pendingBatches = holeData.filter(batch => batch.BatchStatus === "PENDING").length;

		// Calculate additional metrics
		const totalQCSamples = holeData.reduce((sum, batch) => sum + (batch.TotalQCSamples || 0), 0);
		const totalFailedQC = holeData.reduce((sum, batch) => sum + (batch.FailCount || 0), 0);
		const latestBatch = holeData.reduce((latest, batch) => {
			if (!batch.LabFinalDt)
				return latest;
			if (!latest || new Date(batch.LabFinalDt) > new Date(latest)) {
				return batch.LabFinalDt;
			}
			return latest;
		}, null as string | null);

		let status: QaqcHoleStatus["status"];
		let details: string;

		if (pendingBatches > 0) {
			status = "PENDING";
			details = `${pendingBatches} batch(es) pending QC validation`;
		}
		else if (failedBatches > 0) {
			status = "FAIL";
			details = `${failedBatches} of ${totalBatches} batches failed QC`;
		}
		else if (totalBatches > 0) {
			status = "PASS";
			details = `All ${totalBatches} batches passed QC`;
		}
		else {
			status = "NO_QC";
			details = "No QC samples in batches";
		}

		return {
			status,
			details,
			failedBatchCount: failedBatches,
			totalBatchCount: totalBatches,
			latestBatchDate: latestBatch,
			totalQCSamples,
			totalFailedQC,
		};
	}

	/**
	 * Get detailed batch validation for drill hole
	 * Uses sp_GetHoleValidation_Enhanced stored procedure
	 */
	async getHoleValidation(request: GetHoleValidationRequest): Promise<QaqcHoleValidation> {
		// Use enhanced version with raw endpoint for complete data
		const response = await apiClient.spGetHoleValidationEnhancedControllerFindAllRaw();
		const enhancedData = response.data || [];

		// Filter by hole ID if provided
		const holeData = enhancedData.filter(batch =>
			request.collarId ? batch.BatchNo.startsWith(request.collarId) : true,
		);

		// Transform enhanced data to batch summary format
		const batches = holeData.map((batch) => {
			// Map PENDING to WARN for BatchStatus (PENDING not in BatchStatus type)
			let batchStatus: "PASS" | "FAIL" | "WARN" = "PASS";
			const status = batch.ElementMethodQCStatus?.toUpperCase();
			if (status === "FAIL")
				batchStatus = "FAIL";
			else if (status === "WARN" || status === "PENDING")
				batchStatus = "WARN";

			return {
				batchNo: batch.BatchNo,
				labCode: batch.LabCode,
				labFinalDt: batch.BatchDate || new Date().toISOString(),
				totalQCSamples: batch.TotalQC || 0,
				passCount: batch.PassCount || 0,
				failCount: batch.FailCount || 0,
				warnCount: batch.WarnCount || 0,
				failureRate_Pct: batch.FailureRate_Pct || 0,
				batchStatus,
			};
		});

		// Transform to failed samples detail format (simplified for now)
		const details = holeData
			.filter(batch => (batch.FailCount || 0) > 0)
			.map(batch => ({
				batchNo: batch.BatchNo,
				sampleId: `${batch.BatchNo}-QC`,
				sampleNm: `${batch.BatchNo}-QC-Sample`,
				element: batch.Element || "Unknown",
				labCode: batch.LabCode,
				qcType: "STD" as const, // QCType uses 'STD' not 'STANDARD'
				standardId: batch.Element || "Unknown",
				result: 0, // Would need actual result from backend
				expectedValue: null,
				expectedStDev: null,
				zScore: batch.AvgZScore || 0,
				sampledDt: batch.BatchDate || new Date().toISOString(),
				detectionLimit: null,
				qcStatus: "FAIL" as const,
			}));

		return {
			batches,
			details,
		};
	}

	/**
	 * Get chart datasets for global dashboard
	 * Uses sp_GetGlobalCharts and sp_GlobalDashboard stored procedures
	 */
	async getChartData(request: GetChartDataRequest): Promise<QaqcChartData> {
		// Get chart data from sp_GetGlobalCharts
		// Note: API expects camelCase property names (startDate, endDate, etc.)
		const startDate = request.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
		const endDate = request.endDate || new Date().toISOString();

		const chartsRequest: SpGetGlobalChartsRequestDto = {
			startDate, // Required - ISO 8601 date string
			endDate, // Required - ISO 8601 date string
			standardId: request.standardId, // Optional - Standard ID filter
			element: request.element || "Au", // Optional - Element (defaults to Au)
			labCode: request.labCode, // Optional - Lab code filter
		};

		const chartsResponse = await apiClient.spGetGlobalChartsControllerExecute(chartsRequest);
		const chartsData: SpGetGlobalChartsResponseDto = chartsResponse.data;

		// Get dashboard aggregates from sp_GlobalDashboard for bias trends
		// Build request DTO with date range (uses dateFrom/dateTo property names)
		const dashboardRequest: SpGlobalDashboardRequestDto = {
			dateFrom: request.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
			dateTo: request.endDate || new Date().toISOString(),
			labCode: request.labCode,
			element: request.element,
			aggregationLevel: "MONTHLY", // Use monthly aggregation for bias trends
		};

		const dashboardResponse = await apiClient.spGlobalDashboardControllerExecute(dashboardRequest);
		const dashboardData = dashboardResponse.data?.timeSeriesData || [];

		// Access nested arrays from structured response
		// Note: SP already filters by date range, element, and lab code, so no additional filtering needed
		const shewhartRaw = chartsData.shewhartChartData || [];
		const duplicateRaw = chartsData.duplicateCorrelationData || [];
		const biasRaw = chartsData.biasTrendData || [];

		// Helper function to calculate standard deviation from control limits
		const calculateStdDev = (upperLimit?: number, lowerLimit?: number, expected?: number): number => {
			if (!upperLimit || !lowerLimit || !expected)
				return 0;
			// Control limits are typically ±3σ from expected value
			return (upperLimit - expected) / 3;
		};

		// Helper function to parse control status
		const parseControlStatus = (status?: string): "PASS" | "WARN" | "FAIL" => {
			if (!status)
				return "PASS";
			const normalized = status.toLowerCase();
			if (normalized.includes("out") || normalized.includes("fail"))
				return "FAIL";
			if (normalized.includes("warn"))
				return "WARN";
			return "PASS";
		};

		// Helper function to categorize grade
		const categorizeGrade = (avgGrade: number): "Low Grade" | "Medium Grade" | "High Grade" => {
			if (avgGrade > 1)
				return "High Grade";
			if (avgGrade <= 0.1)
				return "Low Grade";
			return "Medium Grade";
		};

		// Transform Shewhart control chart data
		const shewhart = shewhartRaw.map((point) => {
			const expectedStDev = calculateStdDev(
				point.upperControlLimit,
				point.lowerControlLimit,
				point.expectedValue,
			);
			const measuredValue = point.measuredValue || 0;
			const expectedValue = point.expectedValue || 0;
			const zScore = expectedStDev > 0
				? (measuredValue - expectedValue) / expectedStDev
				: 0;

			return {
				sampledDt: point.sampleDate || new Date().toISOString(),
				standardId: point.standardId || "",
				sampleId: point.standardId || "",
				labCode: point.labCode || "Unknown",
				batchNo: point.batchNumber || "",
				element: point.element || request.element || "Au",
				result: measuredValue,
				expectedValue,
				expectedStDev,
				zScore,
				upper3SD: point.upperControlLimit || 0,
				upper2SD: point.upperWarningLimit || 0,
				lower2SD: point.lowerWarningLimit || 0,
				lower3SD: point.lowerControlLimit || 0,
				qcStatus: parseControlStatus(point.controlStatus),
				isFailure: parseControlStatus(point.controlStatus) === "FAIL",
				isWarning: parseControlStatus(point.controlStatus) === "WARN",
			};
		});

		// Transform duplicate correlation scatter plot data
		const scatter = duplicateRaw.map((point) => {
			const avgGrade = point.averageValue || 0;
			const rpd = point.relativeDifference || 0;

			return {
				sampledDt: point.sampleDate || new Date().toISOString(),
				duplicateType: "FDUP" as const,
				element: point.element || request.element || "Au",
				labCode: point.labCode || "Unknown",
				batchNo: point.sampleId || "",
				originalValue: point.originalValue || 0,
				duplicateValue: point.duplicateValue || 0,
				absDifference: point.absoluteDifference || 0,
				avgGrade,
				gradeCategory: categorizeGrade(avgGrade),
				rpd,
				isHighRPD: rpd > 20,
			};
		});

		// Helper function to parse year-month string
		const parseYearMonth = (yearMonth?: string): { year: number, month: number } => {
			const now = new Date();
			if (!yearMonth)
				return { year: now.getFullYear(), month: now.getMonth() + 1 };

			const match = yearMonth.match(/(\d{4})-(\d{2})/);
			if (match) {
				return { year: Number.parseInt(match[1], 10), month: Number.parseInt(match[2], 10) };
			}
			return { year: now.getFullYear(), month: now.getMonth() + 1 };
		};

		// Helper function to categorize bias
		const categorizeBias = (avgZScore: number): "High Bias" | "Low Bias" | "No Bias" | "Slight Bias" => {
			const absZScore = Math.abs(avgZScore);
			if (absZScore > 2)
				return "High Bias";
			if (absZScore > 1)
				return "Slight Bias";
			if (absZScore > 0.5)
				return "Low Bias";
			return "No Bias";
		};

		// Transform bias trend data from both sources
		const biasFromCharts = biasRaw.map((point) => {
			const parsed = parseYearMonth(point.yearMonth);
			// Note: averageBias from API might need conversion to Z-score if they differ
			// For now, treating them as equivalent
			const avgZScore = point.averageBias || 0;

			return {
				year: parsed.year,
				month: parsed.month,
				yearMonth: point.yearMonth || "",
				monthStart: new Date(parsed.year, parsed.month - 1, 1).toISOString(),
				labCode: point.labCode || "Unknown",
				element: point.element || request.element || "Au",
				standardCount: point.sampleCount || 0,
				avgZScore,
				stDevZScore: point.standardDeviation || 0,
				failureRate_Pct: 0, // Not available from charts data
				biasCategory: categorizeBias(avgZScore),
				hasSignificantBias: Math.abs(avgZScore) > 2,
			};
		});

		// Transform dashboard data to bias trends (as before)
		const biasFromDashboard = dashboardData
			.filter((row: TimeSeriesDataDto) => {
				if (request.element && row.element !== request.element)
					return false;
				if (request.labCode && row.labCode !== request.labCode)
					return false;
				return true;
			})
			.map((row: TimeSeriesDataDto) => {
				const parsed = parseYearMonth(row.period);
				const avgZScore = row.avgZScore || 0;

				return {
					year: parsed.year,
					month: parsed.month,
					yearMonth: `${parsed.year}-${String(parsed.month).padStart(2, "0")}`,
					monthStart: new Date(parsed.year, parsed.month - 1, 1).toISOString(),
					labCode: row.labCode || "Unknown",
					element: row.element || request.element || "Au",
					standardCount: row.totalSamples || 0,
					avgZScore,
					stDevZScore: row.stDevZScore || 0,
					failureRate_Pct: row.failureRate_Pct || 0,
					biasCategory: categorizeBias(avgZScore),
					hasSignificantBias: Math.abs(avgZScore) > 2,
				};
			});

		// Combine bias data from both sources, preferring dashboard data (has failureRate)
		const bias = biasFromDashboard.length > 0 ? biasFromDashboard : biasFromCharts;

		return {
			shewhart,
			scatter,
			bias,
		};
	}

	/**
	 * Get active QC failures for failure log
	 * Uses sp_GlobalDashboard with filters
	 */
	async getActiveFailures(element?: string, labCode?: string): Promise<QaqcFailure[]> {
		// Build request DTO for last 90 days
		const dashboardRequest: SpGlobalDashboardRequestDto = {
			dateFrom: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
			dateTo: new Date().toISOString(),
			labCode,
			element,
			aggregationLevel: "BATCH", // Use batch-level aggregation for failure tracking
		};

		const response = await apiClient.spGlobalDashboardControllerExecute(dashboardRequest);
		const dashboardData = response.data?.timeSeriesData || [];

		// Filter failures (high failure rate)
		const failures = dashboardData
			.filter((row: TimeSeriesDataDto) => {
				if (element && row.element !== element)
					return false;
				if (labCode && row.labCode !== labCode)
					return false;
				return (row.failureRate_Pct || 0) > 5; // Consider >5% as active failure
			})
			.map((row: TimeSeriesDataDto) => ({
				id: `${row.labCode}-${row.element}-${row.period}`,
				batchNo: row.period || "Unknown",
				labCode: row.labCode || "Unknown",
				element: row.element || "Unknown",
				qcType: row.qcType as "STANDARD" | "BLANK" | "DUPLICATE",
				failCount: row.failCount || 0,
				totalSamples: row.totalSamples || 0,
				failureRate: row.failureRate_Pct || 0,
				detectedDate: new Date().toISOString(), // Would come from Period if available
				status: "ACTIVE" as const,
				assignedTo: undefined,
				comments: undefined,
				failedStandards: [], // Would need to be populated from detailed query
				failedSamples: [], // Would need to be populated from detailed query
			}));

		return failures;
	}

	/**
	 * Get grade range classifications for an element
	 * Uses sp_GetGradeRange stored procedure
	 */
	async getGradeRanges(element: string, labCode?: string): Promise<SpGetGradeRange[]> {
		const response = await apiClient.spGetGradeRangeControllerGetActiveRanges(
			element,
			labCode ? { labCode } : undefined,
		);

		return response.data || [];
	}

	/**
	 * Classify a grade value into its range
	 * Uses sp_GetGradeRange stored procedure
	 */
	async classifyGrade(element: string, value: number, labCode?: string): Promise<SpGetGradeRange | null> {
		try {
			const response = await apiClient.spGetGradeRangeControllerClassifyGrade(
				element,
				value,
				labCode ? { labCode } : undefined,
			);

			return response.data || null;
		}
		catch (error) {
			console.error("Error classifying grade:", error);
			return null;
		}
	}

	/**
	 * Save filter set configuration
	 * TODO: Implement backend endpoint for filter set persistence
	 */
	async saveFilterSet(filterSet: Omit<QaqcFilterSet, "id" | "createdDate">): Promise<QaqcFilterSet> {
		// For now, use local storage until backend endpoint is implemented
		const id = crypto.randomUUID();
		const savedFilterSet: QaqcFilterSet = {
			...filterSet,
			id,
			createdDate: new Date().toISOString(),
		};

		const existingSets = this.getStoredFilterSets();
		existingSets.push(savedFilterSet);
		localStorage.setItem("qaqc_filter_sets", JSON.stringify(existingSets));

		return savedFilterSet;
	}

	/**
	 * Get saved filter sets for organization
	 * TODO: Implement backend endpoint for filter set retrieval
	 */
	async getFilterSets(organization: string): Promise<QaqcFilterSet[]> {
		// For now, use local storage until backend endpoint is implemented
		const allSets = this.getStoredFilterSets();
		return allSets.filter(set => set.organization === organization);
	}

	/**
	 * Delete a filter set
	 * TODO: Implement backend endpoint for filter set deletion
	 */
	async deleteFilterSet(id: string): Promise<void> {
		const existingSets = this.getStoredFilterSets();
		const filteredSets = existingSets.filter(set => set.id !== id);
		localStorage.setItem("qaqc_filter_sets", JSON.stringify(filteredSets));
	}

	/**
	 * Helper method to get filter sets from local storage
	 */
	private getStoredFilterSets(): QaqcFilterSet[] {
		try {
			const stored = localStorage.getItem("qaqc_filter_sets");
			return stored ? JSON.parse(stored) : [];
		}
		catch (error) {
			console.error("Error reading filter sets from storage:", error);
			return [];
		}
	}

	/**
	 * Create re-assay request
	 * TODO: Implement backend endpoint for re-assay workflow
	 */
	async createReassayRequest(request: ReassayRequest): Promise<{ requestId: string }> {
		// Placeholder implementation until backend endpoint is available
		console.log("Re-assay request created:", request);

		return {
			requestId: crypto.randomUUID(),
		};
	}

	/**
	 * Sign-off a failure with comments
	 * TODO: Implement backend endpoint for sign-off workflow
	 */
	async signOffFailure(
		batchNo: string,
		labCode: string,
		comments: string,
		signedBy: string,
	): Promise<void> {
		// Placeholder implementation until backend endpoint is available
		console.log("Failure signed off:", { batchNo, labCode, comments, signedBy });
	}
}

export const qaqcService = new QaqcService();
