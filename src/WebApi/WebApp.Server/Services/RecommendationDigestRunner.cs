using System.Collections.Concurrent;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Services;

/// <summary>
/// Kích hoạt digest gợi ý ngoài request hiện tại: mỗi user tối đa một lần chạy
/// song song; lỗi cache/matching chỉ ghi log để không ảnh hưởng danh sách thông báo.
/// </summary>
public sealed class RecommendationDigestRunner(
    IServiceScopeFactory scopes,
    ILogger<RecommendationDigestRunner> logger)
{
    private static readonly ConcurrentDictionary<int, SemaphoreSlim> Gates = new();

    public void Trigger(int userId)
    {
        var gate = Gates.GetOrAdd(userId, _ => new SemaphoreSlim(1, 1));
        if (!gate.Wait(0)) return;
        _ = RunAsync(userId, gate);
    }

    private async Task RunAsync(int userId, SemaphoreSlim gate)
    {
        try
        {
            await using var scope = scopes.CreateAsyncScope();
            await scope.ServiceProvider
                .GetRequiredService<RecommendationDigestService>()
                .EnsureAsync(userId, CancellationToken.None);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Không tạo được digest gợi ý cho người dùng {UserId}.", userId);
        }
        finally
        {
            gate.Release();
        }
    }
}
