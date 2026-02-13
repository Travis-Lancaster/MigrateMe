/**
 * EmptyState Component
 * Helpful empty states with guidance
 */

import type { ReactNode } from "react";
import { Button, Empty } from "antd";

export interface EmptyStateProps {
	title?: string
	description?: string
	icon?: ReactNode
	action?: {
		label: string
		onClick: () => void
	}
}

export function EmptyState({
	title = "No data yet",
	description = "Get started by adding your first item",
	icon,
	action,
}: EmptyStateProps) {
	return (
		<div className="flex items-center justify-center p-12">
			<Empty
				image={icon || Empty.PRESENTED_IMAGE_SIMPLE}
				description={(
					<div className="text-center">
						<div className="text-base font-medium text-gray-700 mb-1">{title}</div>
						<div className="text-sm text-gray-500">{description}</div>
					</div>
				)}
			>
				{action && (
					<Button type="primary" onClick={action.onClick}>
						{action.label}
					</Button>
				)}
			</Empty>
		</div>
	);
}
