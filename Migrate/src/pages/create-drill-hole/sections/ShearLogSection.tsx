/**
 * ShearLogSection Component
 *
 * Document shear zones and faulting observations in drill core.
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

export function ShearLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.ShearLog]);

	return (
		<SectionWrapper
			section={section}
			title="Shear Log"
		>
			<Alert
				message="Section Under Development"
				description="Shear zone logging functionality will be implemented here. Track depth, width, orientation, and descriptions of shear zones."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for shear zone data */}
		</SectionWrapper>
	);
}
