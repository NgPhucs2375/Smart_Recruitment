using Application.DTOs.Email;
using Application.DTOs.ThongBao;
using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using Application.Features.DonUngTuyen.Queries.GetLichSuDonUngTuyen;
using Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;
using Application.Interfaces;
using Application.Interfaces.Repositories;
using Application.Mappings;
using Application.Services.StateMachineDonUngTuyen;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;

var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
await using var db = new CheckContext(options);
db.NguoiDungs.AddRange(new NguoiDung { Id = 1, ApplicationUserId = "candidate", VaiTro = VaiTroNguoiDung.UNG_VIEN }, new NguoiDung { Id = 2, ApplicationUserId = "hr", VaiTro = VaiTroNguoiDung.NHAN_SU });
db.DanhMucNghes.AddRange(new DanhMucNghe { Id = 1, TenNghe = "IT" }, new DanhMucNghe { Id = 2, TenNghe = "Finance" });
db.KyNangs.AddRange(new DanhMucKyNang { Id = 1, TenKyNang = "C#" }, new DanhMucKyNang { Id = 2, TenKyNang = "SQL" });
db.DoanhNghieps.Add(new DoanhNghiep { Id = 1, TenDoanhNghiep = "Example", DiaChi = "Ha Noi" });
var a = MakeJob(1, 1, "Senior Backend Developer", 10_000_000, 20_000_000);
a.KyNangTinTuyenDungs = new List<KyNangTinTuyenDung> { new() { KyNangId = 1 }, new() { KyNangId = 2 } };
var b = MakeJob(2, 2, "Finance Analyst", 5_000_000, 8_000_000);
b.KyNangTinTuyenDungs = new List<KyNangTinTuyenDung> { new() { KyNangId = 2 } };
db.TinTuyenDungs.AddRange(a, b);
var cv = new CVUngVien { Id = 1, HoSoUngVien = new HoSoUngVien { Id = 1, NguoiDungId = 1, HoTen = "Applicant" }, TenFile = "Submitted CV", TemplateId = "minimal-ats", ThongTinLienHe = new CVThongTinLienHe { HoTen = "Original submitted name" } };
db.CVUngViens.Add(cv);
await db.SaveChangesAsync();
var user = new Current();
var transport = new Transport(db);
var workflow = new DonUngTuyenWorkflowService(db, transport, transport, transport, NullLogger<DonUngTuyenWorkflowService>.Instance);
var search = new GetAllTinTuyenDungsQueryHandler(db, user);
var submit = new CreateDonUngTuyenCommandHandler(db, user, workflow, new CvReadMapper());
void Check(bool ok, string label) { if (!ok) throw new Exception(label); Console.WriteLine("PASS " + label); }
Check((await search.Handle(new() { DanhMucNgheId = 1 }, default)).Data.Single().Id == 1, "Industry filter returns only matching jobs");
Check((await search.Handle(new() { KyNangIds = new() { 1, 2 }, MatchAllSkills = true }, default)).Data.Single().Id == 1, "All-skills filter requires every selected skill");
Check((await search.Handle(new() { KyNangIds = new() { 1, 2 } }, default)).Data.Count == 2, "Any-skills filter allows a matching skill");
Check((await search.Handle(new() { _filter = "senior backend", Location = "HA NOI", SalaryMin = 15_000_000, Level = "Senior", EmploymentType = "Full-time" }, default)).Data.Single().Id == 1, "Keyword/location are case insensitive and combine with salary and level");
Check((await search.Handle(new() { _start = 0, _end = 1 }, default)).Data.Count == 1, "Database paging limits returned rows");
var legacyCityJob = MakeJob(3, 1, "Legacy city location", 10_000_000, 20_000_000);
legacyCityJob.DiaDiemLamViec = "Quận 1, TP. HCM";
db.TinTuyenDungs.Add(legacyCityJob);
await db.SaveChangesAsync();
Check((await search.Handle(new() { Location = "Thành phố Hồ Chí Minh" }, default)).Data.Single().Id == 3, "Current province filter matches legacy HCM aliases");
Check(!(await submit.Handle(new() { TinTuyenDungId = 1, CVUngVienId = 99 }, default)).Succeeded, "Invalid CV cannot apply");
var applicationId = (await submit.Handle(new() { TinTuyenDungId = 1, CVUngVienId = 1 }, default)).Data;
Check(applicationId > 0 && transport.Deliveries >= 2 && transport.Emails == 2 && transport.Persisted, "Submission persists candidate/recruiter notifications and sends email after save");
Check(!(await submit.Handle(new() { TinTuyenDungId = 1, CVUngVienId = 1 }, default)).Succeeded, "Duplicate application is rejected");
cv.ThongTinLienHe.HoTen = "Edited after submission";
await db.SaveChangesAsync();
var detail = await new GetDonUngTuyenByIdQueryHandler(db, user).Handle(new() { Id = applicationId }, default);
Check(detail.Data.CvDaNop.NoiDung.ThongTinLienHe.HoTen == "Original submitted name", "Submitted CV is an immutable snapshot");
user.Role = VaiTroNguoiDung.NHAN_SU; user.Id = 2;
Check(!(await submit.Handle(new() { TinTuyenDungId = 2, CVUngVienId = 1 }, default)).Succeeded, "Recruiters cannot submit another person's CV");
var update = new UpdateDonUngTuyenCommandHandler(db, user, workflow);
await update.Handle(new() { Id = applicationId, Trigger = TriggerDonUngTuyen.XemDon }, default);
await update.Handle(new() { Id = applicationId, Trigger = TriggerDonUngTuyen.DanhGiaPhuHop }, default);
Check(transport.Emails == 3 && transport.Persisted, "Recruiter outcome sends committed email and notification");
user.Role = VaiTroNguoiDung.UNG_VIEN; user.Id = 1;
await update.Handle(new() { Id = applicationId, Trigger = TriggerDonUngTuyen.RutDon, GhiChu = "Withdraw" }, default);
var history = await new GetAllDonUngTuyensQueryHandler(db, user).Handle(new(), default);
Check(history.Data.Single().TrangThai == TrangThaiDonUngTuyen.UngVienRutDon, "Withdrawn applications remain in candidate history");

