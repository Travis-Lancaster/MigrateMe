# Error Handling System

Comprehensive error handling infrastructure for the B2Gold Mining Database application with type-safe error classes, utility functions, and consistent error management patterns.

## Features

- **Type-Safe Error Classes**: Hierarchical error types for different scenarios
- **Automatic Error Parsing**: Convert API errors to ApplicationError instances
- **User-Friendly Messages**: Context-appropriate messages for users
- **Flow-Based Logging**: Direct console.log calls preserving line numbers
- **Retry Logic**: Built-in retry support for transient failures
- **Error Tracking**: Ready for integration with services like Sentry
- **Validation Errors**: Structured field-level validation errors
- **Error Recovery**: Safe handlers and error boundaries

---

## Error Class Hierarchy

```
Error (JavaScript base)
  └── ApplicationError (Base for all custom errors)
      ├── ValidationError (Form/data validation)
      ├── NetworkError (HTTP/API errors)
      ├── NotFoundError (Resource not found)
      ├── AuthenticationError (Login required)
      ├── AuthorizationError (Permission denied)
      ├── ConflictError (Duplicates, concurrent edits)
      ├── TimeoutError (Operation timeout)
      └── DatabaseError (DB operation failures)
```

---

## Quick Start

### Basic Error Handling

```tsx
import { handleError, parseApiError } from "#src/pages/_shared/errors";

async function fetchData() {
	try {
		const response = await api.get("/data");
		return response;
	}
	catch (error) {
		// Automatically parse, log, and show user message
		handleError(error, {
			context: { operation: "fetchData" },
		});
		return null;
	}
}
```

### With Custom User Message

```tsx
try {
	await saveDrillProgram(data);
	message.success("Program saved successfully");
}
catch (error) {
	handleError(error, {
		userMessage: "Failed to save drill program. Please try again.",
		context: { programId: data.id },
	});
}
```

### Safe Handler Pattern

```tsx
import { createSafeHandler } from "#src/pages/_shared/errors";

const safeLoadData = createSafeHandler(
	async (id: string) => {
		return await api.getDrillProgram(id);
	},
	{
		context: { operation: "loadDrillProgram" },
		onError: (error) => {
			// Custom error handling
			navigate("/drill-programs");
		},
	}
);

// Usage - returns null on error instead of throwing
const data = await safeLoadData(programId);
if (data) {
	// Process data
}
```

---

## Error Classes

### ApplicationError (Base Class)

Base class for all custom errors. Provides consistent structure.

```tsx
import { ApplicationError } from "#src/pages/_shared/errors";

throw new ApplicationError(
	"Operation failed",
	"OPERATION_ERROR",
	{
		statusCode: 500,
		userMessage: "Something went wrong",
		context: { operation: "save", entityId: 123 },
		cause: originalError,
	}
);
```

**Properties:**
- `code: string` - Error code for programmatic handling
- `statusCode?: number` - HTTP status code
- `userMessage: string` - User-friendly message
- `context?: Record<string, any>` - Additional context
- `cause?: Error` - Original error that caused this
- `timestamp: Date` - When error occurred

**Methods:**
- `toJSON()` - Convert to JSON for logging/API
- `getUserMessage()` - Get user-friendly message

---

### ValidationError

For form and data validation failures.

```tsx
import { ValidationError } from "#src/pages/_shared/errors";

throw new ValidationError(
	"Validation failed",
	{
		name: ["Name is required", "Name must be at least 3 characters"],
		email: ["Email is invalid"],
		startDate: ["Start date must be in the future"],
	},
	{
		context: { formName: "drillProgramForm" },
	}
);
```

**Additional Properties:**
- `errors: Record<string, string[]>` - Field-level errors

**Additional Methods:**
- `hasFieldError(field: string): boolean`
- `getFieldErrors(field: string): string[]`
- `getFirstFieldError(field: string): string | null`
- `getAllMessages(): string[]`

**Usage in Forms:**
```tsx
import { getValidationErrors } from "#src/pages/_shared/errors";

try {
	await form.validateFields();
	await saveData();
}
catch (error) {
	const validationErrors = getValidationErrors(error);
	if (validationErrors) {
		// Set form field errors
		form.setFields(
			Object.entries(validationErrors).map(([field, errors]) => ({
				name: field,
				errors,
			}))
		);
	}
}
```

