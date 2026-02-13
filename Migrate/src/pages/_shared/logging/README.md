# Flow-Based Logging System

Comprehensive logging strategy for the B2Gold Mining Database application using direct console methods with standardized flow names and log levels.

## Critical Principle

**ALWAYS use direct `console.log`, `console.error`, `console.warn` calls.**

**DO NOT wrap console methods in functions** as it breaks line number tracking in browser devtools, making debugging impossible.

```tsx
// ✅ Good - preserves line numbers (clickable in devtools)
console.log("[FLOW:drill-program-list] [ACTION] Loading programs", { userId });

// ❌ Bad - loses line numbers (DO NOT DO THIS)
logger.log("Loading programs"); // Breaks devtools line tracking
```

---

## Why Flow-Based Logging?

### Problems with Traditional Logging

1. **Scattered logs** - Hard to follow execution flow
2. **Inconsistent format** - Each developer logs differently
3. **No context** - Can't filter by module or operation
4. **Lost line numbers** - Wrapper functions break devtools

### Flow-Based Solution

1. **Standardized format** - `[FLOW:flow-name] [LEVEL] Message`
2. **Easy filtering** - Filter by flow name in browser console
3. **Context included** - Data objects provide context
4. **Preserved line numbers** - Direct console calls remain clickable

---

## Log Format

```
[FLOW:flow-name] [LEVEL] Message { context }
```

**Components:**
- `[FLOW:flow-name]` - Module/component/operation identifier
- `[LEVEL]` - Log level (ACTION, ERROR, API, etc.)
- `Message` - Human-readable description
- `{ context }` - Optional data object

**Example:**
```tsx
console.log("[FLOW:drill-program-list] [ACTION] User clicked create button", {
	userId: 123,
	timestamp: Date.now(),
});
```

---

## Quick Start

### Basic Usage

```tsx
import { FlowName, LogLevel } from "#src/pages/_shared/logging";

// Or use the helpers
import { createLogPrefix } from "#src/pages/_shared/logging";

// In a component
console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} Loading programs`);

const prefix = createLogPrefix(FlowName.DRILL_PROGRAM_LIST, LogLevel.ACTION);
console.log(prefix, "Loading programs", { page: 1, pageSize: 20 });
```

### With Data Context

```tsx
console.log("[FLOW:drill-program-list] [API] Fetching programs", {
	page: currentPage,
	pageSize: 20,
	filters: activeFilters,
});
```

### Error Logging

```tsx
console.error("[FLOW:drill-program-service] [ERROR] Failed to save program", {
	error: error.message,
	programId: program.id,
	stack: error.stack,
});
```

---

## Log Levels

Use the `LogLevel` constants for consistency:

```tsx
import { LogLevel } from "#src/pages/_shared/logging";

LogLevel.ACTION; // [ACTION] - User actions (clicks, navigation)
LogLevel.DECISION; // [DECISION] - Decision points and conditionals
LogLevel.API; // [API] - API calls and responses
LogLevel.VALIDATION; // [VALIDATION] - Validation checks
LogLevel.STATE; // [STATE] - State changes
LogLevel.NAV; // [NAV] - Navigation events
LogLevel.PERF; // [PERF] - Performance measurements
LogLevel.ERROR; // [ERROR] - Errors and failures
LogLevel.WARN; // [WARN] - Warnings
LogLevel.DEBUG; // [DEBUG] - Debug information (verbose)
```

### When to Use Each Level

#### ACTION
User interactions and important operations:
```tsx
console.log("[FLOW:drill-program-list] [ACTION] User clicked create button");
console.log("[FLOW:drill-program-form] [ACTION] User submitted form", { formData });
console.log("[FLOW:drill-program-detail] [ACTION] User clicked delete");
```

#### DECISION
Conditional logic and decision points:
```tsx
console.log("[FLOW:drill-program-list] [DECISION] Checking permissions", {
	hasPermission: user.canEdit,
	userId: user.id,
});

