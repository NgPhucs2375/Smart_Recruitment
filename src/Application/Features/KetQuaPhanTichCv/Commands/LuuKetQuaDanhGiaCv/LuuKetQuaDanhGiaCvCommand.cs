using Application.Interfaces;
using Application.Wrappers;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Application.Features.KetQuaPhanTichCv.Commands.LuuKetQuaDanhGiaCv;

/// <summary>
/// Upsert kết quả đánh giá CV theo tin tuyển dụng vào đúng dòng KetQuaPhanTichCv
/// của CV (một dòng/CV). Dùng cho cả trạng thái đang chạy, hoàn tất và thất bại.
/// </summary>
public class LuuKetQuaDanhGiaCvCommand : IRequest<Response<bool>>
{
    public int CvUngVienId { get; set; }
    public TrangThaiPhanTichAgent TrangThai { get; set; }
    public int? TinTuyenDungId { get; set; }
    public int? DiemTongQuan { get; set; }
    public float? DiemPhuHop { get; set; }
    public string? MatchingVersion { get; set; }
    public string? NhanXet { get; set; }
    public List<string> DiemManh { get; set; } = new();
    public List<string> DiemYeu { get; set; } = new();
    public List<CvGoiY> GoiY { get; set; } = new();
    public bool DaDanhGiaBangAi { get; set; }
}

public sealed record CvGoiY(string Phan, string Viec);

public class LuuKetQuaDanhGiaCvCommandHandler(
    IApplicationDbContext context,
    ICurrentNguoiDungService currentNguoiDungService)
    : IRequestHandler<LuuKetQuaDanhGiaCvCommand, Response<bool>>
{
    public async Task<Response<bool>> Handle(
        LuuKetQuaDanhGiaCvCommand request,
        CancellationToken cancellationToken)
    {
        var currentUser = await currentNguoiDungService.ResolveAsync();
        var soHuu = await context.CVUngViens.AsNoTracking()
            .AnyAsync(x => x.Id == request.CvUngVienId &&
                           x.HoSoUngVien.NguoiDungId == currentUser.Id && !x.IsDaXoa,
                cancellationToken);
        if (!soHuu)
            return new Response<bool>("Không tìm thấy CV của bạn.");

        // DbContext đặt NoTracking toàn cục — phải AsTracking nếu không các cột
        // sửa trên dòng đã có sẽ không bao giờ được ghi.
        var dong = await context.KetQuaPhanTichCvs
            .AsTracking()
            .FirstOrDefaultAsync(x => x.CVUngVienId == request.CvUngVienId, cancellationToken);
        if (dong == null)
        {
            dong = new Domain.Entities.KetQuaPhanTichCv { CVUngVienId = request.CvUngVienId };
            await context.KetQuaPhanTichCvs.AddAsync(dong, cancellationToken);
        }

        dong.PhanTich = request.TrangThai;

        // Khi đang chạy, giữ nguyên kết quả cũ để trang không trắng;
        // chỉ ghi đè khi có kết quả mới (hoàn tất hoặc fallback).
        if (request.TrangThai != TrangThaiPhanTichAgent.DangPhanTich)
        {
            dong.TinTuyenDungId = request.TinTuyenDungId;
            dong.DiemTongQuan = request.DiemTongQuan;
            dong.DiemPhuHop = request.DiemPhuHop;
            dong.MatchingVersion = request.MatchingVersion;
            dong.NhanXet = request.NhanXet;
            dong.DiemManh = JoinLines(request.DiemManh);
            dong.DiemYeu = JoinLines(request.DiemYeu);
            dong.GoiY = JoinGoiY(request.GoiY);
            dong.DaDanhGiaBangAi = request.DaDanhGiaBangAi;
            dong.DanhGiaLuc = DateTime.UtcNow;
        }

        await context.SaveChangesAsync(cancellationToken);
        return new Response<bool>(true);
    }

    private static string? JoinLines(List<string>? items)
    {
        var lines = (items ?? new List<string>())
            .Select(x => x?.Trim())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .ToList();
        return lines.Count == 0 ? null : string.Join("\n", lines);
    }

    private static string? JoinGoiY(List<CvGoiY>? items)
    {
        var lines = (items ?? new List<CvGoiY>())
            .Where(x => !string.IsNullOrWhiteSpace(x.Viec))
            .Select(x => $"{(string.IsNullOrWhiteSpace(x.Phan) ? "tong-the" : x.Phan.Trim())}|{x.Viec.Trim()}")
            .ToList();
        return lines.Count == 0 ? null : string.Join("\n", lines);
    }
}
