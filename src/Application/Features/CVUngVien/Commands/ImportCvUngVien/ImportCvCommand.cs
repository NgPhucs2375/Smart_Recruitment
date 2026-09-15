using System.Globalization;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.ImportCvUngVien;

public class ImportCvCommand : ConfirmCvImportDto, IRequest<Response<int>>;

public class ImportCvCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<ImportCvCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        ImportCvCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var hoSoUngVien = await context.HoSoUngViens
            .FirstOrDefaultAsync(
                x => x.NguoiDungId == currentUser.Id,
                cancellationToken);

        if (hoSoUngVien == null)
        {
            return new Response<int>("Bạn chưa có hồ sơ ứng viên.");
        }

        var kyNangIds = CvEntityMapper.GetKyNangIds(request.NoiDung);

        if (kyNangIds.Count > 0)
        {
            var validKyNangIds = await context.KyNangs
                .AsNoTracking()
                .Where(x => kyNangIds.Contains(x.Id))
                .Select(x => x.Id)
                .ToListAsync(cancellationToken);

            var invalidKyNangIds = kyNangIds.Except(validKyNangIds).ToList();
            if (invalidKyNangIds.Count > 0)
            {
                return new Response<int>(
                    $"Không tìm thấy kỹ năng có ID: {string.Join(", ", invalidKyNangIds)}.");
            }
        }

        var hasAnyCv = await context.CVUngViens
            .AnyAsync(
                x => x.HoSoUngVienId == hoSoUngVien.Id && !x.IsDaXoa,
                cancellationToken);
        var isDefault = request.IsDefault || !hasAnyCv;

        if (isDefault)
        {
            var currentDefaultCvs = await context.CVUngViens
                .Where(x => x.HoSoUngVienId == hoSoUngVien.Id &&
                            x.IsDefault &&
                            !x.IsDaXoa)
                .ToListAsync(cancellationToken);

            foreach (var currentDefaultCv in currentDefaultCvs)
            {
                currentDefaultCv.IsDefault = false;
            }
        }

        var cv = new Domain.Entities.CVUngVien
        {
            HoSoUngVienId = hoSoUngVien.Id,
            TenFile = request.TenFile,
            FileUrl = request.FileUrl,
            TemplateId = request.TemplateId,
            IsDefault = isDefault,
            PhuongThucTao = PhuongThucTaoCV.TaiLenTrucTiep
        };
        CvEntityMapper.ApplyContent(cv, request.NoiDung);

        await context.CVUngViens.AddAsync(cv, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(
            data: cv.Id,
            message: "Import CV thành công.");
    }

}

internal static class CvImportDateParser
{
    private static readonly string[] Formats = ["dd/MM/yyyy", "MM/yyyy"];

    public static bool IsValid(string? value) =>
        string.IsNullOrWhiteSpace(value) ||
        DateTime.TryParseExact(
            value,
            Formats,
            CultureInfo.InvariantCulture,
            DateTimeStyles.None,
            out _);

    public static DateTime? ParseDate(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? null
            : DateTime.ParseExact(
                value,
                Formats,
                CultureInfo.InvariantCulture,
                DateTimeStyles.None);

    public static (short? Month, short? Year) ParseMonthYear(string? value)
    {
        var date = ParseDate(value);
        return date.HasValue
            ? ((short)date.Value.Month, (short)date.Value.Year)
            : (null, null);
    }
}
