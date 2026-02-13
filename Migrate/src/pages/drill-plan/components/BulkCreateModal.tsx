/**
 * BulkCreateModal Component
 *
 * Modal wizard for bulk creation of drill plans from patterns
 */

import type { DrillPattern } from "#src/api/database/data-contracts";
import type { BulkCreateConfig, GridConfig, NamingConfig, ValidationWarning } from "../services/bulkCreationService";
import type { CreateDrillPlanDto } from "../types";
import {
	CheckCircleOutlined,
	ThunderboltOutlined,
	WarningOutlined,
} from "@ant-design/icons";
import { Button, message, Modal, Progress, Space, Steps } from "antd";
import React, { useEffect, useState } from "react";
import {
	bulkCreationService,

} from "../services/bulkCreationService";
import { useDrillPlanStore } from "../store/drill-plan-store";
import { BulkPreviewGrid } from "./BulkPreviewGrid";
import { GridConfigForm } from "./GridConfigForm";
import { NamingConfigForm } from "./NamingConfigForm";
import { PatternSelector } from "./PatternSelector";

interface BulkCreateModalProps {
	visible: boolean
	onClose: () => void
	onSuccess: () => void
}

export const BulkCreateModal: React.FC<BulkCreateModalProps> = ({
	visible,
	onClose,
	onSuccess,
}) => {
	const { createPlan } = useDrillPlanStore();

	// Step state
	const [currentStep, setCurrentStep] = useState(0);

	// Configuration state
	const [selectedPattern, setSelectedPattern] = useState<DrillPattern | null>(null);
	const [gridConfig, setGridConfig] = useState<GridConfig>({
		rows: 5,
		columns: 10,
		originEasting: 450000,
		originNorthing: 7200000,
		originRL: 300,
	});
	const [namingConfig, setNamingConfig] = useState<NamingConfig>({
		type: "sequential",
		prefix: "DH_",
		startNumber: 1,
	});

	// Preview state
	const [previewPlans, setPreviewPlans] = useState<CreateDrillPlanDto[]>([]);
	const [validationWarnings, setValidationWarnings] = useState<ValidationWarning[]>([]);
	const [previewNames, setPreviewNames] = useState<string[]>([]);

	// Creation state
	const [isCreating, setIsCreating] = useState(false);
	const [creationProgress, setCreationProgress] = useState({ current: 0, total: 0 });
	const [creationResults, setCreationResults] = useState<{
		created: number
		failed: number
		errors: Array<{ holeName: string, error: string }>
	} | null>(null);

	// Update naming prefix when pattern selected
	useEffect(() => {
		if (selectedPattern && namingConfig.prefix === "DH_") {
			setNamingConfig(prev => ({
				...prev,
				prefix: `${selectedPattern.DrillPattern}_`,
			}));
		}
	}, [selectedPattern]);

	// Generate preview names when config changes
	useEffect(() => {
		if (selectedPattern && currentStep === 2) {
			const config: BulkCreateConfig = {
				pattern: selectedPattern,
				gridConfig,
				namingConfig,
			};
			const names = bulkCreationService.previewHoleNames(config, 10);
			setPreviewNames(names);
		}
	}, [selectedPattern, gridConfig, namingConfig, currentStep]);

	const handlePatternSelect = (patternId: string | undefined, pattern: DrillPattern | undefined) => {
		setSelectedPattern(pattern || null);
	};

	const handleGeneratePreview = () => {
		if (!selectedPattern) {
			message.error("Please select a pattern first");
			return;
		}

		try {
			const config: BulkCreateConfig = {
				pattern: selectedPattern,
				gridConfig,
				namingConfig,
			};

			// Validate configuration
			const validation = bulkCreationService.validateConfig(config);
			setValidationWarnings(validation.warnings);

			if (!validation.isValid) {
				message.error("Please resolve configuration errors before continuing");
				return;
			}

			// Calculate positions
			const positions = bulkCreationService.calculateGridCoordinates(
				{
					easting: gridConfig.originEasting,
					northing: gridConfig.originNorthing,
				},
				{
					rows: gridConfig.rows,
					columns: gridConfig.columns,
				},
				selectedPattern,
			);

			// Generate names
			const names = namingConfig.type === "sequential"
				? bulkCreationService.generateHoleNames(namingConfig, positions.length)
				: bulkCreationService.generateGridBasedNames(namingConfig.prefix, positions);

			// Create plan DTOs
			const plans = bulkCreationService.createPlanDTOs(
				positions,
				names,
				selectedPattern,
				config,
			);

			setPreviewPlans(plans);
			setCurrentStep(3); // Move to preview step

			message.success(`Generated preview for ${plans.length} drill plans`);
		}
		catch (error: any) {
			console.error("[BulkCreateModal] Error generating preview:", error);
			message.error(`Failed to generate preview: ${error.message}`);
		}
	};

	const handleBulkCreate = async () => {
		if (previewPlans.length === 0) {
			message.error("No drill plans to create");
			return;
		}

		setIsCreating(true);
		setCreationProgress({ current: 0, total: previewPlans.length });
		setCreationResults(null);

		const batchSize = 10; // Create 10 at a time
		const results = { created: 0, failed: 0, errors: [] as Array<{ holeName: string, error: string }> };

		try {
			for (let i = 0; i < previewPlans.length; i += batchSize) {
				const batch = previewPlans.slice(i, i + batchSize);

				const batchResults = await Promise.allSettled(
					batch.map(plan => createPlan(plan)),
				);

				batchResults.forEach((result, idx) => {
					if (result.status === "fulfilled") {
						results.created++;
					}
					else {
						results.failed++;
						// Get hole name from PlannedHoleNm property or use fallback
						const holeName = batch[idx].PlannedHoleNm
						  || batch[idx].DrillPattern
						  || `Plan ${i + idx + 1}`;
						results.errors.push({
							holeName,
							error: result.reason?.message || "Unknown error",
						});
					}
				});

				setCreationProgress({
					current: Math.min(i + batchSize, previewPlans.length),
					total: previewPlans.length,
				});

				// Small delay between batches to avoid overwhelming the server
				if (i + batchSize < previewPlans.length) {
					await new Promise(resolve => setTimeout(resolve, 100));
				}
			}

			setCreationResults(results);

			// Show results
			if (results.created > 0) {
				message.success(`Successfully created ${results.created} drill plan${results.created !== 1 ? "s" : ""}`);

				if (results.failed > 0) {
					message.warning(`${results.failed} plan${results.failed !== 1 ? "s" : ""} failed to create`);
				}

				// Call success callback after a short delay to allow user to see final result
				setTimeout(() => {
					onSuccess();
					handleClose();
				}, 2000);
			}
			else {
				message.error("Failed to create any drill plans");
			}
		}
		catch (error: any) {
			console.error("[BulkCreateModal] Error during bulk creation:", error);
			message.error(`Bulk creation error: ${error.message}`);
		}
		finally {
			setIsCreating(false);
		}
	};

	const handleClose = () => {
		// Reset state
		setCurrentStep(0);
		setSelectedPattern(null);
		setPreviewPlans([]);
		setValidationWarnings([]);
		setPreviewNames([]);
		setCreationResults(null);
		setCreationProgress({ current: 0, total: 0 });

		onClose();
	};

	const handleNext = () => {
		if (currentStep === 0 && !selectedPattern) {
			message.warning("Please select a pattern first");
			return;
		}

		if (currentStep === 2) {
			handleGeneratePreview();
		}
		else {
			setCurrentStep(currentStep + 1);
		}
	};

	const handleBack = () => {
		setCurrentStep(currentStep - 1);
	};

	const steps = [
		{
			title: "Pattern",
			icon: <ThunderboltOutlined />,
			content: (
				<div style={{ padding: "24px 0" }}>
					<PatternSelector
						value={selectedPattern?.DrillPatternId}
						onChange={handlePatternSelect}
					/>
				</div>
			),
		},
		{
			title: "Grid",
			content: (
				<div style={{ padding: "24px 0" }}>
					<GridConfigForm
						value={gridConfig}
						onChange={setGridConfig}
						pattern={selectedPattern}
					/>
				</div>
			),
		},
		{
			title: "Naming",
			content: (
				<div style={{ padding: "24px 0" }}>
					<NamingConfigForm
						value={namingConfig}
						onChange={setNamingConfig}
						previewNames={previewNames}
					/>
				</div>
			),
		},
		{
			title: "Preview",
			icon: currentStep === 3 && validationWarnings.some(w => w.severity === "error")
				? <WarningOutlined />
				: currentStep === 3
					? <CheckCircleOutlined />
					: undefined,
			content: (
				<div style={{ padding: "24px 0" }}>
					<BulkPreviewGrid
						plans={previewPlans}
						validationWarnings={validationWarnings}
					/>
				</div>
			),
		},
	];

	const hasErrors = validationWarnings.some(w => w.severity === "error");
	const canCreate = currentStep === 3 && previewPlans.length > 0 && !hasErrors;

	return (
		<Modal
			title={(
				<Space>
					<ThunderboltOutlined style={{ color: "#1890ff" }} />
					<span>Bulk Create Drill Plans from Pattern</span>
				</Space>
			)}
			open={visible}
			onCancel={handleClose}
			width={1000}
			footer={null}
			destroyOnClose
		>
			<div style={{ minHeight: "500px" }}>
				<Steps
					current={currentStep}
					style={{ marginBottom: "32px" }}
					items={steps.map(step => ({
						title: step.title,
						icon: step.icon,
					}))}
				/>

				<div style={{ minHeight: "350px" }}>
					{steps[currentStep].content}
				</div>

				{isCreating && (
					<div style={{ marginTop: "24px" }}>
						<Progress
							percent={Math.round((creationProgress.current / creationProgress.total) * 100)}
							status="active"
							format={() => `${creationProgress.current} / ${creationProgress.total}`}
						/>
					</div>
				)}

				{creationResults && (
					<div style={{ marginTop: "24px" }}>
						<Space direction="vertical" style={{ width: "100%" }}>
							{creationResults.created > 0 && (
								<div style={{ color: "#52c41a" }}>
									✓ Successfully created:
									{" "}
									{creationResults.created}
								</div>
							)}
							{creationResults.failed > 0 && (
								<div style={{ color: "#ff4d4f" }}>
									✗ Failed:
									{" "}
									{creationResults.failed}
								</div>
							)}
						</Space>
					</div>
				)}

				<div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between" }}>
					<div>
						{currentStep > 0 && !isCreating && (
							<Button onClick={handleBack}>
								Back
							</Button>
						)}
					</div>

					<Space>
						<Button onClick={handleClose} disabled={isCreating}>
							Cancel
						</Button>

						{currentStep < steps.length - 1
							? (
								<Button
									type="primary"
									onClick={handleNext}
									disabled={!selectedPattern}
								>
									Next
								</Button>
							)
							: (
								<Button
									type="primary"
									onClick={handleBulkCreate}
									loading={isCreating}
									disabled={!canCreate || isCreating}
									icon={<ThunderboltOutlined />}
								>
									{isCreating
										? `Creating ${creationProgress.current}/${creationProgress.total}...`
										: `Create ${previewPlans.length} Plan${previewPlans.length !== 1 ? "s" : ""}`}
								</Button>
							)}
					</Space>
				</div>
			</div>
		</Modal>
	);
};
