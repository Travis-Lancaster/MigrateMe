# DrillHole Module

> **Comprehensive guide to the DrillHole aggregate root pattern implementation**

This module manages the complete DrillHole data entry workflow using a sophisticated aggregate root pattern with offline-first architecture, optimistic locking, and section-based validation.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Module Structure](#module-structure)
- [Data Flow](#data-flow)
- [Adding a New Section](#adding-a-new-section)
- [Patterns & Best Practices](#patterns--best-practices)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

### What is the DrillHole Module?

The DrillHole module is a **data entry system** for managing drill hole information in a mining/exploration context. It handles:

- **9 sections** of drill hole data (Collar, RigSheet, DrillMethod, Survey, etc.)
- **Offline-first** architecture with Dexie IndexedDB cache
- **Version conflict detection** and resolution
- **Row-level dirty tracking** for array sections
- **State machine** for section validation (Draft → Complete → Reviewed → Approved)

### Key Features

✅ **Aggregate Root Pattern** - DrillHole is treated as a single aggregate with multiple sections
✅ **Offline-First** - Works without internet, syncs when online
✅ **Optimistic Locking** - Prevents data loss from concurrent edits
✅ **Type-Safe** - Full TypeScript with API-generated types
✅ **Zero Duplication** - DRY principles throughout
✅ **Highly Testable** - Clear separation of concerns

---

## Architecture

### Design Principles

This module follows **SOLID, DRY, and KISS** principles:

1. **Single Responsibility (S):** Each module has one clear purpose
2. **Open/Closed (O):** Easy to extend via configuration
3. **Liskov Substitution (L):** All sections implement same interface
4. **Interface Segregation (I):** Clean, minimal interfaces
5. **Dependency Inversion (D):** Depends on abstractions (DrillHoleSection)

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     DrillHole Module                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐         ┌────────────────────────────┐   │
│  │ Components   │────────▶│  drillhole-store.ts        │   │
│  │              │         │  (395 lines - coordinator) │   │
│  │ - index.tsx  │         │                            │   │
│  │ - sections/  │         │  ┌──────────────────────┐  │   │
│  │ - components/│         │  │ Delegates to:        │  │   │
│  └──────────────┘         │  │                      │  │   │
│                           │  │ • store-loaders.ts   │  │   │
│                           │  │ • store-actions.ts   │  │   │
│                           │  │ • store-row-ops.ts   │  │   │
│                           │  │ • store-utils.ts     │  │   │
│                           │  └──────────────────────┘  │   │
│                           └────────────────────────────┘   │
│                                      │                      │
│                                      ▼                      │
│                           ┌────────────────────┐           │
│                           │ section-factory.ts │           │
│                           │                    │           │
│                           │ Creates sections   │           │
│                           │ with validation    │           │
│                           └────────────────────┘           │
│                                      │                      │
│                                      ▼                      │
│                           ┌────────────────────┐           │
│                           │ section-config.ts  │           │
│                           │                    │           │
│                           │ SECTION_CONFIGS    │           │
│                           │ (configuration)    │           │
│                           └────────────────────┘           │
│                                      │                      │
│                                      ▼                      │
│                           ┌────────────────────┐           │
│                           │ section-mappers.ts │           │
│                           │                    │           │
│                           │ API → Store        │           │
│                           │ transformation     │           │
│                           └────────────────────┘           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                               │
                               ▼
                   ┌─────────────────────────┐
                   │   drillholeService.ts   │
                   │                         │
                   │   Dexie ⇄ API          │
                   └─────────────────────────┘
                               │
                  ┌────────────┴────────────┐
                  │                         │
                  ▼                         ▼
          ┌─────────────┐          ┌──────────────┐
          │   Dexie     │          │   API        │
          │  (offline)  │          │  (backend)   │
          └─────────────┘          └──────────────┘
```

---

## Module Structure

### Directory Organization

```
src/pages/drill-hole/
├── index.tsx                        # Main page component
├── README.md                        # This file
│
├── components/                      # Reusable UI components
│   ├── ActionButtons.tsx            # Save/Submit/Reject buttons
│   ├── CollarCoordinateModal.tsx    # Coordinate entry modal
│   ├── DrillHoleHeader.tsx          # Page header
│   ├── MasterGrid.tsx               # Summary grid
│   ├── PlannedVsActual.tsx          # Comparison view
│   ├── SectionHeader.tsx            # Section title bar
│   ├── SectionWrapper.tsx           # Section layout wrapper
│   ├── StaleConflictDialog.tsx      # Conflict resolution UI
│   ├── StatusIndicator.tsx          # Visual status badges
│   └── VerticalTabs.tsx             # Navigation tabs
│
├── sections/                        # Section components
│   ├── CollarSection.tsx            # Collar data entry form
│   ├── DrillMethodSection.tsx       # Drill method grid
│   ├── RigSheetSection.tsx          # Rig setup form
│   └── styles.module.css            # Section styles
│
├── hooks/                           # Custom React hooks
│   ├── useGridSection.ts            # AG Grid integration hook
│   └── index.ts
│
├── store/                           # Zustand store (CORE)
│   ├── drillhole-store.ts           # Main store (395 lines)
│   ├── store-utils.ts               # Shared utilities
│   ├── store-loaders.ts             # Data loading logic
│   ├── store-actions.ts             # Business logic
│   ├── store-row-operations.ts      # Row-level operations
│   ├── section-factory.ts           # Section creation factory
│   ├── section-config.ts            # Section configuration
│   └── section-mappers.ts           # API transformation
│
├── validation/                      # Zod schemas
│   ├── base-schemas.ts              # Shared validation rules
│   ├── collar-schemas.ts            # Collar validation
│   ├── collar-coordinate-schemas.ts # Coordinate validation
│   ├── dhsurvey-schemas.ts          # Survey validation
│   ├── drill-method-schemas.ts      # Drill method validation
│   └── rigsheet-schemas.ts          # Rig sheet validation
│
└── utils/                           # Utility functions
    └── column-factories.ts          # AG Grid column generators
```

### Key Files Explained

| File | Purpose | Lines | Responsibility |
|------|---------|-------|----------------|
| [`drillhole-store.ts`](./store/drillhole-store.ts) | Main Zustand store | 395 | Coordinates all sections, delegates to modules |
| [`store-loaders.ts`](./store/store-loaders.ts) | Data loading | 239 | Load from Dexie/API, handle conflicts |
| [`store-actions.ts`](./store/store-actions.ts) | Business logic | 374 | Save, submit, reject operations |
| [`store-row-operations.ts`](./store/store-row-operations.ts) | Row management | 355 | Add/update/delete rows in grids |
| [`store-utils.ts`](./store/store-utils.ts) | Shared utilities | 105 | ID mapping, temp ID generation |
| [`section-factory.ts`](./store/section-factory.ts) | Section creation | 307 | Creates section stores with validation |
| [`section-config.ts`](./store/section-config.ts) | Configuration | 169 | Defines all 9 sections |
| [`section-mappers.ts`](./store/section-mappers.ts) | API mapping | 215 | Transforms API data to store format |

---

## Data Flow

### 1. Loading a DrillHole

```
User navigates to /drill-hole/:drillPlanId
           │
           ▼
    index.tsx useEffect
           │
           ▼
    store.loadDrillHole(drillPlanId)
           │
           ▼
    store-loaders.ts
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
  Dexie       API (fallback)
 (cache)
    │             │
    └──────┬──────┘
           ▼
    Check versions
           │
    ┌──────┴──────┐
    │             │
    ▼             ▼
  Fresh        Stale?
    │             │
    │             ▼
    │      Show conflict modal
    │
    ▼
section-mappers.ts
  (transform API → Store)
    │
    ▼
  Store populated
    │
    ▼
Components re-render
```

### 2. Editing Section Data

```
User edits form field
      │
      ▼
Form onChange event
      │
      ▼
store.updateSectionData(sectionKey, data)
      │
      ▼
store-actions.updateSectionData()
      │
      ▼
Section.data updated (immer)
Section.isDirty = true
      │
      ▼
Component re-renders (Zustand subscription)
      │
      ▼
Save button enabled
```

### 3. Saving a Section

```
User clicks "Save"
      │
      ▼
store.saveSection(sectionKey)
      │
      ▼
store-actions.saveSection()
      │
  ┌───┴────────────────┐
  │   Validation       │
  │   (warning only)   │
  └───┬────────────────┘
      │
      ▼
drillholeService.saveDrillHoleSection()
      │
  ┌───┴─────┐
  │         │
  ▼         ▼
Dexie    API (if online)
(local)   (sync)
  │         │
  │         ▼
  │    Version check (rv)
  │         │
  │    ┌────┴────┐
  │    │         │
  │    ▼         ▼
  │   OK      Conflict (409)
  │    │         │
  │    │         ▼
  │    │    Auto-refresh data
  │    │    Show message
  │    │         │
  └────┴─────────┘
       │
       ▼
  Section.isDirty = false
       │
       ▼
  Reload fresh data from Dexie
       │
       ▼
  Component re-renders
       │
       ▼
  Save button disabled
```

### 4. Offline → Online Sync

```
App goes offline
      │
      ▼
User edits & saves
      │
      ▼
Data saved to Dexie only
isDirty stays true
      │
      ▼
App comes online
      │
      ▼
Background sync worker
      │
      ▼
Processes Dexie queue
      │
  ┌───┴────┐
  │        │
  ▼        ▼
Success  Conflict (409)
  │        │
  │        ▼
  │   Store conflict state
  │   Show modal to user
  │        │
  └────────┘
       │
       ▼
isDirty = false
```

---

## Adding a New Section

### Step-by-Step Guide

Follow these 5 steps to add a new section to the DrillHole module:

#### 1. Create Validation Schema

**File:** `src/pages/drill-hole/validation/newsection-schemas.ts`

```typescript
import { z } from "zod";

/**
 * Validation schema for NewSection
 */
export const newSectionSchema = z.object({
	NewSectionId: z.string().uuid(),
	CollarId: z.string().uuid(),
	FieldName: z.string().min(1, "Field name is required"),
	NumericValue: z.number().min(0).optional(),
	Comments: z.string().optional(),
	// Add all required fields with validation rules
});

export type NewSectionData = z.infer<typeof newSectionSchema>;

/**
 * Create empty new section data
 */
export function createEmptyNewSectionData(): NewSectionData {
	return {
		NewSectionId: crypto.randomUUID(),
		CollarId: "",
		FieldName: "",
		NumericValue: undefined,
		Comments: "",
	};
}
```

#### 2. Add to SectionKey Enum

**File:** `src/types/drillhole.ts`

```typescript
export enum SectionKey {
	DrillPlan = "drillplan",
	Collar = "collar",
	// ... existing sections
	NewSection = "newsection", // ✅ Add new section
}
```

#### 3. Add to Section Config

**File:** `src/pages/drill-hole/store/section-config.ts`

```typescript
import { createEmptyNewSectionData, newSectionSchema } from "../validation/newsection-schemas";

export const SECTION_CONFIGS: SectionConfig[] = [
	// ... existing configs
	{
		key: SectionKey.NewSection,
		validator: createZodValidator(newSectionSchema),
		initialData: createEmptyNewSectionData,
		dependencies: [SectionKey.Collar], // Depends on Collar
	},
];
```

#### 4. Add to Section Mappers

**File:** `src/pages/drill-hole/store/section-mappers.ts`

```typescript
export const SECTION_MAPPINGS: SectionMapping[] = [
	// ... existing mappings
	{
		sectionKey: SectionKey.NewSection,
		apiDataField: "NewSection", // Field name in UiDrillHole API response
		apiRowStatusField: "NewSectionRowStatus", // Row status field in API
		defaultData: {},
	},
];
```

#### 5. Create Section Component

**File:** `src/pages/drill-hole/sections/NewSectionSection.tsx`

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { SectionWrapper } from '../components';
import { useDrillHoleStore } from '../store/drillhole-store';
import { newSectionSchema, type NewSectionData } from '../validation/newsection-schemas';
import { SectionKey } from '#src/types/drillhole';

export const NewSectionSection: React.FC = () => {
  const section = useDrillHoleStore(state => state.sections.newsection);
  const updateSectionData = useDrillHoleStore(state => state.updateSectionData);
  const saveSection = useDrillHoleStore(state => state.saveSection);

  const { control, getValues, watch } = useForm<NewSectionData>({
    defaultValues: section.data,
    resolver: zodResolver(newSectionSchema),
    mode: 'onChange',
  });

  // Sync form changes to store
  useEffect(() => {
    const subscription = watch((formData) => {
      updateSectionData<NewSectionData>(SectionKey.NewSection, formData);
    });
    return () => subscription.unsubscribe();
  }, [watch, updateSectionData]);

  const onSave = async () => {
    const data = getValues();
    updateSectionData<NewSectionData>(SectionKey.NewSection, data);
    await saveSection(SectionKey.NewSection);
  };

  return (
    <SectionWrapper
      section={section}
      title="New Section"
      onSave={onSave}
    >
      {/* Add your form fields here */}
      <div>Your form content</div>
    </SectionWrapper>
  );
};
```

#### 6. Add to Main Page

**File:** `src/pages/drill-hole/index.tsx`

```typescript
import { NewSectionSection } from './sections/NewSectionSection';

// In renderActiveSection():
case SectionKey.NewSection:
  return <NewSectionSection />;
```

### That's It! 🎉

Your new section is now:
- ✅ Validated with Zod
- ✅ Integrated with the store
- ✅ Automatically saved to Dexie
- ✅ Synchronized with API when online
- ✅ Tracked for dirty state
- ✅ Version conflict protected

---

## Patterns & Best Practices

### 1. Section Interface Pattern

All sections implement the [`DrillHoleSection`](../../types/drillhole.ts) interface:

```typescript
interface DrillHoleSection<TData, TValidation> {
	// State
	sectionKey: string
	data: TData
	validation: TValidation | null
	rowStatus: RowStatus
	isDirty: boolean
	isStale: boolean
	rowVersion?: string

	// Data management
	getData: () => TData
	setData: (data: Partial<TData>) => void
	resetData: () => void

	// Status management
	getRowStatus: () => RowStatus
	setRowStatus: (status: RowStatus) => boolean

	// Validation
	validate: () => TValidation
	getValidationErrors: () => string[]
	isValid: () => boolean

	// State queries
	isEditable: () => boolean
	hasUnsavedChanges: () => boolean
	getDependencies: () => string[]
}
```

**Why this pattern?**
- ✅ Polymorphism: All sections work the same way
- ✅ Type safety: TypeScript enforces the contract
- ✅ Testability: Easy to mock and test
- ✅ Consistency: Same API for all sections

### 2. Factory Pattern

Instead of creating sections manually, use the factory:

```typescript
// ❌ DON'T: Manual creation
const section = {
	sectionKey: "collar",
	data: {},
	isDirty: false,
	// ... 20 more properties
};

// ✅ DO: Use factory
const section = createSectionStore({
	sectionKey: SectionKey.Collar,
	validate: createZodValidator(collarSchema),
	initialData: createEmptyCollarData(),
	dependencies: [SectionKey.DrillPlan],
});
```

**Benefits:**
- ✅ Less code
- ✅ Consistent initialization
- ✅ Automatic validation setup
- ✅ Dependency tracking

### 3. Configuration-Driven Design

Define sections in configuration, not code:

```typescript
// ❌ DON'T: Repeat initialization code for each section
sections: {
  collar: createSectionStore({...}),
  rigsheet: createSectionStore({...}),
  // ... repetitive for each section
}

// ✅ DO: Use configuration array
export const SECTION_CONFIGS = [
  { key: SectionKey.Collar, validator: collarValidator, ... },
  { key: SectionKey.RigSheet, validator: rigSheetValidator, ... },
];

// Then use factory:
sections: createAllSections()
```

**Benefits:**
- ✅ DRY: No duplication
- ✅ Easy to add sections
- ✅ Centralized configuration
- ✅ Less error-prone

### 4. Validation Pattern

Use Zod for runtime validation:

```typescript
// Define schema
const collarSchema = z.object({
	CollarId: z.string().uuid(),
	TotalDepth: z.number().min(0).max(10000),
	Comments: z.string().optional(),
});

// Use in section
const section = createSectionStore({
	sectionKey: SectionKey.Collar,
	validate: createZodValidator(collarSchema), // ✅ Type-safe validation
	// ...
});
```

**Why Zod?**
- ✅ Type inference (TypeScript types from schema)
- ✅ Runtime validation
- ✅ Great error messages
- ✅ Composable schemas

### 5. Dirty Tracking Pattern

Sections automatically track changes:

```typescript
// Initial state
section.isDirty === false;

// After user edit
updateSectionData(SectionKey.Collar, { TotalDepth: 150 });
section.isDirty === true; // ✅ Automatically set

// After save
await saveSection(SectionKey.Collar);
section.isDirty === false; // ✅ Automatically cleared
```

**No manual tracking needed!**

### 6. Row-Level Operations Pattern

For array sections (grids), use row operations:

```typescript
// Add row
addRow("drillmethod", {
	DepthFrom: 0,
	DepthTo: 10,
	DrillType: "CORE",
});

// Update row
updateRowData("drillmethod", rowId, {
	DepthTo: 15, // Partial update
});

// Delete row (soft delete)
deleteRow("drillmethod", rowId);

// Check row status
const metadata = getRowMetadata("drillmethod", rowId);
console.log(metadata.isDirty, metadata.isStale);
```

### 7. Offline-First Pattern

Data flows through Dexie cache first:

```
User Action
    ↓
Store Update
    ↓
Dexie (always)
    ↓
API (if online) ────┐
    │               │
    ↓               ↓
 Success       Conflict
    │               │
    └───────┬───────┘
            ↓
    Update Store
```

**Benefits:**
- ✅ Works offline
- ✅ Fast (no network wait)
- ✅ Conflict detection
- ✅ Automatic sync

---

## API Reference

### Store Hooks

```typescript
// Get entire store
const store = useDrillHoleStore();

// Get specific values (recommended for performance)
const collar = useDrillHoleStore(state => state.sections.collar);
const isDirty = useDrillHoleStore(state => state.sections.collar.isDirty);
const saveSection = useDrillHoleStore(state => state.saveSection);
```

### Store Actions

```typescript
// Load drill hole
await store.loadDrillHole(drillPlanId, forceRefresh?: boolean);

// Update section data
store.updateSectionData<CollarData>(SectionKey.Collar, { TotalDepth: 150 });

// Save section
const result = await store.saveSection(SectionKey.Collar);
if (result.success) { /* handle success */ }

// Submit section (Draft → Complete)
await store.submitSection(SectionKey.Collar);

// Reject section (back to Draft)
await store.rejectSection(SectionKey.Collar);

// Refresh stale section
await store.refreshStaleSection(SectionKey.Collar);

// Row operations
store.addRow('drillmethod', rowData);
store.updateRowData('drillmethod', rowId, partialData);
store.deleteRow('drillmethod', rowId);
```

### Custom Hooks

```typescript
// Grid sections (AG Grid integration)
const { gridData, section, gridProps, updateGridData } =
  useGridSection<DrillMethodData>(SectionKey.DrillMethod);

// Use in component:
<AgGridReact
  rowData={gridData}
  {...gridProps}
  columnDefs={columnDefs}
/>
```

---

## Troubleshooting

### Issue: Section Not Saving

**Symptoms:** Save button doesn't work, no error message

**Possible Causes:**
1. Section not marked as dirty
2. DrillHole not loaded
3. Validation errors (check console)

**Solution:**
```typescript
// Check dirty state
console.log("Is dirty?", section.isDirty);
console.log("Has unsaved changes?", section.hasUnsavedChanges());

// Check if loaded
console.log("DrillHole ID:", store.drillHoleId);
console.log("Is loaded?", store.isLoaded);

// Check validation
const validation = section.validate();
console.log("Valid?", validation.isValid);
console.log("Errors:", validation.errors);
```

### Issue: Version Conflict (409 Error)

**Symptoms:** Error message "Version conflict detected", save fails

**Cause:** Someone else edited the same section while you were editing

**Solution:**
1. Modal appears automatically
2. Choose "Refresh from Server" to get latest data
3. Or choose "Keep Editing" (save will still fail)
4. Manual resolution: Copy your changes, refresh, re-apply

### Issue: Data Not Updating in UI

**Symptoms:** Edit form but changes don't appear, grid doesn't refresh

**Possible Causes:**
1. Not using Zustand subscription correctly
2. Using stale closure over store data
3. Missing `watch()` in form

**Solution:**
```typescript
// ❌ DON'T: Store stale reference
const data = store.sections.collar.data;
// Later... data is stale!

// ✅ DO: Subscribe to specific slice
const data = useDrillHoleStore(state => state.sections.collar.data);

// ✅ DO: Use watch() for forms
useEffect(() => {
	const subscription = watch((formData) => {
		updateSectionData(SectionKey.Collar, formData);
	});
	return () => subscription.unsubscribe();
}, [watch, updateSectionData]);
```

### Issue: Grid Not Editable

**Symptoms:** Can't edit cells in AG Grid

**Possible Causes:**
1. `readOnlyEdit` not set
2. Missing `onCellEditRequest` handler
3. Section not editable (wrong RowStatus)

**Solution:**
```typescript
// Use useGridSection hook - handles everything
const { gridData, gridProps } = useGridSection(SectionKey.DrillMethod);

<AgGridReact
  rowData={gridData}
  {...gridProps} // ✅ Includes readOnlyEdit and onCellEditRequest
  columnDefs={columnDefs}
/>

// Check if editable
console.log('Editable?', section.isEditable());
console.log('Row status:', section.getRowStatus()); // Should be "Draft"
```

### Issue: Offline Data Not Syncing

**Symptoms:** Saved offline, but not appearing on server when online

**Possible Causes:**
1. Sync queue stuck
2. Validation errors blocking sync
3. Network error

**Solution:**
```typescript
// Check Dexie queue
import { db } from "#src/lib/db/dexie";

// Manual sync trigger (if needed)
import { processSyncQueue } from "#src/lib/services/sync-service";

const queueItems = await db.syncQueue.toArray();
console.log("Queue items:", queueItems);

// Check for errors
const errors = queueItems.filter(item => item.error);
console.log("Failed items:", errors);
await processSyncQueue();
```

---

## Additional Resources

### Related Documentation

- **Store Architecture:** [`../../store/README.md`](../../store/README.md) (if exists)
- **API Contracts:** [`../../api/database/data-contracts.ts`](../../api/database/data-contracts.ts)
- **Type Definitions:** [`../../types/drillhole.ts`](../../types/drillhole.ts)
- **Dexie Schema:** [`../../lib/db/dexie.ts`](../../lib/db/dexie.ts)

### Optimization History

- **Phase 1 (Complete):** Eliminated 743 lines of duplication
  - See: [`../../../plans/drillhole-phase1-completed.md`](../../../plans/drillhole-phase1-completed.md)
- **Phase 2 (Complete):** Improved type safety to 67%
  - See: [`../../../plans/drillhole-phase2-completed.md`](../../../plans/drillhole-phase2-completed.md)

### Design Decisions

**Why Zustand instead of Redux?**
- Simpler API, less boilerplate
- Built-in TypeScript support
- Middleware for DevTools and Immer
- Better performance

**Why Immer middleware?**
- Immutable updates with mutable syntax
- Easier to read and write
- Prevents accidental mutations
- Performance optimizations

**Why Factory Pattern?**
- DRY: No code duplication
- Consistency: All sections work the same
- Easy to extend: Add new sections quickly
- Type-safe: TypeScript enforces contracts

**Why Configuration-Driven?**
- Declarative: What, not how
- Maintainable: Central source of truth
- Extensible: Add sections without code changes
- Testable: Configuration is data

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing patterns
- Add JSDoc to exported functions
- Write tests for new features

### Adding Features

1. Check if pattern exists (factory, config, etc.)
2. Follow existing patterns
3. Update this README
4. Add tests
5. Document breaking changes

### Testing Checklist

Before committing:
- [ ] TypeScript compiles with zero errors
- [ ] All sections load correctly
- [ ] Save operations work
- [ ] Validation works as expected
- [ ] Offline mode works
- [ ] No console errors
- [ ] No performance regressions

---

## Questions?

Contact the development team or check:
- Project wiki
- Architecture decision records (ADRs)
- Code comments
- Git history for context

---

**Last Updated:** 2026-01-27
**Module Version:** 2.0 (Post-optimization)
**Maintained By:** Development Team
