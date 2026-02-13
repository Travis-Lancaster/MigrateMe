/**
 * Create Drill Hole View - Data Entry Module
 *
 * Main view for DATA ENTRY into existing drill holes.
 * Mobile/tablet-optimized with horizontal tabs and drawer editor.
 *
 * CRITICAL: This module does NOT create drill holes.
 * Drill holes already exist - this is for entering/editing data.
 *
 * Features:
 * - Section-by-section data entry workflow
 * - Horizontal tabs navigation (7 main categories)
 * - Drawer editor for detailed row editing
 * - Offline-first with draft persistence
 * - Two-tier validation (database + save)
 * - Progress tracking across all sections
 *
 * Pattern based on: src/pages/drill-hole/views/DrillHoleDetailView.tsx
 */

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { Alert, Button, message, Spin } from "antd";
import { ArrowLeftOutlined, SaveOutlined, CheckOutlined } from "@ant-design/icons";
import { SectionKey } from "#src/types/drillhole";
import { useCreateDrillHoleStore } from "../store/create-drillhole-store";
import { CreateDrillHoleHeader } from "../components/CreateDrillHoleHeader";
import { HorizontalTabs } from "../components/HorizontalTabs";
import { ProgressTracker } from "../components/ProgressTracker";

// Import all section components
import { RigSheetSection } from "../sections/RigSheetSection";
import { CollarSection } from "../sections/CollarSection";
import { DrillMethodSection } from "../sections/DrillMethodSection";
import { SurveySection } from "../sections/SurveySection";
import { SampleSection } from "../sections/SampleSection";
import { DispatchSection } from "../sections/DispatchSection";
import { DrillPlanSection } from "../sections/DrillPlanSection";
import { ShearLogSection } from "../sections/ShearLogSection";
import { StructureLogSection } from "../sections/StructureLogSection";
import { CoreRecoveryRunLogSection } from "../sections/CoreRecoveryRunLogSection";
import { FractureCountLogSection } from "../sections/FractureCountLogSection";
import { MagSusLogSection } from "../sections/MagSusLogSection";
import { RockMechanicLogSection } from "../sections/RockMechanicLogSection";
import { RockQualityDesignationLogSection } from "../sections/RockQualityDesignationLogSection";
import { SpecificGravityPtLogSection } from "../sections/SpecificGravityPtLogSection";
import { CycloneCleaningSection } from "../sections/CycloneCleaningSection";
import { QaqcSection } from "../sections/QaqcSection";
import { LoggingSection } from "../sections/LoggingSection";
import { QuickLogSection } from "../sections/QuickLogSection";

/**
 * Main Create Drill Hole View
 */