if (programs.length === 0) {
	console.log("[FLOW:drill-program-list] [DECISION] Showing empty state");
}
```

#### API
API calls, requests, and responses:
```tsx
console.log("[FLOW:drill-program-service] [API] Fetching programs", { page, filters });
console.log("[FLOW:drill-program-service] [API] Programs fetched", {
	count: programs.length,
	duration: formatDuration(startTime),
});
console.error("[FLOW:drill-program-service] [API] Request failed", { error });
```

#### VALIDATION
Validation checks and results:
```tsx
console.log("[FLOW:drill-program-form] [VALIDATION] Validating form");
console.log("[FLOW:drill-program-form] [VALIDATION] Validation passed");
console.warn("[FLOW:drill-program-form] [VALIDATION] Validation failed", {
	errors: validationErrors,
});
```

#### STATE
State updates and changes:
```tsx
console.log("[FLOW:drill-program-list] [STATE] Programs updated", {
	before: prevPrograms.length,
	after: newPrograms.length,
});
console.log("[FLOW:drill-program-store] [STATE] Filter applied", { filter });
```

#### NAV
Navigation and routing:
```tsx
console.log("[FLOW:drill-program-list] [NAV] Navigating to detail", { programId });
console.log("[FLOW:drill-program-form] [NAV] Redirecting to list after save");
console.log("[FLOW:router] [NAV] Route changed", { from: prevRoute, to: newRoute });
```

#### PERF
Performance measurements:
```tsx
const start = performance.now();
// ... operation
console.log("[FLOW:drill-program-list] [PERF] Render completed", {
	duration: formatDuration(start),
	itemCount: programs.length,
});
```

#### ERROR
Errors and failures:
```tsx
console.error("[FLOW:drill-program-service] [ERROR] Failed to save program", {
	error: error.message,
	programId,
	stack: error.stack,
});
```

#### WARN
Warnings and potential issues:
```tsx
console.warn("[FLOW:drill-program-list] [WARN] Using cached data", {
	cacheAge: Date.now() - cacheTimestamp,
});
console.warn("[FLOW:drill-program-form] [WARN] Unsaved changes detected");
```

#### DEBUG
Verbose debugging information (development only):
```tsx
if (isLoggingEnabled(FlowName.DRILL_PROGRAM_LIST)) {
	console.log("[FLOW:drill-program-list] [DEBUG] Full state", { state });
}
```

---

## Flow Names

Use the `FlowName` constants for consistency:

```tsx
import { FlowName } from "#src/pages/_shared/logging";

// Drill Program Module
FlowName.DRILL_PROGRAM_LIST; // drill-program-list
FlowName.DRILL_PROGRAM_DETAIL; // drill-program-detail
FlowName.DRILL_PROGRAM_FORM; // drill-program-form
FlowName.DRILL_PROGRAM_SERVICE; // drill-program-service

// Drill Pattern Module
FlowName.DRILL_PATTERN_LIST; // drill-pattern-list
FlowName.DRILL_PATTERN_DETAIL; // drill-pattern-detail
FlowName.DRILL_PATTERN_FORM; // drill-pattern-form
FlowName.DRILL_PATTERN_SERVICE; // drill-pattern-service

// And more... (see loggingTypes.ts for full list)
```

### Adding New Flow Names

When creating new modules or components, add flow names to [`loggingTypes.ts`](./loggingTypes.ts:43):

```tsx
export const FlowName = {
	// ... existing flows

	// New Module
	MY_NEW_MODULE_LIST: "my-new-module-list",
	MY_NEW_MODULE_DETAIL: "my-new-module-detail",
	MY_NEW_MODULE_FORM: "my-new-module-form",
} as const;
```

---

## Common Patterns

### Pattern 1: Component Lifecycle

```tsx
import { FlowName, LogLevel, LogMessage } from "#src/pages/_shared/logging";

export const DrillProgramListView: React.FC = () => {
	useEffect(() => {
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} ${LogMessage.COMPONENT_MOUNTED}`);

		return () => {
			console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} ${LogMessage.COMPONENT_UNMOUNTED}`);
		};
	}, []);

	// ... component code
};
```

### Pattern 2: API Request Flow

```tsx
import { FlowName, formatDuration, LogLevel } from "#src/pages/_shared/logging";

