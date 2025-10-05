# LayoutSolver (Kiwi.js) — Spec

**Goal:** Wrapper around Kiwi/Cassowary that is safe & predictable.

## Requirements
- Parse our mini-DSL to a structured form; **validate before solving**.
- Use a maintained Kiwi build: https://github.com/IjzerenHein/kiwi.js/ (alt: https://www.npmjs.com/package/%40lume/kiwi).
- On parse/solve error: fallback to original geometry (no crash).

## References
- Cassowary paper: https://constraints.cs.washington.edu/solvers/cassowary-tochi.pdf
