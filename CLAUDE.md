# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ad template builder starter application that imports SVG files with tagged slots, generates template JSON with layout constraints, validates against a schema, and previews on a Fabric.js canvas with responsive ratio support. Designed as a foundation for building a Templated.io-style ad builder.

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Canvas**: Fabric.js v6 (beta) for visual editing
- **SVG Processing**: SVGO + svgson for parsing and optimization
- **Validation**: Ajv for JSON Schema validation
- **Layout Engine**: Placeholder (minimal rules-based, should be replaced with kiwi.js constraint solver)

## Commands

**Development**
```bash
pnpm dev              # Start dev server on http://localhost:5173
pnpm build            # TypeScript compile + production build
pnpm preview          # Preview production build
```

**Validation**
```bash
pnpm run validate:templates samples/template.json  # Validate template JSON against schema
```

## Architecture

**Entry Point**: `src/main.tsx` → `src/App.tsx`

**Core Modules**:
- `src/importer/importSvg.ts` - Converts SVG to template JSON
  - Uses SVGO to optimize SVG
  - Parses with svgson to extract `data-slot` attributes (headline, subhead, cta, logo, bg, subject)
  - Reads SVG `viewBox` as base coordinate system
  - Generates template JSON with slots, constraints, tokens, accessibility rules

- `src/schema/templateSchema.ts` - JSON Schema for template validation
  - Defines required template structure: id, version, canvas, slots, constraints, tokens, accessibility
  - Validates slot types (image, text, button, shape) and required properties

- `src/layout/layoutEngine.ts` - Minimal layout positioning logic
  - **Current**: Simple rule-based positioning for different aspect ratios
  - **Future**: Replace with kiwi.js constraint solver to honor template.constraints

- `src/editor/FabricCanvas.tsx` - Fabric.js canvas component
  - Renders template slots (bg, headline, subhead, logo, cta) on canvas
  - Applies layout from layoutEngine for current ratio
  - Updates on template or ratio changes

**Supported Ratios**: 1:1, 4:5, 9:16, 16:9, 300x250, 728x90

## SVG Authoring

Tag elements with `data-slot` attribute to map to template slots:
- `data-slot="headline"` - Main text
- `data-slot="subhead"` - Supporting text
- `data-slot="cta"` - Call-to-action button
- `data-slot="logo"` - Brand logo
- `data-slot="bg"` - Background image
- `data-slot="subject"` - Foreground subject image

SVG `viewBox` defines base coordinate system for all ratios.

## Template JSON Structure

Generated templates include:
- **canvas**: baseViewBox and supported ratios
- **slots**: Array of slot definitions (name, type, z-index, styling)
- **tokens**: Design tokens (palette colors, typography rules)
- **constraints**: Layout constraints (global + ratio-specific)
  - Currently expressed as equations/inequalities
  - Intended for constraint solver (not yet implemented)
- **accessibility**: Contrast policies and fallback strategies
- **sample**: Example content for preview

## Key Limitations

- Layout engine uses placeholder logic instead of constraint solver
- No actual constraint solving with kiwi.js (TODO)
- Minimal slot editing UI (intentional for starter)
- No contrast checking implementation (structure only)
- Auto-fixes for accessibility not implemented

## Canvas Architecture
- Before any changes to the canvas architecture, refer to @docs/CANVAS_ARCHITECTURE.md and @slot-interaction-guide.md to ensure no changes will break existing functionality, only improve upon them.