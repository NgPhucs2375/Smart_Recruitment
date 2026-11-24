using Application.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.NguoiDung;

public static class NguoiDungRelations
{
    public static async Task<HashSet<int>> LoadRelatedIdsAsync(
        IApplicationDbContext context,
        IEnumerable<int> nguoiDungIds,
        CancellationToken cancellationToken)
    {
        var ids = nguoiDungIds.Distinct().ToArray();
        if (ids.Length == 0) return new HashSet<int>();

        var related = await context.NguoiDungs
            .AsNoTracking()
            .Where(x => ids.Contains(x.Id) && (
                context.HoSoUngViens.Any(profile => profile.NguoiDungId == x.Id) ||
                context.HoSoNhaTuyenDungs.Any(profile => profile.NguoiDungId == x.Id) ||
                context.CVImportSessions.Any(session => session.NguoiDungId == x.Id) ||
                context.TinTuyenDungs.Any(job => job.NguoiDangTinId == x.Id) ||
                context.DoanhNghieps.Any(company => company.NguoiDaiDienId == x.Id) ||
                context.DonUngTuyens.Any(application => application.NguoiXuLyId == x.Id) ||
                context.LichSuTrangThaiDonUngTuyens.Any(history => history.NguoiThucHienId == x.Id) ||
                context.LoiMoiNhanSus.Any(invite => invite.NguoiDaiDienId == x.Id) ||
                context.NotificationRecipients.Any(recipient => recipient.NguoiDungId == x.Id) ||
                context.Conversations.Any(chat => chat.ParticipantOneId == x.Id || chat.ParticipantTwoId == x.Id)))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);

        return related.ToHashSet();
    }
}
