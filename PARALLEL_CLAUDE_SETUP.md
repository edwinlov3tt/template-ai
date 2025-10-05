# Parallel Claude Code Setup - Canvas Refactor

## ✅ Setup Complete!

All infrastructure is now in place to run 6 parallel Claude Code instances working on different parts of the canvas refactor.

---

## 📋 What Was Configured

### Files Added
- `.claude/tasks/` - 6 task files (one per workstream)
- `.claude/boundaries.json` - File access restrictions per branch
- `docs/refactor/` - 6 spec documents with acceptance criteria
- `vite-env.d.ts` - Comlink type definitions
- `vitest.config.ts` - Test runner configuration
- `refactor-status.sh` - Script to check progress across branches

### Dependencies Installed
- `vite-plugin-comlink@^5.3.0` - Worker plugin for Vite
- `comlink@^4.4.2` - RPC for Web Workers
- `vitest@latest` - Unit testing framework
- `@vitest/ui@latest` - Test UI
- `@types/node` - Node.js types

### Configuration Updated
- `vite.config.ts` - Added comlink plugin
- `.env` - Added 3 feature flags (all default false)
- `package.json` - Added test/e2e/refactor scripts

### Git Branches Created
- `develop` (integration branch)
- `refactor/coordinate-system`
- `refactor/interaction-sm`
- `refactor/property-system`
- `refactor/layout-constraints`
- `infra/workerized-importer`
- `feature/v2-canvas-parallel`

---

## 🚀 How to Start Parallel Claude Instances

### Option 1: Run 6 Separate Terminals (Recommended)

Open 6 terminal windows and run one command per terminal:

```bash
# Terminal 1 - Coordinate System
cd /Users/edwinlovettiii/Downloads/template-ai
git checkout refactor/coordinate-system
# Then run Claude Code on this branch
```

```bash
# Terminal 2 - Interaction State Machine
cd /Users/edwinlovettiii/Downloads/template-ai
git checkout refactor/interaction-sm
# Then run Claude Code on this branch
```

```bash
# Terminal 3 - Property System
cd /Users/edwinlovettiii/Downloads/template-ai
git checkout refactor/property-system
# Then run Claude Code on this branch
```

```bash
# Terminal 4 - Layout Constraints
cd /Users/edwinlovettiii/Downloads/template-ai
git checkout refactor/layout-constraints
# Then run Claude Code on this branch
```

```bash
# Terminal 5 - Workerized Importer
cd /Users/edwinlovettiii/Downloads/template-ai
git checkout infra/workerized-importer
# Then run Claude Code on this branch
```

```bash
# Terminal 6 - V2 Canvas Parallel
cd /Users/edwinlovettiii/Downloads/template-ai
git checkout feature/v2-canvas-parallel
# Then run Claude Code on this branch
```

### Option 2: Use Claude Code with Task Files

If you're using the Claude Code CLI, you can pass task files directly:

```bash
# Start each instance with its task file
claude-code --task-file ./.claude/tasks/coordinate-system.md
claude-code --task-file ./.claude/tasks/interaction-sm.md
claude-code --task-file ./.claude/tasks/property-system.md
claude-code --task-file ./.claude/tasks/layout-constraints.md
claude-code --task-file ./.claude/tasks/workerized-importer.md
claude-code --task-file ./.claude/tasks/v2-canvas-parallel.md
```

---

## 📂 Branch to File Mapping

Each branch can only modify specific files (enforced by `.claude-boundaries.json`):

| Branch | Files It Can Modify |
|--------|---------------------|
| `refactor/coordinate-system` | `src/editor/core/CoordinateSystem.ts`, tests |
| `refactor/interaction-sm` | `src/editor/core/InteractionStateMachine.ts`, tests |
| `refactor/property-system` | `src/editor/core/PropertyValidator.ts`, tests |
| `refactor/layout-constraints` | `src/editor/core/LayoutSolver.ts`, tests |
| `infra/workerized-importer` | `src/workers/**`, `config/svgo.config.js` |
| `feature/v2-canvas-parallel` | `src/editor/svg-v2/**`, `config/features.ts` |

---

## 🔍 Task File Contents

Each `.claude/tasks/*.md` file contains:
- **Context** - What this module does
- **Requirements** - API to implement
- **Guardrails** - What to avoid (global listeners, React imports in core, etc.)
- **Tests** - What to test
- **References** - MDN docs, SVGO docs, etc.

---

## 📖 Reference Documentation

Each workstream has a spec in `docs/refactor/`:

