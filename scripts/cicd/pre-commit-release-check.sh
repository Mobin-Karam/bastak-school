#!/usr/bin/env bash
# Complete local preflight before committing a release candidate or opening its PR.
# It only uses disposable fixtures and containers; it never reads production config
# and it never creates commits, pushes branches, opens PRs, or deploys.
set -Eeuo pipefail

root=$(git rev-parse --show-toplevel)
cd "$root"

readonly green=$'\033[32m'
readonly cyan=$'\033[36m'
readonly yellow=$'\033[33m'
readonly red=$'\033[31m'
readonly dim=$'\033[2m'
readonly reset=$'\033[0m'
phase=0
completed=0
started_at=$SECONDS
show_logs=false
dry_run=false
show_progress=false
phase_log_dir=$(mktemp -d "${TMPDIR:-/tmp}/moshaver-preflight.XXXXXX")
failed_phase_log=""
failure_output_printed=false
declare -a parallel_pids=()
declare -a parallel_numbers=()
declare -a parallel_labels=()
declare -a parallel_logs=()
declare -a parallel_started=()
declare -a parallel_statuses=()

cleanup() {
  rm -rf "$phase_log_dir"
}
trap cleanup EXIT

usage() {
  cat <<'EOF'
Usage: ./scripts/cicd/pre-commit-release-check.sh [--logs] [--progress] [--dry-run] [--skip-release-rehearsal]

Runs the full local gate for a commit or release PR. By default it includes the
disposable Docker release rehearsal: image build, populated SQLite upgrade,
backup/restore, HTTPS readiness, security matrix, and critical-flow smoke test.

Options:
  --logs                    Print each gate's complete log when it finishes.
  --progress                Animate live progress in an interactive terminal.
  --dry-run                 Show the gate plan without executing validation.
  --skip-release-rehearsal  Skip only the long Docker release rehearsal.
  -h, --help                Show this help.
EOF
}

print_command() {
  printf '  %s$ %s%s\n' "$dim" "$1" "$reset" >&2
}

