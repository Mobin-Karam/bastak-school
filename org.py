#!/usr/bin/env python3

from pathlib import Path
from datetime import datetime
import subprocess
import os
import re
import sys

ROOT = Path.cwd().resolve()
SRC = ROOT / "apps/admin/src"
APP = SRC / "app"
LAYOUT = APP / "layout"

def run(*args):
    subprocess.run(args, cwd=ROOT, check=True)

def fail(message):
    print(f"ERROR: {message}")
    sys.exit(1)

if not (ROOT / ".git").exists():
    fail("Run this script from your bastak-school repository root.")

if not LAYOUT.is_dir():
    fail("apps/admin/src/app/layout does not exist.")

status = subprocess.run(
    ["git", "status", "--porcelain"],
    cwd=ROOT,
    capture_output=True,
    text=True,
    check=True,
)

if status.stdout.strip():
    fail("Working tree is not clean. Commit or stash changes first.")

# ------------------------------------------------
# 1. Backup branch
# ------------------------------------------------

branch = "backup/app-layout-" + datetime.now().strftime(
    "%Y%m%d-%H%M%S"
)

run("git", "branch", branch)

print(f"Backup branch created: {branch}")

# ------------------------------------------------
# 2. Desired file locations
# ------------------------------------------------

moves = {
    # Device shells
    "shell/MobileShell.tsx":
        "shells/mobile/MobileShell.tsx",

    "shell/TabletShell.tsx":
        "shells/tablet/TabletShell.tsx",

    "shell/DesktopShell.tsx":
        "shells/desktop/DesktopShell.tsx",

    # Core shell
    "shell/AdminLayout.tsx":
        "shells/AdminLayout.tsx",

    "shell/AdminShellChrome.tsx":
        "shells/AdminShellChrome.tsx",

    "shell/index.ts":
        "shells/index.ts",

    # Shared layout components
    "shell/AdminHeader.tsx":
        "components/AdminHeader.tsx",

    "shell/AdminAccountMenu.tsx":
        "components/AdminAccountMenu.tsx",

    "shell/SharedPageViewport.tsx":
        "components/SharedPageViewport.tsx",

    # Hooks
    "shell/use-admin-shell-model.ts":
        "hooks/use-admin-shell-model.ts",

    "shell/use-device-performance.ts":
        "hooks/use-device-performance.ts",

    # Utilities
    "shell/device-performance.ts":
        "lib/device-performance.ts",

    "shell/layout-geometry.ts":
        "lib/layout-geometry.ts",

    "shell/viewport-height.ts":
        "lib/viewport-height.ts",

    "shell/viewport-shell.ts":
        "lib/viewport-shell.ts",

    "layout-storage.ts":
        "lib/layout-storage.ts",

    # Types
    "shell/layout-types.ts":
        "model/layout-types.ts",

    # Mobile navigation
    "navigation/AdminMobileNavigation.tsx":
        "navigation/mobile/AdminMobileNavigation.tsx",

    # Desktop navigation
    "navigation/AdminMainSidebar.tsx":
        "navigation/desktop/AdminMainSidebar.tsx",

    "navigation/AdminContextSidebar.tsx":
        "navigation/desktop/AdminContextSidebar.tsx",

    # Navigation configuration
    "navigation/admin-navigation.ts":
        "navigation/config/admin-navigation.ts",
}

# ------------------------------------------------
# 3. Move tests together with their source files
# ------------------------------------------------

for old, new in list(moves.items()):
    old_path = Path(old)
    new_path = Path(new)

    for extension in (".test.ts", ".test.tsx"):
        old_test = old_path.with_suffix("").as_posix() + extension
        new_test = new_path.with_suffix("").as_posix() + extension

        if (LAYOUT / old_test).is_file():
            moves[old_test] = new_test

# Explicit shell-level integration tests
shell_tests = [
    "AdminShellChrome.test.tsx",
    "viewport-shell.test.ts",
    "device-performance.test.ts",
    "layout-geometry.test.ts",
    "viewport-height.test.ts",
]

for name in shell_tests:
    old = "shell/" + name

    if old in moves or not (LAYOUT / old).is_file():
        continue

    if name.startswith("AdminShellChrome"):
        new = "shells/" + name
    else:
        new = "lib/" + name

    moves[old] = new

# Remaining files in the old shell folder
shell_directory = LAYOUT / "shell"

if shell_directory.is_dir():
    for file in shell_directory.iterdir():
        if not file.is_file():
            continue

        relative = file.relative_to(LAYOUT).as_posix()

        if relative not in moves:
            moves[relative] = "shells/" + file.name

# Remaining navigation tests/config helpers stay together
# unless explicitly mapped above.

# ------------------------------------------------
# 4. Validate paths
# ------------------------------------------------

actual_moves = {}

for old, new in moves.items():
    source = (LAYOUT / old).resolve()
    destination = (LAYOUT / new).resolve()

    if not source.is_file():
        print(f"SKIP missing: {old}")
        continue

    if destination.exists() and source != destination:
        fail(f"Destination already exists: {new}")

    actual_moves[source] = destination

if not actual_moves:
    fail("No files to move.")

