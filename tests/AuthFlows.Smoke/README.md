# Authentication and authorization smoke checks

Requires Docker PostgreSQL and a running backend with the repository's seeded accounts.
Set `AUTH_SMOKE_PASSWORD` to their password, then run:

```powershell
node "tests/AuthFlows.Smoke/run.mjs"
```

Optional: `AUTH_SMOKE_BASE_URL` (default `http://127.0.0.1:8000/api`).
Creates a uniquely named test account and cleans it up in `finally`. Does not change
passwords or roles of the seeded accounts. Covers all four roles, registration,
verification gates, reset validation, password change, refresh rotation, logout,
live role removal, domain synchronization, disabled accounts and response filtering.

Positive Google authentication and actual delivery of verification/reset email
require a valid Google ID token and a working mail provider respectively.
