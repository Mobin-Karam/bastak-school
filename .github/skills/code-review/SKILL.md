---
name: code-review
description: Perform evidence-based code review focused on correctness, regressions, security, contracts, tests, performance, and maintainability.
---

# Code Review Skill

For Moshaver, include public-entrypoint dependency direction, server-side capability/organization enforcement, contract consumers, and migration safety in the evidence review.

## Review order
1. Correctness and user-visible regressions.
2. Security/authorization/data exposure.
3. Data integrity and migration safety.
4. Contract compatibility and consumers.
5. Concurrency/state/lifecycle behavior.
6. Tests and validation gaps.
7. Performance risks with plausible impact.
8. Maintainability and unnecessary complexity.

Findings should include severity, file/location, evidence, impact, and remediation. Skip purely stylistic comments covered by formatters unless they affect clarity or correctness.

For a CI-fix review, require the failed log/current SHA, source-backed root cause, focused regression or equivalent evidence, and local rerun of the failed command. Flag broad exclusions, assertion weakening, or any repair that relies on a prior green CI run instead of the pushed head.

## Release-aware review

For release-affecting changes, review against `docs/operations/development-to-production.md` and `docs/operations/immutable-lan-runbook.md`: protected promotion, immutable exact-SHA artifacts, private receiver verification, host-owned configuration/secrets, migration rehearsal/backups, and post-release evidence. Flag mutable runtime builds/tags, production configuration in source, missing populated-data migration coverage, unsafe recovery actions, and claims that equate CI or dispatch with deployed health.
