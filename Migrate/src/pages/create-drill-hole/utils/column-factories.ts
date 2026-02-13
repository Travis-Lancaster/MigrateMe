/**
 * AG Grid Column Definition Factories
 *
 * Reusable factory functions for creating standardized AG Grid column definitions.
 * Eliminates repetitive column definition code and ensures consistency across grids.
 *
 * Applies DRY principle by centralizing column patterns.
 */

import type { ColDef } from "ag-grid-enterprise";

/**
 * Lookup option interface
 */
export interface LookupOption {
	value: string
	label: string
}

/**
 * Creates a standardized person lookup column for AG Grid
 *
 * Used for Driller1, Driller2, Geologist1, Geologist2, etc.
 * Provides consistent formatting, filtering, and editing experience.
 *
 * @param field - Field name in data object
 * @param headerName - Display name for column header
 * @param options - Lookup options (value/label pairs)
 * @param isReadOnly - If true, column is not editable
 * @returns ColDef for AG Grid
 *
 * @example
 * ```typescript
 * const drillerColumn = createPersonColumn(
 *   'Driller1',
 *   'Driller 1',
 *   lookupOptions.persons,
 *   isReadOnly
 * );
 * ```
 */
export function createPersonColumn(
	field: string,
	headerName: string,
	options: LookupOption[],
	isReadOnly = false,
): ColDef {
	return {
		headerName,
		field,
		minWidth: 140,
		width: 140,
		editable: !isReadOnly,
		cellEditor: "agRichSelectCellEditor",
		cellEditorParams: {
			values: options.map(opt => opt.value),
			formatValue: (value: string) => {
				const option = options.find(opt => opt.value === value);
				return option ? option.label : value;
			},
		},
		filter: "agSetColumnFilter",
		filterParams: {
			excelMode: "windows",
			values: options.map(opt => opt.value),
		},
		valueFormatter: (params) => {
			const option = options.find(opt => opt.value === params.value);
			return option ? option.label : params.value || "";
		},
	};
}

/**
 * Creates a standardized date column for AG Grid
 *
 * Handles date formatting (YYYY-MM-DD) and parsing consistently.
 * Used for StartDt, EndDt, SurveyOnDt, etc.
 *
 * @param field - Field name in data object
 * @param headerName - Display name for column header
 * @param isReadOnly - If true, column is not editable
 * @returns ColDef for AG Grid
 *
 * @example
 * ```typescript
 * const startDateColumn = createDateColumn('StartDt', 'Start Date', isReadOnly);
 * ```
 */
export function createDateColumn(
	field: string,
	headerName: string,
	isReadOnly = false,
): ColDef {
	return {
		headerName,
		field,
		minWidth: 130,
		width: 130,
		editable: !isReadOnly,
		cellDataType: "date",
		filter: "agDateColumnFilter",
		valueFormatter: (params) => {
			if (!params.value)
				return "";
			const date
				= typeof params.value === "string" ? new Date(params.value) : params.value;
			return date.toLocaleDateString("en-CA"); // YYYY-MM-DD format
		},
		valueParser: (params) => {
			if (!params.newValue)
				return params.newValue;
			return new Date(params.newValue).toISOString().split("T")[0];
		},
	};
}

/**
 * Creates a depth column (From/To) with validation highlighting
 *
 * Highlights cells where DepthTo <= DepthFrom (invalid range).
 * Used for DepthFrom and DepthTo columns.
 *
 * @param field - 'DepthFrom' or 'DepthTo'
 * @param isReadOnly - If true, column is not editable
 * @param compareField - Optional field to compare against for validation
 * @returns ColDef for AG Grid
 *
 * @example
 * ```typescript
 * const depthFromColumn = createDepthColumn('DepthFrom', isReadOnly);
 * const depthToColumn = createDepthColumn('DepthTo', isReadOnly, 'DepthFrom');
 * ```
 */
