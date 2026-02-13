/**
 * Create Drill Hole - Section Components Export
 *
 * All 24 section components for data entry workflow.
 */

// Setup Sections (2)
export { RigSheetSection } from "./RigSheetSection";
export { CollarSection } from "./CollarSection";

// Geology Log Sections (3)
export { ShearLogSection } from "./ShearLogSection";
export { StructureLogSection } from "./StructureLogSection";
// GeoCombinedLog - TODO: Create main geology combined log section

// Geotech Sections (7)
export { CoreRecoveryRunLogSection } from "./CoreRecoveryRunLogSection";
export { FractureCountLogSection } from "./FractureCountLogSection";
export { MagSusLogSection } from "./MagSusLogSection";
export { RockMechanicLogSection } from "./RockMechanicLogSection";
export { RockQualityDesignationLogSection } from "./RockQualityDesignationLogSection";
export { SpecificGravityPtLogSection } from "./SpecificGravityPtLogSection";
// Structure (duplicate of StructureLog above)

// Sampling Sections (4)
export { SampleSection } from "./SampleSection";
export { DispatchSection } from "./DispatchSection";
export { CycloneCleaningSection } from "./CycloneCleaningSection";
// LabResults - Uses visual-mapper for imports

// Other Sections
export { QaqcSection } from "./QaqcSection";
export { DrillMethodSection } from "./DrillMethodSection";
export { SurveySection } from "./SurveySection";
export { LoggingSection } from "./LoggingSection";
export { QuickLogSection } from "./QuickLogSection";
export { DrillPlanSection } from "./DrillPlanSection";
