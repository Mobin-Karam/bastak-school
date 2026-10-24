import contextlib
import hashlib
import importlib.util
import io
import json
import os
import pathlib
import subprocess
import tempfile
import unittest
from unittest import mock
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('release_bundle', ROOT / 'tooling/cicd/release_bundle.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)
SHA = 'a' * 40


def manifest(data=b'image fixture'):
    return {'format':1, 'source':release.SOURCE, 'sha':SHA, 'archiveSha256':hashlib.sha256(data).hexdigest(),
            'images':{s:{'ref':release.reference(s,SHA),'id':'sha256:'+'b'*64,'configDigest':'sha256:'+'c'*64} for s in release.SERVICES}}


class ReleaseTests(unittest.TestCase):
    def test_production_compose_requires_verified_release_inputs(self):
        compose = (ROOT / 'docker-compose.production.yml').read_text()
        self.assertIn('${RELEASE_SHA:?Set the verified release SHA}', compose)
        self.assertIn('${BACKEND_IMAGE:?Set the immutable backend image reference}', compose)
        self.assertIn('${ADMIN_IMAGE:?Set the immutable admin image reference}', compose)
        self.assertNotIn(':latest}', compose)
        self.assertNotIn('RELEASE_SHA:-development', compose)

    def test_checksums_and_provenance_fail_before_docker_load(self):
        with tempfile.TemporaryDirectory() as d:
            p=pathlib.Path(d); (p/'images.tar').write_bytes(b'tampered'); (p/'manifest.json').write_text(json.dumps(manifest()))
            with mock.patch.object(release.subprocess,'run') as run:
                with self.assertRaises(ValueError):release.verify(p,SHA,load=True)
                run.assert_not_called()
        for field,value in [('sha','c'*40),('source','attacker/repo'),('format',2)]:
            m=manifest();m[field]=value
            with self.assertRaises(ValueError):release.validate_manifest(m,SHA)
        m=manifest();m['images']['backend-v2']['ref']='arbitrary/image:latest'
        with self.assertRaises(ValueError):release.validate_manifest(m,SHA)

    def test_image_id_and_revision_are_both_required(self):
        image={'Id':'sha256:'+'b'*64,'Config':{'Labels':{'org.opencontainers.image.revision':SHA}},'Os':'linux','Architecture':'amd64'}
        with mock.patch.object(release,'docker',return_value=json.dumps([image])):release.verify_images(manifest())
        for path,value in [('Id','sha256:'+'c'*64),('Architecture','arm64')]:
            changed=dict(image);changed[path]=value
            with mock.patch.object(release,'docker',return_value=json.dumps([changed])):
                with self.assertRaises(ValueError):release.verify_images(manifest())
        image['Config']['Labels']['org.opencontainers.image.revision']='c'*40
        with mock.patch.object(release,'docker',return_value=json.dumps([image])):
            with self.assertRaises(ValueError):release.verify_images(manifest())

    def test_exact_run_artifact_and_digest_download(self):
        run={'event':'push','head_branch':'main','head_sha':SHA,'status':'completed','conclusion':'success','path':'.github/workflows/continuous-integration.yml','head_repository':{'full_name':release.SOURCE}}
        for traversal in [False,True]:
            content=io.BytesIO()
            with zipfile.ZipFile(content,'w') as z:
                z.writestr('manifest.json',json.dumps(manifest()));z.writestr('../images.tar' if traversal else 'images.tar',b'image fixture')
            data=content.getvalue();artifact={'name':'production-images-'+SHA,'expired':False,'id':9,'digest':'sha256:'+hashlib.sha256(data).hexdigest()}
            with tempfile.TemporaryDirectory() as d, mock.patch.object(release,'api',side_effect=[io.BytesIO(json.dumps(run).encode()),io.BytesIO(json.dumps({'artifacts':[artifact]}).encode()),io.BytesIO(data)]):
                p=pathlib.Path(d)/'bundle'
                if traversal:
                    with self.assertRaises(ValueError):release.download(p,SHA,'42')
                else:
                    release.download(p,SHA,'42');self.assertEqual(release.verify(p,SHA)['sha'],SHA)
                    self.assertTrue((p/'provenance.json').exists())
        run['event']='pull_request'
        with tempfile.TemporaryDirectory() as d, mock.patch.object(release,'api',return_value=io.BytesIO(json.dumps(run).encode())):
            with self.assertRaises(ValueError):release.download(pathlib.Path(d)/'bundle',SHA,'42')

    def test_cross_store_image_ids_require_matching_config_and_rootfs(self):
        for compatible in [True,False]:
            with self.subTest(compatible=compatible), tempfile.TemporaryDirectory() as d:
                p=pathlib.Path(d);(p/'images.tar').write_bytes(b'image fixture');(p/'manifest.json').write_text(json.dumps(manifest()))
                image={'Id':'sha256:'+'d'*64,'Config':{'Labels':{'org.opencontainers.image.revision':SHA}},'Os':'linux','Architecture':'amd64'}
                configs={release.reference(s,SHA):'sha256:'+('c' if compatible else 'e')*64 for s in release.SERVICES}
                with mock.patch.object(release,'docker',return_value=json.dumps([image])),mock.patch.object(release.subprocess,'run'),mock.patch.object(release,'archive_configs',return_value=configs):
                    if compatible:
                        release.verify(p,SHA,load=True);loaded=json.loads((p/'loaded-images.json').read_text())
                        self.assertEqual(loaded['images']['backend-v2']['id'],image['Id'])
                        self.assertEqual(loaded['images']['backend-v2']['ciImageId'],'sha256:'+'b'*64)
                    else:
                        with self.assertRaises(ValueError):release.verify(p,SHA,load=True)
                        self.assertFalse((p/'loaded-images.json').exists())

    def test_deploy_failure_boundaries_and_lock(self):
        for mode in ['preflight','replacement','healthy','locked','environment-mutated']:
            with self.subTest(mode=mode), tempfile.TemporaryDirectory() as d:
                p=pathlib.Path(d); deploy=p/'scripts/deploy';deploy.mkdir(parents=True)
                (deploy/'lan-immutable.sh').write_text((ROOT/'scripts/deploy/lan-immutable.sh').read_text())
                (deploy/'database-recovery.cjs').write_text('// fixture')
                (deploy/'probe-release.sh').write_text('#!/bin/bash\nexit 0\n');(deploy/'probe-release.sh').chmod(0o700)
                bundle=p/'bundle';bundle.mkdir();(bundle/'manifest.json').write_text(json.dumps(manifest()))
                (bundle/'loaded-images.json').write_text(json.dumps(manifest()))
                config=p/'config';(config/'tls').mkdir(parents=True)
                for name in ['production.env','nginx.conf.template','tls/server.key','tls/server.crt']:(config/name).write_text('fixture')
                bin_dir=p/'bin';bin_dir.mkdir()
                (bin_dir/'git').write_text('#!/bin/bash\necho '+SHA+'\n')
                (bin_dir/'openssl').write_text('#!/bin/bash\nexit 0\n')
                (bin_dir/'python3').write_text('#!/bin/bash\nif [[ "$1" == tooling/cicd/release_bundle.py ]]; then exit 0; fi\nexec '+subprocess.check_output(['which','python3'],text=True).strip()+' "$@"\n')
                (bin_dir/'docker').write_text('''#!/bin/bash
set -eu
printf '%s\n' "$*" >> "$CALLS"
if [[ "$1" == inspect ]]; then
 if [[ "$3" == *Mounts* ]]; then echo fixture_volume; else echo sha256:bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb; fi
 exit 0
fi
if [[ "$1" == compose ]]; then
 for arg in "$@"; do
  if [[ "$arg" == ps ]]; then echo "${@: -1}"; exit 0; fi
  if [[ "$arg" == up && "$MODE" == environment-mutated ]]; then
   printf 'unexpected=change\n' > "$PRODUCTION_CONFIG_DIR/production.env"
  fi
  if [[ "$arg" == up && "$MODE" == replacement ]]; then exit 1; fi
 done
fi
if [[ "$1" == run ]]; then
 if [[ "$MODE" == preflight ]]; then exit 1; fi
 for arg in "$@"; do
  if [[ "$arg" == /backup/*.sqlite ]]; then
   target="$BACKUPS/${arg##*/}"; touch "$target" "$target.restored" "$target.verification.json"
  fi
 done
fi
''')
                for f in bin_dir.iterdir():f.chmod(0o700)
                env=dict(os.environ,PATH=str(bin_dir)+os.pathsep+os.environ['PATH'],IMMUTABLE_DEPLOY_ENABLED='true',RELEASE_SHA=SHA,RELEASE_BUNDLE=str(bundle),PRODUCTION_CONFIG_DIR=str(config),PRODUCTION_BACKUP_DIR=str(p/'backups'),PRODUCTION_LOCK_FILE=str(p/'lock'),PRODUCTION_RECEIPT=str(p/'release.json'),PRODUCTION_DATA_VOLUME='fixture_volume',CALLS=str(p/'calls'),BACKUPS=str(p/'backups'),MODE=mode)
                lock=contextlib.nullcontext()
                if mode=='locked':
                    import fcntl
                    lock=open(p/'lock','w');fcntl.flock(lock,fcntl.LOCK_EX|fcntl.LOCK_NB)
                with lock:
                    result=subprocess.run(['bash',str(deploy/'lan-immutable.sh')],env=env,capture_output=True,text=True)
                calls=(p/'calls').read_text() if (p/'calls').exists() else ''
                if mode=='healthy':self.assertEqual(result.returncode,0,result.stderr);self.assertTrue((p/'release.json').exists())
                else:self.assertNotEqual(result.returncode,0);self.assertFalse((p/'release.json').exists())
                if mode=='preflight':self.assertIn('start backend-v2 admin-v2',calls);self.assertNotIn(' up ',calls)
                if mode=='replacement':self.assertIn('stop admin-v2',calls);self.assertNotIn('start backend-v2 admin-v2',calls)
                if mode=='locked':self.assertEqual(calls,'')
                self.assertNotIn('down',calls);self.assertNotIn('prune',calls)


if __name__=='__main__':unittest.main()