export function createDepthColumn(
	field: "DepthFrom" | "DepthTo",
	isReadOnly = false,
	compareField?: "DepthFrom" | "DepthTo",
): ColDef {
	return {
		field,
		headerName: field === "DepthFrom" ? "Depth From (m)" : "Depth To (m)",
		width: 130,
		type: "numericColumn",
		editable: !isReadOnly,
		cellEditor: "agNumberCellEditor",
		cellEditorParams: {
			min: 0,
			precision: 2,
		},
		valueFormatter: (params) => {
			if (params.value == null)
				return "";
			return Number(params.value).toFixed(2);
		},
		cellStyle: (params) => {
			const style: any = { textAlign: "right" };
			// Validation: DepthTo should be > DepthFrom
			if (compareField && params.data) {
				const current = params.data[field];
				const compare = params.data[compareField];
				if (
					field === "DepthTo"
					&& current
					&& compare
					&& current <= compare
				) {
					style.backgroundColor = "#fff3cd";
					style.color = "#856404";
				}
			}
			return style;
		},
	};
}

/**
 * Creates a standardized lookup column for AG Grid
 *
 * Generic lookup column for any code/description pair.
 * Used for DrillType, DrillSize, DrillCompany, etc.
 *
 * @param field - Field name in data object
 * @param headerName - Display name for column header
 * @param options - Lookup options (value/label pairs)
 * @param isReadOnly - If true, column is not editable
 * @param width - Optional column width (default 150)
 * @returns ColDef for AG Grid
 *
 * @example
 * ```typescript
 * const drillTypeColumn = createLookupColumn(
 *   'DrillType',
 *   'Drill Type',
 *   lookupOptions.drillTypes,
 *   isReadOnly
 * );
 * ```
 */
export function createLookupColumn(
	field: string,
	headerName: string,
	options: LookupOption[],
	isReadOnly = false,
	width = 150,
): ColDef {
	return {
		headerName,
		field,
		width,
		editable: !isReadOnly,
		cellEditor: "agRichSelectCellEditor",
		cellEditorParams: {
			values: options.map(opt => opt.value),
		},
		valueFormatter: (params) => {
			if (!params.value)
				return "";
			const option = options.find(opt => opt.value === params.value);
			return option ? option.label : params.value;
		},
	};
}

/**
 * Creates a text area column for comments/notes
 *
 * Provides a large text editor popup for longer text content.
 * Used for Comments, Notes, etc.
 *
 * @param field - Field name in data object
 * @param headerName - Display name for column header
 * @param isReadOnly - If true, column is not editable
 * @param maxLength - Maximum character length (default 500)
 * @returns ColDef for AG Grid
 *
 * @example
 * ```typescript
 * const commentsColumn = createTextAreaColumn('Comments', 'Comments', isReadOnly);
 * ```
 */
export function createTextAreaColumn(
	field: string,
	headerName: string,
	isReadOnly = false,
	maxLength = 500,
): ColDef {
	return {
		field,
		headerName,
		minWidth: 250,
		flex: 1,
		editable: !isReadOnly,
		cellEditor: "agLargeTextCellEditor",
		cellEditorPopup: true,
		autoHeight: true,
		wrapText: true,
		filter: "agTextColumnFilter",
		cellEditorParams: {
			maxLength,
			rows: 4,
			cols: 50,
		},
	};
}

/**
 * Creates a numeric column with formatting
 *
 * Standardized numeric column with right alignment and decimal places.
 *
 * @param field - Field name in data object
 * @param headerName - Display name for column header
 * @param isReadOnly - If true, column is not editable
 * @param decimalPlaces - Number of decimal places (default 2)
 * @param width - Optional column width (default 120)
 * @returns ColDef for AG Grid
 *
 * @example
 * ```typescript
 * const depthColumn = createNumericColumn('Depth', 'Depth (m)', isReadOnly, 2);
 * ```
 */
export function createNumericColumn(
	field: string,
	headerName: string,
	isReadOnly = false,
	decimalPlaces = 2,
	width = 120,
): ColDef {
	return {
		field,
		headerName,
		width,
		type: "numericColumn",
		editable: !isReadOnly,
		cellEditor: "agNumberCellEditor",
		cellEditorParams: {
			min: 0,
			precision: decimalPlaces,
		},
		valueFormatter: (params) => {
			if (params.value == null)
				return "";
			return Number(params.value).toFixed(decimalPlaces);
		},
		cellStyle: { textAlign: "right" },
	};
}
