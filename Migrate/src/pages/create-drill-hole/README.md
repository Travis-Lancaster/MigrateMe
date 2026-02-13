# Create Drill Hole Module

**Status**: 🚧 **IN DEVELOPMENT**  
**Version**: 1.0.0  
**Architecture**: See [`plans/create-drill-hole-architecture.md`](../../plans/create-drill-hole-architecture.md)

---

## Overview

The Create Drill Hole module is a **progressive data entry system** for creating new drill holes from drill plans. It implements a mobile/tablet-optimized workflow for field geologists to log drill hole data offline-first.

### Key Features

- **Progressive Workflow**: Horizontal tabs guide users through 7 main sections
- **Offline-First**: All data cached in Dexie, synced on submit
- **Draft Persistence**: Resume work across sessions
- **Drawer Editor**: Mobile-optimized detailed editing
- **Two-Tier Validation**: Database constraints (blocking) + business rules (non-blocking)
- **82% Code Reuse**: Leverages existing drill-hole module architecture

---

## Architecture

### Based On

This module is 100% structurally identical to [`src/pages/drill-hole`](../drill-hole) but adapted for the creation workflow.

### Key Differences

| Aspect | drill-hole (View/Edit) | create-drill-hole (Create) |
|--------|------------------------|----------------------------|
| **Purpose** | View and edit existing | Create new from plan |
| **Entry Point** | DrillHoleId | DrillPlanId + PlannedHoleNm |
| **Initial State** | Load from API | Initialize from plan template |
| **Workflow** | Review → Edit → Submit | Progressive entry → Submit |
| **Sections** | 9 sections | 7 main + 17 sub = 24 total |
| **UI** | Desktop vertical tabs | Mobile horizontal tabs |

---

## Sections

### 7 Main Sections

1. **Setup**: RigSetup + CollarCoordinate configuration
2. **Geology Log**: Primary logging with view lenses (Litho/Alteration/Veins)
3. **Geotech**: 7 geotechnical logging sub-sections
4. **Sampling**: Sample generation and dispatch
5. **QAQC**: Quality control validation
6. **SignOff**: Final collar sign-off
7. **Summary**: Completion overview

### 24 Total Sections

See [Architecture Plan](../../plans/create-drill-hole-architecture.md#feature-mapping) for complete section mapping.

---

## Technology Stack

- **React 18** + TypeScript
- **Zustand** (state management with Immer)
- **Dexie** (IndexedDB offline cache)
- **Zod** (validation schemas)
- **AG Grid React** (data grids)
- **Ant Design** (UI components)

---

## Quick Start

### Development

```bash
# Navigate to module
cd src/pages/create-drill-hole

# Run in development mode
npm run dev

# Navigate to create drill hole
# http://localhost:3000/create-drill-hole/:drillPlanId/:plannedHoleNm
```

### Testing

```bash
# Run unit tests
npm run test src/pages/create-drill-hole

# Run integration tests
npm run test:integration create-drill-hole

# Run E2E tests
npm run test:e2e create-drill-hole
```

---

## Module Structure

```
src/pages/create-drill-hole/
├── index.tsx                           # Route entry
├── README.md                           # This file
│
├── components/                         # UI Components
│   ├── index.ts                       # Barrel export
│   ├── CreateDrillHoleHeader.tsx      # Header with hole info
│   ├── HorizontalTabs.tsx             # Tab navigation
│   ├── ViewLensSelector.tsx           # Geology log filters
│   ├── DrawerEditor.tsx               # Right-side drawer
│   └── ... (more components)
│
├── hooks/                              # Custom Hooks
│   ├── index.ts
│   ├── useCreateWorkflow.ts           # Creation workflow logic
│   ├── useSetupForm.ts                # Setup section form
│   └── ... (more hooks)
│
├── sections/                           # Section Components
│   ├── SetupSection.tsx               # Rig + Coordinate setup
│   ├── GeologyLogSection.tsx          # Main geology logging
│   ├── GeotechSection.tsx             # Geotech composite
│   ├── SamplingSection.tsx            # Sampling composite
│   └── ... (more sections)
│
├── store/                              # Zustand Store
│   ├── create-drillhole-store.ts      # Main store
│   ├── section-config.ts              # Section definitions
│   ├── section-factory.ts             # REUSE from drill-hole
│   ├── store-actions.ts               # Business logic
│   └── ... (more store modules)
│
├── validation/                         # Validation Layer
│   ├── base-schemas.ts                # REUSE from drill-hole
│   ├── geology-database-validator.ts  # Tier 1
│   ├── geology-save-validator.ts      # Tier 2
│   └── ... (more validators)
│
└── views/
    └── CreateDrillHoleView.tsx        # Main view
```

---

## Data Flow

```
User Action (Field Entry)
    ↓
React Component
    ↓
Custom Hook (Business Logic)
    ↓
Zustand Store Action
    ↓
Dexie Cache (Offline) → API Service (On Submit)
    ↓
Store Updated
    ↓
Components Re-render
```

---

## Implementation Status

### Week 1: Foundation ✅
- [x] Folder structure
- [x] README.md
- [ ] Store architecture
- [ ] Service layer
- [ ] Dexie extension
- [ ] Base validation

### Week 2: Setup Section 🚧
- [ ] SetupSection component
- [ ] RigSheet integration
- [ ] CollarCoordinate integration
- [ ] Validation (Tier 1 + 2)

### Week 3-7: Remaining Sections 📋
- See [Implementation Roadmap](../../plans/create-drill-hole-architecture-part2.md#implementation-roadmap)

---

## Console Logging

Detailed debugging with emoji prefixes:

```typescript
console.log("📂 [STORE:CREATE] Initializing drill hole from plan");
console.log("💾 [SERVICE] Saving draft to Dexie");
console.log("🔍 [VALIDATION:Tier1] Database validation: 2 blocking errors");
console.log("✅ [SECTION:SETUP] Setup section complete");
```

---

## Contributing

### Adding a New Section

1. Create section component in `sections/`
2. Define validation schemas in `validation/`
3. Add to section config in `store/section-config.ts`
4. Create custom hook in `hooks/`
5. Add tests
6. Update this README

### Code Style

- Follow [Feature Blueprint Style Guide](../../plans/feature-blueprint-style-guide.md)
- Use TypeScript strict mode
- Console.log at key points
- Two-tier validation (database + save)
- Offline-first pattern

---

## Resources

- [Architecture Plan](../../plans/create-drill-hole-architecture.md)
- [Implementation Roadmap](../../plans/create-drill-hole-architecture-part2.md)
- [Feature Blueprint Style Guide](../../plans/feature-blueprint-style-guide.md)
- [Reference Module: drill-hole](../drill-hole/README.md)

---

**Module Owner**: Frontend Team  
**Last Updated**: 2026-02-09  
**Status**: In Development
