/**
 * Section Factory
 *
 * Creates section store slices without duplication. Each section gets:
 * - Data management
 * - Validation (legacy single-tier or new two-tier)
 * - RowStatus state machine
 * - Dirty tracking
 *
 * Usage:
 *   // Legacy single-tier validation
 *   const collarSection = createSectionStore({ sectionKey: 'collar', validate: validateCollar, initialData: [] })
 *
 *   // New two-tier validation
 *   const collarSection = createSectionStore({
 *     sectionKey: 'collar',
 *     validators: { database: validateDatabase, save: validateSave },
 *     initialData: []
 *   })
 */

import type { RowMetadata } from "#src/lib/db/dexie";
import type { DrillHoleSection, StandardRowMetadata, ValidationError, ValidationResult } from "#src/types/drillhole";
import type {
	DatabaseValidationError,
	SaveValidationError,
	TwoTierValidationResult,
} from "#src/types/validation";
// import type { StateCreator } from 'zustand';
import { canTransition, RowStatus } from "#src/types/drillhole";
import { ValidationType } from "#src/types/validation";

// Cache for validation results to avoid redundant Zod parsing
const validationCache = new WeakMap<any, { dataRef: any, result: ValidationResult | TwoTierValidationResult }>();

/**
 * Validator function type - takes data and returns validation result (legacy)
 */
export type ValidatorFunction<TData> = (data: TData) => ValidationResult;

/**
 * Database validator function - performs hard validation that blocks saves
 */
export type DatabaseValidatorFunction<TData> = (data: TData) => DatabaseValidationError[];

/**
 * Save validator function - performs soft validation that warns but doesn't block saves
 */
export type SaveValidatorFunction<TData> = (data: TData) => SaveValidationError[];

/**
 * Two-tier validator interface containing both database and save validators
 */
export interface TwoTierValidator<TData> {
	database: DatabaseValidatorFunction<TData>
	save: SaveValidatorFunction<TData>
}

/**
 * Section store slice interface
 *
 * Phase 2: Added generic constraints for better type safety
 * - TData must be an object or array (prevents primitive types like string, number)
 * - TValidation defaults to ValidationResult
 * - Using 'object' constraint allows API interfaces without index signatures
 */
export interface SectionStore<
	TData = object,
	TValidation = ValidationResult | TwoTierValidationResult,
> extends DrillHoleSection<TData, TValidation> {
	// Additional methods for store management
	initialize: (data: TData, rowStatus?: RowStatus, rowVersion?: string) => void
	markClean: () => void
	markDirty: () => void

	// Row-level tracking (for array sections only)
	isArray?: boolean
	rowMetadata?: Record<string, RowMetadata>
	dirtyRowIds?: string[]
	staleRowIds?: string[]

	// Metadata management
	metadata: Partial<StandardRowMetadata>
	getMetadata: () => Partial<StandardRowMetadata>
	updateMetadata: (updates: Partial<StandardRowMetadata>) => void
}

/**
 * Section factory options
 *
 * @template TData - The data type for this section
 */
export interface SectionFactoryOptions<TData> {
	/** Unique key for this section */
	sectionKey: string

	/** Legacy validation function (single-tier) - for backward compatibility */
	validate?: ValidatorFunction<TData>

	/** New two-tier validators (database and save) */
	validators?: TwoTierValidator<TData>

	/** Initial/default data - must match TData shape or be a factory function */
	initialData: TData | (() => TData)

	/** Section keys this section depends on (for cross-section updates) */
	dependencies?: string[]

	/** Initial row status */
	initialStatus?: RowStatus
}

/**
 * Feature flag for two-tier validation
 * Set to true to enable two-tier validation behavior
 */
const FEATURE_TWO_TIER_VALIDATION = true;

/**
 * Execute two-tier validation on data
 *
 * Runs database validation first (hard validation that blocks saves).
 * If database validation passes, runs save validation (soft validation with warnings).
 * Combines results into a TwoTierValidationResult.
 *
 * @template TData - The data type being validated
 * @param data - The data to validate
 * @param validators - Two-tier validator functions
 * @returns Complete two-tier validation result
 */
