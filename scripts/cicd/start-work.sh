#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
branch=${1:?Usage: start-work.sh feat/short-description [worktree-path]}
[[ "$branch" =~ ^(feat|fix|chore|ci)/[a-z0-9][a-z0-9._/-]*$ ]] || { echo 'Use feat/, fix/, chore/, or ci/ and a short lowercase name.' >&2; exit 1; }
git check-ref-format --branch "$branch" >/dev/null
git fetch origin develop
if [[ -n "${2:-}" ]]; then
  git worktree add -b "$branch" "$2" origin/develop
else
  [[ -z "$(git status --porcelain)" ]] || { echo 'Commit your work or pass a separate worktree path; existing edits are preserved.' >&2; exit 1; }
  git switch -c "$branch" origin/develop
fi
