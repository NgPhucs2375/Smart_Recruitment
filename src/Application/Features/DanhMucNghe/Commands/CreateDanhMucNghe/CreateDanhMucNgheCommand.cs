using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;
using DanhMucNgheEntity = global::Domain.Entities.DanhMucNghe;
namespace Application.Features.DanhMucNghe.Commands.CreateDanhMucNghe;
public class CreateDanhMucNgheCommand : IRequest<Response<int>> { public string TenNghe { get; set; } public string MoTa { get; set; } }
public class CreateDanhMucNgheCommandHandler(IApplicationDbContext context) : IRequestHandler<CreateDanhMucNgheCommand, Response<int>>
{ public async Task<Response<int>> Handle(CreateDanhMucNgheCommand request, CancellationToken cancellationToken) { if (await context.DanhMucNghes.AnyAsync(x => x.TenNghe == request.TenNghe, cancellationToken)) return new Response<int>("Tên ngành nghề đã tồn tại."); var entity = new DanhMucNgheEntity { TenNghe = request.TenNghe, MoTa = request.MoTa }; await context.DanhMucNghes.AddAsync(entity, cancellationToken); await context.SaveChangesAsync(cancellationToken); return new Response<int>(data: entity.Id, message: "Tạo danh mục nghề thành công."); } }
