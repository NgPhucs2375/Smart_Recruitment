using System.Text.Json;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.UpdateCVUngVien
{
    public class UpdateCVUngVienCommand : IRequest<Response<int>>
    {
        public int Id { get; set; }

        public string TenFile { get; set; }

        public string TemplateId { get; set; }

        public bool IsDefault { get; set; }

        public PhuongThucTaoCV PhuongThucTao { get; set; }

        public NoiDungCVDto NoiDung { get; set; }
    }


    public class UpdateCVUngVienCommandHandler
        : IRequestHandler<UpdateCVUngVienCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        private readonly ICurrentNguoiDungService
            _currentNguoiDungService;

        private readonly ICvEmbeddingService
            _cvEmbeddingService;


        public UpdateCVUngVienCommandHandler(
            IApplicationDbContext context,
            ICurrentNguoiDungService currentNguoiDungService,
            ICvEmbeddingService cvEmbeddingService)
        {
            _context = context;

            _currentNguoiDungService =
                currentNguoiDungService;

            _cvEmbeddingService =
                cvEmbeddingService;
        }


        public async Task<Response<int>> Handle(
            UpdateCVUngVienCommand request,
            CancellationToken cancellationToken)
        {
            // =========================
            // 1. Tìm CV
            // =========================

            var entity = await _context.CVUngViens
                .AsTracking()
                .FirstOrDefaultAsync(
                    x =>
                        x.Id == request.Id &&
                        !x.IsDaXoa,
                    cancellationToken);


            if (entity == null)
            {
                return new Response<int>(
                    "Không tìm thấy CV.");
            }


            // =========================
            // 2. Kiểm tra quyền
            // =========================

            var currentUser =
                await _currentNguoiDungService.ResolveAsync();


            if (currentUser.VaiTro !=
                VaiTroNguoiDung.QUAN_TRI_VIEN)
            {
                var isOwner =
                    await _context.HoSoUngViens
                        .AnyAsync(
                            x =>
                                x.Id ==
                                    entity.HoSoUngVienId
                                &&
                                x.NguoiDungId ==
                                    currentUser.Id,
                            cancellationToken);


                if (!isOwner)
                {
                    return new Response<int>(
                        "Bạn không có quyền thao tác trên CV này.");
                }
            }


            // =========================
            // 3. Kiểm tra nội dung CV
            // =========================

            if (request.NoiDung == null)
            {
                return new Response<int>(
                    "Nội dung CV không được để trống.");
            }


            // =========================
            // 4. Cập nhật thông tin CV
            // =========================

            if (!string.IsNullOrWhiteSpace(
                request.TenFile))
            {
                entity.TenFile =
                    request.TenFile.Trim();
            }


            entity.TemplateId =
                request.TemplateId?.Trim();


            entity.PhuongThucTao =
                request.PhuongThucTao;


            // =========================
            // 5. Serialize nội dung mới
            // =========================

            var jsonOptions =
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy =
                        JsonNamingPolicy.CamelCase,

                    WriteIndented = false
                };


            entity.NoiDungJson =
                JsonSerializer.Serialize(
                    request.NoiDung,
                    jsonOptions);


            // =========================
            // 6. Xử lý CV mặc định
            // =========================

            if (request.IsDefault &&
                !entity.IsDefault)
            {
                var otherDefaultCvs =
                    await _context.CVUngViens
                        .AsTracking()
                        .Where(
                            x =>
                                x.HoSoUngVienId ==
                                    entity.HoSoUngVienId
                                &&
                                x.Id != entity.Id
                                &&
                                x.IsDefault
                                &&
                                !x.IsDaXoa)
                        .ToListAsync(
                            cancellationToken);


                foreach (var cv in otherDefaultCvs)
                {
                    cv.IsDefault = false;
                }


                entity.IsDefault = true;
            }
            else if (!request.IsDefault)
            {
                entity.IsDefault = false;
            }


            // =========================
            // 7. Lưu nội dung CV mới
            // =========================

            await _context.SaveChangesAsync(
                cancellationToken);


            // =========================
            // 8. Regenerate embedding
            // =========================

            await _cvEmbeddingService.GenerateAsync(
                entity.Id,
                cancellationToken);


            // =========================
            // 9. Trả kết quả
            // =========================

            return new Response<int>(
                data: entity.Id,
                message: "Cập nhật CV thành công.");
        }
    }
}