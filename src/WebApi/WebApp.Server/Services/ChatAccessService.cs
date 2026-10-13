using System.Security.Claims;
using Application.Exceptions;
using Domain.Entities;
using Domain.Enums;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Services;
using Infrastructure.Persistence.Contexts;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Server.Services;

public sealed record ChatActor(int Id, int CompanyId, string IdentityId);
public sealed record ChatContact(int Id, string Name, string Role);
public sealed record ChatConversation(int Id, string Title, TypeConversation Type, int? OtherUserId);

// Role = eligible actor; permission = live resource/action grant;
// resource policy = current company membership + direct-chat participant pair.
public sealed class ChatAccessService(ApplicationDbContext db, IdentityContext identity)
{
    public async Task<ChatActor> RequireActorAsync(ClaimsPrincipal? principal, string action)
    {
        var uid = principal?.FindFirstValue("uid");
        var stamp = principal?.FindFirstValue("sst");
        if (principal?.Identity?.IsAuthenticated != true || string.IsNullOrEmpty(uid))
            throw new ApiException("Bạn cần đăng nhập.", 401);
        var account = await identity.Users.AsNoTracking().SingleOrDefaultAsync(u => u.Id == uid);
        var expiry = principal.FindFirstValue("exp");
        if (account is null || string.IsNullOrEmpty(stamp) || account.SecurityStamp != stamp
            || !account.EmailConfirmed || (account.LockoutEnabled && account.LockoutEnd > DateTimeOffset.UtcNow)
            || !long.TryParse(expiry, out var seconds) || seconds <= DateTimeOffset.UtcNow.ToUnixTimeSeconds())
            throw new ApiException("Phiên đăng nhập đã hết hạn hoặc bị thu hồi.", 401);

        var user = await db.NguoiDungs.SingleOrDefaultAsync(u => u.ApplicationUserId == uid && u.IsActive);
        if (user is null || !EligibleRole(user.VaiTro))
            throw new ApiException("Chat nội bộ chỉ dành cho nhân sự và người đại diện doanh nghiệp.", 403);
        var roleRows = await (from membership in identity.UserRoles
                           join role in identity.Roles on membership.RoleId equals role.Id
                           where membership.UserId == uid
                           select new { role.Id, role.Name }).ToListAsync();
        if (roleRows.Count != 1 || roleRows[0].Name != user.VaiTro.ToString()
            || !PermissionPolicy.IsEffective(user.VaiTro.ToString(), "chat", action))
            throw new ApiException("Vai trò hoặc thao tác chat không hợp lệ.", 403);
        var roles = roleRows.Select(r => r.Id).ToList();
        var grants = await identity.RoleClaims.Where(c => roles.Contains(c.RoleId) && c.ClaimType == "chat")
            .Select(c => c.ClaimValue).ToListAsync();
        if (!grants.Any(g => (g ?? "").Split('#', StringSplitOptions.RemoveEmptyEntries).Contains(action, StringComparer.OrdinalIgnoreCase)))
            throw new ApiException("Bạn không có quyền thực hiện thao tác chat này.", 403);
        var company = await CompanyIdAsync(user.Id, user.VaiTro);
        if (!company.HasValue)
            throw new ApiException("Tài khoản chưa thuộc doanh nghiệp nào. Hãy hoàn tất hồ sơ doanh nghiệp hoặc nhận lời mời nhân sự.", 403);
        return new ChatActor(user.Id, company.Value, uid);
    }

    private static bool EligibleRole(VaiTroNguoiDung role) => role is VaiTroNguoiDung.NHAN_SU or VaiTroNguoiDung.NGUOI_DAI_DIEN;

