/**
 * LoggingSection Component
 *
 * General geological logging interface for detailed core observations.
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

export function LoggingSection() {
	const section = useDrillHoleStore(state => state.sections[SectionKey.Logging]);

	return (
		<SectionWrapper
			section={section}
			title="Logging"
		>
			<Alert
				message="Section Under Development"
				description="General geological logging functionality will be implemented here. Track rock types, minerals, alterations, and observations."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for geological logging data */}
		</SectionWrapper>
	);
}
