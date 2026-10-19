# Bastak School and Deployline: conversation handover

Recorded on 13 October 2026, Asia/Tehran. This document consolidates the work, decisions, operational commands, evidence and unresolved requirements discussed in this conversation. It is a handover, not a verbatim transcript. Passwords, operator keys, session cookies, tokens, private keys and personal records are deliberately excluded.

## Current verified state

The final read-only verification performed while writing this document found:

| Item | Observed state |
| --- | --- |
| Server LAN address | `192.168.0.100`, interface `enp0s25` |
| Router | `192.168.0.1`; router remains DHCP authority |
| Original router DHCP pool | `.100` through `.200`, 24-hour lease; not reverified at final documentation time |
| Local DNS | dnsmasq, with monitored `/var/lib/bastak-local-dns` hosts directory |
| Current school hostname | `v1.app.bastak` |
| Retained local alias | `app.bastak` |
| Hosts record | `192.168.0.100 app.bastak v1.app.bastak` |
| School | `https://v1.app.bastak/` |
| Secure Deployline | `https://v1.app.bastak:8788/` |
| Deployline alias | `https://app.bastak:8788/` |
| Deployline service | `deployline.service`, systemd user service, active |
| DNS integration | Deployline reports `dns_ready: true` |
| Last hostname activation | 13 October 2026, 11:40:23 Asia/Tehran, according to Deployline |
| Running application revision | `d3dd958c7b15e384a7c60109b71931fe60357eee` on both API and Admin images |
| Application health | Both containers healthy; HTTPS `/ready` returns database and modules ready |
| Public access | Not configured as part of this local-network work |
| Purchased domain | User reported purchase of `bareztech.ir`; DNS query found Cloudflare nameservers |

The latest revision above is a later live observation. It must not be confused with the earlier release deployed and verified in this conversation, `8b3b770403b3a1803bfc5bb7e6496dd310210350`. This conversation does not establish the provenance or complete test evidence of every later revision.

## Scope and instructions

The user requested architecture, database, platform, security and reliability reviews; safe improvements; documentation; and production deployment retaining old images for rollback. Initial architecture discovery was to precede application edits. Later database/security/reliability requests authorized implementation. Production deployment was subsequently explicitly authorized.

Important continuing requirements:

- Preserve production records, SQLite storage and old images.
- Never reset, seed, delete production data or automatically restore an older database over newer writes.
- Verify restored backups before potentially destructive changes.
- Distinguish confirmed defects, measured observations and potential issues.
- Do not claim speedups without comparable before/after measurements.
- Keep deployment access private; do not expose Docker or the database.
- Follow repository branches, CI checks, release checks and environment protection.
- Never disclose credentials in logs, documentation or chat.

The repository is a grouped product monorepo with a modular-monolith backend and CMB reusable packages. The real inspected deployment uses API and Admin; the earlier `apps/student` path was absent. Root workspace orchestration and leaf locks remain authoritative. Graphify was unavailable during the relevant discovery; source inspection was the fallback. Repository operating instructions take precedence over guesses about the supplied stack.

## Architecture, persistence, security and reliability work

The detailed audits remain in the canonical documentation rather than being duplicated here:

- [Current architecture](../../architecture/current-state.md), [target architecture](../../architecture/target-state.md), [refactor plan](../../architecture/refactor-plan.md).
- [Application security audit](../../security/application-security-audit.md), [role/resource matrix](../../security/permission-matrix.md), [permission baseline](../../security/permission-baseline.json).
- [Reliability runbook](../../operations/reliability-runbook.md), [synthetic baseline](../../operations/reliability-baseline.json).
- [GitHub deployment operations](../../operations/github-cicd.md), [immutable LAN runbook](../../operations/immutable-lan-runbook.md), [database rollout](../../operations/database-multi-role-integrity-rollout.md).

The conversation records these completed changes and checks:

