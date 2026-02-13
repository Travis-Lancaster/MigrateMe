/**
 * Section Keys Enum
 *
 * Defines all available drill hole sections for type-safe section identification.
 */

export enum SectionKey {
	DrillPlan = "drillplan",
	Collar = "collar",
	CollarCoordinates = "collarcoordinates",
	RigSheet = "rigsheet",
	DrillMethod = "drillmethod",
	Survey = "survey",
	QuickLog = "quicklog",
	Logging = "logging",
	GeoCombinedLog = "geocombined",
	Sample = "sample",
	Dispatch = "dispatch",
	Qaqc = "qaqc",
	CycloneCleaning = "cyclonecleaning",
	ShearLog = "shearlog",
	StructureLog = "structurelog",
	CoreRecoveryRunLog = "corerecoveryrunlog",
	FractureCountLog = "fracturecountlog",
	MagSusLog = "magsuslog",
	RockMechanicLog = "rockmechaniclog",
	RockQualityDesignationLog = "rockqualitydesignationlog",
	SpecificGravityPtLog = "specificgravityptlog",
}

/**
 * Array section keys - sections that store data as arrays (grid-based)
 */
export type ArraySectionKey
	= | "drillmethod"
	  | "surveylog"
	  | "geocombined"
	  | "sample";

/**
 * Object section keys - sections that store data as single objects (form-based)
 */
export type ObjectSectionKey
	= | "drillplan"
	  | "collar"
	  | "collarcoordinates"
	  | "rigsheet"
	  | "dispatch"
	  | "qaqc";
