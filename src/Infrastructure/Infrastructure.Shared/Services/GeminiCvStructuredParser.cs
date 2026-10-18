#nullable enable
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading;
using System.Threading.Tasks;
using Application.DTOs.CV;
using Application.Exceptions;
using Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Shared.Services;

public sealed class GeminiCvStructuredParser(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<GeminiCvStructuredParser> logger) : ICvStructuredParser
{
    private const int DefaultMaxAttempts = 5;

    // LLM sinh JSON cho cả CV có thể mất vài chục giây, nhưng khi connection
    // treo (mạng Docker/VPN không ổn định) phải cắt sớm từng lần thử để còn
    // thời gian retry thay vì để HttpClient.Timeout nuốt trọn 90s rồi trả 500.
    private static readonly TimeSpan AttemptTimeout = TimeSpan.FromSeconds(60);

    // Backoff lũy tiến có jitter khi Gemini trả lỗi tạm thời (429/5xx).
    private static readonly TimeSpan BaseRetryDelay = TimeSpan.FromMilliseconds(700);
    private static readonly TimeSpan MaxRetryDelay = TimeSpan.FromSeconds(8);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    public async Task<ParsedCvDto> ParseAsync(
        string rawText,
        CancellationToken cancellationToken = default)
    {
        var apiKey = configuration["Gemini:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            logger.LogError(
                "Thiếu Gemini:ApiKey. Khai báo key vào appsettings.Development.json rồi restart backend.");
            throw new InvalidOperationException(
                "Chưa khai báo Gemini:ApiKey (xem log backend để biết cách khắc phục).");
        }

