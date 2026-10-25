---
name: git-workflow
description: Work safely with Git branches, commits, diffs, merges, rebases, pull requests, and repository state without losing user work.
---

# Git Workflow Skill

Normal work targets `develop`; preserve unrelated dirty changes. Do not merge a release PR or treat CI dispatch as production confirmation without the project’s required evidence.

## Safety rules
- Inspect `git status`, current branch, remotes, and relevant diff before disruptive operations.
- Preserve uncommitted user changes.
- Do not run `reset --hard`, destructive `clean`, force push, or history rewrites unless explicitly requested and understood.
- Keep commits focused when the user requests commits.
- Before merge/rebase, identify conflicts and branch relationship.
- Before PR/release work, validate the intended base/head and repository policy.

## Failed-check loop

For a failing PR, inspect the first failed job for the current head SHA before rerunning or editing. Reproduce its narrowest command, commit a root-cause repair, rerun it, push, and wait for new CI. Do not force-push, bypass protection, merge on an older green result, or treat a rerun without a changed head as a fix.

## Production promotion

Follow `docs/operations/ci-cd-pipeline.md` for a release: normal work reaches `develop` by protected PR, then a separately reviewed `develop` to `main` PR uses a merge commit after exact-SHA evidence. If `main` is not an ancestor of `develop`, wait for the checked synchronization PR. Never merge stale heads, bypass required checks, force a release branch, or treat the main dispatch as production completion; private receiver, receipt/backup, HTTPS, and authorized smoke evidence remain required.
