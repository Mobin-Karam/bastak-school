---
name: storybook-documentation
description: Build and maintain Bastak School Storybook documentation for reusable UI and feature components. Use when adding or changing React components, shared UI, shell surfaces, component examples, or visual regression-ready states.
---

# Storybook Documentation

Use the Admin React/Vite Storybook as the component documentation surface. The
catalog is generated from exported TSX component modules; it is an inventory,
not proof that a data-connected feature can safely render without fixtures.

## Workflow

1. Read `AGENTS.md`, query Graphify, and inspect the component, its providers,
   tests, translations, styles, and consumers.
2. Run `npm run storybook:catalog` in `apps/admin` before editing stories. Keep
   the generated catalog committed and run `npm run storybook:catalog:check`
   before handoff.
3. Co-locate an interactive `*.stories.tsx` file with every reusable visual
   component and Admin page. Use CSF, autodocs, Persian/RTL defaults, and meaningful states:
   default, empty/loading/error/disabled, narrow viewport, and LTR only when
   mixed-direction behavior matters.
4. For pages, start from `.storybook/fixtures/auth.tsx` and compose deterministic
   feature fixtures; make page stories the primary UI/UX design surface before
   wiring live API behavior. Reuse the global Storybook providers. Do not weaken server authorization,
   call production APIs, hard-code credentials, or invent live domain data.
   Components that require an authenticated API or complex workflow need an
   explicit fixture boundary and must remain accurately marked in the catalog
   until a safe story is added.
5. For shared components, add interaction/accessibility coverage where it
   protects behavior. Verify keyboard labels, focus, reduced motion, dark
   theme, and RTL logical layout as applicable.
6. Run `npm run typecheck`, `npm run storybook:catalog:check`, and
   `npm run storybook:build` from `apps/admin`; report browser/device or
   provider limitations separately.

## Guardrails

- Storybook is documentation and visual-isolation tooling, never an
  authorization or API-contract bypass.
- Keep stories out of the production bundle and do not import feature-private
  modules through non-public CMB boundaries.
- Preserve the shared Admin/Student app topology and exact-host routing.
- Favor component stories over full-page duplicates; page/workflow stories
  need deterministic fixtures and explicit ownership.
