#!/usr/bin/env python3
"""Register a repository-scoped production runner using local gh authentication."""
import hashlib, json, os, pathlib, subprocess, tarfile, tempfile, urllib.request
REPO = "Mobin-Karam/bastak-school"
home = pathlib.Path.home()
runner = home / ".local/share/bastak-actions-runner"
if (runner / ".runner").exists():
    raise SystemExit("Runner already configured; inspect it before re-registering.")
subprocess.run(["docker", "info"], check=True, stdout=subprocess.DEVNULL)
release = json.load(urllib.request.urlopen("https://api.github.com/repos/actions/runner/releases/latest"))
asset = next(a for a in release["assets"] if a["name"].startswith("actions-runner-linux-x64-")
             and a["name"].endswith(".tar.gz"))
digest = asset.get("digest", "")
if not digest.startswith("sha256:"):
    raise SystemExit("No published SHA256 digest; verify the runner package manually.")
data = urllib.request.urlopen(asset["browser_download_url"]).read()
if hashlib.sha256(data).hexdigest() != digest.removeprefix("sha256:"):
    raise SystemExit("Runner checksum mismatch.")
runner.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix="bastak-runner-") as directory:
    archive = pathlib.Path(directory) / "runner.tar.gz"
    archive.write_bytes(data)
    with tarfile.open(archive) as bundle:
        bundle.extractall(runner, filter="data")
token_result = subprocess.run(["gh", "api", f"repos/{REPO}/actions/runners/registration-token",
                               "--method", "POST"], check=True, text=True, capture_output=True)
token = json.loads(token_result.stdout)["token"]
result = subprocess.run([str(runner / "config.sh"), "--unattended", "--url",
                         f"https://github.com/{REPO}", "--token", token,
                         "--name", "bastak-production", "--labels", "bastak-lan", "--work", "_work"],
                        cwd=runner, text=True, capture_output=True)
if result.returncode:
    raise SystemExit("Runner configuration failed; inspect system dependencies and GitHub runner settings.")
config = home / ".config/systemd/user"
config.mkdir(parents=True, exist_ok=True)
(config / "bastak-actions-runner.service").write_text(f"""[Unit]
Description=Bastak production GitHub Actions runner
After=network-online.target
[Service]
WorkingDirectory={runner}
ExecStart={runner}/run.sh
Restart=always
RestartSec=10
Environment=PATH={home}/.local/bin:/usr/local/bin:/usr/bin:/bin
[Install]
WantedBy=default.target
""")
subprocess.run(["systemctl", "--user", "daemon-reload"], check=True)
subprocess.run(["systemctl", "--user", "enable", "--now", "bastak-actions-runner.service"], check=True)
print("Runner registered and user service started. Enable user lingering for reboot persistence.")
