import pathlib
import unittest
import yaml
ROOT = pathlib.Path(__file__).resolve().parents[2]
class PipelineTests(unittest.TestCase):
    def workflow(self, name):
        return yaml.safe_load((ROOT / ".github/workflows" / name).read_text())
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
        checkout = deploy["jobs"]["deploy"]["steps"][0]["with"]
        self.assertEqual(checkout["ref"], "${{ github.event.workflow_run.head_sha }}")
        self.assertFalse(checkout["persist-credentials"])
        self.assertIn('[[ "$current" == "$RELEASE_SHA" ]]', deploy["jobs"]["deploy"]["steps"][1]["run"])
    def test_release_creation_requires_develop_success(self):
        ci = self.workflow("continuous-integration.yml")
        release = ci["jobs"]["release-pr"]
        self.assertEqual(release["needs"], "gate")
        self.assertIn("refs/heads/develop", release["if"])
        self.assertIn("secrets.RELEASE_PR_TOKEN", release["steps"][0]["env"]["GH_TOKEN"])
    def test_only_one_automatic_production_path(self):
        coolify = self.workflow("coolify-deploy.yml")
        self.assertNotIn("workflow_run", coolify.get("on", coolify.get(True)))
        self.assertIn("PRODUCTION_DEPLOY_TARGET == 'coolify'", coolify["jobs"]["deploy"]["if"])
    def test_backup_survives_checkout_cleanup(self):
        workflow = self.workflow("lan-production.yml")
        env = workflow["jobs"]["deploy"]["steps"][1]["env"]
        self.assertTrue(env["PRODUCTION_BACKUP_DIR"].startswith("/home/bastak-server/.config/"))
        script = (ROOT / "scripts/deploy/lan.sh").read_text()
        self.assertIn("PRODUCTION_BACKUP_DIR", script)
        self.assertLess(script.index('.backup('), script.index('up -d --force-recreate'))
if __name__ == "__main__":
    unittest.main()
