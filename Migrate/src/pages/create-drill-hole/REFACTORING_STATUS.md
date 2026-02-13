# Create Drill Hole - Refactoring Status

## Background

On 2026-02-10, user provided critical clarification:
- **This module does NOT create drill holes** - they already exist
- **This is a DATA ENTRY module** for existing drill holes
- Each section saved individually, not bulk submission
- HoleId = CollarId = DrillPlanId (same identifier)

## Refactoring Required

See detailed plan: [`plans/create-drill-hole-refactor-to-data-entry.md`](../../../plans/create-drill-hole-refactor-to-data-entry.md)

---

## Phase 1: Core Architecture ⚠️ IN PROGRESS

### Service Layer (`src/services/createDrillholeService.ts`)

#### Status: PARTIALLY COMPLETE ✅⚠️

**Completed:**
- ✅ Updated header comments to clarify data entry purpose
- ✅ Added `loadDrillHoleForEntry()` function
- ✅ Added `saveSectionData()` function  
- ✅ Added `fetchDrillPlanMetadata()` for reference only
- ✅ Import `UpsertCollarDto` type

**Remaining:**
- ⚠️ Fix TypeScript errors in old functions (submitDrillHole, buildUpsertCollarDto)
- ⚠️ Remove or deprecate bulk submission functions
- ⚠️ Complete import of `fetchDrillHoleFromApi` from drillholeService

### Store Loaders (`src/pages/create-drill-hole/store/store-loaders.ts`)

#### Status: NOT STARTED ❌

**Required Changes:**
```typescript
// CURRENT (INCORRECT):
export async function initializeDrillHole(
  set: Function,
  drillPlanId: string // ❌ Wrong parameter
): Promise<void> {
  const plan = await fetchDrillPlan(drillPlanId); // ❌ Fetches plan
  initializeSectionsFromPlan(state, plan); // ❌ Initializes from plan
}

// SHOULD BE:
export async function initializeDrillHole(
  set: Function,
  drillHoleId: string // ✅ Use drillHoleId
): Promise<void> {
  const drillHole = await loadDrillHoleForEntry(drillHoleId); // ✅ Load existing
  initializeSectionsFromDrillHole(state, drillHole); // ✅ Initialize from drill hole
}
```

### Section Mappers (`src/pages/create-drill-hole/store/section-mappers.ts`)

#### Status: NOT STARTED ❌

**Required Changes:**
- ❌ Rename `initializeSectionsFromPlan()` → `initializeSectionsFromDrillHole()`
- ❌ Change parameter from `VwDrillPlan` → `UiDrillHole`
- ❌ Map from existing drill hole data (not empty sections)
- ❌ Remove `buildCreateCollarDto()` (no bulk submission)

**Pattern to Follow:**
```typescript
// Use same pattern as drill-hole module
// See: src/pages/drill-hole/store/section-mappers.ts line 165-265

export function initializeSectionsFromDrillHole(
  state: Draft<CreateDrillHoleState>,
  drillHole: UiDrillHole
): void {
  console.log("📊 [MAPPER:INIT] Initializing sections from existing drill hole");
  
  // Map API data to store sections
  state.sections.rigsheet.data = drillHole.RigSetup || {};
  state.sections.collarcoordinates.data = drillHole.CollarCoordinate || {};
  state.sections.drillmethod.data = drillHole.DrillMethod || [];
  // ... etc for all sections
}
```

### Route Configuration

#### Status: NOT STARTED ❌

**Required Changes:**
- ❌ Change route param from `drillPlanId` to `drillHoleId`
- ❌ Update `CreateDrillHoleView` to read `drillHoleId` from params

```typescript
// routes/modules/create-drill-hole.ts
path: "/create-drill-hole/:drillHoleId" // ✅ Use drillHoleId

// views/CreateDrillHoleView.tsx
const { drillHoleId } = useParams<{ drillHoleId: string }>();
```

---

## Phase 2: Save Logic ⏳ PENDING

### Store Actions (`src/pages/create-drill-hole/store/store-actions.ts`)

#### Status: NOT STARTED ❌

**Required Changes:**
- ❌ Ensure `saveSection()` calls `saveSectionData()` (not bulk submit)
- ❌ Remove `submitDrillHole()` or repurpose as status change only
- ❌ Each section saves independently

