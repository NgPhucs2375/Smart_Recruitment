# Frontend/backend integration smoke checks

With Docker backend/PostgreSQL running, set `INTEGRATION_SMOKE_PASSWORD` to the
existing seeded account password and run:

```powershell
node "tests/FrontendIntegration.Smoke/run.mjs"
```

Checks core FE endpoint registrations against live Swagger, notification reference
metadata, persisted read state, report totals and verification resend. Creates one
temporary notification and cleans it up. Optional `INTEGRATION_SMOKE_ORIGIN`
defaults to `http://127.0.0.1:8000`.
