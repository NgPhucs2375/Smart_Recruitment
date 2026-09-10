namespace RecruitmentAgent.Common.Interfaces;

/// <summary>
/// Agent-facing read model over the recruitment domain. Mirrors the role of
/// form-filling <c>agent/Services/DbService.cs</c> (ListForms/SearchKnowledge),
/// but queries the EXISTING <c>Application.Interfaces.IApplicationDbContext</c>
/// entities (no new tables, no pgvector) so no migration is needed.
/// </summary>
public sealed record TinTuyenDungMatch(
    int Id,
    string TieuDe,
    string? MoTaCongViec,
    string? YeuCauCongViec,
    string? DiaDiemLamViec,
    int Score);

public sealed record CvUngVienSummary(
    int Id,
    string TenFile,
    string? TemplateId,
    DateTime? NgayUpload);

public interface ICvKnowledgeService
{
    Task<List<TinTuyenDungMatch>> SearchTinTuyenDungAsync(string query, int limit = 10, CancellationToken ct = default);
    Task<List<TinTuyenDungMatch>> ListTinDangTuyenAsync(int limit = 20, CancellationToken ct = default);
    Task<CvUngVienSummary?> GetCvUngVienAsync(int id, CancellationToken ct = default);
    Task<List<string>> ListKyNangAsync(CancellationToken ct = default);
}
