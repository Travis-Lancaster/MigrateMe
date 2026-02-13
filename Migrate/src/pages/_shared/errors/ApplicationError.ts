/**
 * Application Error Classes
 *
 * Provides a hierarchy of error types for consistent error handling across the application.
 * All custom errors extend the base ApplicationError class.
 */

/**
 * Base Application Error
 *
 * All custom application errors should extend this class.
 * Provides consistent structure for error handling.
 */
export class ApplicationError extends Error {
	/**
	 * Error code for programmatic error handling
	 */
	code: string;

	/**
	 * HTTP status code (if applicable)
	 */
	statusCode?: number;

	/**
	 * User-friendly error message
	 */
	userMessage: string;

	/**
	 * Additional context data
	 */
	context?: Record<string, any>;

	/**
	 * Original error that caused this error
	 */
	cause?: Error;

	/**
	 * Timestamp when error occurred
	 */
	timestamp: Date;

	constructor(
		message: string,
		code: string = "APPLICATION_ERROR",
		options: {
			statusCode?: number
			userMessage?: string
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		super(message);

		this.name = "ApplicationError";
		this.code = code;
		this.statusCode = options.statusCode;
		this.userMessage = options.userMessage || message;
		this.context = options.context;
		this.cause = options.cause;
		this.timestamp = new Date();

		// Maintain proper stack trace in V8 engines (Chrome, Node)
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, this.constructor);
		}

		console.error("[FLOW:error] [ERROR] ApplicationError created", {
			code: this.code,
			message: this.message,
			userMessage: this.userMessage,
			statusCode: this.statusCode,
			context: this.context,
		});
	}

	/**
	 * Convert error to JSON for logging or API responses
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			code: this.code,
			message: this.message,
			userMessage: this.userMessage,
			statusCode: this.statusCode,
			context: this.context,
			timestamp: this.timestamp.toISOString(),
			stack: this.stack,
		};
	}

	/**
	 * Get user-friendly error message
	 */
	getUserMessage(): string {
		return this.userMessage;
	}
}

/**
 * Validation Error
 *
 * Thrown when data validation fails.
 */
export class ValidationError extends ApplicationError {
	/**
	 * Validation errors by field
	 */
	errors: Record<string, string[]>;

	constructor(
		message: string,
		errors: Record<string, string[]> = {},
		options: {
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		super(message, "VALIDATION_ERROR", {
			statusCode: 400,
			userMessage: message,
			context: { ...options.context, errors },
			cause: options.cause,
		});

		this.name = "ValidationError";
		this.errors = errors;

		console.error("[FLOW:error] [ERROR] ValidationError created", {
			message,
			errors,
			errorCount: Object.keys(errors).length,
		});
	}

	/**
	 * Check if specific field has errors
	 */
	hasFieldError(field: string): boolean {
		return field in this.errors && this.errors[field].length > 0;
	}

	/**
	 * Get errors for specific field
	 */
	getFieldErrors(field: string): string[] {
		return this.errors[field] || [];
	}

	/**
	 * Get first error for specific field
	 */
	getFirstFieldError(field: string): string | null {
		const fieldErrors = this.getFieldErrors(field);
		return fieldErrors.length > 0 ? fieldErrors[0] : null;
	}

	/**
	 * Get all error messages as flat array
	 */
	getAllMessages(): string[] {
		return Object.values(this.errors).flat();
	}
}

/**
 * Network Error
 *
 * Thrown when network requests fail.
 */
export class NetworkError extends ApplicationError {
	/**
	 * Request URL
	 */
	url?: string;

	/**
	 * HTTP method
	 */
	method?: string;

	/**
	 * Request/Response data
	 */
	requestData?: any;
	responseData?: any;

	constructor(
		message: string,
		options: {
			statusCode?: number
			url?: string
			method?: string
			requestData?: any
			responseData?: any
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		const userMessage = NetworkError.getUserFriendlyMessage(options.statusCode);

		super(message, "NETWORK_ERROR", {
			statusCode: options.statusCode,
			userMessage,
			context: {
				...options.context,
				url: options.url,
				method: options.method,
			},
			cause: options.cause,
		});

		this.name = "NetworkError";
		this.url = options.url;
		this.method = options.method;
		this.requestData = options.requestData;
		this.responseData = options.responseData;

		console.error("[FLOW:error] [ERROR] NetworkError created", {
			message,
			statusCode: this.statusCode,
			url: this.url,
			method: this.method,
		});
	}

	/**
	 * Get user-friendly message based on status code
	 */
	private static getUserFriendlyMessage(statusCode?: number): string {
		if (!statusCode) {
			return "Network request failed. Please check your connection.";
		}

		if (statusCode === 400)
			return "Invalid request. Please check your input.";
		if (statusCode === 401)
			return "Authentication required. Please log in.";
		if (statusCode === 403)
			return "Access denied. You do not have permission.";
		if (statusCode === 404)
			return "Resource not found.";
		if (statusCode === 408)
			return "Request timeout. Please try again.";
		if (statusCode === 409)
			return "Conflict detected. Resource may have been modified.";
		if (statusCode === 422)
			return "Invalid data. Please check your input.";
		if (statusCode === 429)
			return "Too many requests. Please wait and try again.";
		if (statusCode >= 500)
			return "Server error. Please try again later.";

		return "Network request failed. Please try again.";
	}

	/**
	 * Check if error is due to network connectivity
	 */
	isConnectionError(): boolean {
		return !this.statusCode || this.statusCode === 0;
	}

	/**
	 * Check if error is due to authentication
	 */
	isAuthError(): boolean {
		return this.statusCode === 401 || this.statusCode === 403;
	}

	/**
	 * Check if error is a server error
	 */
	isServerError(): boolean {
		return (this.statusCode || 0) >= 500;
	}
}

/**
 * Not Found Error
 *
 * Thrown when a resource is not found.
 */
export class NotFoundError extends ApplicationError {
	/**
	 * Resource type
	 */
	resourceType: string;

