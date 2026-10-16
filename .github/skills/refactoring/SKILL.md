---
name: refactoring
description: Refactor code safely while preserving observable behavior, tests, contracts, and repository conventions.
---

# Refactoring Skill

Preserve public entrypoints and the Moshaver dependency direction. Do not move product policy into CMB or add root workspace tooling as refactor collateral.

## Rules
- Define the behavior that must remain unchanged.
- Create/confirm tests around risky behavior before structural changes.
- Refactor in small steps and keep each step understandable.
- Avoid mixing broad formatting, dependency upgrades, and feature changes with the refactor.
- Remove duplication only when the abstraction has a stable concept.
- Re-run targeted tests after each meaningful boundary change.
