/**
 * Error Utility Functions
 *
 * Provides utility functions for consistent error handling across the application.
 */

import { message as antMessage } from "antd";
import {
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

/**
 * Parse an API error response into an ApplicationError
 */
export function parseApiError(error: any, context?: Record<string, any>): ApplicationError {
	console.log("[FLOW:error-utils] [ACTION] Parsing API error", { error, context });

	// Already an ApplicationError
	if (error instanceof ApplicationError) {
		return error;
	}

	// Ky HTTPError or similar
	if (error.response) {
		const statusCode = error.response.status;
		const url = error.response.url;
		const method = error.request?.method;

		// Try to extract error message from response
		let message = error.message || "Network request failed";
		let responseData: any;

		try {
			// Attempt to get JSON response
			if (error.response.json) {
				responseData = error.response.json();
			}
			else if (error.response.data) {
				responseData = error.response.data;
			}

			// Extract message from various response formats
			if (responseData) {
				message
					= responseData.message
					  || responseData.error
					  || responseData.detail
					  || message;
			}
		}
		catch (e) {
			// Response body not JSON, use default message
		}

		// Map status codes to specific error types
		if (statusCode === 400) {
			// Check if it's a validation error
			if (responseData?.errors && typeof responseData.errors === "object") {
				return new ValidationError(
					message || "Validation failed",
					responseData.errors,
					{ context, cause: error },
				);
			}
			return new ValidationError(message || "Invalid request", {}, { context, cause: error });
		}

		if (statusCode === 401) {
			return new AuthenticationError(message, { context, cause: error });
		}

		if (statusCode === 403) {
			return new AuthorizationError(message, { context, cause: error });
		}

		if (statusCode === 404) {
			const resourceType = context?.resourceType || "Resource";
			const resourceId = context?.resourceId;
			return new NotFoundError(resourceType, resourceId, { context, cause: error });
		}

		if (statusCode === 408) {
			const timeoutMs = context?.timeoutMs || 30000;
			return new TimeoutError(message, timeoutMs, { context, cause: error });
		}

		if (statusCode === 409) {
			const conflictType = context?.conflictType || "other";
			return new ConflictError(message, conflictType, { context, cause: error });
		}

		if (statusCode === 422) {
			if (responseData?.errors && typeof responseData.errors === "object") {
				return new ValidationError(
					message || "Validation failed",
					responseData.errors,
					{ context, cause: error },
				);
			}
			return new ValidationError(message || "Invalid data", {}, { context, cause: error });
		}

		if (statusCode >= 500) {
			return new DatabaseError(message, "other", { context, cause: error });
		}

		// Generic network error for other status codes
		return new NetworkError(message, {
			statusCode,
			url,
			method,
			responseData,
			context,
			cause: error,
		});
	}

	// Network connectivity error
	if (error.name === "TypeError" && error.message.includes("fetch")) {
		return new NetworkError("Network connection failed", {
			statusCode: 0,
			context,
			cause: error,
		});
	}

	// Timeout error
	if (error.name === "AbortError" || error.message?.includes("timeout")) {
		return new TimeoutError(
			error.message || "Request timed out",
			context?.timeoutMs || 30000,
			{ context, cause: error },
		);
	}

	// Generic application error
	return new ApplicationError(
		error.message || "An unexpected error occurred",
		"UNKNOWN_ERROR",
		{
			context,
			cause: error,
		},
	);
}

/**
 * Log error with appropriate level and context
 */
export function logError(
	error: Error | ApplicationError,
	context?: Record<string, any>,
): void {
	const errorData: Record<string, any> = {
		name: error.name,
		message: error.message,
		stack: error.stack,
		timestamp: new Date().toISOString(),
		...context,
	};

	// Add ApplicationError specific data
	if (error instanceof ApplicationError) {
		errorData.code = error.code;
		errorData.statusCode = error.statusCode;
		errorData.userMessage = error.userMessage;
		errorData.context = error.context;
	}

	// Log at appropriate level
	if (error instanceof ValidationError) {
		console.warn("[FLOW:error-utils] [VALIDATION] Validation error", errorData);
	}
	else if (error instanceof NetworkError) {
		if (error.isConnectionError()) {
			console.error("[FLOW:error-utils] [ERROR] Connection error", errorData);
		}
		else if (error.isServerError()) {
			console.error("[FLOW:error-utils] [ERROR] Server error", errorData);
		}
		else {
			console.warn("[FLOW:error-utils] [ERROR] Network error", errorData);
		}
	}
	else if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
		console.warn("[FLOW:error-utils] [ERROR] Auth error", errorData);
	}
	else {
		console.error("[FLOW:error-utils] [ERROR] Application error", errorData);
	}

	// Send to error tracking service (e.g., Sentry) in production
	if (process.env.NODE_ENV === "production") {
		// TODO: Send to error tracking service
		// Sentry.captureException(error, { extra: errorData });
	}
}