if len(set(actual_moves.values())) != len(actual_moves):
    fail("Two source files target the same destination.")

# ------------------------------------------------
# 5. Collect source files
# ------------------------------------------------

source_files = []

for base in (ROOT / "apps", ROOT / "packages"):
    if not base.exists():
        continue

    for file in base.rglob("*"):
        if not file.is_file():
            continue

        if file.suffix not in (".ts", ".tsx", ".js", ".jsx"):
            continue

        if any(part in {
            "node_modules",
            "dist",
            "build",
            "coverage",
            ".git",
        } for part in file.parts):
            continue

        source_files.append(file.resolve())

# ------------------------------------------------
# 6. Resolve previous relative module paths
# ------------------------------------------------

def resolve_module(base):
    candidates = [
        base,
        Path(str(base) + ".ts"),
        Path(str(base) + ".tsx"),
        Path(str(base) + ".js"),
        Path(str(base) + ".jsx"),
        base / "index.ts",
        base / "index.tsx",
        base / "index.js",
        base / "index.jsx",
    ]

    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve()

    return None

def relative_import(source_file, target, original):
    relative = os.path.relpath(
        target,
        source_file.parent
    ).replace(os.sep, "/")

    if not relative.startswith("."):
        relative = "./" + relative

    # Preserve extensionless imports
    if not Path(original).suffix:
        if target.name.startswith("index."):
            relative = os.path.relpath(
                target.parent,
                source_file.parent
            ).replace(os.sep, "/")

            if not relative.startswith("."):
                relative = "./" + relative

        elif target.suffix in (".ts", ".tsx", ".js", ".jsx"):
            relative = relative[: -len(target.suffix)]

    return relative

# Matches common JS/TS module import forms.
pattern = re.compile(
    r"""(?P<prefix>
        \bfrom\s*['"]
        |\bimport\s*\(\s*['"]
        |\bimport\s*['"]
        |\brequire\s*\(\s*['"]
        |\bvi\.mock\s*\(\s*['"]
        |\bvi\.doMock\s*\(\s*['"]
        |\bvi\.importActual\s*\(\s*['"]
        |\bjest\.mock\s*\(\s*['"]
        )(?P<path>\.{1,2}/[^'"]+)(?P<quote>['"])
    """,
    re.VERBOSE,
)

rewritten_files = {}

for file in source_files:
    old_file = file
    new_file = actual_moves.get(old_file, old_file)

    content = file.read_text(encoding="utf-8")

    def rewrite(match):
        original = match.group("path")

        old_target = resolve_module(
            (old_file.parent / original).resolve()
        )

        if old_target is None:
            return match.group(0)

        new_target = actual_moves.get(
            old_target,
            old_target
        )

        # Import needs rewriting when either
        # source or destination has moved.
        if new_file == old_file and new_target == old_target:
            return match.group(0)

        rewritten = relative_import(
            new_file,
            new_target,
            original,
        )

        return (
            match.group("prefix")
            + rewritten
            + match.group("quote")
        )

    updated = pattern.sub(rewrite, content)

    if updated != content:
        rewritten_files[new_file] = updated

# ------------------------------------------------
# 7. Move files using git mv
# ------------------------------------------------

for source, destination in actual_moves.items():
    destination.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    run(
        "git",
        "mv",
        str(source),
        str(destination)
    )

    print(
        "MOVED:",
        source.relative_to(ROOT),
        "->",
        destination.relative_to(ROOT)
    )

# ------------------------------------------------
# 8. Update imports
# ------------------------------------------------

for file, content in rewritten_files.items():
    file.write_text(
        content,
        encoding="utf-8"
    )

# ------------------------------------------------
# 9. Preserve old directory entry points
# ------------------------------------------------

# Some modules may still import using aliases such as
# @/app/layout/shell or import directories directly.
# Compatibility exports preserve those entry points
# during the transition.

old_shell = LAYOUT / "shell"
new_shell = LAYOUT / "shells"

if not old_shell.exists():
    old_shell.mkdir(parents=True, exist_ok=True)

compatibility = old_shell / "index.ts"

if not compatibility.exists():
    compatibility.write_text(
        'export * from "../shells";\n',
        encoding="utf-8"
    )

# ------------------------------------------------
# 10. Delete empty directories
# ------------------------------------------------

for directory in sorted(
    LAYOUT.rglob("*"),
    key=lambda p: len(p.parts),
    reverse=True,
):
    if directory.is_dir() and not any(directory.iterdir()):
        directory.rmdir()

# ------------------------------------------------
# 11. Summary
# ------------------------------------------------

print()
print("=" * 60)
print("APP LAYOUT REORGANIZATION COMPLETE")
print("=" * 60)

print(f"Files moved: {len(actual_moves)}")
print(f"Files with rewritten imports: {len(rewritten_files)}")
print(f"Backup branch: {branch}")

print()
print("Review:")
print("  git status --short")
print("  git diff --stat HEAD")
print()
print("Next: run your admin TypeScript checks, tests and build.")
print()
print("Note: verify path aliases, string-based imports and")
print("barrel exports manually if your project uses them.")
