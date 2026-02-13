/**
 * Logging Types and Constants
 *
 * Provides TypeScript types and constants for consistent flow-based logging.
 *
 * CRITICAL: Always use direct console.log/console.error/console.warn calls.
 * DO NOT wrap in functions as it breaks line number tracking in browser devtools.
 *
 * @example
 * // Good - preserves line numbers
 * console.log('[FLOW:drill-program-list] [ACTION] Loading programs', { userId });
 *
 * // Bad - loses line numbers (DO NOT DO THIS)
 * logger.log('Loading programs'); // ❌
 */

/**
 * Log Levels
 *
 * Use these constants in your log messages for consistency and easy filtering.
 */
export const LogLevel = {
	/** User actions (clicks, navigation, form submission) */
	ACTION: "[ACTION]",

	/** Decision points and conditional logic */
	DECISION: "[DECISION]",

	/** API calls and responses */
	API: "[API]",

	/** Validation checks and results */
	VALIDATION: "[VALIDATION]",

	/** State changes */
	STATE: "[STATE]",

	/** Navigation events */
	NAV: "[NAV]",

	/** Performance measurements */
	PERF: "[PERF]",

	/** Errors and failures */
	ERROR: "[ERROR]",

	/** Warnings */
	WARN: "[WARN]",

	/** Debug information (verbose) */
	DEBUG: "[DEBUG]",
} as const;

export type LogLevelType = typeof LogLevel[keyof typeof LogLevel];

/**
 * Flow Names
 *
 * Use these constants for flow names to ensure consistency across the codebase.
 * Add new flow names here as modules are developed.
 */
export const FlowName = {
	// Drill Program Module
	DRILL_PROGRAM_LIST: "drill-program-list",
	DRILL_PROGRAM_DETAIL: "drill-program-detail",
	DRILL_PROGRAM_FORM: "drill-program-form",
	DRILL_PROGRAM_SERVICE: "drill-program-service",

	// Drill Pattern Module
	DRILL_PATTERN_LIST: "drill-pattern-list",
	DRILL_PATTERN_DETAIL: "drill-pattern-detail",
	DRILL_PATTERN_FORM: "drill-pattern-form",
	DRILL_PATTERN_SERVICE: "drill-pattern-service",

	// Drill Plan Module
	DRILL_PLAN_LIST: "drill-plan-list",
	DRILL_PLAN_DETAIL: "drill-plan-detail",
	DRILL_PLAN_FORM: "drill-plan-form",
	DRILL_PLAN_SERVICE: "drill-plan-service",

	// Drill Hole Module
	DRILL_HOLE: "drill-hole",
	DRILL_HOLE_COLLAR: "drill-hole-collar",
	DRILL_HOLE_SURVEY: "drill-hole-survey",
	DRILL_HOLE_SAMPLE: "drill-hole-sample",
	DRILL_HOLE_SERVICE: "drill-hole-service",

	// Shared Components
	ERROR_BOUNDARY: "error-boundary",
	LOADING_SPINNER: "loading-spinner",
	EMPTY_STATE: "empty-state",
	STATUS_BADGE: "status-badge",

	// Shared Hooks
	PAGINATION: "pagination",
	MODAL: "modal",
	DEBOUNCE: "debounce",
	SELECTION: "selection",
	LOCAL_STORAGE: "local-storage",

	// Error Handling
	ERROR: "error",
	ERROR_UTILS: "error-utils",

	// Authentication & Authorization
	AUTH: "auth",
	LOGIN: "login",
	LOGOUT: "logout",

	// Sync & Offline
	SYNC: "sync",
	OFFLINE: "offline",

	// General
	APP: "app",
	ROUTER: "router",
	API: "api",
} as const;

export type FlowNameType = typeof FlowName[keyof typeof FlowName];

/**
 * Create a flow tag string
 *
 * @example
 * const flow = createFlowTag('drill-program-list');
 * console.log(`${flow} ${LogLevel.ACTION} Loading programs`);
 * // Output: [FLOW:drill-program-list] [ACTION] Loading programs
 */
export function createFlowTag(flowName: string): string {
	return `[FLOW:${flowName}]`;
}

/**
 * Create a complete log prefix
 *
 * @example
 * const prefix = createLogPrefix('drill-program-list', LogLevel.ACTION);
 * console.log(prefix, 'Loading programs', { userId: 123 });
 * // Output: [FLOW:drill-program-list] [ACTION] Loading programs { userId: 123 }
 */
export function createLogPrefix(flowName: string, level: LogLevelType): string {
	return `${createFlowTag(flowName)} ${level}`;
}

/**
 * Performance Measurement Helper
 *
 * Use for measuring operation duration without wrapping console.log
 *
 * @example
 * const perfMark = performance.now();
 * // ... do work
 * console.log('[FLOW:api] [PERF] Request completed', {
 *   duration: formatDuration(perfMark),
 * });
 */
