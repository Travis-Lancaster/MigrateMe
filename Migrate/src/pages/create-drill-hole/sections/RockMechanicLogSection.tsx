/**
 * RockMechanicLogSection Component
 *
 * Rock mechanics properties including strength, hardness, and competency ratings.
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

export function RockMechanicLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.RockMechanicLog]);

	return (
		<SectionWrapper
			section={section}
			title="Rock Mechanic Log"
		>
			<Alert
				message="Section Under Development"
				description="Rock mechanics logging functionality will be implemented here. Record strength, hardness, competency ratings, and other mechanical properties."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for rock mechanics data */}
		</SectionWrapper>
	);
}
