/**
 * useDrillPlanLookups Hook
 *
 * Fetches all lookup data needed for DrillPlanForm from Dexie IndexedDB.
 * Uses useLiveQuery for reactive updates when lookup tables sync.
 *
 * Architecture:
 * - Lookup tables populated by lookupInitializer.ts on app startup
 * - Data stored in IndexedDB via Dexie
 * - useLiveQuery watches tables and re-renders on changes
 * - Offline-first: No API calls during form rendering
 *
 * Data Flow:
 * 1. App startup → initializeLookupTables() → Fetch from API
 * 2. Parse JSON → bulkPut to IndexedDB (235+ tables)
 * 3. Component mount → useDrillPlanLookups() → useLiveQuery
 * 4. Reactive updates when lookup data syncs
 */

import type {
	DrillType,
	Grid,
	HolePurpose,
	HoleType,
	Organization,
	Project,
	SubTarget,
	Target,
} from "#src/data/api/database/data-contracts.js";
import { db } from "#src/data/db/connection";
import { useLiveQuery } from "dexie-react-hooks";

/**
 * Lookup data structure for DrillPlanForm
 */
export interface DrillPlanLookups {
	// Standard lookup tables (Code + Description + SortOrder pattern)
	grids: Grid[]
	holeTypes: HoleType[]
	drillTypes: DrillType[]
	holePurposes: HolePurpose[]
	taskPriorities: any[] // Generic lookup - no specific type
	sitePreps: any[] // Generic lookup - no specific type

	// Classification tables (different PK patterns)
	organizations: Organization[]
	projects: Project[]
	targets: Target[]
	subTargets: SubTarget[]

	// Loading state - true while any table is still loading
	isLoading: boolean
}

/**
 * Fetch all lookup data for DrillPlanForm from IndexedDB
 *
 * Uses useLiveQuery to watch tables and automatically re-render
 * when lookup data changes (e.g., after sync)
 *
 * @returns {DrillPlanLookups} Lookup data and loading state
 *
 * @example
 * const lookups = useDrillPlanLookups();
 *
 * if (lookups.isLoading) {
 *   return <Skeleton />;
 * }
 *
 * return (
 *   <Select>
 *     {lookups.grids.map(grid => (
 *       <Option key={grid.Code} value={grid.Code}>
 *         {grid.Description}
 *       </Option>
 *     ))}
 *   </Select>
 * );
 */
export function useDrillPlanLookups(): DrillPlanLookups {
	// Fetch lookup tables with SortOrder for proper ordering
	const grids = useLiveQuery(() => db.Lookup_Grid.orderBy("SortOrder").toArray(), []);

	const holeTypes = useLiveQuery(() => db.Lookup_HoleType.orderBy("SortOrder").toArray(), []);

	const drillTypes = useLiveQuery(() => db.Lookup_DrillType.orderBy("SortOrder").toArray(), []);

	const holePurposes = useLiveQuery(() => db.Lookup_HolePurpose.orderBy("SortOrder").toArray(), []);

	// Generic lookups (may not have SortOrder)
	const taskPriorities = useLiveQuery(() => db.Lookup_TaskPriority.toArray(), []);

	const sitePreps = useLiveQuery(() => db.Lookup_SitePrep.toArray(), []);

	// Classification tables - use primary key for ordering
	const organizations = useLiveQuery(
		() => db.Classification_Organization.orderBy("Organization").toArray(),
		[],
	);

	const projects = useLiveQuery(() => db.Classification_Project.orderBy("Project").toArray(), []);

	const targets = useLiveQuery(() => db.Classification_Target.orderBy("Target").toArray(), []);

	const subTargets = useLiveQuery(
		() => db.Classification_SubTarget.orderBy("SubTarget").toArray(),
		[],
	);

	// Calculate loading state - undefined means still loading
	const isLoading
		= !grids
		  || !holeTypes
		  || !drillTypes
		  || !holePurposes
		  || !taskPriorities
		  || !sitePreps
		  || !organizations
		  || !projects
		  || !targets
		  || !subTargets;

	return {
		grids: grids || [],
		holeTypes: holeTypes || [],
		drillTypes: drillTypes || [],
		holePurposes: holePurposes || [],
		taskPriorities: taskPriorities || [],
		sitePreps: sitePreps || [],
		organizations: organizations || [],
		projects: projects || [],
		targets: targets || [],
		subTargets: subTargets || [],
		isLoading,
	};
}