/**
 * Handle error with logging and user notification
 */
export function handleError(
	error: Error | ApplicationError,
	options: {
		/** Custom user message to display */
		userMessage?: string
		/** Whether to show toast notification */
		showToast?: boolean
		/** Additional context for logging */
		context?: Record<string, any>
		/** Callback after error is handled */
		onError?: (error: ApplicationError) => void
	} = {},
): ApplicationError {
	console.log("[FLOW:error-utils] [ACTION] Handling error", {
		errorType: error.name,
		showToast: options.showToast ?? true,
	});

	// Parse into ApplicationError if needed
	const appError = error instanceof ApplicationError
		? error
		: parseApiError(error, options.context);

	// Log the error
	logError(appError, options.context);

	// Show user notification
	if (options.showToast !== false) {
		const userMsg = options.userMessage || appError.getUserMessage();

		if (appError instanceof ValidationError) {
			antMessage.warning(userMsg);
		}
		else if (appError instanceof NetworkError && appError.isConnectionError()) {
			antMessage.error("Network connection lost. Please check your connection.");
		}
		else if (appError instanceof AuthenticationError) {
			antMessage.error("Authentication required. Please log in.");
		}
		else if (appError instanceof AuthorizationError) {
			antMessage.error("Access denied. You do not have permission.");
		}
		else {
			antMessage.error(userMsg);
		}
	}

	// Call custom error handler
	if (options.onError) {
		options.onError(appError);
	}

	return appError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: Error | ApplicationError): boolean {
	if (error instanceof NetworkError) {
		// Retry connection errors and server errors
		return error.isConnectionError() || error.isServerError();
	}

	if (error instanceof TimeoutError) {
		return true;
	}

	if (error instanceof ApplicationError) {
		// Retry 5xx errors
		return (error.statusCode || 0) >= 500;
	}

	return false;
}

/**
 * Format error for display to user
 */
export function formatErrorForUser(error: Error | ApplicationError): string {
	console.log("[FLOW:error-utils] [ACTION] Formatting error for user", {
		errorType: error.name,
	});

	if (error instanceof ApplicationError) {
		return error.getUserMessage();
	}

	// Fallback for regular errors
	return error.message || "An unexpected error occurred";
}

/**
 * Extract validation errors for form fields
 */
export function getValidationErrors(
	error: Error | ApplicationError,
): Record<string, string[]> | null {
	if (error instanceof ValidationError) {
		return error.errors;
	}

	return null;
}

/**
 * Check if error is a specific type
 */
export function isErrorType<T extends ApplicationError>(
	error: any,
	errorClass: new (...args: any[]) => T,
): error is T {
	return error instanceof errorClass;
}

/**
 * Create a safe error handler for async operations
 */
