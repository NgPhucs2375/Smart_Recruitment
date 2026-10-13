# Authorization regressions

```powershell
dotnet run --project "tests/Authorization.Checks/Authorization.Checks.csproj" -p:UseSharedCompilation=false -m:1
```

Uses actual EF Core models/handlers with isolated InMemory databases. Covers
role/resource boundaries, malformed grants, ownership, candidate/recruiter review
scope, submitted CV snapshots, stale company profiles, bootstrap/revocation and
live permission lookup. SQL uniqueness and migrations require the live smoke test.
