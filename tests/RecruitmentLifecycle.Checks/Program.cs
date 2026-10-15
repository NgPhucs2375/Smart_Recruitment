using Application.DTOs.Email;
using Application.DTOs.ThongBao;
using Application.Exceptions;
using Application.Features.TinTuyenDung.Commands.CreateTinTuyenDung;
using Application.Features.TinTuyenDung.Commands.UpdateTinTuyenDung;
using Application.Features.TinTuyenDung.Commands.FireTinTuyenDungTrigger;
using Application.Features.TinTuyenDung.Commands.DeleteTinTuyenDung;
using Application.Interfaces;
using Application.Services.StateMachineTinTuyenDung;
using Domain.Common;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;

var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
await using var db = new CheckContext(options);
db.DanhMucNghes.Add(new() { Id = 1, TenNghe = "Engineering", MoTa = "" });
db.KyNangs.Add(new() { Id = 1, TenKyNang = "C#" });
db.NguoiDungs.AddRange(new NguoiDung { Id = 1, ApplicationUserId = "hr", VaiTro = VaiTroNguoiDung.NHAN_SU },
    new NguoiDung { Id = 2, ApplicationUserId = "owner", VaiTro = VaiTroNguoiDung.NGUOI_DAI_DIEN },
    new NguoiDung { Id = 9, ApplicationUserId = "admin", VaiTro = VaiTroNguoiDung.QUAN_TRI_VIEN });
await db.SaveChangesAsync();
var current = new CurrentUser();
var cache = new MemoryDistributedCache(Options.Create(new MemoryDistributedCacheOptions()));
var delivery = new Delivery(db);
var workflow = new TinTuyenDungWorkflowService(db, delivery, delivery, delivery);
var funnel = new CountingFilter(new TinTuyenDungFunnelService(db));
var create = new CreateTinTuyenDungCommandHandler(db, current, cache);
var update = new UpdateTinTuyenDungCommandHandler(db, current, cache);
var fire = new FireTinTuyenDungTriggerCommandHandler(db, current, workflow, funnel, cache);
void Check(bool value, string message) { if (!value) throw new Exception(message); Console.WriteLine("PASS " + message); }
async Task<TinTuyenDung> Job(int id) => await db.TinTuyenDungs.AsNoTracking().SingleAsync(x => x.Id == id);
async Task<bool> Trigger(int id, TriggerTinTuyenDung trigger) => (await fire.Handle(new() { Id = id, Trigger = trigger, GhiChu = "Lifecycle check" }, default)).Succeeded;
CreateTinTuyenDungCommand Complete(string title) => new()
{
    DanhMucNgheId = 1, TieuDe = title, DiaDiemLamViec = "Ha Noi", MoTaCongViec = new string('a', 250),
    YeuCauCongViec = new string('b', 200), LuongToiThieu = 10_000_000, LuongToiDa = 20_000_000,
    NgayHetHan = RecruitmentDeadline.Today.AddDays(2)
};
var draft = new CreateTinTuyenDungCommand { DanhMucNgheId = 1, TieuDe = "Developer" };
Check((await new CreateTinTuyenDungCommandValidator().ValidateAsync(draft)).IsValid, "Partial draft is valid");
var id = (await create.Handle(draft, default)).Data;
Check((await Job(id)).TrangThai == TrangThaiTinTuyenDung.Nhap && funnel.Calls == 0 && delivery.PushCount == 0, "Draft does not filter, publish or notify");
Check(!await Trigger(id, TriggerTinTuyenDung.GuiDuyet), "Incomplete draft cannot submit");
var full = new UpdateTinTuyenDungCommand { Id = id, DanhMucNgheId = 1, TieuDe = "Developer", DiaDiemLamViec = "Ha Noi",
    MoTaCongViec = new string('a', 250), YeuCauCongViec = new string('b', 200), LuongToiThieu = 10_000_000,
    LuongToiDa = 20_000_000, KyNangs = new() { new() { KyNangId = 1, MucDoYeuCau = MucDoYC.BatBuc } }, NgayHetHan = RecruitmentDeadline.Today.AddDays(2) };
