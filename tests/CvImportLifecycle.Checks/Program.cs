using System.Text;
using Application.DTOs.CV;
using Application.DTOs.Email;
using Application.DTOs.ThongBao;
using Application.Features.CVUngVien.Commands.ImportCvUngVien;
using Application.Features.CVUngVien.Commands.ParseCvImport;
using Application.Features.DonUngTuyen.Commands.CreateDonUngTuyen;
using Application.Interfaces;
using Application.Mappings;
using Application.Services.StateMachineDonUngTuyen;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging.Abstractions;

// Vòng đời phiên nhập CV: mọi state của CVImportSession phải có chỗ ghi thật,
// và CV sinh ra từ luồng ghi thật phải nộp đơn được.
var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options;
await using var db = new CheckContext(options);
db.NguoiDungs.Add(new NguoiDung { Id = 1, ApplicationUserId = "candidate", VaiTro = VaiTroNguoiDung.UNG_VIEN });
db.HoSoUngViens.Add(new HoSoUngVien { Id = 1, NguoiDungId = 1, HoTen = "Candidate" });
db.DoanhNghieps.Add(new DoanhNghiep { Id = 1, TenDoanhNghiep = "Example", DiaChi = "Ha Noi" });
db.TinTuyenDungs.AddRange(MakeJob(1, "Backend Developer"), MakeJob(2, "Data Analyst"));
await db.SaveChangesAsync();

var storage = new Storage(new Dictionary<string, string>
{
    ["cvs/1/good.pdf"] = "Nguyen Van A - Backend developer",
    ["cvs/1/done.pdf"] = "Nguyen Van A - Backend developer",
});
var extractor = new Extractor();
var parseSession = NewSession("cvs/1/good.pdf");
var confirmedSession = NewSession("cvs/1/done.pdf");
confirmedSession.TrangThai = TrangThaiCvImport.Confirmed;
db.CVImportSessions.AddRange(parseSession, confirmedSession);
await db.SaveChangesAsync();

var user = new Current();
var parse = new ParseCvImportCommandHandler(db, user, storage, extractor, new Parser());
void Check(bool ok, string label) { if (!ok) throw new Exception(label); Console.WriteLine("PASS " + label); }

await parse.Handle(new() { SessionId = parseSession.Id }, default);
Check(parseSession.TrangThai == TrangThaiCvImport.Parsed, "Successful parse commits the Parsed state");

extractor.Text = "   ";
await parse.Handle(new() { SessionId = parseSession.Id }, default);
Check(parseSession.TrangThai == TrangThaiCvImport.Failed, "Unreadable file commits the Failed state");

extractor.Text = "Nguyen Van A - Backend developer";
storage.ThrowOnDownload = true;
try
{
    await parse.Handle(new() { SessionId = parseSession.Id }, default);
    throw new Exception("Storage failure must still reach the caller");
}
catch (IOException)
{
    Check(parseSession.TrangThai == TrangThaiCvImport.Failed, "Storage failure is recorded before it rethrows");
}
storage.ThrowOnDownload = false;

await parse.Handle(new() { SessionId = parseSession.Id }, default);
Check(parseSession.TrangThai == TrangThaiCvImport.Parsed, "A failed session can be parsed again");

await parse.Handle(new() { SessionId = confirmedSession.Id }, default);
Check(confirmedSession.TrangThai == TrangThaiCvImport.Confirmed, "Re-parsing a used session never rolls it back");

var import = new ImportCvCommandHandler(db, user, new Cache());
var cvId = (await import.Handle(new()
{
    TenFile = "CV Backend.pdf",
    TemplateId = "minimal-ats",
    NoiDung = Content("Candidate"),
}, default)).Data;
Check(cvId > 0, "Import creates a CV through the real write path");

var transport = new Transport();
var workflow = new DonUngTuyenWorkflowService(db, transport, transport, transport, NullLogger<DonUngTuyenWorkflowService>.Instance);
var submit = new CreateDonUngTuyenCommandHandler(db, user, workflow, new CvReadMapper());
Check((await submit.Handle(new() { TinTuyenDungId = 1, CVUngVienId = cvId }, default)).Succeeded, "Imported CV is submittable end to end");

Check((await import.Handle(new()
{
    TenFile = "CV draft.pdf",
    TemplateId = "minimal-ats",
    NoiDung = Content("   "),
}, default)).Data > 0, "Incomplete CV can still be saved as a draft");
Check(!(await submit.Handle(new() { TinTuyenDungId = 2, CVUngVienId = (await db.CVUngViens.FirstAsync(x => x.TenFile == "CV draft.pdf")).Id }, default)).Succeeded, "Incomplete CV cannot be submitted");

Console.WriteLine("CV import lifecycle checks completed.");
return;