| Area | Change or evidence |
| --- | --- |
| Architecture | Current/target/refactor documents; compatibility-preserving modular-monolith direction |
| Database | Versioned uniqueness/index migration; disposable integration coverage; backup restoration and migration rehearsal |
| Credential handling | Password hashes excluded from normal entity selection; explicit credential selection confined to authentication/password workflows; allowlisted phone-change projections |
| Object-level access | Guardian, student-administration, dashboard and chat queries use existing backend student/organization policy |
| Session races | Refresh-token rotation uses compare-and-swap so concurrent requests cannot both succeed |
| Logout | Matching session logout requires CSRF, including refresh-only sessions |
| Missing identity | Current-user decorator rejects missing identity with 401 |
| Logging | Safe structured HTTP completion records, correlation IDs and error-envelope correlation; database logger omits SQL and parameters |
| Readiness | Safe module/database readiness; HTTPS checks through Nginx |
| Deployment | Commit-tagged immutable images, production lock, retained-image receipts, stopped-writer verified backups, migration rehearsal and image identity checks |
| Regression coverage | Real SQLite/Fastify security integration tests, logging privacy tests, deployment safety tests |
| Performance | Opt-in isolated workload baseline and host collector; no aggressive production load tests |

Reported validation for that earlier release: full workspace verification passed; 421 API tests, 512 Admin tests, six Admin accessibility tests and ten Student core tests passed; 22 deployment/recovery Python tests passed; three network smoke suites covering security, student and onboarding flows passed. Three opt-in performance tests were skipped in the normal API test run and run separately for the baseline. These counts are historical release evidence, not a claim that all commands were rerun while creating this document.

### Measured performance and limits

The isolated API benchmark used Fastify injection, concurrency four, five warmups and forty measured requests per workload. Its fixture contained 1,000 student rows with organization scope, only thirty class enrollments and limited related academic/user data. It is not a production capacity estimate.

| Workload | p50 | p95 | p99 | Statements/request |
| --- | ---: | ---: | ---: | ---: |
| Student listing | 427.40 ms | 526.84 ms | 526.85 ms | 9 |
| Dashboard | 55.94 ms | 70.93 ms | 70.93 ms | 30 |
| Attendance | 313.61 ms | 362.67 ms | 375.73 ms | 174 |

No comparable optimization-before baseline exists for these values; no speedup is claimed. The dashboard fixture had limited academic history. Benchmark-process RSS is not production-container RAM. Production host snapshots and a small read-only HTTPS smoke were collected; warmup, process ages and workloads differed, so snapshot differences do not establish improvements.

### Remaining audit findings

- Existing SSE controller/hub lacks per-event session revalidation. Source-level absence is confirmed; logout/expiry on an existing production stream was not reproduced. Add an isolated regression before claiming a demonstrated exploit and implementing fail-closed revalidation.
- The legacy local CA is rejected by Python 3.13 strict verification because it lacks required extensions. Curl checks using the trusted CA succeeded. This is a verified interoperability issue; do not disable verification or silently replace the trust root. Coordinate CA and client trust replacement.
- Remaining authorization/validation/account-recovery/audit-history and dependency concerns are detailed in the security audit; dormant code and hypothetical risks must not be described as live vulnerabilities without evidence.
- The staged CI image-artifact deployment template was not activated during the earlier verified release. The installed private runner built commit-tagged images on the server. Do not call that an active exact-CI-artifact pipeline.

## Production release and rollback history

The earlier release followed PR #52 into develop and release PR #46 into main. Main commit `8b3b770403b3a1803bfc5bb7e6496dd310210350` passed [main CI run 38341727916](https://github.com/Mobin-Karam/bastak-school/actions/runs/38341727916) and [private deployment run 38342518106](https://github.com/Mobin-Karam/bastak-school-deploy/actions/runs/38342518106).

Direct host verification checked running image IDs/revision labels, the retained named volume, Nginx configuration, TLS readiness, SQLite integrity, foreign-key integrity and the applied migration. The verified backup contained 110 tables and 1,413 rows. Authenticated production business workflows were not exercised; CI/disposable smoke covered them.

Historical rollback evidence:

