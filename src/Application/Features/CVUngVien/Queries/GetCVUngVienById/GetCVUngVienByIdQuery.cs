using Application.DTOs.CV;
using Application.Features.CVUngVien.Cache;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace Application.Features.CVUngVien.Queries.GetCVUngVienById;

public class GetCVUngVienByIdQuery
    : IRequest<Response<CvDetailDto>>
{
    public int Id { get; set; }
}

public class GetCVUngVienByIdQueryHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    ICvReadMapper cvReadMapper,
    IDistributedCache cache)
    : IRequestHandler<
        GetCVUngVienByIdQuery,
        Response<CvDetailDto>>
{
    public async Task<Response<CvDetailDto>> Handle(
        GetCVUngVienByIdQuery request,
        CancellationToken cancellationToken)
    {
        var currentUser =
            await currentNguoiDungService.ResolveAsync();
        // Authorize against live relationships BEFORE returning cached content.
        var ownsCv = await context.CVUngViens.AsNoTracking().AnyAsync(x => x.Id == request.Id && !x.IsDaXoa &&
            (currentUser.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN || x.HoSoUngVien.NguoiDungId == currentUser.Id), cancellationToken);
        if (!ownsCv)
        {
            if (currentUser.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN))
                return new Response<CvDetailDto>("Không tìm thấy CV.");
            var submitted = await context.DonUngTuyens.AsNoTracking().Where(d => d.CVUngVienId == request.Id &&
                (currentUser.VaiTro == VaiTroNguoiDung.NHAN_SU ? d.TinTuyenDung.NguoiDangTinId == currentUser.Id
                    : d.TinTuyenDung.DoanhNghiepId == currentUser.DoanhNghiepId))
                .OrderByDescending(d => d.NgayUngTuyen ?? d.Created).ThenByDescending(d => d.Id)
                .Select(d => d.CvSnapshotJson).FirstOrDefaultAsync(cancellationToken);
            if (string.IsNullOrWhiteSpace(submitted)) return new Response<CvDetailDto>("Không tìm thấy bản CV đã nộp trong phạm vi của bạn.");
            try
            {
                var snapshot = JsonSerializer.Deserialize<CvDetailDto>(submitted);
                return snapshot == null ? new Response<CvDetailDto>("Không tìm thấy bản CV đã nộp.") : new Response<CvDetailDto>(snapshot);
            }
            catch (JsonException) { return new Response<CvDetailDto>("Bản CV đã nộp không hợp lệ."); }
        }
        var detailVersion = await cache.GetStringAsync(
            CVUngVienListCache.DetailVersionKey(request.Id),
            cancellationToken) ?? "1";
        var cacheKey = CVUngVienListCache.BuildDetailKey(
            currentUser.Id,
            request.Id,
            detailVersion);
        var cached = await cache.GetStringAsync(cacheKey, cancellationToken);
        if (!string.IsNullOrWhiteSpace(cached))
        {
            var cachedResponse = JsonSerializer.Deserialize<Response<CvDetailDto>>(cached);
            if (cachedResponse != null)
                return cachedResponse;
        }

        var entity = await context.CVUngViens
            .AsNoTracking()

            .Include(x => x.ThongTinLienHe)

            .Include(x => x.HocVans)

            .Include(x => x.KinhNghiems)
                .ThenInclude(x => x.KyNangs)

            .Include(x => x.DuAns)
                .ThenInclude(x => x.CongNghes)

            .Include(x => x.KyNangs)

            .Include(x => x.ChungChis)

            .FirstOrDefaultAsync(
                x =>
                    x.Id == request.Id &&
                    !x.IsDaXoa &&
                    (currentUser.VaiTro == VaiTroNguoiDung.QUAN_TRI_VIEN || x.HoSoUngVien.NguoiDungId == currentUser.Id),
                cancellationToken);


        if (entity == null)
        {
            return new Response<CvDetailDto>(
                "Không tìm thấy CV.");
        }

        var result =
            cvReadMapper.Map(entity);

        var response = new Response<CvDetailDto>(
            data: result,
            message: "Lấy CV thành công.");

        await cache.SetStringAsync(
            cacheKey,
            JsonSerializer.Serialize(response),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(1),
                SlidingExpiration = TimeSpan.FromSeconds(30)
            },
            cancellationToken);

        return response;
    }
}
