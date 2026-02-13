/**
 * Error Handling Exports
 *
 * Centralized error handling for the B2Gold Mining Database application.
 */

// Error Classes
export {
	ApplicationError,
	AuthenticationError,
	AuthorizationError,
	ConflictError,
	DatabaseError,
	NetworkError,
	NotFoundError,
	TimeoutError,
	ValidationError,
} from "./ApplicationError";

// Error Utilities
export {
	assert,
	createSafeHandler,
	formatErrorChain,
	formatErrorForUser,
	getErrorChain,
	getValidationErrors,
	handleError,
	isErrorType,
	isRetryableError,
	logError,
	parseApiError,
	withErrorBoundary,
	withRetry,
} from "./errorUtils";
