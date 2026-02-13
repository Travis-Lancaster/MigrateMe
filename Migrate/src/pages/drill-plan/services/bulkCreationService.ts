/**
 * Bulk Creation Service
 *
 * Handles coordinate calculation and drill plan generation for bulk creation from patterns.
 * Calculates grid-based coordinates with rotation based on pattern orientation.
 */

import type { DrillPattern } from "#src/api/database/data-contracts";
import type { CreateDrillPlanDto } from "../types";

export interface Coordinates {
	easting: number
	northing: number
}

export interface GridPosition {
	row: number
	col: number
}

export interface GridDimensions {
	rows: number
	columns: number
}

export interface DrillHolePosition extends Coordinates {
	row: number
	col: number
	gridLabel: string // e.g., "R01C05"
}

export interface NamingConfig {
	type: "sequential" | "grid"
	prefix: string
	startNumber?: number
}

export interface GridConfig {
	rows: number
	columns: number
	originEasting: number
	originNorthing: number
	originRL: number
}

export interface BulkCreateConfig {
	pattern: DrillPattern
	gridConfig: GridConfig
	namingConfig: NamingConfig
	commonFields?: Partial<CreateDrillPlanDto>
	skipPositions?: GridPosition[]
}

export interface ValidationWarning {
	type: "duplicate" | "coordinate" | "field"
	message: string
	severity: "error" | "warning"
}

export interface ValidationResult {
	isValid: boolean
	warnings: ValidationWarning[]
}

class BulkCreationService {
	/**
	 * Calculate drill hole coordinates for a rectangular grid pattern
	 * with rotation based on pattern orientation
	 */
	calculateGridCoordinates(
		origin: Coordinates,
		dimensions: GridDimensions,
		pattern: DrillPattern,
		skipPositions: GridPosition[] = [],
	): DrillHolePosition[] {
		const positions: DrillHolePosition[] = [];
		const spacingX = pattern.SpacingX || 25; // Default 25m
		const spacingY = pattern.SpacingY || 25; // Default 25m
		const orientation = pattern.Orientation || 0; // Default 0° (north)

		// Convert orientation to radians
		const angleRad = (orientation * Math.PI) / 180;

		// Pre-calculate trig values
		const cosAngle = Math.cos(angleRad);
		const sinAngle = Math.sin(angleRad);

		for (let row = 0; row < dimensions.rows; row++) {
			for (let col = 0; col < dimensions.columns; col++) {
				// Check if this position should be skipped
				if (skipPositions.some(skip => skip.row === row && skip.col === col)) {
					continue;
				}

				// Calculate offset from origin
				const offsetX = col * spacingX;
				const offsetY = row * spacingY;

				// Apply rotation transformation
				const rotatedX = offsetX * cosAngle - offsetY * sinAngle;
				const rotatedY = offsetX * sinAngle + offsetY * cosAngle;

				// Calculate final coordinates
				const easting = origin.easting + rotatedX;
				const northing = origin.northing + rotatedY;

				// Generate grid label (1-based for display)
				const gridLabel = `R${String(row + 1).padStart(2, "0")}C${String(col + 1).padStart(2, "0")}`;

				positions.push({
					row,
					col,
					easting,
					northing,
					gridLabel,
				});
			}
		}

		return positions;
	}

	/**
	 * Generate sequential or grid-based hole names
	 */
	generateHoleNames(config: NamingConfig, count: number): string[] {
		const names: string[] = [];

		if (config.type === "sequential") {
			const startNum = config.startNumber || 1;
			for (let i = 0; i < count; i++) {
				const num = String(startNum + i).padStart(3, "0");
				names.push(`${config.prefix}${num}`);
			}
		}
		else if (config.type === "grid") {
			// For grid naming, we need positions - handled in createPlanDTOs
			for (let i = 0; i < count; i++) {
				names.push(`${config.prefix}${i}`); // Placeholder
			}
		}

		return names;
	}

	/**
	 * Generate hole names based on grid positions
	 */
	generateGridBasedNames(prefix: string, positions: DrillHolePosition[]): string[] {
		return positions.map(pos => `${prefix}${pos.gridLabel}`);
	}

