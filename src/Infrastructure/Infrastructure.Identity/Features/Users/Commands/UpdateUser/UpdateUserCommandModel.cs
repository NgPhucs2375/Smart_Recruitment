using System;

namespace Infrastructure.Identity.Features.Users.Commands.UpdateUser
{
    public class UpdateUserAvatar
    {
        public string AvatarUid { get; set; }
        public string AvatarUrl { get; set; }
    }
}
