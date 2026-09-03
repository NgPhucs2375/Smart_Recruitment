using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using KetQuaPhanTichCvEntity = global::Domain.Entities.KetQuaPhanTichCv;
namespace Application.Features.KetQuaPhanTichCv.Commands.CreateKetQuaPhanTichCv;
public class CreateKetQuaPhanTichCvCommand : IRequest<Response<int>> { public int CVUngVienId { get; set; } public string NoiDungTrichXuat { get; set; } public string KyNangTrichXuat { get; set; } public string KinhNghiemTrichXuat { get; set; } public DateTime? NgayPhanTich { get; set; } }
public class CreateKetQuaPhanTichCvCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateKetQuaPhanTichCvCommand, Response<int>> { public async Task<Response<int>> Handle(CreateKetQuaPhanTichCvCommand request, CancellationToken cancellationToken) { if (!await context.CVUngViens.AnyAsync(x => x.Id == request.CVUngVienId, cancellationToken)) return new Response<int>("Không tìm thấy CV."); var entity = new KetQuaPhanTichCvEntity { CVUngVienId = request.CVUngVienId, NoiDungTrichXuat = request.NoiDungTrichXuat, KyNangTrichXuat = request.KyNangTrichXuat, KinhNghiemTrichXuat = request.KinhNghiemTrichXuat, NgayPhanTich = request.NgayPhanTich ?? DateTime.UtcNow }; await context.KetQuaPhanTichCvs.AddAsync(entity, cancellationToken); await context.SaveChangesAsync(cancellationToken); return new Response<int>(entity.Id, "Tạo kết quả phân tích CV thành công."); } }
