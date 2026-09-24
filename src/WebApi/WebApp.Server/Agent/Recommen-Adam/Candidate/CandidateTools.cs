using System.ComponentModel;
using Application.DTOs.CV;
using Application.Features.CVUngVien.Queries.GetAllCVUngViens;
using Application.Features.CVUngVien.Queries.GetCVUngVienById;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using Application.Features.HoSoUngVien.Queries.GetMyHoSoUngVien;
using Application.Features.KetQuaPhuHop.Queries.SuggestJobsForCv;
using Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;
using Application.Features.TinTuyenDung.Queries.GetTinTuyenDungById;
using Application.Wrappers;
using MediatR;
using WebApp.Server.Agent.SharedState;

namespace WebApp.Server.Agent.RecommenAdam.Candidate;

internal sealed class CandidateTools
{
	private readonly ISender _sender;
	private readonly SharedStateStore _sharedState;

	public CandidateTools(ISender sender, SharedStateStore sharedState)
	{
		_sender = sender;
		_sharedState = sharedState;
    }

    [Description("Chỉ kiểm tra các trường thông tin cá nhân trong HoSoUngVien của ứng viên hiện tại. Không đọc, không phân tích và không kiểm tra CVUngVien. Dùng khi ứng viên hỏi: hồ sơ của tôi còn thiếu gì.")]
    public async Task<Response<CandidateProfileCompleteness>> CheckProfileCompletenessAsync(CancellationToken cancellationToken = default)
    {
        var profile = await _sender.Send(new GetMyHoSoUngVienQuery(), cancellationToken);
        if (!profile.Succeeded || profile.Data == null)
            return new Response<CandidateProfileCompleteness>(profile.Message ?? "Không lấy được hồ sơ ứng viên.");

        var missing = new List<string>();
        if (string.IsNullOrWhiteSpace(profile.Data.HoTen)) missing.Add("Họ tên");
        if (string.IsNullOrWhiteSpace(profile.Data.SDT)) missing.Add("Số điện thoại");
        if (string.IsNullOrWhiteSpace(profile.Data.DiaChi)) missing.Add("Địa chỉ");
        if (string.IsNullOrWhiteSpace(profile.Data.ViTriUngTuyen)) missing.Add("Vị trí ứng tuyển");
        if (profile.Data.MucLuongMongMuon <= 0) missing.Add("Mức lương mong muốn");

        return new Response<CandidateProfileCompleteness>(new CandidateProfileCompleteness
        {
            HoSoUngVienId = profile.Data.Id,
            ThieuThongTin = missing,
            DaHoanThien = missing.Count == 0
        });
    }

