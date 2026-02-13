/**
 * CollarCard Component with Progress
 * Displays drill hole summary with planning/execution identifiers
 */

import type { VwCollar } from "#src/data/api/database/data-contracts.js";
import { HoleStatusBadge } from "#src/ux/shared/components/index.js";

import { Card, Progress } from "antd";
import { useNavigate } from "react-router";

export interface CollarCardProps {
	plan: Partial<VwCollar>
}

export function CollarCard({ plan }: CollarCardProps) {
	const navigate = useNavigate();

	const handleClick = () => {
		// Navigate based on status
		if (plan.CollarId) {
			console.log("[CollarCard] 🎬 Navigate to collar workspace", { collarId: plan.CollarId });
			navigate(`/exploration/collar/${plan.CollarId}`);
		}
		else {
			console.log("[CollarCard] 🎬 Navigate to drill plan", { drillPlanId: plan.CollarId });
			// For planning phase, could navigate to plan form
			navigate(`/exploration/planning/plans/${plan.CollarId}`);
		}
	};

	const isInProgress = plan.HoleStatus === "In progress";
	const isCompleted = plan.HoleStatus === "Completed";

	// Calculate progress
	const depthPercent = plan.TotalDepth && plan.PlannedTotalDepth
		? Math.min(100, (plan.TotalDepth / plan.PlannedTotalDepth) * 100)
		: 0;

	return (
		<Card
			hoverable
			onClick={handleClick}
			className="cursor-pointer transition-shadow hover:shadow-md"
			size="small"
		>
			<div className="flex flex-col gap-3">
				{/* Header with hole name */}
				<div className="flex items-start justify-between">
					<div className="flex-1">
						{/* Display actual hole name if available, otherwise planned name */}
						<div className="flex items-center">
							<span className="font-semibold text-base">
								{plan.HoleNm || plan.PlannedHoleNm || "Unnamed"}
							</span>
							{/* Show planned name as reference if different from actual */}
							{plan.HoleNm && plan.PlannedHoleNm && plan.HoleNm !== plan.PlannedHoleNm && (
								<>
									<span className="text-gray-400 mx-2">•</span>
									<span className="text-sm text-gray-500">
										Planned:
										{plan.PlannedHoleNm}
									</span>
								</>
							)}
							{/* Show proposed name if no actual hole yet and different from planned */}
							{!plan.HoleNm && plan.ProposedHoleNm && plan.ProposedHoleNm !== plan.PlannedHoleNm && (
								<>
									<span className="text-gray-400 mx-2">•</span>
									<span className="text-sm text-gray-500">{plan.ProposedHoleNm}</span>
								</>
							)}
						</div>
					</div>
					<HoleStatusBadge status={plan.HoleStatus || "Draft"} />
				</div>

				{/* Progress for In Progress holes */}
				{isInProgress && plan.TotalDepth && plan.PlannedTotalDepth && (
					<div>
						<div className="flex justify-between text-xs text-gray-600 mb-1">
							<span>Drilling Progress</span>
							<span className="font-mono">
								{plan.TotalDepth.toFixed(1)}
								m /
								{plan.PlannedTotalDepth.toFixed(1)}
								m
							</span>
						</div>
						<Progress
							percent={depthPercent}
							showInfo={false}
							strokeColor="#52c41a"
							size="small"
						/>

						{/* Section completion mini-checklist */}
						<div className="flex items-center gap-3 mt-2 text-xs">
							{/* {plan.setupComplete ? (
								<CheckCircleFilled className="text-green-500" />
							) : (
								<MinusCircleFilled className="text-gray-400" />
							)} */}
							<span className="text-gray-600">Setup</span>

							{/* {plan.geologyComplete ? (
								<CheckCircleFilled className="text-green-500" />
							) : plan.geologyComplete === false ? (
								<ClockCircleFilled className="text-blue-500" />
							) : (
								<MinusCircleFilled className="text-gray-400" />
							)} */}
							<span className="text-gray-600">Geology</span>

							{/* {plan.samplingComplete ? (
								<CheckCircleFilled className="text-green-500" />
							) : plan.samplingComplete === false ? (
								<ClockCircleFilled className="text-blue-500" />
							) : (
								<MinusCircleFilled className="text-gray-400" />
							)} */}
							<span className="text-gray-600">Sampling</span>
						</div>
					</div>
				)}

				{/* Metadata */}
				{/* <div className="text-xs text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
					{plan.Project && <span>Project: {plan.Project}</span>}
					{plan.Target && <span>Target: {plan.Target}</span>}
					{plan.PlannedTotalDepth && (
						<span>
							Planned: {plan.PlannedTotalDepth.toFixed(0)}m
							{plan.PlannedDip && ` @ ${plan.PlannedDip.toFixed(0)}°`}
							{plan.PlannedAzimuth && `/${plan.PlannedAzimuth.toFixed(0)}°`}
						</span>
					)}
				</div> */}
			</div>
		</Card>
	);
}

export default CollarCard;