        var models = ResolveModels(configuration);
        var maxAttempts = ResolveMaxAttempts(configuration);
        var requestBody = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new { text = BuildPrompt(rawText) }
                    }
                }
            },
            generationConfig = new
            {
                responseMimeType = "application/json",
                temperature = 0.1
            }
        };

        string? previousModel = null;
        for (var attempt = 1; attempt <= maxAttempts; attempt++)
        {
            // Xoay vòng qua danh sách model: mỗi lần thử lại (transient) nhảy sang
            // model kế tiếp để né bucket quota/overload riêng của từng model.
            var currentModel = models[(attempt - 1) % models.Count];
            if (previousModel is not null
                && !string.Equals(currentModel, previousModel, StringComparison.Ordinal))
            {
                logger.LogWarning(
                    "Gemini chuyển sang model dự phòng {Model} (lần {Attempt}/{MaxAttempts}).",
                    currentModel,
                    attempt,
                    maxAttempts);
            }
            previousModel = currentModel;

            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"v1beta/models/{Uri.EscapeDataString(currentModel)}:generateContent");
            request.Headers.Add("x-goog-api-key", apiKey);
            request.Content = JsonContent.Create(requestBody);

            string responseJson;
            HttpStatusCode statusCode;
            bool isSuccess;
            TimeSpan? retryAfter;
            try
            {
                using var attemptCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                attemptCts.CancelAfter(AttemptTimeout);

                using var response = await httpClient.SendAsync(request, attemptCts.Token);
                statusCode = response.StatusCode;
                isSuccess = response.IsSuccessStatusCode;
                retryAfter = response.Headers.RetryAfter?.Delta;
                responseJson = await response.Content.ReadAsStringAsync(attemptCts.Token);
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
                logger.LogWarning(
                    "Gemini parse CV quá thời gian chờ {Timeout}s. lần={Attempt}/{MaxAttempts}.",
                    AttemptTimeout.TotalSeconds,
                    attempt,
                    maxAttempts);
                if (attempt >= maxAttempts)
                {
                    throw new ApiException(
                        "Gemini không phản hồi kịp thời. Vui lòng thử lại sau ít phút.",
                        (int)HttpStatusCode.ServiceUnavailable);
                }
                await Task.Delay(TimeSpan.FromSeconds(attempt), cancellationToken);
                continue;
            }
            catch (HttpRequestException ex)
            {
                logger.LogWarning(
                    "Gemini parse CV lỗi mạng: {Error}. lần={Attempt}/{MaxAttempts}.",
                    ex.Message,
                    attempt,
                    maxAttempts);
                if (attempt >= maxAttempts)
                {
                    throw new ApiException(
                        "Không kết nối được Gemini. Vui lòng kiểm tra kết nối mạng rồi thử lại.",
                        (int)HttpStatusCode.ServiceUnavailable);
                }
                await Task.Delay(TimeSpan.FromSeconds(attempt), cancellationToken);
                continue;
            }

            if (!isSuccess)
            {
                var isTransient = (int)statusCode is
                    (int)HttpStatusCode.TooManyRequests or
                    (int)HttpStatusCode.BadGateway or
                    (int)HttpStatusCode.ServiceUnavailable or
                    (int)HttpStatusCode.GatewayTimeout;

                if (isTransient && attempt < maxAttempts)
                {
                    var delay = ComputeRetryDelay(attempt, retryAfter);
                    logger.LogWarning(
                        "Gemini parse CV tạm thời thất bại ({Model}). Status={Status}, lần={Attempt}/{MaxAttempts}. Thử lại sau {DelayMs}ms.",
                        currentModel,
                        (int)statusCode,
                        attempt,
                        maxAttempts,
                        (int)delay.TotalMilliseconds);
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }

                logger.LogError(
                    "Gemini parse CV thất bại. Status={Status}. Body={Body}",
                    (int)statusCode,
                    Truncate(responseJson));
                throw new ApiException(
                    isTransient
                        ? "Gemini đang quá tải. Vui lòng thử lại sau ít phút."
                        : $"Gemini không thể phân tích CV ({(int)statusCode}).",
                    isTransient ? (int)HttpStatusCode.ServiceUnavailable : (int)HttpStatusCode.BadGateway);
            }

            ParsedCvDto? parsed;
            try
            {
                using var document = JsonDocument.Parse(responseJson);
                var json = ExtractCandidateText(document.RootElement);
                parsed = string.IsNullOrWhiteSpace(json)
                    ? null
                    : JsonSerializer.Deserialize<ParsedCvDto>(json, JsonOptions);
            }
            catch (JsonException ex)
            {
                logger.LogError(
                    "Gemini parse CV trả về JSON không hợp lệ. Lỗi={Error}. Body={Body}",
                    ex.Message,
                    Truncate(responseJson));
                throw new ApiException(
                    "Gemini trả về dữ liệu CV không hợp lệ. Vui lòng thử lại.",
                    (int)HttpStatusCode.BadGateway);
            }

            if (parsed is null)
            {
                logger.LogError(
                    "Gemini parse CV không có nội dung phân tích được. Body={Body}",
                    Truncate(responseJson));
                throw new ApiException(
                    "Gemini không trả về nội dung CV hợp lệ (nội dung có thể bị chặn).",
                    (int)HttpStatusCode.BadGateway);
            }

            parsed.ThongTinLienHe ??= new ParsedThongTinLienHeDto();
            parsed.HocVan ??= [];
            parsed.KinhNghiemLamViec ??= [];
            parsed.DuAn ??= [];
            parsed.KyNang ??= [];
            parsed.ChungChi ??= [];
            return parsed;
        }

        throw new ApiException("Gemini đang quá tải. Vui lòng thử lại sau ít phút.", (int)HttpStatusCode.ServiceUnavailable);
    }

    // Danh sách model theo thứ tự ưu tiên: Gemini:Model (chính), rồi
    // Gemini:Models:0..n (nhiều dự phòng), rồi Gemini:FallbackModel (tương thích cũ).
    private static List<string> ResolveModels(IConfiguration configuration)
    {
        var models = new List<string>();

        void Add(string? value)
        {
            if (string.IsNullOrWhiteSpace(value)) return;
            var model = value.Trim();
            if (!models.Exists(m => string.Equals(m, model, StringComparison.OrdinalIgnoreCase))) models.Add(model);
        }

        var primary = configuration["Gemini:Model"];
        Add(string.IsNullOrWhiteSpace(primary) ? "gemini-3.6-flash" : primary);

        foreach (var child in configuration.GetSection("Gemini:Models").GetChildren())
        {
            Add(child.Value);
        }

        Add(configuration["Gemini:FallbackModel"]);

        return models;
    }

    private static int ResolveMaxAttempts(IConfiguration configuration) =>
        int.TryParse(configuration["Gemini:MaxAttempts"], out var value) && value > 0
            ? value
            : DefaultMaxAttempts;

    // Backoff lũy tiến có jitter (±20%) để tránh dồn dập khi Gemini quá tải.
    // Ưu tiên Retry-After của Gemini nếu có (đã giới hạn trần MaxRetryDelay).
    private static TimeSpan ComputeRetryDelay(int attempt, TimeSpan? retryAfter)
    {
        if (retryAfter is { } retry && retry > TimeSpan.Zero)
        {
            return retry > MaxRetryDelay ? MaxRetryDelay : retry;
        }

        var backoffMs = BaseRetryDelay.TotalMilliseconds * Math.Pow(2, attempt - 1);
        var capped = Math.Min(backoffMs, MaxRetryDelay.TotalMilliseconds);
        var jitter = 0.8 + (Random.Shared.NextDouble() * 0.4); // 0.8x – 1.2x
        return TimeSpan.FromMilliseconds(capped * jitter);
    }

    // Trích candidates[0].content.parts[0].text; trả null nếu Gemini trả 200
    // nhưng thiếu shape (ví dụ bị chặn bởi bộ lọc an toàn).
    private static string? ExtractCandidateText(JsonElement root)
    {
        if (root.ValueKind != JsonValueKind.Object
            || !root.TryGetProperty("candidates", out var candidates)
            || candidates.ValueKind != JsonValueKind.Array
            || candidates.GetArrayLength() == 0
            || candidates[0].ValueKind != JsonValueKind.Object
            || !candidates[0].TryGetProperty("content", out var content)
            || content.ValueKind != JsonValueKind.Object
            || !content.TryGetProperty("parts", out var parts)
            || parts.ValueKind != JsonValueKind.Array
            || parts.GetArrayLength() == 0
            || parts[0].ValueKind != JsonValueKind.Object
            || !parts[0].TryGetProperty("text", out var text)
            || text.ValueKind != JsonValueKind.String)
        {
            return null;
        }
        return text.GetString();
    }

    private static string Truncate(string value) =>
        value.Length > 500 ? value[..500] : value;

    private static string BuildPrompt(string rawText) => $$"""
        Trích xuất CV dưới đây thành đúng một JSON object theo schema này:
        {
          "ThongTinLienHe": {
            "HoTen": string|null, "Email": string|null, "SDT": string|null,
            "DiaChi": string|null, "GitHub": string|null, "LinkedIn": string|null,
            "Portfolio": string|null, "GioiTinh": string|null, "NgaySinh": string|null,
            "ViTriUngTuyen": string|null, "MucLuongMongMuon": number|null,
            "GioiThieuBanThan": string|null, "AnhDaiDienUrl": string|null
          },
          "HocVan": [{ "Truong": string|null, "ChuyenNganh": string|null,
            "BangCap": string|null, "TuNgay": string|null, "DenNgay": string|null,
            "IsHienTai": boolean, "MoTa": string|null, "ThuTu": number }],
          "KinhNghiemLamViec": [{ "TenCongTy": string|null, "ChucDanh": string|null,
            "DiaChi": string|null, "TuNgay": string|null, "DenNgay": string|null,
            "IsHienTai": boolean, "MoTa": string|null,
            "KyNangSuDung": [{ "KyNangId": null, "TenKyNang": string }], "ThuTu": number }],
          "DuAn": [{ "TenDuAn": string|null, "VaiTro": string|null,
            "TuNgay": string|null, "DenNgay": string|null, "IsHienTai": boolean,
            "Link": string|null, "MoTa": string|null,
            "CongNghe": [{ "KyNangId": null, "TenKyNang": string }], "ThuTu": number }],
          "KyNang": [{ "KyNangId": null, "TenKyNang": string,
            "MucDoThanhThao": 0|1|2|3|null, "SoNamKinhNghiem": number|null, "ThuTu": number }],
          "ChungChi": [{ "TenChungChi": string|null, "DonViCap": string|null,
            "NgayCap": string|null, "NgayHetHan": string|null, "MaXacMinh": string|null,
            "CredentialUrl": string|null, "ThuTu": number }]
        }

        Quy tắc:
        - Không suy diễn dữ liệu không xuất hiện trong CV; dùng null hoặc mảng rỗng.
        - Ngày đầy đủ dùng dd/MM/yyyy, tháng-năm dùng MM/yyyy.
        - ThuTu bắt đầu từ 0 theo thứ tự xuất hiện.
        - Chỉ trả về JSON, không kèm markdown hoặc giải thích.

        <cv_text>
        {{rawText}}
        </cv_text>
        """;
}
