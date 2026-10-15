using Application.DTOs.Email;
using Application.DTOs.ThongBao;
using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.Features.DonUngTuyen.Commands.UpdateDonUngTuyen;
using Application.Features.DonUngTuyen.Queries.GetAllDonUngTuyens;
using Application.Features.DonUngTuyen.Queries.GetDonUngTuyenById;
using Application.Features.TinTuyenDung.Queries.GetAllTinTuyenDungs;
using Application.Interfaces;
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
db.KyNangs.AddRange(new KyNang { Id = 1, TenKyNang = "C#" }, new KyNang { Id = 2, TenKyNang = "SQL" });
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