---

### NetworkError

For HTTP and network-related errors.

```tsx
import { NetworkError } from "#src/pages/_shared/errors";

throw new NetworkError(
	"Failed to fetch drill programs",
	{
		statusCode: 500,
		url: "/api/drill-programs",
		method: "GET",
		requestData: { page: 1 },
		responseData: { error: "Internal server error" },
	}
);
```

**Additional Properties:**
- `url?: string` - Request URL
- `method?: string` - HTTP method
- `requestData?: any` - Request payload
- `responseData?: any` - Response payload

**Additional Methods:**
- `isConnectionError(): boolean` - Check if connectivity issue
- `isAuthError(): boolean` - Check if auth issue (401/403)
- `isServerError(): boolean` - Check if server error (5xx)

**User Messages:**
- `400` → "Invalid request. Please check your input."
- `401` → "Authentication required. Please log in."
- `403` → "Access denied. You do not have permission."
- `404` → "Resource not found."
- `408` → "Request timeout. Please try again."
- `409` → "Conflict detected. Resource may have been modified."
- `422` → "Invalid data. Please check your input."
- `429` → "Too many requests. Please wait and try again."
- `5xx` → "Server error. Please try again later."

---

### NotFoundError

For missing resources.

```tsx
import { NotFoundError } from "#src/pages/_shared/errors";

throw new NotFoundError("DrillProgram", programId, {
	context: { attemptedAction: "view" },
});
// User message: "The drill program you're looking for doesn't exist"
```

**Additional Properties:**
- `resourceType: string` - Type of resource
- `resourceId?: string | number` - Resource identifier

---

### AuthenticationError

For authentication failures.

```tsx
import { AuthenticationError } from "#src/pages/_shared/errors";

throw new AuthenticationError("Session expired", {
	context: { lastActivity: Date.now() },
});
// User message: "Please log in to continue"
// Status code: 401
```

---

### AuthorizationError

For permission/authorization failures.

```tsx
import { AuthorizationError } from "#src/pages/_shared/errors";

throw new AuthorizationError("Cannot delete drill program", {
	requiredPermission: "drillprogram:delete",
	context: { userId, programId },
});
// User message: "You do not have permission to perform this action"
// Status code: 403
```

**Additional Properties:**
- `requiredPermission?: string` - Required permission

---

### ConflictError

For conflicts (duplicates, concurrent modifications, constraints).

```tsx
import { ConflictError } from "#src/pages/_shared/errors";

throw new ConflictError(
	"Program name already exists",
	"duplicate",
	{ context: { name: "Program A" } }
);

throw new ConflictError(
	"Program was modified by another user",
	"concurrent_modification",
	{ context: { programId, lastModified } }
);
```

**Conflict Types:**
- `duplicate` → "This item already exists"
- `concurrent_modification` → "This item was modified by another user"
- `constraint` → "This operation violates a constraint"
- `other` → "A conflict was detected"

---

### TimeoutError

For operation timeouts.

```tsx
import { TimeoutError } from "#src/pages/_shared/errors";

throw new TimeoutError("API request timed out", 30000, {
	context: { url: "/api/drill-programs" },
});
// User message: "The operation took too long. Please try again."
// Status code: 408
```

**Additional Properties:**
- `timeoutMs: number` - Timeout duration

---

### DatabaseError

For database operation failures.

```tsx
import { DatabaseError } from "#src/pages/_shared/errors";

throw new DatabaseError("Failed to save drill program", "write", {
	context: { table: "drill_programs", operation: "INSERT" },
});
```

**Operations:**
- `read` - Read operation failed
- `write` - Write operation failed
- `delete` - Delete operation failed
- `query` - Query execution failed
- `transaction` - Transaction failed
- `other` - Other database error

---

## Utility Functions

### parseApiError

Parse any error into an ApplicationError.

```tsx
import { parseApiError } from "#src/pages/_shared/errors";

try {
	await api.getDrillProgram(id);
}
catch (error) {
	const appError = parseApiError(error, {
		resourceType: "DrillProgram",
		resourceId: id,
	});

	// Now you have a typed ApplicationError
	console.log(appError.code); // 'NOT_FOUND'
	console.log(appError.statusCode); // 404
	console.log(appError.getUserMessage()); // User-friendly message
}
```

