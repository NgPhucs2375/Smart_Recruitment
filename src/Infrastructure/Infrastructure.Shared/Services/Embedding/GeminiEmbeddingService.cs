using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Application.Interfaces.Repositories;
using Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Shared.Services.Embedding;

public class GeminiEmbeddingService : IEmbeddingRepository
{
    private readonly HttpClient _httpClient;
    private readonly string _apiKey;
    private readonly string _model;
    private readonly int _outputDimensions;
    private static string GetTaskType(
    EmbeddingTaskType taskType)
    {
        return taskType switch
        {
            EmbeddingTaskType.RetrievalQuery
                => "RETRIEVAL_QUERY",

            EmbeddingTaskType.RetrievalDocument
                => "RETRIEVAL_DOCUMENT",

            _ => "SEMANTIC_SIMILARITY"
        };
    }

    public GeminiEmbeddingService(
        HttpClient httpClient,
        IConfiguration configuration)
    {
        _httpClient = httpClient;

        _apiKey = configuration["Gemini:ApiKey"]
            ?? throw new InvalidOperationException(
                "Gemini:ApiKey chưa được cấu hình.");

        _model = configuration["Gemini:EmbeddingModel"]
            ?? "gemini-embedding-001";

        _outputDimensions =
            configuration.GetValue<int?>(
                "Gemini:OutputDimensions")
            ?? 768;
    }

    public async Task<float[]> GenerateEmbeddingAsync(
        string text,
        EmbeddingTaskType taskType,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new ArgumentException(
                "Text không được rỗng.",
                nameof(text));
        }

        var request = new
        {
            model = $"models/{_model}",

            content = new
            {
                parts = new[]
                {
                    new
                    {
                        text
                    }
                }
            },

            taskType = GetTaskType(taskType),

            outputDimensionality = _outputDimensions
        };

        using var httpRequest =
            new HttpRequestMessage(
                HttpMethod.Post,
                $"/v1beta/models/{_model}:embedContent");

        httpRequest.Headers.Add(
            "x-goog-api-key",
            _apiKey);

        httpRequest.Content =
            JsonContent.Create(request);

        var response =
            await _httpClient.SendAsync(
                httpRequest,
                cancellationToken);

        var json =
            await response.Content.ReadAsStringAsync(
                cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                $"Gemini embedding error " +
                $"{(int)response.StatusCode}: {json}");
        }

        var result =
            JsonSerializer.Deserialize<GeminiEmbeddingResponse>(
                json,
                new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

        if (result?.Embedding?.Values == null)
        {
            throw new InvalidOperationException(
                "Gemini không trả embedding.");
        }

        return result.Embedding.Values;
    }

    public async Task<IReadOnlyList<float[]>>
        GenerateEmbeddingsAsync(
            IReadOnlyList<string> texts,
            EmbeddingTaskType taskType,
            CancellationToken cancellationToken = default)
    {
        var results = new List<float[]>();

        foreach (var text in texts)
        {
            var embedding =
                await GenerateEmbeddingAsync(
                    text,
                    taskType,
                    cancellationToken);

            results.Add(embedding);
        }

        return results;
    }

    private sealed class GeminiEmbeddingResponse
    {
        public GeminiEmbedding? Embedding { get; set; }
    }

    private sealed class GeminiEmbedding
    {
        public float[] Values { get; set; }
            = Array.Empty<float>();
    }
}