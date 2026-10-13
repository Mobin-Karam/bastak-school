#!/usr/bin/env python3
"""Tag and record current production images; never prune images or change containers."""
import datetime
import json
import os
import pathlib
import subprocess

def docker(*args):
    return subprocess.check_output(["docker", *args], text=True).strip()

def main():
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    root = pathlib.Path(os.environ.get("PRODUCTION_RETENTION_DIR", str(pathlib.Path.home() / ".config/bastak-production/releases")))
    root.mkdir(parents=True, exist_ok=True, mode=0o700)
    directory = root / f"rollback-{stamp}"
    directory.mkdir(mode=0o700)
    images = {}
    for service in ("backend-v2", "admin-v2"):
        containers = docker("ps", "--filter", "label=com.docker.compose.project=bastak-school", "--filter", f"label=com.docker.compose.service={service}", "--format", "{{.ID}}") .splitlines()
        if len(containers) != 1:
            raise RuntimeError(f"Expected one running production {service} container")
        container = json.loads(docker("inspect", containers[0]))[0]
        image = container["Image"]
        tag = f"bastak-school/{service}:rollback-{stamp}"
        docker("tag", image, tag)
        if docker("image", "inspect", tag, "--format", "{{.Id}}") != image:
            raise RuntimeError("Retained image identity mismatch")
        images[service] = {"imageId": image, "tag": tag}
    receipt = {"recordedAt": stamp, "images": images, "policy": "Retain these tags; never run image/system prune while rollback is required. Database compatibility must be checked separately."}
    (directory / "images.json").write_text(json.dumps(receipt, indent=2) + "\n")
    (directory / "compose.rollback.yml").write_text("services:\n" + "".join(f"  {service}:\n    image: {item['tag']}\n" for service, item in images.items()))
    for file in directory.iterdir():
        file.chmod(0o600)
    print(f"Previous production image IDs retained: {directory}")

if __name__ == "__main__":
    main()
