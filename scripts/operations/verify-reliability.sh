#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
case "${1:-all}" in
  baseline)
    mkdir -p .run/reliability
    RUN_PERFORMANCE_BASELINE=1 PERFORMANCE_REPORT_PATH="$(pwd)/.run/reliability/baseline.json" \
      npm --prefix apps/api test -- --runTestsByPath test/performance-baseline.spec.ts
    echo 'Disposable performance report: .run/reliability/baseline.json'
    ;;
  all)
    npm run workspace:check
    npm run architecture:check
    npm run contracts:check
    npm run cmb:compatibility
    npm run verify
    ./scripts/deploy/verify-security.sh
    bash scripts/operations/verify-reliability.sh baseline
    ;;
  *) echo 'Usage: verify-reliability.sh [all|baseline]' >&2; exit 2 ;;
esac