print_remediation() {
  local log_file=$1
  local cycle
  local cycle_left
  local cycle_right

  printf '\n%sHow to fix this%s\n' "$cyan" "$reset" >&2

  if grep -q 'new backend import cycle:' "$log_file"; then
    cycle=$(sed -n 's/.*new backend import cycle: //p' "$log_file" | head -n 1)
    cycle_left=$(basename "${cycle%% <-> *}" .ts)
    cycle_right=$(basename "${cycle##* <-> }" .ts)
    printf 'A new source-import cycle was introduced: %s\n' "$cycle" >&2
    printf 'Inspect the two sides and remove one import edge. For TypeORM, keep a unidirectional relation when the inverse property is not queried. Do not add the cycle to the baseline.\n' >&2
    print_command 'npm run architecture:check'
    print_command "rg -n \"${cycle_left}|${cycle_right}\" apps/api/src/database/entities"
    return
  fi

  if grep -q 'backend deep implementation import\|backend module imports entity barrel\|undeclared workspace edge\|Architecture violations:' "$log_file"; then
    printf 'This is a dependency-boundary violation. Read the named import, replace it with a public entrypoint or direct entity-file import as the error requests, then re-run the architecture gate.\n' >&2
    print_command 'npm run architecture:check'
    return
  fi

  if grep -q 'Graphify source fingerprint is missing\|Committed Graphify graph is stale' "$log_file"; then
    printf 'Source files changed after the graph fingerprint was generated. Refresh the local code graph and fingerprint.\n' >&2
    print_command 'npm run graphify:generate'
    print_command 'npm run graphify:check'
    return
  fi

  if grep -q 'docs:check\|documentation .*failed\|broken .*link' "$log_file"; then
    printf 'A documentation check failed. Open the path reported above, fix the broken reference or required document metadata, then run the documentation check alone.\n' >&2
    print_command 'npm run docs:check'
    return
  fi

  if grep -q 'contracts:check\|API contract' "$log_file"; then
    printf 'The API contract no longer matches its consumers or declarations. Update the contract and affected API/Admin consumers together, then run the contract gate.\n' >&2
    print_command 'npm run contracts:check'
    return
  fi

  if grep -q 'audit:database\|migration\|Migration' "$log_file"; then
    printf 'A migration or database compatibility check failed. Inspect the reported migration and preserve existing data, constraints, and forward-only upgrade safety before retrying.\n' >&2
    print_command 'npm --prefix apps/api run audit:database'
    return
  fi

  if grep -q 'typecheck\|TS[0-9][0-9][0-9][0-9]' "$log_file"; then
    printf 'A TypeScript check failed. Correct the reported type at its source; do not weaken compiler settings or add unsafe casts merely to pass the gate.\n' >&2
    if ((phase == 6)); then
      print_command 'npm --prefix apps/api run build'
    else
      print_command 'npm --prefix apps/admin run typecheck'
    fi
    return
  fi

  if grep -q 'format:check\|Prettier' "$log_file"; then
    printf 'Formatting differs from the repository formatter. Format the reported files, review the diff, then check formatting again.\n' >&2
    print_command 'npm --prefix apps/admin run format:check'
    return
  fi

  if grep -q 'lint\|eslint\|ESLint' "$log_file"; then
    printf 'A lint rule failed. Fix the reported code rather than disabling the rule, then run the affected linter.\n' >&2
    if ((phase == 6)); then
      print_command 'npm --prefix apps/api run lint'
    else
      print_command 'npm --prefix apps/admin run lint'
    fi
    return
  fi

  if grep -q 'test:e2e\|playwright\|E2E' "$log_file"; then
    printf 'A browser end-to-end check failed. Re-run it with logs, use the reported trace or screenshot, and fix the user-visible flow.\n' >&2
    print_command 'npm --prefix apps/admin run test:e2e'
    return
  fi

  if grep -q 'FAIL\|failed\|test' "$log_file"; then
    printf 'A test failed. Run the affected test command alone, read the first assertion failure, and change production code or the test fixture only when the expected behavior has intentionally changed.\n' >&2
    if ((phase == 6)); then
      print_command 'npm --prefix apps/api test'
    else
      print_command 'npm --prefix apps/admin test'
    fi
    return
  fi

  if grep -q 'docker compose\|Docker\|verify-security' "$log_file"; then
    printf 'A container or deployment-security check failed. Re-run the exact configuration check below and fix the referenced Compose, environment, or security rule.\n' >&2
    print_command 'docker compose --env-file deployment/lan/production.env.example -f docker-compose.production.yml -f deployment/lan/compose.yml config --quiet'
    print_command './scripts/deploy/verify-security.sh'
    return
  fi

  if ((phase == 10)); then
    printf 'The disposable release rehearsal failed. Re-run it with logs and fix the first failing readiness, migration, restore, TLS, or smoke-test assertion.\n' >&2
    print_command './scripts/deploy/verify-release.sh'
    return
  fi

  printf 'Re-run the preflight with live logs and address the first command that exits non-zero.\n' >&2
  print_command './scripts/cicd/pre-commit-release-check.sh --logs --skip-release-rehearsal'
}

run_phase() {
  local label=$1
  shift
  phase=$((phase + 1))
  local phase_log="$phase_log_dir/phase-${phase}.log"
  local phase_started=$SECONDS
  local status=0

  printf '\n%s[%02d] %s%s' "$cyan" "$phase" "$label" "$reset"

  if "$dry_run"; then
    printf '\n  %s$' "$dim"
    printf ' %q' "$@"
    printf '%s\n' "$reset"
    completed=$((completed + 1))
    return
  fi

  if "$show_logs"; then
    printf '\n%s$' "$dim"
    printf ' %q' "$@"
    printf '%s\n' "$reset"
    if "$@" 2>&1 | tee "$phase_log"; then
      :
    else
      status=${PIPESTATUS[0]}
    fi
  else
    "$@" >"$phase_log" 2>&1 &
    local command_pid=$!
    local dots=0
    while kill -0 "$command_pid" 2>/dev/null; do
      dots=$(((dots + 1) % 4))
      printf '\r%s[%02d] %s%s %s%-3s%s' \
        "$cyan" "$phase" "$label" "$reset" "$dim" "$(printf '%*s' "$dots" '' | tr ' ' '.')" "$reset"
      sleep 0.25
    done
    if wait "$command_pid"; then
      :
    else
      status=$?
    fi
  fi

  if ((status != 0)); then
    failed_phase_log=$phase_log
    return "$status"
  fi

  local elapsed=$((SECONDS - phase_started))
  completed=$((completed + 1))
  printf '\r%s✓ PASS%s [%02d] %s %s(%ss)%s\n' \
    "$green" "$reset" "$phase" "$label" "$dim" "$elapsed" "$reset"
}