export function formatDuration(startTime: number): string {
	const duration = performance.now() - startTime;
	if (duration < 1000) {
		return `${duration.toFixed(0)}ms`;
	}
	return `${(duration / 1000).toFixed(2)}s`;
}

/**
 * Format data size for logging
 *
 * @example
 * console.log('[FLOW:api] [API] Response received', {
 *   size: formatBytes(response.length),
 * });
 */
export function formatBytes(bytes: number): string {
	if (bytes === 0)
		return "0 Bytes";

	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Sanitize sensitive data for logging
 *
 * Removes common sensitive fields from objects before logging.
 *
 * @example
 * const userData = { username: 'john', password: 'secret123', email: 'john@example.com' };
 * console.log('[FLOW:auth] [ACTION] User login', sanitizeForLog(userData));
 * // Output: { username: 'john', email: 'john@example.com', password: '[REDACTED]' }
 */
export function sanitizeForLog<T extends Record<string, any>>(obj: T): T {
	const sensitiveFields = [
		"password",
		"token",
		"accessToken",
		"refreshToken",
		"secret",
		"apiKey",
		"creditCard",
		"ssn",
		"pin",
	];

	const sanitized: Record<string, any> = { ...obj };

	for (const field of sensitiveFields) {
		if (field in sanitized) {
			sanitized[field] = "[REDACTED]";
		}
	}

	return sanitized as T;
}

/**
 * Check if logging is enabled for a specific flow
 *
 * Allows conditional logging based on environment or debug flags.
 *
 * @example
 * if (isLoggingEnabled('drill-program-list')) {
 *   console.log('[FLOW:drill-program-list] [DEBUG] Detailed state', state);
 * }
 */
export function isLoggingEnabled(flowName: string): boolean {
	// Check environment
	if (process.env.NODE_ENV === "production") {
		// In production, only log errors and warnings
		return false;
	}

	// Check localStorage for debug flags
	try {
		const debugFlows = localStorage.getItem("DEBUG_FLOWS");
		if (debugFlows === "*")
			return true;
		if (debugFlows) {
			const flows = debugFlows.split(",").map(f => f.trim());
			return flows.includes(flowName);
		}
	}
	catch (e) {
		// localStorage not available
	}

	// Default: enabled in development
	return true;
}

/**
 * Common log message templates
 *
 * Use these for consistency across the application.
 */
export const LogMessage = {
	// Component Lifecycle
	COMPONENT_MOUNTED: "Component mounted",
	COMPONENT_UNMOUNTED: "Component unmounted",
	COMPONENT_UPDATED: "Component updated",

	// Data Loading
	LOADING_START: "Loading started",
	LOADING_SUCCESS: "Loading completed successfully",
	LOADING_ERROR: "Loading failed",

	// Data Saving
	SAVING_START: "Saving started",
	SAVING_SUCCESS: "Saving completed successfully",
	SAVING_ERROR: "Saving failed",

	// Data Deleting
	DELETING_START: "Deleting started",
	DELETING_SUCCESS: "Deleting completed successfully",
	DELETING_ERROR: "Deleting failed",

	// API Calls
	API_REQUEST_START: "API request started",
	API_REQUEST_SUCCESS: "API request completed",
	API_REQUEST_ERROR: "API request failed",
	API_RETRY: "Retrying API request",

	// User Actions
	USER_CLICK: "User clicked",
	USER_INPUT: "User input changed",
	USER_SUBMIT: "User submitted form",
	USER_CANCEL: "User cancelled",

	// Navigation
	NAV_TO: "Navigating to",
	NAV_BACK: "Navigating back",
	NAV_REDIRECT: "Redirecting to",

	// State Changes
	STATE_UPDATED: "State updated",
	STATE_RESET: "State reset",
	STATE_SYNC: "State synchronized",

	// Validation
	VALIDATION_START: "Validation started",
	VALIDATION_SUCCESS: "Validation passed",
	VALIDATION_ERROR: "Validation failed",

	// Performance
	PERF_START: "Performance measurement started",
	PERF_END: "Performance measurement completed",

	// Cache
	CACHE_HIT: "Cache hit",
	CACHE_MISS: "Cache miss",
	CACHE_SET: "Cache updated",
	CACHE_CLEAR: "Cache cleared",
} as const;

export type LogMessageType = typeof LogMessage[keyof typeof LogMessage];

/**
 * Type for structured log data
 *
 * Use this type when passing data objects to console.log
 */
export interface LogData {
	[key: string]: any
}

/**
 * Console methods available
 */
export const ConsoleMethod = {
	LOG: "log",
	ERROR: "error",
	WARN: "warn",
	INFO: "info",
	DEBUG: "debug",
} as const;

export type ConsoleMethodType = typeof ConsoleMethod[keyof typeof ConsoleMethod];
