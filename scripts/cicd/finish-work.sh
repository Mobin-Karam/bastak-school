#!/usr/bin/env bash
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
branch=$(git branch --show-current)
[[ "$branch" =~ ^(feat|fix|chore|ci)/ ]] || { echo 'Finish work from a feature/fix branch.' >&2; exit 1; }
[[ -z "$(git status --porcelain)" ]] || { echo 'Review and commit your intended changes first.' >&2; exit 1; }
command -v gh >/dev/null
git push -u origin "$branch"
pr=$(gh pr list --base develop --head "$branch" --state open --json number --jq '.[0].number // empty')
if [[ -z "$pr" ]]; then
  gh pr create --base develop --head "$branch" --fill
  pr=$(gh pr list --base develop --head "$branch" --state open --json number --jq '.[0].number')
fi
# Do not merge before the required check exists or before a new push is tested.
for attempt in {1..60}; do
  checks=$(gh pr checks "$pr" --json name --jq '.[].name' || true)
  if grep -qx 'CI Gate' <<< "$checks"; then break; fi
  sleep 5
done
grep -qx 'CI Gate' <<< "$checks" || { echo 'CI Gate did not start. Check Actions permissions.' >&2; exit 1; }
gh pr checks "$pr" --watch --fail-fast
# GitHub enforces branch protection, reviews, and mergeability.
gh pr merge "$pr" --squash --match-head-commit "$(git rev-parse HEAD)"
echo 'Merged to develop. Develop CI will create/update the release PR to main.'
