/**
 * SpecificGravityPtLogSection Component
 *
 * Point-specific gravity measurements along the drill core.
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
import { useCreateDrillHoleStore } from "../store/create-drillhole-store";

export function SpecificGravityPtLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.SpecificGravityPtLog]);

	return (
		<SectionWrapper
			section={section}
			title="Specific Gravity Point Log"
		>
			<Alert
				message="Section Under Development"
				description="Specific gravity logging functionality will be implemented here. Record depth, SG values, and measurement methods."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for specific gravity data */}
		</SectionWrapper>
	);
}