**Auto-Detection:**
- HTTP status → Appropriate error class
- Validation responses → `ValidationError`
- Network issues → `NetworkError`
- Timeouts → `TimeoutError`

---

### handleError

Complete error handling: parse, log, notify user.

```tsx
import { handleError } from "#src/pages/_shared/errors";

try {
	await deleteProgram(id);
}
catch (error) {
	const appError = handleError(error, {
		userMessage: "Failed to delete program",
		context: { programId: id },
		onError: (err) => {
			// Custom handling
			if (err instanceof AuthorizationError) {
				navigate("/unauthorized");
			}
		},
	});
}
```

**Options:**
- `userMessage?: string` - Override default user message
- `showToast?: boolean` - Show Ant Design toast (default: true)
- `context?: Record<string, any>` - Additional context
- `onError?: (error) => void` - Custom error handler

**Automatic Actions:**
- Parses error to ApplicationError
- Logs error with context
- Shows appropriate toast notification
- Calls custom error handler if provided

---

### logError

Log error with appropriate level.

```tsx
import { logError } from "#src/pages/_shared/errors";

try {
	await operation();
}
catch (error) {
	logError(error, {
		operation: "saveProgram",
		userId: currentUser.id,
	});
	throw error; // Re-throw if needed
}
```

**Log Levels:**
- `ValidationError` → `console.warn`
- `NetworkError` (connection) → `console.error`
- `NetworkError` (server) → `console.error`
- `NetworkError` (other) → `console.warn`
- `Auth errors` → `console.warn`
- Other errors → `console.error`

**Production:**
- Sends errors to tracking service (Sentry, etc.)

---

### createSafeHandler

Wrap async function with error handling.

```tsx
import { createSafeHandler } from "#src/pages/_shared/errors";

const safeFetchProgram = createSafeHandler(
	async (id: string) => {
		return await api.getDrillProgram(id);
	},
	{
		context: { operation: "fetchProgram" },
		showToast: false, // Don't show automatic toast
		onError: (error) => {
			// Handle specific errors
			if (error instanceof NotFoundError) {
				navigate("/404");
			}
		},
	}
);

// Returns null on error instead of throwing
const program = await safeFetchProgram(id);
if (program) {
	setProgram(program);
}
```

---

### withRetry

Add retry logic to async functions.

```tsx
import { withRetry } from "#src/pages/_shared/errors";

const fetchWithRetry = withRetry(
	async () => {
		return await api.getDrillPrograms();
	},
	{
		maxRetries: 3,
		retryDelay: 1000, // Base delay in ms
		shouldRetry: (error, attempt) => {
			// Custom retry logic
			return error instanceof NetworkError && error.isServerError();
		},
		onRetry: (error, attempt) => {
			console.log(`Retry attempt ${attempt} after error:`, error);
		},
	}
);

const programs = await fetchWithRetry();
```

**Options:**
- `maxRetries?: number` - Max retry attempts (default: 3)
- `retryDelay?: number` - Base delay in ms (default: 1000)
- `shouldRetry?: (error, attempt) => boolean` - Custom retry logic
- `onRetry?: (error, attempt) => void` - Callback on retry

**Default Behavior:**
- Exponential backoff: delay × 2^attempt
- Retries connection errors and server errors (5xx)
- Does NOT retry validation, auth, or not found errors

---

### isRetryableError

Check if error should be retried.

```tsx
import { isRetryableError } from "#src/pages/_shared/errors";

try {
	await operation();
}
catch (error) {
	if (isRetryableError(error)) {
		// Retry the operation
		await retryOperation();
	}
	else {
		// Don't retry, handle error
		handleError(error);
	}
}
```

**Retryable Errors:**
- Connection errors (no network)
- Server errors (5xx)
- Timeout errors

**NOT Retryable:**
- Validation errors (400, 422)
- Authentication errors (401)
- Authorization errors (403)
- Not found errors (404)
- Conflict errors (409)

---

### getValidationErrors

Extract validation errors from any error.