var trail = await db.LichSuTrangThaiDonUngTuyens.Where(h => h.DonUngTuyenId == applicationId).OrderBy(h => h.Id).ToListAsync();
Check(trail.Count == 4, "Every status change writes exactly one history row");
Check(trail.Select(h => h.TrangThaiSau).SequenceEqual(new[] { TrangThaiDonUngTuyen.ChoXuLy, TrangThaiDonUngTuyen.DaXem, TrangThaiDonUngTuyen.PhuHop, TrangThaiDonUngTuyen.UngVienRutDon }), "History preserves the ordered status chain");
Check(trail[0].TrangThaiTruoc == TrangThaiDonUngTuyen.KhoiTao && trail[1].TrangThaiTruoc == TrangThaiDonUngTuyen.ChoXuLy, "History records the state each transition started from");
Check(trail[0].NguoiThucHienId == null && trail[1].NguoiThucHienId == 2 && trail[3].NguoiThucHienId == 1, "History separates system moves from the person who acted");
Check(trail[3].GhiChu == "Withdraw", "History keeps the note supplied with the action");
var lichSuUngVien = await new GetLichSuDonUngTuyenQueryHandler(db, user).Handle(new() { Id = applicationId }, default);
Check(lichSuUngVien.Data.Count == trail.Count && lichSuUngVien.Data[0].TrangThaiSau == TrangThaiDonUngTuyen.ChoXuLy, "Candidate reads the same status trail through the history endpoint");

