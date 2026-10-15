using Application.Exceptions;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.TinTuyenDung.Commands.DeleteTinTuyenDung;

public class DeleteTinTuyenDungCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public DateTime? ExpectedLastModified { get; set; }
}

public class DeleteTinTuyenDungCommandHandler(IApplicationDbContext context,
    ICurrentNguoiDungService current, IDistributedCache cache)
    : IRequestHandler<DeleteTinTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(DeleteTinTuyenDungCommand request, CancellationToken ct)
    {
        var job = await context.TinTuyenDungs.AsTracking().FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (job == null) return new Response<int>("Không tìm thấy tin tuyển dụng.");
        var user = await current.ResolveAsync();
        if (!JobDraft.CanEdit(user, job) && user.VaiTro != VaiTroNguoiDung.QUAN_TRI_VIEN)
            throw new ApiException("Bạn không có quyền xóa bản nháp này.", 403);
        JobDraft.EnsureVersion(job, request.ExpectedLastModified);
        if (job.TrangThai is not (TrangThaiTinTuyenDung.Nhap or TrangThaiTinTuyenDung.TuChoi))
            return new Response<int>("Chỉ xóa bản nháp hoặc tin bị từ chối. Với tin đã đăng, dùng Đóng tin hoặc Khóa tin.");
        if (await context.DonUngTuyens.AnyAsync(x => x.TinTuyenDungId == job.Id, ct))
            return new Response<int>("Tin đã có đơn ứng tuyển, không được xóa bản ghi.");
        context.KyNangTinTuyenDungs.RemoveRange(await context.KyNangTinTuyenDungs.AsTracking().Where(x => x.TinTuyenDungId == job.Id).ToListAsync(ct));
        context.KetQuaPhuHops.RemoveRange(await context.KetQuaPhuHops.AsTracking().Where(x => x.TinTuyenDungId == job.Id).ToListAsync(ct));
        context.TinTuyenDungs.Remove(job);
        await context.SaveChangesAsync(ct);
        await RecommendationCache.InvalidateJobsAsync(cache, ct);
        return new Response<int>(job.Id, "Đã xóa bản nháp.");
    }
}
