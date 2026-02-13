/**
 * FractureCountLogSection Component
 *
 * Fracture density measurements and calculations per depth interval.
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

export function FractureCountLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.FractureCountLog]);

	return (
		<SectionWrapper
			section={section}
			title="Fracture Count Log"
		>
			<Alert
				message="Section Under Development"
				description="Fracture density logging functionality will be implemented here. Record depth intervals, fracture counts, and density calculations."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for fracture count data */}
		</SectionWrapper>
	);
}