export function CreateDrillHoleView(): JSX.Element {
	console.log("📂 [VIEW:CREATE] Rendering CreateDrillHoleView");

	// Get drill hole ID from route params (HoleId = CollarId = DrillPlanId)
	const { drillHoleId } = useParams<{ drillHoleId: string }>();
	const navigate = useNavigate();

	// Get store state and actions
	const {
		drillPlanId,
		plannedHoleNm,
		isLoaded,
		isLoading,
		isSubmitting,
		error,
		completionPercentage,
		activeSection,
		sections,
		initializeDrillHole,
		submitDrillHole,
		setActiveSection,
	} = useCreateDrillHoleStore();

	// Local UI state
	const [showDraftSaveSuccess, setShowDraftSaveSuccess] = useState(false);

	// Initialize drill hole on mount (load existing drill hole for data entry)
	useEffect(() => {
		if (drillHoleId && !isLoaded && !isLoading) {
			console.log("📂 [VIEW:ENTRY] Loading existing drill hole for data entry", { drillHoleId });
			
			initializeDrillHole(drillHoleId)
				.then(() => {
					console.log("✅ [VIEW:ENTRY] Drill hole loaded successfully");
					message.success("Drill hole loaded for data entry");
				})
				.catch((err) => {
					console.error("❌ [VIEW:ENTRY] Failed to load drill hole", err);
					message.error(`Failed to load drill hole: ${err.message}`);
				});
		}
	}, [drillHoleId, isLoaded, isLoading, initializeDrillHole]);

	// Handle back navigation
	const handleBack = () => {
		console.log("🔙 [VIEW:CREATE] Navigating back to drill plan list");
		navigate("/drill-plan");
	};

	// Handle drill hole submission
	const handleSubmit = async () => {
		console.log("📤 [VIEW:CREATE] Starting drill hole submission");

		try {
			const result = await submitDrillHole();
			
			if (result.success) {
				console.log("✅ [VIEW:CREATE] Drill hole created successfully", { drillHoleId: result.drillHoleId });
				message.success("Drill hole created successfully!");
				
				// Navigate to drill hole detail view
				navigate(`/drill-hole/${result.drillHoleId}`);
			}
			else {
				console.error("❌ [VIEW:CREATE] Submission failed", result.error);
				message.error(result.error || "Failed to create drill hole");
			}
		}
		catch (err: any) {
			console.error("❌ [VIEW:CREATE] Submission error", err);
			message.error(err.message || "Failed to create drill hole");
		}
	};

	// Show draft auto-save notification
	const handleDraftSaved = () => {
		setShowDraftSaveSuccess(true);
		setTimeout(() => setShowDraftSaveSuccess(false), 2000);
	};

	// Render active section component
	const renderActiveSection = () => {
		switch (activeSection) {
			case SectionKey.RigSheet:
				return <RigSheetSection />;
			case SectionKey.Collar:
				return <CollarSection />;
			case SectionKey.DrillMethod:
				return <DrillMethodSection currentDrillHoleId={drillHoleId || ""} />;
			case SectionKey.Survey:
				return <SurveySection />;
			case SectionKey.Sample:
				return <SampleSection currentDrillHoleId={drillHoleId || ""} />;
			case SectionKey.Dispatch:
				return <DispatchSection />;
			case SectionKey.DrillPlan:
				return <DrillPlanSection />;
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
			case SectionKey.CycloneCleaning:
				return <CycloneCleaningSection />;
			case SectionKey.Qaqc:
				return <QaqcSection />;
			case SectionKey.Logging:
				return <LoggingSection />;
			case SectionKey.QuickLog:
				return <QuickLogSection />;
			default:
				return (
					<Alert
						message="Section Not Found"
						description={`Section "${activeSection}" is not implemented yet.`}
						type="warning"
						showIcon
					/>
				);
		}
	};

	// Loading state
	if (isLoading && !isLoaded) {
		return (
			<div style={{ 
				display: "flex", 
				justifyContent: "center", 
				alignItems: "center", 
				height: "100vh" 
			}}>
				<Spin size="large" tip="Loading drill plan..." />
			</div>
		);
	}

	// Error state
	if (error) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Failed to Load Drill Plan"
					description={error}
					type="error"
					showIcon
					action={
						<Button onClick={handleBack}>
							Back to List
						</Button>
					}
				/>
			</div>
		);
	}

	// Not initialized state
	if (!isLoaded) {
		return (
			<div style={{ padding: "24px" }}>
				<Alert
					message="Drill Plan Not Loaded"
					description="The drill plan could not be loaded. Please try again."
					type="warning"
					showIcon
					action={
						<Button onClick={handleBack}>
							Back to List
						</Button>
					}
				/>
			</div>
		);
	}

	// Main view
	return (
		<div className="create-drill-hole-view" style={{ 
			display: "flex", 
			flexDirection: "column",
			height: "100vh",
			overflow: "hidden",
		}}>
			{/* Header with hole info and actions */}
			<CreateDrillHoleHeader
				drillPlanId={drillPlanId!}
				plannedHoleNm={plannedHoleNm}
				completionPercentage={completionPercentage}
				onBack={handleBack}
				onSubmit={handleSubmit}
				isSubmitting={isSubmitting}
			/>

			{/* Progress tracker */}
			<ProgressTracker
				sections={sections}
				completionPercentage={completionPercentage}
			/>

			{/* Horizontal tabs navigation */}
			<HorizontalTabs
				activeSection={activeSection}
				sections={sections}
				onTabChange={setActiveSection}
			/>

			{/* Section content area */}
			<div style={{
				flex: 1,
				overflow: "auto",
				padding: "16px",
				backgroundColor: "#f5f5f5",
			}}>
				{renderActiveSection()}
			</div>

			{/* Auto-save notification */}
			{showDraftSaveSuccess && (
				<div style={{
					position: "fixed",
					bottom: "16px",
					right: "16px",
					backgroundColor: "#52c41a",
					color: "white",
					padding: "12px 24px",
					borderRadius: "4px",
					boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
					zIndex: 1000,
				}}>
					<SaveOutlined style={{ marginRight: "8px" }} />
					Draft saved
				</div>
			)}

			{/* Submission loading overlay */}
			{isSubmitting && (
				<div style={{
					position: "fixed",
					top: 0,
					left: 0,
					right: 0,
					bottom: 0,
					backgroundColor: "rgba(0,0,0,0.45)",
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					zIndex: 9999,
				}}>
					<Spin size="large" tip="Creating drill hole..." />
				</div>
			)}
		</div>
	);
}