    [Description("Phân tích CV của ứng viên, chỉ ra điểm mạnh, phần còn thiếu và gợi ý cải thiện dựa trên nội dung CV thực tế. Nếu không có cvId, dùng CV mặc định.")]
    public async Task<Response<CandidateCvAnalysis>> AnalyzeCvAsync(
        [Description("ID CV cần phân tích, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
    {
        var cv = await GetCvAsync(cvId, cancellationToken);
        if (!cv.Succeeded || cv.Data == null) return new Response<CandidateCvAnalysis>(cv.Message ?? "Không lấy được CV.");

        var content = cv.Data.NoiDung;
        if (content == null)
            return new Response<CandidateCvAnalysis>("CV chưa có nội dung để phân tích.");
        var strengths = new List<string>();
        var improvements = new List<string>();
        if (content.KyNang.Count > 0) strengths.Add($"Có {content.KyNang.Count} kỹ năng trong CV"); else improvements.Add("Bổ sung kỹ năng chuyên môn");
        if (content.KinhNghiemLamViec.Count > 0) strengths.Add("Có kinh nghiệm làm việc"); else improvements.Add("Bổ sung kinh nghiệm hoặc dự án tiêu biểu");
        if (content.DuAn.Count > 0) strengths.Add("Có dự án thể hiện năng lực"); else improvements.Add("Bổ sung dự án hoặc sản phẩm đã thực hiện");
        if (content.HocVan.Count == 0) improvements.Add("Bổ sung học vấn");
        if (string.IsNullOrWhiteSpace(content.ThongTinLienHe?.Email)) improvements.Add("Bổ sung email liên hệ");
        if (string.IsNullOrWhiteSpace(content.ThongTinLienHe?.ViTriUngTuyen)) improvements.Add("Nêu rõ vị trí ứng tuyển mục tiêu");

        return new Response<CandidateCvAnalysis>(new CandidateCvAnalysis
        {
            CvUngVienId = cv.Data.Id,
            DiemManh = strengths,
            CanCaiThien = improvements
        });
    }

    [Description("Gợi ý các bước cải thiện CV dựa trên CV thực tế của ứng viên. Không tự sửa CV.")]
    public async Task<Response<CandidateCvAnalysis>> SuggestCvImprovementAsync(
        [Description("ID CV cần đánh giá, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
        => await AnalyzeCvAsync(cvId, cancellationToken);

    [Description("Tìm việc làm công khai theo từ khóa, địa điểm, lương hoặc hình thức làm việc. Chỉ trả tin đang tuyển.")]
    public Task<PagedResponse<List<GetAllTinTuyenDungsViewModel>>> SearchJobsAsync(
        [Description("Từ khóa chức danh, kỹ năng hoặc doanh nghiệp.")] string? keyword = null,
        [Description("Địa điểm làm việc.")] string? location = null,
        [Description("Mức lương tối thiểu mong muốn.")] decimal? salaryMin = null,
        [Description("Mức lương tối đa mong muốn.")] decimal? salaryMax = null,
        [Description("Số kết quả, từ 1 đến 20.")] int topN = 10,
        CancellationToken cancellationToken = default)
        => _sender.Send(new GetAllTinTuyenDungsQuery
        {
            _start = 0,
            _end = Math.Clamp(topN, 1, 20),
            _filter = keyword,
            Location = location,
            SalaryMin = salaryMin,
            SalaryMax = salaryMax
        }, cancellationToken);

    [Description("Đọc chi tiết JD của một tin tuyển dụng công khai theo id.")]
    public Task<Response<GetAllTinTuyenDungsViewModel>> GetJobDetailsAsync(
        [Description("ID tin tuyển dụng cần xem.")] int tinTuyenDungId,
        CancellationToken cancellationToken = default)
        => _sender.Send(new GetTinTuyenDungByIdQuery { Id = tinTuyenDungId }, cancellationToken);

    [Description("Lấy các việc làm phù hợp nhất với CV mặc định hoặc CV được chọn, kèm điểm match, kỹ năng khớp và kỹ năng còn thiếu.")]
    public async Task<Response<List<SuggestedJobViewModel>>> GetJobRecommendationsAsync(
        [Description("ID CV cần so khớp, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
    {
        var response = await _sender.Send(new GetSuggestedJobsForCvQuery { CvUngVienId = cvId, TopN = 10 }, cancellationToken);
        if (response.Succeeded && response.Data is not null)
        {
            _sharedState.Set("jobRecommendations", response.Data);
            _sharedState.Set("lastAction", "jobRecommendationsLoaded");
        }

        return response;
    }

    [Description("Giải thích vì sao CV phù hợp với một tin tuyển dụng. Chỉ trả dữ liệu match thật của tin đó.")]
    public async Task<Response<SuggestedJobViewModel>> ExplainJobMatchAsync(
        [Description("ID tin tuyển dụng cần giải thích mức độ phù hợp.")] int tinTuyenDungId,
        [Description("ID CV cần so khớp, bỏ trống để dùng CV mặc định.")] int? cvId = null,
        CancellationToken cancellationToken = default)
    {
        var matches = await GetJobRecommendationsAsync(cvId, cancellationToken);
        var match = matches.Data?.FirstOrDefault(x => x.TinTuyenDungId == tinTuyenDungId);
        return match == null
            ? new Response<SuggestedJobViewModel>("Chưa có kết quả match cho tin tuyển dụng này.")
            : new Response<SuggestedJobViewModel>(match);
    }

    [Description("So sánh tối đa ba việc làm công khai theo JD, lương, địa điểm, kỹ năng và mức độ phù hợp với CV.")]
    public async Task<Response<List<GetAllTinTuyenDungsViewModel>>> CompareJobsAsync(
        [Description("Danh sách 2 đến 3 ID tin tuyển dụng cần so sánh.")] List<int> tinTuyenDungIds,
        CancellationToken cancellationToken = default)
    {
        var ids = tinTuyenDungIds.Distinct().Take(3).ToList();
        if (ids.Count < 2) return new Response<List<GetAllTinTuyenDungsViewModel>>("Hãy cung cấp ít nhất hai tin tuyển dụng để so sánh.");

        var jobs = new List<GetAllTinTuyenDungsViewModel>();
        foreach (var id in ids)
        {
            var job = await GetJobDetailsAsync(id, cancellationToken);
            if (job.Succeeded && job.Data != null) jobs.Add(job.Data);
        }
        return new Response<List<GetAllTinTuyenDungsViewModel>>(jobs);
    }

    [Description("Xem các đơn ứng tuyển của ứng viên hiện tại.")]
    public Task<PagedResponse<List<GetAllDonUngTuyensViewModel>>> GetMyApplicationsAsync(
        [Description("Số lượng đơn muốn lấy, từ 1 đến 50.")] int topN = 20,
        CancellationToken cancellationToken = default)
        => _sender.Send(new GetAllDonUngTuyensQuery { _start = 0, _end = Math.Clamp(topN, 1, 50) }, cancellationToken);

    [Description("Theo dõi trạng thái và chi tiết của một đơn ứng tuyển thuộc ứng viên hiện tại.")]
    public Task<Response<GetAllDonUngTuyensViewModel>> GetApplicationStatusAsync(
        [Description("ID đơn ứng tuyển cần xem.")] int donUngTuyenId,
        CancellationToken cancellationToken = default)
        => _sender.Send(new GetDonUngTuyenByIdQuery { Id = donUngTuyenId }, cancellationToken);

    private async Task<Response<CvDetailDto>> GetCvAsync(int? cvId, CancellationToken cancellationToken)
    {
        if (cvId.HasValue) return await _sender.Send(new GetCVUngVienByIdQuery { Id = cvId.Value }, cancellationToken);
        var cvs = await _sender.Send(new GetAllCVUngViensQuery { _start = 0, _end = 20 }, cancellationToken);
        var defaultCv = cvs.Data?.FirstOrDefault(x => x.IsDefault);
        return defaultCv == null
            ? new Response<CvDetailDto>("Không tìm thấy CV mặc định.")
            : await _sender.Send(new GetCVUngVienByIdQuery { Id = defaultCv.Id }, cancellationToken);
    }
}

public sealed class CandidateProfileCompleteness
{
    public int HoSoUngVienId { get; set; }
    public bool DaHoanThien { get; set; }
    public List<string> ThieuThongTin { get; set; } = new();
}

public sealed class CandidateCvAnalysis
{
    public int CvUngVienId { get; set; }
    public List<string> DiemManh { get; set; } = new();
    public List<string> CanCaiThien { get; set; } = new();
}
