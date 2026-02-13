import { BasicContent } from "#src/components";
import { LookupResolver } from "#src/services/lookupResolver";
import { autoRefreshStaleClean, checkCacheVersions } from "#src/services/versionCheckService";
import { RowStatus, SectionKey } from "#src/types/drillhole";
import { BugOutlined, CheckOutlined, CloseOutlined, ReloadOutlined, SaveOutlined } from "@ant-design/icons";
import { Button, message, Space, Spin } from "antd";

import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { CollarCoordinateModal } from "../components/CollarCoordinateModal";
import { DrillHoleHeader } from "../components/DrillHoleHeader";
import { ImportModal } from "../components/ImportModal";
import { PlannedVsActual } from "../components/PlannedVsActual";
import { StaleConflictDialog } from "../components/StaleConflictDialog";
import { VerticalTabs } from "../components/VerticalTabs";
import { CollarSection } from "../sections/CollarSection";
import { CoreRecoveryRunLogSection } from "../sections/CoreRecoveryRunLogSection";
import { CycloneCleaningSection } from "../sections/CycloneCleaningSection";
import { DispatchSection } from "../sections/DispatchSection";
import { DrillMethodSection } from "../sections/DrillMethodSection";
import { DrillPlanSection } from "../sections/DrillPlanSection";
import { FractureCountLogSection } from "../sections/FractureCountLogSection";
import { LoggingSection } from "../sections/LoggingSection";
import { MagSusLogSection } from "../sections/MagSusLogSection";
import { QaqcSection } from "../sections/QaqcSection";
import { QuickLogSection } from "../sections/QuickLogSection";
import { RigSheetSection } from "../sections/RigSheetSection";
import { RockMechanicLogSection } from "../sections/RockMechanicLogSection";
import { RockQualityDesignationLogSection } from "../sections/RockQualityDesignationLogSection";
import { SampleSection } from "../sections/SampleSection";
import { ShearLogSection } from "../sections/ShearLogSection";
import { SpecificGravityPtLogSection } from "../sections/SpecificGravityPtLogSection";
import { StructureLogSection } from "../sections/StructureLogSection";
import { SurveySection } from "../sections/SurveySection";
import { useDrillHoleStore } from "../store/drillhole-store";

/**
 * DrillHole Data Entry Page
 *
 * Features:
 * - Vertical tabs navigation within page (no router)
 * - Collapsible master grid summary
 * - Collapsible vertical tabs to icon-only mode
 * - Individual section validation and save
 * - Aggregate validation across all sections
 * - Offline-first with Dexie sync
 * - RowStatus state machine (Draft → Complete → Reviewed → Approved)
 */
