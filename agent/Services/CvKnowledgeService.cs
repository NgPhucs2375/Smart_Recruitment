using Application.Interfaces;
using Domain.Enums;
using Microsoft.EntityFrameworkCore;
using RecruitmentAgent.Common.Interfaces;

namespace RecruitmentAgent.Services;

/// <summary>
/// Keyword-based implementation of <see cref="ICvKnowledgeService"/> over the
/// existing Clean-Architecture <see cref="IApplicationDbContext"/>.
/// Port of form-filling <c>DbService.ListForms/SearchKnowledge</c> to the
/// recruitment domain: TinTuyenDung ↔ Forms, CVUngVien ↔ Documents.
/// </summary>
public sealed class CvKnowledgeService(IApplicationDbContext db) : ICvKnowledgeService
{
    public async Task<List<TinTuyenDungMatch>> SearchTinTuyenDungAsync(string query, int limit = 10, CancellationToken ct = default)
    {
        var keywords = query.Split([' ', ',', ';', '.', '\n', '\r', '\t'], StringSplitOptions.RemoveEmptyEntries)
            .Select(k => k.Trim().ToLowerInvariant())
            .Where(k => k.Length > 1)
            .Distinct()
            .Take(10)
            .ToList();

        var baseQuery = db.TinTuyenDungs
            .AsNoTracking()
            .Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen);

        var items = await baseQuery
            .OrderByDescending(t => t.Created)
            .Take(100)
            .Select(t => new { t.Id, t.TieuDe, t.MoTaCongViec, t.YeuCauCongViec, t.DiaDiemLamViec })
            .ToListAsync(ct);

        return items
            .Select(t =>
            {
                var haystack = $"{t.TieuDe} {t.MoTaCongViec} {t.YeuCauCongViec}".ToLowerInvariant();
                var score = keywords.Count(k => haystack.Contains(k));
                return new TinTuyenDungMatch(t.Id, t.TieuDe, t.MoTaCongViec, t.YeuCauCongViec, t.DiaDiemLamViec, score);
            })
            .OrderByDescending(m => m.Score)
            .ThenBy(m => m.Id)
            .Take(limit)
            .ToList();
    }

    public async Task<List<TinTuyenDungMatch>> ListTinDangTuyenAsync(int limit = 20, CancellationToken ct = default)
    {
        return await db.TinTuyenDungs
            .AsNoTracking()
            .Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen)
            .OrderByDescending(t => t.Created)
            .Take(limit)
            .Select(t => new TinTuyenDungMatch(t.Id, t.TieuDe, t.MoTaCongViec, t.YeuCauCongViec, t.DiaDiemLamViec, 0))
            .ToListAsync(ct);
    }

    public async Task<CvUngVienSummary?> GetCvUngVienAsync(int id, CancellationToken ct = default)
    {
        return await db.CVUngViens
            .AsNoTracking()
            .Where(c => c.Id == id && !c.IsDaXoa)
            .Select(c => new CvUngVienSummary(c.Id, c.TenFile, c.TemplateId, c.NgayUpload))
            .FirstOrDefaultAsync(ct);
    }

    public async Task<List<string>> ListKyNangAsync(CancellationToken ct = default)
    {
        return await db.KyNangs
            .AsNoTracking()
            .OrderBy(k => k.Id)
            .Take(200)
            .Select(k => k.TenKyNang)
            .ToListAsync(ct);
    }
}
