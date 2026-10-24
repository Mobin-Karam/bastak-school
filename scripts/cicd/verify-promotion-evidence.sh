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

attempts=${PROMOTION_EVIDENCE_ATTEMPTS:-180}
interval=${PROMOTION_EVIDENCE_INTERVAL_SECONDS:-10}
[[ "$attempts" =~ ^[1-9][0-9]*$ && "$interval" =~ ^[0-9]+$ ]]

run_id=''
for ((attempt = 1; attempt <= attempts; attempt++)); do
  runs=$(gh api "repos/$GH_REPO/actions/workflows/continuous-integration.yml/runs?branch=develop&event=push&per_page=100")
  read -r run_id run_status run_conclusion < <(jq -r --arg sha "$HEAD_SHA" --arg repo "$GH_REPO" '
    [.workflow_runs[]
     | select(.head_sha == $sha)
     | select(.event == "push" and .head_branch == "develop")
     | select(.path == ".github/workflows/continuous-integration.yml")
     | select(.head_repository.full_name == $repo)]
    | sort_by(.created_at) | reverse | first
    | if . == null then "  " else [.id, .status, (.conclusion // "pending")] | @tsv end
  ' <<<"$runs")

  if [[ "$run_id" =~ ^[0-9]+$ && "$run_status" == completed ]]; then
    [[ "$run_conclusion" == success ]] || {
      echo "Develop-push qualification $run_id completed with $run_conclusion." >&2
      exit 1
    }
    break
  fi

  if (( attempt == attempts )); then
    echo 'Timed out waiting for the exact develop-push qualification.' >&2
    exit 1
  fi
  echo "Waiting for develop-push qualification of $HEAD_SHA ($attempt/$attempts)."
  sleep "$interval"
done

[[ "$run_id" =~ ^[0-9]+$ ]] || {
  echo 'No develop-push qualification exists for this exact SHA.' >&2
  exit 1
}

current_develop=$(gh api "repos/$GH_REPO/git/ref/heads/develop" --jq .object.sha)
[[ "$current_develop" == "$HEAD_SHA" ]] || {
  echo 'Develop advanced while promotion evidence was being verified.' >&2
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