// Nghiệp vụ "CV nộp được": chưa có họ tên trên khối liên hệ thì không vào funnel ứng tuyển.
var draft = new CVUngVien { Id = 2, HoSoUngVienId = 1, TenFile = "Draft CV", TemplateId = "minimal-ats", ThongTinLienHe = new CVThongTinLienHe { HoTen = "   " } };
db.CVUngViens.Add(draft);
await db.SaveChangesAsync();
Check(!(await submit.Handle(new() { TinTuyenDungId = 2, CVUngVienId = 2 }, default)).Succeeded, "CV without a contact name cannot be submitted");
draft.ThongTinLienHe.HoTen = "Applicant";
await db.SaveChangesAsync();
Check((await submit.Handle(new() { TinTuyenDungId = 2, CVUngVienId = 2 }, default)).Succeeded, "Completing the CV unblocks submission");
Check((await db.DonUngTuyens.CountAsync(x => x.CVUngVienId == 2)) == 1, "Unblocking creates exactly one application");

// ── Job SLA: đơn bị nhà tuyển dụng ngâm quá hạn thì tự đóng, sắp quá hạn thì nhắc một lần. ──
var sla = new DonUngTuyenSlaOptions(SoNgayChoXuLy: 7, SoNgayDaXem: 14, TyLeNhan: 80, SoLuongToiDaMoiLuot: 50);
Check(DonUngTuyenSlaSweeper.SoNgayXuLy(TrangThaiDonUngTuyen.ChoXuLy, sla) == 7
    && DonUngTuyenSlaSweeper.SoNgayXuLy(TrangThaiDonUngTuyen.DaXem, sla) == 14
    && DonUngTuyenSlaSweeper.SoNgayXuLy(TrangThaiDonUngTuyen.PhuHop, sla) == 0,
    "SLA clocks ChoXuLy and DaXem but never closes an application already judged PhuHop");
Check(DonUngTuyenSlaSweeper.MocVaoTrangThai(new DateTime(2026, 1, 1), new DateTime(2026, 6, 1)) == new DateTime(2026, 6, 1)
    && DonUngTuyenSlaSweeper.MocVaoTrangThai(new DateTime(2026, 1, 1), null) == new DateTime(2026, 1, 1),
    "The clock runs from when the application entered its status, falling back to the submission date");

// Mỗi ứng viên chỉ có một đơn trên một tin, nên ba kịch bản cần ba hồ sơ khác nhau.
for (var id = 10; id <= 12; id++)
{
    db.NguoiDungs.Add(new NguoiDung { Id = id, ApplicationUserId = $"candidate-{id}", VaiTro = VaiTroNguoiDung.UNG_VIEN });
    db.CVUngViens.Add(new CVUngVien { Id = id, HoSoUngVien = new HoSoUngVien { Id = id, NguoiDungId = id, HoTen = $"Candidate {id}" }, TenFile = $"CV {id}", TemplateId = "minimal-ats", ThongTinLienHe = new CVThongTinLienHe { HoTen = $"Candidate {id}" } });
}
await db.SaveChangesAsync();

async Task<int> SubmitAsync(int jobId, int candidateId)
{
    user.Role = VaiTroNguoiDung.UNG_VIEN; user.Id = candidateId;
    return (await submit.Handle(new() { TinTuyenDungId = jobId, CVUngVienId = candidateId }, default)).Data;
}

// Giả lập đơn đã nằm im N ngày: lùi cả Created của đơn lẫn mọi dòng lịch sử của nó,
// vì mốc tính SLA lấy từ dòng lịch sử cuối chứ không phải ngày tạo.
async Task SoakAsync(int donId, int soNgay)
{
    var moc = DateTime.UtcNow.AddDays(-soNgay);
    (await db.DonUngTuyens.AsTracking().SingleAsync(x => x.Id == donId)).Created = moc;
    foreach (var h in await db.LichSuTrangThaiDonUngTuyens.AsTracking().Where(x => x.DonUngTuyenId == donId).ToListAsync()) h.Created = moc;
    await db.SaveChangesAsync();
}