    private async Task<int?> CompanyIdAsync(int id, VaiTroNguoiDung role)
    {
        if (role == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            return await db.DoanhNghieps.Where(c => c.NguoiDaiDienId == id).OrderBy(c => c.Id).Select(c => (int?)c.Id).FirstOrDefaultAsync();
        if (role != VaiTroNguoiDung.NHAN_SU) return null;
        var companies = await db.HoSoNhaTuyenDungs.Where(h => h.NguoiDungId == id)
            .Select(h => h.DoanhNghiepId).Distinct().Take(2).ToListAsync();
        return companies.Count == 1 ? companies[0] : null;
    }

    public async Task<List<ChatContact>> ContactsAsync(ChatActor actor)
    {
        var users = await db.NguoiDungs.Where(u => u.IsActive && u.Id != actor.Id
            && (u.VaiTro == VaiTroNguoiDung.NHAN_SU || u.VaiTro == VaiTroNguoiDung.NGUOI_DAI_DIEN)
            && (db.DoanhNghieps.Any(c => c.Id == actor.CompanyId && c.NguoiDaiDienId == u.Id)
                || db.HoSoNhaTuyenDungs.Any(h => h.NguoiDungId == u.Id && h.DoanhNghiepId == actor.CompanyId)))
            .ToListAsync();
        var contacts = new List<ChatContact>();
        foreach (var user in users)
        {
            if (await CompanyIdAsync(user.Id, user.VaiTro) != actor.CompanyId) continue;
            var account = await identity.Users.AsNoTracking().SingleOrDefaultAsync(a => a.Id == user.ApplicationUserId
                && a.EmailConfirmed && (!a.LockoutEnabled || a.LockoutEnd == null || a.LockoutEnd <= DateTimeOffset.UtcNow));
            if (account is null) continue;
            var readGrants = await (from membership in identity.UserRoles
                                     join role in identity.Roles on membership.RoleId equals role.Id
                                     join claim in identity.RoleClaims on role.Id equals claim.RoleId
                                     where membership.UserId == account.Id && role.Name == user.VaiTro.ToString()
                                         && claim.ClaimType == "chat"
                                     select claim.ClaimValue).ToListAsync();
            if (!readGrants.Any(g => (g ?? "").Split('#', StringSplitOptions.RemoveEmptyEntries).Contains("show", StringComparer.OrdinalIgnoreCase))) continue;
            var name = await db.HoSoNhaTuyenDungs.Where(h => h.NguoiDungId == user.Id).Select(h => h.HoTen).FirstOrDefaultAsync();
            contacts.Add(new ChatContact(user.Id, string.IsNullOrWhiteSpace(name) ? account.UserName ?? "Thành viên" : name, user.VaiTro.ToString()));
        }
        return contacts.OrderBy(c => c.Name).ToList();
    }

    public IQueryable<Conversation> Accessible(ChatActor actor) => db.Conversations.Where(c => c.DoanhNghiepId == actor.CompanyId.ToString()
        && (c.Type == TypeConversation.Group || (c.Type == TypeConversation.Direct
            && c.ParticipantOneId.HasValue && c.ParticipantTwoId.HasValue
            && (c.ParticipantOneId == actor.Id || c.ParticipantTwoId == actor.Id))));

    public async Task<Conversation> RequireConversationAsync(ChatActor actor, int id)
    {
        var conversation = await Accessible(actor).SingleOrDefaultAsync(c => c.Id == id);
        if (conversation is null) throw new ApiException("Không tìm thấy hội thoại hoặc bạn không có quyền truy cập.", 404);
        if (conversation.Type == TypeConversation.Direct)
        {
            var other = conversation.ParticipantOneId == actor.Id ? conversation.ParticipantTwoId : conversation.ParticipantOneId;
            if (!(await ContactsAsync(actor)).Any(c => c.Id == other))
                throw new ApiException("Thành viên hội thoại không còn thuộc doanh nghiệp.", 404);
        }
        return conversation;
    }

    public async Task<List<ChatConversation>> ConversationsAsync(ChatActor actor)
    {
        var contacts = (await ContactsAsync(actor)).ToDictionary(c => c.Id);
        var conversations = await Accessible(actor).OrderByDescending(c => c.LastModified ?? c.Created).ToListAsync();
        return conversations.Where(c => c.Type == TypeConversation.Group || contacts.ContainsKey(Other(c, actor) ?? -1))
            .Select(c => new ChatConversation(c.Id, c.Type == TypeConversation.Group ? c.Title : contacts[Other(c, actor)!.Value].Name, c.Type, Other(c, actor))).ToList();
    }

    public static int? Other(Conversation c, ChatActor actor) => c.Type == TypeConversation.Direct
        ? (c.ParticipantOneId == actor.Id ? c.ParticipantTwoId : c.ParticipantOneId) : null;
}