- `COORDINATE_SYSTEM_SPEC.md` - CTM caching, coordinate conversions
- `INTERACTION_SM_SPEC.md` - Pointer Events, state machine
- `PROPERTY_SYSTEM_SPEC.md` - Property registry, validation
- `LAYOUT_CONSTRAINTS_SPEC.md` - Kiwi wrapper for constraints
- `IMPORT_PIPELINE_SPEC.md` - Worker-based SVG import
- `REFACTOR_CONTEXT.md` - Overall architecture context

---

## 🧪 Testing Commands

```bash
# Run all tests
npm run test

# Run tests with UI
npm run test:ui

# Check refactor status across all branches
npm run refactor:status

# Run E2E tests (when implemented)
npm run e2e
```

---

## 🎯 Feature Flags

Toggle V2 canvas features in `.env`:

```bash
VITE_USE_V2_CANVAS=false       # Enable V2 canvas (default: false)
VITE_STATE_MACHINE=false       # Enable interaction SM (default: false)
VITE_NEW_PROPERTIES=false      # Enable property system (default: false)
```

---

## 🔄 Daily Integration Workflow

### Sync All Branches
```bash
# Update develop
git checkout develop && git pull

# Rebase all feature branches (run daily)
for branch in refactor/coordinate-system refactor/interaction-sm refactor/property-system refactor/layout-constraints infra/workerized-importer feature/v2-canvas-parallel
do
  git checkout $branch
  git rebase develop
  git push --force-with-lease
done
```

### Test Integration
```bash
# Create test integration branch
git checkout -b integration/v2-test develop

# Merge all feature branches
git merge refactor/coordinate-system --no-ff
git merge refactor/interaction-sm --no-ff
git merge refactor/property-system --no-ff
git merge refactor/layout-constraints --no-ff
git merge infra/workerized-importer --no-ff
git merge feature/v2-canvas-parallel --no-ff

# Test the integration
npm run test
npm run dev  # With VITE_USE_V2_CANVAS=true
```

---

## ⚠️ Key Guardrails (from CANVAS_IMPROVEMENT_CAVETS.md)

### ✅ Pointer Events
- Use `setPointerCapture(pointerId)` on **element that received pointerdown**
- Cleanup auto-releases on `pointerup`
- Reference: https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events

### ✅ Passive Listeners
- Mark wheel/touch **passive** only where you won't call `preventDefault()`
- For zoom: **non-passive**
- Reference: https://developer.chrome.com/docs/lighthouse/best-practices/uses-passive-event-listeners

### ✅ CTM Caching
- Cache inverse CTM once per interaction
- Invalidate on: zoom/pan/resize/DPR changes/layout shifts
- Reference: https://developer.mozilla.org/en-US/docs/Web/API/SVGGraphicsElement/getScreenCTM

### ✅ SVGO Rules
- **NEVER** enable `removeViewBox` (breaks scaling)
- Use `removeDimensions: true` instead
- Normalize `xlink:href` → `href`
- Reference: https://svgo.dev/docs/plugins/removeViewBox/

---

## 📊 PR Strategy

### Merge Order (Dependency-Aware)

1. **First wave** (independent, can merge in parallel):
   - `refactor/coordinate-system` → `develop`
   - `refactor/property-system` → `develop`
   - `infra/workerized-importer` → `develop`

2. **Second wave** (depends on first):
   - `refactor/interaction-sm` → `develop` (uses CoordinateSystem)
   - `refactor/layout-constraints` → `develop` (uses PropertyValidator)

3. **Final wave**:
   - `feature/v2-canvas-parallel` → `develop` (uses all above)

---

## ✅ Success Criteria

### Per-Branch Checklist
- [ ] Test coverage > 90%
- [ ] All TypeScript errors resolved
- [ ] Task file requirements met
- [ ] References to official docs in PR
- [ ] No breaking changes to V1

### Integration Checklist
- [ ] All branches merge cleanly into `develop`
- [ ] Integration tests pass
- [ ] V1 canvas still works (default)
- [ ] V2 canvas works behind flag

---

## 🆘 Troubleshooting

### "Module not found: vite-plugin-comlink"
```bash
npm install
```

### "Cannot find module 'vitest'"
```bash
npm install -D vitest @vitest/ui
```

### "Type error: Cannot find module '@types/node'"
```bash
npm install -D @types/node
```

### Check refactor status
```bash
npm run refactor:status
```

---

## 🎉 Next Steps

1. **Push develop branch to remote**:
   ```bash
   git push -u origin develop
   ```

2. **Start your first Claude instance** (recommended order):
   ```bash
   git checkout refactor/coordinate-system
   # Run Claude Code on this branch
   ```

3. **Monitor progress**:
   ```bash
   npm run refactor:status
   ```

4. **Create PRs** as each workstream completes

---

**All set! Ready to refactor the canvas architecture with parallel Claude instances.**
