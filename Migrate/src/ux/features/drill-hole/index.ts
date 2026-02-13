/**
 * Drill Hole Module
 *
 * Comprehensive drill hole data entry system with:
 * - LiveQuery for reactive data from Dexie
 * - Zustand for UI state management
 * - Offline-first architecture
 * - Multiple sections (Collar, DrillMethod, Survey, Geology, Sample, etc.)
 *
 * Architecture:
 * - Data Layer: Dexie + LiveQuery (single source of truth)
 * - UI Layer: Zustand (UI state only)
 * - Operations: Repository pattern via hooks
 */

// Components
export * from "./components";

// Constants
export * from "./constants";

// Hooks
export * from "./hooks";

// Sections
export * from "./sections";

// Store (UI state only)
export * from "./store";

// Types
export * from "./types";