await update.Handle(full, default);
Check(await db.KyNangTinTuyenDungs.CountAsync(x => x.TinTuyenDungId == id) == 1, "Skills saved with draft aggregate");
Check(await Trigger(id, TriggerTinTuyenDung.GuiDuyet) && (await Job(id)).TrangThai == TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet && funnel.Calls == 0 && (await Job(id)).KetQuaSangLoc == "", "HR submission waits for representative BEFORE any filter runs");
current.Set(9, VaiTroNguoiDung.QUAN_TRI_VIEN, 10);
Check(!await Trigger(id, TriggerTinTuyenDung.AdminDuyet), "Admin cannot skip representative approval");
current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 20);
Check(!await Trigger(id, TriggerTinTuyenDung.NguoiDaiDienDuyet) && funnel.Calls == 0, "Other company cannot approve or run filtering");
current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 10);
Check(await Trigger(id, TriggerTinTuyenDung.NguoiDaiDienDuyet) && (await Job(id)).TrangThai == TrangThaiTinTuyenDung.DangTuyen && (await Job(id)).NguoiDaiDienDaDuyet && funnel.Calls == 1, "Representative approval THEN filter OK publishes HR post without Admin");
Check((await Job(id)).KetQuaSangLoc.StartsWith("OK:"), "Filter assessment is persisted");
current.Set(9, VaiTroNguoiDung.QUAN_TRI_VIEN, 10);
Check(!await Trigger(id, TriggerTinTuyenDung.AdminDuyet), "OK post needs no Admin approval");
current.Set(1, VaiTroNguoiDung.NHAN_SU, 10);
Check(await Trigger(id, TriggerTinTuyenDung.TamDungTin), "Published job can pause");
await update.Handle(full, default);
Check((await Job(id)).TrangThai == TrangThaiTinTuyenDung.Nhap && !(await Job(id)).NguoiDaiDienDaDuyet && (await Job(id)).KetQuaSangLoc == "", "Editing clears approval and assessment");
Check(await db.KyNangTinTuyenDungs.CountAsync(x => x.TinTuyenDungId == id) == 1, "Replacing skills does not duplicate records");

db.QuyTacKiemDuyetTins.AddRange(new QuyTacKiemDuyetTin { TuKhoa = "gray", Loai = LoaiQuyTacKiemDuyet.TinHieuRuiRo, DiemTru = 40, IsActive = true },
    new QuyTacKiemDuyetTin { TuKhoa = "forbidden", Loai = LoaiQuyTacKiemDuyet.TuKhoaCam, DiemTru = 100, IsActive = true },
    new QuyTacKiemDuyetTin { TuKhoa = "very-low", Loai = LoaiQuyTacKiemDuyet.TinHieuRuiRo, DiemTru = 95, IsActive = true });
