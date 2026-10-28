# Visual capture scripts

Start the Admin preview in one terminal:

```bash
cd apps/admin && npm run dev -- --host 127.0.0.1
```

Then create the full Principal, Teacher, Student, and Supervisor desktop/mobile route matrix with deterministic mocked API responses:

```bash
node scripts/visual-captures/capture-role-pages.cjs
```

The default output is `docs/visual-captures/admin-role-pages/latest`. Override it with `ROLE_CAPTURE_OUTPUT`; use `ROLE_CAPTURE_BASE_URL` when the preview is not at `http://127.0.0.1:5173`.

These captures are UI reference artifacts only. They do not use an authenticated account or production data.
