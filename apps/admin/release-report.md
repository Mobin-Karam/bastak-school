# Admin v2 release report

Generated: 2026-10-08T09:49:00.838Z

Branch: local checkout

| Gate | Result | Evidence or boundary |
| --- | --- | --- |
| TypeScript | FAIL | Command failed. |
| Lint | FAIL | Command failed. |
| Formatting | FAIL | Command failed. |
| Unit and component tests | FAIL | Command failed. |
| Accessibility | FAIL | Command failed. |
| Coverage | FAIL | Command failed. |
| Production build | FAIL | Command failed. |
| API parity | FAIL | Command failed. |
| Browser test discovery | PASS | Playwright discovered the role-based browser smoke suite. |
| Production dependency audit | FAIL | A high-severity production advisory or audit failure was reported. |
| Live security matrix | WARN | Not rerun: set RUN_SECURITY_E2E=1 with a migrated disposable backend and E2E_API_URL. Static parity, unit tests, and production dependency audit still run. |
| Live browser roles | WARN | Not run: set RUN_BROWSER_E2E=1 and ADMIN_V2_E2E_BASE_URL against a seeded disposable environment. |
| Web Push delivery | WARN | Production-like HTTPS, browser permission, and VAPID delivery require external verification; see docs/operations/admin-v2-web-push-verification.md. |
| Documentation | PASS | Current capability matrix and historical audit banners are present. |
| Bundle size | PASS | All normal chunks are at most 500 KiB; the on-demand ExcelJS chunk is 915.02 KiB within its 1 MiB cap. |

## Release decision

**BLOCKED** by 9 failed gate(s).

Coverage applies to the critical runtime and business-module list in `vitest.config.ts`; it is not a whole-source coverage claim. Generated output and local browser/VAPID boundaries are recorded above.
