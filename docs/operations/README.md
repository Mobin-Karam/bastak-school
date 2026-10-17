# Operations documentation

Start with the [repository runbook](./repository-runbook.md) for local commands. The [CI/CD pipeline](./ci-cd-pipeline.md) maps required checks and the release trust boundary; [GitHub CI/CD operations](./github-cicd.md) covers configuration, secrets and recovery. [Release evidence](./release-evidence.md) distinguishes automated checks from browser, native, restore and production evidence.

| Task | Canonical guide |
| --- | --- |
| Develop, test, release, and verify production | [Development to production guide](./development-to-production.md) |
| Build or fix a feature | [Developer handbook](./developer-handbook.md) and [feature/bug playbook](./feature-and-bug-playbook.md) |
| Deploy or recover | [GitHub CI/CD operations](./github-cicd.md), [database rollout](./database-multi-role-integrity-rollout.md) and [maintenance](./maintenance-guide.md) |
| Maintain documentation | [Documentation maintenance](./documentation-maintenance.md) |
| Import data or bootstrap examples | [Plan import schema](./plan-import-schema-v2.md), [demo seed](./backend-v2-product-demo-seed.md) and [private organization bootstrap](./private-organization-bootstrap.md) |
| Alternative hosting | [PaaS](./paas-deployment.md) and [Coolify](./coolify-deployment.md); automatic production target is LAN |
| Verify Web Push | [Admin Web Push verification](./admin-v2-web-push-verification.md) |

The [engineering guide](../engineering/README.md) covers architecture, testing, performance and proposed work. Dated audits belong in [audit evidence](../evidence/README.md), not in this current runbook category.

The [13 October 2026 conversation handover](./conversation-handover-2026-10-13.md) records the architecture/security/reliability work, historical production release evidence, Deployline hostname controls, local DNS/TLS setup and outstanding DHCP requirements. It is dated evidence, not a live configuration source.
