# Agent module

This directory is the backend AI boundary of the monolith. It is deployed as
part of `WebApp.Server`; it is not a separate microservice.

## Layout

```text
Agent/
  AgentExtensions.cs                 # DI registration and AG-UI endpoint mapping
  SharedStateAgent.cs                # AG-UI shared-state decorator
  SharedStateStore.cs                # Request-scoped state store
  Adam/
    Tools/
      CvQueryTools.cs                # Read-only CV/profile/job/theme tools (shared)
  Recommen-Adam/
    ScopedRecommenAdamAgent.cs       # Sole role-aware resolver (candidate/recruiter)
    Candidate/                       # Candidate tools, prompt, and factory
    Recruiter/                       # Recruiter tools, prompt, and factory
  CvReview/                          # One-shot CV-vs-JD reviewer (no chat)
  Cache/AgentToolCache.cs            # Redis cache per user/tool/args
  RateLimit/AgentChatDailyLimiter.cs # Daily quotas (chat + CV review)
  Threads/AgentThreadStore.cs        # Redis thread history (read API in AgentThreadsController)
```

Everything listens on the single AG-UI endpoint `/api/copilotkit` (mapped in
`MapAdamAgent`, `RequireAuthorization`). Role routing happens in
`ScopedRecommenAdamAgent.ResolveAgent`:

| Role | Agent |
|---|---|
| `UNG_VIEN` | candidate factory |
| `NHAN_SU`, `NGUOI_DAI_DIEN` | recruiter factory |
| `QUAN_TRI_VIEN` and anything else | refused — no fallback (avoids leaking company data) |

## Tools

All backend tools are **read-only**: one permission check (`IPermissionService`)
plus one MediatR query each, cached for 120s per user (`AgentToolCache`).
Stable snake_case names; prompts refer to those names.

Candidate agent (16 backend tools, see `CandidateAdamAgentFactory`):

| Group | Tools |
|---|---|
| Profile / CV | `get_my_profile`, `list_my_cvs`, `get_cv_detail`, `check_profile_completeness`, `analyze_cv`, `review_default_cv` |
| Jobs | `search_jobs`, `get_job_details`, `get_job_recommendations`, `explain_job_match`, `compare_jobs` (scorer tất định cho một cặp CV–tin, không phụ thuộc top gợi ý) |
| Applications | `get_my_applications`, `get_application_status` |
| CV themes | `suggest_cv_theme`, `get_cv_theme_workspace` → `pick_cv_themes` (server validates slugs) |

Recruiter agent (17 backend tools, see `RecruiterAdamAgentFactory`):

| Group | Tools |
|---|---|
| Job postings | `get_my_recruitment_jobs`, `get_current_recruitment_context`, `get_recruitment_job_detail`, `analyze_job_post` |
| Candidates | `get_candidate_recommendations_for_job`, `explain_candidate_match`, `compare_candidates` (chấm đúng cặp ứng viên–tin, không quét cả pool), `get_candidate_cv`, `summarize_candidate` |
| Applications | `get_applications`, `get_application_detail`, `get_application_pipeline`, `find_stale_applications`, `get_recruitment_overview` |
| Company (representative only, enforced by permissions) | `get_company_recruitment_stats`, `get_company_members`, `get_recruiter_activity` |

Frontend tools (CopilotKit v2, `frontend/hooks/use-global-cv-assistant.ts` +
`frontend/hooks/use-cv-assistant.ts`):

- Everywhere: `navigateTo`, `navigateToCvEditor` (candidate), `applyToJob`
  (opens the confirm dialog only), `focusSections` (editor only).
- CV editor (`/CV`): `updateCvContact`, `updateCvContactBulk`, `updateCvMeta`,
  `upsertCvSectionItem`, `removeCvSectionItem`, `setCvTemplate`,
  `getCvFormSnapshot`, `loadCvFromBackend`, `suggestCvThemeForDraft`.

## Design: form-là-source-of-truth

