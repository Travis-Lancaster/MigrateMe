/**
 * Export Utilities
 *
 * Helper functions for exporting drill plans to various formats
 */

import type { DrillPlan, DrillPlanFilters } from "../types";
import { message } from "antd";
import { drillPlanService } from "../services/drillPlanService";

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string) {
	const url = window.URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	window.URL.revokeObjectURL(url);
}

/**
 * Export drill plans to Excel
 */
export async function exportToExcel(filters?: DrillPlanFilters): Promise<void> {
	try {
		message.loading({ content: "Generating Excel file...", key: "excel-export" });

		// For now, create a simple CSV export as Excel endpoint is not implemented
		// In production, this would call the backend Excel export endpoint
		const response = await drillPlanService.findAll(1, 10000, filters); // Get all with high limit
		const csv = convertToCSV(response.data);
		const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
		const filename = `drill-plans-${new Date().toISOString().split("T")[0]}.csv`;

		downloadBlob(blob, filename);
		message.success({ content: "Excel file downloaded successfully", key: "excel-export" });
	}
	catch (error: any) {
		message.error({ content: error.message || "Failed to export to Excel", key: "excel-export" });
	}
}

/**
 * Export single drill plan to PDF
 */
export async function exportToPDF(planId: string, planName: string): Promise<void> {
	try {
		message.loading({ content: "Generating PDF...", key: "pdf-export" });

		// This would call the backend PDF export endpoint
		// For now, we'll show a placeholder message
		message.warning({
			content: "PDF export endpoint not yet implemented. Use print function instead.",
			key: "pdf-export",
			duration: 5,
		});

		// When backend is ready:
		// const blob = await drillPlanService.exportToPdf(planId);
		// const filename = `drill-plan-${planName || planId}.pdf`;
		// downloadBlob(blob, filename);
		// message.success({ content: 'PDF downloaded successfully', key: 'pdf-export' });
	}
	catch (error: any) {
		message.error({ content: error.message || "Failed to export to PDF", key: "pdf-export" });
	}
}

/**
 * Print drill plan (opens browser print dialog)
 */
export function printDrillPlan(): void {
	window.print();
}

/**
 * Convert drill plans array to CSV format
 */
function convertToCSV(plans: DrillPlan[]): string {
	if (plans.length === 0) {
		return "No data to export";
	}

	// Define headers
	const headers = [
		"Hole Name",
		"Project",
		"Organization",
		"Target",
		"Sub Target",
		"Prospect",
		"Status",
		"Easting",
		"Northing",
		"RL",
		"Total Depth",
		"Dip",
		"Azimuth",
		"Hole Type",
		"Drill Type",
		"Planned Start",
		"Planned Complete",
		"Planned By",
		"Priority",
		"Created On",
		"Modified On",
	];

	// Convert data rows
	const rows = plans.map(plan => [
		plan.PlannedHoleNm || "",
		plan.Project || "",
		plan.Organization || "",
		plan.Target || "",
		plan.SubTarget || "",
		plan.Prospect || "",
		plan.DrillPlanStatus || "",
		plan.PlannedEasting?.toString() || "",
		plan.PlannedNorthing?.toString() || "",
		plan.PlannedRL?.toString() || "",
		plan.PlannedTotalDepth?.toString() || "",
		plan.PlannedDip?.toString() || "",
		plan.PlannedAzimuth?.toString() || "",
		plan.HoleType || "",
		plan.DrillType || "",
		plan.PlannedStartDt ? new Date(plan.PlannedStartDt).toLocaleDateString() : "",
		plan.PlannedCompleteDt ? new Date(plan.PlannedCompleteDt).toLocaleDateString() : "",
		plan.PlannedBy || "",
		plan.DrillPriority?.toString() || "",
		plan.CreatedOnDt ? new Date(plan.CreatedOnDt).toLocaleString() : "",
		plan.ModifiedOnDt ? new Date(plan.ModifiedOnDt).toLocaleString() : "",
	]);

	// Combine headers and rows
	const csvContent = [
		headers.map(escapeCSV).join(","),
		...rows.map(row => row.map(escapeCSV).join(",")),
	].join("\n");

	return csvContent;
}

/**
 * Escape CSV values
 */
function escapeCSV(value: string): string {
	if (value.includes(",") || value.includes("\"") || value.includes("\n")) {
		return `"${value.replace(/"/g, "\"\"")}"`;
	}
	return value;
}
