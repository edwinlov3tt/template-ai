#!/usr/bin/env bash
echo '=== Refactor Progress ==='
for b in refactor/coordinate-system refactor/interaction-sm refactor/property-system refactor/layout-constraints infra/workerized-importer feature/v2-canvas-parallel
do
  if git show-ref --verify --quiet refs/heads/$b; then
    echo "\n[$b]"
    git log $b -1 --oneline
    echo "Files changed since develop:"
    git diff --stat develop..$b | tail -1
  fi
done
