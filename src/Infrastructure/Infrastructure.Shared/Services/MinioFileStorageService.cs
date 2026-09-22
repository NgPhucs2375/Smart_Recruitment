using Application.Interfaces;
using Domain.Settingss;
using Minio;
using Minio.DataModel.Args;
using Microsoft.Extensions.Options;
using System.Threading.Tasks;
using System.IO;
using System.Threading;
using System;

namespace Infrastructure.Shared.Services;

public class MinioFileStorageService : IFileStorageService
{
    private readonly IMinioClient _minioClient;
    private readonly MinioSettings _settings;

    public MinioFileStorageService(
        IMinioClient minioClient,
        IOptions<MinioSettings> options)
    {
        _minioClient = minioClient;
        _settings = options.Value;
    }

    public async Task UploadAsync(
        Stream fileStream,
        string objectName,
        string contentType,
        long fileSize,
        CancellationToken cancellationToken = default)
    {
        var bucketExists = await _minioClient.BucketExistsAsync(
            new BucketExistsArgs()
                .WithBucket(_settings.BucketName),
            cancellationToken);

        if (!bucketExists)
        {
            await _minioClient.MakeBucketAsync(
                new MakeBucketArgs()
                    .WithBucket(_settings.BucketName),
                cancellationToken);
        }

        var putObjectArgs = new PutObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName)
            .WithStreamData(fileStream)
            .WithObjectSize(fileSize)
            .WithContentType(contentType);

        await _minioClient.PutObjectAsync(
            putObjectArgs,
            cancellationToken);
    }

    public async Task<Stream> DownloadAsync(
        string objectName,
        CancellationToken cancellationToken = default)
    {
        var memoryStream = new MemoryStream();

        var getObjectArgs = new GetObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName)
            .WithCallbackStream(stream =>
            {
                stream.CopyTo(memoryStream);
            });

        await _minioClient.GetObjectAsync(
            getObjectArgs,
            cancellationToken);

        memoryStream.Position = 0;
        return memoryStream;
    }

    public async Task DeleteAsync(
        string objectName,
        CancellationToken cancellationToken = default)
    {
        var removeObjectArgs = new RemoveObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName);

        await _minioClient.RemoveObjectAsync(
            removeObjectArgs,
            cancellationToken);
    }

    public async Task<string> CreatePresignedUrlAsync(
        string objectName,
        int expirySeconds = 300,
        CancellationToken cancellationToken = default)
    {
        var args = new PresignedGetObjectArgs()
            .WithBucket(_settings.BucketName)
            .WithObject(objectName)
            .WithExpiry(expirySeconds);

        if (string.IsNullOrWhiteSpace(_settings.PublicEndpoint) ||
            string.Equals(_settings.PublicEndpoint, _settings.Endpoint, StringComparison.OrdinalIgnoreCase))
        {
            return await _minioClient.PresignedGetObjectAsync(args);
        }

        var publicClient = new MinioClient()
            .WithEndpoint(_settings.PublicEndpoint)
            .WithCredentials(_settings.AccessKey, _settings.SecretKey)
            .WithSSL(_settings.UseSSL)
            .Build();
        return await publicClient.PresignedGetObjectAsync(args);
    }
}
