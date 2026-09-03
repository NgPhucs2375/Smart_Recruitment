using Application.Interfaces;
using Application.Wrappers;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.DoanhNghiep.Commands.UpdateDoanhNghiep;

public class UpdateDoanhNghiepCommand : IRequest<Response<int>>
{
    public int Id { get; set; }
    public string TenDoanhNghiep { get; set; }
    public string MoTa { get; set; }
    public string Website { get; set; }
    public string DiaChi { get; set; }
    public string LogoUrl { get; set; }
    public string MaSoThue { get; set; }
    public string LinhVucHoatDong { get; set; }
    public string QuyMoNhanSu { get; set; }
    public string NguoiDaiDien { get; set; }
}

public class UpdateDoanhNghiepCommandHandler(IApplicationDbContext context) : IRequestHandler<UpdateDoanhNghiepCommand, Response<int>>
{
    public async Task<Response<int>> Handle(UpdateDoanhNghiepCommand request, CancellationToken cancellationToken)
    {
        var entity = await context.DoanhNghieps.AsTracking().FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
        if (entity == null) return new Response<int>("Không tìm thấy doanh nghiệp.");
        entity.TenDoanhNghiep = request.TenDoanhNghiep; entity.MoTa = request.MoTa; entity.Website = request.Website; entity.DiaChi = request.DiaChi; entity.LogoUrl = request.LogoUrl; entity.MaSoThue = request.MaSoThue; entity.LinhVucHoatDong = request.LinhVucHoatDong; entity.QuyMoNhanSu = request.QuyMoNhanSu; entity.NguoiDaiDien = request.NguoiDaiDien;
        await context.SaveChangesAsync(cancellationToken); return new Response<int>(data: entity.Id, message: "Cập nhật doanh nghiệp thành công.");
    }
}