await db.SaveChangesAsync();
foreach (var word in new[] { "gray", "forbidden", "very-low" })
{
    current.Set(1, VaiTroNguoiDung.NHAN_SU, 10);
    var flaggedId = (await create.Handle(Complete(word), default)).Data;
    var before = funnel.Calls;
    Check(await Trigger(flaggedId, TriggerTinTuyenDung.GuiDuyet) && funnel.Calls == before, word + ": HR still needs representative before filtering");
    current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 10);
    Check(await Trigger(flaggedId, TriggerTinTuyenDung.NguoiDaiDienDuyet) && (await Job(flaggedId)).TrangThai == TrangThaiTinTuyenDung.ChoAdminDuyet && funnel.Calls == before + 1, word + ": filter routes to Admin, never auto-rejects");
    current.Set(9, VaiTroNguoiDung.QUAN_TRI_VIEN, 10);
    Check(await Trigger(flaggedId, TriggerTinTuyenDung.AdminDuyet) && (await Job(flaggedId)).TrangThai == TrangThaiTinTuyenDung.DangTuyen && funnel.Calls == before + 1, word + ": Admin manual decision can approve flagged content");
}
current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 10);
var ownerId = (await create.Handle(Complete("Owner job"), default)).Data;
Check(await Trigger(ownerId, TriggerTinTuyenDung.GuiDuyet) && (await Job(ownerId)).TrangThai == TrangThaiTinTuyenDung.DangTuyen, "Owner submission goes directly to filter; OK auto-publishes");
var rejectId = (await create.Handle(Complete("forbidden owner"), default)).Data;
Check(await Trigger(rejectId, TriggerTinTuyenDung.GuiDuyet) && (await Job(rejectId)).TrangThai == TrangThaiTinTuyenDung.ChoAdminDuyet, "Owner violation waits for Admin, not automatic refusal");
current.Set(9, VaiTroNguoiDung.QUAN_TRI_VIEN, 10);
Check(await Trigger(rejectId, TriggerTinTuyenDung.AdminTuChoi) && (await Job(rejectId)).TrangThai == TrangThaiTinTuyenDung.TuChoi, "Only Admin manual rejection refuses flagged post");
Check(!await Trigger(ownerId, TriggerTinTuyenDung.HeThongTuDongDuyet), "Clients cannot invoke system publication trigger");
current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 10);
Check(await Trigger(ownerId, TriggerTinTuyenDung.TamDungTin) && await Trigger(ownerId, TriggerTinTuyenDung.MoLaiTin) && (await Job(ownerId)).TrangThai == TrangThaiTinTuyenDung.DangTuyen, "Reopening owner post reruns filter and publishes if OK");

current.Set(1, VaiTroNguoiDung.NHAN_SU, 10);
var retryId = (await create.Handle(Complete("Retry post"), default)).Data;
await Trigger(retryId, TriggerTinTuyenDung.GuiDuyet);
current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 10);
funnel.FailNext = true;
Check(await Trigger(retryId, TriggerTinTuyenDung.NguoiDaiDienDuyet) && (await Job(retryId)).TrangThai == TrangThaiTinTuyenDung.ChoDuyetHeThong && (await Job(retryId)).NguoiDaiDienDaDuyet, "Filter outage retains representative proof in retry queue, never publishes");
Check(await Trigger(retryId, TriggerTinTuyenDung.GuiDuyet) && (await Job(retryId)).TrangThai == TrangThaiTinTuyenDung.DangTuyen, "Filter retry preserves proof and finishes correct flow");
current.Set(1, VaiTroNguoiDung.NHAN_SU, 10);
var legacyId = (await create.Handle(Complete("Legacy queue"), default)).Data;
var legacy = await db.TinTuyenDungs.AsTracking().Include(x => x.NguoiDangTin).SingleAsync(x => x.Id == legacyId);
legacy.TrangThai = TrangThaiTinTuyenDung.ChoDuyetHeThong;
var previousCalls = funnel.Calls;
await JobScreening.RunAsync(legacy, new TinTuyenDungStateMachine(workflow, current, legacy), funnel, default);
await db.SaveChangesAsync();
Check(legacy.TrangThai == TrangThaiTinTuyenDung.ChoNguoiDaiDienDuyet && funnel.Calls == previousCalls, "Queue recovery never filters HR before representative approval");

