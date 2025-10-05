# Testing Guide & Next Steps

## 🎯 Current Status

✅ **Infrastructure Complete:**
- 7 branches created and pushed
- All dependencies installed
- Feature flags configured
- Task files and specs in place

⚠️ **Build Status:** TypeScript errors need fixing before deployment

---

## 📋 Next Steps (In Order)

### Step 1: Fix TypeScript Errors (REQUIRED FIRST)

**Current Errors:**
1. `src/editor/svg/SelectionOverlay.tsx:142` - Parameter 'e' implicitly any
2. `src/test/setup.ts` - DOMMatrix polyfill type issues
3. `src/workers/__tests__/svgImport.worker.test.ts` - SVGO config type issues

**Which Claude Agent to Use:**
- **Main Claude instance on `develop` branch** (you're here now)
- These are infrastructure/typing issues, not feature-specific

**Quick Fixes:**
```bash
# Stay on develop branch
git checkout develop

# Start Claude Code and ask it to:
# 1. Fix the SelectionOverlay type error
# 2. Fix the DOMMatrix polyfill types
# 3. Fix the SVGO test config types
```

---

### Step 2: Verify V1 Canvas Still Works

**Test the EXISTING app (V1) - should work unchanged:**

```bash
# On develop branch with all flags = false
npm run dev

# Open http://localhost:5173
# Test:
# ✅ SVG import works
# ✅ Can select/drag slots
# ✅ Can resize slots
# ✅ No console errors
```

**Expected:** V1 canvas works perfectly (we haven't touched it)

---

### Step 3: Run Tests (After TypeScript Fixes)

```bash
# Run all tests
npm run test

# Or run with UI
npm run test:ui
```

**Expected:**
- CoordinateSystem tests should pass (if tests exist)
- Other core tests may be stubs/placeholders

---

### Step 4: Start Parallel Claude Instances

Once TypeScript errors are fixed and V1 works, start implementing on feature branches:

#### **Priority Order (Based on Dependencies):**

**🥇 FIRST WAVE (Independent - Can Run in Parallel):**

1. **Coordinate System** (No dependencies)
   ```bash
   # Terminal 1
   git checkout refactor/coordinate-system
   # Start Claude Code
   # Task: Implement CoordinateSystem.ts fully with tests
   ```

2. **Property System** (No dependencies)
   ```bash
   # Terminal 2
   git checkout refactor/property-system
   # Start Claude Code
   # Task: Implement PropertyValidator.ts fully with tests
   ```

3. **Workerized Importer** (No dependencies)
   ```bash
   # Terminal 3
   git checkout infra/workerized-importer
   # Start Claude Code
   # Task: Implement svgImport.worker.ts with Comlink
   ```

**🥈 SECOND WAVE (Depends on First Wave):**

4. **Interaction State Machine** (Uses CoordinateSystem)
   ```bash
   # Terminal 4 - START AFTER coordinate-system is merged
   git checkout refactor/interaction-sm
   # Start Claude Code
   # Task: Implement InteractionStateMachine.ts with Pointer Events
   ```

5. **Layout Constraints** (Uses PropertyValidator)
   ```bash
   # Terminal 5 - START AFTER property-system is merged
   git checkout refactor/layout-constraints
   # Start Claude Code
   # Task: Implement LayoutSolver.ts with Kiwi.js
   ```

**🥉 THIRD WAVE (Depends on Everything):**

6. **V2 Canvas** (Uses all above)
   ```bash
   # Terminal 6 - START AFTER all others are merged
   git checkout feature/v2-canvas-parallel
   # Start Claude Code
   # Task: Implement SvgStageV2.tsx using all new systems
   ```

---

## 🧪 Testing Each Branch

### For Each Feature Branch:

**Before Starting Work:**
```bash
git checkout [branch-name]
git pull origin develop  # Get latest from develop
npm run test  # Run tests to see baseline
```

**While Working:**
```bash
# Run tests continuously
npm run test

# Or with UI
npm run test:ui
```

**When Done:**
```bash
# Run full test suite
npm run test

# Build to verify no TypeScript errors
npm run build

# Create PR to develop
```

---

## 🔍 How to Test Each Module

### 1. CoordinateSystem (refactor/coordinate-system)

**Unit Tests:**
```bash
npm run test src/editor/core/__tests__/CoordinateSystem.test.ts
```

**Manual Test:**
- Not UI-visible yet
- Tests should verify:
  - Round-trip screen↔user coordinates
  - CTM caching works
  - Invalidation clears cache

**Errors → Which Agent:**
- **Stay on this branch** with the CoordinateSystem Claude instance
- Task file: `.claude/tasks/coordinate-system.md`

---

### 2. Property System (refactor/property-system)

**Unit Tests:**
```bash
npm run test src/editor/core/__tests__/PropertyValidator.test.ts
```

**Manual Test:**
- Not UI-visible yet
- Tests should verify:
  - Color validation (hex codes)
  - Number constraints (min/max)
  - Type coercion

**Errors → Which Agent:**
- **Stay on this branch** with the PropertyValidator Claude instance
- Task file: `.claude/tasks/property-system.md`

---

### 3. Workerized Importer (infra/workerized-importer)

**Unit Tests:**
```bash
npm run test src/workers/__tests__/
```

**Manual Test:**
```bash
# Enable in App.tsx temporarily
# Import an SVG and verify:
# ✅ viewBox preserved
# ✅ xlink:href → href
# ✅ Warnings for large data URIs
```

**Errors → Which Agent:**
- **Stay on this branch** with the Importer Claude instance
- Task file: `.claude/tasks/workerized-importer.md`

---

### 4. Interaction State Machine (refactor/interaction-sm)

**Unit Tests:**
```bash
npm run test src/editor/core/__tests__/InteractionStateMachine.test.ts
```

**Manual Test:**
- Not UI-visible until V2 canvas integrates it
- Tests should verify:
  - State transitions (idle→selecting→dragging)
  - Pointer capture/release
  - Threshold detection (3px)

**Errors → Which Agent:**
- **Stay on this branch** with the InteractionSM Claude instance
- Task file: `.claude/tasks/interaction-sm.md`

---

### 5. Layout Constraints (refactor/layout-constraints)

**Unit Tests:**
```bash
npm run test src/editor/core/__tests__/LayoutSolver.test.ts
```

**Manual Test:**
- Not UI-visible until V2 canvas uses it
- Tests should verify:
  - Kiwi.js constraint solving
  - Error handling for invalid constraints
  - Fallback to simple layout

**Errors → Which Agent:**
- **Stay on this branch** with the LayoutSolver Claude instance
- Task file: `.claude/tasks/layout-constraints.md`

---

### 6. V2 Canvas (feature/v2-canvas-parallel)

**Enable V2 for Testing:**
```bash
# In .env
VITE_USE_V2_CANVAS=true
```

**Manual Test:**
```bash
npm run dev

# Open http://localhost:5173
# Test all interactions:
# ✅ Click to select
# ✅ Drag to move
# ✅ Resize handles
# ✅ Multi-select (Shift+click)
# ✅ Background click deselects
# ✅ Locked slots
# ✅ Rotation (if implemented)
```

**Errors → Which Agent:**
- **Stay on this branch** with the V2 Canvas Claude instance
- Task file: `.claude/tasks/v2-canvas-parallel.md`

---

## 🚨 Error Troubleshooting Flow

### If Build Fails:

1. **Check which branch you're on:**
   ```bash
   git branch --show-current
   ```

2. **Run TypeScript check:**
   ```bash
   npx tsc --noEmit
   ```

3. **Fix on the correct branch:**
   - If error in `src/editor/core/CoordinateSystem.ts` → Use `refactor/coordinate-system` branch
   - If error in `src/editor/svg-v2/*` → Use `feature/v2-canvas-parallel` branch
   - If error in `src/workers/*` → Use `infra/workerized-importer` branch
   - If error in infrastructure (test setup, config) → Use `develop` branch

4. **Ask the right Claude instance:**
   - Each branch should have its own Claude Code instance
   - The instance on that branch knows the context from `.claude/tasks/[task-name].md`

---

### If Tests Fail:

1. **Check which test is failing:**
   ```bash
   npm run test -- --reporter=verbose
   ```

2. **Fix on the correct branch:**
   - Test file path shows which module (e.g., `CoordinateSystem.test.ts`)
   - Switch to that branch and use that Claude instance

---

### If V1 Canvas Breaks:

⚠️ **CRITICAL:** V1 should never break!

1. **Check feature flags:**
   ```bash
   cat .env
   # All should be false:
   # VITE_USE_V2_CANVAS=false
   # VITE_STATE_MACHINE=false
   # VITE_NEW_PROPERTIES=false
   ```

2. **Revert to last known good:**
   ```bash
   git checkout main
   npm run dev
   # Should work (this is the original code)
   ```

3. **Check what changed:**
   ```bash
   git diff main develop
   # Should ONLY be additions, not modifications to existing V1 files
   ```

---

## 📊 Progress Tracking

### Daily Standup:

```bash
# Check status across all branches
npm run refactor:status

# Or manually:
git checkout develop && git log --oneline -5
git checkout refactor/coordinate-system && git log --oneline -3
git checkout refactor/interaction-sm && git log --oneline -3
# ... etc
```

### When a Branch is Done:

1. **Run full test suite:**
   ```bash
   git checkout [branch-name]
   npm run test
   npm run build
   ```

2. **Create PR to develop:**
   - Title: `[Refactor] Implement [Module Name]`
   - Include test coverage screenshot
   - Reference task file
   - Link to spec doc

3. **Merge order (respect dependencies):**
   - ✅ First: coordinate-system, property-system, workerized-importer
   - ✅ Second: interaction-sm, layout-constraints
   - ✅ Last: v2-canvas-parallel

---

## 🎯 Definition of Done (Per Branch)

**Before merging to develop:**

- [ ] All TypeScript errors resolved (`npm run build` succeeds)
- [ ] Unit tests written and passing (`npm run test`)
- [ ] Test coverage > 90% for the module
- [ ] Task file requirements met (check `.claude/tasks/[name].md`)
- [ ] No breaking changes to V1 canvas
- [ ] Documentation updated (if needed)
- [ ] PR created with checklist

---

## 🚀 Launch Checklist (When All Branches Merged)

**Integration Testing:**

```bash
# Create integration branch
git checkout -b integration/v2-full develop

# Merge all in order
git merge refactor/coordinate-system --no-ff
git merge refactor/property-system --no-ff
git merge infra/workerized-importer --no-ff
git merge refactor/interaction-sm --no-ff
git merge refactor/layout-constraints --no-ff
git merge feature/v2-canvas-parallel --no-ff

# Test with V2 enabled
# In .env: VITE_USE_V2_CANVAS=true
npm run test
npm run build
npm run dev

# Full manual test suite:
# ✅ All V1 features work
# ✅ All V2 features work
# ✅ No console errors
# ✅ No memory leaks
# ✅ Performance acceptable
```

**If all tests pass:**
- Merge integration branch → develop
- Merge develop → main
- Deploy!

---

## 📞 Quick Help Reference

| Issue | Branch | Claude Instance | Task File |
|-------|--------|-----------------|-----------|
| TypeScript errors (infra) | develop | Main instance | N/A |
| CoordinateSystem bugs | refactor/coordinate-system | Terminal 1 | coordinate-system.md |
| PropertyValidator bugs | refactor/property-system | Terminal 2 | property-system.md |
| SVG import bugs | infra/workerized-importer | Terminal 3 | workerized-importer.md |
| Interaction bugs | refactor/interaction-sm | Terminal 4 | interaction-sm.md |
| Layout bugs | refactor/layout-constraints | Terminal 5 | layout-constraints.md |
| V2 Canvas bugs | feature/v2-canvas-parallel | Terminal 6 | v2-canvas-parallel.md |
| V1 Canvas breaks | develop | Main instance | Check git diff |

---

## ⚡ TL;DR Quick Start

**Right Now (Immediate):**
```bash
# Fix TypeScript errors first
git checkout develop
# Use Claude Code to fix the 3 type errors shown above
npm run build  # Should succeed after fixes
```

**Then (Start Feature Work):**
```bash
# Open 3 terminals for first wave:
# Terminal 1: git checkout refactor/coordinate-system
# Terminal 2: git checkout refactor/property-system
# Terminal 3: git checkout infra/workerized-importer

# Start Claude Code on each terminal
# Follow the task files in .claude/tasks/
```

**Test Everything:**
```bash
# V1 should always work (flags = false)
npm run dev

# Tests
npm run test
```

---

**You're all set! Start by fixing the TypeScript errors on `develop`, then launch your parallel Claude instances!** 🚀
