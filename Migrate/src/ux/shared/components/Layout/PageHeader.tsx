/**
 * PageHeader Component
 * Consistent page headers across the application
 */

import type { ReactNode } from "react";

export interface PageHeaderProps {
	title: string
	subtitle?: string
	extra?: ReactNode
	className?: string
}

export function PageHeader({ title, subtitle, extra, className = "" }: PageHeaderProps) {
	return (
		<div className={`flex items-center justify-between mb-6 ${className}`}>
			<div>
				<h1 className="text-2xl font-semibold text-gray-900 m-0">{title}</h1>
				{subtitle && (
					<p className="text-sm text-gray-500 mt-1 m-0">{subtitle}</p>
				)}
			</div>
			{extra && (
				<div className="flex items-center gap-2">
					{extra}
				</div>
			)}
		</div>
	);
}