	/**
	 * Create drill plan DTOs from calculated positions
	 */
	createPlanDTOs(
		positions: DrillHolePosition[],
		names: string[],
		pattern: DrillPattern,
		config: BulkCreateConfig,
	): CreateDrillPlanDto[] {
		const { originRL } = config.gridConfig;
		const commonFields = config.commonFields || {};

		return positions.map((pos, idx) => {
			const basePlan: CreateDrillPlanDto = {
				// From pattern
				Organization: pattern.Organization,
				DrillPattern: pattern.DrillPattern,
				Target: pattern.Target,
				PlannedAzimuth: pattern.Orientation,

				// From position
				PlannedEasting: pos.easting,
				PlannedNorthing: pos.northing,
				PlannedRL: originRL,

				// Hole name - set directly on DTO
				PlannedHoleNm: names[idx],

				// Common fields
				...commonFields,

				// Required fields with defaults
				DataSource: commonFields.DataSource || "Bulk Creation",
				Project: commonFields.Project || pattern.Organization,
				DrillPriority: commonFields.DrillPriority || 5,
			};

			return basePlan;
		});
	}

	/**
	 * Validate bulk creation configuration
	 */
	validateConfig(config: BulkCreateConfig, existingHoleNames?: string[]): ValidationResult {
		const warnings: ValidationWarning[] = [];

		// Check grid dimensions
		if (config.gridConfig.rows < 1 || config.gridConfig.rows > 100) {
			warnings.push({
				type: "field",
				message: "Grid rows must be between 1 and 100",
				severity: "error",
			});
		}

		if (config.gridConfig.columns < 1 || config.gridConfig.columns > 100) {
			warnings.push({
				type: "field",
				message: "Grid columns must be between 1 and 100",
				severity: "error",
			});
		}

		// Calculate total holes
		const totalHoles = config.gridConfig.rows * config.gridConfig.columns - (config.skipPositions?.length || 0);

		if (totalHoles > 500) {
			warnings.push({
				type: "field",
				message: `Creating ${totalHoles} drill plans may take several minutes. Consider creating smaller batches.`,
				severity: "warning",
			});
		}

		// Check for duplicate names
		if (existingHoleNames && existingHoleNames.length > 0) {
			const namingConfig = config.namingConfig;

			// Generate sample names to check
			const sampleCount = Math.min(10, totalHoles);
			const sampleNames = config.namingConfig.type === "sequential"
				? this.generateHoleNames(namingConfig, sampleCount)
				: [];

			const duplicates = sampleNames.filter(name => existingHoleNames.includes(name));

			if (duplicates.length > 0) {
				warnings.push({
					type: "duplicate",
					message: `Some generated hole names may already exist: ${duplicates.slice(0, 3).join(", ")}${duplicates.length > 3 ? "..." : ""}`,
					severity: "warning",
				});
			}
		}

		// Check coordinates are reasonable
		const origin = { easting: config.gridConfig.originEasting, northing: config.gridConfig.originNorthing };

		if (origin.easting < 100000 || origin.easting > 900000) {
			warnings.push({
				type: "coordinate",
				message: "Origin easting coordinate may be outside valid range",
				severity: "warning",
			});
		}

		if (origin.northing < 1000000 || origin.northing > 9000000) {
			warnings.push({
				type: "coordinate",
				message: "Origin northing coordinate may be outside valid range",
				severity: "warning",
			});
		}

		// Check pattern has required fields
		if (!config.pattern.SpacingX || !config.pattern.SpacingY) {
			warnings.push({
				type: "field",
				message: "Pattern is missing spacing configuration",
				severity: "error",
			});
		}

		const hasErrors = warnings.some(w => w.severity === "error");

		return {
			isValid: !hasErrors,
			warnings,
		};
	}

	/**
	 * Preview hole names without calculating coordinates
	 */
	previewHoleNames(config: BulkCreateConfig, count: number = 10): string[] {
		if (config.namingConfig.type === "sequential") {
			return this.generateHoleNames(config.namingConfig, count);
		}
		else {
			// Grid-based preview
			const positions: DrillHolePosition[] = [];
			let generated = 0;

			for (let row = 0; row < config.gridConfig.rows && generated < count; row++) {
				for (let col = 0; col < config.gridConfig.columns && generated < count; col++) {
					const gridLabel = `R${String(row + 1).padStart(2, "0")}C${String(col + 1).padStart(2, "0")}`;
					positions.push({
						row,
						col,
						easting: 0,
						northing: 0,
						gridLabel,
					});
					generated++;
				}
			}

			return this.generateGridBasedNames(config.namingConfig.prefix, positions);
		}
	}
}

export const bulkCreationService = new BulkCreationService();
export default bulkCreationService;