var ngamNgap = await SubmitAsync(1, 10);
var sapQuaHan = await SubmitAsync(2, 11);
var vuaDaXem = await SubmitAsync(1, 12);
user.Role = VaiTroNguoiDung.NHAN_SU; user.Id = 2;
await SoakAsync(ngamNgap, 10);
await SoakAsync(sapQuaHan, 6);
await SoakAsync(vuaDaXem, 30);
await update.Handle(new() { Id = vuaDaXem, Trigger = TriggerDonUngTuyen.XemDon }, default);
Check((await db.DonUngTuyens.AsNoTracking().SingleAsync(x => x.Id == vuaDaXem)).TrangThai == TrangThaiDonUngTuyen.DaXem, "Fixture: HR opened the third application");

var notice = new Notice(db);
var emailsTruocKhiQuet = transport.Emails;
var luot1 = await DonUngTuyenSlaSweeper.QuetAsync(db, workflow, user, notice, NullLogger<DonUngTuyenWorkflowService>.Instance, sla);
Check(luot1 == (1, 1), "One sweep closes the soaked application and reminds the one at 80% of its deadline");
Check((await db.DonUngTuyens.AsNoTracking().SingleAsync(x => x.Id == ngamNgap)).TrangThai == TrangThaiDonUngTuyen.QuaHanXuLy, "An application soaked past the ChoXuLy deadline is closed by the system");
Check((await db.DonUngTuyens.AsNoTracking().SingleAsync(x => x.Id == sapQuaHan)).TrangThai == TrangThaiDonUngTuyen.ChoXuLy
    && (await db.DonUngTuyens.AsNoTracking().SingleAsync(x => x.Id == vuaDaXem)).TrangThai == TrangThaiDonUngTuyen.DaXem,
    "Sweep leaves the near-deadline application and the one HR just re-opened alone");
var dongCuoi = (await db.LichSuTrangThaiDonUngTuyens.AsNoTracking().Where(h => h.DonUngTuyenId == ngamNgap).OrderBy(h => h.Id).ToListAsync()).Last();
Check(dongCuoi.Trigger == TriggerDonUngTuyen.HetHanXuLy && dongCuoi.TrangThaiSau == TrangThaiDonUngTuyen.QuaHanXuLy && dongCuoi.NguoiThucHienId == null,
    "The SLA close lands in the audit trail as a system action with no actor");
Check(transport.Emails == emailsTruocKhiQuet, "Expiring an application is notification-only, no email");
Check(await db.Notifications.CountAsync(n => n.TieuDe == DonUngTuyenSlaSweeper.TieuDeNhacViec) == 1
    && await db.Notifications.AnyAsync(n => n.TieuDe == DonUngTuyenSlaSweeper.TieuDeNhacViec && n.ReferenceId == sapQuaHan
        && n.ReferenceType == nameof(DonUngTuyen) && n.Recipients.Any(r => r.NguoiDungId == 2)),
    "The reminder is a single DonUngTuyen notification addressed to the person who owns the posting");
var danhSachHR = await new GetAllDonUngTuyensQueryHandler(db, user).Handle(new(), default);
Check(danhSachHR.Data.Single(x => x.Id == ngamNgap).TrangThai == TrangThaiDonUngTuyen.QuaHanXuLy,
    "The recruiter's queue shows the auto-closed application as expired");

Check(await DonUngTuyenSlaSweeper.QuetAsync(db, workflow, user, notice, NullLogger<DonUngTuyenWorkflowService>.Instance, sla) == (0, 0),
    "A second sweep is a no-op: no duplicate reminder and no double close");

var tin2 = await db.TinTuyenDungs.AsTracking().SingleAsync(x => x.Id == 2);
tin2.TrangThai = TrangThaiTinTuyenDung.TamDung;
await db.SaveChangesAsync();
await SoakAsync(sapQuaHan, 30);
Check(await DonUngTuyenSlaSweeper.QuetAsync(db, workflow, user, notice, NullLogger<DonUngTuyenWorkflowService>.Instance, sla) == (0, 0),
    "Applications of a paused posting are left to the job-close cascade, not expired by SLA");
