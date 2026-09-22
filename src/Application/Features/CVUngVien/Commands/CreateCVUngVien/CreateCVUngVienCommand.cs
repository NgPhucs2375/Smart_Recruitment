using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.CreateCVUngVien;

public class CreateCVUngVienCommand : IRequest<Response<int>>
{
    public int HoSoUngVienId { get; set; }
    public string TenFile { get; set; }
    public string? FileUrl { get; set; }
    public IFormFile File { get; set; }
    public string? TemplateId { get; set; }
    public bool IsDefault { get; set; } = true;
    public PhuongThucTaoCV PhuongThucTao { get; set; }
    public ParsedCvDto NoiDung { get; set; }
}

public class CreateCVUngVienCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IFileStorageService fileStorageService)
    : IRequestHandler<CreateCVUngVienCommand, Response<int>>
{
    public async Task<Response<int>> Handle(
        CreateCVUngVienCommand request,
        CancellationToken cancellationToken
        )
    {
        // check nguoi dung hien tai
        var currentUser = await currentNguoiDungService.ResolveAsync();
        // check ho so ung vien co dung khong
        var hoSo = await context.HoSoUngViens
            .FirstOrDefaultAsync(x => x.Id == request.HoSoUngVienId, cancellationToken);
        var extension = Path.GetExtension(request.File.FileName);
        var objectName =
            $"cvs/{request.HoSoUngVienId}/{DateTime.UtcNow:yyyy/MM}/" +
            $"{Guid.NewGuid():N}{extension}";

        await using var stream = request.File.OpenReadStream();

        await fileStorageService.UploadAsync(
            stream,
            objectName,
            "application/pdf",
            request.File.Length,
            cancellationToken);
            
        if (hoSo == null)
        {
            return new Response<int>("Hồ sơ ứng viên không tồn tại.");
        }

        if (currentUser.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN &&
            hoSo.NguoiDungId != currentUser.Id)
        {
            return new Response<int>("Bạn không có quyền thao tác trên hồ sơ ứng viên này.");
        }

        var invalidSkillIds = await GetInvalidSkillIds(request.NoiDung, cancellationToken);
        if (invalidSkillIds.Count > 0)
        {
            return new Response<int>($"Không tìm thấy kỹ năng có ID: {string.Join(", ", invalidSkillIds)}.");
        }

        var hasAnyCv = await context.CVUngViens.AnyAsync(
            x => x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa,
            cancellationToken);
        var isDefault = request.IsDefault || !hasAnyCv;

        if (isDefault)
        {
            var oldDefaults = await context.CVUngViens
                .Where(x => x.HoSoUngVienId == hoSo.Id && x.IsDefault && !x.IsDaXoa)
                .ToListAsync(cancellationToken);
            oldDefaults.ForEach(x => x.IsDefault = false);
        }

        var entity = new Domain.Entities.CVUngVien
        {
            HoSoUngVienId = hoSo.Id,
            TenFile = Path.GetFileName(request.File.FileName),
            StorageKey = objectName,
            FileMimeType = request.File.ContentType,
            FileSize = request.File.Length,
            TemplateId = request.TemplateId,
            IsDefault = isDefault,
            PhuongThucTao = request.PhuongThucTao
        };
        CvEntityMapper.ApplyContent(entity, request.NoiDung);

        await context.CVUngViens.AddAsync(entity, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);

        return new Response<int>(data: entity.Id, message: "Tạo CV thành công.");
    }

    private async Task<List<int>> GetInvalidSkillIds(
        ParsedCvDto content,
        CancellationToken cancellationToken)
    {
        var ids = CvEntityMapper.GetKyNangIds(content);
        var validIds = await context.KyNangs.AsNoTracking()
            .Where(x => ids.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
        return ids.Except(validIds).ToList();
    }
}
