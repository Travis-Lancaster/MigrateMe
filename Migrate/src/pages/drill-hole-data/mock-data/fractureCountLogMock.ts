/**
 * FractureCountLog Mock Data Generator
 */

export function generateFractureCountLogMock() {
	return [
		{
			id: "fc-001",
			FractureCountLogId: "mock-fc-001",
			CollarId: "mock-collar-001",
			DepthFrom: 0.00,
			DepthTo: 10.00,
			FractureCount: 15,
			FracturesPerMeter: 1.5,
			Comments: "Low fracture density in overburden",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "fc-002",
			FractureCountLogId: "mock-fc-002",
			CollarId: "mock-collar-001",
			DepthFrom: 10.00,
			DepthTo: 20.00,
			FractureCount: 48,
			FracturesPerMeter: 4.8,
			Comments: "Increased fracturing near weathered zone",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "fc-003",
			FractureCountLogId: "mock-fc-003",
			CollarId: "mock-collar-001",
			DepthFrom: 20.00,
			DepthTo: 30.00,
			FractureCount: 85,
			FracturesPerMeter: 8.5,
			Comments: "High fracture density in shear zone",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "fc-004",
			FractureCountLogId: "mock-fc-004",
			CollarId: "mock-collar-001",
			DepthFrom: 30.00,
			DepthTo: 40.00,
			FractureCount: 22,
			FracturesPerMeter: 2.2,
			Comments: "Moderate fracturing in competent rock",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
