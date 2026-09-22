using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs
{
    public class GetAllTinTuyenDungsQuery : IRequest<PagedResponse<List<GetAllTinTuyenDungsViewModel>>>
    {
        public int _start { get; set; }
        public int _end { get; set; }
        public string _order { get; set; }
        public string _sort { get; set; }
        public string _filter { get; set; }
        public string Location { get; set; }
        public decimal? SalaryMin { get; set; }
        public decimal? SalaryMax { get; set; }
        public string Level { get; set; }
        public string EmploymentType { get; set; }
        public string WorkMode { get; set; }
    }

    public class GetAllTinTuyenDungsQueryHandler(
        IApplicationDbContext context,
        ICurrentNguoiDungService current)
        : IRequestHandler<GetAllTinTuyenDungsQuery, PagedResponse<List<GetAllTinTuyenDungsViewModel>>>
    {
        public async Task<PagedResponse<List<GetAllTinTuyenDungsViewModel>>> Handle(
            GetAllTinTuyenDungsQuery request,
            CancellationToken cancellationToken)
        {
            var ctx = await current.ResolveAsync();

            var query = context.TinTuyenDungs.AsNoTracking();

            if (ctx.VaiTro == VaiTroNguoiDung.NHAN_SU)
            {
                query = query.Where(t => t.NguoiDangTinId == ctx.Id);
            }
            else if (ctx.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            {
                query = query.Where(t => t.DoanhNghiepId == ctx.DoanhNghiepId);
            }
            else // UNG_VIEN: chỉ tin công khai
            {
                query = query.Where(t => t.TrangThai == TrangThaiTinTuyenDung.DangTuyen);
            }

            var filter = request._filter?.Trim();

            if (!string.IsNullOrWhiteSpace(filter))
            {
                query = query.Where(t => t.TieuDe.Contains(filter)
                    || t.MoTaCongViec.Contains(filter)
                    || t.YeuCauCongViec.Contains(filter)
                    || t.KyNangTinTuyenDungs.Any(k => k.KyNang.TenKyNang.Contains(filter))
                    || t.DoanhNghiep.TenDoanhNghiep.Contains(filter));
            }

            if (!string.IsNullOrWhiteSpace(request.Location))
            {
                query = query.Where(t => t.DiaDiemLamViec.Contains(request.Location));
            }

            if (request.SalaryMin.HasValue)
            {
                query = query.Where(t => t.LuongToiDa >= request.SalaryMin.Value);
            }

            if (request.SalaryMax.HasValue)
            {
                query = query.Where(t => t.LuongToiThieu <= request.SalaryMax.Value);
            }

            // Level / EmploymentType / WorkMode lọc in-memory phía dưới
            // vì DB chưa có cột riêng (giữ nguyên để bàn giao migration sau).

            query = request._sort?.ToLower() switch
            {
                "tieude" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(t => t.TieuDe)
                    : query.OrderBy(t => t.TieuDe),
                "luong" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(t => t.LuongToiDa)
                    : query.OrderBy(t => t.LuongToiThieu),
                "ngaytao" => request._order?.ToLower() == "desc"
                    ? query.OrderByDescending(t => t.Created)
                    : query.OrderBy(t => t.Created),
                _ => query.OrderByDescending(t => t.Id)
            };

            // _start/_end legacy (offset/end-index) -> pageNumber/pageSize
            var start = request._start < 0 ? 0 : request._start;
            var end = request._end <= start ? start + 20 : request._end;
            var pageSize = end - start;
            if (pageSize < 1) pageSize = 20;
            if (pageSize > 100) pageSize = 100;
            var pageNumber = (start / pageSize) + 1;
            if (pageNumber < 1) pageNumber = 1;

            // Lọc DB bằng cột thật: keyword / location / salary overlap.
            // Level / EmploymentType / WorkMode chưa có cột riêng -> lọc in-memory
            // trên giá trị suy luận tập trung ở BE (FE không còn suy luận).
            var rows = await query.Select(t => new GetAllTinTuyenDungsViewModel
                {
                    Id = t.Id,
                    DanhMucNgheId = t.DanhMucNgheId,
                    TieuDe = t.TieuDe,
                    MoTaCongViec = t.MoTaCongViec,
                    KinhNghiemYeuCau = t.KinhNghiemYeuCau,
                    YeuCauCongViec = t.YeuCauCongViec,
                    QuyenLoi = t.QuyenLoi,
                    DiaDiemLamViec = t.DiaDiemLamViec,
                    LuongToiThieu = t.LuongToiThieu,
                    LuongToiDa = t.LuongToiDa,
                    TrangThai = t.TrangThai.ToString(),
                    NgayHetHan = t.NgayHetHan,
                    NguoiDangTinId = t.NguoiDangTinId,
                    DoanhNghiepId = t.DoanhNghiepId,
                    TenDoanhNghiep = t.DoanhNghiep.TenDoanhNghiep,
                    KyNangs = t.KyNangTinTuyenDungs
                        .Select(k => k.KyNang.TenKyNang)
                        .ToList(),
                    SoLuongUngVien = t.DonUngTuyens.Count,
                    Created = t.Created,
                    WorkMode = InferWorkMode(t.DiaDiemLamViec, t.MoTaCongViec),
                    Level = InferLevel(t.TieuDe, t.KinhNghiemYeuCau),
                    EmploymentType = InferEmploymentType(t.YeuCauCongViec, t.MoTaCongViec)
                }).ToListAsync(cancellationToken);

            if (!string.IsNullOrWhiteSpace(request.Level))
            {
                rows = rows.Where(x => string.Equals(x.Level, request.Level, System.StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(request.EmploymentType))
            {
                rows = rows.Where(x => string.Equals(x.EmploymentType, request.EmploymentType, System.StringComparison.OrdinalIgnoreCase)).ToList();
            }

            if (!string.IsNullOrWhiteSpace(request.WorkMode))
            {
                rows = rows.Where(x => string.Equals(x.WorkMode, request.WorkMode, System.StringComparison.OrdinalIgnoreCase)).ToList();
            }

            var pagedList = PagedList<GetAllTinTuyenDungsViewModel>.ToPagedList(rows, pageNumber, pageSize);

            return new PagedResponse<List<GetAllTinTuyenDungsViewModel>>(
                pagedList.ToList(),
                pagedList.PageNumber,
                pagedList.PageSize,
                pagedList.TotalCount,
                pagedList.TotalPages);
        }

        private static string InferWorkMode(string location, string description)
        {
            var value = $"{location} {description}".ToLower();
            if (value.Contains("remote") || value.Contains("từ xa") || value.Contains("online"))
                return "Remote";
            if (value.Contains("hybrid") || value.Contains("kết hợp") || value.Contains("linh hoạt"))
                return "Hybrid";
            return "Onsite";
        }

        private static string InferLevel(string title, string experience)
        {
            var value = $"{title} {experience}".ToLower();
            if (value.Contains("intern") || value.Contains("thực tập"))
                return "Intern";
            if (value.Contains("fresher") || value.Contains("mới tốt nghiệp"))
                return "Fresher";
            if (value.Contains("junior"))
                return "Junior";
            if (value.Contains("lead") || value.Contains("trưởng nhóm"))
                return "Lead";
            if (value.Contains("manager") || value.Contains("quản lý"))
                return "Manager";
            if (value.Contains("senior") || value.Contains("cao cấp"))
                return "Senior";
            return "Mid";
        }

        private static string InferEmploymentType(string requirements, string description)
        {
            var value = $"{requirements} {description}".ToLower();
            if (value.Contains("part-time") || value.Contains("bán thời gian") || value.Contains("part time"))
                return "Part-time";
            if (value.Contains("freelance") || value.Contains("tự do"))
                return "Freelance";
            if (value.Contains("contract") || value.Contains("hợp đồng"))
                return "Contract";
            return "Full-time";
        }
    }
}