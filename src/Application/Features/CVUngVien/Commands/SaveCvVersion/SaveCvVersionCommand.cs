using System.Text.Json;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.SaveCvVersion;

public class SaveCvVersionCommand : IRequest<Response<SaveCvVersionResult>>
{
    public string Payload { get; set; }
    public IFormFile GeneratedPdf { get; set; }
}

public class SaveCvVersionPayload
{
    public int? CVUngVienId { get; set; }
    public int HoSoUngVienId { get; set; }
    public Guid? ImportSessionId { get; set; }
    public string TenFile { get; set; }
    public string? TemplateId { get; set; }
    public bool IsDefault { get; set; } = true;
    public PhuongThucTaoCV PhuongThucTao { get; set; } = PhuongThucTaoCV.ThuCongTemplate;
    public ParsedCvDto NoiDung { get; set; }
}

public class SaveCvVersionResult
{
    public int CVUngVienId { get; set; }
    public int CVPhienBanId { get; set; }
    public int SoPhienBan { get; set; }
}

public class SaveCvVersionCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IFileStorageService fileStorageService)
    : IRequestHandler<SaveCvVersionCommand, Response<SaveCvVersionResult>>
{
    public async Task<Response<SaveCvVersionResult>> Handle(
        SaveCvVersionCommand request,
        CancellationToken cancellationToken)
    {
        if (request.GeneratedPdf == null || request.GeneratedPdf.Length == 0)
            return new Response<SaveCvVersionResult>("PDF đã sinh không được để trống.");
        if (request.GeneratedPdf.Length > 20 * 1024 * 1024)
            return new Response<SaveCvVersionResult>("PDF đã sinh không được vượt quá 20 MB.");

        SaveCvVersionPayload? payload;
        try
        {
            payload = JsonSerializer.Deserialize<SaveCvVersionPayload>(request.Payload, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            });
        }
        catch (JsonException)
        {
            return new Response<SaveCvVersionResult>("Dữ liệu CV không hợp lệ.");
        }

        if (payload?.NoiDung?.ThongTinLienHe == null || string.IsNullOrWhiteSpace(payload.TenFile))
            return new Response<SaveCvVersionResult>("Nội dung và tên CV không được để trống.");

        var currentUser = await currentNguoiDungService.ResolveAsync();
        Domain.Entities.CVUngVien cv;
        Domain.Entities.HoSoUngVien hoSo;

        if (payload.CVUngVienId.HasValue)
        {
            cv = await context.CVUngViens.AsTracking()
                .Include(x => x.HoSoUngVien)
                .Include(x => x.ThongTinLienHe)
                .Include(x => x.HocVans)
                .Include(x => x.KinhNghiems).ThenInclude(x => x.KyNangs)
                .Include(x => x.DuAns).ThenInclude(x => x.CongNghes)
                .Include(x => x.KyNangs)
                .Include(x => x.ChungChis)
                .FirstOrDefaultAsync(x => x.Id == payload.CVUngVienId && !x.IsDaXoa, cancellationToken);
            if (cv == null)
                return new Response<SaveCvVersionResult>("Không tìm thấy CV.");
            hoSo = cv.HoSoUngVien;
        }
        else
        {
            hoSo = await context.HoSoUngViens.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == payload.HoSoUngVienId, cancellationToken);
            if (hoSo == null)
                return new Response<SaveCvVersionResult>("Hồ sơ ứng viên không tồn tại.");
            cv = new Domain.Entities.CVUngVien { HoSoUngVienId = hoSo.Id };
        }

        if (currentUser.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN && hoSo.NguoiDungId != currentUser.Id)
            return new Response<SaveCvVersionResult>("Bạn không có quyền thao tác trên CV này.");

        var skillIds = CvEntityMapper.GetKyNangIds(payload.NoiDung);
        var validSkillIds = await context.KyNangs.AsNoTracking()
            .Where(x => skillIds.Contains(x.Id))
            .Select(x => x.Id)
            .ToListAsync(cancellationToken);
        var invalidSkillIds = skillIds.Except(validSkillIds).ToList();
        if (invalidSkillIds.Count > 0)
            return new Response<SaveCvVersionResult>($"Không tìm thấy kỹ năng có ID: {string.Join(", ", invalidSkillIds)}.");

        CVImportSession? importSession = null;
        if (payload.ImportSessionId.HasValue)
        {
            importSession = await context.CVImportSessions.AsTracking()
                .FirstOrDefaultAsync(x => x.Id == payload.ImportSessionId.Value, cancellationToken);
            if (importSession == null || importSession.NguoiDungId != currentUser.Id || importSession.HoSoUngVienId != hoSo.Id)
                return new Response<SaveCvVersionResult>("Phiên import không hợp lệ.");
            if (importSession.TrangThai == TrangThaiCvImport.Confirmed)
                return new Response<SaveCvVersionResult>("Phiên import đã được sử dụng.");
            if (importSession.ExpiresAt <= DateTime.UtcNow)
            {
                importSession.TrangThai = TrangThaiCvImport.Expired;
                await context.SaveChangesAsync(cancellationToken);
                return new Response<SaveCvVersionResult>("Phiên import đã hết hạn.");
            }
        }

        var hasAnyCv = await context.CVUngViens.AnyAsync(
            x => x.HoSoUngVienId == hoSo.Id && !x.IsDaXoa && x.Id != cv.Id,
            cancellationToken);
        var isDefault = payload.IsDefault || !hasAnyCv;
        if (isDefault)
        {
            var oldDefaults = await context.CVUngViens.AsTracking()
                .Where(x => x.HoSoUngVienId == hoSo.Id && x.Id != cv.Id && x.IsDefault && !x.IsDaXoa)
                .ToListAsync(cancellationToken);
            oldDefaults.ForEach(x => x.IsDefault = false);
        }

        cv.TenFile = payload.TenFile.Trim();
        cv.TemplateId = payload.TemplateId;
        cv.IsDefault = isDefault;
        cv.PhuongThucTao = importSession == null ? payload.PhuongThucTao : PhuongThucTaoCV.TaiLenTrucTiep;
        CvEntityMapper.ApplyContent(cv, payload.NoiDung);

        var nextVersion = payload.CVUngVienId.HasValue
            ? await context.CVPhienBans.Where(x => x.CVUngVienId == cv.Id)
                .Select(x => (int?)x.SoPhienBan).MaxAsync(cancellationToken) + 1 ?? 1
            : 1;
        var generatedKey = $"cvs/{hoSo.Id}/versions/{Guid.NewGuid():N}.pdf";
        await using var pdfStream = request.GeneratedPdf.OpenReadStream();
        await fileStorageService.UploadAsync(
            pdfStream,
            generatedKey,
            "application/pdf",
            request.GeneratedPdf.Length,
            cancellationToken);

        var generatedFile = new CVTepTin
        {
            CVUngVien = cv,
            LoaiTep = LoaiTepCv.BanDaSinh,
            ObjectKey = generatedKey,
            TenFile = Path.GetFileName(request.GeneratedPdf.FileName),
            ContentType = "application/pdf",
            KichThuoc = request.GeneratedPdf.Length
        };
        CVTepTin? originalFile = null;
        int? originalFileId = null;
        if (importSession != null)
        {
            originalFile = new CVTepTin
            {
                CVUngVien = cv,
                LoaiTep = LoaiTepCv.BanGoc,
                ObjectKey = importSession.OriginalObjectKey,
                TenFile = importSession.OriginalFileName,
                ContentType = importSession.OriginalContentType,
                KichThuoc = importSession.OriginalFileSize
            };
        }
        else if (payload.CVUngVienId.HasValue)
        {
            originalFileId = await context.CVTepTins.AsNoTracking()
                .Where(x => x.CVUngVienId == cv.Id && x.LoaiTep == LoaiTepCv.BanGoc)
                .OrderBy(x => x.Id)
                .Select(x => (int?)x.Id)
                .FirstOrDefaultAsync(cancellationToken);
        }

        var version = new CVPhienBan
        {
            CVUngVien = cv,
            SoPhienBan = nextVersion,
            TepGoc = originalFile,
            TepGocId = originalFileId,
            TepDaSinh = generatedFile,
            TemplateId = payload.TemplateId
        };
        cv.StorageKey = generatedKey;
        cv.FileMimeType = "application/pdf";
        cv.FileSize = request.GeneratedPdf.Length;
        cv.FileUrl = null;

        if (!payload.CVUngVienId.HasValue)
            await context.CVUngViens.AddAsync(cv, cancellationToken);
        await context.CVPhienBans.AddAsync(version, cancellationToken);

        if (importSession != null)
        {
            importSession.CVUngVien = cv;
            importSession.TrangThai = TrangThaiCvImport.Confirmed;
            importSession.ConfirmedAt = DateTime.UtcNow;
        }

        try
        {
            await context.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await fileStorageService.DeleteAsync(generatedKey, cancellationToken);
            throw;
        }

        return new Response<SaveCvVersionResult>(new SaveCvVersionResult
        {
            CVUngVienId = cv.Id,
            CVPhienBanId = version.Id,
            SoPhienBan = version.SoPhienBan
        }, $"Đã lưu phiên bản {version.SoPhienBan} của CV.");
    }
}
