using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Domain.Enums;
using Application.Interfaces;
using WebApp.Server.Agent.RecommenAdam.Candidate;
using WebApp.Server.Agent.RecommenAdam.Recruiter;
using WebApp.Server.Agent.SharedState;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Agent.RecommenAdam;

internal sealed class ScopedRecommenAdamAgent : AIAgent
{
    private const string BlockedRoleMessage =
        "Xin lỗi, Adam hiện chỉ hỗ trợ tài khoản Ứng viên và Nhà tuyển dụng " +
        "(Nhân sự/Người đại diện doanh nghiệp). " +
        "Tài khoản Quản trị viên vui lòng dùng trang quản trị để xem báo cáo và cấu hình hệ thống.";

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
            var services = GetRequestServices();
            var current = await services.GetRequiredService<ICurrentNguoiDungService>().ResolveAsync();
            if (!IsSupportedRole(current.VaiTro))
            {
                LogBlockedRole(current.VaiTro, "non-streaming");
                return new AgentResponse(new ChatMessage(ChatRole.Assistant, BlockedRoleMessage));
            }

            return await ResolveAgent(services, current).RunAsync(messages, session, options, cancellationToken);
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
        var services = GetRequestServices();
        var current = await services.GetRequiredService<ICurrentNguoiDungService>().ResolveAsync();

        if (!IsSupportedRole(current.VaiTro))
        {
            LogBlockedRole(current.VaiTro, "streaming");
            yield return new AgentResponseUpdate
            {
                Contents = [new TextContent(BlockedRoleMessage)]
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
        Exception? streamError = null;
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
                    // Không yield trong catch (C# cấm): ghi nhận rồi break,
                    // trả lời text gọn ở dưới để client không chỉ thấy RUN_ERROR câm.
                    _logger.LogError(ex, "Adam streaming run failed while reading an update.");
                    streamError = ex;
                    break;
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

        if (streamError is not null)
        {
            // Không lộ chi tiết nội bộ (tên/loại exception, endpoint, SQL) ra end-user;
            // chi tiết đã được ghi log ở trên. Chỉ trả thông báo chung, dễ hiểu.
            yield return new AgentResponseUpdate
            {
                Contents = [new TextContent(
                    "Xin lỗi, Adam gặp sự cố khi xử lý. " +
                    "Vui lòng thử lại hoặc bắt đầu đoạn chat mới.")]
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
        var services = GetRequestServices();
        var current = await services.GetRequiredService<ICurrentNguoiDungService>().ResolveAsync();
        return ResolveAgent(services, current);
    }

    private AIAgent ResolveAgent(IServiceProvider services, CurrentNguoiDungContext current)
    {
        _logger.LogInformation("Adam agent role routing. Role={Role}", current.VaiTro);

        AIAgent agent;
        switch (current.VaiTro)
        {
            case VaiTroNguoiDung.UNG_VIEN:
                agent = services.GetRequiredService<CandidateAdamAgentFactory>().CreateAgent();
                break;

            case VaiTroNguoiDung.NHAN_SU:
            case VaiTroNguoiDung.NGUOI_DAI_DIEN:
                agent = services.GetRequiredService<RecruiterAdamAgentFactory>().CreateAgent();
                break;

            // Quản trị viên không thuộc phạm vi nghiệp vụ của Adam.
            // Không fallback sang Recruiter để tránh lộ dữ liệu doanh nghiệp.
            case VaiTroNguoiDung.QUAN_TRI_VIEN:
            default:
                LogBlockedRole(current.VaiTro, "session");
                return CreateBlockedAgent(services);
        }

        return new SharedStateAgent(
            agent,
            services.GetRequiredService<SharedStateStore>(),
            services.GetRequiredService<ILogger<SharedStateAgent>>());
    }

    private static bool IsSupportedRole(VaiTroNguoiDung role) =>
        role is VaiTroNguoiDung.UNG_VIEN
            or VaiTroNguoiDung.NHAN_SU
            or VaiTroNguoiDung.NGUOI_DAI_DIEN;

    private IServiceProvider GetRequestServices() =>
        _httpContextAccessor.HttpContext?.RequestServices
        ?? throw new InvalidOperationException("Không có HTTP request scope hiện tại.");

    private void LogBlockedRole(VaiTroNguoiDung role, string stage) =>
        _logger.LogWarning("Adam blocked unsupported role. Role={Role} Stage={Stage}", role, stage);

    private AIAgent CreateBlockedAgent(IServiceProvider services) =>
        new ChatClientAgent(
            services.GetRequiredKeyedService<IChatClient>(CandidateAdamInstructions.ChatClientKey),
            new ChatClientAgentOptions
            {
                Name = "Adam",
                Description = Description,
                ChatOptions = new ChatOptions
                {
                    Instructions =
                        "Bạn là Adam của HIREAI. Chỉ hỗ trợ tài khoản Ứng viên và Nhà tuyển dụng. " +
                        "Với mọi yêu cầu khác, trả lời đúng nguyên văn thông báo từ chối của hệ thống.",
                    Temperature = 0f,
                    MaxOutputTokens = 512,
                    AllowMultipleToolCalls = false,
                    Tools = []
                }
            },
            loggerFactory: null,
            services: null);
}
