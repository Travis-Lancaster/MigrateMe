# Refactoring Progress - Data Entry Workflow

## Session: 2026-02-10

### Summary

Refactoring create-drill-hole module from "creation" workflow to "data entry" workflow based on user clarification that drill holes already exist weeks before this code runs.

---

## ✅ Completed

### 1. Documentation
- ✅ Created comprehensive refactoring plan: [`plans/create-drill-hole-refactor-to-data-entry.md`](../../../plans/create-drill-hole-refactor-to-data-entry.md)
- ✅ Created refactoring status tracker: [`REFACTORING_STATUS.md`](./REFACTORING_STATUS.md)

### 2. Service Layer (`src/services/createDrillholeService.ts`)
- ✅ Updated header comments to clarify data entry purpose
- ✅ Added import for `fetchDrillHoleFromApi` and `saveDrillHoleSection`
- ✅ Added `loadDrillHoleForEntry()` function - loads existing drill hole using drill-hole module's pattern
- ✅ Added imports for `UpsertCollarDto` type

**Key Changes:**
```typescript
// OLD: Fetch drill plan for creation
export async function fetchDrillPlan(drillPlanId: string): Promise<VwDrillPlan>

// NEW: Load existing drill hole for data entry  
export async function loadDrillHoleForEntry(drillHoleId: string): Promise<UiDrillHole> {
  const drillHole = await fetchDrillHoleFromApi(drillHoleId); // Reuse drill-hole service
  return drillHole;
}
```

### 3. Store Loaders (`src/pages/create-drill-hole/store/store-loaders.ts`)
- ✅ Updated header comments to clarify data entry workflow
- ✅ Changed `initializeDrillHole()` function signature:
  - **OLD:** `initializeDrillHole(set, get, drillPlanId, plannedHoleNm)`
  - **NEW:** `initializeDrillHole(set, get, drillHoleId)`
- ✅ Updated initialization logic to load existing drill hole (not drill plan)
- ✅ Added calls to `loadDrillHoleForEntry()` and `initializeSectionsFromDrillHole()`

**Key Changes:**
```typescript
// OLD: Initialize from drill plan
const plan = await fetchDrillPlan(drillPlanId);
mapDrillPlanToSections(state, plan);

// NEW: Load existing drill hole
const drillHole = await loadDrillHoleForEntry(drillHoleId);
initializeSectionsFromDrillHole(state, drillHole);
```

---

## ⚠️ In Progress

### 4. Store Interface (`src/pages/create-drill-hole/store/create-drillhole-store.ts`)
- ⚠️ Need to add `drillHoleId` and `collarId` fields to state interface
- ⚠️ TypeScript errors from store-loaders.ts trying to set these fields

**Required Changes:**
```typescript
export interface CreateDrillHoleState {
  // Add these fields:
  drillHoleId: string | null;
  collarId: string | null;
  
  // Existing fields:
  drillPlanId: string | null;
  plannedHoleNm: string | null;
  // ... rest
}
```

---

## 🔲 Not Started

### 5. Section Mappers (`src/pages/create-drill-hole/store/section-mappers.ts`)
- ❌ Need to create `initializeSectionsFromDrillHole()` function
- ❌ Remove `buildCreateCollarDto()` (no bulk submission)
- ❌ Change from `VwDrillPlan` parameter to `UiDrillHole`

**Pattern to Follow:**
```typescript
// Reuse drill-hole module's pattern
// See: src/pages/drill-hole/store/section-mappers.ts

export function initializeSectionsFromDrillHole(
  state: Draft<CreateDrillHoleState>,
  drillHole: UiDrillHole
): void {
  // Map existing data to sections (not empty templates)
  state.sections.rigsheet.data = drillHole.RigSetup || {};
  state.sections.collarcoordinates.data = drillHole.CollarCoordinate || {};
  state.sections.drillmethod.data = drillHole.DrillMethod || [];
  // ... all 24 sections
}
```

### 6. Routes (`src/router/routes/modules/create-drill-hole.ts`)
- ❌ Change route param from `drillPlanId` to `drillHoleId`
- ❌ Update view component to read correct param

### 7. View Component (`src/pages/create-drill-hole/views/CreateDrillHoleView.tsx`)
- ❌ Change `useParams<{ drillPlanId: string }>` to `useParams<{ drillHoleId: string }>`
- ❌ Update `initializeDrillHole()` call to use drillHoleId

### 8. Store Actions (Verification)
- ❌ Verify `saveSection()` uses individual saves (should be correct already)
- ❌ Remove or deprecate `submitDrillHole()` bulk submission function

---

## Key Architectural Changes

### Before (WRONG):
```
User clicks "Create" from Drill Plan
  → Fetch drill plan template
    → Initialize empty sections
      → User fills all sections
        → Click "Submit" 
          → Build CreateCollarDto with ALL sections
            → POST /api/collar (creates new)
```

### After (CORRECT):
```
User clicks "Enter Data" on existing hole
  → Load existing drill hole (UiDrillHole)
    → Populate sections with existing data
      → User edits/adds data section by section
        → Click "Save" on each section
          → PATCH /api/collar/{id}/section (updates existing)
            → (No bulk submit)
```

---

## TypeScript Errors to Fix

### store-loaders.ts:
```
- Property 'drillHoleId' does not exist on type 'CreateDrillHoleState'
- Property 'collarId' does not exist on type 'CreateDrillHoleState'
- Property 'DrillPlanId' does not exist on type 'CollarBase'
- Property 'HoleNm' does not exist on type 'CollarBase'
```

**Fix:** Update store interface to include `drillHoleId` and `collarId` fields.

### section-mappers.ts:
```
- Function 'initializeSectionsFromDrillHole' not found
```

**Fix:** Create this function in section-mappers.ts

---

## Next Steps (Priority Order)

1. **Update store interface** - Add `drillHoleId` and `collarId` fields
2. **Create section mappers** - Implement `initializeSectionsFromDrillHole()`
3. **Update routes** - Change param from `drillPlanId` to `drillHoleId`
4. **Update view** - Use correct param name
5. **Verify save actions** - Ensure individual saves (not bulk)
6. **Test loading** - Verify existing drill hole loads correctly

---

## Estimated Time Remaining

- Store interface: 15 min
- Section mappers: 30 min
- Routes + View: 20 min
- Verification + Testing: 30 min

**Total:** ~1.5-2 hours to complete Phase 1

---

## Files Modified So Far

1. ✅ `src/services/createDrillholeService.ts`
2. ✅ `src/pages/create-drill-hole/store/store-loaders.ts`
3. ⏳ `src/pages/create-drill-hole/store/create-drillhole-store.ts` (in progress)
4. ❌ `src/pages/create-drill-hole/store/section-mappers.ts` (pending)
5. ❌ `src/router/routes/modules/create-drill-hole.ts` (pending)
6. ❌ `src/pages/create-drill-hole/views/CreateDrillHoleView.tsx` (pending)

---

## Testing Checklist

After Phase 1 completion:

- [ ] Can load existing drill hole by ID
- [ ] Sections populate with existing data (not empty)
- [ ] Store state has correct identifiers (drillHoleId = collarId = drillPlanId)
- [ ] No TypeScript errors
- [ ] View renders without crashes
- [ ] Console logs show "data entry" workflow (not "creation")

---

## Notes

- The core infrastructure (section factory, validation, Dexie cache) is correct and doesn't need changes
- Main changes are in initialization logic and terminology
- Individual section saves already work (inherited from drill-hole pattern)
- Most of the refactoring is changing "load plan → create" to "load hole → edit"
