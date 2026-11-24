using Application.Interfaces;
using Application.Wrappers;
using AutoMapper;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Linq;

namespace Application.Features.DoanhNghiep.Queries.GetAllDoanhNghieps;
public class GetAllDoanhNghiepsQuery : IRequest<PagedResponse<List<GetAllDoanhNghiepsViewModel>>>
{
    public int _start { get; set; }

    public int _end { get; set; }

    public string _order { get; set; }

    public string _sort { get; set; }

    public string _filter { get; set; }
}

public class GetAllDoanhNghiepsQueryHandler(
    IApplicationDbContext context,
    IMapper mapper)
    : IRequestHandler<GetAllDoanhNghiepsQuery, PagedResponse<List<GetAllDoanhNghiepsViewModel>>>
{
    public async Task<PagedResponse<List<GetAllDoanhNghiepsViewModel>>> Handle(
        GetAllDoanhNghiepsQuery request,
        CancellationToken cancellationToken)
    {
        var query = context.DoanhNghieps.AsNoTracking();

        var filter = request._filter?.Trim();

        if (!string.IsNullOrWhiteSpace(filter))
        {
            query = query.Where(x => x.TenDoanhNghiep.Contains(filter));
        }

        query = request._sort?.ToLower() switch
        {
            "tendoanhnghiep" when request._order?.ToLower() == "desc" => query.OrderByDescending(x => x.TenDoanhNghiep),
            "tendoanhnghiep" => query.OrderBy(x => x.TenDoanhNghiep),
            _ => query.OrderBy(x => x.Id)
        };

        var skip = request._start < 0 ? 0 : request._start;
        var take = request._end - skip;

        var totalCount = await query.CountAsync(cancellationToken);

        if (skip > 0)
        {
            query = query.Skip(skip);
        }

        if (take > 0)
        {
            query = query.Take(take);
        }

        var items = await query.ToListAsync(
            cancellationToken);

        var companyIds = items.Select(x => x.Id).ToList();
        var aggregates = await context.DoanhNghieps
            .AsNoTracking()
            .Where(x => companyIds.Contains(x.Id))
            .Select(x => new
            {
                x.Id,
                TenNguoiDaiDien = context.HoSoNhaTuyenDungs
                    .Where(profile => profile.DoanhNghiepId == x.Id && profile.NguoiDungId == x.NguoiDaiDienId)
                    .Select(profile => profile.HoTen)
                    .FirstOrDefault(),
                SoTinDangTuyen = context.TinTuyenDungs.Count(job =>
                    job.DoanhNghiepId == x.Id && job.TrangThai == TrangThaiTinTuyenDung.DangTuyen),
                SoTinChoDuyet = context.TinTuyenDungs.Count(job =>
                    job.DoanhNghiepId == x.Id && (
                        job.TrangThai == TrangThaiTinTuyenDung.ChoDuyetHeThong ||
                        job.TrangThai == TrangThaiTinTuyenDung.ChoAdminDuyet ||
                        job.TrangThai == TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet)),
                SoDonUngTuyen = context.DonUngTuyens.Count(application => application.DoanhNghiepId == x.Id),
            })
            .ToDictionaryAsync(x => x.Id, cancellationToken);

        var result = mapper.Map<List<GetAllDoanhNghiepsViewModel>>(items);
        foreach (var item in result)
        {
            if (!aggregates.TryGetValue(item.Id, out var aggregate)) continue;
            item.TenNguoiDaiDien = aggregate.TenNguoiDaiDien;
            item.SoTinDangTuyen = aggregate.SoTinDangTuyen;
            item.SoTinChoDuyet = aggregate.SoTinChoDuyet;
            item.SoDonUngTuyen = aggregate.SoDonUngTuyen;
        }

        var pageSize = take > 0 ? take : items.Count;
        var pageNumber = take > 0 ? (skip / take) + 1 : 1;
        var totalPages = pageSize > 0
            ? (int)System.Math.Ceiling(totalCount / (double)pageSize)
            : 0;

        return new PagedResponse<List<GetAllDoanhNghiepsViewModel>>(
            result,
            pageNumber,
            pageSize,
            totalCount,
            totalPages);
    }
}