tin2.TrangThai = TrangThaiTinTuyenDung.DangTuyen;
await db.SaveChangesAsync();
Check(await DonUngTuyenSlaSweeper.QuetAsync(db, workflow, user, notice, NullLogger<DonUngTuyenWorkflowService>.Instance, sla) == (1, 0),
    "Re-publishing the posting puts its soaked applications back into the sweep");
Check((await db.DonUngTuyens.AsNoTracking().SingleAsync(x => x.Id == sapQuaHan)).TrangThai == TrangThaiDonUngTuyen.QuaHanXuLy, "The reopened posting's overdue application is then closed");

Console.WriteLine("Job search and application checks completed.");

static TinTuyenDung MakeJob(int id, int industry, string title, decimal min, decimal max) => new()
{ Id = id, DoanhNghiepId = 1, NguoiDangTinId = 2, DanhMucNgheId = industry, TieuDe = title, MoTaCongViec = "Software work", YeuCauCongViec = "Skills", KinhNghiemYeuCau = "Experience", QuyenLoi = "Benefits", DiaDiemLamViec = "Ha Noi", LuongToiThieu = min, LuongToiDa = max, TrangThai = TrangThaiTinTuyenDung.DangTuyen };
sealed class Current : ICurrentNguoiDungService
{ public int Id = 1; public VaiTroNguoiDung Role = VaiTroNguoiDung.UNG_VIEN; public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(new CurrentNguoiDungContext { Id = Id, VaiTro = Role, DoanhNghiepId = 1 }); }
sealed class CheckContext(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options, new Clock(), new Auth())
{ protected override void OnModelCreating(ModelBuilder b) { base.OnModelCreating(b); b.Entity<CvTheme>().Ignore(x => x.Embedding); } }
sealed class Clock : IDateTimeService { public DateTime NowUtc => DateTime.UtcNow; public DateTime Now => NowUtc; }
sealed class Auth : IAuthenticatedUserService { public string UserId => "job-application-check"; }
sealed class Transport(ApplicationDbContext db) : IEmailService, IUserEmailResolver, INotificationPushService
{
    public int Emails; public int Deliveries; public bool Persisted = true;
    public Task<string?> GetEmailByNguoiDungIdAsync(int id, CancellationToken ct = default) => Task.FromResult<string?>($"test-{id}@example.invalid");
    public Task SendAsync(EmailRequest request) { Emails++; return Task.CompletedTask; }
    public async Task PushToUserAsync(int id, ThongBaoDTO payload, CancellationToken ct = default)
    { Deliveries++; Persisted &= payload.Id > 0 && await db.Notifications.AnyAsync(x => x.Id == payload.Id, ct); }
}
// Bản giống NotificationService thật: ghi dòng thông báo + người nhận, chỉ thiếu SignalR push.
sealed class Notice(ApplicationDbContext db) : INotificationService
{
    public int SoDaGui;
    public async Task SendToUserAsync(int userId, ThongBaoDTO notification)
    {
        var entity = new Notification
        {
            TieuDe = notification.TieuDe, NoiDung = notification.NoiDung, LoaiThongBao = notification.LoaiThongBao,
            ReferenceType = notification.ReferenceType, ReferenceId = notification.ReferenceId,
            Recipients = new List<NotificationRecipient> { new() { NguoiDungId = userId, IsRead = false } }
        };
        db.Notifications.Add(entity);
        await db.SaveChangesAsync();
        if (entity.Id > 0) SoDaGui++;
    }
    public Task SendToCompanyAsync(int companyId, ThongBaoDTO notification) => throw new NotSupportedException();
    public Task SendToRoleAsync(string role, ThongBaoDTO notification) => throw new NotSupportedException();
}
