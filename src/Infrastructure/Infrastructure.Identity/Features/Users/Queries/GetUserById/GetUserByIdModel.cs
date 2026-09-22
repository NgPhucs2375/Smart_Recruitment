using System;
using Infrastructure.Identity.Models;

namespace Infrastructure.Identity.Features.Users.Queries.GetUserById
{
    public class GetUserByIdModel : ApplicationUser
    {
        public UserAvatarClaim Avatar { get; set; }
    }
}
