
# Template AI

An intelligent template builder that imports SVG designs, maps them to smart Template JSON with constraints, validates with Ajv, and previews on a Fabric.js canvas with responsive ratio support.

## Quick Start
1. **Install** (pnpm recommended)
   ```bash
   pnpm install
   # or: npm install / yarn
   ```

2. **Run Dev**
   ```bash
   pnpm dev
   ```
   Open http://localhost:5173

3. **Try an Import**
   - In the app, upload `samples/simple-template.svg`
   - Toggle ratios on the left to see layout adapt

4. **Validate a Template JSON**
   ```bash
   pnpm run validate:templates
   ```

## Authoring Conventions
- In your SVG, tag elements you want mapped as slots with `data-slot="headline"`, `data-slot="subhead"`, `data-slot="cta"`, `data-slot="logo"`, `data-slot="bg"`, `data-slot="subject"`.
- The importer reads the SVG `viewBox` as the base coordinate system.

## Notes
- The included layout engine is a tiny placeholder. Swap it with a constraint solver (kiwi.js) to honor full template constraints.
- Contrast checks, auto-fixes, and full slot editing UI are intentionally minimal to keep this focused.

## Tech
- Vite + React
- Fabric.js for canvas authoring
- SVGO + svgson for SVG import
- Ajv for JSON Schema validation# template-ai
