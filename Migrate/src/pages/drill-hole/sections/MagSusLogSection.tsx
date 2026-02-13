/**
 * MagSusLogSection Component
 *
 * Magnetic susceptibility readings along the drill core.
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

export function MagSusLogSection() {
	const section = useDrillHoleStore(state => state.sections[SectionKey.MagSusLog]);

	return (
		<SectionWrapper
			section={section}
			title="Magnetic Susceptibility Log"
		>
			<Alert
				message="Section Under Development"
				description="Magnetic susceptibility logging functionality will be implemented here. Record depth and magnetic susceptibility values with units."
				type="info"
				showIcon
			/>
			{/* Future implementation: AG Grid for magnetic susceptibility data */}
		</SectionWrapper>
	);
}
