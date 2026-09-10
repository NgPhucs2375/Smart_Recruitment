#pragma warning disable MAAI001
using System.ComponentModel;
using System.Text.Json;
using Microsoft.Agents.AI;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RecruitmentAgent.AgentFactories;
using RecruitmentAgent.Chunker;
using RecruitmentAgent.Common.Interfaces;
using RecruitmentAgent.Services;

namespace RecruitmentAgent.AgentFactories;

/// <summary>
/// Recruitment-domain port of form-filling <c>agent/AgentFactories/FormFillAgentFactory.cs</c>.
/// Tools: <c>parse_cv_document</c> → <c>search_tin_tuyen_dung</c> → <c>recommend_cv_matches</c>.
/// No Minimal API surface: <c>Route</c> is informational; hosting stays on the
/// existing <c>MapAGUIServer</c> + Controllers pipeline in WebApp.Server.
/// </summary>
public sealed class CvMatchingAgentFactory : IAgentFactory
{
    public string Route => "/cvMatching";

    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly JsonSerializerOptions _jsonSerializerOptions;
    private readonly IChatClient _chatClient;
    private readonly ILogger _logger;
    private readonly IDocumentParserStrategy _parserStrategy;
    private readonly IServiceScopeFactory _scopeFactory;

    public CvMatchingAgentFactory(
        IChatClient chatClient,
        ILoggerFactory loggerFactory,
        IHttpContextAccessor httpContextAccessor,
        JsonSerializerOptions jsonSerializerOptions,
        IDocumentParserStrategy parserStrategy,
        IServiceScopeFactory scopeFactory
        )
    {
        _chatClient = chatClient;
        _httpContextAccessor = httpContextAccessor;
        _jsonSerializerOptions = jsonSerializerOptions;
        _logger = loggerFactory.CreateLogger<CvMatchingAgentFactory>();
        _parserStrategy = parserStrategy;
        _scopeFactory = scopeFactory;

        _logger.LogInformation("CV parser strategy: {Strategy}", _parserStrategy.GetType().Name);
    }

    public AIAgent CreateAgent()
    {
        // Same construction style as WebApp.Server AIAgentExtension
        // (new ChatClientAgent(...)); tools registered via AIFunctionFactory.
        var innerAgent = new ChatClientAgent(
            _chatClient,
            name: "CvMatchingAgent",
            instructions: """
                [CRITICAL] Bạn là trợ lý tuyển dụng. LUÔN trả lời bằng tiếng Việt.

                Tools:
                - parse_cv_document: trích xuất text từ CV ứng viên đã upload. Trả về LIST { documentId, mediaType }.
                - search_tin_tuyen_dung: tìm tin tuyển dụng đang tuyển khớp với nội dung CV.
                - recommend_cv_matches: ghi nhận các tin phù hợp (gọi NHIỀU lần nếu có nhiều tin).

                WORKFLOW:
                1. Khi có file upload (system message báo "uploaded X CV file(s)"): gọi parse_cv_document.
                2. Đọc nội dung CV, gọi search_tin_tuyen_dung với query = vị trí + kỹ năng chính trong CV.
                3. Với MỖI tin tìm được: đối chiếu kỹ năng/yêu cầu, gọi recommend_cv_matches với tinId + lý do + điểm 0-100.
                4. Báo cáo NGAY bằng tiếng Việt khi mỗi tin được ghi nhận, không chờ xử lý hết.
                5. Không bịa điểm số hay kỹ năng không có trong CV/tin.
                """,
            tools:
            [
                AIFunctionFactory.Create(ParseCvDocumentAsync, options: new() { Name = "parse_cv_document", SerializerOptions = _jsonSerializerOptions }),
                AIFunctionFactory.Create(SearchTinTuyenDungAsync, options: new() { Name = "search_tin_tuyen_dung", SerializerOptions = _jsonSerializerOptions }),
                AIFunctionFactory.Create(RecommendCvMatchesAsync, options: new() { Name = "recommend_cv_matches", SerializerOptions = _jsonSerializerOptions }),
            ]);

        return new CvMatchingAgent(innerAgent, _httpContextAccessor, _logger);
    }

    // ================= Tools =================