async function fetchPrograms() {
	const startTime = performance.now();

	console.log(`[FLOW:${FlowName.DRILL_PROGRAM_SERVICE}] ${LogLevel.API} ${LogMessage.API_REQUEST_START}`, {
		endpoint: "/api/drill-programs",
		params: { page, pageSize },
	});

	try {
		const response = await api.getDrillPrograms({ page, pageSize });

		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_SERVICE}] ${LogLevel.API} ${LogMessage.API_REQUEST_SUCCESS}`, {
			count: response.length,
			duration: formatDuration(startTime),
		});

		return response;
	}
	catch (error) {
		console.error(`[FLOW:${FlowName.DRILL_PROGRAM_SERVICE}] ${LogLevel.ERROR} ${LogMessage.API_REQUEST_ERROR}`, {
			error: error.message,
			duration: formatDuration(startTime),
		});
		throw error;
	}
}
```

### Pattern 3: User Action Flow

```tsx
import { FlowName, LogLevel } from "#src/pages/_shared/logging";

async function handleDelete(id: string) {
	console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} User clicked delete`, { programId: id });

	const confirmed = await confirm("Are you sure?");

	if (!confirmed) {
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.DECISION} User cancelled delete`);
		return;
	}

	console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} Deleting program`, { programId: id });

	try {
		await deleteDrillProgram(id);
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} Program deleted successfully`);
	}
	catch (error) {
		console.error(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ERROR} Delete failed`, { error, programId: id });
	}
}
```

### Pattern 4: Form Submission Flow

```tsx
import { FlowName, LogLevel, sanitizeForLog } from "#src/pages/_shared/logging";

async function handleSubmit(values: FormData) {
	console.log(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.ACTION} ${LogMessage.USER_SUBMIT}`, {
		values: sanitizeForLog(values), // Removes sensitive fields
	});

	console.log(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.VALIDATION} ${LogMessage.VALIDATION_START}`);

	try {
		await form.validateFields();
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.VALIDATION} ${LogMessage.VALIDATION_SUCCESS}`);
	}
	catch (error) {
		console.warn(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.VALIDATION} ${LogMessage.VALIDATION_ERROR}`, {
			errors: error.errors,
		});
		return;
	}

	console.log(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.API} ${LogMessage.SAVING_START}`);

	try {
		await saveDrillProgram(values);
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.API} ${LogMessage.SAVING_SUCCESS}`);
		message.success("Program saved successfully");
		navigate("/drill-programs");
	}
	catch (error) {
		console.error(`[FLOW:${FlowName.DRILL_PROGRAM_FORM}] ${LogLevel.ERROR} ${LogMessage.SAVING_ERROR}`, {
			error: error.message,
		});
		handleError(error);
	}
}
```

### Pattern 5: State Management Flow

```tsx
import { FlowName, LogLevel } from "#src/pages/_shared/logging";

const useDrillProgramStore = create<DrillProgramState>((set, get) => ({
	programs: [],
	filters: {},

	setPrograms: (programs) => {
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.STATE} Programs updated`, {
			before: get().programs.length,
			after: programs.length,
		});
		set({ programs });
	},

	setFilters: (filters) => {
		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.STATE} Filters updated`, {
			filters,
		});
		set({ filters });
	},
}));
```

### Pattern 6: Performance Measurement

```tsx
import { FlowName, formatDuration, LogLevel } from "#src/pages/_shared/logging";

