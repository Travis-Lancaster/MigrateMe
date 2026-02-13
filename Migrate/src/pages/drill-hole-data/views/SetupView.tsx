/**
 * Setup View
 *
 * Main view for Setup tab with lens-based navigation.
 * Displays RigSetup or CollarCoordinate based on active lens.
 *
 * @module drill-hole-data/views
 */

import React from "react";
import { useDrillHoleDataStore } from "../store";
import { SectionKey } from "../types/data-contracts";
import { RigSetupForm } from "../sections/forms/RigSetupForm";
import { CollarCoordinateForm } from "../sections/forms/CollarCoordinateForm";
import { SectionFooter } from "../components/SectionFooter";
import { useSectionActions } from "../hooks";

export const SetupView: React.FC = () => {
	// ========================================================================
	// Store Selectors
	// ========================================================================

	const activeLens = useDrillHoleDataStore(state => state.activeLens["Setup"]);
	const currentLens = activeLens || "RigSetup";

	// Get current section key based on lens
	const currentSectionKey = currentLens === "RigSetup"
		? SectionKey.RigSetup
		: SectionKey.CollarCoordinate;

	// Get section state for footer
	const section = useDrillHoleDataStore(state => state.sections[currentSectionKey]);
	const canEdit = useDrillHoleDataStore(state => state.canEdit(currentSectionKey));

	console.log("[SetupView] 🔍 Rendering SetupView", {
		currentLens,
		sectionKey: currentSectionKey,
		hasSection: !!section,
		sectionData: section?.data,
		isDirty: section?.isDirty,
		canEdit,
		timestamp: new Date().toISOString(),
	});

	// ========================================================================
	// Section Actions
	// ========================================================================

	const { onSave, onSubmit } = useSectionActions(currentSectionKey);

	// ========================================================================
	// Render
	// ========================================================================

	return (
		<div className="flex flex-col h-full">
			<div className="flex-1 overflow-auto p-6 bg-slate-50">
				{currentLens === "RigSetup" && <RigSetupForm />}
				{currentLens === "Coordinate" && <CollarCoordinateForm />}
			</div>
			
			{/* Section Footer with integrated actions */}
			<SectionFooter
				rowStatus={section?.data?.RowStatus || 0}
				isDirty={section?.isDirty || false}
				onSave={onSave}
				onSubmit={onSubmit}
			/>
		</div>
	);
};
