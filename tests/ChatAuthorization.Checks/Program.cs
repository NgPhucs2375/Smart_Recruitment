using System.Security.Claims;
using Application.Exceptions;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Identity.Services;
using Infrastructure.Persistence.Contexts;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using WebApp.Server.Controllers.v1;
using WebApp.Server.Hubs;
using WebApp.Server.Services;

await using var db = new CheckDb(new DbContextOptionsBuilder<ApplicationDbContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
await using var identity = new IdentityContext(new DbContextOptionsBuilder<IdentityContext>().UseInMemoryDatabase(Guid.NewGuid().ToString()).Options);
var access = new ChatAccessService(db, identity);
var registry = new ChatConnectionRegistry();
var clients = new RecordingClients();
void Check(bool condition, string title) { if (!condition) throw new Exception(title); Console.WriteLine("PASS " + title); }
async Task Denied(Func<Task> action, int status, string title)
{
    try { await action(); throw new Exception("Expected denial: " + title); }
    catch (ApiException ex) { Check(ex.StatusCode == status, title); }
}
async Task HubDenied(Func<Task> action, string title)
{
    try { await action(); throw new Exception("Expected hub denial: " + title); }
    catch (HubException) { Check(true, title); }
}
ClaimsPrincipal Principal(int id, string? stamp = null, long? expires = null) => new(new ClaimsIdentity(new[] {
    new Claim("uid", "user-" + id), new Claim("sst", stamp ?? "stamp-" + id),
    new Claim("exp", (expires ?? DateTimeOffset.UtcNow.AddHours(1).ToUnixTimeSeconds()).ToString()) }, "test"));
ChatController Controller(int id) => new(db, access) { ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext { User = Principal(id) } } };
ChatHub Hub(int id, string connection) => new(db, access, registry) { Context = new Caller(connection, Principal(id)), Clients = clients };
ChatConversation Room(IActionResult result) => ((Response<ChatConversation>)((OkObjectResult)result).Value!).Data;
Check(PermissionPolicy.AllowedActions("NHAN_SU", "chat").Order().SequenceEqual(new[] { "create", "list", "send", "show" }), "Permission matrix exposes exactly the four chat actions for staff");
Check(!PermissionPolicy.IsEffective("QUAN_TRI_VIEN", "chat", "show") && !PermissionPolicy.IsEffective("UNG_VIEN", "chat", "show"), "Admin and candidate roles have no implicit internal-chat access");

foreach (var role in new[] { VaiTroNguoiDung.NGUOI_DAI_DIEN, VaiTroNguoiDung.NHAN_SU, VaiTroNguoiDung.UNG_VIEN })
{
    identity.Roles.Add(new IdentityRole { Id = role.ToString(), Name = role.ToString(), NormalizedName = role.ToString() });
    // Even a candidate with a grant is rejected by the actor role policy.
    identity.RoleClaims.Add(new IdentityRoleClaim<string> { RoleId = role.ToString(), ClaimType = "chat", ClaimValue = "list#show#create#send" });
}
foreach (var (id, role) in new[] { (1, VaiTroNguoiDung.NGUOI_DAI_DIEN), (2, VaiTroNguoiDung.NHAN_SU), (3, VaiTroNguoiDung.NHAN_SU),
    (4, VaiTroNguoiDung.NGUOI_DAI_DIEN), (5, VaiTroNguoiDung.UNG_VIEN), (6, VaiTroNguoiDung.NHAN_SU) })
{
    db.NguoiDungs.Add(new NguoiDung { Id = id, ApplicationUserId = "user-" + id, VaiTro = role });
    identity.Users.Add(new ApplicationUser { Id = "user-" + id, UserName = "User " + id, EmailConfirmed = true, SecurityStamp = "stamp-" + id });
    identity.UserRoles.Add(new IdentityUserRole<string> { UserId = "user-" + id, RoleId = role.ToString() });
}
db.DoanhNghieps.AddRange(new DoanhNghiep { Id = 10, TenDoanhNghiep = "Company A", NguoiDaiDienId = 1 }, new DoanhNghiep { Id = 20, TenDoanhNghiep = "Company B", NguoiDaiDienId = 4 });
db.HoSoNhaTuyenDungs.AddRange(new HoSoNhaTuyenDung { NguoiDungId = 2, DoanhNghiepId = 10, HoTen = "HR Two" },
    new HoSoNhaTuyenDung { NguoiDungId = 3, DoanhNghiepId = 10, HoTen = "HR Three" },
    new HoSoNhaTuyenDung { NguoiDungId = 5, DoanhNghiepId = 10, HoTen = "Candidate" });
