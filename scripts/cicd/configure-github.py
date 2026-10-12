#!/usr/bin/env python3
"""Apply repository settings using an authenticated GitHub CLI; never bypass checks."""
import json, subprocess
REPO = "Mobin-Karam/bastak-school"
def api(path, method="GET", body=None):
    command = ["gh", "api", path, "--method", method]
    if body is not None:
        command += ["--input", "-"]
    result = subprocess.run(command, input=json.dumps(body) if body is not None else None,
                            text=True, capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.strip())
    return json.loads(result.stdout) if result.stdout.strip() else None

def main():
    # Settings-only API: existing protection is never silently replaced.
    for branch in ("develop", "main"):
        try:
            existing = api(f"repos/{REPO}/branches/{branch}/protection")
        except RuntimeError as error:
            if "HTTP 404" not in str(error):
                raise
            existing = None
        if existing:
            status = existing.get("required_status_checks") or {}
            checks = status.get("checks") or [{"context": c, "app_id": -1} for c in status.get("contexts", [])]
            if not any(c["context"] == "CI Gate" for c in checks):
                checks.append({"context": "CI Gate", "app_id": -1})
            api(f"repos/{REPO}/branches/{branch}/protection/required_status_checks", "PATCH",
                {"strict": True, "checks": checks})
            if not existing.get("required_pull_request_reviews"):
                api(f"repos/{REPO}/branches/{branch}/protection/required_pull_request_reviews", "PATCH",
                    {"required_approving_review_count": 0, "dismiss_stale_reviews": True})
            api(f"repos/{REPO}/branches/{branch}/protection/enforce_admins", "POST")
        else:
            api(f"repos/{REPO}/branches/{branch}/protection", "PUT", {
                "required_status_checks": {"strict": True, "contexts": ["CI Gate"]},
                "enforce_admins": True,
                "required_pull_request_reviews": {"required_approving_review_count": 0,
                                                  "dismiss_stale_reviews": True},
                "restrictions": None, "allow_force_pushes": False, "allow_deletions": False})
    api(f"repos/{REPO}", "PATCH", {"allow_merge_commit": True, "allow_squash_merge": True, "allow_auto_merge": True})
    # Deployment activation and private production reviewers are separate operator
    # decisions. Do not set a deploy target or overwrite existing environment rules.
    try:
        api(f"repos/{REPO}/environments/lan-production")
    except RuntimeError as error:
        if "HTTP 404" not in str(error):
            raise
        api(f"repos/{REPO}/environments/lan-production", "PUT", {
            "deployment_branch_policy": {"protected_branches": False, "custom_branch_policies": True}})
    policies = api(f"repos/{REPO}/environments/lan-production/deployment-branch-policies")
    if not any(x["name"] == "main" for x in policies["branch_policies"]):
        api(f"repos/{REPO}/environments/lan-production/deployment-branch-policies", "POST",
            {"name": "main", "type": "branch"})
    print("CI protection configured; existing environment rules preserved. Production activation/reviewers require separate review.")
if __name__ == "__main__":
    main()
