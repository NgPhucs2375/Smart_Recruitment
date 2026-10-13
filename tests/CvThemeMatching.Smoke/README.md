# Live CV-theme checks

With local Docker backend and `AUTH_SMOKE_PASSWORD` set:

```powershell
node "tests/CvThemeMatching.Smoke/run.mjs"
```

Optional `CV_THEME_SMOKE_AGENT=1` also invokes the actual LLM through AG-UI.
Requires the configured model provider to be reachable. All API checks are read-only.
