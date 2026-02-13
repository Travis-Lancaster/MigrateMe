/**
 * Validation Module Exports
 *
 * Centralized exports for all drill-hole validation schemas and helpers.
 * Organized by category for easy imports.
 */

// ============================================================================
// Constants
// ============================================================================

export * from "./base-schemas";

// ============================================================================
// Base Schemas & Helpers
// ============================================================================

// Keep these for gradual migration from old validators
export { createLookupSchema } from "./base-schemas";
// CollarCoordinate
export * from "./collar-coordinate.validation";

// ============================================================================
// Core DrillHole Sections
// ============================================================================

// Collar
export * from "./collar.validation";

export * from "./constants";

export * from "./geology.validation";

export * from "./geotech.validation";

// MetaData
export * from "./metadata.validation";

// ============================================================================
// Geology Sections
// ============================================================================

// Sample
export * from "./sample.validation";

// ============================================================================
// Geotech Sections
// ============================================================================

// Survey
export * from "./survey.validation";

// ============================================================================
// Legacy Exports (for backward compatibility)
// ============================================================================

export * from "./validation-helpers";

// Re-export common Zod schemas that are used frequently
export { z } from "zod";
