/**
 * RockQualityDesignationLogSection Component
 *
 * RQD (Rock Quality Designation) calculations and intact core measurements.
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

export function RockQualityDesignationLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.RockQualityDesignationLog]);

	return (
		<SectionWrapper
			section={section}
			title="Rock Quality Designation (RQD)"
		>
			<Alert
				message="Section Under Development"
				description="RQD logging functionality will be implemented here. Record depth intervals, intact core pieces, and RQD percentage calculations."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for RQD data */}
		</SectionWrapper>
	);
}
