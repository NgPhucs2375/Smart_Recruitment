using System;
using System.Collections.Generic;

namespace Infrastructure.Identity.Features.Users.Queries.GetMeByToken
{
    public class PermissionDto
    {
        public string Resource { get; set; }
        public string Action { get; set; }
    }

    public class GetMeByTokenQueryModel
    {
        // Keep old fields for backward compat
        public string Email { get; set; }
        public string Name { get; set; }
        public string Fullname { get; set; }
        public string[] Roles { get; set; }
        public string Uid { get; set; }
        public string AvatarUrl { get; set; }
        public string AvatarUid { get; set; }
        // Frontend expects these (auth-provider.ts MeResponse)
        public string Id { get; set; }
        public string UserName { get; set; }
        public List<PermissionDto> Permissions { get; set; } = new();
    }
}