- Initial retained tags: `bastak-school/backend-v2:rollback-20261013T023132Z` and matching Admin tag.
- Automatic retained receipt: `/home/bastak-server/.config/bastak-production/releases/rollback-20261013T033659Z/images.json` and adjacent `compose.rollback.yml`.
- Earlier production revision retained: `3eca070b510767ffc04c9bdf8a05c88991218a6f`.
- Persistent database volume: `bastak-school_moshaver_v2_sqlite`.
- Local detailed verification artifact: original checkout `.run/reliability/release-report.md` and JSON.

These are historical locations, not an assertion that an old receipt remains the most recent rollback candidate. Deployline selects from current verified receipts. Never prune retained images, run `down --volumes`, or restore a database automatically merely to change application images. Review migration compatibility and writes since the backup first. Follow the canonical rollback runbooks.

## Domain and local DNS decisions

The conversation first considered `school.bareztech.ir` or `app.bareztech.ir`. The user explicitly chose **`app.bastak`** instead. Subsequent live observation shows **`v1.app.bastak`** active with the original alias retained.

`.bastak` is a private local naming choice, not a registered public hostname. Use it on this LAN with local DNS and a trusted local CA. For future internet access, use a hostname under the purchased domain and configure public DNS, certificates, routing and firewall deliberately. Do not assume this local Apply button registers public domains or manages an ISP-assigned IP.

The network path is:

```text
LAN device → DHCP-provided DNS server → dnsmasq local host record
           → school HTTPS on port 443
           → Nginx → private API

Operator → trusted HTTPS Deployline on port 8788
         → operator session + CSRF + origin validation
         → guarded hostname activation
```

Router administrative access was authorized by the user. Credentials are excluded from this document. The earlier DNS update saved a backup before setting the router to advertise `192.168.0.100` as DNS. Backup location:

`/home/bastak-server/.config/bastak-production/network/router-dns-before-20261013T072259Z.json`

The router's own resolver at `.1` did not demonstrate local-name resolution after this setting change. Client-device DHCP receipt was not directly verified. Reconnect clients to renew settings; inspect the actual DNS server they receive.

### Critical DHCP limitation

Automatic A-record changes do **not** update the DNS-server address already configured on clients. If the server moves from `.100` to `.101` while clients still send DNS to `.100`, local-name resolution breaks before they can discover the new record.

The installed watcher refreshes host records and the dashboard listeners accept approved LAN hosts across IP changes. That solves record/listener staleness, not resolver reachability. To complete seamless access, either:

1. Reserve a stable server/DNS IP in the router; or
2. Use a separate stable resolver/router with DHCP/DNS integration that tracks the school's lease.

An untested automatic router update is not implemented. Do not give the server a static address within an active DHCP pool without reserving/excluding it. Do not change server networking remotely without a recovery route. Browser Secure DNS or manually configured external DNS can bypass local DNS.

## Deployline location and controls

Deployline is a separate local project, outside the Bastak School application repository:

| Resource | Path |
| --- | --- |
| Source | `/home/bastak-server/sites/deployline` |
| Service | `/home/bastak-server/.config/systemd/user/deployline.service` |
| Production configuration | `/home/bastak-server/.config/bastak-production` |
| TLS files | Production configuration `tls/` directory |
| Operator credential | `/home/bastak-server/.config/deployline/operator-key` |
| Hostname state | `/home/bastak-server/.config/deployline/local-network.json` |
| DNS host records | `/var/lib/bastak-local-dns/hosts` |
| dnsmasq configuration | `/etc/dnsmasq.d/bastak-school.conf` |
| DNS integration installer | Deployline `scripts/install-local-dns.sh` |
| Hostname backend | Deployline `local_network.py` |
| UI | Deployline `src/components/NetworkSettings.tsx`, exposed through `LocalNetwork.tsx` |
| Tests | Deployline `test_server.py`, `test_local_network.py` |

Deployline's HTTP port 8787 is a read-only monitor. HTTPS port 8788 permits protected operations. Both listen on host interfaces, but request checks require approved hosts and LAN/loopback clients. Keep firewall/router access private; do not forward these dashboard ports to the internet. Client-IP filtering alone is not a replacement for network firewall rules.

