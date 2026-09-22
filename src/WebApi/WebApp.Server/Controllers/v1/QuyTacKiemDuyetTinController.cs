using Application.Interfaces;
using Application.Wrappers;
using Casbin;
using Domain.Entities;
using Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/quytackiemduyettins")]
    public class QuyTacKiemDuyetTinController : BaseApiController
    {
        private readonly IApplicationDbContext _context;

        public QuyTacKiemDuyetTinController(
            IWebHostEnvironment environment,
            Enforcer enforcer,
            IApplicationDbContext context) : base(environment, enforcer)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] string _filter = "")
        {
            return await EnforcePermissionAndExecute("quytackiemduyettins", "list", async () =>
            {
                var query = _context.QuyTacKiemDuyetTins.AsNoTracking();
                if (!string.IsNullOrWhiteSpace(_filter))
                {
                    var keyword = _filter.Trim().ToLower();
                    query = query.Where(x => x.TuKhoa.ToLower().Contains(keyword)
                        || (x.MoTa != null && x.MoTa.ToLower().Contains(keyword)));
                }

                var items = await query.OrderBy(x => x.Loai).ThenBy(x => x.TuKhoa).ToListAsync();
                return Ok(new Response<List<QuyTacKiemDuyetTin>>(items));
            });
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LuuQuyTacKiemDuyetTinRequest request)
        {
            return await EnforcePermissionAndExecute("quytackiemduyettins", "create", async () =>
            {
                var validation = Validate(request);
                if (validation != null) return Ok(new Response<int>(validation));

                var keyword = request.TuKhoa.Trim();
                var exists = await _context.QuyTacKiemDuyetTins.AnyAsync(x =>
                    x.Loai == request.Loai && x.TuKhoa.ToLower() == keyword.ToLower());
                if (exists) return Ok(new Response<int>("Từ khóa đã tồn tại trong loại rule này."));

                var entity = new QuyTacKiemDuyetTin
                {
                    TuKhoa = keyword,
                    Loai = request.Loai,
                    DiemTru = request.Loai == LoaiQuyTacKiemDuyet.TuKhoaCam ? 100 : request.DiemTru,
                    MoTa = request.MoTa?.Trim(),
                    IsActive = request.IsActive
                };
                _context.QuyTacKiemDuyetTins.Add(entity);
                await _context.SaveChangesAsync();
                return Ok(new Response<int>(entity.Id, "Đã thêm rule kiểm duyệt."));
            });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] LuuQuyTacKiemDuyetTinRequest request)
        {
            return await EnforcePermissionAndExecute("quytackiemduyettins", "edit", async () =>
            {
                var validation = Validate(request);
                if (validation != null) return Ok(new Response<int>(validation));

                var entity = await _context.QuyTacKiemDuyetTins.FindAsync(id);
                if (entity == null) return Ok(new Response<int>("Không tìm thấy rule kiểm duyệt."));

                var keyword = request.TuKhoa.Trim();
                var exists = await _context.QuyTacKiemDuyetTins.AsNoTracking().AnyAsync(x =>
                    x.Id != id && x.Loai == request.Loai && x.TuKhoa.ToLower() == keyword.ToLower());
                if (exists) return Ok(new Response<int>("Từ khóa đã tồn tại trong loại rule này."));

                entity.TuKhoa = keyword;
                entity.Loai = request.Loai;
                entity.DiemTru = request.Loai == LoaiQuyTacKiemDuyet.TuKhoaCam ? 100 : request.DiemTru;
                entity.MoTa = request.MoTa?.Trim();
                entity.IsActive = request.IsActive;
                await _context.SaveChangesAsync();
                return Ok(new Response<int>(entity.Id, "Đã cập nhật rule kiểm duyệt."));
            });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("quytackiemduyettins", "delete", async () =>
            {
                var entity = await _context.QuyTacKiemDuyetTins.FindAsync(id);
                if (entity == null) return Ok(new Response<int>("Không tìm thấy rule kiểm duyệt."));
                _context.QuyTacKiemDuyetTins.Remove(entity);
                await _context.SaveChangesAsync();
                return Ok(new Response<int>(id, "Đã xóa rule kiểm duyệt."));
            });
        }

        private static string? Validate(LuuQuyTacKiemDuyetTinRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.TuKhoa)) return "Từ khóa không được để trống.";
            if (request.TuKhoa.Trim().Length > 255) return "Từ khóa không được vượt quá 255 ký tự.";
            if (!Enum.IsDefined(request.Loai)) return "Loại rule không hợp lệ.";
            if (request.Loai == LoaiQuyTacKiemDuyet.TinHieuRuiRo && (request.DiemTru < 1 || request.DiemTru > 100))
                return "Điểm trừ phải từ 1 đến 100.";
            return null;
        }
    }

    public class LuuQuyTacKiemDuyetTinRequest
    {
        public string TuKhoa { get; set; } = string.Empty;
        public LoaiQuyTacKiemDuyet Loai { get; set; }
        public int DiemTru { get; set; }
        public string? MoTa { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
