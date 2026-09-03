using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using DoanhNghiepEntity = global::Domain.Entities.DoanhNghiep;

namespace Application.Features.DoanhNghiep.Commands.CreateDoanhNghiep;

public class CreateDoanhNghiepCommand : IRequest<Response<int>>
{
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

public class CreateDoanhNghiepCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateDoanhNghiepCommand, Response<int>>
{
    public async Task<Response<int>> Handle(CreateDoanhNghiepCommand request, CancellationToken cancellationToken)
    {
        var entity = new DoanhNghiepEntity { TenDoanhNghiep = request.TenDoanhNghiep, MoTa = request.MoTa, Website = request.Website, DiaChi = request.DiaChi, LogoUrl = request.LogoUrl, MaSoThue = request.MaSoThue, LinhVucHoatDong = request.LinhVucHoatDong, QuyMoNhanSu = request.QuyMoNhanSu, NguoiDaiDien = request.NguoiDaiDien };
        await context.DoanhNghieps.AddAsync(entity, cancellationToken); await context.SaveChangesAsync(cancellationToken);
        return new Response<int>(data: entity.Id, message: "Tạo doanh nghiệp thành công.");
    }
}
