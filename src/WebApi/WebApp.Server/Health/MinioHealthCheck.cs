using Domain.Settingss;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Options;

namespace WebApp.Server.Health;

public sealed class MinioHealthCheck(
    IMinioClient minio,
    IOptions<MinioSettings> options) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            var bucketExists = await minio.BucketExistsAsync(
                new BucketExistsArgs().WithBucket(options.Value.BucketName),
                cancellationToken);

            return bucketExists
                ? HealthCheckResult.Healthy("MinIO is reachable and the configured bucket exists.")
                : HealthCheckResult.Unhealthy("MinIO is reachable but the configured bucket does not exist.");
        }
        catch (Exception exception)
        {
            return HealthCheckResult.Unhealthy("MinIO is unavailable.", exception);
        }
    }
}
