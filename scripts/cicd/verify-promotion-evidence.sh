#!/usr/bin/env bash
# Release-PR fast path: reuse the exact successful develop-push qualification.
set -euo pipefail

: "${GH_TOKEN:?GitHub token required}"
: "${GH_REPO:?GitHub repository required}"
: "${HEAD_SHA:?Release candidate SHA required}"
: "${BASE_SHA:?Release base SHA required}"

[[ "${HEAD_BRANCH:-}" == develop ]] || { echo 'Release PR head must be develop.' >&2; exit 1; }
[[ "${HEAD_REPOSITORY:-}" == "$GH_REPO" ]] || { echo 'Release PR must originate from this repository.' >&2; exit 1; }
[[ "$HEAD_SHA" =~ ^[a-f0-9]{40}$ && "$BASE_SHA" =~ ^[a-f0-9]{40}$ ]]
test "$(git rev-parse HEAD)" = "$HEAD_SHA"
git merge-base --is-ancestor "$BASE_SHA" "$HEAD_SHA" || {
  echo 'Develop is not based on the reviewed main revision.' >&2
  exit 1
}

current_develop=$(gh api "repos/$GH_REPO/git/ref/heads/develop" --jq .object.sha)
[[ "$current_develop" == "$HEAD_SHA" ]] || {
  echo 'Release PR is not the current develop head.' >&2
  exit 1
}

runs=$(gh api "repos/$GH_REPO/actions/workflows/continuous-integration.yml/runs?branch=develop&event=push&status=success&per_page=100")
run_id=$(jq -r --arg sha "$HEAD_SHA" --arg repo "$GH_REPO" '
  [.workflow_runs[]
   | select(.head_sha == $sha)
   | select(.event == "push" and .head_branch == "develop")
   | select(.status == "completed" and .conclusion == "success")
   | select(.path == ".github/workflows/continuous-integration.yml")
   | select(.head_repository.full_name == $repo)]
  | first | .id // empty
' <<<"$runs")
[[ "$run_id" =~ ^[0-9]+$ ]] || {
  echo 'No successful develop-push qualification exists for this exact SHA.' >&2
  exit 1
}

artifacts=$(gh api "repos/$GH_REPO/actions/runs/$run_id/artifacts?per_page=100")
artifact_count=$(jq --arg name "production-images-$HEAD_SHA" '
  [.artifacts[] | select(.name == $name and .expired == false)] | length
' <<<"$artifacts")
[[ "$artifact_count" == 1 ]] || {
  echo 'The exact develop qualification must contain one unexpired production image bundle.' >&2
  exit 1
}
artifact_digest=$(jq -r --arg name "production-images-$HEAD_SHA" '
  .artifacts[] | select(.name == $name and .expired == false) | .digest
' <<<"$artifacts")
[[ "$artifact_digest" =~ ^sha256:[a-f0-9]{64}$ ]] || {
  echo 'The develop image bundle has no verifiable artifact digest.' >&2
  exit 1
}

echo "Promotion evidence verified for develop candidate $HEAD_SHA (run $run_id)."
