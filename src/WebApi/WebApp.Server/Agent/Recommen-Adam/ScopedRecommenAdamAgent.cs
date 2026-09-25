using System.Runtime.CompilerServices;
using System.Text;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Domain.Enums;
using WebApp.Server.Agent.RecommenAdam.Candidate;
using WebApp.Server.Agent.RecommenAdam.Recruiter;
using WebApp.Server.Agent.SharedState;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Agent.RecommenAdam;

internal sealed class ScopedRecommenAdamAgent : AIAgent
{
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly ILogger<ScopedRecommenAdamAgent> _logger;
    private readonly TimeSpan _maxStreamingRunTime;

    public ScopedRecommenAdamAgent(
        IHttpContextAccessor httpContextAccessor,
        ILogger<ScopedRecommenAdamAgent> logger,
        IConfiguration configuration)
    {
        _httpContextAccessor = httpContextAccessor;
        _logger = logger;
        var configuredSeconds = configuration.GetValue<int?>("Ai:MaxStreamingRunTimeSeconds") ?? 60;
        _maxStreamingRunTime = TimeSpan.FromSeconds(Math.Clamp(configuredSeconds, 10, 300));
    }

    public override string? Name => "Adam";
    public override string? Description => "Trợ lý chuyên biệt theo vai trò ứng viên hoặc tuyển dụng.";

    protected override async Task<AgentResponse> RunCoreAsync(IEnumerable<ChatMessage> messages, AgentSession? session = null, AgentRunOptions? options = null, CancellationToken cancellationToken = default)
    {
        try
        {
            return await (await ResolveAgentAsync()).RunAsync(messages, session, options, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Adam non-streaming run failed.");
            throw;
        }
    }

    protected override async IAsyncEnumerable<AgentResponseUpdate> RunCoreStreamingAsync(IEnumerable<ChatMessage> messages, AgentSession? session = null, AgentRunOptions? options = null, [EnumeratorCancellation] CancellationToken cancellationToken = default)
    {
        var messageList = messages.ToList();
        var services = _httpContextAccessor.HttpContext?.RequestServices
            ?? throw new InvalidOperationException("Không có HTTP request scope hiện tại.");
        var current = await services.GetRequiredService<Application.Interfaces.ICurrentNguoiDungService>().ResolveAsync();

        if (current.VaiTro == VaiTroNguoiDung.UNG_VIEN && IsJobRecommendationRequest(messageList))
        {
            var tools = services.GetRequiredService<CandidateTools>();
            var response = await tools.GetJobRecommendationsAsync(cancellationToken: cancellationToken);
            var text = response.Succeeded && response.Data is not null
                ? FormatJobRecommendations(response.Data)
                : response.Message ?? "Không thể lấy việc làm phù hợp lúc này.";

            yield return new AgentResponseUpdate
            {
                Contents = [new TextContent(text)]
            };

            var state = services.GetRequiredService<SharedStateStore>();
            yield return new AgentResponseUpdate
            {
                Contents = [new DataContent(JsonSerializer.SerializeToUtf8Bytes(state.Snapshot()), "application/json")]
            };
            yield break;
        }

        AIAgent agent;
        try
        {
            agent = await ResolveAgentAsync();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            _logger.LogError(ex, "Adam agent could not be resolved for streaming.");
            throw;
        }

        using var timeout = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeout.CancelAfter(_maxStreamingRunTime);

        var timedOut = false;
        var enumerator = agent
            .RunStreamingAsync(messageList, session, options, timeout.Token)
            .GetAsyncEnumerator(timeout.Token);
        try
        {
            while (true)
            {
                bool hasNext;
                try
                {
                    hasNext = await enumerator.MoveNextAsync();
                }
                catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested && timeout.IsCancellationRequested)
                {
                    timedOut = true;
                    break;
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    _logger.LogError(ex, "Adam streaming run failed while reading an update.");
                    throw;
                }

                if (!hasNext) break;

                var update = enumerator.Current;
                _logger.LogDebug("Adam stream update received. UpdateType={UpdateType}", update.GetType().Name);
                yield return update;
            }
        }
        finally
        {
            try
            {
                await enumerator.DisposeAsync();
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested && timeout.IsCancellationRequested)
            {
                timedOut = true;
            }
        }

        if (timedOut)
        {
            _logger.LogWarning("Adam streaming run exceeded the {TimeoutSeconds}s time limit.", _maxStreamingRunTime.TotalSeconds);
            yield return new AgentResponseUpdate
            {
                Contents = [new TextContent($"Model chưa phản hồi trong {_maxStreamingRunTime.TotalSeconds:0} giây. Vui lòng thử lại hoặc rút gọn yêu cầu.")]
            };
        }
    }

