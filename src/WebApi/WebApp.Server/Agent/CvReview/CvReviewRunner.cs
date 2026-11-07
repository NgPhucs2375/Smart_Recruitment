using System.Text.Json;
using System.Text.Json.Serialization;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.KetQuaPhanTichCv.Commands.LuuKetQuaDanhGiaCv;
using Application.Features.KetQuaPhuHop.Queries.GetCvJobMatch;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Logging;

namespace WebApp.Server.Agent.CvReview;

/// <summary>
/// Chạy agent đánh giá CV + lưu kết quả. Điểm phù hợp luôn lấy từ scorer tất định;
/// agent chỉ viết nhận xét. Agent lỗi/timeout thì lưu bản fallback theo luật, không trả 500.
/// </summary>
internal sealed class CvReviewRunner(
    CvReviewAgentFactory agentFactory,
    ISender sender,
    ILogger<CvReviewRunner> logger)
{
    private static readonly TimeSpan AgentTimeout = TimeSpan.FromSeconds(70);

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString,
    };

    private static readonly HashSet<string> ValidSections = new(StringComparer.Ordinal)
    {
        "ky-nang", "kinh-nghiem", "hoc-van", "du-an", "tong-the"
    };

    public async Task<Response<CvJobMatchViewModel>> RunAsync(
        int cvId,
        int tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        var matchResponse = await sender.Send(
            new GetCvJobMatchQuery(cvId, tinTuyenDungId), cancellationToken);
        if (!matchResponse.Succeeded || matchResponse.Data is null)
            return matchResponse;

        var match = matchResponse.Data;
        await sender.Send(new LuuKetQuaDanhGiaCvCommand
        {
            CvUngVienId = cvId,
            TrangThai = TrangThaiPhanTichAgent.DangPhanTich,
            TinTuyenDungId = tinTuyenDungId,
        }, cancellationToken);

        var cvResponse = await sender.Send(new GetCVUngVienByIdQuery { Id = cvId }, cancellationToken);
        var review = await TryRunAgentAsync(cvId, tinTuyenDungId, cancellationToken);

        if (review is not null)
        {
            var diem = review.DiemTongQuan > 0
                ? review.DiemTongQuan
                : (int)Math.Round(match.DiemPhuHop * 100);
            diem = Math.Clamp(diem, 0, 100);
            if (!match.MeetsMandatory)
                diem = Math.Min(diem, 70);

            await SaveAsync(cvId, tinTuyenDungId, match, review with { DiemTongQuan = diem },
                daDanhGiaBangAi: true, TrangThaiPhanTichAgent.HoanThanh, cancellationToken);
            return new Response<CvJobMatchViewModel>(match, "Đã đánh giá CV bằng AI agent.");
        }

        var fallback = BuildFallback(match, cvResponse.Succeeded ? cvResponse.Data : null);
        await SaveAsync(cvId, tinTuyenDungId, match, fallback,
            daDanhGiaBangAi: false, TrangThaiPhanTichAgent.ThatBai, cancellationToken);
        return new Response<CvJobMatchViewModel>(match,
            "AI chưa phản hồi kịp, hệ thống đã tạo đánh giá nhanh từ điểm phù hợp.");
    }

    private async Task<ReviewPayload?> TryRunAgentAsync(
        int cvId,
        int tinTuyenDungId,
        CancellationToken cancellationToken)
    {
        try
        {
            var agent = agentFactory.CreateAgent();
            using var cts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            cts.CancelAfter(AgentTimeout);
            var response = await agent.RunAsync(
                [
                    new ChatMessage(ChatRole.User,
                        $"Đánh giá CV id={cvId} theo tin tuyển dụng id={tinTuyenDungId}. " +
                        "Gọi đủ 3 tool rồi trả JSON theo schema.")
                ],
                cancellationToken: cts.Token);

            var review = ParseReview(response.Text);
            if (review is null)
                logger.LogWarning(
                    "CvReview agent trả JSON không hợp lệ. CvId={CvId}, TinId={TinId}, Text={Text}",
                    cvId, tinTuyenDungId, Truncate(response.Text, 500));
            return review;
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException)
        {
            logger.LogWarning(
                "CvReview agent quá thời gian {Timeout}s. CvId={CvId}, TinId={TinId}",
                AgentTimeout.TotalSeconds, cvId, tinTuyenDungId);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "CvReview agent lỗi. CvId={CvId}, TinId={TinId}", cvId, tinTuyenDungId);
            return null;
        }
    }

    private async Task SaveAsync(
        int cvId,
        int tinTuyenDungId,
        CvJobMatchViewModel match,
        ReviewPayload review,
        bool daDanhGiaBangAi,
        TrangThaiPhanTichAgent trangThai,
        CancellationToken cancellationToken)
        => await sender.Send(new LuuKetQuaDanhGiaCvCommand
        {
            CvUngVienId = cvId,
            TrangThai = trangThai,
            TinTuyenDungId = tinTuyenDungId,
            DiemTongQuan = review.DiemTongQuan,
            DiemPhuHop = match.DiemPhuHop,
            MatchingVersion = match.MatchingVersion,
            NhanXet = review.NhanXet,
            DiemManh = review.DiemManh,
            DiemYeu = review.DiemYeu,
            GoiY = review.GoiY,
            DaDanhGiaBangAi = daDanhGiaBangAi,
        }, cancellationToken);

    private static ReviewPayload? ParseReview(string? text)
    {
        if (string.IsNullOrWhiteSpace(text)) return null;

        var start = text.IndexOf('{');
        var end = text.LastIndexOf('}');
        if (start < 0 || end <= start) return null;

        try
        {
            var dto = JsonSerializer.Deserialize<ReviewDto>(text[start..(end + 1)], JsonOptions);
            if (dto is null) return null;

            var nhanXet = Trim(dto.NhanXet, 600);
            var manh = CleanList(dto.DiemManh);
            var yeu = CleanList(dto.DiemYeu);
            var goiY = (dto.GoiY ?? new List<GoiYDto>())
                .Where(x => !string.IsNullOrWhiteSpace(x.Viec))
                .Take(5)
                .Select(x => new CvGoiY(NormalizeSection(x.Phan), Trim(x.Viec, 160)!))
                .ToList();

            if (string.IsNullOrWhiteSpace(nhanXet) && manh.Count == 0 && yeu.Count == 0)
                return null;

            return new ReviewPayload(Math.Clamp(dto.DiemTongQuan, 0, 100), nhanXet, manh, yeu, goiY);
        }
        catch (JsonException)
        {
            return null;
        }
    }

    private static ReviewPayload BuildFallback(CvJobMatchViewModel match, CvDetailDto? cv)
    {
        var manh = new List<string>();
        var yeu = new List<string>();
        var goiY = new List<CvGoiY>();
        var noiDung = cv?.NoiDung;

        if (noiDung is not null)
        {
            if (noiDung.KyNang.Count > 0)
                manh.Add($"CV khai báo {noiDung.KyNang.Count} kỹ năng.");
            if (noiDung.KinhNghiemLamViec.Count > 0)
                manh.Add($"CV có {noiDung.KinhNghiemLamViec.Count} mục kinh nghiệm làm việc.");
            if (noiDung.DuAn.Count > 0)
                manh.Add($"CV có {noiDung.DuAn.Count} dự án tiêu biểu.");
            if (noiDung.HocVan.Count > 0)
                manh.Add("CV có thông tin học vấn.");

            if (string.IsNullOrWhiteSpace(noiDung.ThongTinLienHe?.Email))
            {
                yeu.Add("Thiếu email liên hệ.");
                goiY.Add(new CvGoiY("tong-the", "Bổ sung email liên hệ trong phần thông tin cá nhân."));
            }
            if (string.IsNullOrWhiteSpace(noiDung.ThongTinLienHe?.ViTriUngTuyen))
            {
                yeu.Add("Chưa nêu vị trí ứng tuyển mục tiêu.");
                goiY.Add(new CvGoiY("tong-the", "Nêu rõ vị trí ứng tuyển ở đầu CV."));
            }
            if (noiDung.KyNang.Count == 0)
            {
                yeu.Add("CV chưa khai báo kỹ năng chuyên môn.");
                goiY.Add(new CvGoiY("ky-nang", "Bổ sung kỹ năng chuyên môn khớp với JD."));
            }
            if (noiDung.DuAn.Count == 0)
            {
                yeu.Add("CV chưa có dự án minh hoạ năng lực.");
                goiY.Add(new CvGoiY("du-an", "Thêm 1-2 dự án kèm công nghệ và kết quả cụ thể."));
            }
        }

        if (match.KyNangThoa.Count > 0)
            manh.Add($"Khớp {match.KyNangThoa.Count} kỹ năng của tin: {ShortList(match.KyNangThoa)}.");

        if (match.KyNangBatBuocThieu.Count > 0)
        {
            yeu.Add($"Thiếu kỹ năng bắt buộc: {ShortList(match.KyNangBatBuocThieu)}.");
            goiY.Add(new CvGoiY("ky-nang",
                $"Bổ sung bằng chứng cho kỹ năng bắt buộc còn thiếu: {ShortList(match.KyNangBatBuocThieu)}."));
        }

        if (match.KyNangThieu.Count > 0)
        {
            yeu.Add($"Tin yêu cầu nhưng CV chưa thể hiện: {ShortList(match.KyNangThieu)}.");
            goiY.Add(new CvGoiY("ky-nang",
                $"Bổ sung kỹ năng còn thiếu trong CV: {ShortList(match.KyNangThieu)}."));
        }

        if (manh.Count == 0) manh.Add("Chưa đủ dữ liệu để xác định điểm mạnh của CV.");
        if (yeu.Count == 0) yeu.Add("Chưa thấy điểm yếu rõ ràng so với tin này.");

        var diem = (int)Math.Round(match.DiemPhuHop * 100);
        var nhanXet = $"Đánh giá nhanh theo scorer {match.MatchingVersion}: mức phù hợp {diem}% " +
                      $"({match.PhanLoai}) với tin \"{match.TieuDe}\" tại {match.TenDoanhNghiep}.";

        return new ReviewPayload(
            diem,
            Trim(nhanXet, 600),
            manh.Take(5).ToList(),
            yeu.Take(5).ToList(),
            goiY.Take(5).ToList());
    }

    private static List<string> CleanList(List<string>? items) =>
        (items ?? new List<string>())
            .Select(x => Trim(x, 160))
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Select(x => x!)
            .Take(5)
            .ToList();

    private static string NormalizeSection(string? phan)
    {
        var key = (phan ?? string.Empty).Trim().ToLowerInvariant();
        return ValidSections.Contains(key) ? key : "tong-the";
    }

    private static string ShortList(List<string> items)
    {
        var text = string.Join(", ", items.Take(5));
        return Truncate(text, 160) ?? string.Empty;
    }

    private static string? Trim(string? value, int max)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var flat = value.Replace("\r", " ").Replace("\n", " ").Trim();
        return flat.Length <= max ? flat : flat[..max];
    }

    private static string? Truncate(string? value, int max)
    {
        if (value is null) return null;
        return value.Length <= max ? value : value[..max];
    }

    private sealed record ReviewPayload(
        int DiemTongQuan,
        string? NhanXet,
        List<string> DiemManh,
        List<string> DiemYeu,
        List<CvGoiY> GoiY);

    private sealed class ReviewDto
    {
        public int DiemTongQuan { get; set; }
        public string? NhanXet { get; set; }
        public List<string>? DiemManh { get; set; }
        public List<string>? DiemYeu { get; set; }
        public List<GoiYDto>? GoiY { get; set; }
    }

    private sealed class GoiYDto
    {
        public string? Phan { get; set; }
        public string? Viec { get; set; }
    }
}
