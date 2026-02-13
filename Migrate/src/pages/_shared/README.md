# Shared Utilities, Components, and Hooks

This directory contains reusable code that can be used across all drill modules (drill-program, drill-pattern, drill-plan, drill-hole).

## Structure

```
_shared/
├── components/     # Reusable UI components
│   ├── ErrorBoundary/
│   │   ├── ErrorBoundary.tsx
│   │   ├── README.md
│   │   └── index.ts
│   └── index.ts
├── hooks/          # Reusable custom hooks
│   ├── useApiRequest.ts
│   └── index.ts
├── utils/          # Utility functions
│   ├── agGridUtils.ts
│   └── index.ts
└── README.md
```

## Components

### `ErrorBoundary`

Generic error boundary component that catches React errors and displays a fallback UI.

**Features:**
- Catches rendering errors in child components
- Displays user-friendly error messages
- Shows detailed error info in development mode
- Provides recovery options (Reload, Go Home)
- Supports custom fallback UI
- Module-specific error messages
- Preserves line numbers in logs (uses direct console.log)

**Usage:**
```typescript
import { ErrorBoundary } from '#src/pages/_shared/components';

function DrillPlanModule() {
  return (
    <ErrorBoundary moduleName="DrillPlan">
      <DrillPlanListView />
    </ErrorBoundary>
  );
}
```

**With custom error handler:**
```typescript
import { ErrorBoundary } from '#src/pages/_shared/components';

function DrillPlanModule() {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Send to monitoring service
    console.error('[FLOW:error-monitoring] [ERROR] Caught error:', {
      error,
      errorInfo,
    });
  };

  return (
    <ErrorBoundary moduleName="DrillPlan" onError={handleError}>
      <DrillPlanListView />
    </ErrorBoundary>
  );
}
```

**See full documentation:** [`components/ErrorBoundary/README.md`](./components/ErrorBoundary/README.md)

## Hooks

### `useApiRequest<T>`

Generic hook for making API requests with built-in error handling, timeout, and retry logic.

**Features:**
- Automatic timeout handling (default: 30s)
- Retry with exponential backoff
- Loading state management
- Error handling with callbacks
- AbortController integration

**Usage:**
```typescript
import { useApiRequest } from "#src/pages/_shared/hooks";

const { data, loading, error, execute, reset } = useApiRequest(
	async (id: string) => apiClient.get(`/api/v1/drill-plan/${id}`).json(),
	{
		timeout: 10000,
		retryAttempts: 2,
		retryDelay: 1000,
		onSuccess: data => console.log("Success:", data),
		onError: error => console.error("Error:", error),
	}
);

// Execute the request
await execute(planId);
```

### `useFetchList<T>`

Specialized hook for fetching paginated lists with filtering.

**Features:**
- Pagination state management
- Filter state management
- Automatic or manual fetching
- Built on top of useApiRequest

**Usage:**
```typescript
import { useFetchList } from "#src/pages/_shared/hooks";

const {
	data,
	loading,
	error,
	page,
	take,
	filters,
	fetchList,
	setPage,
	setTake,
	setFilters,
} = useFetchList(
	(page, take, filters) => drillPlanService.findAll(page, take, filters),
	{
		immediate: true, // Fetch on mount
		initialPage: 1,
		initialTake: 20,
	}
);

// Fetch with new parameters
await fetchList(2, 50, { status: "active" });
```

## Utilities

### AG Grid Utilities (`agGridUtils.ts`)

Common utilities for working with AG Grid across modules.

#### `safeCellRenderer`

Wraps cell renderers with error handling to prevent grid crashes.

**Usage:**
```typescript
import { safeCellRenderer } from '#src/pages/_shared/utils';

const columnDefs = [
  {
    field: 'name',
    cellRenderer: safeCellRenderer((params) => {
      return <a href={`/detail/${params.data.id}`}>{params.value}</a>;
    }),
  },
];
```

#### `formatGridDate` / `formatGridDateTime`

Safe date formatting for grid display.

**Usage:**
```typescript
import { formatGridDate, formatGridDateTime } from "#src/pages/_shared/utils";

const columnDefs = [
	{
		field: "createdAt",
		valueFormatter: params => formatGridDateTime(params.value),
	},
];
```

#### `createLinkRenderer`

Creates a clickable link cell renderer with navigation.

**Usage:**
```typescript
import { createLinkRenderer } from "#src/pages/_shared/utils";

const columnDefs = [
	{
		field: "name",
		cellRenderer: createLinkRenderer(
			id => navigate(`/drill-plan/${id}`),
			"DrillPlanId"
		),
	},
];
```

#### `validateGridData`

Validates and sanitizes grid data arrays.

**Usage:**
```typescript
import { validateGridData } from "#src/pages/_shared/utils";

const validPlans = validateGridData(plans, "drill plans");
// Returns only valid items, logs warnings for invalid ones
```

#### `commonColumnDefs`

Preset column definitions for common patterns.

**Usage:**
```typescript
import { commonColumnDefs } from "#src/pages/_shared/utils";

const columnDefs = [
	commonColumnDefs.checkbox,
	commonColumnDefs.date("Created", "createdAt"),
	commonColumnDefs.datetime("Modified", "modifiedAt"),
	commonColumnDefs.numeric("Depth", "depth", "m"),
];
```

## Best Practices

### When to Use Shared Utilities

✅ **DO use shared utilities when:**
- Multiple modules have identical logic
- Error handling needs to be consistent
- Performance optimizations should be universal
- Code duplication exceeds 3 instances

❌ **DON'T use shared utilities when:**
- Logic is module-specific
- Business rules vary between modules
- Abstraction adds more complexity than it saves
- Only used in a single location

### Error Handling

All shared utilities include comprehensive error handling:
- Try-catch blocks
- Timeout protection
- Invalid data validation
- Console logging for debugging
- User-friendly error messages

### Performance

Shared utilities are optimized for:
- Minimal re-renders (useCallback, useMemo)
- Efficient error recovery
- Graceful degradation
- Memory cleanup

## Contributing

When adding new shared utilities:

1. **Ensure reusability**: Utility must be used in 2+ modules
2. **Add TypeScript types**: Full type safety required
3. **Document thoroughly**: Include usage examples
4. **Add error handling**: Never throw uncaught errors
5. **Test edge cases**: null, undefined, invalid data
6. **Update this README**: Keep documentation current

## Migration Guide

To migrate existing code to use shared utilities:

1. **Identify duplicated code** across modules
2. **Extract to shared utility** following patterns above
3. **Update imports** in all modules
4. **Test thoroughly** to ensure behavior is unchanged
5. **Remove old code** after validation

Example migration:

```typescript
// Before (in each module)
// After (import from shared)
import { safeCellRenderer } from "#src/pages/_shared/utils";

function safeCellRenderer(renderer) {
	return (params) => {
		try {
			if (!params || !params.data)
				return "N/A";
			return renderer(params);
		}
		catch (error) {
			return "Error";
		}
	};
}
```