The operator key is a dashboard-specific credential, separate from sudo and router credentials. Read it locally only:

```bash
cat ~/.config/deployline/operator-key
```

Paste it into the trusted HTTPS dashboard's Unlock field, not into chat, documentation, logs or screenshots. Its file mode was verified as `0600`. Sessions are Secure/HttpOnly/SameSite, tied to a client address, expire after thirty minutes and require CSRF for mutations. Five failed logins within five minutes temporarily limit that client. Restarting the dashboard invalidates its in-memory sessions.

### One-button hostname flow

1. Open the secure dashboard and select **Local address**.
2. Unlock using the operator key.
3. Enter a hostname ending in `.bastak` with no scheme, path or port.
4. Select **Apply hostname**.
5. Read its success/error result, then open the new school URL and sign in there.

The backend validates the name and DNS integration, acquires the shared production lock, verifies the running deployment/checkout/image/volume relationship and saves previous configuration. It extends the certificate using the existing CA, updates allowed origins, validates Nginx, briefly recreates the API with its existing image and no build/pull, checks HTTPS readiness and image identity, publishes DNS, saves state and refreshes the dashboard TLS context. Existing names remain aliases, with a maximum of sixteen.

On activation failure, it attempts configuration and same-image recovery and returns a safe error. If recovery also fails, inspect production health; do not assume rollback succeeded. This path does not restore the database. The underlying API startup still follows its existing migration behavior; hostname activation is not a new migration deployment.

DNS records are refreshed every five seconds when the approved interface/state changes. dnsmasq monitors `hostsdir` for updates; its cache and clients' caches may affect how quickly users observe a change. Hostname certificates remain usable across IP changes, subject to the resolver-reachability limitation above.

## Installation history and corrected installer

The first dnsmasq installation and initial configuration were completed interactively by the user because agent sudo commands required a password. Passwords should be entered in the server terminal, never chat.

The first automatic-hosts installer failed with `install: invalid group 'dnsmasq'`. Inspection established that Debian provided a `dnsmasq` user without a same-named group. The installer was corrected to use directory ownership `dnsmasq`, the actual primary group of `bastak-server`, and mode `2770`. Final observation found owner/group `dnsmasq:bastak-server`, the new dnsmasq configuration and `dns_ready: true`, confirming that the integration is now installed.

For installation/reinstallation, inspect the script and existing state first. The current installer initially writes `app.bastak`; reinstallation is not necessary for normal hostname changes and may temporarily replace current aliases until the watcher republishes them.

```bash
sudo bash /home/bastak-server/sites/deployline/scripts/install-local-dns.sh
```

The installer backs up DNS configuration to `/var/backups/bastak-dns-<UTC timestamp>`, configures LAN/loopback dynamic binding and local `.bastak` resolution, uses upstream resolvers `1.1.1.1` and `8.8.8.8`, validates configuration and restarts dnsmasq. On validation/restart failure it restores the prior DNS configuration. It does not install a DHCP server. Do not forward port 53 publicly.

## Dashboard UI and validation

The local Sites workflow was used for this existing server-hosted dashboard; no public Sites hosting deployment was requested. Changes included hostname controls, clearer release/health/evidence wording, larger scalable typography, desktop scrolling instead of compressed fixed-height layouts, large-display spacing, responsive mobile controls, animated entrances/glow/interaction feedback and reduced-motion handling. Existing Radix dialogs provide modal focus/keyboard behavior. Empty job evidence no longer claims an unverified checkpoint is verified.

Final candidate validation during the dashboard work:

- TypeScript and production Vite build passed.
- Twenty-one Python tests passed, including hostname validation, changed-IP detection, atomic host-file output, unavailable integration, successful activation, failed-readiness recovery and HTTP/origin/Host/client access rejection.
- Unauthenticated live hostname Apply returned 403.
- Dashboard HTTPS health and school HTTPS readiness passed.
- Browser visual verification could not run: browser downloads returned regional 403 errors. Do not describe screenshots, pixel checks or browser-based accessibility tests as completed.

