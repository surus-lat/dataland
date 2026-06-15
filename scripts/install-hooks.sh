#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
cd "$REPO_ROOT"

git config core.hooksPath hooks
chmod +x hooks/pre-commit

echo "Git hooks now point at $(git config core.hooksPath)"
