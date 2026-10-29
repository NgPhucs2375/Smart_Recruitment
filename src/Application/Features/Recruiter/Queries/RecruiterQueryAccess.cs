using Application.Interfaces;
using Domain.Enums;

namespace Application.Features.Recruiter.Queries;

internal sealed record RecruiterScope(CurrentNguoiDungContext Actor, int CompanyId);

internal static class RecruiterQueryAccess
{
    public const string HrOnlyMessage = "Chức năng này chỉ dành cho nhân sự hoặc người đại diện.";
    public const string RepresentativeOnlyMessage = "Chức năng này chỉ dành cho người đại diện doanh nghiệp.";
    public const string NoCompanyMessage = "Tài khoản chưa thuộc doanh nghiệp nào.";

    public static async Task<(RecruiterScope? Scope, string? Error)> ResolveAsync(
        ICurrentNguoiDungService current,
        bool representativeOnly)
    {
        var actor = await current.ResolveAsync();

        if (representativeOnly)
        {
            if (actor.VaiTro != VaiTroNguoiDung.NGUOI_DAI_DIEN)
                return (null, RepresentativeOnlyMessage);
        }
        else if (actor.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
        {
            return (null, HrOnlyMessage);
        }

        if (!actor.DoanhNghiepId.HasValue)
            return (null, NoCompanyMessage);

        return (new RecruiterScope(actor, actor.DoanhNghiepId.Value), null);
    }
}
