# Status Badge Components

This directory contains badge components for displaying different types of status indicators.

## Components

### RowStatusBadge

**Purpose**: Display workflow/approval status of database records
**Status Type**: Numeric (0-4)
**Use Cases**: Record approval workflow, data quality gates

**Status Values**:
- `0` - Draft (being edited)
- `1` - Completed (ready for review)
- `2` - Reviewed (reviewed by senior geologist)
- `3` - Approved (locked for reporting)
- `4` - Superseded (replaced by newer version)

**Example**:
```tsx
import { RowStatusBadge } from "#src/ux/shared/components";

<RowStatusBadge
	status={collar.RowStatus}
	validationErrors={errors}
	showLabel={true}
	size="default"
/>;
```

---

### HoleStatusBadge

**Purpose**: Display operational status of drill holes
**Status Type**: String
**Use Cases**: Drill plan lists, collar views, operational tracking

**Status Values**:
- `"DRAFT"` - Initial planning stage
- `"PLANNED"` - Ready for execution
- `"IN_PROGRESS"` - Currently being drilled
- `"COMPLETED"` - Drilling completed
- `"ABANDONED"` - Hole was abandoned
- `"CANCELLED"` - Plan was cancelled
- `"SUSPENDED"` - Temporarily paused
- `"STOPPED"` - Permanently stopped
- `"INACCESSIBLE"` - Location cannot be accessed

**Example**:
```tsx
import { HoleStatusBadge } from "#src/ux/shared/components";

<HoleStatusBadge
	status={plan.HoleStatus}
	showLabel={true}
	size="default"
/>;
```

---

### SyncIndicator

**Purpose**: Display offline/online sync status
**Use Cases**: Header bars, status bars, connection indicators

---

## Migration from StatusBadge

The old `StatusBadge` component has been split into two specialized components:

**Before**:
```tsx
import { StatusBadge } from "#src/ux/shared/components";

// This was ambiguous - what type of status?
<StatusBadge status={someStatus} />;
```

**After**:
```tsx
import { RowStatusBadge, HoleStatusBadge } from '#src/ux/shared/components';

// Explicit: workflow status (numeric)
<RowStatusBadge status={collar.RowStatus} />

// Explicit: operational status (string)
<HoleStatusBadge status={plan.HoleStatus} />
```

For backward compatibility, `StatusBadge` is aliased to `RowStatusBadge`.

---

## Design Principles

1. **Type Safety**: Each badge expects a specific type (number vs string)
2. **Clear Intent**: Component name indicates what it displays
3. **Consistent Styling**: All badges use Ant Design's Badge component
4. **Tooltips**: Hover shows full status description
5. **Configurable**: Support for label visibility and size variants