```tsx
import { getValidationErrors } from "#src/pages/_shared/errors";

try {
	await form.submit();
}
catch (error) {
	const validationErrors = getValidationErrors(error);

	if (validationErrors) {
		// Update form with field errors
		Object.entries(validationErrors).forEach(([field, errors]) => {
			form.setFields([{ name: field, errors }]);
		});
	}
	else {
		// Not a validation error
		handleError(error);
	}
}
```

---

### formatErrorForUser

Get user-friendly error message.

```tsx
import { formatErrorForUser } from "#src/pages/_shared/errors";

try {
	await operation();
}
catch (error) {
	const message = formatErrorForUser(error);
	notification.error({ message });
}
```

---

### isErrorType

Type-safe error type checking.

```tsx
import { isErrorType, NotFoundError, ValidationError } from "#src/pages/_shared/errors";

try {
	await operation();
}
catch (error) {
	if (isErrorType(error, NotFoundError)) {
		// TypeScript knows this is NotFoundError
		console.log(error.resourceType);
		console.log(error.resourceId);
	}
	else if (isErrorType(error, ValidationError)) {
		// TypeScript knows this is ValidationError
		console.log(error.errors);
	}
}
```

---

### withErrorBoundary

Wrap synchronous function with error handling.

```tsx
import { withErrorBoundary } from "#src/pages/_shared/errors";

const safeCalculation = withErrorBoundary(
	(a: number, b: number) => {
		if (b === 0)
			throw new Error("Division by zero");
		return a / b;
	},
	{
		fallback: 0, // Return this on error
		context: { operation: "divide" },
	}
);

const result = safeCalculation(10, 0); // Returns 0 instead of throwing
```

---

### assert

Assert conditions with typed errors.

```tsx
import { assert, ValidationError } from "#src/pages/_shared/errors";

function processProgram(program: DrillProgram | null) {
	assert(program !== null, "Program is required", ValidationError);
	// TypeScript knows program is not null here

	assert(
		program.startDate < program.endDate,
		"End date must be after start date",
		ValidationError
	);
}
```

---

### getErrorChain / formatErrorChain

Get or format error causation chain.

```tsx
import { formatErrorChain, getErrorChain } from "#src/pages/_shared/errors";

try {
	await operation();
}
catch (error) {
	const chain = getErrorChain(error);
	console.log("Error chain:", chain);

	const formatted = formatErrorChain(error);
	console.log(formatted);
	// Output:
	// NetworkError: Failed to save
	//   Caused by: ValidationError: Invalid data
	//     Caused by: TypeError: Cannot read property 'name'
}
```

---

## Common Patterns

### Pattern 1: API Request with Error Handling

```tsx
import { handleError } from "#src/pages/_shared/errors";

export function useDrillProgramList() {
	const [programs, setPrograms] = useState<DrillProgram[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchPrograms = async () => {
		setIsLoading(true);
		setError(null);

		try {
			console.log("[FLOW:drill-program-list] [API] Fetching programs");
			const response = await api.getDrillPrograms();
			console.log("[FLOW:drill-program-list] [API] Programs fetched", {
				count: response.length,
			});
			setPrograms(response);
		}
		catch (err) {
			console.log("[FLOW:drill-program-list] [ERROR] Failed to fetch programs");
			const appError = handleError(err, {
				userMessage: "Failed to load drill programs",
				context: { operation: "fetchPrograms" },
			});
			setError(appError.getUserMessage());
		}
		finally {
			setIsLoading(false);
		}
	};

	return { programs, isLoading, error, fetchPrograms };
}
```

### Pattern 2: Form Submission with Validation

```tsx
import { getValidationErrors, handleError, isErrorType, ValidationError } from "#src/pages/_shared/errors";

async function handleSubmit(values: any) {
	try {
		console.log("[FLOW:drill-program-form] [ACTION] Submitting form", { values });

		await saveDrillProgram(values);

		console.log("[FLOW:drill-program-form] [ACTION] Form submitted successfully");
		message.success("Program saved successfully");
		navigate("/drill-programs");
	}
	catch (error) {
		console.log("[FLOW:drill-program-form] [ERROR] Form submission failed");

		// Check if it's a validation error
		if (isErrorType(error, ValidationError)) {
			const validationErrors = getValidationErrors(error);
			if (validationErrors) {
				// Set form field errors
				form.setFields(
					Object.entries(validationErrors).map(([field, errors]) => ({
						name: field,
						errors,
					}))
				);
			}
		}
		else {
			// Other error types
			handleError(error, {
				userMessage: "Failed to save program",
				context: { formValues: values },
			});
		}
	}
}
```

