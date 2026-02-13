/**
 * StructureLogSection Component
 *
 * Structural geology observations including bedding, foliation, joints, and faults.
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

export function StructureLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.StructureLog]);

	return (
		<SectionWrapper
			section={section}
			title="Structure Log"
		>
			<Alert
				message="Section Under Development"
				description="Structural geology logging functionality will be implemented here. Record bedding, foliation, joints, faults, and other structural features."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for structural geology data */}
		</SectionWrapper>
	);
}