export function executeTwoTierValidation<TData>(
	data: TData,
	validators: TwoTierValidator<TData>,
): TwoTierValidationResult {
	// Step 1: Run database validation (hard validation)
	const databaseErrors = validators.database(data);
	const databaseIsValid = databaseErrors.length === 0;

	// Step 2: Run save validation (soft validation)
	// Always run save validation to provide complete feedback
	const saveErrors = validators.save(data);

	// Separate errors from warnings based on severity
	const saveErrorsList = saveErrors.filter(err => err.severity === "error");
	const saveWarningsList = saveErrors.filter(err => err.severity === "warning");
	const saveIsValid = saveErrors.length === 0;

	// Step 3: Compute overall status
	// canSave is true ONLY if database validation passes
	const canSave = databaseIsValid;

	// validationStatus: 0=Unknown, 1=Passed, 2=Failed
	// Based on database validation only
	const validationStatus: 0 | 1 | 2 = databaseIsValid ? 1 : 2;

	return {
		database: {
			isValid: databaseIsValid,
			errors: databaseErrors,
		},
		save: {
			isValid: saveIsValid,
			errors: saveErrorsList,
			warnings: saveWarningsList,
		},
		canSave,
		validationStatus,
	};
}

/**
 * Adapter to convert legacy single-tier validator to two-tier format
 *
 * Maps legacy ValidationResult to TwoTierValidationResult:
 * - All errors become database errors (blocking)
 * - All warnings become save warnings (non-blocking)
 *
 * @template TData - The data type being validated
 * @param legacyValidator - Legacy validator function
 * @returns Two-tier validator adapter
 */
function createLegacyValidatorAdapter<TData>(
	legacyValidator: ValidatorFunction<TData>,
): TwoTierValidator<TData> {
	return {
		database: (data: TData): DatabaseValidationError[] => {
			const result = legacyValidator(data);

			// Convert legacy errors to database errors
			return (result.errors || []).map(err => ({
				field: err.field,
				message: err.message,
				code: err.code,
				type: ValidationType.Database,
				severity: "error" as const,
				blocking: true as const,
			}));
		},
		save: (data: TData): SaveValidationError[] => {
			const result = legacyValidator(data);

			// Convert legacy warnings to save warnings
			return (result.warnings || []).map(warn => ({
				field: warn.field,
				message: warn.message,
				code: warn.code,
				type: ValidationType.Save,
				severity: "warning" as const,
				blocking: false as const,
			}));
		},
	};
}

/**
 * Create a section store slice
 *
 * This is the core factory that eliminates code duplication.
 * Instead of writing custom stores for each section, just declare them.
 *
 * Supports both legacy single-tier validation and new two-tier validation:
 * - If 'validators' provided: Use two-tier validation (database + save)
 * - If 'validate' provided: Use legacy single-tier validation (backward compatible)
 *
 * @template TData - The data type for this section
 * @returns A Zustand store slice for the section
 */
