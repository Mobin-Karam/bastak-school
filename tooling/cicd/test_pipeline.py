import pathlib
import os
import subprocess
import tempfile
import unittest
import yaml
ROOT = pathlib.Path(__file__).resolve().parents[2]
class PipelineTests(unittest.TestCase):
    def workflow(self, name):
        return yaml.safe_load((ROOT / ".github/workflows" / name).read_text())
    def test_full_pipeline_executes_browser_and_disposable_api_journeys(self):
        workflow = self.workflow("continuous-integration.yml")
        runs = "\n".join(step.get("run", "") for step in workflow["jobs"]["quality"]["steps"])
        self.assertIn("test:coverage", runs)
        self.assertIn("verify -- --skip=admin-v2:test", runs)
        self.assertIn("test:cmb-publish", runs)
        self.assertIn("playwright install --with-deps chromium", runs)
        self.assertIn("actions/cache@0057852bfaa89a56745cba8c7296529d2fc39830",
                      "\n".join(step.get("uses", "") for step in workflow["jobs"]["quality"]["steps"]))
        self.assertIn("test:e2e -- --grep 'desktop panels remain reachable'", runs)
        self.assertIn("./scripts/deploy/verify-security.sh", runs)
        script = (ROOT / "scripts/deploy/verify-security.sh").read_text()
        self.assertIn("all) suites=(security-matrix student-journey onboarding-journey)", script)
        self.assertIn('DATABASE_PATH="$security_directory/$suite.sqlite"', script)
        self.assertIn('node "apps/api/scripts/$suite-e2e.mjs"', script)
        self.assertIn("for attempt in {1..600}; do", (ROOT / "scripts/cicd/finish-work.sh").read_text())
        workspace_runner = (ROOT / "tooling/workspace/run.mjs").read_text()
        self.assertIn("Unknown or unselected verify task in --skip", workspace_runner)
    def test_required_gate_covers_every_change_and_failure(self):
        ci = self.workflow("continuous-integration.yml")
        events = ci.get("on", ci.get(True))
        self.assertNotIn("paths", events["pull_request"])
        self.assertNotIn("paths", events["push"])
        gate = ci["jobs"]["gate"]
        self.assertEqual(gate["if"], "always()")
        self.assertEqual(set(gate["needs"]), {"quality", "containers", "promotion-evidence"})
        self.assertIn('test "$QUALITY" = success', gate["steps"][0]["run"])
        self.assertIn('test "$CONTAINERS" = success', gate["steps"][0]["run"])
        self.assertIn('[[ "$PROMOTION" == success ]]', gate["steps"][0]["run"])

    def test_release_pr_reuses_only_exact_develop_push_evidence(self):
        ci = self.workflow("continuous-integration.yml")
        self.assertIn("github.base_ref != 'main'", ci["jobs"]["quality"]["if"])
        self.assertIn("github.base_ref != 'main'", ci["jobs"]["containers"]["if"])
        promotion = ci["jobs"]["promotion-evidence"]
        self.assertEqual(promotion["if"], "github.event_name == 'pull_request' && github.base_ref == 'main'")
        checkout = promotion["steps"][0]["with"]
        self.assertEqual(checkout["ref"], "${{ github.event.pull_request.head.sha }}")
        self.assertEqual(checkout["fetch-depth"], 0)
        self.assertIn("verify-promotion-evidence.sh", promotion["steps"][1]["run"])
        script = (ROOT / "scripts/cicd/verify-promotion-evidence.sh").read_text()
        for evidence in (
            'HEAD_BRANCH:-}" == develop',
            'HEAD_REPOSITORY:-}" == "$GH_REPO"',
            'git merge-base --is-ancestor "$BASE_SHA" "$HEAD_SHA"',
            'current_develop" == "$HEAD_SHA"',
            'event == "push" and .head_branch == "develop"',
            'run_status" == completed',
            'run_conclusion" == success',
            'Timed out waiting for the exact develop-push qualification.',
            'production-images-$HEAD_SHA',
            'artifact_digest" =~ ^sha256:',
        ):
            self.assertIn(evidence, script)
        self.assertEqual(promotion["timeout-minutes"], 45)

    def test_successful_develop_push_refreshes_only_safe_pr_heads(self):
        workflow = self.workflow("branch-synchronization.yml")
        events = workflow.get("on", workflow.get(True))
        self.assertEqual(events["workflow_run"]["workflows"], ["Continuous Integration"])
        self.assertEqual(events["workflow_run"]["branches"], ["develop", "main"])
        job = workflow["jobs"]["refresh-open-prs"]
        self.assertIn("conclusion == 'success'", job["if"])
        self.assertEqual(workflow["permissions"], {"contents": "read", "pull-requests": "write"})
        self.assertIn("default_branch", job["steps"][0]["with"]["ref"])
        script = (ROOT / "scripts/cicd/sync-open-pr-branches.sh").read_text()
        for expected in ('Only protected develop or main branches', 'select(.head.repo.full_name == $repo)',
                         'if [[ "$head_ref" == develop ]]', 'pulls/$number/update-branch'):
            self.assertIn(expected, script)

    def test_release_evidence_waits_for_the_matching_develop_run(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            fake = root / "bin"
            fake.mkdir()
            calls = root / "calls"
            gh = fake / "gh"
            gh.write_text("""#!/bin/bash
set -euo pipefail
endpoint="$2"
if [[ "$endpoint" == */git/ref/heads/develop ]]; then
  printf '%s\\n' "$HEAD_SHA"
elif [[ "$endpoint" == *'/runs?'* ]]; then
  count=0
  [[ ! -f "$CALLS" ]] || count=$(cat "$CALLS")
  count=$((count + 1))
  printf '%s' "$count" > "$CALLS"
  status=in_progress
  conclusion=null
  (( count < 2 )) || { status=completed; conclusion='"success"'; }
  printf '{"workflow_runs":[{"id":42,"head_sha":"%s","event":"push","head_branch":"develop","status":"%s","conclusion":%s,"path":".github/workflows/continuous-integration.yml","head_repository":{"full_name":"%s"},"created_at":"2026-10-24T00:00:00Z"}]}\\n' "$HEAD_SHA" "$status" "$conclusion" "$GH_REPO"
elif [[ "$endpoint" == */actions/runs/42/artifacts* ]]; then
  printf '{"artifacts":[{"name":"production-images-%s","expired":false,"digest":"sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"}]}\\n' "$HEAD_SHA"
else
  echo "Unexpected gh call: $*" >&2
  exit 1
fi
""")
            gh.chmod(0o700)
            head = subprocess.run(
                ["git", "rev-parse", "HEAD"], cwd=ROOT, text=True, capture_output=True, check=True
            ).stdout.strip()
            base = subprocess.run(
                ["git", "rev-parse", "HEAD~1"], cwd=ROOT, text=True, capture_output=True, check=True
            ).stdout.strip()
            env = dict(
                os.environ,
                PATH=str(fake) + os.pathsep + os.environ["PATH"],
                GH_TOKEN="fixture",
                GH_REPO="fixture/repo",
                HEAD_BRANCH="develop",
                HEAD_REPOSITORY="fixture/repo",
                HEAD_SHA=head,
                BASE_SHA=base,
                CALLS=str(calls),
                PROMOTION_EVIDENCE_ATTEMPTS="3",
                PROMOTION_EVIDENCE_INTERVAL_SECONDS="0",
            )
            result = subprocess.run(
                ["bash", "scripts/cicd/verify-promotion-evidence.sh"],
                cwd=ROOT,
                env=env,
                text=True,
                capture_output=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertEqual(calls.read_text(), "2")
            self.assertIn("Promotion evidence verified", result.stdout)

    def test_image_archives_are_retained_only_for_branch_pushes(self):
        readiness = self.workflow("deployment-readiness.yml")
        steps = readiness["jobs"]["containers"]["steps"]
        self.assertIn('if [[ "$EVENT_NAME" == push ]]', steps[2]["run"])
        self.assertEqual(steps[3]["if"], "github.event_name == 'push'")

    def test_advisory_component_workflows_do_not_repeat_on_release_pr_or_main(self):
        for name in (
            "admin-v2-quality.yml",
            "ai-toolkit-check.yml",
            "backend-v2-quality.yml",
            "cmb-packages-quality.yml",
            "repository-safety.yml",
            "student-core-quality.yml",
            "student-v2-quality.yml",
        ):
            events = self.workflow(name).get("on", self.workflow(name).get(True))
            self.assertEqual(events["pull_request"]["branches"], ["develop"], name)
            self.assertEqual(events["push"]["branches"], ["develop"], name)
    def test_main_only_deployment_checks_the_tested_commit(self):
        deploy = self.workflow("lan-production.yml")
        events = deploy.get("on", deploy.get(True))
        self.assertEqual(set(events), {"workflow_run"})
        self.assertEqual(events["workflow_run"]["branches"], ["main"])
        authorize = deploy["jobs"]["authorize"]["if"]
        for expected in ("conclusion == 'success'", "event == 'push'", "head_branch == 'main'",
                         "head_repository.full_name == github.repository", "PRODUCTION_DEPLOY_TARGET == 'lan'"):
            self.assertIn(expected, authorize)
        server = yaml.safe_load((ROOT / ".github/deployment/server-deploy.yml").read_text())
        checkout = server["jobs"]["deploy"]["steps"][0]["with"]
        self.assertEqual(checkout["ref"], "${{ github.event.client_payload.sha }}")
        self.assertFalse(checkout["persist-credentials"])
        self.assertIn('[[ "$current" == "$RELEASE_SHA" ]]', server["jobs"]["deploy"]["steps"][1]["run"])
    def test_release_creation_requires_develop_success(self):
        ci = self.workflow("release-promotion.yml")
        release = ci["jobs"]["release-pr"]
        self.assertIn("conclusion == 'success'", release["if"])
        self.assertIn("head_branch == 'develop'", release["if"])
        self.assertEqual(release["environment"], "lan-production")
        self.assertIn("secrets.RELEASE_PR_TOKEN", release["steps"][0]["env"]["GH_TOKEN"])
        self.assertIn("compare/main...develop", release["steps"][0]["run"])
        self.assertIn("behind", release["steps"][0]["run"])
    def test_only_one_automatic_production_path(self):
        coolify = self.workflow("coolify-deploy.yml")
        self.assertNotIn("workflow_run", coolify.get("on", coolify.get(True)))
        self.assertIn("PRODUCTION_DEPLOY_TARGET == 'coolify'", coolify["jobs"]["deploy"]["if"])
    def test_public_workflows_cannot_request_production_runner(self):
        workflow = self.workflow("lan-production.yml")
        self.assertEqual(workflow["jobs"]["dispatch"]["runs-on"], "ubuntu-latest")
        self.assertEqual(workflow["jobs"]["dispatch"]["environment"], "lan-production")
        server = yaml.safe_load((ROOT / ".github/deployment/server-deploy.yml").read_text())
        verify = server["jobs"]["authorize"]["steps"][0]["run"]
        for expected in ('r["event"]=="push"', 'r["head_branch"]=="main"', 'r["conclusion"]=="success"',
                         'r["path"]==".github/workflows/continuous-integration.yml"'):
            self.assertIn(expected, verify)
    def test_release_history_is_synchronized_without_empty_releases(self):
        workflow = self.workflow("branch-synchronization.yml")
        sync = workflow["jobs"]["synchronize-main-into-develop"]
        self.assertIn("head_branch == 'main'", sync["if"])
        self.assertEqual(sync["environment"], "lan-production")
        self.assertIn("sync-main-into-develop.sh", sync["steps"][1]["run"])
        self.assertIn('--auto --merge', (ROOT / "scripts/cicd/sync-main-into-develop.sh").read_text())
        self.assertIn("No application changes to release", self.workflow("release-promotion.yml")["jobs"]["release-pr"]["steps"][0]["run"])
    def test_student_checks_follow_the_current_workspace(self):
        workflow = self.workflow("student-v2-quality.yml")
        runs = "\n".join(s.get("run", "") for s in workflow["jobs"]["student-experience"]["steps"])
        self.assertIn("verify --project=admin-v2", runs)
        self.assertIn("verify --project=student-core", runs)
        self.assertNotIn("apps/student", runs)
    def test_development_compose_uses_only_current_composition_roots(self):
        compose=(ROOT / "docker-compose.yml").read_text()
        self.assertNotIn("apps/student/Dockerfile", compose)
        self.assertNotIn("student-v2:", compose)
    def test_backup_survives_checkout_cleanup(self):
        workflow = yaml.safe_load((ROOT / ".github/deployment/server-deploy.yml").read_text())
        env = workflow["jobs"]["deploy"]["steps"][1]["env"]
        self.assertTrue(env["PRODUCTION_BACKUP_DIR"].startswith("/home/bastak-server/.config/"))
        script = (ROOT / "scripts/deploy/lan.sh").read_text()
        self.assertIn("PRODUCTION_BACKUP_DIR", script)
        self.assertLess(script.index('database-recovery.cjs backup'), script.index('up -d --force-recreate'))
    def test_immutable_promotion_is_staged_and_protected(self):
        readiness=self.workflow('deployment-readiness.yml')
        steps=readiness['jobs']['containers']['steps']
        self.assertIn('./scripts/deploy/verify-release.sh',steps[2]['run'])
        release_check=(ROOT/'scripts/deploy/verify-release.sh').read_text()
        self.assertIn('prepare-upgrade-rehearsal.cjs',release_check)
        self.assertLess(release_check.index('prepare-upgrade-rehearsal.cjs'),release_check.index('up -d --no-build'))
        self.assertIn('mkdir "$test_directory/upgrade-data"',release_check)
        self.assertIn('type=bind,src=$test_directory/upgrade-data,dst=/data',release_check)
        self.assertEqual(release_check.count('--tmpfs /tmp:rw,noexec,nosuid,size=64m'),5)
        self.assertIn('github.sha',steps[3]['with']['name'])
        self.assertEqual(steps[3]['with']['if-no-files-found'],'error')
        server=yaml.safe_load((ROOT/'.github/deployment/server-deploy.yml').read_text())
        deploy=server['jobs']['deploy']
        self.assertIn("IMMUTABLE_DEPLOY_ENABLED == 'true'",deploy['if'])
        self.assertEqual(deploy['environment'],'production')
        self.assertEqual(deploy['permissions'],{'contents':'read','actions':'read'})
        self.assertIn('SOURCE_ARTIFACT_READ_TOKEN',deploy['steps'][1]['env']['GH_TOKEN'])
        run=deploy['steps'][1]['run']
        self.assertIn('release_bundle.py download',run)
        self.assertIn('lan-immutable.sh',run)
        self.assertNotIn('install -m 600',run)
        immutable=(ROOT/'scripts/deploy/lan-immutable.sh').read_text()
        self.assertIn('--no-build --pull never',immutable)
        self.assertNotIn(' down ',immutable)
        self.assertEqual(immutable.count('--tmpfs /tmp:rw,noexec,nosuid,size=64m'),2)
        self.assertLess(immutable.index(' node - rehearse'),immutable.index('up -d --no-build'))
        configure=(ROOT/'scripts/cicd/configure-github.py').read_text()
        self.assertNotIn('"variable", "set", "PRODUCTION_DEPLOY_TARGET"',configure)

    def test_upgrade_fixture_defers_every_guarded_migration(self):
        fixture=(ROOT/'scripts/deploy/prepare-upgrade-rehearsal.cjs').read_text()
        candidate_migrations=(
            'StudentAttendancePoints1731400000000',
            'StudentPointLedgerIdempotencyScope1731400100000',
            'PrincipalDashboardAnalytics1731500000000',
            'TargetedAnnouncementMedia1731500000000',
            'DailyAttendanceSessionReview1731600000000',
            'RepairAttendanceSessionReviewRevision1731700000000',
        )
        for migration in candidate_migrations:
            self.assertIn(f'"{migration}"',fixture)
    def test_sync_retry_recovers_a_pushed_branch_and_existing_pr(self):
        script = (ROOT / "scripts/cicd/sync-main-into-develop.sh").read_text()
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            def run(*args, cwd=root, env=None):
                return subprocess.run(args, cwd=cwd, env=env, text=True, capture_output=True, check=True).stdout.strip()
            origin = root / "origin.git"
            run("git", "init", "--bare", "--initial-branch=develop", str(origin))
            seed = root / "seed"
            run("git", "clone", str(origin), str(seed))
            run("git", "config", "user.name", "Fixture", cwd=seed)
            run("git", "config", "user.email", "fixture@example.invalid", cwd=seed)
            (seed / "fixture").write_text("base")
            run("git", "add", ".", cwd=seed)
            run("git", "commit", "-m", "base", cwd=seed)
            run("git", "checkout", "-b", "main", cwd=seed)
            run("git", "commit", "--allow-empty", "-m", "release", cwd=seed)
            sha = run("git", "rev-parse", "HEAD", cwd=seed)
            run("git", "push", "origin", "main", "develop", cwd=seed)
            fake = root / "bin"
            fake.mkdir()
            gh = fake / "gh"
            gh.write_text("#!/bin/bash\nset -eu\ncase \"$2\" in\nlist) [[ ! -f \"$PR_MARKER\" ]] || echo 31 ;;\ncreate) [[ \"$FAIL_CREATE\" == 0 ]] || exit 1; touch \"$PR_MARKER\" ;;\nmerge) touch \"$MERGE_MARKER\" ;;\nesac\n")
            gh.chmod(0o700)
            env = dict(os.environ, PATH=str(fake)+os.pathsep+os.environ["PATH"], GH_TOKEN="fixture",
                       GH_REPO="fixture/repo", RELEASE_SHA=sha, PR_MARKER=str(root / "pr"),
                       MERGE_MARKER=str(root / "merge"), FAIL_CREATE="1")
            branch = "chore/sync-main-" + sha
            previous = None
            for attempt in range(3):
                checkout = root / str(attempt)
                run("git", "clone", str(origin), str(checkout))
                result = subprocess.run(["bash", "-c", script], cwd=checkout, env=env, capture_output=True, text=True)
                if attempt == 0:
                    self.assertNotEqual(result.returncode, 0)
                    env["FAIL_CREATE"] = "0"
                else:
                    self.assertEqual(result.returncode, 0, result.stderr)
                current = run("git", "rev-parse", "refs/heads/"+branch, cwd=origin)
                if previous:
                    self.assertEqual(current, previous)
                previous = current
            self.assertTrue((root / "merge").exists())

    def test_backup_copy_cannot_preserve_world_readable_permissions(self):
        script = (ROOT / "scripts/deploy/lan.sh").read_text().split('"${compose[@]}" up -d --force-recreate')[0]
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            deploy = root / "scripts/deploy"
            deploy.mkdir(parents=True)
            (deploy / "lan.sh").write_text(script)
            # This fixture targets file permissions; image identity/retention is
            # covered independently by test_retention.py.
            (deploy / "retain-current-images.py").write_text("# fixture: no container changes\n")
            (deploy / "database-recovery.cjs").write_text("// fixture mounted into mocked Docker\n")
            tls = deploy / "create-lan-tls.sh"
            tls.write_text("#!/bin/bash\nexit 0\n")
            tls.chmod(0o700)
            config = root / ".run/production"
            config.mkdir(parents=True)
            (config / "production.env").write_text("# fixture\n")
            fake = root / "bin"
            fake.mkdir()
            docker = fake / "docker"
            docker.write_text('''#!/bin/bash
set -eu
printf '%s\n' "$*" >> "$CALL_LOG"
if [[ "$1" == inspect ]]; then
  if [[ "$*" == *Mounts* ]]; then echo bastak-school_moshaver_v2_sqlite; else echo sha256:fixture; fi
  exit 0
fi
if [[ "$1" == run && "$*" == *".cjs backup"* ]]; then
  [[ "${RECOVERY_FAILURE:-0}" == 0 ]] || exit 7
  target="$PRODUCTION_BACKUP_DIR/$(basename "${@: -1}")"
  echo fixture > "$target"; chmod 644 "$target"; exit 0
fi
for arg in "$@"; do
  if [[ "$arg" == ps ]]; then echo backend-v2; exit 0; fi
done
''')
            docker.chmod(0o700)
            env = dict(os.environ, PATH=str(fake)+os.pathsep+os.environ["PATH"],
                       PRODUCTION_BACKUP_DIR=str(root / "backups"), PRODUCTION_LOCK_FILE=str(root / "lock"), RELEASE_SHA="a"*40,
                       CALL_LOG=str(root / "calls"))
            subprocess.run(["bash", str(deploy / "lan.sh")], env=env, capture_output=True, text=True, check=True)
            backups = list((root / "backups").glob("*.sqlite"))
            self.assertEqual(len(backups), 1)
            self.assertEqual(backups[0].stat().st_mode & 0o777, 0o600)
            self.assertEqual((root / "backups").stat().st_mode & 0o777, 0o700)
            (root / "calls").write_text("")
            failed = subprocess.run(["bash", str(deploy / "lan.sh")], env=dict(env, RECOVERY_FAILURE="1"), capture_output=True, text=True)
            self.assertEqual(failed.returncode, 7)
            calls = (root / "calls").read_text()
            self.assertIn("stop admin-v2 backend-v2", calls)
            self.assertIn("start backend-v2 backend-v2", calls)
            self.assertNotIn("up -d", calls)

if __name__ == "__main__":
    unittest.main()