    protected override async ValueTask<AgentSession> CreateSessionCoreAsync(CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).CreateSessionAsync(cancellationToken);

    protected override async ValueTask<JsonElement> SerializeSessionCoreAsync(AgentSession session, JsonSerializerOptions? jsonSerializerOptions = null, CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).SerializeSessionAsync(session, jsonSerializerOptions, cancellationToken);

    protected override async ValueTask<AgentSession> DeserializeSessionCoreAsync(JsonElement serializedState, JsonSerializerOptions? jsonSerializerOptions = null, CancellationToken cancellationToken = default)
        => await (await ResolveAgentAsync()).DeserializeSessionAsync(serializedState, jsonSerializerOptions, cancellationToken);

    private async Task<AIAgent> ResolveAgentAsync()
    {
        var services = _httpContextAccessor.HttpContext?.RequestServices
            ?? throw new InvalidOperationException("Không có HTTP request scope hiện tại.");
        var current = await services.GetRequiredService<Application.Interfaces.ICurrentNguoiDungService>().ResolveAsync();
        _logger.LogInformation("Adam agent role routing. Role={Role}", current.VaiTro);
        var agent = current.VaiTro == VaiTroNguoiDung.UNG_VIEN
            ? services.GetRequiredService<CandidateAdamAgentFactory>().CreateAgent()
            : services.GetRequiredService<RecruiterAdamAgentFactory>().CreateAgent();
        return new SharedStateAgent(
            agent,
            services.GetRequiredService<SharedStateStore>(),
            services.GetRequiredService<ILogger<SharedStateAgent>>());
    }

    private static bool IsJobRecommendationRequest(IEnumerable<ChatMessage> messages)
    {
        var text = messages.LastOrDefault(message => message.Role == ChatRole.User)?
            .Contents.OfType<TextContent>()
            .Select(content => content.Text)
            .FirstOrDefault()?
            .ToLowerInvariant();

        return text is not null
            && (text.Contains("gợi ý") || text.Contains("goi y"))
            && (text.Contains("việc") || text.Contains("viec"))
            && (text.Contains("phù hợp") || text.Contains("phu hop"));
    }

    private static string FormatJobRecommendations(IEnumerable<Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv.SuggestedJobViewModel> jobs)
    {
        var builder = new StringBuilder("Các việc làm phù hợp nhất:\n");
        var index = 1;
        foreach (var job in jobs)
        {
            builder.Append(index++)
                .Append(". ").Append(job.TieuDe)
                .Append(" - ").Append(job.TenDoanhNghiep)
                .Append(" (ID: ").Append(job.TinTuyenDungId).Append(")\n")
                .Append("   ").Append(job.DiaDiemLamViec)
                .Append(" | ").Append(job.LuongToiThieu.ToString("N0")).Append("đ - ").Append(job.LuongToiDa.ToString("N0")).Append("đ")
                .Append(" | Phù hợp: ").Append(Math.Round(job.DiemPhuHop * 100)).Append("%\n");
        }

        return builder.ToString().TrimEnd();
    }
}
