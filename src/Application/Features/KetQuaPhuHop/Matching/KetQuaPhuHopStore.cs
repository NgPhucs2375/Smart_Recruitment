using Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhuHop.Matching;

/// <summary>
/// Kho điểm dùng chung giữa hai đường ghi: ứng viên lướt trang gợi ý và job quét pool ứng viên.
/// Cả hai upsert theo (HoSoUngVienId, CVUngVienId, TinTuyenDungId) để một đường
/// không xoá mất phủ định của đường còn lại. Caller chịu trách nhiệm SaveChangesAsync.
/// </summary>
public static class KetQuaPhuHopStore
{
    public static async Task UpsertAsync(
        IApplicationDbContext context,
        int hoSoUngVienId,
        int cvUngVienId,
        int tinTuyenDungId,
        ContentMatchResult match,
        string ghiChu,
        string explanationModel,
        CancellationToken ct = default)
    {
        bool SamePair(Domain.Entities.KetQuaPhuHop k) => k.HoSoUngVienId == hoSoUngVienId &&
                                                        k.CVUngVienId == cvUngVienId &&
                                                        k.TinTuyenDungId == tinTuyenDungId;

        // Đọc Local trước: row vừa Add trong cùng scope chưa lên DB nhưng vẫn phải được ghi đè,
        // nếu không sẽ chèn trùng và phạm unique index.
        var row = context.KetQuaPhuHops.Local.FirstOrDefault(SamePair)
            ?? await context.KetQuaPhuHops.AsTracking()
                .FirstOrDefaultAsync(k => k.HoSoUngVienId == hoSoUngVienId &&
                                          k.CVUngVienId == cvUngVienId &&
                                          k.TinTuyenDungId == tinTuyenDungId, ct);

        if (row == null)
        {
            context.KetQuaPhuHops.Add(new Domain.Entities.KetQuaPhuHop
            {
                HoSoUngVienId = hoSoUngVienId,
                CVUngVienId = cvUngVienId,
                TinTuyenDungId = tinTuyenDungId,
            });
            row = context.KetQuaPhuHops.Local.First(SamePair);
        }

        row.DiemPhuHop = match.Score;
        row.KyNangThoa = string.Join(", ", match.MatchedSkills);
        row.KyNangThieu = string.Join(", ", match.MissingSkills);
        row.PhanLoai = ContentBasedMatcher.PhanLoaiCua(match.Score);
        row.GhiChu = ghiChu;
        row.MatchingVersion = ContentBasedMatcher.Version;
        row.ExplanationModel = explanationModel;
        row.EvaluateAt = DateTime.UtcNow;
    }
}
