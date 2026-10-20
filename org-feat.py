#!/usr/bin/env python3
"""Bastak School: safely group existing frontend features into business domains.

Run from the monorepo root:
    python3 reorganize-features.py --dry-run
    python3 reorganize-features.py --apply

Uses git mv and updates static JS/TS module paths (relative, @/, ~/, /src/).
Does not restructure internals or generate empty folders.
"""
from __future__ import annotations

import argparse
import datetime as dt
import os
from pathlib import Path
import re
import subprocess
import sys

DOMAINS: dict[str, tuple[str, ...]] = {
    "identity": ("auth", "registration", "onboarding", "access", "security"),
    "people": ("students", "guardian", "teacher-portal", "student-portal"),
    "academics": ("education", "subjects", "class-groups", "schedule", "learning", "exams", "questions", "quizzes"),
    "student-life": ("attendance", "dormitory", "leave-requests", "exit-permissions", "permission-requests", "attention", "followup"),
    "communications": ("chat", "notifications", "sms", "live"),
    "analytics": ("dashboard", "reports", "school-home"),
    "productivity": ("planner", "clock", "resources"),
    "platform": ("system", "settings", "pwa"),
}
# Keep 'mobile' in place until its contents are audited: it may be a feature or reusable UI.
# Keep feature-root files (e.g. role-readonly-ui.test.tsx) in place.

