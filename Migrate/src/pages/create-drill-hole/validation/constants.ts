/**
 * Mining Industry Standard Bounds and Constants
 *
 * Based on B2Gold operations and general mining industry practices.
 * Used for validation across all drill-hole sections.
 */

// ============================================================================
// Depth Bounds (meters)
// ============================================================================

/**
 * Drill hole depth constraints based on typical mining operations
 */
export const DEPTH_BOUNDS = {
	/** Absolute maximum depth for drill holes - extreme deep drilling */
	MAX: 5000,

	/** Depth requiring additional review - deep drilling territory */
	WARNING: 3000,

	/** Typical exploration drilling depth */
	TYPICAL: 500,

	/** Minimum valid depth interval */
	MIN_INTERVAL: 0.01,
} as const;

// ============================================================================
// Angle Bounds (degrees)
// ============================================================================

/**
 * Angular measurements for drill orientation and geological features
 */
export const ANGLE_BOUNDS = {
	/** Azimuth: horizontal angle measured clockwise from north (0-360°) */
	AZIMUTH: { min: 0, max: 360 },

	/**
	 * Dip: vertical angle from horizontal plane (-90° to +90°)
	 * Negative = upward drilling, Positive = downward drilling
	 * -90° = straight up, 0° = horizontal, +90° = straight down
	 */
	DIP: { min: -90, max: 90 },

	/**
	 * Alpha: apparent dip angle measured perpendicular to core axis (0-90°)
	 * Used for structural measurements in oriented core
	 */
	ALPHA: { min: 0, max: 90 },

	/** Strike: azimuth direction of a horizontal line on an inclined plane (0-360°) */
	STRIKE: { min: 0, max: 360 },

	/** Plunge: angle of linear feature measured from horizontal (0-90°) */
	PLUNGE: { min: 0, max: 90 },
} as const;

// ============================================================================
// Percentage Bounds
// ============================================================================

/**
 * Percentage constraints for various measurements
 */
export const PERCENTAGE_BOUNDS = {
	/** Standard percentage range for most measurements (0-100%) */
	STANDARD: { min: 0, max: 100 },

	/**
	 * Core recovery percentage - can exceed 100% due to core swelling or broken ground
	 * Values >100% indicate recovered core length exceeds drilled interval
	 */
	RECOVERY: { min: 0, max: 110 },

	/** Unusual recovery threshold - values >105% should be reviewed */
	RECOVERY_WARNING: 105,
} as const;

// ============================================================================
// Geology Bounds
// ============================================================================

/**
 * Geological logging measurements and constraints
 */
export const GEOLOGY_BOUNDS = {
	/**
	 * Alteration mineral percentages (0-100%)
	 * Represents visual estimate of alteration intensity
	 */
	ALTERATION_PCT: { min: 0, max: 100 },

	/** Vein percentages - estimated volume % of interval (0-100%) */
	VEIN_PCT: { min: 0, max: 100 },

	/**
	 * Vein thickness measurements (centimeters)
	 * Warning at 100cm = 1m (unusually thick vein)
	 */
	VEIN_THICKNESS: {
		max: 1000, // 10 meters absolute max
		warning: 100, // 1 meter is unusual
	},

	/**
	 * Mineral intensity percentages (0-100%)
	 * Visual estimate of mineral abundance
	 */
	MINERAL_PCT: { min: 0, max: 100 },
} as const;

// ============================================================================
// Geotech Bounds
// ============================================================================

/**
 * Geotechnical measurements for rock quality and core recovery
 */
export const GEOTECH_BOUNDS = {
	/**
	 * Core recovery percentage (0-110%)
	 * >100% possible due to swelling/broken ground
	 */
	RECOVERY_PCT: { min: 0, max: 110 },

	/**
	 * Rock Quality Designation (RQD) percentage (0-100%)
	 * % of core pieces >10cm in length / total interval length
	 * <25% = Very poor, 25-50% = Poor, 50-75% = Fair, 75-90% = Good, 90-100% = Excellent
	 */
	RQD_PCT: {
		min: 0,
		max: 100,
		VERY_POOR: 25,
		POOR: 50,
		FAIR: 75,
		GOOD: 90,
	},

	/**
	 * Magnetic susceptibility (SI units x 10^-5)
	 * Typical range: 0-100,000; >10,000 indicates highly magnetic rock
	 */
	MAG_SUS: {
		min: 0,
		max: 100000,
		warning: 10000, // Highly magnetic threshold
	},

	/**
	 * Unconfined Compressive Strength (UCS) in MPa
	 * Rock strength classification
	 */
	UCS: {
		min: 0,
		VERY_WEAK: 1, // <1 MPa
		WEAK: 5, // 1-5 MPa
		MODERATE: 25, // 5-25 MPa
		STRONG: 50, // 25-50 MPa
		VERY_STRONG: 100, // 50-100 MPa
		EXTREMELY_STRONG: 250, // >100 MPa
	},

	/**
	 * Poisson's Ratio - elastic property of rock (dimensionless)
	 * Typical range: 0.15-0.35 for most rocks
	 * Warning at >0.45 (unusual, approaching incompressible)
	 */
	POISSONS_RATIO: {
		min: 0,
		max: 0.5, // Theoretical maximum for isotropic materials
		typical_min: 0.15,
		typical_max: 0.35,
		warning: 0.45,
	},

	/**
	 * Fracture count per interval
	 * >100 fractures suggests highly fractured/poor rock quality
	 */
	FRACTURE_COUNT: {
		min: 0,
		warning: 100, // Highly fractured
	},

	/** Degree of offset for oriented core (0-360°) */
	DEGREE_OF_OFFSET: { min: 0, max: 360 },
} as const;