	/**
	 * Resource identifier
	 */
	resourceId?: string | number;

	constructor(
		resourceType: string,
		resourceId?: string | number,
		options: {
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		const message = resourceId
			? `${resourceType} with ID '${resourceId}' not found`
			: `${resourceType} not found`;

		const userMessage = resourceId
			? `The ${resourceType.toLowerCase()} you're looking for doesn't exist`
			: `${resourceType} not found`;

		super(message, "NOT_FOUND", {
			statusCode: 404,
			userMessage,
			context: {
				...options.context,
				resourceType,
				resourceId,
			},
			cause: options.cause,
		});

		this.name = "NotFoundError";
		this.resourceType = resourceType;
		this.resourceId = resourceId;

		console.error("[FLOW:error] [ERROR] NotFoundError created", {
			resourceType,
			resourceId,
		});
	}
}

/**
 * Authentication Error
 *
 * Thrown when authentication fails.
 */
export class AuthenticationError extends ApplicationError {
	constructor(
		message: string = "Authentication required",
		options: {
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		super(message, "AUTHENTICATION_ERROR", {
			statusCode: 401,
			userMessage: "Please log in to continue",
			context: options.context,
			cause: options.cause,
		});

		this.name = "AuthenticationError";

		console.error("[FLOW:error] [ERROR] AuthenticationError created", {
			message,
		});
	}
}

/**
 * Authorization Error
 *
 * Thrown when user lacks permissions.
 */
export class AuthorizationError extends ApplicationError {
	/**
	 * Required permission
	 */
	requiredPermission?: string;

	constructor(
		message: string = "Access denied",
		options: {
			requiredPermission?: string
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		super(message, "AUTHORIZATION_ERROR", {
			statusCode: 403,
			userMessage: "You do not have permission to perform this action",
			context: {
				...options.context,
				requiredPermission: options.requiredPermission,
			},
			cause: options.cause,
		});

		this.name = "AuthorizationError";
		this.requiredPermission = options.requiredPermission;

		console.error("[FLOW:error] [ERROR] AuthorizationError created", {
			message,
			requiredPermission: this.requiredPermission,
		});
	}
}

/**
 * Conflict Error
 *
 * Thrown when a conflict is detected (e.g., duplicate, concurrent modification).
 */
export class ConflictError extends ApplicationError {
	/**
	 * Conflict type
	 */
	conflictType: "duplicate" | "concurrent_modification" | "constraint" | "other";

	constructor(
		message: string,
		conflictType: "duplicate" | "concurrent_modification" | "constraint" | "other" = "other",
		options: {
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		const userMessages = {
			duplicate: "This item already exists",
			concurrent_modification: "This item was modified by another user",
			constraint: "This operation violates a constraint",
			other: "A conflict was detected",
		};

		super(message, "CONFLICT_ERROR", {
			statusCode: 409,
			userMessage: userMessages[conflictType],
			context: {
				...options.context,
				conflictType,
			},
			cause: options.cause,
		});

		this.name = "ConflictError";
		this.conflictType = conflictType;

		console.error("[FLOW:error] [ERROR] ConflictError created", {
			message,
			conflictType,
		});
	}
}

/**
 * Timeout Error
 *
 * Thrown when an operation times out.
 */
export class TimeoutError extends ApplicationError {
	/**
	 * Timeout duration in milliseconds
	 */
	timeoutMs: number;

	constructor(
		message: string = "Operation timed out",
		timeoutMs: number,
		options: {
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		super(message, "TIMEOUT_ERROR", {
			statusCode: 408,
			userMessage: "The operation took too long. Please try again.",
			context: {
				...options.context,
				timeoutMs,
			},
			cause: options.cause,
		});

		this.name = "TimeoutError";
		this.timeoutMs = timeoutMs;

		console.error("[FLOW:error] [ERROR] TimeoutError created", {
			message,
			timeoutMs,
		});
	}
}

/**
 * Database Error
 *
 * Thrown when database operations fail.
 */
export class DatabaseError extends ApplicationError {
	/**
	 * Operation that failed
	 */
	operation: "read" | "write" | "delete" | "query" | "transaction" | "other";

	constructor(
		message: string,
		operation: "read" | "write" | "delete" | "query" | "transaction" | "other" = "other",
		options: {
			context?: Record<string, any>
			cause?: Error
		} = {},
	) {
		super(message, "DATABASE_ERROR", {
			statusCode: 500,
			userMessage: "A database error occurred. Please try again.",
			context: {
				...options.context,
				operation,
			},
			cause: options.cause,
		});

		this.name = "DatabaseError";
		this.operation = operation;

		console.error("[FLOW:error] [ERROR] DatabaseError created", {
			message,
			operation,
		});
	}
}
