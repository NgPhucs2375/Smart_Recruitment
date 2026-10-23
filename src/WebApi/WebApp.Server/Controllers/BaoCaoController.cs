using System.Text;
using System.Text.Json;
using Application.Features.BaoCao.Queries.GetBaoCaoTuyenDung;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;
using StackExchange.Redis;

namespace WebApp.Server.Controllers;

[Authorize]
[Route("api/baocao")]
public class BaoCaoController(
    Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
    IDistributedCache cache)
    : BaseApiController(hostingEnvironment)
{
    private static readonly int[] KyHopLe = [0, 30, 90];
    private static readonly TimeSpan CacheTtl = TimeSpan.FromSeconds(60);

    // GET: api/baocao?ky=30
    // ky = 0 là toàn bộ thời gian. QUAN_TRI_VIEN thấy toàn hệ thống,
    // NGUOI_DAI_DIEN / NHAN_SU chỉ thấy số liệu doanh nghiệp mình.
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int ky = 30)
    {
        if (!KyHopLe.Contains(ky)) ky = 30;
        return await EnforcePermissionAndExecute(
            "baocao",
            "show",
            async () => Ok(new Application.Wrappers.Response<BaoCaoTuyenDungVm>(
                await GetBaoCaoAsync(ky, HttpContext.RequestAborted))));
    }

    // GET: api/baocao/csv?ky=30
    // Xuất số liệu đang tính thành file CSV (UTF-8 BOM để Excel mở đúng tiếng Việt).
    // Dùng chung entry cache với GET để không tính lại số liệu.
    [HttpGet("csv")]
    public async Task<IActionResult> GetCsv([FromQuery] int ky = 30)
    {
        if (!KyHopLe.Contains(ky)) ky = 30;
        return await EnforcePermissionAndExecute(
            "baocao",
            "show",
            async () =>
            {
                var baoCao = await GetBaoCaoAsync(ky, HttpContext.RequestAborted);
                var csv = BuildCsv(baoCao);
                var bytes = Encoding.UTF8.GetPreamble()
                    .Concat(Encoding.UTF8.GetBytes(csv))
                    .ToArray();
                return File(
                    bytes,
                    "text/csv; charset=utf-8",
                    $"bao-cao-tuyen-dung-ky-{ky}-{DateTime.UtcNow:yyyy-MM-dd}.csv");
            });
    }

    private async Task<BaoCaoTuyenDungVm> GetBaoCaoAsync(int ky, CancellationToken cancellationToken)
    {
        // Cache theo từng user để không rò rỉ scope:
        // admin (toàn hệ thống) và đại diện (theo công ty) không dùng chung key.
        var uid = User.FindFirst("uid")?.Value ?? "unknown";
        var cacheKey = $"cache:baocao:v1:uid:{uid}:ky:{ky}";
        try
        {
            var cached = await cache.GetStringAsync(cacheKey, cancellationToken);
            if (!string.IsNullOrWhiteSpace(cached))
            {
                var cachedVm = JsonSerializer.Deserialize<BaoCaoTuyenDungVm>(cached);
                if (cachedVm != null)
                    return cachedVm;
            }
        }
        catch (Exception ex) when (ex is RedisException || ex is System.Text.Json.JsonException)
        {
            // PostgreSQL là nguồn truth; lỗi cache (kể cả value hỏng) không fatal.
        }

        var result = (await Mediator.Send(
            new GetBaoCaoTuyenDungQuery { KyNgay = ky },
            cancellationToken)).Data!;

        try
        {
            await cache.SetStringAsync(
                cacheKey,
                JsonSerializer.Serialize(result),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = CacheTtl },
                cancellationToken);
        }
        catch (RedisException)
        {
            // PostgreSQL là nguồn truth; lỗi cache không fatal.
        }

        return result;
    }

    private static string BuildCsv(BaoCaoTuyenDungVm vm)
    {
        var rows = new List<string[]>
        {
            new[] { "Kỳ báo cáo", vm.KyNgay == 0 ? "Toàn bộ thời gian" : $"{vm.KyNgay} ngày qua" },
            new[] { "Phạm vi", vm.PhamVi == "he-thong" ? "Toàn hệ thống" : "Doanh nghiệp của bạn" },
            new[] { "Tin đăng", vm.TinDaDang.ToString() },
            new[] { "Lượt nộp đơn", vm.LuotNop.ToString() },
            new[] { "Ứng viên duy nhất", vm.UngVienDuyNhat.ToString() },
        };
        if (vm.KyNgay != 0)
        {
            rows.Add(new[] { "Tin đăng kỳ trước", (vm.TinKyTruoc ?? 0).ToString() });
            rows.Add(new[] { "Tăng trưởng tin (%)", DinhDangTyLe(vm.TyLeTin) });
            rows.Add(new[] { "Lượt nộp kỳ trước", (vm.LuotNopKyTruoc ?? 0).ToString() });
            rows.Add(new[] { "Tăng trưởng lượt nộp (%)", DinhDangTyLe(vm.TyLeNop) });
        }
        rows.Add(new[] { "Tỷ lệ duyệt tin (%)", DinhDangTyLe(vm.DuyetTin.TyLeDuyet) });
        rows.Add(new[] { "Tin đã duyệt", vm.DuyetTin.DaDuyet.ToString() });
        rows.Add(new[] { "Tin chờ duyệt", vm.DuyetTin.ChoDuyet.ToString() });
        rows.Add(new[] { "Tin bị từ chối", vm.DuyetTin.TuChoi.ToString() });
        rows.Add(Array.Empty<string>());
        rows.Add(new[] { "Trạng thái hồ sơ", "Số lượng" });
        rows.AddRange(vm.KetQua.Select(k => new[] { BaoCaoLabels.NhanTrangThaiDon(k.TrangThaiId), k.SoLuong.ToString() }));
        rows.Add(Array.Empty<string>());
        rows.Add(new[] { "Xu hướng (ngày)", "Lượt nộp" });
        rows.AddRange(vm.XuHuong.Select(x => new[] { x.Ngay, x.SoLuong.ToString() }));
        rows.Add(Array.Empty<string>());
        rows.Add(new[] { "Top tin nhiều đơn nhất", "Trạng thái", "Số đơn" });
        rows.AddRange(vm.TopTin.Select(t => new[] { t.TieuDe, t.TrangThai, t.SoDon.ToString() }));

        return string.Join("\r\n", rows.Select(r =>
            string.Join(",", r.Select(o => $"\"{o.Replace("\"", "\"\"")}\""))));
    }

    private static string DinhDangTyLe(double? tyLe) => tyLe?.ToString("0.0") ?? "—";
}