// ============================================================================
// Sample Bounds
// ============================================================================

/**
 * Sample collection and measurement constraints
 */
export const SAMPLE_BOUNDS = {
	/**
	 * Sample interval length (meters)
	 * Minimum: 1cm (0.01m) - for point samples or very detailed sampling
	 * Maximum: 50m - for bulk samples or wide-spaced sampling
	 * Typical: 1m - standard exploration sampling
	 */
	INTERVAL: {
		min: 0.01,
		max: 50,
		typical: 1,
		warning: 5, // >5m intervals are uncommon in detailed exploration
	},

	/**
	 * Sample weight (kilograms)
	 * Warning at 50kg (heavy sample, handling concerns)
	 * Maximum: 500kg (bulk samples)
	 */
	WEIGHT: {
		min: 0,
		max: 500,
		warning: 50,
	},

	/** Rod number range for drill core boxes */
	ROD_NUMBER: { min: 1, max: 9999 },

	/** Priority levels (0-255) */
	PRIORITY: { min: 0, max: 255 },
} as const;

// ============================================================================
// Date Constraints
// ============================================================================

/**
 * Date validation rules for historical data
 */
export const DATE_CONSTRAINTS = {
	/** Historical dates cannot be in the future */
	MAX_FUTURE_DAYS: 0,

	/** Warn if date is more than 50 years in the past (data quality check) */
	MIN_HISTORICAL_YEARS: 50,
} as const;

// ============================================================================
// Coordinate Bounds (Project-Specific)
// ============================================================================

/**
 * Coordinate system bounds - should be configured per project
 * These are reasonable defaults for most mining projects
 */
export const COORDINATE_BOUNDS = {
	/** Easting/Northing ranges (meters) - typical local grid */
	LOCAL_GRID: {
		min: -1000000,
		max: 10000000,
	},

	/** Elevation/RL ranges (meters above/below sea level) */
	ELEVATION: {
		min: -500, // Below sea level (open pit mining)
		max: 5000, // High altitude operations
		warning_low: 0,
		warning_high: 3000,
	},

	/** Latitude range (decimal degrees) */
	LATITUDE: { min: -90, max: 90 },

	/** Longitude range (decimal degrees) */
	LONGITUDE: { min: -180, max: 180 },
} as const;

// ============================================================================
// Status Code Ranges
// ============================================================================

/**
 * Standard status and validation codes (tinyint 0-255)
 */
export const STATUS_CODES = {
	/** Validation status: 0=Unknown, 1=Passed, 2=Failed */
	VALIDATION: { UNKNOWN: 0, PASSED: 1, FAILED: 2 },

	/** Row status: 0=Draft, 1=Complete, etc. (defined in RowStatus lookup) */
	ROW_STATUS: { min: 0, max: 255 },

	/** Priority levels */
	PRIORITY: { min: 0, max: 255 },
} as const;

// ============================================================================
// String Length Constraints
// ============================================================================

/**
 * Standard string length constraints matching database schema
 */
export const STRING_LENGTHS = {
	/** Organization code */
	ORGANIZATION: 30,

	/** Hole name */
	HOLE_NAME: 50,

	/** Lookup codes */
	LOOKUP_CODE: 50,

	/** Project/Prospect names */
	PROJECT: 100,

	/** Comments (short) */
	COMMENTS_SHORT: 1000,

	/** Comments (long) */
	COMMENTS_LONG: 5000,

	/** Data source */
	DATA_SOURCE: 255,

	/** Validation errors */
	VALIDATION_ERRORS: 4000,
} as const;
