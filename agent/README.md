# agent/ — RecruitmentAgent (structure ported from form-filling, WITHOUT Minimal API)

Ported from MCP dir `form-filling` (`agent/` + `src/` read via MCP resources).
Only the **folder structure way** was moved — no Minimal API was introduced.

## Structure map (form-filling → this project)

| form-filling `agent/` | `agent/` here | Notes |
|---|---|---|
| `Program.cs` (WebApplication, `AddAGUI`, `MapEndpoints`, `MapAGUI`) | `AgentRegistration.cs` | Composition root ONLY as `AddRecruitmentAgent()` DI extension. No `WebApplication`, no port 8000, no `MapEndpoints`/`EndpointGroupBase`. Hosting stays in `src/WebApi/WebApp.Server/Program.cs` (`MapAGUIServer` + Controllers). |
| `AgentFactories/IAgentFactory.cs` | `AgentFactories/IAgentFactory.cs` | Same contract. `Route` is informational (no Minimal API route mapping). |
| `AgentFactories/FormFillAgentFactory.cs` | `AgentFactories/CvMatchingAgentFactory.cs` | Tools ported to recruitment domain: `parse_cv_document` → `search_tin_tuyen_dung` → `recommend_cv_matches`. |
| `FormFillAgent.cs` (DelegatingAIAgent, `__form_fills__`) | `CvMatchingAgent.cs` | Same pattern, emits `{"matches": [...]}` via `__cv_matches__` DataContent. |
| `ChatClients/OllamaChatClientImpl.cs` | — (skipped) | Needs OllamaSharp package — intentionally NOT added to keep build green. |
| `ChatClients/OpenAIChatClientImpl.cs` | `ChatClients/OpenAIChatClientImpl.cs` + `ChatClients/GroqChatClientImpl.cs` | Groq is default (matches existing `AIAgentExtension` Omniroute setup). |
| `Chunker/WeKnoraChunker.cs` + `Models.cs` + `HeaderTracker.cs` | `Chunker/SimpleChunker.cs` + `Chunker/Models.cs` | Self-contained recursive splitter + parent/child; table/LaTeX protected-spans omitted (CV text doesn't need them, zero new deps). |
| `Common/Interfaces/IApplicationDbContext.cs` | `Common/Interfaces/ICvKnowledgeService.cs` | Reuses existing `Application.Interfaces.IApplicationDbContext` — no new tables, no migration, no pgvector. |
| `Services/DbService.cs` | `Services/CvKnowledgeService.cs` | `ListForms/SearchKnowledge` → `SearchTinTuyenDungAsync/ListTinDangTuyenAsync/GetCvUngVienAsync/ListKyNangAsync` (keyword-based; vector ranking = TODO). |
| `Services/EmbeddingService.cs` (Ollama bge-m3) | `Services/EmbeddingService.cs` (`IEmbeddingService` + `NullEmbeddingService`) | Null-object until Ollama/pgvector is wired; callers unchanged when swapped. |
| `Services/IDocumentParserStrategy.cs` + `*ParserStrategy.cs` | `Services/IDocumentParserStrategy.cs` + `PlainTextParserStrategy.cs` | Same Strategy contract; plain-text default, OCR/ResOCR/MinerU can be added later behind the same interface. |
| `FileAttachmentMiddleware.cs` | `FileAttachmentMiddleware.cs` | Same behaviour (`__attachments__` extraction). |
| `Services/ApplicationDbContext.cs` + `Migrations/*` + `src/Infrastructure/Data/Configurations/*` | — (skipped) | Existing Clean-Architecture `ApplicationDbContext` + Configurations + Migrations are reused as-is. |
| `src/Web/Endpoints/*` + `src/Web/Infrastructure/*` | — (skipped, per request) | **No Minimal API.** Existing `Controllers/v1/*` stay the single write path. |

## Wiring (2 lines, additive — no existing behaviour changed)

`src/WebApi/WebApp.Server/Program.cs`:

```csharp
using RecruitmentAgent;

// after AddApplicationLayer()/AddSharedInfrastructure(...):
_services.AddRecruitmentAgent();

// in the pipeline, BEFORE MapAGUIServer/MapControllers:
app.UseMiddleware<RecruitmentAgent.FileAttachmentMiddleware>();
```

Then build the CV agent wherever the current smart-agent is built:

```csharp
var cvFactory = app.Services.GetRequiredService<RecruitmentAgent.AgentFactories.IAgentFactory>();
var cvAgent = cvFactory.CreateAgent();
```

`RecruitmentAgent.csproj` references `src/Application/Application.csproj` and pins
`Microsoft.Agents.AI 1.18.0` / `Microsoft.Extensions.AI 10.9.0` — the exact versions
`WebApp.Server` already uses. Add to solution with:

```powershell
dotnet sln RecruitmentSmart.sln add agent/RecruitmentAgent.csproj
dotnet build agent/RecruitmentAgent.csproj
```
