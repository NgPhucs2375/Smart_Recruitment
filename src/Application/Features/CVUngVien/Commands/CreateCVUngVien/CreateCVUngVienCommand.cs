using System.Text.Json;
using Application.DTOs.CV;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Services.Embedding;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

using CVUngVienEntity = global::Domain.Entities.CVUngVien;

namespace Application.Features.CVUngVien.Commands.CreateCVUngVien
{
    public class CreateCVUngVienCommand : IRequest<Response<int>>
    {
        public int HoSoUngVienId { get; set; }

        public string TenFile { get; set; }

        public string TemplateId { get; set; }

        public bool IsDefault { get; set; } = true;

        public PhuongThucTaoCV PhuongThucTao { get; set; }

        public NoiDungCVDto NoiDung { get; set; }
    }


    public class CreateCVUngVienCommandHandler
        : IRequestHandler<CreateCVUngVienCommand, Response<int>>
    {
        private readonly IApplicationDbContext _context;

        private readonly ICurrentNguoiDungService _currentNguoiDungService;

        private readonly ICvEmbeddingService _cvEmbeddingService;


        public CreateCVUngVienCommandHandler(
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
            CreateCVUngVienCommand request,
            CancellationToken cancellationToken)
        {
            // ==========================================
            // 1. Kiểm tra hồ sơ ứng viên
            // ==========================================

            var hoSo = await _context.HoSoUngViens
                .AsNoTracking()
                .FirstOrDefaultAsync(
                    x => x.Id == request.HoSoUngVienId,
                    cancellationToken);

            if (hoSo == null)
            {
                return new Response<int>(
                    "Hồ sơ ứng viên không tồn tại.");
            }


            // ==========================================
            // 2. Kiểm tra quyền người dùng
            // ==========================================

            var currentUser =
                await _currentNguoiDungService.ResolveAsync();

            var isAdmin =
                currentUser.VaiTro ==
                VaiTroNguoiDung.QUAN_TRI_VIEN;

            var isOwner =
                hoSo.NguoiDungId == currentUser.Id;

            if (!isAdmin && !isOwner)
            {
                return new Response<int>(
                    "Bạn không có quyền thao tác trên hồ sơ ứng viên này.");
            }


            // ==========================================
            // 3. Kiểm tra nội dung CV
            // ==========================================

            if (request.NoiDung == null)
            {
                return new Response<int>(
                    "Nội dung CV không được để trống.");
            }


            // ==========================================
            // 4. Kiểm tra CV đã tồn tại hay chưa
            // ==========================================

            var hasExistingCv =
                await _context.CVUngViens
                    .AnyAsync(
                        x =>
                            x.HoSoUngVienId ==
                                request.HoSoUngVienId
                            &&
                            !x.IsDaXoa,
                        cancellationToken);


            // ==========================================
            // 5. Xác định CV mặc định
            // ==========================================

            // Nếu chưa có CV nào
            // => CV đầu tiên luôn là mặc định
            var isDefault =
                !hasExistingCv ||
                request.IsDefault;


            // Nếu CV mới được chọn mặc định
            // => bỏ mặc định của CV cũ
            if (isDefault && hasExistingCv)
            {
                var oldDefaultCvs =
                    await _context.CVUngViens
                        .AsTracking()
                        .Where(
                            x =>
                                x.HoSoUngVienId ==
                                    request.HoSoUngVienId
                                &&
                                x.IsDefault
                                &&
                                !x.IsDaXoa)
                        .ToListAsync(
                            cancellationToken);


                foreach (var oldCv in oldDefaultCvs)
                {
                    oldCv.IsDefault = false;
                }
            }


            // ==========================================
            // 6. Serialize NoiDungCVDto thành JSON
            // ==========================================

            var jsonOptions =
                new JsonSerializerOptions
                {
                    PropertyNamingPolicy =
                        JsonNamingPolicy.CamelCase,

                    WriteIndented = false
                };


            var noiDungJson =
                JsonSerializer.Serialize(
                    request.NoiDung,
                    jsonOptions);


            // ==========================================
            // 7. Tạo entity CVUngVien
            // ==========================================

            var entity =
                new CVUngVienEntity
                {
                    HoSoUngVienId =
                        request.HoSoUngVienId,

                    TenFile =
                        string.IsNullOrWhiteSpace(
                            request.TenFile)
                        ? $"CV-{DateTime.UtcNow:yyyyMMddHHmmss}"
                        : request.TenFile.Trim(),

                    FileUrl = null,

                    NgayUpload =
                        DateTime.UtcNow,

                    IsDefault =
                        isDefault,

                    IsDaXoa =
                        false,

                    NoiDungJson =
                        noiDungJson,

                    TemplateId =
                        request.TemplateId?.Trim(),

                    PhuongThucTao =
                        request.PhuongThucTao
                };


            // ==========================================
            // 8. Lưu CV vào database
            // ==========================================

            await _context.CVUngViens.AddAsync(
                entity,
                cancellationToken);


            await _context.SaveChangesAsync(
                cancellationToken);


            // ==========================================
            // 9. Tạo Chunkless Embedding cho CV
            // ==========================================

            try
            {
                await _cvEmbeddingService.GenerateAsync(
                    entity.Id,
                    cancellationToken);
            }
            catch (Exception)
            {
                /*
                 * CV đã được tạo thành công.
                 *
                 * Nếu Gemini hoặc Vector DB lỗi
                 * thì không nên rollback việc tạo CV.
                 *
                 * Sau này nên:
                 *
                 * - log lỗi
                 * - đánh dấu trạng thái embedding
                 * - background job retry
                 */
            }


            // ==========================================
            // 10. Trả kết quả
            // ==========================================

            return new Response<int>(
                data: entity.Id,
                message: "Tạo CV thành công.");
        }
    }
}