### Pattern 3: Delete with Confirmation

```tsx
import { AuthorizationError, handleError, isErrorType } from "#src/pages/_shared/errors";

async function handleDelete(id: string) {
	try {
		console.log("[FLOW:drill-program-list] [ACTION] Deleting program", { id });

		await deleteDrillProgram(id);

		console.log("[FLOW:drill-program-list] [ACTION] Program deleted");
		message.success("Program deleted successfully");
		fetchPrograms(); // Refresh list
	}
	catch (error) {
		console.log("[FLOW:drill-program-list] [ERROR] Delete failed");

		if (isErrorType(error, AuthorizationError)) {
			handleError(error, {
				userMessage: "You do not have permission to delete this program",
				onError: () => {
					// Optionally navigate away
					navigate("/drill-programs");
				},
			});
		}
		else {
			handleError(error, {
				userMessage: "Failed to delete program",
				context: { programId: id },
			});
		}
	}
}
```

### Pattern 4: Retry with Exponential Backoff

```tsx
import { NetworkError, withRetry } from "#src/pages/_shared/errors";

const fetchProgramsWithRetry = withRetry(
	async () => {
		console.log("[FLOW:drill-program-list] [API] Attempting to fetch programs");
		return await api.getDrillPrograms();
	},
	{
		maxRetries: 3,
		retryDelay: 1000,
		shouldRetry: (error, attempt) => {
			// Only retry server errors and connection issues
			return error instanceof NetworkError
			  && (error.isServerError() || error.isConnectionError());
		},
		onRetry: (error, attempt) => {
			console.log(`[FLOW:drill-program-list] [ACTION] Retry attempt ${attempt}`, {
				error: error.message,
			});
			message.info(`Retrying... (attempt ${attempt})`);
		},
	}
);

// Usage
const programs = await fetchProgramsWithRetry();
```

### Pattern 5: Safe Handler in useEffect

```tsx
import { createSafeHandler } from "#src/pages/_shared/errors";

useEffect(() => {
	const safeLoad = createSafeHandler(
		async () => {
			console.log("[FLOW:drill-program-detail] [ACTION] Loading program");
			const program = await api.getDrillProgram(id);
			setProgram(program);
		},
		{
			context: { programId: id },
			onError: (error) => {
				if (error instanceof NotFoundError) {
					navigate("/404");
				}
			},
		}
	);

	safeLoad();
}, [id]);
```

---

## Best Practices

### 1. Always Use Try-Catch for Async Operations

```tsx
// Good
async function fetchData() {
	try {
		return await api.getData();
	}
	catch (error) {
		handleError(error);
		return null;
	}
}

// Bad - unhandled rejection
async function fetchData() {
	return await api.getData(); // Could throw!
}
```

### 2. Provide Context

```tsx
// Good
handleError(error, {
	context: {
		operation: "saveDrillProgram",
		programId: program.id,
		userId: currentUser.id,
	},
});

// Bad - no context
handleError(error);
```

### 3. Use Specific Error Types

```tsx
// Good
if (duplicate) {
	throw new ConflictError("Program name already exists", "duplicate");
}

// Bad
if (duplicate) {
	throw new Error("Duplicate");
}
```

### 4. Provide User-Friendly Messages

```tsx
// Good
handleError(error, {
	userMessage: "Failed to save drill program. Please check your input and try again.",
});

// Bad
handleError(error, {
	userMessage: error.message, // Technical message
});
```

### 5. Log Before Throwing

```tsx
// Good
console.log("[FLOW:service] [ERROR] Failed to save", { error, data });
throw new DatabaseError("Save failed", "write");

// Also Good - handleError logs automatically
handleError(error, { context: { data } });
```

### 6. Use Type Guards

```tsx
// Good
if (isErrorType(error, ValidationError)) {
	// TypeScript knows error is ValidationError
	console.log(error.errors);
}

// Bad
if (error instanceof ValidationError) {
	// Manual type check
}
```

### 7. Don't Swallow Errors

```tsx
// Bad
try {
	await operation();
}
catch (error) {
	// Error silently swallowed
}

// Good
try {
	await operation();
}
catch (error) {
	logError(error); // At minimum, log it
}
```

