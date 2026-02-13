/**
 * CycloneCleaningSection Component
 *
 * Track cyclone cleaning operations and maintenance records.
 *
 * Features:
 * - Placeholder for future implementation
 * - Section wrapper with proper layout
 * - Ready for AG Grid integration
 */

import { SectionKey } from "#src/types/drillhole";
import { Alert } from "antd";
import React from "react";
import { SectionWrapper } from "../components/SectionWrapper";
import { useDrillHoleStore } from "../store/drillhole-store";

export function CycloneCleaningSection() {
	const section = useDrillHoleStore(state => state.sections[SectionKey.CycloneCleaning]);

	return (
		<SectionWrapper
			section={section}
			title="Cyclone Cleaning"
		>
			<Alert
				message="Section Under Development"
				description="Cyclone cleaning tracking functionality will be implemented here. Record cleaning dates, operators, and equipment details."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for cyclone cleaning records */}
		</SectionWrapper>
	);
}
