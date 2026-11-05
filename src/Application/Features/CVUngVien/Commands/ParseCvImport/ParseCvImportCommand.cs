using Application.DTOs.CV;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.CVUngVien.Commands.ParseCvImport;

public sealed class ParseCvImportCommand : IRequest<Response<ParsedCvResultDto>>
{
    public Guid SessionId { get; init; }
}

public sealed class ParseCvImportCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService,
    IFileStorageService fileStorageService,
    IUploadedCvTextExtractor textExtractor,
    ICvStructuredParser parser)
    : IRequestHandler<ParseCvImportCommand, Response<ParsedCvResultDto>>
{
    public async Task<Response<ParsedCvResultDto>> Handle(
        ParseCvImportCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var session = await context.CVImportSessions
            .AsTracking()
            .FirstOrDefaultAsync(x => x.Id == request.SessionId, cancellationToken);

        if (session == null ||
            session.NguoiDungId != currentUser.Id ||
            session.HoSoUngVienId <= 0)
        {
            return new Response<ParsedCvResultDto>("Phiên import không hợp lệ.");
        }

        if (session.ExpiresAt <= DateTime.UtcNow ||
            session.TrangThai == TrangThaiCvImport.Expired)
        {
            return new Response<ParsedCvResultDto>("Phiên import đã hết hạn.");
        }

        try
        {
            await using var fileStream = await fileStorageService.DownloadAsync(
                session.OriginalObjectKey,
                cancellationToken);
            var rawText = await textExtractor.ExtractAsync(
                fileStream,
                session.OriginalFileName,
                cancellationToken);

            if (string.IsNullOrWhiteSpace(rawText))
            {
                await DanhDauThatBai(cancellationToken);
                return new Response<ParsedCvResultDto>(
                    "Không trích xuất được nội dung từ file CV.");
            }

            var parsed = await parser.ParseAsync(rawText, cancellationToken);
            // Phiên đã Confirmed thì giữ nguyên: parse lại chỉ là xem lại kết quả,
            // không được kéo phiên đã dùng về trạng thái trung gian.
            if (session.TrangThai != TrangThaiCvImport.Confirmed)
            {
                session.TrangThai = TrangThaiCvImport.Parsed;
                await context.SaveChangesAsync(cancellationToken);
            }

            return new Response<ParsedCvResultDto>(
                new ParsedCvResultDto
                {
                    TenFile = session.OriginalFileName,
                    LoaiFile = session.OriginalContentType,
                    KichThuocFile = session.OriginalFileSize,
                    NoiDung = parsed,
                    CanhBao = new(),
                    CanXacNhanThuCong = true,
                },
                "Phân tích CV thành công.");
        }
        catch (Exception) when (session.TrangThai != TrangThaiCvImport.Confirmed)
        {
            // Trạng thái ThatBai phải xuống DB trước khi exception lan ra,
            // nếu không phiên hỏng sẽ nằm lại mãi ở Uploaded rồi bị job dọn
            // dẹp đánh dấu Expired (gây hiểu nhầm "hết hạn" thay vì "lỗi").
            await DanhDauThatBai(CancellationToken.None);
            throw;
        }

        async Task DanhDauThatBai(CancellationToken ct)
        {
            session.TrangThai = TrangThaiCvImport.Failed;
            try
            {
                await context.SaveChangesAsync(ct);
            }
            catch (DbUpdateException)
            {
                // Không được che lỗi phân tích bằng lỗi ghi trạng thái.
            }
        }
    }
}
