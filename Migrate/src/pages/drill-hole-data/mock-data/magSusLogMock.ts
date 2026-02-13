/**
 * MagSusLog Mock Data Generator
 */

export function generateMagSusLogMock() {
	return [
		{
			id: "magsus-001",
			MagSusLogId: "mock-magsus-001",
			CollarId: "mock-collar-001",
			DepthFrom: 0.00,
			DepthTo: 10.00,
			MagneticSusceptibility: 125,
			Comments: "Low susceptibility in overburden",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "magsus-002",
			MagSusLogId: "mock-magsus-002",
			CollarId: "mock-collar-001",
			DepthFrom: 10.00,
			DepthTo: 20.00,
			MagneticSusceptibility: 4850,
			Comments: "High susceptibility - mafic intrusion",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "magsus-003",
			MagSusLogId: "mock-magsus-003",
			CollarId: "mock-collar-001",
			DepthFrom: 20.00,
			DepthTo: 30.00,
			MagneticSusceptibility: 350,
			Comments: "Moderate susceptibility",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
