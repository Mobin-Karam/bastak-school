---
description: Update Bastak School product identity consistently without changing contracts, authorization, or CMB boundaries.
---
Update the visible Bastak School product and deployment identity. Start with `AGENTS.md`, Graphify, and the existing `apps/admin/brand.config.json`; treat that file as the presentation source of truth. Trace every affected Admin/Student surface, PWA metadata, public asset, README, Docker/Compose/Coolify label, and deployment document before editing.

Preserve `/api/v2`, authentication, authorization, organization scope, CMB boundaries, package scopes, cookies, cache keys, SQLite paths/volumes, and other compatibility identifiers unless a separately approved migration changes them. Keep Persian/RTL and English/LTR copy accessible, responsive, and free of duplicated hard-coded brand strings. Update focused tests or checks, run relevant builds, and report source, browser/device, live-provider, and deployment evidence separately.
