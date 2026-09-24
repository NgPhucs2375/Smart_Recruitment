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
    AdamInstructions.cs              # Global candidate assistant prompt
    AdamAgentFactory.cs              # Global agent composition
    ScopedAdamAgent.cs               # Scoped global agent resolver
    Tools/
      CvQueryTools.cs                # Read-only CV tool adapters
  Recommen-Adam/
    ScopedRecommenAdamAgent.cs       # Role-aware agent resolver
    Candidate/                        # Candidate tools, prompt, and factory
    Recruiter/                       # Recruiter tools, prompt, and factory
```

## Tools

Backend tools (registered in `CvAssistantAgentFactory.CreateAgent`, all
read-only, one MediatR query each):

| Tool name | Purpose |
|---|---|
| `get_my_profile` | Hồ sơ ứng viên đang đăng nhập |
| `get_cv_detail` | Chi tiết một CV đã lưu (theo id) |
| `list_my_cvs` | Danh sách CV đã lưu (mới nhất trước) |
| `suggest_jobs_for_my_cv` | Tin tuyển dụng phù hợp với CV (persist vào `KetQuaPhuHop`, xem `Application/Features/KetQuaPhuHop/Queries/SuggestJobsForCv`) |

Frontend tools (CopilotKit v2, `frontend/hooks/use-cv-assistant.ts` +
`frontend/hooks/use-global-cv-assistant.ts`): `navigateToCvEditor` (global,
mọi trang) + `updateCvContact`/`updateCvContactBulk`/`updateCvMeta`/
`upsertCvSectionItem`/`removeCvSectionItem`/`setCvTemplate`/`getCvFormSnapshot`/
`loadCvFromBackend` (chỉ /tao-cv). Chat từ trang khác lưu
`sessionStorage hireai.cv-pending-patch` rồi `router.push("/tao-cv")`.

## Design: form-là-source-of-truth

Trong lúc soạn, CV chỉ tồn tại dưới dạng React state ở FE — BE không với tới
được, nên mọi tool ghi là frontend tool, tác động thẳng vào form (preview
realtime, có undo). BE chỉ expose tool đọc. Đường ghi DUY NHẤT vào DB là nút
"Lưu CV" ở `/tao-cv` (`cvApi.saveVersion` → `SaveCvVersionCommand`, có
versioning qua `CVPhienBan`). Agent không tự lưu CV, không tự tạo CV rỗng.
(Drũ cũ `CvCommandTools`/`CreateCVByAgentCommand` đã bị xóa.)

Agent "biết" trạng thái form nhờ FE đẩy snapshot qua `useAgentContext` mỗi
lượt chat (`frontend/features/ai-cv/cv-assistant-state.ts`), không phải nhờ
query DB.

## Security

`/api/copilotkit` được map với `.RequireAuthorization()` (JWT bearer — cùng
scheme với các controller `[Authorize]`). FE gửi `Authorization: Bearer` qua
`CopilotProvider`; proxy Next (`frontend/app/api/copilotkit/agent-runtime.ts`)
chuyển tiếp header này sang AG-UI endpoint bằng AsyncLocalStorage.

## Dependency direction

```text
CopilotKit -> Next proxy (forward Authorization) -> AG-UI endpoint (auth)
           -> scoped agent -> tool adapter -> MediatR query
                                          -> Application/Domain
```

## Conventions

- Use stable snake_case names for backend tools; prompts refer to those names.
- Separate read tools from tools with side effects. Backend tools are
  read-only; all writes go through FE tools / the save button.
- Return typed DTO/response contracts, never EF entities or `object`.
- Keep model/provider setup in `AgentExtensions`; do not put it in `Program.cs`.
- Create another feature directory under `Agent/` when adding a new agent.

## Deployment

The module uses the same process, authentication, request scope, logging, and
database as `WebApp.Server`. Deployment only needs the model API configuration
(`Ai:Endpoint`, `Ai:Model`, `Groq:ApiKey`) and the existing `/api/copilotkit`
endpoint. If scaling independently becomes a real requirement, this directory
is the extraction boundary for a future agent service.
