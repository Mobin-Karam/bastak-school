#!/usr/bin/env bash
# Create or resume the protected PR that restores main ancestry to develop.
set -euo pipefail

: "${GH_TOKEN:?GitHub token required}"
: "${GH_REPO:?GitHub repository required}"
: "${RELEASE_SHA:?Released main SHA required}"

git fetch origin main develop
git merge-base --is-ancestor "$RELEASE_SHA" origin/develop && exit 0

branch="chore/sync-main-$RELEASE_SHA"
existing=$(gh pr list --repo "$GH_REPO" --base develop --head "$branch" --state open --json number --jq '.[0].number // empty')
if [[ -n "$existing" ]]; then
  gh pr merge "$existing" --repo "$GH_REPO" --auto --merge
  exit 0
fi

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'
if git ls-remote --exit-code --heads origin "$branch" >/dev/null; then
  git fetch origin "$branch"
  git switch -c "$branch" "origin/$branch"
  git merge --no-ff --no-edit origin/develop
else
  git switch -c "$branch" origin/develop
fi
git merge --no-ff --no-edit "$RELEASE_SHA"
git push origin "$branch"
gh pr create --repo "$GH_REPO" --base develop --head "$branch" \
  --title 'chore: synchronize released main into develop' \
  --body "Preserve release ancestry after main CI passed for $RELEASE_SHA. Merge with a merge commit after CI; do not squash this synchronization."
pr=$(gh pr list --repo "$GH_REPO" --base develop --head "$branch" --state open --json number --jq '.[0].number')
gh pr merge "$pr" --repo "$GH_REPO" --auto --merge
