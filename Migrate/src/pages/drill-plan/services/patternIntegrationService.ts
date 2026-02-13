/**
 * Pattern Integration Service
 *
 * Handles integration between DrillPattern and DrillPlan.
 * Provides field mapping, random name generation, and pattern application logic.
 */

import type { DrillPattern } from "#src/api/database/data-contracts";

class PatternIntegrationService {
	private readonly LAST_PATTERN_KEY = "lastUsedDrillPattern";

	/**
	 * Generate a random hole name
	 * Format: DH_TIMESTAMP_RANDOM
	 * Example: DH_L8X9K2_A7B3
	 */
	generateRandomHoleName(): string {
		const prefix = "DH";
		const timestamp = Date.now().toString(36).toUpperCase();
		const random = Math.random().toString(36).substring(2, 6).toUpperCase();
		return `${prefix}_${timestamp}_${random}`;
	}

	/**
	 * Apply pattern fields to drill plan data
	 * Maps pattern fields to plan fields and marks which fields came from pattern
	 */
	applyPatternToPlan(pattern: DrillPattern, existingData: any = {}): any {
		console.log("[PatternIntegrationService] Applying pattern to plan:", pattern.DrillPattern);

		return {
			...existingData,
			// Direct mappings
			DrillPattern: pattern.DrillPattern,
			Organization: pattern.Organization,
			Target: pattern.Target,

			// Field mappings
			// Map Orientation to PlannedAzimuth
			PlannedAzimuth: pattern.Orientation,

			// Pattern metadata for UI tracking
			_patternApplied: true,
			_patternId: pattern.DrillPatternId,
			_patternName: pattern.DrillPattern,
			_patternFields: [
				"DrillPattern",
				"Organization",
				"Target",
				"PlannedAzimuth",
			],
		};
	}

	/**
	 * Get the last used pattern ID from localStorage
	 */
	getLastUsedPattern(): string | null {
		try {
			return localStorage.getItem(this.LAST_PATTERN_KEY);
		}
		catch (error) {
			console.error("[PatternIntegrationService] Failed to get last pattern:", error);
			return null;
		}
	}

	/**
	 * Save the last used pattern ID to localStorage
	 */
	setLastUsedPattern(patternId: string): void {
		try {
			localStorage.setItem(this.LAST_PATTERN_KEY, patternId);
			console.log("[PatternIntegrationService] Saved last used pattern:", patternId);
		}
		catch (error) {
			console.error("[PatternIntegrationService] Failed to save last pattern:", error);
		}
	}

	/**
	 * Clear the last used pattern from localStorage
	 */
	clearLastUsedPattern(): void {
		try {
			localStorage.removeItem(this.LAST_PATTERN_KEY);
			console.log("[PatternIntegrationService] Cleared last used pattern");
		}
		catch (error) {
			console.error("[PatternIntegrationService] Failed to clear last pattern:", error);
		}
	}

	/**
	 * Preview which fields will be populated from a pattern
	 * Returns array of human-readable field descriptions
	 */
	previewPatternFields(pattern: DrillPattern): string[] {
		const fields: string[] = [];

		if (pattern.Organization) {
			fields.push(`Organization: ${pattern.Organization}`);
		}
		if (pattern.Target) {
			fields.push(`Target: ${pattern.Target}`);
		}
		if (pattern.Orientation != null) {
			fields.push(`Planned Azimuth: ${pattern.Orientation}° (from Orientation)`);
		}
		if (pattern.SpacingX != null) {
			fields.push(`Spacing X: ${pattern.SpacingX} m (reference)`);
		}
		if (pattern.SpacingY != null) {
			fields.push(`Spacing Y: ${pattern.SpacingY} m (reference)`);
		}

		return fields;
	}

	/**
	 * Check if form data has pattern metadata
	 */
	hasPatternMetadata(data: any): boolean {
		return data?._patternApplied === true;
	}

	/**
	 * Get pattern field names that were auto-populated
	 */
	getPatternFieldNames(data: any): string[] {
		return data?._patternFields || [];
	}

	/**
	 * Remove pattern metadata from form data before submission
	 */
	cleanFormData(data: any): any {
		const cleaned = { ...data };
		delete cleaned._patternApplied;
		delete cleaned._patternId;
		delete cleaned._patternName;
		delete cleaned._patternFields;
		return cleaned;
	}

	/**
	 * Validate that a pattern is suitable for drill plan creation
	 */
	validatePattern(pattern: DrillPattern): { valid: boolean, errors: string[] } {
		const errors: string[] = [];

		if (!pattern.Organization) {
			errors.push("Pattern must have an Organization");
		}
		if (!pattern.Target) {
			errors.push("Pattern must have a Target");
		}

		return {
			valid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Calculate coordinates based on pattern spacing (optional advanced feature)
	 * Can be used for bulk drill plan creation from patterns
	 */
	calculateCoordinatesFromPattern(
		pattern: DrillPattern,
		baseEasting: number,
		baseNorthing: number,
		rowIndex: number,
		colIndex: number,
	): { easting: number, northing: number } {
		const spacingX = pattern.SpacingX || 0;
		const spacingY = pattern.SpacingY || 0;
		const orientation = pattern.Orientation || 0;

		// Convert orientation to radians
		const angleRad = (orientation * Math.PI) / 180;

		// Calculate offsets
		const offsetX = colIndex * spacingX;
		const offsetY = rowIndex * spacingY;

		// Apply rotation
		const rotatedX = offsetX * Math.cos(angleRad) - offsetY * Math.sin(angleRad);
		const rotatedY = offsetX * Math.sin(angleRad) + offsetY * Math.cos(angleRad);

		return {
			easting: baseEasting + rotatedX,
			northing: baseNorthing + rotatedY,
		};
	}
}

export const patternIntegrationService = new PatternIntegrationService();