await db.SaveChangesAsync(); await identity.SaveChangesAsync(); db.ChangeTracker.Clear(); identity.ChangeTracker.Clear();

var owner = await access.RequireActorAsync(Principal(1), "list");
Check(owner.CompanyId == 10, "Representative without recruiter profile resolves through company ownership");
var people = await access.ContactsAsync(owner);
Check(people.Select(c => c.Id).SequenceEqual(new[] { 3, 2 }), "Directory contains active same-company staff only, no self/candidate/other company");
await Denied(() => access.RequireActorAsync(Principal(5), "list"), 403, "Candidate cannot enter internal chat even with chat grant and recruiter profile");
await Denied(() => access.RequireActorAsync(Principal(6), "list"), 403, "Orphan staff receives explicit missing-company denial");
await Denied(() => access.RequireActorAsync(Principal(1, "old-stamp"), "list"), 401, "Revoked session cannot use REST or Hub access service");
await Denied(() => access.RequireActorAsync(Principal(1, expires: 1), "list"), 401, "Expired principal cannot continue chat");

var direct = Room(await Controller(1).CreateConversation(new(Type: TypeConversation.Direct, RecipientId: 2)));
var reverse = Room(await Controller(2).CreateConversation(new(Type: TypeConversation.Direct, RecipientId: 1)));
Check(direct.Id == reverse.Id && await db.Conversations.CountAsync(c => c.Type == TypeConversation.Direct) == 1, "Both directions reopen the same private conversation");
Check(direct.Title == "HR Two" && reverse.Title == "User 1", "Each participant sees the other person's name");
var company = Room(await Controller(1).CreateConversation(new(Title: "Company room", Type: TypeConversation.Group)));
var third = await access.RequireActorAsync(Principal(3), "show");
Check((await access.ConversationsAsync(third)).All(c => c.Id != direct.Id), "Third person cannot enumerate private chat in same company");
await Denied(() => Controller(3).GetMessages(direct.Id), 404, "Third person cannot read direct messages by changing conversation ID");
await Denied(() => Controller(4).GetMessages(company.Id), 404, "Cross-company REST message IDOR rejected");
Check(await Controller(3).GetMessages(company.Id) is OkObjectResult, "Active company member can read shared room");
Check(await Controller(1).CreateConversation(new(Type: TypeConversation.Direct, RecipientId: 4)) is NotFoundResult, "Cross-company recipient ID rejected");
Check(await Controller(1).CreateConversation(new(Type: TypeConversation.Direct, RecipientId: 1)) is NotFoundResult, "Self-chat rejected");
Check(await Controller(1).CreateConversation(new(Type: (TypeConversation)99)) is BadRequestObjectResult, "Undefined conversation type rejected");
Check(await Controller(1).CreateConversation(new(Title: "Room", RecipientId: 2)) is BadRequestObjectResult, "Shared room cannot accept private recipient");

var sender = Hub(1, "owner");
await HubDenied(() => Hub(3, "third").JoinConversation(direct.Id), "Third person cannot join direct chat");
await HubDenied(() => Hub(3, "third").SendMessage(direct.Id, "Intrusion"), "Third person cannot send to direct chat");
await HubDenied(() => Hub(4, "outsider").JoinConversation(company.Id), "Cross-company Hub join rejected");
await HubDenied(() => Hub(4, "outsider").SendMessage(company.Id, "Intrusion"), "Cross-company Hub send rejected");
await HubDenied(() => sender.SendMessage(company.Id, " "), "Blank messages rejected");
await HubDenied(() => sender.SendMessage(company.Id, new string('x', 4001)), "Oversized messages rejected");
await sender.JoinConversation(direct.Id); await Hub(2, "hr").JoinConversation(direct.Id);
// Simulate a stale or corrupted subscription: it must never authorize delivery.
registry.Join("third", Principal(3), direct.Id);
var sent = await sender.SendMessage(direct.Id, " Private hello ");
Check(sent.SenderId == "1" && sent.Content == "Private hello", "Sender is business user from Context.User, not client-supplied identity");
Check(clients.Deliveries.Where(d => d.Event == "MessageReceived").Select(d => d.Connection).Order().SequenceEqual(new[] { "hr", "owner" }), "Private realtime delivery excludes non-participants even with stale subscription");
Check(await Controller(2).GetMessages(direct.Id) is OkObjectResult, "Intended participant can read private history");

