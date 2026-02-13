/**
 * Section Mappers
 * 
 * Transform API data to store format.
 * Maps between API response structures and internal store data structures.
 * 
 * @module drill-hole-data/store
 */

import type {
	DrillHoleDataAggregate,
	RowMetadata,
	RowVersionMap,
} from "../types/data-contracts";
import type {
	RigSetup,
	CollarCoordinate,
	GeologyCombinedLog,
	ShearLog,
	StructureLog,
	AllSamples,
} from "#src/api/database/data-contracts";
import { createRowMetadata } from "./section-factory";

/**
 * Map RigSetup from API to store format
 * 
 * @param apiData - RigSetup from API
 * @returns Mapped data for store
 */
export function mapRigSetupFromApi(apiData: RigSetup | null): RigSetup | null {
	if (!apiData) return null;
	
	console.log(`[SectionMappers] 📦 Mapping RigSetup from API`);
	
	// RigSetup structure matches store format, just pass through
	return {
		...apiData,
	};
}

/**
 * Map CollarCoordinate from API to store format
 * 
 * @param apiData - CollarCoordinate from API
 * @returns Mapped data for store
 */
export function mapCollarCoordinateFromApi(apiData: CollarCoordinate | null): CollarCoordinate | null {
	if (!apiData) return null;
	
	console.log(`[SectionMappers] 📦 Mapping CollarCoordinate from API`);
	
	return {
		...apiData,
	};
}

/**
 * Map GeologyCombinedLog array from API to store format
 * 
 * @param apiData - GeologyCombinedLog array from API
 * @returns Mapped data array for store
 */
export function mapGeologyCombinedLogFromApi(apiData: GeologyCombinedLog[]): GeologyCombinedLog[] {
	if (!apiData || apiData.length === 0) return [];
	
	console.log(`[SectionMappers] 📦 Mapping GeologyCombinedLog from API:`, {
		rowCount: apiData.length,
	});
	
	// Sort by DepthFrom (geology logs should always be sorted by depth)
	return [...apiData].sort((a, b) => a.DepthFrom - b.DepthFrom);
}

/**
 * Map ShearLog array from API to store format
 */
export function mapShearLogFromApi(apiData: ShearLog[]): ShearLog[] {
	if (!apiData || apiData.length === 0) return [];
	
	console.log(`[SectionMappers] 📦 Mapping ShearLog from API:`, {
		rowCount: apiData.length,
	});
	
	return [...apiData].sort((a, b) => (a.DepthFrom || 0) - (b.DepthFrom || 0));
}

/**
 * Map StructureLog array from API to store format
 */
export function mapStructureLogFromApi(apiData: StructureLog[]): StructureLog[] {
	if (!apiData || apiData.length === 0) return [];
	
	console.log(`[SectionMappers] 📦 Mapping StructureLog from API:`, {
		rowCount: apiData.length,
	});
	
	return [...apiData].sort((a, b) => (a.DepthFrom || 0) - (b.DepthFrom || 0));
}

/**
 * Map AllSamples array from API to store format
 */
export function mapAllSamplesFromApi(apiData: AllSamples[]): AllSamples[] {
	if (!apiData || apiData.length === 0) return [];
	
	console.log(`[SectionMappers] 📦 Mapping AllSamples from API:`, {
		rowCount: apiData.length,
	});
	
	// Sort by DepthFrom (samples should be sorted by depth)
	return [...apiData].sort((a, b) => (a.DepthFrom || 0) - (b.DepthFrom || 0));
}

/**
 * Extract row metadata from API data
 * 
 * @param rows - Array of rows from API
 * @param idField - Name of ID field
 * @returns Row metadata map
 */
export function extractRowMetadataFromApi<T extends { RowStatus?: number }>(
	rows: T[],
	idField: keyof T,
): Record<string, RowMetadata> {
	const metadata: Record<string, RowMetadata> = {};
	
	rows.forEach(row => {
		const rowId = String(row[idField]);
		const rowStatus = row.RowStatus || 0;
		metadata[rowId] = createRowMetadata(rowId, rowStatus);
	});
	
	console.log(`[SectionMappers] 📊 Extracted metadata for ${rows.length} rows`);
	
	return metadata;
}

/**
 * Extract row versions from API data
 * 
 * @param rows - Array of rows from API
 * @param idField - Name of ID field
 * @returns Row version map
 */
