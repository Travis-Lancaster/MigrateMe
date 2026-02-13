/**
 * RockQualityDesignationLog Mock Data Generator
 */

export function generateRockQualityDesignationLogMock() {
	return [
		{
			id: "rqd-001",
			RockQualityDesignationLogId: "mock-rqd-001",
			CollarId: "mock-collar-001",
			DepthFrom: 0.00,
			DepthTo: 10.00,
			RQD_Percent: 45,
			RockQuality: "Poor",
			Comments: "Highly fractured weathered zone",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "rqd-002",
			RockQualityDesignationLogId: "mock-rqd-002",
			CollarId: "mock-collar-001",
			DepthFrom: 10.00,
			DepthTo: 20.00,
			RQD_Percent: 85,
			RockQuality: "Good",
			Comments: "Competent rock with minor fracturing",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "rqd-003",
			RockQualityDesignationLogId: "mock-rqd-003",
			CollarId: "mock-collar-001",
			DepthFrom: 20.00,
			DepthTo: 30.00,
			RQD_Percent: 95,
			RockQuality: "Excellent",
			Comments: "Massive fresh rock",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "rqd-004",
			RockQualityDesignationLogId: "mock-rqd-004",
			CollarId: "mock-collar-001",
			DepthFrom: 30.00,
			DepthTo: 40.00,
			RQD_Percent: 25,
			RockQuality: "Very Poor",
			Comments: "Shear zone with intense fracturing",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
