/**
 * Shared AG Grid Utilities
 *
 * Common utilities for AG Grid components across drill modules
 */

import type { ICellRendererParams } from "ag-grid-enterprise";
import React from "react";

/**
 * Safe cell renderer wrapper that handles errors and invalid params
 * Prevents grid crashes from rendering errors
 */
export function safeCellRenderer<T = any>(renderer: (params: ICellRendererParams<T>) => React.ReactNode) {
	return (params: ICellRendererParams<T>) => {
		try {
			if (!params || !params.data) {
				console.warn("[AG Grid] Renderer called with invalid params:", params);
				return "N/A";
			}
			return renderer(params);
		}
		catch (error) {
			console.error("[AG Grid] Renderer error:", error, params);
			return "Error";
		}
	};
}

/**
 * Format date for display in grid
 */
export function formatGridDate(value: string | Date | null | undefined): string {
	if (!value)
		return "";
	try {
		return new Date(value).toLocaleDateString();
	}
	catch {
		return "";
	}
}

/**
 * Format datetime for display in grid
 */
export function formatGridDateTime(value: string | Date | null | undefined): string {
	if (!value)
		return "";
	try {
		return new Date(value).toLocaleString();
	}
	catch {
		return "";
	}
}

/**
 * Format number with suffix (e.g., "150m", "45°")
 */
export function formatWithSuffix(value: number | null | undefined, suffix: string): string {
	if (value == null)
		return "";
	return `${value}${suffix}`;
}

/**
 * Create a clickable link cell renderer
 */
export function createLinkRenderer(onNavigate: (id: string) => void,	field: string = "id") {
	return safeCellRenderer((params: any) => {
		const id = params.data[field];
		const value = params.value || "N/A";

		return React.createElement(
			"a",
			{
				href: "#",
				onClick: (e: React.MouseEvent) => {
					e.preventDefault();
					onNavigate(id);
				},
			},
			value,
		);
	});
}

/**
 * Validate grid data array
 */
export function validateGridData<T>(data: any, entityName: string = "items"): T[] {
	if (!Array.isArray(data)) {
		console.error(`[validateGridData] Invalid ${entityName} data:`, data);
		return [];
	}

	const validItems = data.filter((item) => {
		const isValid = item && typeof item === "object";
		if (!isValid) {
			console.warn(`[validateGridData] Invalid ${entityName} object:`, item);
		}
		return isValid;
	});

	if (validItems.length !== data.length) {
		console.warn(`[validateGridData] Filtered out ${data.length - validItems.length} invalid ${entityName}`);
	}

	return validItems;
}

/**
 * Common column definitions
 */
export const commonColumnDefs = {
	checkbox: {
		headerName: "",
		checkboxSelection: true,
		headerCheckboxSelection: true,
		width: 50,
		pinned: "left" as const,
		lockPosition: true,
	},

	date: (headerName: string, field: string) => ({
		headerName,
		field,
		width: 120,
		valueFormatter: (params: any) => formatGridDate(params.value),
	}),

	datetime: (headerName: string, field: string) => ({
		headerName,
		field,
		width: 140,
		valueFormatter: (params: any) => formatGridDateTime(params.value),
	}),

	numeric: (headerName: string, field: string, suffix: string = "") => ({
		headerName,
		field,
		width: 120,
		valueFormatter: (params: any) =>
			params.value != null ? formatWithSuffix(params.value, suffix) : "",
	}),
};