A duplicate handler/import and empty component conflict was observed while editing. The user confirmed no other session was running. The duplicate changes were reconciled. An import error introduced during development was corrected; the service was restored and tests/build passed. Original source backup is under `/home/bastak-server/.config/deployline/backups/dashboard-before-network-ui.tar.gz`.

## Routine commands and troubleshooting

```bash
# DNS from the configured LAN resolver
ip -4 -brief address show enp0s25
dig @192.168.0.100 app.bastak A +short
dig @192.168.0.100 v1.app.bastak A +short
dig @192.168.0.100 example.com A +short
systemctl is-active dnsmasq

# Validate/restart DNS only when configuration was changed
sudo dnsmasq --test
sudo systemctl restart dnsmasq

# Dashboard build and regression checks
cd /home/bastak-server/sites/deployline
export PATH=/home/bastak-server/.nvm/versions/node/v22.23.3/bin:$PATH
npm run build
python3 -m unittest -q test_server.py test_local_network.py
systemctl --user restart deployline.service
systemctl --user status deployline.service

# Verify TLS and readiness without relying on client DNS
curl --fail --resolve v1.app.bastak:443:192.168.0.100 \
  --cacert ~/.config/bastak-production/tls/ca.crt \
  https://v1.app.bastak/ready
curl --fail --resolve v1.app.bastak:8788:192.168.0.100 \
  --cacert ~/.config/bastak-production/tls/ca.crt \
  https://v1.app.bastak:8788/health
```

Use the current interface address in these commands if it changes. `--resolve` bypasses DNS for the test while still verifying the hostname and trusted CA; it does not prove DNS distribution to other devices. Never use `-k` as evidence of valid TLS.

| Symptom | Check |
| --- | --- |
| Name does not resolve | Client DNS address, renewed DHCP settings, Secure DNS bypass, actual hosts file, dnsmasq health |
| DNS returns old IP | Interface address, watcher status, client/cache state; verify resolver reachability first |
| Certificate warning | Device trust of local CA, certificate hostname and previously identified strict-CA compatibility issue |
| Apply disabled | HTTPS port 8788, authenticated operator session, valid `.bastak` name and `dns_ready` |
| Apply returns 403 | Session expiry/client change, CSRF, exact request origin and Host; unlock again |
| Apply returns conflict | Production lock, approved environment copies, checkout/release/image identity or missing DNS integration |
| Dashboard unavailable | systemd user service and restricted local journal; do not publish raw logs containing credentials |
| Recovery failed | Inspect API/Admin health and saved configuration; stop and assess before destructive actions |

## Future public-domain setup

The user owns/reported buying `bareztech.ir`, but chose local `.bastak` names for now. Public-domain rollout remains separate work:

1. Confirm domain ownership/DNS access and choose `app.bareztech.ir` or another registered hostname.
2. Obtain a trusted certificate, using DNS validation if the server remains private.
3. Configure local split DNS for internal users and application/Nginx hostname compatibility.
4. Once an ISP static public IP is assigned, configure public DNS and router HTTPS forwarding/firewall deliberately.
5. Test from outside the LAN; preserve private Tailscale deployment/SSH access and keep Docker/database/dashboard ports unexposed.

Domain purchase alone neither assigns an IP nor configures DNS or router forwarding. Router topology, ISP assignment and CGNAT conditions must be verified at that time. The current hostname input intentionally supports local `.bastak` names only.

## Remaining priorities

1. Stabilize resolver reachability: reserve an address or design tested router DHCP/DNS integration. Seamless arbitrary DHCP changes are not complete.
2. Verify real client DHCP DNS distribution, hostname browsing and local-CA trust on representative devices.
3. Complete browser-based visual/accessibility checks when a browser is available.
4. Coordinate a modern CA/client trust rollout rather than weakening strict TLS validation.
5. Add isolated SSE session-revocation regression and remediate based on evidence.
6. Keep off-host verified backups and periodically rehearse incident recovery.
7. Review the staged immutable-artifact pipeline independently before activation; follow protected release lifecycle.
8. Reconcile documentation whenever hostnames, revisions, router settings or deployment paths change; this dated document must not be treated as live state indefinitely.
