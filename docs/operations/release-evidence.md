# Release evidence checklist

Last reviewed: 2026-09-28

Release evidence is layered. A passing source, API, or browser check must not be
reported as proof of a different layer.

| Layer | Required evidence | Current local evidence | Still requires target environment |
| --- | --- | --- | --- |
| API authorization | Disposable database, authenticated role journeys and negative authorization cases | Security matrix, Student journey and onboarding journey E2E pass on disposable SQLite | Production configuration and monitoring |
| Admin browser | Login and role/context transitions, representative create/update flows, destructive-action confirmation | Playwright: eight seeded Admin roles reach the protected shell, a Student-only account is rejected, and the platform owner confirms archive then restore for a seeded Student through a local Vite proxy and disposable API | Target-browser journeys including representative mutations |
| Student browser | Login, Today, task/focus, exam, chat, offline state and RTL/mobile viewport | Authenticated Student login and app-shell render pass in Chromium at a 390px mobile viewport against disposable API | Today/task/focus, exam, chat, offline/reconnect and target-browser coverage |
| Push | Browser subscription, provider delivery, click behavior and unsubscribe | Endpoint/source coverage only | HTTPS browser plus configured VAPID/provider delivery |
| Native | Signed artifact install, login, storage, offline/restart, notification/device behavior | Web build only | Android/desktop target-device runs |
| Restore and rollback | Disposable restore, integrity check, service restart, login and core workflow after restore; observed rollback | Local disposable backup, mutation, restore, integrity check and authenticated read pass | Disposable deployed restore, restart, core workflow and monitored rollback window |

## Local authenticated API run

Use an explicitly disposable database and non-production settings. Do not point
these commands at the normal local database or a deployment.

```bash
cd apps/api
DATABASE_PATH=/tmp/moshaver-release-evidence.sqlite NODE_ENV=test \
  ALLOW_E2E_SEED=true COOKIE_SECURE=0 node dist/database/seeds/security-matrix.js
DATABASE_PATH=/tmp/moshaver-release-evidence.sqlite NODE_ENV=test \
  COOKIE_SECURE=0 PORT=4010 node dist/main.js
E2E_API_URL=http://127.0.0.1:4010/api/v2 npm run test:e2e:security
E2E_API_URL=http://127.0.0.1:4010/api/v2 npm run test:e2e:student
E2E_API_URL=http://127.0.0.1:4010/api/v2 npm run test:e2e:onboarding
```

This validates API behavior, not browser rendering, provider delivery, device
behavior, production cookies, deployment configuration, or rollback operations.

## Local Admin browser role run

Run this only after seeding an isolated database and serving the API on the
Admin development proxy's local port. The seed must include a platform owner;
the security-matrix fixture supplies one.

```bash
cd apps/api
DATABASE_PATH=/tmp/moshaver-admin-browser-evidence.sqlite NODE_ENV=development \
  ALLOW_E2E_SEED=true npm run seed:roles
DATABASE_PATH=/tmp/moshaver-admin-browser-evidence.sqlite NODE_ENV=development \
  PORT=4000 npm run start

# Separate terminal
cd apps/admin
npm run dev
ADMIN_V2_E2E_BASE_URL=http://127.0.0.1:8081 npm run test:e2e
```

On 2026-09-28 this ran locally with all ten assertions passing: eight
authorized Admin-role logins reached the protected shell, the Student-only
account remained at the login screen with the rejection message, and the
platform owner archived then restored the seeded Student at a mobile viewport.
This is browser evidence for the seeded local stack, not target deployment,
Push, native-device, restore, or rollback evidence.

## Local disposable restore rehearsal

On 2026-09-28, an isolated SQLite stack was started with remote restore enabled
only for the test process. An authenticated platform owner downloaded a backup,
created an App-version mutation, restored the backup, then confirmed `PRAGMA
quick_check` health through the authenticated database endpoint and confirmed
the mutation was absent. The post-restore session was still able to make an
authenticated read. The database file and backup were both under `/tmp`.

This proves local replacement and automatic in-process recovery. It does not
prove a deployed supervisor restart, target storage behavior, the core user
workflow after a deployment restore, or a monitored production rollback.

## Target-environment release sign-off

1. Use a disposable deployment and test accounts only.
2. Run each Admin role through login, context switch, allowed action and denied
   action; capture failures with role, organization and route.
3. Run the Student journey at phone and desktop widths, including a refresh while
   signed in and an offline/reconnect transition.
4. Test one real HTTPS Push subscription, delivery, click destination and
   unsubscribe operation.
5. Restore a known disposable backup, verify integrity/restart/login/core flow,
   then perform and observe a rollback. Never run restore tests against a live
   production database without an approved maintenance procedure.
6. Install the release candidate on each supported native target and record
   device/OS, artifact version and outcome.
