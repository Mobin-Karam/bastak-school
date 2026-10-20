# Codex project context

`AGENTS.md` is the canonical engineering contract for this repository. This
directory makes the existing GitHub-maintained agent resources directly
discoverable to Codex without copying, renaming, or allowing their guidance to
drift.

## Use the right source

| Need | Canonical source | Codex use |
| --- | --- | --- |
| Repository-wide rules | [`AGENTS.md`](../AGENTS.md) and [`AGENT.md`](../AGENT.md) | Read before changing the repository. |
| Copilot baseline | [`.github/copilot-instructions.md`](../.github/copilot-instructions.md) | Additional cross-tool guidance; `AGENTS.md` wins on conflict. |
| Targeted policy | [`.github/instructions/`](../.github/instructions/) | Read the files matching the changed language or surface. |
| Task workflow | [`.github/skills/`](../.github/skills/) | Load the matching `SKILL.md` before following that workflow. |
| Role lens | [`.github/agents/`](../.github/agents/) | Use its body as a task brief; role front matter is GitHub-specific. |
| Reusable task request | [`.github/prompts/`](../.github/prompts/) | Treat as a prompt template, not as executable configuration. |
| Complete source inventory | [`scripts/list-github-context.mjs`](./scripts/list-github-context.mjs) | Run to list every linked agent, skill, prompt, instruction, and Markdown guide. |

The GitHub files remain their source of truth. Do not create parallel copies
under `.codex/`; follow the links above so Codex and GitHub agents see the
same repository guidance.

## Branch before changes

For every repository-affecting request, first inspect the active branch. If it
is `develop`, `main`, detached, or not the dedicated branch for the active
task, create and switch to a new task branch from the current `develop`
baseline before making changes. Use `feat/`, `fix/`, `chore/`, or `ci/` plus a
concise task slug. Keep any dirty worktree intact; do not reset, clean, stash,
or discard user changes to satisfy this rule. Read-only questions do not need a
new branch. The full policy is in [`AGENTS.md`](../AGENTS.md).

## Complete task branches

Unless the user opts out, after a repository-affecting task passes its
applicable validation, Codex reviews the task-scoped diff, stages only those
files, commits, pushes, and opens or updates a pull request into `develop`.
It then requests squash auto-merge. If checks, reviews, repository settings, or
permissions prevent auto-merge, leave the PR open and report what is pending;
never bypass branch protection. This does not apply to the separately reviewed
`develop` → `main` release PR.

## MCP servers

[`config.toml`](./config.toml) is a local, ignored configuration. It registers
the project Graphify server and laptop-available OpenAI Developer Docs, GitHub,
Liara, Graph-it-Live, and Torob servers. Codex also inherits the laptop's
managed `node_repl` server. A configured server may still require OAuth login,
network access, or a new Codex session before it is usable.

Check availability without printing credentials:

```bash
codex mcp list
```

The Liara endpoint is intentionally local-only because it is account-specific.
Never move this file, its endpoint, or OAuth material into a tracked file.
