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
        self.assertIn("test:cmb-publish", runs)
        self.assertIn("playwright install --with-deps chromium", runs)
        self.assertIn("test:e2e -- --grep 'desktop panels remain reachable'", runs)
        self.assertIn("./scripts/deploy/verify-security.sh", runs)
        script = (ROOT / "scripts/deploy/verify-security.sh").read_text()
        self.assertIn("all) suites=(security-matrix student-journey onboarding-journey)", script)
        self.assertIn('DATABASE_PATH="$security_directory/$suite.sqlite"', script)
        self.assertIn('node "apps/api/scripts/$suite-e2e.mjs"', script)
        self.assertIn("for attempt in {1..600}; do", (ROOT / "scripts/cicd/finish-work.sh").read_text())
    def test_required_gate_covers_every_change_and_failure(self):
        ci = self.workflow("continuous-integration.yml")
        events = ci.get("on", ci.get(True))
        self.assertNotIn("paths", events["pull_request"])
        self.assertNotIn("paths", events["push"])
        gate = ci["jobs"]["gate"]
        self.assertEqual(gate["if"], "always()")
        self.assertEqual(set(gate["needs"]), {"quality", "containers"})
        self.assertIn('test "$QUALITY" = success', gate["steps"][0]["run"])
        self.assertIn('test "$CONTAINERS" = success', gate["steps"][0]["run"])
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
        workflow = self.workflow("continuous-integration.yml")
        sync = workflow["jobs"]["sync-main"]
        self.assertEqual(sync["needs"], "gate")
        self.assertIn("refs/heads/main", sync["if"])
        self.assertIn('--auto --merge', sync["steps"][1]["run"])
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
        self.assertLess(immutable.index(' node - rehearse'),immutable.index('up -d --no-build'))
        configure=(ROOT/'scripts/cicd/configure-github.py').read_text()
        self.assertNotIn('"variable", "set", "PRODUCTION_DEPLOY_TARGET"',configure)
    def test_sync_retry_recovers_a_pushed_branch_and_existing_pr(self):
        script = self.workflow("continuous-integration.yml")["jobs"]["sync-main"]["steps"][1]["run"]
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
