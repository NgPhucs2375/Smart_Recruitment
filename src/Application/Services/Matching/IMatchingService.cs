namespace Application.Services.Matching;

/// <summary>
/// Tính điểm phù hợp giữa hồ sơ/CV ứng viên và tin tuyển dụng.
/// </summary>
public interface IMatchingService
{
    Task<MatchingResultDto> CalculateAsync(
        int hoSoUngVienId,
        int tinTuyenDungId,
        int? cvUngVienId,
        CancellationToken cancellationToken);
}
