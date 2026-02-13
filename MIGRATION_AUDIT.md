# Migration Audit Report: `Migrate/` → `ExistingCode/`

## Scope
This audit compares the requested migration surfaces from `Migrate/` against the existing architecture in `ExistingCode/`, with an explicit focus on:

- data-layer consistency,
- elimination of duplication,
- store/component reuse,
- and architectural fit.

Reviewed migration targets:

- `Migrate/src/pages/drill-hole`
- `Migrate/src/pages/drill-plan`
- `Migrate/src/pages/drill-pattern`
- `Migrate/src/pages/drill-program`
- `Migrate/src/ux/features/dashboard`
- `Migrate/src/pages/visual-mapper`
- `Migrate/src/pages/qaqc`
- plus explicit file mappings for `DispatchSection.tsx`, `SampleSection.tsx`, and `CollarCoordinateForm.tsx`.

---

## Executive Summary

1. **`ExistingCode/` already contains a mature data-access and feature layering model** (domain repos/services + feature-level stores/services). Migration should extend this, not bypass it.
2. **`Migrate/` has multiple direct Dexie/sync patterns and parallel store logic** that conflict with the required source-of-truth architecture.
3. **`drill-hole` in `Migrate/` is the highest duplication/risk area** due to direct DB access, sync queue manipulation, and competing save paths.
4. **`DispatchSection` and `SampleSection` should be integrated as new sections inside `ExistingCode/src/features/pages/drill-hole-data/sections`** while wiring all reads/writes through `drill-hole-data-service` + `collarService` (no direct Dexie APIs from UI/store layers).
5. **`CollarCoordinateForm` already exists in `ExistingCode` and should remain canonical.** If any UX behavior from `Migrate` is needed, it should be added incrementally to the existing form/hook, not by file replacement.

---

## Current Target Architecture in `ExistingCode`

### 1) Feature-layer composition and boundaries
- `drill-hole-data` already has clear sections: store, services, hooks, validation, views, grids/forms. 
- Data mutations are funneled through `drill-hole-data-service` and section-level state actions.

### 2) Existing data-access layer (required source of truth)
- Data-access APIs and repos already exist under `ExistingCode/src/data-access/**`, including `drill-plan` domain/repo/service and table schemas.
- `drill-hole-data-service` is already integrated with `collarService` and data-access index exports for cache/API behavior.

### 3) Existing lookup strategy
- Existing feature code uses `#src/data-access/hooks/useLookups.js` in multiple places (forms, drawers, column defs), which should be the default lookup pathway.

---

## High-Risk Findings in `Migrate`

### A) Direct Dexie and custom sync plumbing (must be removed from migrated logic)
`Migrate` currently contains direct Dexie/live query usage in feature/UI code paths, including:

- dashboard uses `dexie-react-hooks` + direct `db.DrillHole_Collar.toArray()`;
- drill-hole store actions/loaders reference Dexie sync queue and DB-level flags.

**Why this is a blocker:** It creates a parallel data-access stack and bypasses existing repository/service orchestration.

### B) Parallel/duplicate store and utility surface
`Migrate/src/pages/drill-hole/store/*` duplicates patterns already present in `ExistingCode/src/features/pages/drill-hole-data/store/*`.

**Migration requirement:** merge capabilities into existing store/actions/services; do not copy parallel state machines.

### C) Service drift / dead or partial modules
`Migrate/src/pages/drill-pattern/services/drillPatternService.ts` is effectively commented out and not aligned to existing data-access conventions.

**Migration requirement:** implement drill-pattern via `ExistingCode` domain/repo/service conventions (or extend existing drill-plan-adjacent modules where appropriate), not ad-hoc page services.

---

## Detailed Comparison by Requested Area

## 1) `drill-hole`

### Existing coverage
`ExistingCode/src/features/pages/drill-hole-data` already includes:
- robust section-based store/actions/loaders,
- section forms/grids,
- validation packages,
- hook ecosystem,
- service orchestration through `drill-hole-data-service`.

### Migration strategy
- Treat `Migrate` implementation as **behavioral reference only**.
- Port only missing UX/business behavior into existing:
  - `store/section-config.ts`,
  - `store/section-factory.ts`,
  - section components in `sections/forms` and `sections/grids`,
  - and `services/drill-hole-data-service.ts` extension points.
- Remove any direct DB references from migrated view/store layers.

