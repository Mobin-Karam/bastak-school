---
name: debugging
description: Diagnose failures by reproduction, tracing, hypothesis testing, root-cause isolation, regression tests, and minimal fixes.
---

# Debugging Skill

For Moshaver, trace from Admin/UI symptoms through the API contract and server authorization before changing a visible client behavior.

## Workflow
1. Capture the exact failure, inputs, environment, and expected behavior.
2. Reproduce with the narrowest command/test possible.
3. Trace from the symptom toward the first incorrect state/decision.
4. Compare failing and working paths when available.
5. Form one or more falsifiable hypotheses.
6. Verify before editing.
7. Add a regression test when practical.
8. Implement the root-cause fix.
9. Run targeted and relevant surrounding validation.

Avoid speculative multi-file edits before understanding the failure.

## Deployment incident boundary

For release or production failures, use `docs/operations/development-to-production.md` to locate the first failing boundary: PR CI, promotion evidence, source dispatch, private receiver, migration rehearsal, readiness, or authorized smoke. Preserve the exact SHA, backup, receipt, logs, and schema state. Do not bypass a gate, rebuild on the host, reset/seed/delete production data, retry migrations blindly, or run an older image against a migrated database without compatibility rehearsal.
