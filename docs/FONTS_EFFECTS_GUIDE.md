# Font & Text Effects System - Implementation Guide

## 🎯 Overview

This guide walks through implementing a comprehensive typography and effects system using **4 parallel feature branches**, similar to the V2 canvas refactor.

**Goals:**
- Robust typography with Google Fonts picker, text transforms, auto-fit
- SVG effects engine (shadow, neon, glitch, hollow, outline, etc.)
- Generic position controls for all slot types
- Canva + Templated.io combined UI

---

## 📋 Quick Start

### Current Status

✅ **Infrastructure Complete:**
- 4 feature branches created
- Task files in `.claude/tasks/`
- Boundaries defined in `.claude/boundaries.json`
- Feature flags added to `.env`

⚠️ **Implementation Status:** Ready to start (all branches at `develop` baseline)

---

## 🌲 Branch Structure & Dependencies

### Wave 1 (Parallel - No Dependencies)

These 3 branches can be developed **simultaneously**:

1. **`feature/text-typography-system`**
   - Typography property validators
   - Google Fonts integration
   - Text transforms (uppercase, title, sentence)
   - Auto-fit and text wrapping logic

2. **`feature/svg-effects-engine`**
   - SVG filter builders (shadow, neon, glitch, etc.)
   - Effects manager with caching
   - Preset property bundles
   - Stroke/outline utilities

3. **`feature/position-transform-controls`**
   - Z-order operations (bring to front, send to back)
   - Alignment to page/canvas
   - Distribution (horizontal/vertical spacing)
   - Numeric transform inputs

### Wave 2 (After Wave 1 Merged)

4. **`feature/effects-ui-panels`**
   - **Depends on:** Wave 1 branches merged
   - Typography toolbar (top bar)
   - Effects panel (right rail)
   - Position panel (right rail)
   - Mixed-state UI for multi-select
   - Command merging for undo/redo

---

## 🚀 Getting Started on Each Branch

### Branch 1: Text Typography System

```bash
# Start on this branch
git checkout feature/text-typography-system

# Read the task file
cat .claude/tasks/text-typography-system.md

# Key files to create:
# - src/editor/text/textTransforms.ts
# - src/editor/text/textLayout.ts
# - src/hooks/useFontAvailability.ts
# - Tests in src/editor/text/__tests__/
# - Extend PropertyValidator.ts

# Run tests continuously
npm run test -- --watch src/editor/text

# When done, create PR to develop
```

**Definition of Done:**
- [ ] All typography validators in PropertyValidator
- [ ] Text transform function (uppercase, title, sentence)
- [ ] Auto-fit calculates fontSize
- [ ] Font availability hook queries Google Fonts
- [ ] 35+ tests passing
- [ ] TypeScript build clean

---

### Branch 2: SVG Effects Engine

```bash
git checkout feature/svg-effects-engine

cat .claude/tasks/svg-effects-engine.md

# Key files to create:
# - src/editor/effects/EffectsManager.ts
# - src/editor/effects/builders/*.ts (shadow, neon, glitch, etc.)
# - src/editor/effects/presets.ts
# - Tests in src/editor/effects/__tests__/

npm run test -- --watch src/editor/effects
```

**Definition of Done:**
- [ ] EffectsManager caches filters by hash
- [ ] All 9 effect builders implemented
- [ ] Stroke utilities (hollow, outline)
- [ ] Background/highlight auto-sizing
- [ ] Presets apply property bundles
- [ ] 40+ tests passing
- [ ] TypeScript build clean

---

### Branch 3: Position & Transform Controls

```bash
git checkout feature/position-transform-controls

cat .claude/tasks/position-transform-controls.md

# Key files to create:
# - src/editor/transforms/operations.ts
# - src/editor/transforms/bbox.ts
# - src/editor/transforms/aspectRatio.ts
# - src/editor/transforms/multiSelect.ts
# - Tests in src/editor/transforms/__tests__/

npm run test -- --watch src/editor/transforms
```

**Definition of Done:**
- [ ] Z-order operations implemented
- [ ] Alignment to page works
- [ ] Distribution evenly spaces slots
- [ ] Union bbox for multi-select
- [ ] Aspect ratio lock
- [ ] 25+ tests passing
- [ ] TypeScript build clean

---

### Branch 4: Effects UI Panels (Wave 2)