static ParsedCvDto Content(string hoTen) => new()
{
    ThongTinLienHe = new ParsedThongTinLienHeDto { HoTen = hoTen, Email = "candidate@example.invalid" },
};

static CVImportSession NewSession(string objectKey) => new()
{
    Id = Guid.NewGuid(),
    HoSoUngVienId = 1,
    NguoiDungId = 1,
    OriginalObjectKey = objectKey,
    OriginalFileName = Path.GetFileName(objectKey),
    OriginalContentType = "application/pdf",
    OriginalFileSize = 1_024,
    TrangThai = TrangThaiCvImport.Uploaded,
    CreatedAt = DateTime.UtcNow,
    ExpiresAt = DateTime.UtcNow.AddMinutes(30),
};

static TinTuyenDung MakeJob(int id, string title) => new()
{
    Id = id,
    DoanhNghiepId = 1,
    NguoiDangTinId = 2,
    DanhMucNgheId = 1,
    TieuDe = title,
    MoTaCongViec = "Software work",
    YeuCauCongViec = "Skills",
    KinhNghiemYeuCau = "Experience",
    QuyenLoi = "Benefits",
    DiaDiemLamViec = "Ha Noi",
    LuongToiThieu = 10_000_000,
    LuongToiDa = 20_000_000,
    TrangThai = TrangThaiTinTuyenDung.DangTuyen,
};

sealed class Current : ICurrentNguoiDungService
{ public int Id = 1; public Task<CurrentNguoiDungContext> ResolveAsync() => Task.FromResult(new CurrentNguoiDungContext { Id = Id, VaiTro = VaiTroNguoiDung.UNG_VIEN, DoanhNghiepId = 1 }); }

sealed class CheckContext(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options, new Clock(), new Auth())
{ protected override void OnModelCreating(ModelBuilder b) { base.OnModelCreating(b); b.Entity<CvTheme>().Ignore(x => x.Embedding); } }

sealed class Clock : IDateTimeService { public DateTime NowUtc => DateTime.UtcNow; public DateTime Now => NowUtc; }
sealed class Auth : IAuthenticatedUserService { public string UserId => "cv-import-check"; }

sealed class Storage(Dictionary<string, string> files) : IFileStorageService
{
    public bool ThrowOnDownload;
    public Task<Stream> DownloadAsync(string objectName, CancellationToken ct = default)
    {
        if (ThrowOnDownload) throw new IOException("Không kết nối được storage.");
        if (!files.TryGetValue(objectName, out var content)) throw new FileNotFoundException(objectName);
        return Task.FromResult<Stream>(new MemoryStream(Encoding.UTF8.GetBytes(content)));
    }
    public Task UploadAsync(Stream fileStream, string objectName, string contentType, long fileSize, CancellationToken ct = default) => Task.CompletedTask;
    public Task DeleteAsync(string objectName, CancellationToken ct = default) { files.Remove(objectName); return Task.CompletedTask; }
    public Task<string> CreatePresignedUrlAsync(string objectName, int expirySeconds = 300, CancellationToken ct = default) => Task.FromResult($"https://storage.invalid/{objectName}");
}

sealed class Extractor : IUploadedCvTextExtractor
{
    public string Text = "Nguyen Van A - Backend developer";
    public Task<string> ExtractAsync(Stream fileStream, string fileName, CancellationToken ct = default) => Task.FromResult(Text);
}

sealed class Parser : ICvStructuredParser
{
    public Task<ParsedCvDto> ParseAsync(string rawText, CancellationToken ct = default) => Task.FromResult(new ParsedCvDto
    {
        ThongTinLienHe = new ParsedThongTinLienHeDto { HoTen = "Candidate", Email = "candidate@example.invalid" },
    });
}

sealed class Cache : IDistributedCache
{
    public byte[]? Get(string key) => null;
    public Task<byte[]?> GetAsync(string key, CancellationToken ct = default) => Task.FromResult<byte[]?>(null);
    public void Set(string key, byte[] value, DistributedCacheEntryOptions options) { }
    public Task SetAsync(string key, byte[] value, DistributedCacheEntryOptions options, CancellationToken ct = default) => Task.CompletedTask;
    public void Refresh(string key) { }
    public Task RefreshAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
    public void Remove(string key) { }
    public Task RemoveAsync(string key, CancellationToken ct = default) => Task.CompletedTask;
}

sealed class Transport : IEmailService, IUserEmailResolver, INotificationPushService
{
    public Task<string?> GetEmailByNguoiDungIdAsync(int id, CancellationToken ct = default) => Task.FromResult<string?>($"test-{id}@example.invalid");
    public Task SendAsync(EmailRequest request) => Task.CompletedTask;
    public Task PushToUserAsync(int id, ThongBaoDTO payload, CancellationToken ct = default) => Task.CompletedTask;
}
