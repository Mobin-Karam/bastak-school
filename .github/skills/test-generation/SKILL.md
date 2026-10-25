---
name: test-generation
description: Design and implement maintainable unit, integration, contract, end-to-end, and regression tests using existing project tooling.
---

# Test Generation Skill

For capability-sensitive features, prioritize server authorization and cross-organization isolation tests; add Admin gating tests as a complementary presentation layer.

## Selection guide
- Unit: isolated business rules and transformations.
- Integration: database, framework, service boundary, or module interaction.
- Contract: producer/consumer request-response compatibility.
- E2E: critical user journeys and cross-system behavior.
- Regression: exact failure mode for a fixed bug.

Use existing fixtures/builders. Keep tests deterministic. Avoid real external services unless the repository deliberately uses them. Assert meaningful behavior rather than implementation trivia.

## Release evidence tests

When testing deployment-sensitive work, use `docs/operations/release-evidence.md` to select the layer: source behavior, disposable container/release rehearsal, and private production proof are distinct. For migrations, cover fresh schema, representative populated upgrade, restore/preservation, and the exact recovery allowance if one is needed; prove unrelated legacy data changes remain rejected. Report skipped/external/private checks as unverified rather than manufacturing production success.
