/**
 * CollarCoordinate Mock Data Generator
 */

export function generateCollarCoordinateMock() {
	return {
		CollarCoordinateId: "mock-collar-coord-001",
		CollarId: "mock-collar-001",
		Easting: 345678.50,
		Northing: 1456789.75,
		RL: 1245.30,
		Grid: "UTM Zone 30N",
		SurveyMethod: "GPS",
		SurveyDate: "2024-01-15",
		Accuracy: 0.05,
		SurveyBy: "Survey Team Alpha",
		Comments: "Coordinates verified with differential GPS",
		RowStatus: 0, // Draft
		ActiveInd: true,
		CreatedBy: "system",
		CreatedOnDt: new Date().toISOString(),
		ModifiedBy: "system",
		ModifiedOnDt: new Date().toISOString(),
	};
}
