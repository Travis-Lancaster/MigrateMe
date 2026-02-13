/**
 * CoreRecoveryRunLogSection Component
 *
 * Track core recovery per drilling run with meters drilled and recovered.
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

export function CoreRecoveryRunLogSection() {
	const section = useCreateDrillHoleStore(state => state.sections[SectionKey.CoreRecoveryRunLog]);

	return (
		<SectionWrapper
			section={section}
			title="Core Recovery Run Log"
		>
			<Alert
				message="Section Under Development"
				description="Core recovery tracking functionality will be implemented here. Record run numbers, meters drilled, meters recovered, and recovery percentages."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for core recovery data */}
		</SectionWrapper>
	);
}
