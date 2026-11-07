using System.ComponentModel.DataAnnotations;

namespace Application.DTOs.Account
{
    public class DoiMagicLink {
        [Required][EmailAddress][MaxLength(100)] public string Email { get; set; }
        [Required] public string Token { get; set; }
}
}