current.Set(2, VaiTroNguoiDung.NGUOI_DAI_DIEN, 10);
var application = new DonUngTuyen { TinTuyenDungId = ownerId, CVUngVien = new CVUngVien { HoSoUngVien = new HoSoUngVien { HoTen = "Applicant", NguoiDungId = 3 }, TenFile = "CV" }, TrangThai = TrangThaiDonUngTuyen.ChoXuLy, NgayUngTuyen = DateTime.UtcNow, GhiChu = "" };
db.DonUngTuyens.Add(application);
await db.SaveChangesAsync();
Check(await Trigger(ownerId, TriggerTinTuyenDung.DongTin) && (await db.DonUngTuyens.AsNoTracking().SingleAsync(x => x.Id == application.Id)).TrangThai == TrangThaiDonUngTuyen.TinTuyenDungBiDong, "Closing job persists application cascade");
Check(delivery.AllPersisted, "Notifications are committed before realtime delivery");
var delete = new DeleteTinTuyenDungCommandHandler(db, current, cache);
Check(!(await delete.Handle(new() { Id = ownerId }, default)).Succeeded, "Closed job and applications cannot be deleted");
var disposableId = (await create.Handle(new() { DanhMucNgheId = 1, TieuDe = "Disposable draft", KyNangs = new() { new() { KyNangId = 1 } } }, default)).Data;
Check((await delete.Handle(new() { Id = disposableId }, default)).Succeeded && !await db.KyNangTinTuyenDungs.AnyAsync(x => x.TinTuyenDungId == disposableId), "Deleting draft removes its skills");
var expired = await db.TinTuyenDungs.AsTracking().SingleAsync(x => x.Id == ownerId);
expired.TrangThai = TrangThaiTinTuyenDung.TamDung; expired.NgayHetHan = DateTime.UtcNow.AddSeconds(-1);
await db.SaveChangesAsync();
Check(!await Trigger(ownerId, TriggerTinTuyenDung.MoLaiTin), "Expired job cannot reopen");
Check(RecruitmentDeadline.FromDate(new DateTime(2030, 1, 2)) == new DateTime(2030, 1, 2, 17, 0, 0, DateTimeKind.Utc), "Deadline includes full Vietnam calendar day");
await using var left = new CheckContext(options);
await using var right = new CheckContext(options);
var a = await left.TinTuyenDungs.AsTracking().SingleAsync(x => x.Id == id);
var b = await right.TinTuyenDungs.AsTracking().SingleAsync(x => x.Id == id);
a.TieuDe = "Winner"; await left.SaveChangesAsync(); b.TieuDe = "Stale";
var staleDelivered = false;
right.EnqueueAfterSave(_ => { staleDelivered = true; return Task.CompletedTask; });
try { await right.SaveChangesAsync(); throw new Exception("Expected concurrency conflict"); }
catch (ApiException) { Check(!staleDelivered && (await Job(id)).TieuDe == "Winner", "Stale write cannot overwrite data or emit events"); }
Console.WriteLine("Recruitment lifecycle checks completed.");

sealed class CountingFilter(ITinTuyenDungFunnelService inner) : ITinTuyenDungFunnelService
{
    public int Calls { get; private set; }
    public bool FailNext { get; set; }
    public Task<KetQuaFunnel> ChayAsync(TinTuyenDung job, CancellationToken ct = default)
    { Calls++; if (FailNext) { FailNext = false; throw new Exception("Temporary filter failure"); } return inner.ChayAsync(job, ct); }
}
sealed class CheckContext(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options, new Clock(), new Auth())
{ protected override void OnModelCreating(ModelBuilder builder) { base.OnModelCreating(builder); builder.Entity<CvTheme>().Ignore(x => x.Embedding); } }
sealed class Clock : IDateTimeService { public DateTime NowUtc => DateTime.UtcNow; public DateTime Now => NowUtc; }
sealed class Auth : IAuthenticatedUserService { public string UserId => "lifecycle-check"; }
sealed class CurrentUser : ICurrentNguoiDungService
{
    private CurrentNguoiDungContext _user = new() { Id = 1, VaiTro = VaiTroNguoiDung.NHAN_SU, DoanhNghiepId = 10 };
    public void Set(int id, VaiTroNguoiDung role, int company) => _user = new() { Id = id, VaiTro = role, DoanhNghiepId = company };
    public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(_user);
}
sealed class Delivery(ApplicationDbContext db) : IEmailService, IUserEmailResolver, INotificationPushService
{
    public bool AllPersisted { get; private set; } = true;
    public int PushCount { get; private set; }
    public Task SendAsync(EmailRequest request) => Task.CompletedTask;
    public Task<string?> GetEmailByNguoiDungIdAsync(int id, CancellationToken ct = default) => Task.FromResult<string?>(null);
    public async Task PushToUserAsync(int id, ThongBaoDTO payload, CancellationToken ct = default)
    { PushCount++; AllPersisted &= payload.Id > 0 && await db.Notifications.AnyAsync(x => x.Id == payload.Id, ct); }
}
