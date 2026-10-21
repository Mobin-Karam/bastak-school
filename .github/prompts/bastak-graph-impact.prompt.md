---
description: Trace a Bastak School change through callers, contracts, consumers, tests, and deployment impact.
---

# Bastak School graph impact analysis

Use Graphify first to answer the requested change-impact question.

1. Identify the primary concepts/modules involved.
2. Trace direct and transitive callers/consumers.
3. Identify affected API contracts, migrations, shared Admin/Student UI, `student-core`, tests, documentation, and deployment configuration.
4. Separate EXTRACTED evidence from inferred relationships when Graphify exposes that distinction.
5. Verify the most important paths in source.
6. Return a compact impact map: must-change, should-check, compatibility-only identifiers, unlikely-to-change, risks, and validation commands.

Do not modify code unless explicitly requested.
