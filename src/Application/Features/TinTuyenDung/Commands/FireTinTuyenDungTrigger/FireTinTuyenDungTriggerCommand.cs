using Application.Exceptions;
using Application.Features.KetQuaPhuHop.Cache;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;

namespace Application.Features.TinTuyenDung.Commands.FireTinTuyenDungTrigger;

public class FireTinTuyenDungTriggerCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public TriggerTinTuyenDung Trigger { get; set; }
    public string GhiChu { get; set; } = "";
    public DateTime? ExpectedLastModified { get; set; }
}

public class FireTinTuyenDungTriggerCommandHandler(IApplicationDbContext context,
    ICurrentNguoiDungService current, ITinTuyenDungWorkflowService workflow,
    ITinTuyenDungFunnelService funnel, IDistributedCache cache)
    : IRequestHandler<FireTinTuyenDungTriggerCommand, Response<int>>
{
    public async Task<Response<int>> Handle(FireTinTuyenDungTriggerCommand request, CancellationToken ct)
    {
        if (TinTuyenDungStateMachine.LaTriggerHeThong(request.Trigger))
            return new Response<int>("Hành động này chỉ hệ thống được thực hiện.");
        var job = await context.TinTuyenDungs.AsTracking().Include(x => x.NguoiDangTin)
            .FirstOrDefaultAsync(x => x.Id == request.Id, ct);
        if (job == null) return new Response<int>("Không tìm thấy tin tuyển dụng.");
        JobDraft.EnsureVersion(job, request.ExpectedLastModified);
        if (request.Trigger is TriggerTinTuyenDung.AdminTuChoi or TriggerTinTuyenDung.NguoiDaiDienTuChoi or TriggerTinTuyenDung.AdminCuongCheKhoa
            && string.IsNullOrWhiteSpace(request.GhiChu))
            return new Response<int>("Vui lòng nhập lý do từ chối hoặc khóa tin.");
        var machine = new TinTuyenDungStateMachine(workflow, current, job);
        try { await machine.FireAsync(request.Trigger, request.GhiChu, ct); }
        catch (ApiException ex) { return new Response<int>(ex.Message); }

        var message = "Đã cập nhật trạng thái tin.";
        if (job.TrangThai == TrangThaiTinTuyenDung.ChoDuyetHeThong &&
            request.Trigger is TriggerTinTuyenDung.GuiDuyet or TriggerTinTuyenDung.MoLaiTin or TriggerTinTuyenDung.NguoiDaiDienDuyet)
        {
            message = await JobScreening.RunAsync(job, machine, funnel, ct);
        }
        else if (job.TrangThai == TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet)
            message = "Tin đã gửi Người đại diện duyệt. Bộ lọc hệ thống chỉ chạy sau khi Người đại diện đồng ý.";
        else if (request.Trigger == TriggerTinTuyenDung.AdminDuyet)
            message = "Admin đã duyệt tay tin bị bộ lọc gắn cờ. Tin được công khai.";
        else if (request.Trigger is TriggerTinTuyenDung.AdminTuChoi or TriggerTinTuyenDung.NguoiDaiDienTuChoi)
            message = "Tin đã bị từ chối. Người đăng có thể sửa và gửi lại.";

        await context.SaveChangesAsync(ct);
        await RecommendationCache.InvalidateJobsAsync(cache, ct);
        return new Response<int>(job.Id, message);
    }
}
