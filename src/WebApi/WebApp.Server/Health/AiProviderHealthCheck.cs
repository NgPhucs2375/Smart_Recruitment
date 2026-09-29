using System.Net.Http.Headers;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace WebApp.Server.Health;

public sealed class AiProviderHealthCheck(
    HttpClient httpClient,
    IConfiguration configuration) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var endpoint = configuration["Ai:Endpoint"]?.TrimEnd('/');
        var apiKey = configuration["Groq:ApiKey"]
            ?? Environment.GetEnvironmentVariable("GROQ_API_KEY");

        if (string.IsNullOrWhiteSpace(endpoint))
            return HealthCheckResult.Unhealthy("AI endpoint is not configured.");
        if (string.IsNullOrWhiteSpace(apiKey))
            return HealthCheckResult.Unhealthy("AI provider API key is not configured.");

        try
        {
            using var request = new HttpRequestMessage(HttpMethod.Get, $"{endpoint}/models");
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
            using var response = await httpClient.SendAsync(request, cancellationToken);

            if (response.IsSuccessStatusCode)
                return HealthCheckResult.Healthy("AI provider is reachable.");

            return HealthCheckResult.Degraded(
                $"AI provider responded with HTTP {(int)response.StatusCode}.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("AI provider is unavailable.", exception);
        }
    }
}
