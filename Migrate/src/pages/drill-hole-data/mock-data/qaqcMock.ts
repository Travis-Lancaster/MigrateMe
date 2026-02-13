/**
 * QAQC Mock Data Generator
 */

export function generateQAQCMock() {
	return [
		{
			id: "qaqc-001",
			ReportId: "mock-qaqc-report-001",
			ReportName: "Standard Insertion Report",
			ReportType: "Standards",
			GeneratedDate: "2024-02-10",
			Status: "Pass",
			Summary: "All standards within acceptable limits",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "qaqc-002",
			ReportId: "mock-qaqc-report-002",
			ReportName: "Blank Contamination Report",
			ReportType: "Blanks",
			GeneratedDate: "2024-02-10",
			Status: "Pass",
			Summary: "No contamination detected",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "qaqc-003",
			ReportId: "mock-qaqc-report-003",
			ReportName: "Duplicate Precision Report",
			ReportType: "Duplicates",
			GeneratedDate: "2024-02-10",
			Status: "Warning",
			Summary: "2 duplicates show >20% variance",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
