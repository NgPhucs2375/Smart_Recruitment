# People-list API checks

Set `AUTH_SMOKE_PASSWORD` for local seed accounts and run:

```powershell
node "tests/PeopleLists.Smoke/run.mjs"
node "tests/FrontendContracts.Checks/run.mjs"
```

API checks are read-only. Frontend checks cover Vietnamese accent folding,
multi-keyword matching, role/status predicates and pagination edge cases.