await sender.JoinConversation(company.Id); await Hub(2, "hr").JoinConversation(company.Id);
var profile = await db.HoSoNhaTuyenDungs.AsTracking().SingleAsync(h => h.NguoiDungId == 2);
db.HoSoNhaTuyenDungs.Remove(profile); await db.SaveChangesAsync(); db.ChangeTracker.Clear();
clients.Deliveries.Clear();
await sender.SendMessage(company.Id, "After employee removal");
Check(!clients.Deliveries.Any(d => d.Connection == "hr" && d.Event == "MessageReceived"), "Removed employee cannot receive future shared-room broadcasts");
Check(clients.Deliveries.Any(d => d.Connection == "hr" && d.Event == "AccessRevoked"), "Stale receiver receives access-revoked event without message content");
await Denied(() => Controller(1).GetMessages(direct.Id), 404, "Direct chat becomes inaccessible when peer leaves company");

await Hub(3, "third").JoinConversation(company.Id);
var grant = await identity.RoleClaims.SingleAsync(c => c.RoleId == "NHAN_SU" && c.ClaimType == "chat");
grant.ClaimValue = "list#create#send"; await identity.SaveChangesAsync(); identity.ChangeTracker.Clear();
clients.Deliveries.Clear(); await sender.SendMessage(company.Id, "After read revocation");
Check(!clients.Deliveries.Any(d => d.Connection == "third" && d.Event == "MessageReceived"), "Live read-permission revocation stops delivery on existing connection");
await Denied(() => Controller(3).GetMessages(company.Id), 403, "Live permission revocation blocks REST without waiting for token expiry");
grant = await identity.RoleClaims.SingleAsync(c => c.RoleId == "NHAN_SU" && c.ClaimType == "chat");
grant.ClaimValue = "list#show#create"; await identity.SaveChangesAsync(); identity.ChangeTracker.Clear();
await HubDenied(() => Hub(3, "third").SendMessage(company.Id, "No send grant"), "Live send-permission revocation blocks Hub methods");

db.Conversations.Add(new Conversation { Id = 100, DoanhNghiepId = "10", Type = TypeConversation.Direct, Title = "Legacy missing pair" });
await db.SaveChangesAsync();
await Denied(() => Controller(1).GetMessages(100), 404, "Legacy direct room without participants fails closed");
var disabled = await db.NguoiDungs.AsTracking().SingleAsync(u => u.Id == 3); disabled.IsActive = false; await db.SaveChangesAsync(); db.ChangeTracker.Clear();
await Denied(() => access.RequireActorAsync(Principal(3), "list"), 403, "Inactive business account denied despite valid token");
Console.WriteLine("Chat authorization checks completed.");

sealed class CheckDb(DbContextOptions<ApplicationDbContext> options) : ApplicationDbContext(options, new Clock(), new Auth())
{ protected override void OnModelCreating(ModelBuilder builder) { base.OnModelCreating(builder); builder.Entity<CvTheme>().Ignore(c => c.Embedding); } }
sealed class Clock : IDateTimeService { public DateTime NowUtc => DateTime.UtcNow; public DateTime Now => NowUtc; }
sealed class Auth : IAuthenticatedUserService { public string UserId => "chat-check"; }
sealed class Caller(string connection, ClaimsPrincipal user) : HubCallerContext
{
    public override string ConnectionId => connection;
    public override string? UserIdentifier => user.FindFirstValue("uid");
    public override ClaimsPrincipal User => user;
    public override IDictionary<object, object?> Items { get; } = new Dictionary<object, object?>();
    public override IFeatureCollection Features { get; } = new FeatureCollection();
    public override CancellationToken ConnectionAborted => CancellationToken.None;
    public override void Abort() { }
}
sealed class RecordingClients : IHubCallerClients
{
    public List<(string Connection, string Event)> Deliveries { get; } = new();
    public IClientProxy Client(string connectionId) => new Recorder(connectionId, Deliveries);
    public IClientProxy All => Client("all");
    public IClientProxy Caller => Client("caller");
    public IClientProxy Others => Client("others");
    public IClientProxy AllExcept(IReadOnlyList<string> ids) => Client("all-except");
    public IClientProxy Clients(IReadOnlyList<string> ids) => Client("clients");
    public IClientProxy Group(string name) => Client("group");
    public IClientProxy GroupExcept(string name, IReadOnlyList<string> ids) => Client("group-except");
    public IClientProxy Groups(IReadOnlyList<string> names) => Client("groups");
    public IClientProxy OthersInGroup(string name) => Client("others-group");
    public IClientProxy User(string id) => Client("user");
    public IClientProxy Users(IReadOnlyList<string> ids) => Client("users");
}
sealed class Recorder(string connection, List<(string Connection, string Event)> deliveries) : IClientProxy
{ public Task SendCoreAsync(string method, object?[] args, CancellationToken cancellationToken = default) { deliveries.Add((connection, method)); return Task.CompletedTask; } }