const ExpensiveComponent: React.FC = () => {
	useEffect(() => {
		const startTime = performance.now();

		// ... expensive operation

		console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.PERF} Component initialized`, {
			duration: formatDuration(startTime),
		});
	}, []);

	return <div>{/* ... */}</div>;
};
```

---

## Helper Functions

### createFlowTag

Create a flow tag string:

```tsx
import { createFlowTag } from "#src/pages/_shared/logging";

const flow = createFlowTag("drill-program-list");
console.log(`${flow} [ACTION] Loading programs`);
// Output: [FLOW:drill-program-list] [ACTION] Loading programs
```

### createLogPrefix

Create a complete log prefix:

```tsx
import { createLogPrefix, FlowName, LogLevel } from "#src/pages/_shared/logging";

const prefix = createLogPrefix(FlowName.DRILL_PROGRAM_LIST, LogLevel.ACTION);
console.log(prefix, "Loading programs", { userId: 123 });
// Output: [FLOW:drill-program-list] [ACTION] Loading programs { userId: 123 }
```

### formatDuration

Format performance duration:

```tsx
import { formatDuration } from "#src/pages/_shared/logging";

const start = performance.now();
// ... operation
console.log("[FLOW:api] [PERF] Request completed", {
	duration: formatDuration(start), // "245ms" or "1.25s"
});
```

### formatBytes

Format data size:

```tsx
import { formatBytes } from "#src/pages/_shared/logging";

console.log("[FLOW:api] [API] Response received", {
	size: formatBytes(response.length), // "2.5 KB" or "1.2 MB"
});
```

### sanitizeForLog

Remove sensitive data before logging:

```tsx
import { sanitizeForLog } from "#src/pages/_shared/logging";

const userData = {
	username: "john",
	email: "john@example.com",
	password: "secret123",
	token: "abc123",
};

console.log("[FLOW:auth] [ACTION] User login", sanitizeForLog(userData));
// Output: { username: 'john', email: 'john@example.com', password: '[REDACTED]', token: '[REDACTED]' }
```

**Redacted Fields:**
- password
- token
- accessToken
- refreshToken
- secret
- apiKey
- creditCard
- ssn
- pin

### isLoggingEnabled

Check if logging is enabled for a flow:

```tsx
import { FlowName, isLoggingEnabled } from "#src/pages/_shared/logging";

if (isLoggingEnabled(FlowName.DRILL_PROGRAM_LIST)) {
	console.log("[FLOW:drill-program-list] [DEBUG] Detailed state", { state });
}
```

**Behavior:**
- Production: Returns `false` (only errors/warnings logged)
- Development: Returns `true` by default
- Can be controlled via `localStorage.setItem('DEBUG_FLOWS', 'flow-name')` or `'*'` for all

---

## Filtering in Browser Console

### Filter by Flow

```javascript
// Show all drill-program-list logs
[FLOW:drill-program-list]

// Show all drill-program logs (list, detail, form, service)
[FLOW:drill-program

// Show all API logs across all flows
[API]

// Show all errors
[ERROR]

// Show all actions
[ACTION]
```

### Multiple Filters

Use the browser console filter with multiple terms:

```javascript
// Drill program actions
[FLOW:drill-program [ACTION]

// API errors
[API] [ERROR]
```

### Exclude Filters

Use `-` to exclude:

```javascript
// All logs except debug
-[DEBUG]

// All drill-program logs except debug
[FLOW:drill-program -[DEBUG]
```

---

## Environment-Specific Logging

### Development

All logs are enabled by default.

### Production

Only errors and warnings are logged automatically. Use `localStorage` to enable specific flows for debugging:

```javascript
// Enable all flows
localStorage.setItem("DEBUG_FLOWS", "*");

// Enable specific flows
localStorage.setItem("DEBUG_FLOWS", "drill-program-list,drill-program-service");

// Disable all debug logging
localStorage.removeItem("DEBUG_FLOWS");
```

---

## Best Practices

### 1. Always Include Context

```tsx
// ✅ Good - includes context
console.log("[FLOW:drill-program-list] [ACTION] Loading programs", {
	page: currentPage,
	pageSize: 20,
	filters: activeFilters,
});

// ❌ Bad - no context
console.log("[FLOW:drill-program-list] [ACTION] Loading programs");
```

### 2. Use Consistent Flow Names

```tsx
// ✅ Good - uses constant
import { FlowName } from "#src/pages/_shared/logging";

console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] [ACTION] Loading`);

// ❌ Bad - magic string
console.log("[FLOW:drill-program] [ACTION] Loading"); // Inconsistent
```

### 3. Use Appropriate Log Levels

```tsx
// ✅ Good - appropriate levels
console.log("[FLOW:api] [API] Request started");
console.error("[FLOW:api] [ERROR] Request failed");
console.warn("[FLOW:api] [WARN] Request slow");

// ❌ Bad - wrong levels
console.log("[FLOW:api] [ACTION] Request failed"); // Should be ERROR
```

### 4. Sanitize Sensitive Data

```tsx
// ✅ Good - sanitized
import { sanitizeForLog } from "#src/pages/_shared/logging";

console.log("[FLOW:auth] [ACTION] Login", sanitizeForLog(credentials));

// ❌ Bad - exposes password
console.log("[FLOW:auth] [ACTION] Login", credentials);
```

### 5. Log Both Success and Failure

```tsx
// ✅ Good - logs both paths
try {
	const result = await operation();
	console.log("[FLOW:service] [API] Operation succeeded", { result });
}
catch (error) {
	console.error("[FLOW:service] [ERROR] Operation failed", { error });
}

// ❌ Bad - only logs failure
try {
	await operation();
}
catch (error) {
	console.error("[FLOW:service] [ERROR] Operation failed", { error });
}
```

### 6. Use Performance Logging for Slow Operations

```tsx
// ✅ Good - measures performance
const start = performance.now();
const results = await heavyOperation();
console.log("[FLOW:service] [PERF] Heavy operation completed", {
	duration: formatDuration(start),
	resultCount: results.length,
});
```

### 7. Don't Log Inside Loops

```tsx
// ❌ Bad - logs every iteration
items.forEach((item) => {
	console.log("[FLOW:service] [ACTION] Processing item", { item });
	processItem(item);
});

// ✅ Good - logs summary
console.log("[FLOW:service] [ACTION] Processing items", { count: items.length });
items.forEach(item => processItem(item));
console.log("[FLOW:service] [ACTION] Items processed", { count: items.length });
```

### 8. Use Log Message Constants

```tsx
// ✅ Good - uses constants
import { LogMessage } from "#src/pages/_shared/logging";

console.log(`[FLOW:api] [API] ${LogMessage.API_REQUEST_START}`);

// ❌ Bad - inconsistent messages
console.log("[FLOW:api] [API] Starting API request");
console.log("[FLOW:api] [API] API call initiated");
console.log("[FLOW:api] [API] Beginning request");
```

---

## Migration Guide

### Update Existing Logs

**Before:**
```tsx
console.log("Loading drill programs");
console.log("User clicked button");
console.error("Failed to save:", error);
```

**After:**
```tsx
import { FlowName, LogLevel } from "#src/pages/_shared/logging";

console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} Loading drill programs`);
console.log(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION} User clicked button`);
console.error(`[FLOW:${FlowName.DRILL_PROGRAM_SERVICE}] ${LogLevel.ERROR} Failed to save`, { error });
```

### Add Missing Logs

Look for these patterns and add logging:

1. **User actions** - button clicks, form submissions
2. **API calls** - start, success, failure
3. **State changes** - store updates, cache updates
4. **Navigation** - route changes, redirects
5. **Decision points** - if statements, guards
6. **Errors** - try-catch blocks

---

## Testing

### Manual Testing

1. Open browser devtools console
2. Perform actions in the application
3. Filter logs by flow or level
4. Verify logs appear with correct format
5. Click log line numbers to navigate to source

### Automated Testing

```tsx
import { FlowName, LogLevel } from "#src/pages/_shared/logging";

// Mock console for testing
const consoleSpy = jest.spyOn(console, "log");

test("logs component mount", () => {
	render(<DrillProgramListView />);

	expect(consoleSpy).toHaveBeenCalledWith(
		expect.stringContaining(`[FLOW:${FlowName.DRILL_PROGRAM_LIST}] ${LogLevel.ACTION}`),
		expect.any(String)
	);
});
```

---

## Related

- [Error Handling System](../errors/README.md) - Error classes use flow-based logging
- [Shared Components](../components/README.md) - Components use flow-based logging
- [Custom Hooks](../hooks/README.md) - Hooks use flow-based logging

---

## Summary

**Key Points:**
- Use direct `console.log/error/warn` (never wrap)
- Follow format: `[FLOW:name] [LEVEL] Message { context }`
- Use `FlowName` and `LogLevel` constants
- Include context objects with data
- Sanitize sensitive information
- Filter logs in browser console
- Measure performance for slow operations

**Benefits:**
- Consistent logging across codebase
- Easy debugging with clickable line numbers
- Filterable logs in browser console
- Clear execution flow tracking
- Context-rich debugging information
