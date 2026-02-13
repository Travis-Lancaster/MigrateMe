/**
 * ProgressIndicator Component
 *
 * Displays drilling progress with depth and section completion
 */

import {
	CheckCircleFilled,
	ClockCircleFilled,
	MinusCircleFilled,
} from "@ant-design/icons";
import { Progress, Tooltip } from "antd";

export interface SectionProgress {
	key: string
	label: string
	complete: boolean
	percent?: number
}

export interface ProgressIndicatorProps {
	currentDepth?: number
	plannedDepth?: number
	sections?: SectionProgress[]
	variant?: "full" | "compact"
	className?: string
}

export function ProgressIndicator({
	currentDepth = 0,
	plannedDepth = 0,
	sections = [],
	variant = "full",
	className = "",
}: ProgressIndicatorProps) {
	const depthPercent = plannedDepth > 0
		? Math.min(100, (currentDepth / plannedDepth) * 100)
		: 0;

	const completedSections = sections.filter(s => s.complete).length;
	const overallPercent = sections.length > 0
		? (completedSections / sections.length) * 100
		: 0;

	// Compact variant - just the bars
	if (variant === "compact") {
		return (
			<div className={`progress-indicator-compact ${className}`}>
				{plannedDepth > 0 && (
					<div className="mb-2">
						<div className="flex justify-between text-xs text-gray-600 mb-1">
							<span>Depth</span>
							<span>
								{currentDepth.toFixed(1)}
								m /
								{" "}
								{plannedDepth.toFixed(1)}
								m
							</span>
						</div>
						<Progress
							percent={depthPercent}
							strokeColor="#52c41a"
							showInfo={false}
							size="small"
						/>
					</div>
				)}

				{sections.length > 0 && (
					<div>
						<div className="flex justify-between text-xs text-gray-600 mb-1">
							<span>Sections</span>
							<span>
								{completedSections}
								{" "}
								/
								{" "}
								{sections.length}
							</span>
						</div>
						<Progress
							percent={overallPercent}
							strokeColor="#1890ff"
							showInfo={false}
							size="small"
						/>
					</div>
				)}
			</div>
		);
	}

	// Full variant - detailed display
	return (
		<div className={`progress-indicator-full ${className}`}>
			{/* Depth Progress */}
			{plannedDepth > 0 && (
				<div className="mb-4">
					<div className="flex justify-between text-sm text-gray-700 mb-2 font-medium">
						<span>Drilling Progress</span>
						<span className="font-mono">
							{currentDepth.toFixed(1)}
							m /
							{plannedDepth.toFixed(1)}
							m
						</span>
					</div>
					<Progress
						percent={depthPercent}
						strokeColor="#52c41a"
						showInfo={true}
						format={percent => `${percent?.toFixed(0)}%`}
					/>
				</div>
			)}

			{/* Section Completion */}
			{sections.length > 0 && (
				<div>
					<div className="text-sm font-medium text-gray-700 mb-3">
						Section Completion
					</div>
					<div className="space-y-2">
						{sections.map(section => (
							<div
								key={section.key}
								className="flex items-center gap-3"
							>
								{section.complete
									? (
										<Tooltip title="Complete">
											<CheckCircleFilled className="text-green-500 text-base" />
										</Tooltip>
									)
									: section.percent && section.percent > 0
										? (
											<Tooltip title={`${section.percent.toFixed(0)}% complete`}>
												<ClockCircleFilled className="text-blue-500 text-base" />
											</Tooltip>
										)
										: (
											<Tooltip title="Not started">
												<MinusCircleFilled className="text-gray-400 text-base" />
											</Tooltip>
										)}

								<span className="text-sm text-gray-700 flex-1">
									{section.label}
								</span>

								{section.percent !== undefined && !section.complete && (
									<span className="text-xs text-gray-500">
										{section.percent.toFixed(0)}
										%
									</span>
								)}
							</div>
						))}
					</div>

					{/* Overall Progress */}
					<div className="mt-4 pt-3 border-t border-gray-200">
						<div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
							<span>Overall Completion</span>
							<span>
								{overallPercent.toFixed(0)}
								%
							</span>
						</div>
						<Progress
							percent={overallPercent}
							strokeColor="#1890ff"
							showInfo={false}
						/>
					</div>
				</div>
			)}

			{/* No data fallback */}
			{plannedDepth === 0 && sections.length === 0 && (
				<div className="text-sm text-gray-500 text-center py-4">
					No progress data available
				</div>
			)}
		</div>
	);
}

export default ProgressIndicator;
