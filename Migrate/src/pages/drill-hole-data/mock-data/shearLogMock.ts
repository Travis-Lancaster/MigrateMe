/**
 * ShearLog Mock Data Generator
 */

export function generateShearLogMock() {
	return [
		{
			id: "shear-001",
			ShearLogId: "mock-shear-001",
			CollarId: "mock-collar-001",
			DepthFrom: 22.40,
			DepthTo: 22.65,
			ShearType: "Brittle",
			ShearIntensity: "Moderate",
			ShearOrientation: "45/135",
			Comments: "Minor shear zone with gouge",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "shear-002",
			ShearLogId: "mock-shear-002",
			CollarId: "mock-collar-001",
			DepthFrom: 45.80,
			DepthTo: 46.50,
			ShearType: "Ductile",
			ShearIntensity: "Strong",
			ShearOrientation: "60/120",
			Comments: "Major shear zone with mylonite",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "shear-003",
			ShearLogId: "mock-shear-003",
			CollarId: "mock-collar-001",
			DepthFrom: 78.20,
			DepthTo: 78.45,
			ShearType: "Brittle-Ductile",
			ShearIntensity: "Weak",
			ShearOrientation: "55/140",
			Comments: "Transitional shear zone",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