    [Description("Parse uploaded CV files into text. Returns a LIST of parsed CVs, one item per file. Each item has documentId and mediaType.")]
    private async Task<List<CvParsedDto>> ParseCvDocumentAsync(CancellationToken cancellationToken = default)
    {
        var files = _httpContextAccessor.HttpContext?.Items["__attachments__"] as List<ExtractedFile> ?? [];
        var docFiles = files.Where(f => f.Bytes.Length > 0).ToList();

        if (docFiles.Count == 0)
            return [new CvParsedDto { DocumentId = "none" }];

        var parsed = new List<CvParsedDto>();
        for (var idx = 0; idx < docFiles.Count; idx++)
        {
            var file = docFiles[idx];
            try
            {
                var content = await _parserStrategy.ParseAsync(file.Bytes, GuessFileName(file.MediaType), file.MediaType, cancellationToken);
                if (string.IsNullOrWhiteSpace(content))
                {
                    parsed.Add(new CvParsedDto { DocumentId = $"none_{idx + 1}", MediaType = file.MediaType });
                    continue;
                }

                // Chunk (parent/child) for downstream matching; content cached in HttpContext for this run.
                var parentCfg = new SplitterConfig { ChunkSize = 1024, ChunkOverlap = 100 };
                var childCfg = new SplitterConfig { ChunkSize = 512, ChunkOverlap = 80 };
                var chunks = SimpleChunker.SplitTextParentChild(content, parentCfg, childCfg);
                _logger.LogInformation(
                    "Parsed CV {Idx}: {Length} chars → {Parents} parents, {Children} children",
                    idx + 1, content.Length, chunks.Parents.Count, chunks.Children.Count);

                var documentId = $"cv_{idx + 1}_{Guid.NewGuid():N}";
                if (_httpContextAccessor.HttpContext is { } ctx)
                {
                    var cache = ctx.Items["__cv_contents__"] as Dictionary<string, string> ?? [];
                    cache[documentId] = content;
                    ctx.Items["__cv_contents__"] = cache;
                }

                parsed.Add(new CvParsedDto { DocumentId = documentId, MediaType = file.MediaType });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "CV parsing failed for file {Idx}", idx + 1);
                parsed.Add(new CvParsedDto { DocumentId = $"none_{idx + 1}", MediaType = file.MediaType });
            }
        }

        return parsed.Count > 0 ? parsed : [new CvParsedDto { DocumentId = "none" }];
    }

    [Description("Search job posts (tin tuyển dụng đang tuyển) by keywords from the CV. Returns matches sorted by relevance.")]
    private async Task<List<TinMatchDto>> SearchTinTuyenDungAsync(
        [Description("Search query: job title + key skills extracted from the CV")] string query,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var scope = _scopeFactory.CreateScope();
            var knowledge = scope.ServiceProvider.GetRequiredService<ICvKnowledgeService>();
            var matches = await knowledge.SearchTinTuyenDungAsync(query, 10, cancellationToken);
            _logger.LogInformation("search_tin_tuyen_dung returned {Count} results for: {Query}", matches.Count, query);
            return matches.Select(m => new TinMatchDto
            {
                TinId = m.Id,
                TieuDe = m.TieuDe,
                MoTa = m.MoTaCongViec,
                YeuCau = m.YeuCauCongViec,
                DiaDiem = m.DiaDiemLamViec,
                Score = m.Score,
            }).ToList();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "search_tin_tuyen_dung failed for query: {Query}", query);
            return [];
        }
    }

    [Description("Register a matching job post for the parsed CV. Can be called MULTIPLE times if several posts match.")]
    private Task<string> RecommendCvMatchesAsync(
        [Description("The ID of the matching tin tuyển dụng")] int tinId,
        [Description("The display title of the tin")] string tieuDe,
        [Description("Why this post matches the CV (Vietnamese)")] string lyDo,
        [Description("Fit score 0-100")] int diemPhuHop,
        CancellationToken cancellationToken = default)
    {
        if (_httpContextAccessor.HttpContext is { } ctx)
        {
            var matches = ctx.Items["__cv_matches__"] as List<CvMatchResult> ?? [];
            matches.Add(new CvMatchResult { TinId = tinId, TieuDe = tieuDe, LyDo = lyDo, DiemPhuHop = diemPhuHop });
            ctx.Items["__cv_matches__"] = matches;
            _logger.LogInformation("recommend_cv_matches registered: tinId={TinId} (total={Count})", tinId, matches.Count);
        }
        return Task.FromResult($"Match registered for '{tieuDe}'.");
    }

    private static string GuessFileName(string mediaType) => mediaType switch
    {
        "application/pdf" => "cv.pdf",
        "image/png" => "cv.png",
        "image/jpeg" or "image/jpg" => "cv.jpg",
        "image/webp" => "cv.webp",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" => "cv.docx",
        "text/plain" => "cv.txt",
        _ => "cv",
    };

    private sealed class CvParsedDto
    {
        public string DocumentId { get; set; } = "";
        public string? MediaType { get; set; }
    }

    private sealed class TinMatchDto
    {
        public int TinId { get; set; }
        public string? TieuDe { get; set; }
        public string? MoTa { get; set; }
        public string? YeuCau { get; set; }
        public string? DiaDiem { get; set; }
        public int Score { get; set; }
    }
}
