import type { AnchorDefinition, MappingConfig } from "../pages/visual-mapper/types";
import * as XLSX from "xlsx";

// Transform Helper
function applyTransform(val: any, transform?: string) {
	if (val === undefined || val === null)
		return null;
	const strVal = String(val).trim();

	if (transform === "labValue") {
		if (strVal === "X")
			return 0.005;
		if (strVal === "NA")
			return null;
		if (strVal === "")
			return null;
		const num = Number.parseFloat(strVal);
		return isNaN(num) ? strVal : num;
	}
	if (transform === "number") {
		const num = Number.parseFloat(strVal);
		return isNaN(num) ? strVal : num;
	}
	return strVal;
}

// TXT Helper: Extract substring
function extractTxtValue(lines: string[], row: number, col: number, length?: number) {
	if (!lines[row])
		return null;
	const line = lines[row];
	if (length) {
		return line.substring(col, col + length);
	}
	// Fallback: take word
	return line.substring(col).split(/\s{2,}/)[0];
}

// Find Anchor Position
function findAnchorPosition(lines: string[], anchor: AnchorDefinition): { r: number, c: number } | null {
	let count = 0;
	for (let r = 0; r < lines.length; r++) {
		const line = lines[r];
		const idx = line.indexOf(anchor.text);
		if (idx !== -1) {
			count++;
			if (count === anchor.occurrence) {
				// Return position of the END of the anchor text, as per relative logic
				return { r, c: idx + anchor.text.length };
			}
		}
	}
	return null;
}

export function parseFile(fileContent: string | ArrayBuffer | any, config: MappingConfig): Record<string, any> {
	const result: Record<string, any> = {};
	const errors: string[] = [];

	// Pre-processing
	let lines: string[] = [];
	let worksheet: XLSX.WorkSheet | null = null;
	let xlsxData: any[][] = [];
	const headerMap: Record<string, number> = {};

	if (config.format === "TXT" && typeof fileContent === "string") {
		lines = fileContent.split("\n");
	}
	else if (config.format === "XLSX" && typeof fileContent !== "string") {
		const workbook = fileContent as XLSX.WorkBook;
		const sheetName = workbook.SheetNames[0];
		worksheet = workbook.Sheets[sheetName];
		xlsxData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		// Header Mapping logic
		if (config.headerRow !== undefined && xlsxData[config.headerRow]) {
			const rowData = xlsxData[config.headerRow];
			rowData.forEach((cell: any, idx: number) => {
				headerMap[String(cell).trim()] = idx;
			});
		}
	}

	// Process Fields
	config.fields.forEach((field) => {
		let value: any = null;

		if (field.sourceType === "coordinate" && field.location) {
			if (config.format === "TXT") {
				value = extractTxtValue(lines, field.location.row || 0, field.location.col || 0, field.location.length);
			}
			else if (config.format === "XLSX") {
				const row = xlsxData[field.location.row || 0];
				value = row ? row[field.location.col || 0] : null;
			}
		}
		else if (field.sourceType === "anchor" && field.relativeLocation) {
			if (config.format === "TXT") {
				const anchorDef = config.anchors?.find(a => a.id === field.relativeLocation!.anchorId);
				if (anchorDef) {
					const anchorPos = findAnchorPosition(lines, anchorDef);
					if (anchorPos) {
						const targetRow = anchorPos.r + field.relativeLocation.dy;
						const targetCol = anchorPos.c + field.relativeLocation.dx;
						value = extractTxtValue(lines, targetRow, targetCol, field.relativeLocation.length);
					}
				}
			}
		}
		else if (field.sourceType === "header" && field.headerName) {
			if (config.format === "XLSX") {
				// Usually header mapping is for a list of items (Table), but if single field, assumes Row 1 + 1?
				// Or maybe single field mapped by header is rare unless it's a transpose?
				// For now, assume it picks from the first data row (headerRow + 1)
				const colIdx = headerMap[field.headerName];
				if (colIdx !== undefined && config.headerRow !== undefined) {
					const row = xlsxData[config.headerRow + 1];
					value = row ? row[colIdx] : null;
				}
			}
		}
		else if (field.sourceType === "table") {
			const tableRows: any[] = [];

			if (config.format === "TXT" && field.location?.row !== undefined) {
				let currentRow = field.location.row;
				const endPattern = field.endRowPattern ? new RegExp(field.endRowPattern) : null;

				while (currentRow < lines.length) {
					const line = lines[currentRow];
					if (endPattern && endPattern.test(line))
						break;
					if (!line.trim()) { currentRow++; continue; }

					const rowData: any = {};
					field.columns?.forEach((col) => {
						// TXT Table Column: absolute X or relative? Usually absolute X in line.
						if (col.col !== undefined && col.length !== undefined) {
							const rawVal = line.substring(col.col, col.col + col.length);
							rowData[col.jsonKey] = applyTransform(rawVal, col.transform);
						}
					});
					tableRows.push(rowData);
					currentRow++;
				}
			}
			else if (config.format === "XLSX") {
				// XLSX Table
				// Start from headerRow + 1 or specified row
				const startRow = (field.location?.row !== undefined) ? field.location.row : (config.headerRow !== undefined ? config.headerRow + 1 : 0);

				for (let r = startRow; r < xlsxData.length; r++) {
					const row = xlsxData[r];
					// Stop condition? Empty row?
					if (!row || row.length === 0)
						continue;

					const rowData: any = {};
					field.columns?.forEach((col) => {
						let colIdx = col.col;
						if (col.headerName && headerMap[col.headerName] !== undefined) {
							colIdx = headerMap[col.headerName];
						}

						if (colIdx !== undefined) {
							rowData[col.jsonKey] = applyTransform(row[colIdx], col.transform);
						}
					});
					tableRows.push(rowData);
				}
			}
			value = tableRows;
		}

		if (field.sourceType !== "table") {
			value = applyTransform(value, field.transform);
		}

		if (value !== null) {
			result[field.jsonKey] = value;
		}
	});

	return result;
}
