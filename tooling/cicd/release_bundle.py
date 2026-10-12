"""CI image transport: exact run, checksummed archive, content-addressed image IDs.

No registry credentials, arbitrary image names, or secret output. All subprocesses
receive an argv list. Download authentication is never forwarded off api.github.com.
"""
import argparse
import hashlib
import json
import os
import pathlib
import re
import subprocess
import tarfile
import tempfile
import urllib.error
import urllib.parse
import urllib.request
import zipfile

SOURCE = "Mobin-Karam/bastak-school"
SERVICES = ("backend-v2", "admin-v2")


def sha(value):
    if not re.fullmatch(r"[a-f0-9]{40}", value):
        raise ValueError("Invalid release SHA")
    return value


def digest(path):
    with open(path, "rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def docker(*args):
    return subprocess.check_output(["docker", *args], text=True)


def reference(service, revision):
    return f"bastak-school/{service}:sha-{sha(revision)}"


def validate_manifest(manifest, revision):
    sha(revision)
    if manifest.get("format") != 1 or manifest.get("sha") != revision or manifest.get("source") != SOURCE:
        raise ValueError("Release manifest provenance mismatch")
    if set(manifest.get("images", {})) != set(SERVICES):
        raise ValueError("Unexpected release services")
    if not re.fullmatch(r"[a-f0-9]{64}", manifest.get("archiveSha256", "")):
        raise ValueError("Invalid archive checksum")
    for service, image in manifest["images"].items():
        if image.get("ref") != reference(service, revision) or not re.fullmatch(r"sha256:[a-f0-9]{64}", image.get("id", "")):
            raise ValueError("Image identity mismatch")
        if not re.fullmatch(r"sha256:[a-f0-9]{64}", image.get("configDigest", "")):
            raise ValueError("Missing portable image config identity")


def verify_images(manifest, exact_id=True):
    for image in manifest["images"].values():
        actual = json.loads(docker("image", "inspect", image["ref"]))[0]
        labels = actual["Config"].get("Labels") or {}
        if (exact_id and actual["Id"] != image["id"]) or labels.get("org.opencontainers.image.revision") != manifest["sha"]:
            raise ValueError("Loaded image content/revision mismatch")
        if actual.get("Os") != "linux" or actual.get("Architecture") != "amd64":
            raise ValueError("Release platform mismatch")


def archive_configs(archive):
    # Config digest includes runtime configuration and ordered rootfs DiffIDs.
    # It is portable between Docker classic and containerd image stores, whose
    # inspect Id may be a config digest versus an OCI manifest/index digest.
    result = {}
    with tarfile.open(archive) as bundle:
        entries = json.load(bundle.extractfile('manifest.json'))
        for entry in entries:
            data = bundle.extractfile(entry['Config']).read()
            for ref in entry.get('RepoTags') or []:
                if ref in result:
                    raise ValueError('Ambiguous image archive')
                result[ref] = 'sha256:' + hashlib.sha256(data).hexdigest()
    return result


def create(directory, revision):
    sha(revision)
    directory.mkdir(parents=True, exist_ok=False)
    images = {s: {"ref": reference(s, revision), "id": json.loads(docker("image", "inspect", reference(s, revision)))[0]["Id"]} for s in SERVICES}
    manifest = {"format": 1, "source": SOURCE, "sha": revision, "images": images}
    verify_images(manifest)
    subprocess.run(["docker", "image", "save", "-o", str(directory / "images.tar"), *[i["ref"] for i in images.values()]], check=True)
    configs = archive_configs(directory / 'images.tar')
    for image in images.values():
        image['configDigest'] = configs[image['ref']]
    manifest["archiveSha256"] = digest(directory / "images.tar")
    (directory / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")


def verify(directory, revision, load=False):
    manifest = json.loads((directory / "manifest.json").read_text())
    validate_manifest(manifest, revision)
    if digest(directory / "images.tar") != manifest["archiveSha256"]:
        raise ValueError("Image archive checksum mismatch")
    if load:
        subprocess.run(["docker", "image", "load", "-i", str(directory / "images.tar")], check=True, stdout=subprocess.DEVNULL)
        verify_images(manifest, exact_id=False)
        loaded = json.loads(json.dumps(manifest))
        ids = {s:json.loads(docker('image','inspect',i['ref']))[0]['Id'] for s,i in manifest['images'].items()}
        if any(ids[s] != i['id'] for s,i in manifest['images'].items()):
            with tempfile.TemporaryDirectory(prefix='bastak-image-identity-') as scratch:
                archive = pathlib.Path(scratch)/'loaded.tar'
                subprocess.run(['docker','image','save','-o',str(archive),*[i['ref'] for i in manifest['images'].values()]],check=True)
                configs = archive_configs(archive)
                if any(configs.get(i['ref']) != i['configDigest'] for i in manifest['images'].values()):
                    raise ValueError('Loaded portable image config/rootfs mismatch')
        for service,image in loaded['images'].items():
            image['ciImageId'] = image['id']
            image['id'] = ids[service]
        (directory/'loaded-images.json').write_text(json.dumps(loaded,indent=2)+'\n')
    return manifest


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def api(path):
    token = os.environ.get("GH_TOKEN")
    if not token:
        raise ValueError("Missing download credential")
    request = urllib.request.Request(f"https://api.github.com/repos/{SOURCE}/{path}", headers={
        "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "bastak-release-verifier"})
    return urllib.request.build_opener(NoRedirect()).open(request, timeout=60)


def download(directory, revision, run_id):
    sha(revision)
    if not re.fullmatch(r"[0-9]+", run_id):
        raise ValueError("Invalid CI run ID")
    with api(f"actions/runs/{run_id}") as response:
        run = json.load(response)
    if not (run["event"] == "push" and run["head_branch"] == "main" and run["head_sha"] == revision
            and run["status"] == "completed" and run["conclusion"] == "success"
            and run["path"] == ".github/workflows/continuous-integration.yml"
            and run["head_repository"]["full_name"] == SOURCE):
        raise ValueError("Unverified source CI run")
    with api(f"actions/runs/{run_id}/artifacts?per_page=100") as response:
        artifacts = json.load(response)["artifacts"]
    matches = [a for a in artifacts if a["name"] == f"production-images-{revision}" and not a["expired"]]
    if len(matches) != 1:
        raise ValueError("Missing, expired or ambiguous release artifact")
    artifact = matches[0]
    expected = artifact.get("digest", "")
    if not re.fullmatch(r"sha256:[a-f0-9]{64}", expected):
        raise ValueError("Artifact has no verifiable digest")
    directory.mkdir(parents=True, exist_ok=False)
    archive = directory / "transport.zip"
    try:
        response = api(f"actions/artifacts/{int(artifact['id'])}/zip")
    except urllib.error.HTTPError as error:
        if error.code != 302:
            raise ValueError("Artifact download rejected") from None
        url = error.headers.get("Location", "")
        parsed = urllib.parse.urlparse(url)
        host = parsed.hostname or ""
        if parsed.scheme != "https" or not any(host.endswith(suffix) for suffix in (".blob.core.windows.net", ".githubusercontent.com", ".actions.githubusercontent.com")):
            raise ValueError("Unexpected artifact download destination") from None
        # Signed transport URL only. The GitHub bearer token is deliberately absent.
        response = urllib.request.build_opener(NoRedirect()).open(url, timeout=60)
    with response, archive.open("wb") as output:
        while chunk := response.read(1024 * 1024):
            output.write(chunk)
    if "sha256:" + digest(archive) != expected:
        raise ValueError("GitHub artifact digest mismatch")
    with zipfile.ZipFile(archive) as bundle:
        if set(bundle.namelist()) != {"manifest.json", "images.tar"} or len(bundle.namelist()) != 2:
            raise ValueError("Unexpected artifact members")
        for name in bundle.namelist():
            with bundle.open(name) as source, (directory / name).open("wb") as output:
                while chunk := source.read(1024 * 1024):
                    output.write(chunk)
    verify(directory, revision)
    (directory / "provenance.json").write_text(json.dumps({"runId": run_id, "artifactId": artifact["id"], "artifactDigest": expected, "sha": revision}) + "\n")
    archive.unlink()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["create", "verify", "load", "download"])
    parser.add_argument("directory", type=pathlib.Path)
    parser.add_argument("revision")
    parser.add_argument("--run-id")
    args = parser.parse_args()
    try:
        if args.command == "create":
            create(args.directory, args.revision)
        elif args.command == "download":
            download(args.directory, args.revision, args.run_id or "")
        else:
            verify(args.directory, args.revision, load=args.command == "load")
    except Exception:
        # HTTP exceptions can include signed URLs. Never print response bodies/URLs.
        raise SystemExit("Release verification failed; inspect run metadata, artifact identity and local prerequisites.") from None
    print(f"Release {args.command} verified: {args.revision}")


if __name__ == "__main__":
    main()