export function DrillHoleDetailView(): JSX.Element {
//	export const DrillHoleDetailView: React.FC = () => {
	const {
		drillHoleId: currentDrillHoleId,
		drillPlanId: currentDrillPlanId,
		HoleNm,
		PlannedHoleNm,
		ProposedHoleNm,
		OtherHoleNm,
		Organization,
		isLoading: loading,
		loadConflict,
		setLoadConflict,
		clearLoadConflict,
		sections,
		loadDrillHole,
		saveSection,
		submitSection,
		completedSection,
		rejectSection,
		reviewSection,
		approveSection,
		excludeFromReport,
		refreshStaleSection,
		importModalOpen,
		closeImportModal,
	} = useDrillHoleStore((state) => {
		console.log("🔔 Zustand subscription fired - state changed");
		return state;
	});
	const [collarCoordModalOpen, setCollarCoordModalOpen] = useState(false);
	const navigate = useNavigate();

	// Get drillHoleId from route params
	const { drillHoleId } = useParams<{ drillHoleId: string }>();

	// Test drill hole ID

	const TEST_DRILL_HOLE_ID = "A60FE3BC-AFF4-4D7D-9C29-0003DAD75E1B";

	// State for tab navigation and UI collapse
	const [activeTab, setActiveTab] = useState<SectionKey>(SectionKey.DrillPlan);
	const [tabsCollapsed, setTabsCollapsed] = useState(false);

	// State for tracking last server version check
	const [lastServerCheckTime, setLastServerCheckTime] = useState<number | null>(null);
	const ONE_HOUR_MS = 60 * 60 * 1000; // 1 hour in milliseconds

	// Get current section from active tab
	const currentSection = sections[activeTab];
	const collarCoordinates = sections[SectionKey.CollarCoordinates];

	// Setup react-hook-form for CollarCoordinateModal
	const {
		control: collarCoordControl,
		handleSubmit: handleCollarCoordSubmit,
		reset: resetCollarCoordForm,
		formState: { errors: collarCoordErrors, dirtyFields: collarCoordDirtyFields },
	} = useForm({
		defaultValues: collarCoordinates?.data || {},
		mode: "onChange",
	});

	// Reset form when data changes or modal opens
	useEffect(() => {
		if (collarCoordModalOpen && collarCoordinates?.data) {
			resetCollarCoordForm(collarCoordinates.data);
		}
	}, [collarCoordModalOpen, collarCoordinates?.data, resetCollarCoordForm]);

	// Lookup options for form fields
	const lookupOptions = useMemo(() => ({
		grid: LookupResolver.getLookupOptions("Grid", "Code", "Description"),
		person: LookupResolver.getLookupOptions("Person", "Code", "Description"),
		surveyMethods: LookupResolver.getLookupOptions("SurveyMethod", "Code", "Description"),
		holeStatus: LookupResolver.getLookupOptions("HoleStatus", "Code", "Description"),
	}), []);

	// Construct drill hole data from store sections for display components
	const currentDrillHoleData = {
		uiDrillHoleId: currentDrillHoleId || "",
		DrillHoleId: currentDrillHoleId || "",
		HoleNm,
		PlannedHoleNm,
		ProposedHoleNm,
		OtherHoleNm,
		Organization,
		DrillPlanStatus: 0,
		DrillPlan: sections.drillplan?.data,
		CollarRowStatus: 0,
		Collar: sections.collar?.data,
		CollarCoordinate: sections.collarcoordinates?.data,
		RigSetupRowStatus: 0,
		RigSetup: sections.rigsheet?.data,
		GeologyCombinedLogRowStatus: 0,
		GeologyCombinedLog: [],
		SurveyRowStatus: 0,
		Survey: sections.survey?.data,
		SurveyLogRowStatus: 0,
		SurveyLog: [],
		SampleRowStatus: 0,
		Sample: [],
	};

	const getStatusColor = (status: string) => {
		const statusColors: Record<string, string> = {
			Planned: "default",
			Drilling: "processing",
			Logging: "warning",
			Sampling: "purple",
			Dispatched: "cyan",
			Received: "blue",
			QAQC: "orange",
			Validated: "lime",
			Approved: "success",
			Rejected: "error",
			Cancelled: "default",
			Completed: "success",
			Active: "processing",
			Pending: "warning",
		};
		return statusColors[status] || "default";
	};

	// Debug: Log section state on every render
	console.log("🔍 DrillHolePage render:", {
		activeTab,
		sectionExists: !!currentSection,
		isDirty: currentSection?.isDirty,
		hasUnsavedChanges: currentSection?.hasUnsavedChanges(),
		rowStatus: currentSection?.getRowStatus(),
	});

	// Track if we're already loading to prevent infinite loops
	const isLoadingDrillHole = useRef(false);

	// Load initial data when drillHoleId changes
	useEffect(() => {
		console.log("📍 [LOAD] useEffect triggered:", {
			drillHoleId,
			currentDrillHoleId,
			isLoadingDrillHole: isLoadingDrillHole.current,
			willLoad: drillHoleId && drillHoleId !== currentDrillHoleId && !isLoadingDrillHole.current,
		});

		if (drillHoleId && drillHoleId !== currentDrillHoleId && !isLoadingDrillHole.current) {
			console.log("🚀 [LOAD] Calling loadDrillHole for:", drillHoleId);
			isLoadingDrillHole.current = true;
			loadDrillHole(drillHoleId).finally(() => {
				console.log("✅ [LOAD] loadDrillHole completed");
				isLoadingDrillHole.current = false;
				// Update last server check time
				setLastServerCheckTime(Date.now());
			});
		}
		else {
			console.log("⏭️ [LOAD] Skipping load - already loaded or loading");
		}
	}, [drillHoleId, currentDrillHoleId, loadDrillHole]);

	// Periodic server version check (every hour if drill hole is loaded)
	useEffect(() => {
		console.log("🕐 [VERSION CHECK] Periodic version check effect initialized");
		if (!currentDrillPlanId || !navigator.onLine) {
			return; // No drill hole loaded or offline
		}

		const checkInterval = setInterval(async () => {
			const now = Date.now();
			const shouldCheck = !lastServerCheckTime || (now - lastServerCheckTime) >= ONE_HOUR_MS;

			console.log("⏰ [VERSION CHECK] Periodic check:", {
				lastCheck: lastServerCheckTime ? new Date(lastServerCheckTime).toLocaleTimeString() : "never",
				timeSinceCheck: lastServerCheckTime ? `${Math.floor((now - lastServerCheckTime) / 1000 / 60)} min` : "N/A",
				shouldCheck,
			});

			if (shouldCheck && !isLoadingDrillHole.current) {
				console.log("🔄 [VERSION CHECK] 1 hour elapsed - checking rowversions only (no full load)");
				isLoadingDrillHole.current = true;

				try {
					// CRITICAL: Check if ANY section has unsaved changes in the store
					// The store knows about dirty state immediately, but Dexie only knows after save
					const storeDirtySections = Object.entries(sections)
						.filter(([_, section]) => section.isDirty || section.hasUnsavedChanges())
						.map(([key, _]) => key);

					console.log("🔍 [VERSION CHECK] Store dirty sections:", storeDirtySections);

					const result = await checkCacheVersions(currentDrillPlanId);
					setLastServerCheckTime(Date.now());

					if (result) {
						// Check if any of the stale sections are dirty in the store
						const staleAndDirtyInStore = result.staleCleanSections.filter(s =>
							storeDirtySections.includes(s),
						);

						const trulyStaleDirty = [...result.staleDirtySections, ...staleAndDirtyInStore];
						const trulyStaleClean = result.staleCleanSections.filter(s =>
							!storeDirtySections.includes(s),
						);

						if (trulyStaleDirty.length > 0) {
							console.log("⚠️ [VERSION CHECK] Stale+dirty sections found - showing modal:", trulyStaleDirty);
							// Trigger modal dialog for manual conflict resolution
							setLoadConflict({
								visible: true,
								staleSections: trulyStaleDirty.map(s => s as SectionKey),
								serverVersions: result.serverVersions,
							});
						}
						else if (trulyStaleClean.length > 0) {
							console.log("🔄 [VERSION CHECK] Stale+clean sections found, auto-refreshing:", trulyStaleClean);
							// CRITICAL: Don't call loadDrillHole which reloads everything
							// Just refresh the stale sections in Dexie - user will reload manually if needed
							const refreshed = await autoRefreshStaleClean(currentDrillPlanId);
							if (refreshed) {
								message.info({
									content: "Server has newer data available. Refresh the page to see updates.",
									duration: 0, // Don't auto-dismiss
									key: "stale-data-notification",
								});
							}
						}
						else {
							console.log("✅ [VERSION CHECK] All sections up to date");
						}
					}
					else {
						console.log("✅ [VERSION CHECK] No cached data or all up to date");
					}
				}
				catch (error) {
					console.error("❌ [VERSION CHECK] Error checking versions:", error);
				}
				finally {
					isLoadingDrillHole.current = false;
				}
			}
		}, 5 * 60 * 1000); // Check every 5 minutes

		return () => clearInterval(checkInterval);
	}, [currentDrillPlanId, lastServerCheckTime, loadDrillHole, ONE_HOUR_MS]);

	// Note: Conflict detection now happens on save (409 error)
	// No need for proactive detection since we handle it reactively

	// Action handlers
	const handleSave = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Save clicked for section:", activeTab);
		const result = await saveSection(activeTab);
		console.log("🔹 Save result:", result);

		if (result.success) {
			message.success(result.message || "Section saved successfully");
		}
		else {
			// Note: 409 conflicts are now handled automatically in sync-service.ts
			// It will auto-refresh data and show a message to the user
			message.error(result.message || "Failed to save section");
			if (result.errors) {
				console.error("Validation errors:", result.errors);
			}
		}
	};

	const handleSubmit = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Submit clicked for section:", activeTab);
		const result = await submitSection(activeTab);
		console.log("🔹 Submit result:", result);

		if (result.success) {
			message.success(result.message || "Section submitted successfully");
		}
		else {
			message.error(result.message || "Failed to submit section");
			if (result.errors) {
				console.error("Validation errors:", result.errors);
			}
		}
	};

	const handleCompleted = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Completed clicked for section:", activeTab);
		const result = await completedSection(activeTab);
		console.log("🔹 Completed result:", result);

		if (result.success) {
			message.success(result.message || "Section marked as complete");
		}
		else {
			message.error(result.message || "Failed to mark section as complete");
		}
	};

	const handleReject = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Reject clicked for section:", activeTab);
		const result = await rejectSection(activeTab);
		console.log("🔹 Reject result:", result);

		if (result.success) {
			message.success(result.message || "Section rejected successfully");
		}
		else {
			message.error(result.message || "Failed to reject section");
		}
	};

	const handleReview = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Review clicked for section:", activeTab);
		const result = await reviewSection(activeTab);
		console.log("🔹 Review result:", result);

		if (result.success) {
			message.success(result.message || "Section marked as reviewed");
		}
		else {
			message.error(result.message || "Failed to mark section as reviewed");
		}
	};

	const handleApprove = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Approve clicked for section:", activeTab);
		const result = await approveSection(activeTab);
		console.log("🔹 Approve result:", result);

		if (result.success) {
			message.success(result.message || "Section approved successfully");
		}
		else {
			message.error(result.message || "Failed to approve section");
		}
	};

	const handleExclude = async () => {
		if (!currentSection)
			return;
		console.log("🔹 Exclude clicked for section:", activeTab);
		const result = await excludeFromReport(activeTab);
		console.log("🔹 Exclude result:", result);

		if (result.success) {
			message.success(result.message || "Section excluded from report");
		}
		else {
			message.error(result.message || "Failed to exclude section from report");
		}
	};

	// Handle load conflict resolution (from store state)
	const handleRefreshLoadConflict = async () => {
		if (!currentDrillPlanId)
			return;

		try {
			console.log("🔄 [CONFLICT] Refreshing from server due to load conflict");
			await loadDrillHole(currentDrillPlanId, true); // Force refresh
			clearLoadConflict();
			message.success("Data refreshed from server");
		}
		catch (error) {
			message.error("Failed to refresh data from server");
			console.error("❌ [CONFLICT] Refresh failed:", error);
		}
	};

	const handleCancelLoadConflict = () => {
		clearLoadConflict();
		message.warning("You can continue editing, but saving may fail due to version conflicts");
	};

	// Handle CollarCoordinate save
	const handleSaveCollarCoordinates = async (values: any, validated = false) => {
		try {
			const collarId = sections.collar?.data?.CollarId;
			if (!collarId) {
				message.error("No Collar ID available");
				return;
			}

			// Validate required field: SurveyMethod
			if (!values.SurveyMethod) {
				message.error("Survey Method is required and cannot be empty");
				return;
			}

			// CollarCoordinate only supports insert (no update) - always create new record
			const updateData = {
				Organization: currentDrillHoleData?.Organization || Organization,
				CollarId: collarId,
				Grid: values.Grid,
				East: values.East ? Number.parseFloat(values.East) : undefined,
				North: values.North ? Number.parseFloat(values.North) : undefined,
				RL: values.RL ? Number.parseFloat(values.RL) : undefined,
				SurveyBy: values.SurveyBy,
				SurveyMethod: values.SurveyMethod,
				SurveyOnDt: values.SurveyOnDt,
				PriorityStatus: "Archived",
				Priority: 0,
				DataSource: "UI",
				// Include required fields with defaults
				ReportIncludeInd: false,
				ValidatedStatus: 0,
				RowStatus: 0,
				ActiveInd: true,
			};

			console.log("🔹 CollarCoordinate save clicked:", { updateData, validated });

			// Update store with new values
			useDrillHoleStore.getState().updateSectionData(SectionKey.CollarCoordinates, updateData);

			// Save to backend
			const result = await saveSection(SectionKey.CollarCoordinates);

			if (result.success) {
				message.success(`Collar coordinates ${validated ? "submitted" : "saved"} successfully`);
				setCollarCoordModalOpen(false);
			}
			else {
				message.error(result.message || `Failed to ${validated ? "submit" : "save"} collar coordinates`);
				if (result.errors) {
					console.error("Validation errors:", result.errors);
				}
			}
		}
		catch (error) {
			message.error(`Failed to ${validated ? "submit" : "save"} collar coordinates`);
			console.error(error);
		}
	};

	// Render active section component

	const renderActiveSection = () => {
		if (currentDrillHoleId) {
			switch (activeTab) {
				case SectionKey.DrillPlan:
					return <DrillPlanSection />;
				case SectionKey.Collar:
					return <CollarSection />;
				case SectionKey.RigSheet:
					return <RigSheetSection />;
				case SectionKey.DrillMethod:
					return <DrillMethodSection currentDrillHoleId={currentDrillHoleId} />;
				case SectionKey.Sample:
					return <SampleSection currentDrillHoleId={currentDrillHoleId} />;
				case SectionKey.Dispatch:
					return <DispatchSection />;
				case SectionKey.Qaqc:
					return <QaqcSection />;
				case SectionKey.Survey:
					return <SurveySection />;

				// Geological Logging Sections
				case SectionKey.QuickLog:
					return <QuickLogSection />;
				case SectionKey.Logging:
					return <LoggingSection />;
				case SectionKey.CycloneCleaning:
					return <CycloneCleaningSection />;
				case SectionKey.ShearLog:
					return <ShearLogSection />;
				case SectionKey.StructureLog:
					return <StructureLogSection />;
				case SectionKey.CoreRecoveryRunLog:
					return <CoreRecoveryRunLogSection />;
				case SectionKey.FractureCountLog:
					return <FractureCountLogSection />;
				case SectionKey.MagSusLog:
					return <MagSusLogSection />;
				case SectionKey.RockMechanicLog:
					return <RockMechanicLogSection />;
				case SectionKey.RockQualityDesignationLog:
					return <RockQualityDesignationLogSection />;
				case SectionKey.SpecificGravityPtLog:
					return <SpecificGravityPtLogSection />;

				default:
					return <div>Section not found</div>;
			}
		}
		else {
			return <div>currentDrillHoleId missing</div>;
		}
	};

	if (loading) {
		return (
			<BasicContent>
				<div className="flex items-center justify-center h-full">
					<Spin size="large" tip="Loading drill hole data..." />
				</div>
			</BasicContent>
		);
	}
	console.log("drillhole-render");

	return (
		<BasicContent className="h-full flex flex-col">
			{/* Page Header */}
			<div className="mb-4 flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div>
						<h1 className="text-2xl font-bold m-0">Drill Hole Data Entry</h1>
						<p className="text-sm text-gray-500 mt-1">
							{/* {HoleNm ? `Drill Hole: ${HoleNm}` : 'Select a drill hole'} */}
						</p>
					</div>

					{/* Test Button */}
					<Button
						icon={<BugOutlined />}
						onClick={() => {
							console.log("sss");
							navigate(`/drill-hole/${TEST_DRILL_HOLE_ID}`);
						}}
						type="dashed"
						size="small"
					>
						Load Test Hole
					</Button>

					{/* Refresh Button */}
					{currentDrillPlanId && (
						<Button
							icon={<ReloadOutlined />}
							onClick={async () => {
								if (currentDrillPlanId) {
									await loadDrillHole(currentDrillPlanId, true);
								}
							}}
							size="small"
							loading={loading}
						>
							Refresh
						</Button>
					)}
				</div>

				{/* Action Buttons */}
				{currentSection && (
					<Space>
						{currentSection.getRowStatus() === RowStatus.Draft && (
							<>
								<Button
									icon={<SaveOutlined />}
									onClick={handleSave}
									disabled={(() => {
										const hasChanges = currentSection.hasUnsavedChanges();
										const isDisabled = !hasChanges;
										console.log("💾 Save button render:", {
											hasChanges,
											isDisabled,
											isDirty: currentSection.isDirty,
										});
										return isDisabled;
									})()}
								>
									Save
								</Button>
								<Button
									type="primary"
									icon={<CheckOutlined />}
									onClick={handleSubmit}
									disabled={!currentSection.isValid()}
								>
									Submit
								</Button>
							</>
						)}

						{currentSection.getRowStatus() === RowStatus.Complete && (
							<Button
								icon={<CloseOutlined />}
								onClick={handleReject}
							>
								Reject
							</Button>
						)}

						{/* TODO: Add more action buttons based on RowStatus */}
					</Space>
				)}
			</div>

			{/* Main Content Area: Vertical Tabs + Content */}
			<div className="flex-1 flex overflow-hidden">
				{/* Vertical Tabs - Left Side */}
				<VerticalTabs
					activeKey={activeTab}
					onChange={setActiveTab}
					collapsed={tabsCollapsed}
					onCollapseChange={setTabsCollapsed}
					sections={sections}
				/>

				{/* Content Area - Right Side */}
				<div className="flex-1 flex flex-col overflow-hidden">
					{/* Master Grid Summary - Collapsible */}
					{/* <MasterGrid
						drillPlanSection={sections[SectionKey.DrillPlan]}
						collarSection={sections[SectionKey.Collar]}
						rigSheetSection={sections[SectionKey.RigSheet]}
					/> */}

					<DrillHoleHeader
						drillHoleData={currentDrillHoleData as any}
						control={undefined as any}
						lookupOptions={lookupOptions}
						getStatusColor={getStatusColor}
						dirtyFields={new Set()}
					/>

					{/* Planned vs Actual Section */}
					<PlannedVsActual
						drillHoleData={currentDrillHoleData as any}
						onEditCollarCoordinates={() => setCollarCoordModalOpen(true)}
					/>

					{/* Active Section Content */}
					<div className="flex-1 overflow-auto p-4">
						{renderActiveSection()}
					</div>
				</div>
			</div>

			{/* Load Conflict Resolution Dialog (triggered by store) */}
			<StaleConflictDialog
				visible={loadConflict?.visible ?? false}
				staleSections={loadConflict?.staleSections ?? []}
				serverVersions={loadConflict?.serverVersions ?? []}
				onRefresh={handleRefreshLoadConflict}
				onCancel={handleCancelLoadConflict}
			/>
			<CollarCoordinateModal
				open={collarCoordModalOpen}
				onCancel={() => setCollarCoordModalOpen(false)}
				control={collarCoordControl}
				errors={collarCoordErrors}
				lookupOptions={lookupOptions}
				handleSubmit={handleCollarCoordSubmit}
				onSave={handleSaveCollarCoordinates}
				dirtyFields={collarCoordDirtyFields}
			/>

			{/* Import Modal */}
			<ImportModal
				open={importModalOpen}
				onClose={closeImportModal}
			/>
		</BasicContent>
	);
}
