/**
 * Section Mappers
 *
 * Transforms API response data (UiDrillHole) into store section data.
 * Eliminates repetitive mapping code in loadDrillHole function.
 *
 * This module applies the DRY principle by centralizing all section mapping logic
 * into configuration-driven functions instead of repeating if-statements.
 */

import type { UiDrillHole } from "#src/api/database/data-contracts.js";
import type { Draft } from "immer";
import type { DrillHoleState } from "./drillhole-store";
import { convertApiRowStatus, RowStatus, SectionKey } from "#src/types/drillhole";
import { createEmptySurveyWithLogs } from "../validation/survey-schemas";

/**
 * Section mapping configuration
 * Defines how each API field maps to a store section
 */
export interface SectionMapping {
	/** Store section key */
	sectionKey: SectionKey
	/** Field name in UiDrillHole API response */
	apiDataField: keyof UiDrillHole
	/** Field name for row status in API response */
	apiRowStatusField?: keyof UiDrillHole
	/** Optional transform function for data */
	transform?: (apiData: any, drillHoleData?: UiDrillHole) => any
	/** Default data if API field is empty */
	defaultData?: any
}

/**
 * All section mappings
 * Add new mappings here when adding sections
 *
 * This configuration replaces 80+ lines of repetitive if-statements
 * with a single declarative configuration.
 *
 * NOTE: LabDispatch API integration requires backend support.
 * The API contract (UiDrillHole) needs to include:
 *   - LabDispatch?: LabDispatchBase[]
 *   - LabDispatchRowStatus: number
 */
export const SECTION_MAPPINGS: SectionMapping[] = [
	{
		sectionKey: SectionKey.DrillPlan,
		apiDataField: "DrillPlan",
		apiRowStatusField: "DrillPlanStatus",
		defaultData: {},
	},
	{
		sectionKey: SectionKey.Collar,
		apiDataField: "Collar",
		apiRowStatusField: "CollarRowStatus",
		defaultData: {},
	},
	{
		sectionKey: SectionKey.CollarCoordinates,
		apiDataField: "CollarCoordinate",
		defaultData: {},
	},
	{
		sectionKey: SectionKey.RigSheet,
		apiDataField: "RigSetup",
		apiRowStatusField: "RigSetupRowStatus",
		defaultData: {},
	},
	{
		sectionKey: SectionKey.DrillMethod,
		apiDataField: "DrillMethod",
		defaultData: [],
		transform: data => Array.isArray(data) ? data.map(item => ({ ...item })) : [],
	},
	{
		sectionKey: SectionKey.Survey,
		apiDataField: "Survey",
		apiRowStatusField: "SurveyRowStatus",
		defaultData: createEmptySurveyWithLogs(),
		transform: (data, drillHoleData) => {
			// Transform API data to master-detail structure
			// API provides: Survey (header) and SurveyLog (detail array)
			// Store expects: { header: SurveyData, logs: SurveyLogData[] }

			if (!data) {
				return createEmptySurveyWithLogs();
			}

			// Survey header (single object)
			const header = data;

			// SurveyLog detail array (from separate API field)
			const logs = drillHoleData?.SurveyLog || [];

			return {
				header: { ...header },
				logs: Array.isArray(logs) ? logs.map(log => ({ ...log })) : [],
			};
		},
	},
	{
		sectionKey: SectionKey.QuickLog,
		apiDataField: "GeologyCombinedLog",
		defaultData: {},
	},
	{
		sectionKey: SectionKey.GeoCombinedLog,
		apiDataField: "GeologyCombinedLog",
		apiRowStatusField: "GeologyCombinedLogRowStatus",
		defaultData: [],
		transform: data => Array.isArray(data) ? data.map(item => ({ ...item })) : [],
	},
	{
		sectionKey: SectionKey.Sample,
		apiDataField: "Sample",
		apiRowStatusField: "SampleRowStatus",
		defaultData: [],
		transform: data => Array.isArray(data) ? data.map(item => ({ ...item })) : [],
	},
	{
		sectionKey: SectionKey.Dispatch,
		apiDataField: "LabDispatch" as keyof UiDrillHole,
		apiRowStatusField: "LabDispatchRowStatus" as keyof UiDrillHole,
		defaultData: [],
		transform: (data) => {
			// LabDispatch is an array of dispatch records
			// Each dispatch contains nested samples array
			if (!data || !Array.isArray(data)) {
				return [];
			}

			// Transform each dispatch record
			return data.map((dispatch: any) => ({
				...dispatch,
				// Ensure dates are in ISO format
				DispatchedDt: dispatch.DispatchedDt
					? new Date(dispatch.DispatchedDt).toISOString().split("T")[0]
					: undefined,
				ShippedDt: dispatch.ShippedDt
					? new Date(dispatch.ShippedDt).toISOString().split("T")[0]
					: undefined,
				ExpectedDeliveryDt: dispatch.ExpectedDeliveryDt
					? new Date(dispatch.ExpectedDeliveryDt).toISOString().split("T")[0]
					: undefined,
				// Handle nested samples array
				samples: dispatch.samples || dispatch.SampleDispatch || [],
			}));
		},
	},
];

