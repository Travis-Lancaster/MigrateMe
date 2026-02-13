/**
 * QuickLogSection Component
 *
 * Quick geological logging interface for rapid field data entry.
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

export function QuickLogSection() {
	const section = useDrillHoleStore(state => state.sections[SectionKey.QuickLog]);

	return (
		<SectionWrapper
			section={section}
			title="Quick Log"
		>
			<Alert
				message="Section Under Development"
				description="Quick geological logging functionality will be implemented here. This section will provide rapid data entry for field logging."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for quick logging data */}
		</SectionWrapper>
	);
}