MODULE_EXTS = (".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".json")
SCAN_EXTS = {".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"}
IGNORE = {".git", "node_modules", "dist", "build", "coverage", ".next", ".turbo", ".vite"}
# Covers import, export ... from, import(...), require(...), vi/jest.mock(...), import.meta.glob(...)
SPEC_RE = re.compile(
    r'''(?P<head>\b(?:from\s*|import\s*(?:\(\s*)?|require\s*\(\s*|(?:vi|jest)\.(?:mock|doMock|importActual)\s*\(\s*|import\.meta\.glob\s*\(\s*)['\"])(?P<spec>[^'\"\r\n]+)(?P<tail>['\"])'''
)


def git(root: Path, *args: str, capture: bool = False) -> str:
    result = subprocess.run(["git", *args], cwd=root, text=True, check=True,
                            stdout=subprocess.PIPE if capture else None)
    return result.stdout or ""


def module_resolve(path: Path) -> Path | None:
    candidates = [path]
    candidates.extend(Path(str(path) + ext) for ext in MODULE_EXTS)
    candidates.extend(path / ("index" + ext) for ext in MODULE_EXTS)
    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve()
    return None


def source_path(spec: str, source: Path, src: Path) -> Path | None:
    if spec.startswith("./") or spec.startswith("../"):
        return (source.parent / spec).resolve()
    for prefix in ("@/", "~/", "/src/"):
        if spec.startswith(prefix):
            return (src / spec[len(prefix):]).resolve()
    return None


def destination_for(path: Path, original_features: Path, rename_dirs: dict[Path, Path]) -> Path:
    for old, new in rename_dirs.items():
        if path == old or old in path.parents:
            return new / path.relative_to(old)
    return path


def make_spec(old_spec: str, old_importer: Path, new_importer: Path,
              old_target: Path, new_target: Path, src: Path) -> str:
    if old_spec.startswith(("./", "../")):
        new_spec = os.path.relpath(new_target, new_importer.parent).replace(os.sep, "/")
        if not new_spec.startswith("."):
            new_spec = "./" + new_spec
    else:
        prefix = next((p for p in ("@/", "~/", "/src/") if old_spec.startswith(p)), None)
        if prefix is None:
            return old_spec
        new_spec = prefix + new_target.relative_to(src).as_posix()

    # Keep extensionless imports extensionless, preserving original index-directory shorthand.
    if not Path(old_spec).suffix:
        if old_target.name.startswith("index.") and Path(old_spec).name != "index":
            if old_spec.startswith(("./", "../")):
                new_spec = os.path.relpath(new_target.parent, new_importer.parent).replace(os.sep, "/")
                if not new_spec.startswith("."):
                    new_spec = "./" + new_spec
            else:
                prefix = next(p for p in ("@/", "~/", "/src/") if old_spec.startswith(p))
                new_spec = prefix + new_target.parent.relative_to(src).as_posix()
        elif new_target.suffix in MODULE_EXTS:
            new_spec = new_spec[:-len(new_target.suffix)]
    elif Path(old_spec).suffix in (".js", ".mjs", ".cjs") and old_target.suffix in (".ts", ".tsx"):
        new_spec = new_spec.rsplit(".", 1)[0] + Path(old_spec).suffix
    return new_spec


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="Preview without changes")
    mode.add_argument("--apply", action="store_true", help="Apply file moves and import updates")
    parser.add_argument("--root", type=Path, default=Path.cwd(), help="Monorepo root (default: current directory)")
    args = parser.parse_args()
    root = args.root.resolve()
    src = root / "apps/admin/src"
    features = src / "features"
    if not (root / ".git").exists() or not features.is_dir():
        sys.exit("ERROR: Run from bastak-school repository root, or provide --root.")

    try:
        clean = not git(root, "status", "--porcelain", "--untracked-files=all", capture=True).strip()
    except (FileNotFoundError, subprocess.CalledProcessError) as exc:
        sys.exit(f"ERROR: Git is required: {exc}")
    if args.apply and not clean:
        sys.exit("ERROR: Git working tree is not clean. Commit/stash ALL changes first.")

    renames: dict[Path, Path] = {}
    for domain, names in DOMAINS.items():
        for name in names:
            old, new = features / name, features / domain / name
            if old.is_dir():
                if new.exists():
                    sys.exit(f"ERROR: Destination already exists: {new.relative_to(root)}")
                renames[old.resolve()] = new.resolve()
    if not renames:
        print("Nothing to move. Migration may already be complete.")
        return

    # Snapshot all known importer files before moving, so we resolve imports against OLD paths.
    code_files = []
    for base in (root / "apps", root / "packages"):
        if base.exists():
            code_files += [p.resolve() for p in base.rglob("*") if p.is_file() and p.suffix in SCAN_EXTS
                           and not set(p.relative_to(root).parts).intersection(IGNORE)]

    edits: dict[Path, str] = {}
    changes = 0
    for file in code_files:
        new_file = destination_for(file, features, renames)
        data = file.read_text(encoding="utf-8")

        def rewrite(m: re.Match[str]) -> str:
            nonlocal changes
            spec = m.group("spec")
            base = source_path(spec, file, src)
            if base is None:
                return m.group(0)
            old_target = module_resolve(base)
            if old_target is None:
                return m.group(0)
            new_target = destination_for(old_target, features, renames)
            if new_target == old_target and new_file == file:
                return m.group(0)
            updated = make_spec(spec, file, new_file, old_target, new_target, src)
            if updated != spec:
                changes += 1
                return m.group("head") + updated + m.group("tail")
            return m.group(0)

        revised = SPEC_RE.sub(rewrite, data)
        if revised != data:
            edits[new_file] = revised

    print(f"Feature directories to move: {len(renames)}")
    print(f"Files requiring import updates: {len(edits)}")
    print(f"Import references rewritten: {changes}")
    for old, new in renames.items():
        print(f"  {old.relative_to(root)} -> {new.relative_to(root)}")
    if args.dry_run:
        print("\nDRY RUN ONLY. Apply with: python3 reorganize-features.py --apply")
        return

    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = f"backup/features-before-domains-{stamp}"
    git(root, "branch", backup)
    print(f"Created backup branch: {backup}")
    for old, new in renames.items():
        new.parent.mkdir(parents=True, exist_ok=True)
        git(root, "mv", str(old), str(new))
    for file, content in edits.items():
        file.write_text(content, encoding="utf-8")
    print("\nDone moving folders and rewriting common static import paths.")
    print("IMPORTANT: Examine any remaining references in aliases, docs, tests, and string paths.")
    print("Suggested checks:")
    print("  git status --short")
    print("  git diff --check")
    print("  git diff --stat HEAD")
    print("  npm run build --workspace=apps/admin   # adjust if your workspace name differs")
    print("Do not commit until TypeScript, tests and build pass.")


if __name__ == "__main__":
    main()
