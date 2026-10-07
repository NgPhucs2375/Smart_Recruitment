#nullable enable
using System;
using System.Linq;
using Application.Exceptions;
using Domain.Enums;

namespace Infrastructure.Identity.Services;

public static class PermissionPolicy
{
    public static readonly string[] Resources = ["chat", "cvthemes", "cvungviens", "danhgias", "danhmucnghes", "dashboard",
        "doanhnghieps", "donungtuyens", "hosonhatuyendungs", "hosoungviens", "ketquaphantichcvs",
        "ketquaphuhops", "kynangs", "kynangtintuyendungs", "kynangungviens", "loimoinhansus",
        "nguoidungs", "nhansus", "quytackiemduyettins", "roleclaims", "roles", "tintuyendungs", "users"];
    private static readonly string[] AdminOnly = ["users", "roles", "roleclaims", "nguoidungs", "dashboard", "quytackiemduyettins"];
    private static readonly string[] Actions = ["list", "show", "create", "edit", "delete"];

    public static bool IsSystemRole(string? name) => Enum.TryParse<VaiTroNguoiDung>(name, out var role) && Enum.IsDefined(role) && role.ToString() == name;
    public static bool IsEffective(string role, string resource, string action) => IsSystemRole(role) &&
        Resources.Contains(resource) && (Actions.Contains(action) || resource == "cvungviens" && action == "download" || resource == "chat" && action == "send") &&
        (resource != "chat" || (role is nameof(VaiTroNguoiDung.NHAN_SU) or nameof(VaiTroNguoiDung.NGUOI_DAI_DIEN)
            && action is "list" or "show" or "create" or "send")) &&
        (role == nameof(VaiTroNguoiDung.QUAN_TRI_VIEN) || !AdminOnly.Contains(resource)) &&
        !(role is "NHAN_SU" or "NGUOI_DAI_DIEN" && resource == "cvungviens" && action is not ("show" or "download")) &&
        !(role == "UNG_VIEN" && resource is "hosonhatuyendungs" or "nhansus" or "loimoinhansus") &&
        !(role != nameof(VaiTroNguoiDung.QUAN_TRI_VIEN) && resource == "ketquaphuhops" && action is "create" or "edit" or "delete") &&
        !(role == nameof(VaiTroNguoiDung.UNG_VIEN) && resource == "danhgias" && action is "create" or "edit" or "delete");

    public static string[] AllowedActions(string role, string resource) => Actions.Append("download").Append("send").Where(a => IsEffective(role, resource, a)).ToArray();

    public static (string Resource, string[] Actions) Normalize(string? role, string? resource, string[]? actions)
    {
        if (!IsSystemRole(role)) throw new ApiException("Vai trò không hợp lệ.", 400);
        var name = resource?.Trim().ToLowerInvariant() ?? "";
        if (!Resources.Contains(name)) throw new ApiException("Resource không hợp lệ.", 400);
        if (actions == null || actions.Any(a => string.IsNullOrWhiteSpace(a))) throw new ApiException("Action không hợp lệ.", 400);
        var values = actions.Select(a => a.Trim().ToLowerInvariant()).Distinct().OrderBy(a => a).ToArray();
        if (values.Any(a => !IsEffective(role!, name, a))) throw new ApiException("Quyền không hợp lệ hoặc vượt giới hạn nghiệp vụ của vai trò.", 400);
        return (name, values);
    }
}
