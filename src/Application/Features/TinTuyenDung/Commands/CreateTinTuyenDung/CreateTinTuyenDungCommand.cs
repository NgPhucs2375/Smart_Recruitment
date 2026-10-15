using Application.Exceptions;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.TinTuyenDung.Commands.CreateTinTuyenDung;

public class CreateTinTuyenDungCommand : JobDraftInput, IRequest<Response<int>> { }

public class CreateTinTuyenDungCommandHandler(IApplicationDbContext context,
    ICurrentNguoiDungService current, IDistributedCache cache)
    : IRequestHandler<CreateTinTuyenDungCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateTinTuyenDungCommand request, CancellationToken ct)
    {
        var user = await current.ResolveAsync();
        if (user.VaiTro is not (VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN) || !user.DoanhNghiepId.HasValue)
            throw new ApiException("Chỉ nhà tuyển dụng thuộc doanh nghiệp được tạo tin.", 403);
        var job = new Domain.Entities.TinTuyenDung
        {
            DoanhNghiepId = user.DoanhNghiepId.Value, NguoiDangTinId = user.Id,
            TrangThai = TrangThaiTinTuyenDung.Nhap,
            KyNangTinTuyenDungs = new List<Domain.Entities.KyNangTinTuyenDung>()
        };
        await JobDraft.ApplyAsync(context, job, request, ct);
        context.TinTuyenDungs.Add(job);
        await context.SaveChangesAsync(ct);
        await RecommendationCache.InvalidateJobsAsync(cache, ct);
        return new Response<int>(job.Id, "Đã lưu nháp. Tin chưa được gửi duyệt hoặc công khai.");
    }
}
