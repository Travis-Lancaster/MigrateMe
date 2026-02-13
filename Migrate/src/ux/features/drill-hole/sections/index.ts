/**
 * Drill Hole Sections
 *
 * Section components for the drill hole detail page.
 * Each section uses the LiveQuery pattern for reactive data.
 */

// Single-object sections (form-based)
// export { CollarSection } from '../views/CollarSection';

// Array sections (grid-based)
export { DrillMethodSection } from "../../drill-method/DrillMethodSection";

// Template for creating new sections
export { default as SectionTemplate } from "./SectionTemplate";

// Additional sections to be implemented:
// export { SurveySection } from './SurveySection';
// export { GeologySection } from './GeologySection';
// export { SampleSection } from './SampleSection';
