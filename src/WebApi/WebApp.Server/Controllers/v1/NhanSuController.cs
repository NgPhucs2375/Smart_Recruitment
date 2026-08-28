using Application.DTOs.NhanSu;
using Application.Features.NhanSu.Commands.DeleteNhanSu;
using Application.Features.NhanSu.Commands.InviteNhanSu;
using Application.Features.NhanSu.Queries.GetAllNhanSus;
using Application.Features.NhanSu.Queries.GetLoiMoiByToken;
using Application.Interfaces;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/NhanSu")]
    public class NhanSuController : BaseApiController
    {
        private readonly IAccountService _accountService;

        public NhanSuController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer,
            IAccountService accountService) : base(hostingEnvironment, enforcer)
        {
            _accountService = accountService;
        }

        // GET: api/NhanSu
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            return await EnforcePermissionAndExecute("nhansus", "list", async () =>
            {
                return Ok(await Mediator.Send(new GetAllNhanSusQuery()));
            });
        }

        // GET: api/NhanSu/invite/token?token=...
        [HttpGet("invite/token")]
        public async Task<IActionResult> GetByToken([FromQuery] string token)
        {
            return Ok(await Mediator.Send(new GetLoiMoiByTokenQuery { Token = token }));
        }

        // POST: api/NhanSu/invite
        [HttpPost("invite")]
        public async Task<IActionResult> Invite(InviteNhanSuCommand command)
        {
            return await EnforcePermissionAndExecute("loimoinhansus", "create", async () =>
            {
                command.Origin = $"{Request.Scheme}://{Request.Host}";
                return Ok(await Mediator.Send(command));
            });
        }

        // POST: api/NhanSu/accept
        [HttpPost("accept")]
        public async Task<IActionResult> Accept(YeuCauChapNhanLoiMoi request)
        {
            return Ok(await _accountService.AcceptInviteAsync(request.Token));
        }

        // DELETE: api/NhanSu/{id}
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            return await EnforcePermissionAndExecute("nhansus", "delete", async () =>
            {
                return Ok(await Mediator.Send(new DeleteNhanSuCommand { Id = id }));
            });
        }
    }
}
