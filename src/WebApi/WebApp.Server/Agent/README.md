# Agent module

This directory is the backend AI boundary of the monolith. It is deployed as
part of `WebApp.Server`; it is not a separate microservice.

## Layout

```text
Agent/
  AgentExtensions.cs                 # DI registration and AG-UI endpoint mapping
  CvAssistant/
    CvAssistantInstructions.cs       # Stable agent identity and system prompt
    CvAssistantAgentFactory.cs       # Composes model, tools, and decorators
    ScopedCvAssistantAgent.cs        # Resolves a scoped agent per HTTP request
    CvStateAgent.cs                   # AG-UI state synchronization behavior
    CvStateSnapshot.cs               # State contract shared with the client
    CvAssistantJsonContext.cs        # Source-generated JSON metadata
    Tools/
      CvQueryTools.cs                # Read-only tool adapters
      CvCommandTools.cs              # Side-effecting tool adapters
```

Business use cases stay under `Application/Features`. Tools are thin adapters:
they translate a model tool call into one MediatR command/query and contain no
database or domain logic.

## Dependency direction

```text
CopilotKit -> AG-UI endpoint -> scoped agent -> tool adapter
                                            -> MediatR command/query
                                            -> Application/Domain
```

## Conventions

- Use stable snake_case names for tools; prompts refer to those names.
- Separate read tools from tools with side effects.
- Require explicit user confirmation before command tools run.
- Return typed DTO/response contracts, never EF entities or `object`.
- Keep model/provider setup in `AgentExtensions`; do not put it in `Program.cs`.
- Create another feature directory under `Agent/` when adding a new agent.
- Introduce a shared factory interface/catalog only when there are multiple
  independently mapped agents. One agent does not need that abstraction.

## Deployment

The module uses the same process, authentication, request scope, logging, and
database as `WebApp.Server`. Deployment only needs the model API configuration
and the existing `/api/copilotkit` endpoint. If scaling independently becomes a
real requirement, this directory is the extraction boundary for a future agent
service.
