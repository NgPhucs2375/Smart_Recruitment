using System;
using System.Net.Http;
using System.Net.Http.Json;
using System.Net;
using System.Text.Json;
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
    private const int MaxAttempts = 3;
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true
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

        var model = configuration["Gemini:Model"] ?? "gemini-3.6-flash";
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

        for (var attempt = 1; attempt <= MaxAttempts; attempt++)
        {
            using var request = new HttpRequestMessage(
                HttpMethod.Post,
                $"v1beta/models/{Uri.EscapeDataString(model)}:generateContent");
            request.Headers.Add("x-goog-api-key", apiKey);
            request.Content = JsonContent.Create(requestBody);

            using var response = await httpClient.SendAsync(request, cancellationToken);
            var responseJson = await response.Content.ReadAsStringAsync(cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                var isTransient = response.StatusCode is
                    HttpStatusCode.TooManyRequests or
                    HttpStatusCode.BadGateway or
                    HttpStatusCode.ServiceUnavailable or
                    HttpStatusCode.GatewayTimeout;

                if (isTransient && attempt < MaxAttempts)
                {
                    var delay = response.Headers.RetryAfter?.Delta
                        ?? TimeSpan.FromSeconds(attempt);
                    if (delay > TimeSpan.FromSeconds(5))
                        delay = TimeSpan.FromSeconds(5);

                    logger.LogWarning(
                        "Gemini parse CV tạm thời thất bại. Status={Status}, lần={Attempt}/{MaxAttempts}. Thử lại sau {DelayMs}ms.",
                        (int)response.StatusCode,
                        attempt,
                        MaxAttempts,
                        delay.TotalMilliseconds);
                    await Task.Delay(delay, cancellationToken);
                    continue;
                }

                logger.LogError(
                    "Gemini parse CV thất bại. Status={Status}. Body={Body}",
                    (int)response.StatusCode,
                    responseJson.Length > 500 ? responseJson[..500] : responseJson);
                throw new ApiException(
                    isTransient
                        ? "Gemini đang quá tải. Vui lòng thử lại sau ít phút."
                        : $"Gemini không thể phân tích CV ({(int)response.StatusCode}).",
                    isTransient ? (int)HttpStatusCode.ServiceUnavailable : (int)HttpStatusCode.BadGateway);
            }

            using var document = JsonDocument.Parse(responseJson);
            var json = document.RootElement
                .GetProperty("candidates")[0]
                .GetProperty("content")
                .GetProperty("parts")[0]
                .GetProperty("text")
                .GetString();

            var parsed = string.IsNullOrWhiteSpace(json)
                ? null
                : JsonSerializer.Deserialize<ParsedCvDto>(json, JsonOptions);

            if (parsed is null)
                throw new ApiException("Gemini trả về dữ liệu CV không hợp lệ.", (int)HttpStatusCode.BadGateway);

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
