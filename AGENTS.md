# Repository Guidelines

## Project Structure & Module Organization
- `src/main.tsx` bootstraps the Vite + React client; `src/App.tsx` wires the editor shell.
- Shared UI lives in `src/components`, canvas logic in `src/editor`/`src/layout`, and state stores (Zustand) under `src/state`.
- Importers and external integrations reside in `src/importer`, `src/services`, and history helpers in `src/history`.
- Place shared helpers in `src/utils`, schema artefacts in `src/schema`, and accessibility helpers under `src/accessibility`.
- Reference assets ship in `samples/`, `screenshots/`, and `Main File/`; automation scripts live in `scripts/`. Do not edit `dist/`—it is build output.

## Build, Test, and Development Commands
- `pnpm install` (or `npm install`) installs dependencies.
- `npm dev` launches the Vite dev server at `http://localhost:5173` with hot reload.
- `npm build` runs `tsc -b` for strict type checks, then `vite build` for production bundles.
- `npm preview` serves the latest production build locally.
- `npm run validate:templates [path]` validates template JSON via `scripts/validate-template.mjs`; defaults to `samples/template.json`.

## Coding Style & Naming Conventions
- TypeScript operates in `strict` mode—type exported APIs explicitly and surface-widening casts.
- React components are function-based, named in PascalCase, and grouped with related styles/assets.
- Match the existing 2-space indentation, single quotes, and no trailing semicolons.
- Name Zustand stores `use<Feature>Store` and colocate derived selectors with the store file.
- Centralize shared constants in feature folders or `src/utils` instead of duplicating literal values.

## Testing Guidelines
- There is no bundled test runner; rely on `npm build` for type safety and `npm run validate:templates` for schema checks.
- For new logic, add focused Vitest suites (mirroring `tsconfig.json`) or document manual verification steps in the PR.
- Manually verify editor flows: import SVGs from `samples/`, toggle responsive ratios, and confirm undo/redo behaviour from `src/history`.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (`feat:`, `fix:`, `chore:`, etc.) with concise, imperative summaries.
- Keep commits atomic and mention impacted modules or packages in the body when relevant.
- Pull requests must include a problem statement, bullet summary, validation evidence (commands + outcomes), and UI captures for visible changes.
- Link issues or tasks and flag follow-up work or known limitations explicitly.
