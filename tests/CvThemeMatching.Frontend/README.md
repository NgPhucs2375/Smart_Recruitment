# Frontend CV-theme contract checks

Install frontend dependencies, then:

```powershell
node "tests/CvThemeMatching.Frontend/run.cjs"
```

Loads actual TypeScript modules with the frontend compiler. Checks manifest/render
parity, tool results, fake slugs, current eligibility and content-preserving patches.
