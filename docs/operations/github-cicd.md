# GitHub CI/CD: feature → develop → main → server

Repository: `Mobin-Karam/bastak-school`. Production currently uses the two-service LAN Docker Compose deployment on this server, with the Admin app also hosting student views. This pipeline changes deployment operations, not application screens.

## Daily work

Start every feature, bug fix, or maintenance task from the latest remote `develop`:

```bash
./scripts/cicd/start-work.sh feat/my-feature
# When the current checkout has uncommitted work, use a separate worktree:
./scripts/cicd/start-work.sh fix/my-bug ../bastak-my-bug
```

Review changes, run the affected project's checks, and commit only the intended files. Do not commit generated build output, local databases, credentials, or unrelated changes. Then run:

```bash
./scripts/cicd/finish-work.sh
```

The helper pushes your branch, creates a PR to `develop`, waits for CI, and merges with the expected head SHA. GitHub still enforces configured reviews and branch protection. A failed or conflicting PR stays open. Never push directly to `develop` or `main`.

`Continuous Integration` runs for every PR targeting `develop` or `main`, and every push to either branch. It bootstraps leaf lockfiles in workspace order, checks architecture and contracts, runs all project verification and HTTP security checks, and builds disposable production containers with TLS/proxy/migration smoke checks. `CI Gate` passes only if both quality and container jobs pass; there are no path filters that could leave this required check missing.

After a successful **push** run on `develop`, CI creates or updates one release PR from `develop` to `main`. Inspect its changes and CI results, then merge using **Create a merge commit**. Keep the persistent develop branch; do not squash or delete it. The release PR is the production review boundary; it is not automatically merged.

After a successful **push** run on `main`, `LAN Production Deployment` checks the tested SHA is still the current main head, checks out that exact commit on the server runner, builds images, creates a consistent SQLite backup, recreates containers, and checks readiness over HTTPS. Failed builds leave existing containers running. Backups, certificates, environment values, deployment lock, and successful-release receipt are stored outside runner checkout cleanup.

## Initial GitHub configuration

Authenticate GitHub CLI on this server, then use the following setup. These settings require repository administration access and an appropriate GitHub plan for private-repository branch protection. Setup fails rather than bypassing unavailable protection.

```bash
export PATH="$HOME/.local/bin:$PATH"
gh auth login --hostname github.com --git-protocol ssh --web
python3 scripts/cicd/configure-github.py
python3 scripts/cicd/install-runner.py
```

The configuration script requires PRs and the strict `CI Gate` status on `develop` and `main`, including administrators. Existing review requirements are preserved. New rules allow a solo maintainer to merge without another reviewer; increase approving-review count as the team grows. It sets `PRODUCTION_DEPLOY_TARGET=lan` and limits the `lan-production` environment to main.

The runner installer downloads the official Linux x64 runner, verifies its published SHA256, obtains a short-lived registration token through local authenticated CLI without printing it, registers the `bastak-lan` label, and starts a user systemd service. Docker must be usable by the runner account. Only trusted main deployment code uses this runner. Keep this repository private and restrict who can edit workflows and merge to main. Docker access grants broad host privileges; treat that account as privileged.

For automatic service startup when no desktop session is open, enable lingering once:

```bash
sudo loginctl enable-linger bastak-server
systemctl --user status bastak-actions-runner.service
```

Create a fine-grained GitHub token restricted to this repository, with **Contents: read** and **Pull requests: write**, and save it as `RELEASE_PR_TOKEN` through GitHub Settings → Secrets and variables → Actions, or:

```bash
gh secret set RELEASE_PR_TOKEN --repo Mobin-Karam/bastak-school
```

The CLI prompts for its value. Never paste credentials into chat, command arguments, tracked files, or docs. A GitHub App installation token with the equivalent permissions is the longer-term alternative. This dedicated token is necessary because PRs created with the default `GITHUB_TOKEN` do not reliably start the normal PR CI without additional approval. Do not fall back to untested merges when this secret is absent.

Confirm these server files exist, without placing them in Git:

- `/home/bastak-server/.config/bastak-production/production.env`
- `/home/bastak-server/.config/bastak-production/tls/{server.crt,server.key,ca.crt}`

The existing production Compose project name and named database volume are retained. Keep a single API replica with SQLite. Keep deployment backup storage writable and monitor disk usage; copy backups off the server under an explicit retention policy. `release.txt` records the last successful deployed SHA. An Actions run is successful only after deployment readiness succeeds.

The old Coolify workflow is manual-only and requires `PRODUCTION_DEPLOY_TARGET=coolify`. Do not enable Coolify Git auto-deploy alongside this pipeline. Switching production platforms requires a separate deployment review; the automatic target implemented here is LAN.

## First rollout and recovery

1. Merge the infrastructure PR into develop only after its PR checks pass. Develop CI then tests the merged commit and opens the release PR when the dedicated token is configured.
2. Finish runner registration, protection, environment, and secret setup before merging the release PR.
3. Review **all** develop changes: main currently lags develop, so the first release contains existing application changes as well as this pipeline. Uncommitted local audit/schedule work is not part of that release.
4. Merge the release PR with a merge commit, watch main CI and the production deployment run, then check login, role/school switches, and a real authorized operation in the deployed app.
5. For a code-only regression, make a `fix/` branch from develop containing a reviewed revert, and use the same path to main. For failed SQLite migrations, stop and follow the database rollout/backup instructions; a code revert does not undo schema or data changes. Never reset or seed production to repair a deployment.

There is no automatic database restore or blind rollback: migration reversibility varies. The pre-deploy backup is the recovery boundary. A failed `up --wait` can leave some new containers running; inspect container logs, protect the backup, and assess migration state before changing versions. This is a single-server deployment with possible restart downtime, not a zero-downtime cluster.

## What to learn

1. **Git branches and PRs:** commits, worktrees, merge conflicts, why features branch from develop, and why release PRs use merge commits.
2. **CI:** workflow events, jobs and dependencies, required checks, lockfiles, and reading the first failed job instead of rerunning blindly.
3. **GitHub permissions:** branch protection, environments, token scopes, credential expiry, and the distinction between hosted CI runners and the privileged production runner.
4. **Docker Compose:** images versus containers, named volumes, private API networking, health checks, TLS, and immutable source SHAs.
5. **Database operations:** consistent SQLite backups, migration compatibility, restoration drills, and off-server retention.
6. **Operations:** logs, uptime, disk monitoring, rotating secrets, and verified recovery.

References: [GitHub token behavior](https://docs.github.com/en/actions/concepts/security/github_token), [protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches), [self-hosted runner setup](https://docs.github.com/en/actions/how-tos/manage-runners/self-hosted-runners/add-runners).

## Verification and activation status

Local pipeline tests, shell syntax checks, and workflow validation are recorded in the implementation PR. Server authentication, runner registration, repository settings, token configuration, and real production deployment must be verified individually; the presence of YAML files alone does not prove activation.
