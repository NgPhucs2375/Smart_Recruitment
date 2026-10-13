
namespace Application.DTOs.Account
{
    public class GitHubLoginRequest
    {
        public string Code { get; set; }
        public string RedirectUri { get; set; }
    }
}