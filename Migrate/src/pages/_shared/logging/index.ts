/**
 * Logging System Exports
 *
 * Provides types, constants, and utilities for consistent flow-based logging.
 *
 * CRITICAL: This module does NOT provide wrapper functions for console.log
 * because that would break line number tracking in browser devtools.
 *
 * Instead, use the provided constants and helpers with direct console calls.
 */

export {
	ConsoleMethod,
	createFlowTag,
	createLogPrefix,
	FlowName,
	formatBytes,
	formatDuration,
	isLoggingEnabled,
	LogLevel,
	LogMessage,
	sanitizeForLog,
} from "./loggingTypes";

export type {
	ConsoleMethodType,
	FlowNameType,
	LogData,
	LogLevelType,
	LogMessageType,
} from "./loggingTypes";
