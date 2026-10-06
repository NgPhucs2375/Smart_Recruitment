# Job search/application smoke checks

Requires Docker backend, PostgreSQL, Redis and the existing seeded accounts.
Set `JOB_SMOKE_PASSWORD` to their password, then run:

```powershell
node "tests/JobApplications.Smoke/run.mjs"
```

Optional `JOB_SMOKE_BASE_URL` defaults to `http://127.0.0.1:8000/api`.
Creates and cleans uniquely named jobs, CVs and applications. Verifies real SQL
filters/paging, concurrent submission uniqueness, immutable CV snapshots,
tracking, withdrawal and a real authenticated SignalR notification connection.
Email invocation and persistence ordering are covered by
`dotnet run --project "tests/JobApplications.Checks"`; actual mailbox delivery
depends on configured SMTP.