**Current Implementation Status:**
- ✅ `saveSection()` already exists (from drill-hole pattern)
- ⚠️ Need to verify it uses individual saves, not bulk

---

## Phase 3: UI Updates ⏳ PENDING

### Header Component

#### Status: NOT STARTED ❌

**Required Changes:**
- ❌ Change title from "Create Drill Hole" to "Data Entry - {HoleNm}"
- ❌ Remove "Create" button or change to "Complete Review"

### Section Components

#### Status: NOT BUILT YET ❌

**Required Design:**
- Each section needs individual "Save" button
- Save button saves ONLY that section
- No global "Submit All" button

---

## Phase 4: Navigation ⏳ PENDING

### DrillPlanListView

#### Status: NOT STARTED ❌

**Required Changes:**
- ❌ Add "Enter Data" button to each row
- ❌ Button enabled only when `CollarId IS NOT NULL`
- ❌ Navigate to `/create-drill-hole/{drillPlanId}`

```typescript
// Column definition
{
  title: "Actions",
  key: "actions",
  render: (_, record) => (
    <Button
      onClick={() => navigate(`/create-drill-hole/${record.DrillPlanId}`)}
      disabled={!record.CollarId}
      icon={<EditOutlined />}
    >
      Enter Data
    </Button>
  )
}
```

---

## Critical Path Forward

### Immediate Next Steps (MUST DO):

1. **Fix TypeScript errors in createDrillholeService.ts**
   - Add proper imports
   - Fix function signatures
   - Remove/deprecate old creation functions

2. **Update store-loaders.ts**
   - Change `initializeDrillHole()` to use `loadDrillHoleForEntry()`
   - Update parameter from `drillPlanId` to `drillHoleId`

3. **Update section-mappers.ts**
   - Create `initializeSectionsFromDrillHole()`
   - Map from `UiDrillHole` instead of `VwDrillPlan`

4. **Update routes**
   - Change param from `drillPlanId` to `drillHoleId`
   - Update view to read correct param

5. **Test data loading**
   - Verify existing drill hole loads correctly
   - Verify sections populate with existing data

### Can Wait Until Later:

6. Build individual section components (24 total)
7. Add "Enter Data" button to DrillPlanListView
8. Update UI labels and titles
9. Write tests

---

## Key Insights

### Architecture Clarity

**OLD UNDERSTANDING (WRONG):**
```
DrillPlan → Create Module → Build DTO → POST /collar → New Drill Hole
```

**NEW UNDERSTANDING (CORRECT):**
```
Existing DrillHole → Load Data → Edit Section → Save → PATCH /section
```

### Code Reuse

**Good News:** Most infrastructure is correct!
- ✅ Section factory pattern works
- ✅ Store structure is good
- ✅ Validation works
- ✅ Dexie caching works

**What Needs Changing:** Just the initialization and terminology
- Change "create" → "data entry"
- Load existing instead of starting from plan
- Individual saves instead of bulk submit

---

## Timeline Estimate

### Phase 1 (Core Refactoring): 2-3 hours
- Fix service layer: 30 min
- Update store loaders: 30 min  
- Update section mappers: 1 hour
- Update routes: 30 min
- Test: 30 min

### Phase 2 (Save Logic): 1 hour
- Verify/update save actions: 30 min
- Remove bulk submit: 30 min

### Phase 3 (UI Updates): 1-2 hours
- Update labels: 30 min
- Add section save buttons: 1 hour (during component building)

### Phase 4 (Navigation): 1 hour
- Add button to DrillPlanListView: 30 min
- Test navigation: 30 min

**Total Refactoring:** 5-7 hours before continuing with section components

---

## Questions for User

1. **Drill Hole Identification:** 
   - Should route use `drillHoleId` or continue with `drillPlanId`?
   - They're the same value, but which name is clearer?

2. **Bulk Submit Button:**
   - Keep "Submit" button that updates all section statuses to "Complete"?
   - Or remove entirely and rely on section-by-section completion?

3. **Module Naming:**
   - Keep folder name `create-drill-hole`?
   - Or rename to `drill-hole-entry` or similar?

---

## Next Action

**Recommended:** Complete Phase 1 refactoring before building section components.

This ensures the foundation is correct before adding 24 section components on top.

**User: Please confirm approach or provide direction.**
