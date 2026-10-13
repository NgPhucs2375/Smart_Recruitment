# Live role/permission/policy checks

Run with local Docker backend/PostgreSQL and `AUTH_SMOKE_PASSWORD` set to the
existing seed password:

```powershell
node "tests/Authorization.Smoke/run.mjs"
```

Checks all four roles, Admin-only APIs, immutable built-in roles, matrix validation,
multipart CV permission enforcement, analysis ownership, live grant/revocation and
SQL uniqueness. Temporarily modifies candidate CV grants and creates a candidate
skill-catalog grant, restoring both in `finally`. Use an isolated local database.
