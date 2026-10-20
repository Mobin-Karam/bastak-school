# Bastak School Storybook

Storybook documents the Admin application's reusable component surfaces in
isolation. It defaults to Persian and RTL, while the toolbar can switch to LTR
for mixed-direction verification.

```bash
npm run storybook
npm run storybook:build
```

Before changing component documentation, refresh the generated source catalog:

```bash
npm run storybook:catalog
npm run storybook:catalog:check
```

The catalog covers every exported TSX component module. A module marked
`نیازمند fixture` is not a missing source record: it requires deterministic
auth, API, or workflow data before an isolated interactive story can be
truthfully added. Follow
[`storybook-documentation`](../../.github/skills/storybook-documentation/SKILL.md)
when extending coverage.
