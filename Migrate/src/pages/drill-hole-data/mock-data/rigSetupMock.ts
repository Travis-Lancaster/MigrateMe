/**
 * RigSetup Mock Data Generator
 */

export function generateRigSetupMock() {
	return {
		RigSetupId: "mock-rigsetup-001",
		DrillPlanId: "mock-plan-001",
		DrillingCompany: "Atlas Drilling Ltd.",
		DownHoleSurveyRigNo: "RIG-045",
		Organization: "B2Gold Corp.",
		DrillSupervisor: "John Anderson",
		FinalGeologist: "Dr. Sarah Mitchell",
		DownHoleSurveyDriller: "Mike Thompson",
		DownHoleSurveyDrillingContractor: "Atlas Drilling Ltd.",
		FinalSetupApprovedBy: "James Wilson",
		FinalSetupDrillSupervisor: "John Anderson",
		PadInspectionCompletedBy: "Robert Chen",
		Comments: "Standard setup for diamond drilling. Ground conditions good.",
		DataSource: "Field Entry",
		FinalInclination: 60.5,
		FinalMagAzimuth: 135.0,
		RigAlignmentToolDip: 60.0,
		RigAlignmentToolMagAzi: 135.5,
		SurveyDepth: 5.0,
		SurveyDip: 60.2,
		SurveyMagAzi: 135.3,
		SurveyReference: "Downhole survey at 5m",
		RowStatus: 0, // Draft
		ActiveInd: true,
		CreatedBy: "system",
		CreatedOnDt: new Date().toISOString(),
		ModifiedBy: "system",
		ModifiedOnDt: new Date().toISOString(),
	};
}
