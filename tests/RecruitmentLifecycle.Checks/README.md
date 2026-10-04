# Recruitment lifecycle checks

Run from the repository root:

```powershell
dotnet run --project "tests/RecruitmentLifecycle.Checks"
```

Uses isolated EF Core InMemory contexts. Exercises draft creation, skill replacement,
representative-before-filter approval, automatic publication for OK posts,
Admin approval/rejection for violations (including hard rules and very low scores),
filter outage recovery, reopening, ownership checks, expiry gates,
application cascade, deletion, committed notification delivery, and stale writes.
No external database, SMTP or SignalR connection is required.

These checks do not replace a PostgreSQL migration and HTTP smoke test. Existing
date-only deadlines are normalized by `NormalizeRecruitmentDeadlines`; deploy that
data migration before switching existing records to the inclusive Vietnam-day policy.
