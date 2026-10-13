"""Retention tests use fake Docker; no real containers or images are modified."""
import json
import os
import pathlib
import subprocess
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]

class RetentionTests(unittest.TestCase):
    def test_retains_exact_images_without_pruning_or_replacing_containers(self):
        with tempfile.TemporaryDirectory() as directory:
            root = pathlib.Path(directory)
            docker = root / "docker"
            docker.write_text('''#!/usr/bin/env python3
import json,os,sys,pathlib
args=sys.argv[1:]
with open(os.environ['CALLS'],'a') as f:f.write(json.dumps(args)+'\\n')
if args[0]=='ps':print('fixture-container')
elif args[0]=='inspect':print(json.dumps([{'Image':'sha256:fixture-image'}]))
elif args[:2]==['image','inspect']:print('sha256:fixture-image')
elif args[0]=='tag':pass
else:sys.exit(2)
''')
            docker.chmod(0o700)
            env = dict(os.environ, PATH=str(root) + os.pathsep + os.environ['PATH'], CALLS=str(root / 'calls'), PRODUCTION_RETENTION_DIR=str(root / 'releases'))
            result = subprocess.run(['python3', str(ROOT / 'scripts/deploy/retain-current-images.py')], env=env, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            receipt = next((root / 'releases').glob('*/images.json'))
            images = json.loads(receipt.read_text())['images']
            self.assertEqual(set(images), {'backend-v2', 'admin-v2'})
            self.assertTrue(all(item['imageId'] == 'sha256:fixture-image' for item in images.values()))
            self.assertEqual(receipt.stat().st_mode & 0o777, 0o600)
            self.assertTrue((receipt.parent / 'compose.rollback.yml').exists())
            calls = [json.loads(line) for line in (root / 'calls').read_text().splitlines()]
            self.assertEqual(sum(call[0] == 'tag' for call in calls), 2)
            self.assertFalse(any(word in call for call in calls for word in ['prune', 'rm', 'stop', 'up', 'down']))

    def test_restore_and_rehearsal_precede_live_recreation(self):
        script = (ROOT / 'scripts/deploy/lan.sh').read_text()
        recreate = script.index('"${compose[@]}" up -d --force-recreate')
        self.assertLess(script.index('database-recovery.cjs rehearse'), recreate)
        self.assertLess(script.index('database-recovery.cjs backup'), recreate)
        self.assertLess(script.index('stop admin-v2 backend-v2'), script.index('database-recovery.cjs backup'))
        self.assertIn('docker start "$previous_backend" "$previous_admin"', script)
        self.assertLess(script.index('retain-current-images.py'), script.index('"${compose[@]}" build'))
        self.assertIn('set -euo pipefail', script)

if __name__ == '__main__':
    unittest.main()