start_parallel_phase() {
  local label=$1
  shift
  phase=$((phase + 1))
  local number=$phase
  local phase_log="$phase_log_dir/phase-${number}.log"

  printf '\n%s[%02d] QUEUED%s %s\n' "$cyan" "$number" "$reset" "$label"
  if "$dry_run"; then
    printf '  %s$' "$dim"
    printf ' %q' "$@"
    printf '%s\n' "$reset"
    completed=$((completed + 1))
    return
  fi

  "$@" >"$phase_log" 2>&1 &
  parallel_pids+=("$!")
  parallel_numbers+=("$number")
  parallel_labels+=("$label")
  parallel_logs+=("$phase_log")
  parallel_started+=("$SECONDS")
}

wait_for_parallel_phases() {
  local pending=${#parallel_pids[@]}
  local index
  local status=0
  local failures=0
  local first_failure=-1

  if ((pending == 0)); then
    return
  fi

  printf '\n%sRunning %d independent gates concurrently.%s Logs are kept separate so failures stay readable.\n' \
    "$cyan" "$pending" "$reset"

  while ((pending > 0)); do
    local active_labels=()
    for index in "${!parallel_pids[@]}"; do
      [[ ${parallel_pids[$index]} == 0 ]] && continue
      if kill -0 "${parallel_pids[$index]}" 2>/dev/null; then
        active_labels+=("[${parallel_numbers[$index]}] ${parallel_labels[$index]}")
        continue
      fi

      if wait "${parallel_pids[$index]}"; then
        status=0
      else
        status=$?
      fi
      parallel_pids[$index]=0
      parallel_statuses[$index]=$status
      pending=$((pending - 1))
      local elapsed=$((SECONDS - parallel_started[$index]))
      if ((status == 0)); then
        completed=$((completed + 1))
        printf '%s✓ PASS%s [%02d] %s %s(%ss)%s\n' \
          "$green" "$reset" "${parallel_numbers[$index]}" "${parallel_labels[$index]}" "$dim" "$elapsed" "$reset"
        if "$show_logs" && [[ -s ${parallel_logs[$index]} ]]; then
          printf '%s--- [%02d] %s ---%s\n' "$dim" "${parallel_numbers[$index]}" "${parallel_labels[$index]}" "$reset"
          cat "${parallel_logs[$index]}"
        fi
      else
        failures=$((failures + 1))
        if ((first_failure < 0)); then
          first_failure=$index
        fi
        printf '%s✗ FAIL%s [%02d] %s %s(%ss)%s\n' \
          "$red" "$reset" "${parallel_numbers[$index]}" "${parallel_labels[$index]}" "$dim" "$elapsed" "$reset" >&2
      fi
    done

    if ((pending > 0)); then
      if "$show_progress" && [[ -t 1 ]]; then
        printf '\r%s… RUNNING%s %d gate(s): %s' "$cyan" "$reset" "$pending" "${active_labels[*]:0:2}"
      fi
      sleep 0.25
    fi
  done
  if "$show_progress" && [[ -t 1 ]]; then
    printf '\r%*s\r' 140 ''
  fi

  if ((failures > 0)); then
    printf '%s%d concurrent gate(s) failed. Their isolated output follows.%s\n' "$red" "$failures" "$reset" >&2
    for index in "${!parallel_numbers[@]}"; do
      if [[ ${parallel_statuses[$index]:-0} != 0 ]]; then
        printf '%s--- FAILED [%02d] %s ---%s\n' "$yellow" "${parallel_numbers[$index]}" "${parallel_labels[$index]}" "$reset" >&2
        cat "${parallel_logs[$index]}" >&2
      fi
    done
    phase=${parallel_numbers[$first_failure]}
    failed_phase_log=${parallel_logs[$first_failure]}
    failure_output_printed=true
    return 1
  fi
}

on_error() {
  local status=$?
  printf '\n%s✗ FAILED%s during phase %d after %ss. No commit, push, PR, or deployment was made.\n' \
    "$red" "$reset" "$phase" "$((SECONDS - started_at))" >&2
  if [[ -n "$failed_phase_log" && -s "$failed_phase_log" && "$show_logs" == false && "$failure_output_printed" == false ]]; then
    printf '%sFailure output:%s\n' "$yellow" "$reset" >&2
    cat "$failed_phase_log" >&2
  fi
  if [[ -n "$failed_phase_log" && -s "$failed_phase_log" ]]; then
    print_remediation "$failed_phase_log"
  fi
  exit "$status"
}
trap on_error ERR

release_rehearsal=true
while (($#)); do
  case $1 in
    --logs) show_logs=true ;;
    --progress) show_progress=true ;;
    --dry-run) dry_run=true ;;
    --skip-release-rehearsal) release_rehearsal=false ;;
    -h|--help) usage; exit 0 ;;
    *) printf '%sUnknown option: %s%s\n' "$red" "$1" "$reset" >&2; usage >&2; exit 2 ;;
  esac
  shift