export function createSectionStore<TData>(
	options: SectionFactoryOptions<TData>,
): SectionStore<TData, ValidationResult | TwoTierValidationResult> {
	const {
		sectionKey,
		validate: validateFn,
		validators: twoTierValidators,
		initialData,
		dependencies = [],
		initialStatus = RowStatus.Draft,
	} = options;

	// Validation setup: determine which validation approach to use
	if (!validateFn && !twoTierValidators) {
		throw new Error(
			`Section '${sectionKey}' requires either 'validate' (legacy) or 'validators' (two-tier)`,
		);
	}

	// Decide which validator to use based on feature flag and what's provided
	const useTwoTierValidation = FEATURE_TWO_TIER_VALIDATION && twoTierValidators !== undefined;

	// Create the actual validator to use
	const actualValidators: TwoTierValidator<TData> = useTwoTierValidation
		? twoTierValidators! // Use provided two-tier validators
		: createLegacyValidatorAdapter(validateFn!); // Adapt legacy validator

	// Support lazy initialization for complex defaults
	const getInitialData = (): TData => {
		const result = typeof initialData === "function" ? (initialData as () => TData)() : initialData;
		return result;
	};

	const initialDataValue = getInitialData();

	// Detect if this is an array section
	const isArraySection = Array.isArray(initialDataValue);

	return {
		// State
		sectionKey,
		data: (isArraySection ? [...(initialDataValue as any[])] : { ...(initialDataValue as object) }) as TData,
		validation: null,
		rowStatus: initialStatus,
		isDirty: false,
		isStale: false,
		rowVersion: undefined,

		// Row-level tracking (for array sections)
		...(isArraySection && {
			isArray: true,
			rowMetadata: {},
			dirtyRowIds: [],
			staleRowIds: [],
		}),

		// Metadata
		metadata: {
			ReportIncludeInd: false,
			ValidationStatus: 0,
			ValidationErrors: null,
			RowStatus: initialStatus,
			SupersededById: null,
			ActiveInd: true,
			CreatedOnDt: new Date(),
			CreatedBy: "",
			ModifiedOnDt: new Date(),
			ModifiedBy: "",
			rv: "",
		} as Partial<StandardRowMetadata>,

		// Data management
		getData() {
			return this.data;
		},

		setData(partialData: Partial<TData>) {
			console.log(`🔧 [SECTION-FACTORY] setData called for ${sectionKey}:`, {
				isDirtyBefore: this.isDirty,
				partialDataKeys: Object.keys(partialData).slice(0, 10),
			});
			// Replace the entire data object (immer-friendly)
			this.data = { ...this.data, ...partialData } as TData;
			this.isDirty = true;
			console.log(`🔧 [SECTION-FACTORY] setData completed for ${sectionKey}:`, {
				isDirtyAfter: this.isDirty,
			});
		},

		resetData() {
			const resetData = getInitialData();
			this.data = (Array.isArray(resetData) ? [...(resetData as any[])] : { ...(resetData as object) }) as TData;
			this.isDirty = false;
			validationCache.delete(this); // Clear cache on reset
		},

		// Status management
		getRowStatus() {
			return this.rowStatus;
		},

		setRowStatus(newStatus: RowStatus): boolean {
			if (!canTransition(this.rowStatus, newStatus)) {
				console.warn(
					`Invalid RowStatus transition: ${this.rowStatus} -> ${newStatus} for section ${sectionKey}`,
				);
				return false;
			}
			this.rowStatus = newStatus;
			return true;
		},

		// Validation
		validate() {
			// Return cached result if data reference hasn't changed
			const cached = validationCache.get(this);
			if (cached && cached.dataRef === this.data) {
				return cached.result;
			}

			// Execute validation based on mode
			// NOTE: Validation is now a pure function - no side effects
			// Metadata updates happen during save operations, not during validation
			let validationResult: ValidationResult | TwoTierValidationResult;

			if (useTwoTierValidation) {
				// Use two-tier validation
				validationResult = executeTwoTierValidation(this.data, actualValidators);
			}
			else {
				// Use legacy single-tier validation (backward compatible)
				if (!validateFn) {
					throw new Error(
						`Section '${sectionKey}' validation failed: validateFn is not defined but useTwoTierValidation is false`,
					);
				}
				validationResult = validateFn(this.data);
			}

			// Cache the result with current data reference
			validationCache.set(this, {
				dataRef: this.data,
				result: validationResult,
			});

			return validationResult;
		},

		getValidationErrors(): string[] {
			const validation = this.validate();

			// Handle both legacy and two-tier validation results
			if ("database" in validation) {
				// Two-tier validation result
				const twoTierResult = validation as TwoTierValidationResult;
				const allErrors = [
					...twoTierResult.database.errors,
					...twoTierResult.save.errors,
					...twoTierResult.save.warnings,
				];
				return allErrors.map(err => err.message);
			}
			else {
				// Legacy validation result
				const legacyResult = validation as ValidationResult;
				return legacyResult?.errors?.map(err => err.message) || [];
			}
		},

		isValid(): boolean {
			const validation = this.validate();

			// Handle both legacy and two-tier validation results
			if ("database" in validation) {
				// Two-tier validation: valid if database validation passes
				const twoTierResult = validation as TwoTierValidationResult;
				return twoTierResult.database.isValid;
			}
			else {
				// Legacy validation result
				const legacyResult = validation as ValidationResult;
				return legacyResult?.isValid || false;
			}
		},

		// State queries
		isEditable(): boolean {
			// Only Draft status allows editing
			return this.rowStatus === RowStatus.Draft;
		},

		hasUnsavedChanges(): boolean {
			return this.isDirty;
		},

		// Dependencies
		getDependencies() {
			return dependencies;
		},

		// Store management methods
		initialize(data: TData, rowStatus: RowStatus = RowStatus.Draft, rowVersion?: string) {
			this.data = (Array.isArray(data) ? [...(data as any[])] : { ...(data as object) }) as TData;
			this.rowStatus = rowStatus;
			this.rowVersion = rowVersion;
			this.isDirty = false;
			this.validation = null;
			validationCache.delete(this); // Clear cache on initialize
		},

		markClean() {
			console.log(`🧹 [SECTION-FACTORY] markClean() called for ${sectionKey}:`, {
				isDirtyBefore: this.isDirty,
				hasUnsavedChangesBefore: this.hasUnsavedChanges(),
			});
			this.isDirty = false;
			console.log(`✅ [SECTION-FACTORY] markClean() completed for ${sectionKey}:`, {
				isDirtyAfter: this.isDirty,
				hasUnsavedChangesAfter: this.hasUnsavedChanges(),
			});
		},

		markDirty() {
			console.log(`📝 [SECTION-FACTORY] markDirty() called for ${sectionKey}:`, {
				isDirtyBefore: this.isDirty,
			});
			this.isDirty = true;
			console.log(`📝 [SECTION-FACTORY] markDirty() completed for ${sectionKey}:`, {
				isDirtyAfter: this.isDirty,
			});
		},

		// Metadata management methods
		getMetadata() {
			return this.metadata || {};
		},

		updateMetadata(updates: Partial<StandardRowMetadata>) {
			// Immer-compatible: Replace the entire object rather than mutating properties
			this.metadata = { ...this.metadata, ...updates };
		},
	};
}