⚠️ **Wait for Wave 1 branches to merge first!**

```bash
git checkout feature/effects-ui-panels

cat .claude/tasks/effects-ui-panels.md

# Key files to create:
# - src/components/typography/TypographyToolbar.tsx
# - src/components/effects/EffectsPanel.tsx
# - src/components/position/PositionPanel.tsx
# - src/editor/commands/CommandMerger.ts
# - Tests in src/components/**/__tests__/

npm run test -- --watch src/components
```

**Definition of Done:**
- [ ] Typography Toolbar with all controls
- [ ] Effects Panel (preset grid + toggle list)
- [ ] Position Panel (numeric inputs + buttons)
- [ ] Mixed-state UI for multi-select
- [ ] Command merging reduces history noise
- [ ] 30+ tests passing
- [ ] TypeScript build clean

---

## 🧪 Testing Strategy

### Per-Branch Testing

**During Development:**
```bash
# Run tests for current branch
npm run test -- --watch src/editor/[module]

# Check coverage
npm run test -- --coverage src/editor/[module]
```

**Before PR:**
```bash
# Run all tests
npm run test

# Build to verify TypeScript
npm run build

# Expected: 0 errors, all tests passing
```

### Integration Testing (After All Branches Merged)

```bash
# Enable all feature flags
# In .env:
VITE_TEXT_EFFECTS=true
VITE_ADVANCED_TYPOGRAPHY=true

# Start dev server
npm run dev

# Manual test checklist:
# ✅ Font picker loads fonts
# ✅ Text transforms apply correctly
# ✅ Effects presets work
# ✅ Position controls update frames
# ✅ Multi-select shows "Mixed"
# ✅ Undo/redo works smoothly
```

---

## 📊 Progress Tracking

### Daily Standup

```bash
# Check status of all branches
git checkout feature/text-typography-system && git log --oneline -3
git checkout feature/svg-effects-engine && git log --oneline -3
git checkout feature/position-transform-controls && git log --oneline -3
git checkout feature/effects-ui-panels && git log --oneline -3

# Or use helper script
npm run refactor:status
```

### When a Branch is Done

1. **Run full test suite:**
   ```bash
   npm run test
   npm run build
   ```

2. **Create PR to `develop`:**
   - Title: `[Fonts] Implement [Module Name]`
   - Include:
     - Test coverage screenshot
     - Link to task file
     - Demo GIF (if UI)
     - Breaking changes (if any)

3. **Merge Order (Respect Dependencies):**
   - ✅ First: typography, effects, position (Wave 1)
   - ✅ Last: UI panels (Wave 2 - needs Wave 1)

---

## 🔍 Common Issues & Solutions

### Issue: TypeScript Error in PropertyValidator

**Symptom:** `Property 'fontWeight' does not exist on type 'Slot'`

**Solution:**
1. Check `src/schema/types.ts` has the property defined
2. Restart TypeScript server in your editor
3. Run `npx tsc --noEmit` to verify

---

### Issue: Tests Fail with "Cannot find module"

**Symptom:** `Cannot find module './textTransforms'`

**Solution:**
1. Ensure file exists at correct path
2. Check import path is relative (starts with `./` or `../`)
3. Verify no circular dependencies

---

### Issue: SVG Filters Not Rendering

**Symptom:** Effects don't appear on canvas

**Solution:**
1. Check `EffectsManager.mountDefs()` is called
2. Verify filter ID matches `filter="url(#...)"` attribute
3. Inspect SVG DOM - `<defs>` should contain filter nodes

---

### Issue: Multi-Select "Mixed" Not Showing

**Symptom:** Shows value instead of "Mixed" when values differ

**Solution:**
1. Check `getMixedState()` is called correctly
2. Verify multi-select array has >1 slot
3. Ensure UI component handles 'Mixed' string value

---

## 🎯 Definition of Done (Full System)

### Before Merging to Main

- [ ] All 4 branches merged to `develop`
- [ ] All 130+ tests passing
- [ ] TypeScript build clean (`npm run build`)
- [ ] Manual testing complete:
  - [ ] Typography controls work
  - [ ] Effects apply correctly
  - [ ] Position controls update frames
  - [ ] Multi-select works
  - [ ] Undo/redo smooth
  - [ ] No V1 canvas regressions
