/**
 * AG Grid Column Definition Bundles
 *
 * Reusable column bundles that combine multiple related columns.
 * Reduces boilerplate and ensures consistency across grid sections.
 *
 * Built on top of column-factories.ts for maximum reusability.
 *
 * @example
 * ```typescript
 * const columnDefs = [
 *   ...COMMON_COLUMNS.depthInterval(isReadOnly),
 *   ...COMMON_COLUMNS.drillPersonnel(lookupOptions.persons, isReadOnly),
 *   COMMON_COLUMNS.comments(isReadOnly),
 * ];
 * ```
 */

import {
	createDateColumn,
	createDepthColumn,
	createPersonColumn,
	createTextAreaColumn,
} from "./column-factories";

import type { ColDef } from "ag-grid-enterprise";
import type { LookupOption } from "./column-factories";

/**
 * Common column bundles for geology and drilling sections
 */
export const COMMON_COLUMNS = {
	/**
	 * Depth interval columns (DepthFrom, DepthTo)
	 * Most common pattern across drilling and geology grids
	 *
	 * Features:
	 * - Numeric formatting (2 decimal places)
	 * - Validation highlighting (DepthTo must be > DepthFrom)
	 * - Right-aligned
	 *
	 * @param isReadOnly - If true, columns are not editable
	 * @returns Array of 2 column definitions
	 */
	depthInterval: (isReadOnly = false): ColDef[] => [
		createDepthColumn("DepthFrom", isReadOnly),
		createDepthColumn("DepthTo", isReadOnly, "DepthFrom"),
	],

	/**
	 * Date range columns (StartDt, EndDt)
	 * Common for time-based intervals
	 *
	 * Features:
	 * - YYYY-MM-DD formatting
	 * - Date picker editor
	 * - Date column filter
	 *
	 * @param isReadOnly - If true, columns are not editable
	 * @returns Array of 2 column definitions
	 */
	dateRange: (isReadOnly = false): ColDef[] => [
		createDateColumn("StartDt", "Start Date", isReadOnly),
		createDateColumn("EndDt", "End Date", isReadOnly),
	],

	/**
	 * Drill personnel columns (Driller1, Driller2)
	 * Used in drilling-related sections
	 *
	 * Features:
	 * - Rich select editor with search
	 * - Display label, store code
	 * - Set column filter
	 *
	 * @param persons - Lookup options for person selection
	 * @param isReadOnly - If true, columns are not editable
	 * @returns Array of 2 column definitions
	 */
	drillPersonnel: (persons: LookupOption[], isReadOnly = false): ColDef[] => [
		createPersonColumn("Driller1", "Driller 1", persons, isReadOnly),
		createPersonColumn("Driller2", "Driller 2", persons, isReadOnly),
	],

	/**
	 * Geology personnel columns (Geologist1, Geologist2)
	 * Used in logging-related sections
	 *
	 * Features:
	 * - Rich select editor with search
	 * - Display label, store code
	 * - Set column filter
	 *
	 * @param persons - Lookup options for person selection
	 * @param isReadOnly - If true, columns are not editable
	 * @returns Array of 2 column definitions
	 */
	geologyPersonnel: (persons: LookupOption[], isReadOnly = false): ColDef[] => [
		createPersonColumn("Geologist1", "Geologist 1", persons, isReadOnly),
		createPersonColumn("Geologist2", "Geologist 2", persons, isReadOnly),
	],

	/**
	 * Comments/Notes column
	 * Large text area for free-form text
	 *
	 * Features:
	 * - Large text editor popup
	 * - Auto-height and word wrap
	 * - Text column filter
	 * - 500 character default max length
	 *
	 * @param isReadOnly - If true, column is not editable
	 * @param maxLength - Maximum character length (default 500)
	 * @returns Single column definition
	 */
	comments: (isReadOnly = false, maxLength = 500): ColDef =>
		createTextAreaColumn("Comments", "Comments", isReadOnly, maxLength),

	/**
	 * Single person column
	 * Helper for creating individual person columns with custom field names
	 *
	 * @param field - Field name (e.g., 'LoggedBy', 'VerifiedBy')
	 * @param headerName - Display name
	 * @param persons - Lookup options for person selection
	 * @param isReadOnly - If true, column is not editable
	 * @returns Single column definition
	 */
	person: (
		field: string,
		headerName: string,
		persons: LookupOption[],
		isReadOnly = false,
	): ColDef => createPersonColumn(field, headerName, persons, isReadOnly),

	/**
	 * Single date column
	 * Helper for creating individual date columns with custom field names
	 *
	 * @param field - Field name (e.g., 'LoggedDt', 'VerifiedDt')
	 * @param headerName - Display name
	 * @param isReadOnly - If true, column is not editable
	 * @returns Single column definition
	 */
	date: (field: string, headerName: string, isReadOnly = false): ColDef =>
		createDateColumn(field, headerName, isReadOnly),
};

/**
 * Helper function to create selection checkbox column configuration
 * Used for row selection in editable grids
 *
 * @returns Column definition for selection checkbox
 */
export function createSelectionColumn(): ColDef {
	return {
		headerCheckboxSelection: true,
		checkboxSelection: true,
		sortable: false,
		resizable: false,
		width: 50,
		minWidth: 50,
		maxWidth: 50,
		suppressHeaderMenuButton: true,
		suppressMovable: true,
		lockPosition: "left" as const,
		pinned: "left" as const,
	};
}
