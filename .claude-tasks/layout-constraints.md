# Task: LayoutSolver (Kiwi/Cassowary wrapper)

## Context
- Safe constraint solving + graceful fallback on parse/solve errors.

## Requirements
- Create: `src/editor/core/LayoutSolver.ts`
- Create tests: `src/editor/core/__tests__/LayoutSolver.test.ts`
- Accept a pre-validated constraint set (from a mini-DSL parse step).
- Solve frames in viewBox units and return updated frames.
- On error: return original frames and an error object; never throw.

## Implementation Notes
- Use maintained Kiwi JS build (prefer `@lume/kiwi`).
- Preserve tuple ordering correctness (regression test for coef/variable order).

## Tests
- Equalities, inequalities with strengths, conflicting constraints behavior.
- Regression for tuple order bug.

## References
- kiwi.js (maintained): https://www.npmjs.com/package/%40lume/kiwi
- Cassowary paper (TOCHI): https://constraints.cs.washington.edu/solvers/cassowary-tochi.pdf
