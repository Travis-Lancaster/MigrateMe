/**
 * StructureLog Mock Data Generator
 */

export function generateStructureLogMock() {
	return [
		{
			id: "struct-001",
			StructureLogId: "mock-struct-001",
			CollarId: "mock-collar-001",
			Depth: 15.30,
			StructureType: "Joint",
			Dip: 75,
			DipDirection: 180,
			Roughness: "Smooth",
			Infill: "None",
			Comments: "Clean joint surface",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "struct-002",
			StructureLogId: "mock-struct-002",
			CollarId: "mock-collar-001",
			Depth: 35.80,
			StructureType: "Fault",
			Dip: 65,
			DipDirection: 145,
			Roughness: "Rough",
			Infill: "Clay",
			Comments: "Fault with clay gouge, slickensides visible",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "struct-003",
			StructureLogId: "mock-struct-003",
			CollarId: "mock-collar-001",
			Depth: 52.40,
			StructureType: "Fracture",
			Dip: 85,
			DipDirection: 90,
			Roughness: "Rough",
			Infill: "Quartz",
			Comments: "Healed fracture with quartz infill",
			RowStatus: 0,
			ActiveInd: true,
		},
		{
			id: "struct-004",
			StructureLogId: "mock-struct-004",
			CollarId: "mock-collar-001",
			Depth: 87.90,
			StructureType: "Foliation",
			Dip: 55,
			DipDirection: 165,
			Roughness: "Smooth",
			Infill: "None",
			Comments: "Metamorphic foliation plane",
			RowStatus: 0,
			ActiveInd: true,
		},
	];
}
