using Application.Features.Recruiter.Queries.GetRecruiterDashboardStats;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers;

/// <summary>
/// Số liệu tổng hợp cho dashboard người đại diện / nhân sự.
/// Tính trên DB nên không bị giới hạn 100 dòng như danh sách tải về.
/// </summary>
[ApiController]
[Route("api/recruiter/stats")]
[Authorize(Roles = "NGUOI_DAI_DIEN,NHAN_SU")]
public sealed class RecruiterStatsController(
    IMediator mediator,
    Application.Interfaces.IPermissionService permissions) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(CancellationToken cancellationToken)
    {
        await permissions.RequireAsync("tintuyendungs", "list", cancellationToken);
        await permissions.RequireAsync("donungtuyens", "list", cancellationToken);
        return Ok(await mediator.Send(new GetRecruiterDashboardStatsQuery(), cancellationToken));
    }
}
