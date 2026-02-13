/**
 * Dispatch Mock Data Generator
 */

export function generateDispatchMock() {
	return {
		DispatchId: "mock-dispatch-001",
		CollarId: "mock-collar-001",
		DispatchDate: "2024-02-05",
		Laboratory: "ALS Global",
		DispatchMethod: "Courier",
		BatchNumber: "BATCH-2024-045",
		NumberOfSamples: 6,
		DispatchedBy: "Sarah Mitchell",
		ReceivedBy: "ALS Lab Reception",
		TrackingNumber: "TRACK-123456",
		Comments: "Standard dispatch to primary lab",
		RowStatus: 0,
		ActiveInd: true,
		CreatedBy: "system",
		CreatedOnDt: new Date().toISOString(),
		ModifiedBy: "system",
		ModifiedOnDt: new Date().toISOString(),
	};
}
