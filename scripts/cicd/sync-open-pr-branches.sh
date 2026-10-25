#!/usr/bin/env bash
# Refresh same-repository PR heads after a validated base branch advances.
# This is intentionally API-only: it neither checks out nor executes PR code.
set -euo pipefail

: "${GH_TOKEN:?GitHub token required}"
: "${GH_REPO:?GitHub repository required}"
: "${BASE_BRANCH:?Base branch required}"

[[ "$BASE_BRANCH" == develop || "$BASE_BRANCH" == main ]] || {
  echo 'Only protected develop or main branches may be synchronized.' >&2
  exit 1
}

pulls=$(gh api "repos/$GH_REPO/pulls?state=open&base=$BASE_BRANCH&per_page=100")
failures=0
updated=0

while IFS=$'\t' read -r number head_ref head_sha; do
  [[ -n "$number" ]] || continue
  # The release PR head is develop. It is synchronized through the checked
  # chore/sync-main-* PR, never by mutating a protected branch directly.
  if [[ "$head_ref" == develop ]]; then
    echo "PR #$number is the release PR; preserving protected develop history."
    continue
  fi

  if gh api --method PUT "repos/$GH_REPO/pulls/$number/update-branch" \
    -f expected_head_sha="$head_sha" >/dev/null; then
    echo "Requested base update for PR #$number."
    updated=$((updated + 1))
  else
    echo "Could not update PR #$number; resolve its conflict or permissions before merge." >&2
    failures=$((failures + 1))
  fi
done < <(
  jq -r --arg repo "$GH_REPO" '
    .[]
    | select(.draft | not)
    | select(.head.repo.full_name == $repo)
    | [.number, .head.ref, .head.sha] | @tsv
  ' <<<"$pulls"
)

echo "Requested updates for $updated open PR(s) targeting $BASE_BRANCH."
(( failures == 0 ))