Trong lúc soạn, CV chỉ tồn tại dưới dạng React state ở FE — BE không với tới
được, nên mọi tool ghi là frontend tool, tác động thẳng vào form (preview
realtime, có undo). BE chỉ expose tool đọc. Đường ghi DUY NHẤT vào DB là nút
"Lưu CV" ở `/CV` (`cvApi.saveVersion` → `SaveCvVersionCommand`, có versioning qua
`CVPhienBan`). Agent không tự lưu CV, không tự tạo CV rỗng, không nộp đơn.

Agent "biết" trạng thái form nhờ FE đẩy snapshot qua `useAgentContext` mỗi
lượt chat (`frontend/features/ai-cv/cv-assistant-state.ts`), không phải nhờ
query DB.

## CV review agent (CvReview)

Separate one-shot agent, not part of chat: triggered by
`POST /api/ketquaphantichcvs/danh-gia`, quota 10/day. It runs a real tool loop
(`get_cv_detail`, `get_job_details`, `get_cv_job_match`) and must answer JSON.
The numeric match score always comes from the deterministic scorer; the agent
only writes commentary. Timeout (70s) or bad JSON falls back to a rule-based
review, saved with `DaDanhGiaBangAi = false` — never a 500.

## Security and limits

- `/api/copilotkit` uses JWT bearer (`.RequireAuthorization()`). FE sends
  `Authorization: Bearer` via `CopilotProvider`; the Next proxy
  (`frontend/app/api/copilotkit/agent-runtime.ts`) forwards it through
  AsyncLocalStorage.
- Every tool re-checks the permission matrix; recruiter queries are scoped to
  the current user's company, and representative-only tools rely on
  `nhansus:list`.
- `AgentChatRateLimitMiddleware`: 15 chat runs/day (resumes after a frontend
  tool result are not charged twice). `AgentChatDailyLimiter` also holds the
  CV-review quota. Redis failure fails open.
- `AgentThreadHistoryMiddleware` stores thread snapshots/events in Redis
  (200 messages, 50 runs, 168h TTL, index of 100 threads).
- Streaming deadline: `Ai:MaxStreamingRunTimeSeconds` (default 60s, clamped
  10–300s). Internal errors are logged, never returned to the user.
- Prompts cap backend tool calls per turn (candidate ≤3 chained; recruiter ≤2)
  and forbid inventing data, IDs, scores or application statuses.

## Dependency direction

```text
CopilotKit -> Next proxy (forward Authorization) -> AG-UI endpoint (auth)
           -> rate limit / thread history middlewares -> scoped agent
           -> tool adapter -> MediatR query -> Application/Domain
```

## Config keys

| Key | Default | Meaning |
|---|---|---|
| `DeepSeek:Endpoint` / `DeepSeek:Model` / `DeepSeek:ApiKey` | `https://api.deepseek.com/v1` / `deepseek-flash` / — | model provider |
| `Agent:DailyChatLimit` | 15 | chat runs per user per day |
| `Agent:DailyCvReviewLimit` | 10 | CV reviews per user per day |
| `Agent:ToolCacheSeconds` | 120 | tool result cache TTL |
| `Agent:ThreadTtlHours` / `ThreadMaxRuns` / `ThreadMaxMessages` / `ThreadIndexKeep` | 168 / 50 / 200 / 100 | thread history caps |
| `Ai:MaxStreamingRunTimeSeconds` | 60 | streaming deadline |

In Docker (`docker-compose.prod.yml`) these map to `DeepSeek__*`, `Agent__*`,
`Ai__*` environment variables.

## Conventions

- Use stable snake_case names for backend tools; prompts refer to those names.
- Separate read tools from tools with side effects. Backend tools are
  read-only; all writes go through FE tools / the save button.
- Return typed DTO/response contracts, never EF entities or `object`.
- Keep model/provider setup in `AgentExtensions`; do not put it in `Program.cs`.
- Create another feature directory under `Agent/` when adding a new agent.

## Deployment

The module uses the same process, authentication, request scope, logging, and
database as `WebApp.Server`. Deployment only needs the DeepSeek API
configuration and the existing `/api/copilotkit` endpoint. The agent uses
DeepSeek's OpenAI-compatible endpoint directly; no OpenRouter/9router gateway
is involved. If scaling independently becomes a real requirement, this
directory is the extraction boundary for a future agent service.