/**
 * Maps a single API field to a store section
 *
 * @param state - Immer draft state
 * @param drillHoleData - API response data
 * @param mapping - Section mapping configuration
 *
 * @example
 * ```typescript
 * mapApiDataToSection(state, drillHoleData, SECTION_MAPPINGS[0]);
 * ```
 */
export function mapApiDataToSection(
	state: Draft<DrillHoleState>,
	drillHoleData: UiDrillHole,
	mapping: SectionMapping,
): void {
	const section = state.sections[mapping.sectionKey];
	if (!section) {
		console.warn("⚠️ [MAPPER] Section not found in store", { sectionKey: mapping.sectionKey });
		return;
	}

	// Get API data
	let apiData = drillHoleData[mapping.apiDataField];

	// Apply transform if provided (pass drillHoleData for cross-field access)
	if (mapping.transform) {
		apiData = mapping.transform(apiData, drillHoleData);
	}

	// Use default if no data
	if (!apiData) {
		apiData = mapping.defaultData;
	}

	// Map to section
	if (apiData) {
		// Create new object to trigger re-renders
		section.data = (Array.isArray(apiData) ? [...apiData] : { ...(apiData as object) }) as any;

		// Set row status if available
		if (mapping.apiRowStatusField) {
			const apiRowStatus = drillHoleData[mapping.apiRowStatusField];
			section.rowStatus = convertApiRowStatus(apiRowStatus as number);
		}
		else {
			section.rowStatus = RowStatus.Draft;
		}

		// Mark as clean (fresh from API)
		section.isDirty = false;

		console.log("📝 [MAPPER] Mapped section from API", {
			sectionKey: mapping.sectionKey,
			hasData: !!apiData,
			isArray: Array.isArray(apiData),
			dataLength: Array.isArray(apiData) ? apiData.length : "N/A",
			sectionDataIsArray: Array.isArray(section.data),
			sectionDataKeys: Array.isArray(section.data) ? "is array" : Object.keys(section.data).slice(0, 5),
		});
	}
}

/**
 * Maps all API data to store sections
 *
 * This is the main function called by loadDrillHole.
 * It replaces 80+ lines of repetitive if-statements with a single loop.
 *
 * @param state - Immer draft state
 * @param drillHoleData - Complete API response
 *
 * @example
 * ```typescript
 * set(state => {
 *   state.drillPlanId = drillPlanId;
 *   mapAllSections(state, drillHoleData);
 *   state.isLoaded = true;
 * });
 * ```
 */
export function mapAllSections(
	state: Draft<DrillHoleState>,
	drillHoleData: UiDrillHole,
): void {
	console.log("📊 [MAPPER] Mapping all sections from API data", {
		sectionsCount: SECTION_MAPPINGS.length,
	});

	// Set drill hole metadata
	state.drillHoleId = drillHoleData.DrillHoleId;
	state.HoleNm = drillHoleData.HoleNm;
	state.PlannedHoleNm = drillHoleData.PlannedHoleNm;
	state.ProposedHoleNm = drillHoleData.ProposedHoleNm;
	state.OtherHoleNm = drillHoleData.OtherHoleNm;
	state.Organization = drillHoleData.Organization;

	// Map all sections using configuration
	for (const mapping of SECTION_MAPPINGS) {
		try {
			mapApiDataToSection(state, drillHoleData, mapping);
		}
		catch (error) {
			console.error("❌ [MAPPER] Failed to map section", {
				sectionKey: mapping.sectionKey,
				error,
			});
		}
	}

	console.log("✅ [MAPPER] All sections mapped successfully");
}

/**
 * Get mapping configuration for a specific section
 *
 * @param sectionKey - The section key to find mapping for
 * @returns The mapping configuration or undefined if not found
 */
export function getSectionMapping(sectionKey: SectionKey): SectionMapping | undefined {
	return SECTION_MAPPINGS.find(m => m.sectionKey === sectionKey);
}
