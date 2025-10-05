# Canvas Refactor Starter Kit

This zip contains **starter specs**, **task files for Claude Code**, and **sane defaults** (SVGO, feature flags, workers)
to run a **multi-branch refactor** safely with feature flags.

## What’s inside

- `docs/refactor/*.md` — acceptance criteria & links for each module
- `.claude-tasks/*.md` — one task file per Claude Code instance
- `config/features.ts` — feature flags (env-driven)
- `config/svgo.config.js` — SVGO config that **keeps `viewBox`** and IDs where needed
- `src/workers/svgImport.worker.ts` — worker entry (skeleton) for import pipeline
- `src/editor/core/*` — stubs for core modules (CoordinateSystem, InteractionStateMachine, etc.)
- `src/editor/svg-v2/*` — parallel V2 canvas stubs (behind `VITE_USE_V2_CANVAS`)

## Quick start

1. Unzip into the root of your repo (or another directory and copy the files you want).
2. Add to `package.json`:
   ```json
   {
     "devDependencies": {
       "vite-plugin-comlink": "^5.3.0",
       "comlink": "^4.4.2"
     }
   }
   ```
3. In `vite-env.d.ts` add:
   ```ts
   /// <reference types="vite-plugin-comlink/client" />
   ```
4. Wire the **feature flags** in your app and mount `SvgStageV2` when `VITE_USE_V2_CANVAS=true`.
5. Run your Claude Code instances with the task files under `.claude-tasks/`.

See each spec in `docs/refactor/` for acceptance criteria and links to the official docs.