export function extractRowVersionsFromApi<T extends { rv?: string }>(
	rows: T[],
	idField: keyof T,
): RowVersionMap {
	const versions: RowVersionMap = {};
	
	rows.forEach(row => {
		const rowId = String(row[idField]);
		versions[rowId] = row.rv || "";
	});
	
	console.log(`[SectionMappers] 🔖 Extracted row versions for ${rows.length} rows`);
	
	return versions;
}

/**
 * Map complete drill hole aggregate from API
 * 
 * @param aggregate - Drill hole data aggregate from service
 * @returns Sections mapped for store
 */
export function mapDrillHoleAggregateToStore(aggregate: DrillHoleDataAggregate) {
	console.log(`[SectionMappers] 🗺️ Mapping complete drill hole aggregate:`, {
		drillPlanId: aggregate.drillPlanId,
		hasVwCollar: !!aggregate.vwCollar,
		hasVwDrillPlan: !!aggregate.vwDrillPlan,
		hasRigSetup: !!aggregate.rigSetup,
		hasCollarCoordinate: !!aggregate.collarCoordinate,
		geologyCombinedLogCount: aggregate.geologyCombinedLog.length,
		allSamplesCount: aggregate.allSamples.length,
	});
	
	console.log(`[SectionMappers] 🗺️ Mapping rigSetup...`);
	const mappedRigSetup = mapRigSetupFromApi(aggregate.rigSetup);
	
	console.log(`[SectionMappers] 🗺️ Mapping collarCoordinate...`);
	const mappedCollarCoordinate = mapCollarCoordinateFromApi(aggregate.collarCoordinate);
	
	console.log(`[SectionMappers] 🗺️ Mapping geologyCombinedLog...`);
	const mappedGeologyCombinedLog = {
		data: mapGeologyCombinedLogFromApi(aggregate.geologyCombinedLog),
		metadata: extractRowMetadataFromApi(aggregate.geologyCombinedLog, "GeologyCombinedLogId"),
		versions: extractRowVersionsFromApi(aggregate.geologyCombinedLog, "GeologyCombinedLogId"),
	};
	
	console.log(`[SectionMappers] 🗺️ Mapping shearLog...`);
	const mappedShearLog = {
		data: mapShearLogFromApi(aggregate.shearLog),
		metadata: extractRowMetadataFromApi(aggregate.shearLog, "ShearLogId"),
		versions: extractRowVersionsFromApi(aggregate.shearLog, "ShearLogId"),
	};
	
	console.log(`[SectionMappers] 🗺️ Mapping structureLog...`);
	const mappedStructureLog = {
		data: mapStructureLogFromApi(aggregate.structureLog),
		metadata: extractRowMetadataFromApi(aggregate.structureLog, "StructureLogId"),
		versions: extractRowVersionsFromApi(aggregate.structureLog, "StructureLogId"),
	};
	
	console.log(`[SectionMappers] 🗺️ Mapping allSamples...`);
	const mappedAllSamples = {
		data: mapAllSamplesFromApi(aggregate.allSamples),
		metadata: extractRowMetadataFromApi(aggregate.allSamples, "SampleId"),
		versions: extractRowVersionsFromApi(aggregate.allSamples, "SampleId"),
	};
	
	const result = {
		// Single-object sections
		rigSetup: mappedRigSetup,
		collarCoordinate: mappedCollarCoordinate,
		
		// Array sections
		geologyCombinedLog: mappedGeologyCombinedLog,
		shearLog: mappedShearLog,
		structureLog: mappedStructureLog,
		allSamples: mappedAllSamples,
		
		// Core data
		vwCollar: aggregate.vwCollar,
		vwDrillPlan: aggregate.vwDrillPlan,
		
		// Metadata
		loadedAt: aggregate.loadedAt,
		modifiedAt: aggregate.modifiedAt,
		staleSections: aggregate.staleSections,
		sectionVersions: aggregate.sectionVersions,
	};
	
	console.log(`[SectionMappers] ✅ Mapping complete:`, {
		drillPlanId: aggregate.drillPlanId,
		rigSetupMapped: !!result.rigSetup,
		collarCoordinateMapped: !!result.collarCoordinate,
		geologyCombinedLogRows: result.geologyCombinedLog.data.length,
		allSamplesRows: result.allSamples.data.length,
	});
	
	return result;
}
