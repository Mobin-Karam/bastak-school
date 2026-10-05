# Coolify production deployment

Coolify is the deployment dashboard for this repository. It builds the three-service topology from `docker-compose.coolify.yml` and owns domains, TLS, environment variables, logs, rollbacks, and deploy history. Do not publish the API service: only Student and Admin receive public domains, and both proxy `/api/v2` to the private API service.

## Create the application

1. In Coolify, create a **Docker Compose** application from this repository and select `main` as the production branch.
2. Set the Compose file to `docker-compose.coolify.yml`.
3. Add a persistent volume for the `backend-v2` `/data` mount. This is the only production database disk. Keep `backend-v2` at exactly one replica while SQLite is in use.
4. In the service-domain UI, assign `https://student.example.com:80` to `student-v2` and `https://admin.example.com:80` to `admin-v2`. Leave `backend-v2` private.
5. Add the variables in `.env.coolify.example` to Coolify. Replace the example origins with the exact two public HTTPS origins. Keep `COOKIE_SECURE=1` and `TRUST_PROXY=1` from the Compose file.
6. Deploy once, wait for the API health check, and create the first administrator through the Admin sign-in page. The `admin` / `anonymous` account exists only when the development demo seed is deliberately run; it is never a production startup action.

TypeORM runs committed migrations when the API starts. Before any release that changes the database, create a Coolify volume snapshot or another tested backup of `/data`; do not run demo or development seed commands against that volume.

## CI/CD

The existing `Deployment Readiness` workflow builds the production topology and runs its API/proxy smoke checks for a relevant push to `main`. Only after that workflow succeeds does `Coolify production deployment` validate the Coolify Compose configuration and call Coolify. A manual deployment is restricted to `main`.

In Coolify, create a deploy-only API token and copy the application or tag **Deploy Webhook (auth required)**. Add both values as GitHub Actions secrets:

| Secret | Value |
| --- | --- |
| `COOLIFY_DEPLOY_WEBHOOK` | The Coolify Deploy Webhook URL for the production resource or tag. |
| `COOLIFY_TOKEN` | A Coolify API token with only the `deploy` permission. |

The workflow queues a deployment; use Coolify's Deployments page to confirm the queued deployment becomes healthy. Do not enable Coolify Git auto-deploy for this same application, otherwise a push can trigger a deployment before the GitHub Actions gate finishes.

## CDN and cache policy

Coolify terminates TLS and routes the public domains, but it is not a CDN. Add a CDN only after choosing its provider and configuring its DNS for the Student and Admin hostnames. Exclude `/api/v2/*`, `/sw.js`, `/manifest.webmanifest`, and `/index.html` from long-lived edge caching. Versioned Vite assets may be cached aggressively. Keep the API private and do not cache authenticated responses or `Set-Cookie` responses at the CDN.

## Release check

After each production deployment, check the two public roots, both same-origin `/api/v2/openapi.json` paths, first-admin setup or login, Student signup, and one authenticated CSRF-protected mutation. The existing command below checks the Student artifact and API proxy rather than accepting a root-page HTTP 200 as deployment proof:

```bash
node tooling/deployment/verify-student-production.mjs https://student.example.com
```

## Local test-production server

Coolify can run on a Linux workstation and deploy to its built-in `localhost` server. This is suitable for validating the production container topology, health checks, migrations, and dashboard workflow; it is not a substitute for a public production host.

Before installing, make sure Docker is already working, preserve SSH access, and verify that ports `80`, `443`, `8000`, `6001`, and `6002` are free. The Coolify dashboard initially listens on `http://<LAN-IP>:8000`. Restrict that dashboard to the local network while testing. Do not expose it to the public internet without a protected administrator account and a dashboard domain.

On an Ubuntu non-LTS workstation, Docker should be installed independently before using the Coolify installer. From a terminal with `sudo` access, run the official installer and then create the Coolify administrator account immediately:

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash
```

After installation:

1. Open `http://<LAN-IP>:8000`, create the Coolify administrator, and back up `/data/coolify/source/.env` outside the repository.
2. In **Servers**, verify the automatically added `localhost` server.
3. Create the Docker Compose application from `main` with `docker-compose.coolify.yml`, then add the Coolify environment values described above.
4. For an HTTP-only LAN smoke test, temporarily set `COOKIE_SECURE=0` and `COOKIE_SAMESITE=lax` in Coolify. Restore `COOKIE_SECURE=1` before treating any deployment as production-like.

Private LAN hostnames cannot obtain public Let's Encrypt certificates by themselves. To test the real secure-cookie flow, provide one of: a public DNS hostname with router/NAT forwarding of ports `80` and `443` to the workstation, or an approved tunnel/reverse-proxy and certificate arrangement. Keep the API service private in every case.
