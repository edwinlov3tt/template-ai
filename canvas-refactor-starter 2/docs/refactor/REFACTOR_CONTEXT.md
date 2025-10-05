# Refactor Context / Playbook

Ship in parallel with feature flags and multiple branches.

- Branching models: **Gitflow** (https://www.atlassian.com/git/tutorials/comparing-workflows/gitflow-workflow) vs **Feature Branch** (https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow) vs **Trunk-Based** (https://trunkbaseddevelopment.com/)
- Use **Feature Toggles** (https://martinfowler.com/articles/feature-toggles.html) for safe rollout / instant rollback.

## Flags
- `VITE_USE_V2_CANVAS` — mount new stage
- `VITE_STATE_MACHINE` — enable interaction SM
- `VITE_NEW_PROPERTIES` — new property panel

## Non-negotiables
- Never remove `viewBox` in SVGO
- Pointer Events + capture for all interactions
- Workerize the importer