export function createSafeHandler<T extends any[], R>(
	fn: (...args: T) => Promise<R>,
	options: {
		context?: Record<string, any>
		onError?: (error: ApplicationError) => void
		showToast?: boolean
	} = {},
): (...args: T) => Promise<R | null> {
	return async (...args: T): Promise<R | null> => {
		try {
			console.log("[FLOW:error-utils] [ACTION] Executing safe handler");
			return await fn(...args);
		}
		catch (error) {
			console.log("[FLOW:error-utils] [ERROR] Safe handler caught error");
			handleError(error as Error, options);
			return null;
		}
	};
}

/**
 * Wrap a function with error boundary
 */
export function withErrorBoundary<T extends any[], R>(
	fn: (...args: T) => R,
	options: {
		context?: Record<string, any>
		fallback?: R
		onError?: (error: ApplicationError) => void
	} = {},
): (...args: T) => R {
	return (...args: T): R => {
		try {
			return fn(...args);
		}
		catch (error) {
			console.error("[FLOW:error-utils] [ERROR] Error boundary caught error");
			handleError(error as Error, {
				context: options.context,
				onError: options.onError,
			});

			if (options.fallback !== undefined) {
				return options.fallback;
			}

			throw error;
		}
	};
}

/**
 * Create a retry wrapper for functions
 */
export function withRetry<T extends any[], R>(
	fn: (...args: T) => Promise<R>,
	options: {
		maxRetries?: number
		retryDelay?: number
		shouldRetry?: (error: Error, attempt: number) => boolean
		onRetry?: (error: Error, attempt: number) => void
	} = {},
): (...args: T) => Promise<R> {
	const maxRetries = options.maxRetries || 3;
	const retryDelay = options.retryDelay || 1000;
	const shouldRetry = options.shouldRetry || isRetryableError;

	return async (...args: T): Promise<R> => {
		let lastError: Error | null = null;

		for (let attempt = 0; attempt <= maxRetries; attempt++) {
			try {
				console.log("[FLOW:error-utils] [ACTION] Retry attempt", {
					attempt,
					maxRetries,
				});

				return await fn(...args);
			}
			catch (error) {
				lastError = error as Error;

				console.log("[FLOW:error-utils] [DECISION] Checking if should retry", {
					attempt,
					maxRetries,
					errorType: lastError.name,
				});

				// Don't retry if we've exhausted attempts
				if (attempt >= maxRetries) {
					console.error("[FLOW:error-utils] [ERROR] Max retries reached", {
						attempt,
						maxRetries,
					});
					break;
				}

				// Check if error is retryable
				if (!shouldRetry(lastError, attempt)) {
					console.log("[FLOW:error-utils] [DECISION] Error not retryable, stopping");
					break;
				}

				console.log("[FLOW:error-utils] [ACTION] Retrying after delay", {
					retryDelay,
					attempt,
				});

				// Call retry callback
				if (options.onRetry) {
					options.onRetry(lastError, attempt);
				}

				// Wait before retrying (exponential backoff)
				await new Promise(resolve =>
					setTimeout(resolve, retryDelay * 2 ** attempt),
				);
			}
		}

		// If we get here, all retries failed
		throw lastError;
	};
}

/**
 * Assert a condition and throw an error if it fails
 */
export function assert(
	condition: any,
	message: string,
	ErrorClass: new (...args: any[]) => ApplicationError = ApplicationError,
): asserts condition {
	if (!condition) {
		console.error("[FLOW:error-utils] [ERROR] Assertion failed", { message });
		throw new ErrorClass(message, "ASSERTION_ERROR");
	}
}

/**
 * Get error chain (original error and all causes)
 */
export function getErrorChain(error: Error | ApplicationError): Error[] {
	const chain: Error[] = [error];

	let current = error;
	while (current instanceof ApplicationError && current.cause) {
		chain.push(current.cause);
		current = current.cause;
	}

	return chain;
}

/**
 * Format error chain for logging
 */
export function formatErrorChain(error: Error | ApplicationError): string {
	const chain = getErrorChain(error);
	return chain
		.map((err, index) => {
			const indent = "  ".repeat(index);
			return `${indent}${index > 0 ? "Caused by: " : ""}${err.name}: ${err.message}`;
		})
		.join("\n");
}