/**
 * Helper to create a simple validator that always passes
 * Useful for sections that don't need validation yet
 */
export function createPassthroughValidator<TData>(): ValidatorFunction<TData> {
	return (data: TData): ValidationResult => ({
		isValid: true,
		errors: [],
	});
}

/**
 * Helper to create a validator from Zod schema
 *
 * @param schema - Zod schema
 * @returns Validator function
 */
export function createZodValidator<TData>(
	schema: { safeParse: (data: TData) => { success: boolean, error?: any } },
): ValidatorFunction<TData> {
	return (data: TData): ValidationResult => {
		const result = schema.safeParse(data);

		if (result.success) {
			return {
				isValid: true,
				errors: [],
			};
		}

		// Convert Zod errors to our ValidationError format
		console.log("� Zod validation failed:", {
			hasError: !!result.error,
			errorIssues: result.error?.issues,
			errorErrors: result.error?.errors,
		});

		const zodIssues = result.error?.issues || result.error?.errors || [];
		const errors: ValidationError[] = zodIssues.map((err: any) => ({
			field: err.path.join("."),
			message: err.message,
			code: err.code,
		}));

		console.log("� Converted errors:", errors);

		return {
			isValid: false,
			errors,
		};
	};
}

/**
 * Helper to combine multiple validators
 * Runs all validators and combines errors
 */
export function combineValidators<TData>(
	...validators: ValidatorFunction<TData>[]
): ValidatorFunction<TData> {
	return (data: TData): ValidationResult => {
		const results = validators.map(validator => validator(data));

		const allErrors = results.flatMap(r => r.errors);
		const allWarnings = results.flatMap(r => r.warnings || []);

		return {
			isValid: allErrors.length === 0,
			errors: allErrors,
			warnings: allWarnings.length > 0 ? allWarnings : undefined,
		};
	};
}