done

printf '%sMoshaver commit and release-PR preflight%s\n' "$cyan" "$reset"
printf 'Branch: %s | Commit: %s\n' "$(git branch --show-current)" "$(git rev-parse --short HEAD)"
printf 'Working tree changes are allowed here; review and commit only intended paths after this gate.\n'

run_phase "Runtime and repository state" bash -euo pipefail -c '
  node --version
  npm --version
  git status --short
  git diff --check
  git diff --cached --check
'

start_parallel_phase "Workspace DAG" bash -euo pipefail -c '
  npm run workspace:check
  npm run workspace:plan -- build
'
start_parallel_phase "Architecture, contracts, and documentation" bash -euo pipefail -c '
  npm run architecture:check
  npm run cmb:compatibility
  npm run cmb:publish:check
  npm run contracts:check
  npm run docs:check
'
start_parallel_phase "Shared packages and workspace verification" bash -euo pipefail -c '
  npm --prefix packages/admin-workspace-ui test
  node tooling/workspace/run.mjs verify --project=cmb-reference
  npm --prefix student-core run build
  npm --prefix student-core test
'
start_parallel_phase "Generator and CMB package tests" bash -euo pipefail -c '
  npm run test:generators
  npm run test:cmb-publish
'
start_parallel_phase "API types, unit tests, build, and migration upgrade audit" bash -euo pipefail -c '
  npm --prefix apps/api run lint
  npm --prefix apps/api test
  npm --prefix apps/api run build
  npm --prefix apps/api run audit:database
'
start_parallel_phase "Admin quality, parity, release audit, and production bundle" bash -euo pipefail -c '
  npm --prefix apps/admin run audit:release
'
start_parallel_phase "Compose and deployment security configuration" bash -euo pipefail -c '
  docker compose --env-file deployment/lan/production.env.example -f docker-compose.production.yml -f deployment/lan/compose.yml config --quiet
  ./scripts/deploy/verify-security.sh
'
wait_for_parallel_phases

run_phase "Admin browser E2E against the release build" npm --prefix apps/admin run test:e2e

if "$release_rehearsal"; then
  run_phase "Disposable release rehearsal: images, SQLite upgrade/restore, HTTPS, API smoke" \
    ./scripts/deploy/verify-release.sh
else
  printf '\n%s! SKIPPED%s Disposable release rehearsal by explicit request.\n' "$yellow" "$reset"
fi

run_phase "Refresh Graphify source fingerprint" bash -euo pipefail -c '
  npm run graphify:generate
  npm run graphify:check
'

printf '\n%s✓ READY%s %d phases completed in %ss.\n' "$green" "$reset" "$completed" "$((SECONDS - started_at))"
printf 'Next: inspect git diff, commit only intended paths, then use scripts/cicd/finish-work.sh to create and merge the develop PR.\n'
printf 'After develop CI passes, the repository automation opens the release PR to main; do not bypass its required checks.\n'
