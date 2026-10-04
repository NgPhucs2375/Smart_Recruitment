using Application.Exceptions;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.TinTuyenDung.Commands.UpdateTinTuyenDung;

public class UpdateTinTuyenDungCommand : JobDraftInput, IRequest<Response<int>>
{
    public int Id { get; set; }
}

public class UpdateTinTuyenDungCommandHandler(IApplicationDbContext context,
    ICurrentNguoiDungService current, IDistributedCache cache)
    : IRequestHandler<UpdateTinTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateTinTuyenDungCommand request, CancellationToken ct)
    {
        var job = await context.TinTuyenDungs.AsTracking().Include(x => x.KyNangTinTuyenDungs)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (job == null) return new Response<int>("Không tìm thấy tin tuyển dụng.");
        if (!JobDraft.CanEdit(await current.ResolveAsync(), job))
            throw new ApiException("Bạn không có quyền sửa tin này.", 403);
        JobDraft.EnsureVersion(job, request.ExpectedLastModified);
        if (job.TrangThai is not (TrangThaiTinTuyenDung.Nhap or TrangThaiTinTuyenDung.TuChoi or TrangThaiTinTuyenDung.TamDung))
            throw new ApiException("Chỉ sửa tin nháp, bị từ chối hoặc tạm dừng. Hãy tạm dừng tin đang tuyển trước khi sửa.");
        await JobDraft.ApplyAsync(context, job, request, ct);
        // Editing invalidates approval: reopening cannot bypass moderation.
        job.TrangThai = TrangThaiTinTuyenDung.Nhap;
        await context.SaveChangesAsync(ct);
        await RecommendationCache.InvalidateJobsAsync(cache, ct);
        return new Response<int>(job.Id, "Đã lưu thay đổi vào bản nháp. Hãy gửi duyệt khi hoàn tất.");
    }
}