- [ ] Feature flags default to `false`
- [ ] Documentation updated

---

## 📞 Quick Reference

### Task Files

| Branch | Task File | Module |
|--------|-----------|--------|
| `feature/text-typography-system` | `.claude/tasks/text-typography-system.md` | Typography |
| `feature/svg-effects-engine` | `.claude/tasks/svg-effects-engine.md` | Effects |
| `feature/position-transform-controls` | `.claude/tasks/position-transform-controls.md` | Transforms |
| `feature/effects-ui-panels` | `.claude/tasks/effects-ui-panels.md` | UI |

### File Boundaries

Check `.claude/boundaries.json` for allowed files per branch.

**Example:**
- `feature/text-typography-system` → Can only modify `src/editor/text/**`, `src/utils/fontLoader.ts`, etc.
- `feature/svg-effects-engine` → Can only modify `src/editor/effects/**`

This prevents merge conflicts!

---

## 🚀 Launch Checklist (When All Done)

### Integration Branch

```bash
# Create integration branch
git checkout -b integration/fonts-effects develop

# Merge all in order (Wave 1 first)
git merge feature/text-typography-system --no-ff
git merge feature/svg-effects-engine --no-ff
git merge feature/position-transform-controls --no-ff
git merge feature/effects-ui-panels --no-ff

# Enable feature flags
# In .env:
VITE_TEXT_EFFECTS=true
VITE_ADVANCED_TYPOGRAPHY=true

# Run tests
npm run test

# Build
npm run build

# Manual testing
npm run dev
```

### Full Test Suite

- [ ] Typography:
  - [ ] Font picker loads families
  - [ ] Font weight selector works
  - [ ] Text transforms apply (uppercase, title, sentence)
  - [ ] Auto-fit scales text to box
  - [ ] Letter spacing adjusts
  - [ ] Line height adjusts

- [ ] Effects:
  - [ ] Shadow renders
  - [ ] Neon glow works
  - [ ] Glitch effect animates
  - [ ] Hollow text (stroke only)
  - [ ] Outline (stroke + fill)
  - [ ] Background/highlight auto-sizes

- [ ] Position:
  - [ ] Bring to front/back
  - [ ] Align left/center/right
  - [ ] Distribute horizontal/vertical
  - [ ] Numeric inputs update frames
  - [ ] Aspect ratio lock

- [ ] Multi-Select:
  - [ ] Shows "Mixed" for different values
  - [ ] Edit applies to all selected
  - [ ] Union bbox transforms

- [ ] V1 Canvas:
  - [ ] Still works with flags OFF
  - [ ] No regressions

### If All Tests Pass

```bash
# Merge integration → develop
git checkout develop
git merge integration/fonts-effects --no-ff

# Merge develop → main
git checkout main
git merge develop --no-ff -m "Merge: Font & Text Effects System"

# Push to remote
git push origin main
git push origin develop
```

---

## 💡 Tips & Best Practices

### For Parallel Development

1. **Sync with `develop` daily:**
   ```bash
   git checkout feature/your-branch
   git fetch origin
   git rebase origin/develop
   ```

2. **Don't cross boundaries:**
   - Each branch has strict file access (see `.claude/boundaries.json`)
   - If you need to modify a file outside your boundary, coordinate with other devs

3. **Write tests first:**
   - TDD helps catch bugs early
   - Tests serve as spec documentation

4. **Keep PRs small:**
   - Easier to review
   - Faster to merge
   - Less likely to conflict

### For Code Quality

1. **Follow existing patterns:**
   - Look at V2 canvas modules as examples
   - Match naming conventions
   - Use TypeScript strict mode

2. **Performance matters:**
   - Cache expensive calculations
   - Debounce/throttle event handlers
   - Avoid layout thrashing

3. **Accessibility:**
   - Keyboard navigation
   - ARIA labels
   - Color contrast

---

## 📚 Related Documentation

- **V2 Canvas Refactor**: See `TESTING_GUIDE.md` for parallel development lessons
- **Parallel Claude Setup**: See `PARALLEL_CLAUDE_SETUP.md` for multi-instance workflow
- **Canvas Architecture**: See `docs/CANVAS_ARCHITECTURE.md` for integration points

---

**You're all set! Start with Wave 1 branches and work in parallel. Good luck!** 🚀
