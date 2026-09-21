using Application.DTOs.NhanSu;
using Application.Features.NhanSu.Commands.CancelLoiMoi;
using Application.Features.NhanSu.Commands.DeleteNhanSu;
using Application.Features.NhanSu.Commands.InviteNhanSu;
using Application.Features.NhanSu.Commands.RejectLoiMoi;
using Application.Features.NhanSu.Queries.GetAllNhanSus;
using Application.Features.NhanSu.Queries.GetLoiMoiByToken;
using Application.Features.NhanSu.Queries.GetPendingLoiMoi;
using Application.Interfaces;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/nhansus")]
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
        [AllowAnonymous]
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
                var frontendOrigin = Request.Headers.Origin.ToString();
                command.Origin = string.IsNullOrWhiteSpace(frontendOrigin)
                    ? $"{Request.Scheme}://{Request.Host}"
                    : frontendOrigin;
                return Ok(await Mediator.Send(command));
            });
        }

        // GET: api/nhansus/invites/pending — lời mời đang chờ của DN hiện tại (kèm link copy)
        [HttpGet("invites/pending")]
        public async Task<IActionResult> GetPendingInvites()
        {
            return await EnforcePermissionAndExecute("loimoinhansus", "list", async () =>
            {
                var frontendOrigin = Request.Headers.Origin.ToString();
                var origin = string.IsNullOrWhiteSpace(frontendOrigin)
                    ? $"{Request.Scheme}://{Request.Host}"
                    : frontendOrigin;
                return Ok(await Mediator.Send(new GetPendingLoiMoiQuery { Origin = origin }));
            });
        }

        // POST: api/NhanSu/accept
        [HttpPost("accept")]
        public async Task<IActionResult> Accept(YeuCauChapNhanLoiMoi request)
        {
            return Ok(await _accountService.AcceptInviteAsync(request.Token));
        }

        // POST: api/nhansus/invite/reject — người được mời từ chối qua token (anonymous)
        [AllowAnonymous]
        [HttpPost("invite/reject")]
        public async Task<IActionResult> Reject(YeuCauChapNhanLoiMoi request)
        {
            return Ok(await Mediator.Send(new RejectLoiMoiCommand { Token = request.Token }));
        }

        // DELETE: api/nhansus/invite/{id} — người đại diện thu hồi lời mời
        [HttpDelete("invite/{id}")]
        public async Task<IActionResult> CancelInvite(int id)
        {
            return await EnforcePermissionAndExecute("loimoinhansus", "delete", async () =>
            {
                return Ok(await Mediator.Send(new CancelLoiMoiCommand { Id = id }));
            });
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
