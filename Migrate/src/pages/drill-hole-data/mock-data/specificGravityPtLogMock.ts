/**
 * SpecificGravityPtLog Mock Data Generator
 */

export function generateSpecificGravityPtLogMock() {
	return [
		{
			id: "sg-001",
			SpecificGravityPtLogId: "mock-sg-001",
			CollarId: "mock-collar-001",
			Depth: 5.25,
			SpecificGravity: 2.65,
			Method: "Water Displacement",
			Comments: "Standard test",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "sg-002",
			SpecificGravityPtLogId: "mock-sg-002",
			CollarId: "mock-collar-001",
			Depth: 15.80,
			SpecificGravity: 2.85,
			Method: "Water Displacement",
			Comments: "Mafic rock - higher density",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "sg-003",
			SpecificGravityPtLogId: "mock-sg-003",
			CollarId: "mock-collar-001",
			Depth: 35.45,
			SpecificGravity: 2.72,
			Method: "Water Displacement",
			Comments: "Average density",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "sg-004",
			SpecificGravityPtLogId: "mock-sg-004",
			CollarId: "mock-collar-001",
			Depth: 55.90,
			SpecificGravity: 3.15,
			Method: "Water Displacement",
			Comments: "High density - possible sulfide mineralization",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
