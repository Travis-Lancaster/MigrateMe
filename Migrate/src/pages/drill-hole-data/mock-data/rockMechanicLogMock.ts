/**
 * RockMechanicLog Mock Data Generator
 */

export function generateRockMechanicLogMock() {
	return [
		{
			id: "rm-001",
			RockMechanicLogId: "mock-rm-001",
			CollarId: "mock-collar-001",
			DepthFrom: 5.00,
			DepthTo: 5.50,
			UCS_MPa: 45.5,
			TensileStrength_MPa: 4.2,
			YoungsModulus_GPa: 25.3,
			PoissonsRatio: 0.25,
			Comments: "Weak rock - weathered zone",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "rm-002",
			RockMechanicLogId: "mock-rm-002",
			CollarId: "mock-collar-001",
			DepthFrom: 25.00,
			DepthTo: 25.50,
			UCS_MPa: 185.7,
			TensileStrength_MPa: 15.8,
			YoungsModulus_GPa: 65.2,
			PoissonsRatio: 0.22,
			Comments: "Strong competent rock",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "rm-003",
			RockMechanicLogId: "mock-rm-003",
			CollarId: "mock-collar-001",
			DepthFrom: 50.00,
			DepthTo: 50.50,
			UCS_MPa: 125.3,
			TensileStrength_MPa: 10.5,
			YoungsModulus_GPa: 45.8,
			PoissonsRatio: 0.28,
			Comments: "Moderate strength",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