---

## Integration with Existing Code

### Update API Request Hook

```tsx
// Before
// After
import { ApplicationError, parseApiError } from "#src/pages/_shared/errors";

export function useApiRequest<T>(apiFunc: () => Promise<T>) {
	const [error, setError] = useState<Error | null>(null);

	const execute = async () => {
		try {
			return await apiFunc();
		}
		catch (err) {
			setError(err as Error);
			throw err;
		}
	};
}

export function useApiRequest<T>(apiFunc: () => Promise<T>) {
	const [error, setError] = useState<ApplicationError | null>(null);

	const execute = async () => {
		try {
			return await apiFunc();
		}
		catch (err) {
			const appError = parseApiError(err);
			setError(appError);
			throw appError;
		}
	};
}
```

### Update Service Functions

```tsx
// Before
// After
import { handleError, NotFoundError } from "#src/pages/_shared/errors";

export async function getDrillProgram(id: string): Promise<DrillProgram> {
	const response = await ky.get(`/api/drill-programs/${id}`).json();
	return response as DrillProgram;
}

export async function getDrillProgram(id: string): Promise<DrillProgram> {
	try {
		console.log("[FLOW:drill-program-service] [API] Fetching program", { id });
		const response = await ky.get(`/api/drill-programs/${id}`).json();
		console.log("[FLOW:drill-program-service] [API] Program fetched");
		return response as DrillProgram;
	}
	catch (error) {
		console.log("[FLOW:drill-program-service] [ERROR] Failed to fetch program");
		throw parseApiError(error, {
			resourceType: "DrillProgram",
			resourceId: id,
		});
	}
}
```

---

## Flow Logging

All error classes and utilities use flow-based logging:

```typescript
// Error creation
console.error("[FLOW:error] [ERROR] ApplicationError created", { code, message });

// Error handling
console.log("[FLOW:error-utils] [ACTION] Handling error", { errorType });

// Retry logic
console.log("[FLOW:error-utils] [ACTION] Retry attempt", { attempt, maxRetries });
```

Filter in browser console:
```javascript
// All error logs
[FLOW:error]

// Error utility actions
[FLOW:error-utils] [ACTION]

// Errors only
[ERROR]
```

---

## TypeScript Support

Full TypeScript support with:
- Type-safe error classes
- Generic utility functions
- Type guards for narrowing
- Proper error inference

```tsx
// Type inference
const error = parseApiError(apiError);
// error is ApplicationError

// Type guards
if (isErrorType(error, ValidationError)) {
	// error is ValidationError
	const fieldErrors = error.errors; // TypeScript knows this exists
}

// Generic safe handlers
const handler = createSafeHandler<[string], DrillProgram>(
	async (id: string) => {
		return await api.getDrillProgram(id);
	}
);
```

---

## Testing

### Unit Test Example

```tsx
import { handleError, parseApiError, ValidationError } from "#src/pages/_shared/errors";

describe("Error Handling", () => {
	test("parses validation error correctly", () => {
		const apiError = {
			response: {
				status: 400,
				json: () => ({
					message: "Validation failed",
					errors: {
						name: ["Name is required"],
					},
				}),
			},
		};

		const error = parseApiError(apiError);

		expect(error).toBeInstanceOf(ValidationError);
		expect((error as ValidationError).hasFieldError("name")).toBe(true);
	});

	test("handleError shows toast message", () => {
		const mockMessage = jest.spyOn(antMessage, "error");
		const error = new NetworkError("Failed");

		handleError(error);

		expect(mockMessage).toHaveBeenCalledWith(expect.stringContaining("Failed"));
	});
});
```

---

## Related

- [`ErrorBoundary`](../components/ErrorBoundary/README.md) - React error boundary component
- [`useApiRequest`](../hooks/useApiRequest.ts) - API request hook with error handling
- [Logging Strategy](../../../Roo_docs/logging-strategy-revised.md) - Flow-based logging approach

---

## Examples in Codebase

After Phase 3 implementation, see:
- `src/pages/drill-program/services/drillProgramService.ts`
- `src/pages/drill-pattern/services/drillPatternService.ts`
- `src/pages/drill-plan/services/drillPlanService.ts`