### Explicit mapping actions
1. `DispatchSection.tsx` → add to `ExistingCode/src/features/pages/drill-hole-data/sections/forms`:
   - introduce as a form/grid hybrid section wired to existing section key contracts;
   - route lab dispatch + sample retrieval through existing service/repository interfaces.
2. `SampleSection.tsx` → add as/into existing sampling section(s):
   - reuse `AllSamplesGrid` and existing sample operations hooks where possible;
   - migrate only missing QAQC insertion UX and context-menu behavior.
3. `CollarCoordinateForm.tsx`:
   - keep `ExistingCode` version canonical;
   - cherry-pick only UX deltas from `Migrate` into current hook/form.

---

## 2) `drill-plan`

### Existing coverage
`ExistingCode/src/data-access/domain/drill-plan/*` already provides schema/repo/service/list/ssrm/fk validation modules.

### Migration strategy
- Any drill-plan page logic from `Migrate` must consume these existing domain services.
- Do not create page-local persistence helpers or alternate repositories.

---

## 3) `drill-pattern`

### Existing coverage gap
No direct feature page found in `ExistingCode` for drill-pattern.

### Migration strategy
- Introduce new feature module under existing feature/page conventions, but:
  - data contracts and API access must be defined in `data-access/domain` first,
  - then consumed from feature hooks/stores.
- Reuse generic list/detail grid patterns from existing pages.

---

## 4) `drill-program`

### Existing coverage gap
No clearly established `drill-program` feature module in `ExistingCode` pages surfaced in this audit.

### Migration strategy
- Add as a new feature, but follow identical layering:
  - domain schema/repo/service in data-access,
  - feature-level orchestration in `features/pages/...`.

---

## 5) `dashboard`

### Finding
`Migrate` dashboard directly queries Dexie via live query.

### Migration strategy
- Replace with existing repository/service selectors (or a dashboard-specific service that wraps data-access modules).
- Keep live/reactive behavior only if exposed through existing service adapters, not direct table calls from component layer.

---

## 6) `visual-mapper`

### Coverage status
No direct equivalent surfaced during this pass.

### Migration strategy
- Treat as a new feature; establish domain interfaces in data-access first.
- Reuse shared UI primitives and existing feature scaffolding conventions.

---

## 7) `qaqc`

### Existing coverage
- Existing drill-hole-data already includes QAQC view/columns.
- Existing data-access includes multiple QAQC-related table schemas/views.

### Migration strategy
- Consolidate `Migrate/src/pages/qaqc/*` into existing QAQC data contracts and table/view services.
- Reuse existing QAQC columns/view composition where possible.

---

## Duplicate/Conflict Matrix (Priority)

## P0 – Must resolve before merge
- Any direct Dexie access in feature stores/components.
- Any use of `dexie-react-hooks` in migrated page layer that bypasses existing data services.
- Any parallel sync queue/state mechanism in migrated store logic.

## P1 – Strongly recommended in first migration wave
- Consolidate duplicate section hooks (sample operations, section actions, loaders).
- Normalize lookup access to `useLookup/useLookups` from data-access hooks.
- Eliminate duplicate validation schema copies where existing schema/helpers already exist.

## P2 – Follow-up optimization
- Remove dead/commented service stubs in migrated modules.
- Standardize naming and folder boundaries for new modules (drill-pattern/program/visual-mapper).

---

## Proposed Implementation Plan (Incremental)

1. **Foundation pass (no UI change):**
   - Add/extend data-access domain services for missing entities (pattern/program/visual mapper as needed).
2. **Drill-hole convergence pass:**
   - Integrate `DispatchSection` and `SampleSection` into existing section architecture.
   - Wire all save/load paths through existing `drill-hole-data-service`.
3. **QAQC/dashboard pass:**
   - Rewire dashboard and qaqc pages to consume existing repositories/services.
4. **Feature enablement pass:**
   - Add drill-pattern/program/visual-mapper feature modules using ExistingCode conventions.
5. **Hardening pass:**
   - dead-code removal, de-duplication, lint/type checks, regression checks for offline/sync workflows.

---

## Acceptance Checklist for Actual Migration PRs

- [ ] No direct Dexie usage in migrated feature stores/components.
- [ ] No `dexie-syncable` or parallel sync mechanism introduced.
- [ ] All read/write calls route through `ExistingCode` data-access interfaces/services.
- [ ] No duplicated utilities/hooks/components where existing equivalents exist.
- [ ] Existing drill-hole-data behavior remains stable.
- [ ] QAQC/dashboard flows remain compatible with current data contracts.

