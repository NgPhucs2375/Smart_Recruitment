
using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Domain.Enums;

namespace Application.Features.CVUngVien.Queries.GetCVDownloadUrl
{
    public class GetCVDownloadUrlQuery : IRequest<Response<GetCVDownloadUrlViewModel>>
{
    public int Id { get; set; }
    public int? VersionId { get; set; }
    public bool Original { get; set; }
    public class GetCVDownloadUrlQueryHandler
    : IRequestHandler<
        GetCVDownloadUrlQuery,
        Response<GetCVDownloadUrlViewModel>>
{
    private readonly IApplicationDbContext _context;
    private readonly IFileStorageService _fileStorageService;
    private readonly ICurrentNguoiDungService _currentNguoiDungService;

    public GetCVDownloadUrlQueryHandler(
        IApplicationDbContext context,
        IFileStorageService fileStorageService,
        ICurrentNguoiDungService currentNguoiDungService)
    {
        _context = context;
        _fileStorageService = fileStorageService;
        _currentNguoiDungService = currentNguoiDungService;
    }

    public async Task<Response<GetCVDownloadUrlViewModel>> Handle(
        GetCVDownloadUrlQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser = await _currentNguoiDungService.ResolveAsync();
        var cv = await _context.CVUngViens
            .AsNoTracking()
            .FirstOrDefaultAsync(
                x => x.Id == request.Id &&
                     !x.IsDaXoa,
                cancellationToken);

        if (cv == null)
        {
            return new Response<GetCVDownloadUrlViewModel>(
                "Không tìm thấy CV.");
        }

        var isOwner = currentUser.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN ||
            await _context.HoSoUngViens.AsNoTracking().AnyAsync(
                x => x.Id == cv.HoSoUngVienId && x.NguoiDungId == currentUser.Id,
                cancellationToken);
        if (!isOwner)
        {
            var isRecruiter = currentUser.VaiTro is VaiTroNguoiDung.NGUOI_DAI_DIEN or VaiTroNguoiDung.NHAN_SU;
            var canViewSubmittedVersion = isRecruiter && request.VersionId.HasValue && !request.Original &&
                await _context.DonUngTuyens.AsNoTracking().AnyAsync(
                    x => x.CVUngVienId == cv.Id &&
                         x.CVPhienBanId == request.VersionId.Value &&
                         _context.HoSoNhaTuyenDungs.Any(h =>
                             h.NguoiDungId == currentUser.Id &&
                             h.DoanhNghiepId == x.TinTuyenDung.DoanhNghiepId),
                    cancellationToken);
            if (!canViewSubmittedVersion)
                return new Response<GetCVDownloadUrlViewModel>("Bạn không có quyền tải file CV này.");
        }

        if (request.Original)
        {
            var original = await _context.CVTepTins.AsNoTracking()
                .Where(x => x.CVUngVienId == cv.Id && x.LoaiTep == LoaiTepCv.BanGoc)
                .OrderBy(x => x.Id)
                .Select(x => new { x.ObjectKey, x.TenFile })
                .FirstOrDefaultAsync(cancellationToken);
            if (original == null)
                return new Response<GetCVDownloadUrlViewModel>("CV không có file gốc.");
            return new Response<GetCVDownloadUrlViewModel>(new GetCVDownloadUrlViewModel
            {
                CVUngVienId = cv.Id,
                TenFile = original.TenFile,
                Url = await _fileStorageService.CreatePresignedUrlAsync(
                    original.ObjectKey, 300, cancellationToken),
                ExpiresInSeconds = 300
            });
        }

        var versionQuery = _context.CVPhienBans.AsNoTracking()
            .Where(x => x.CVUngVienId == cv.Id);
        if (request.VersionId.HasValue)
            versionQuery = versionQuery.Where(x => x.Id == request.VersionId.Value);

        var file = await versionQuery
            .OrderByDescending(x => x.SoPhienBan)
            .Select(x => new { x.TepDaSinh.ObjectKey, x.TepDaSinh.TenFile })
            .FirstOrDefaultAsync(cancellationToken);
        if (request.VersionId.HasValue && file == null)
            return new Response<GetCVDownloadUrlViewModel>("Không tìm thấy phiên bản CV.");

        var objectKey = file?.ObjectKey ?? cv.StorageKey;
        var fileName = file?.TenFile ?? cv.TenFile;

        if (string.IsNullOrWhiteSpace(objectKey))
        {
            return new Response<GetCVDownloadUrlViewModel>(
                "CV chưa có file được lưu trữ.");
        }

        var url = await _fileStorageService.CreatePresignedUrlAsync(
            objectKey,
            300,
            cancellationToken);

        var result = new GetCVDownloadUrlViewModel
        {
            CVUngVienId = cv.Id,
            TenFile = fileName,
            Url = url,
            ExpiresInSeconds = 300
        };

        return new Response<GetCVDownloadUrlViewModel>(result);
    }
}
}
}
