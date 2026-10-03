using Application.Features.Dashboard.Queries.GetAdminSummary;
using Casbin;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Server.Controllers.v1
{
    [Authorize]
    [Route("api/dashboard")]
    public class DashboardController : BaseApiController
    {
        public DashboardController(
            Microsoft.AspNetCore.Hosting.IWebHostEnvironment hostingEnvironment,
            Enforcer enforcer)
            : base(hostingEnvironment, enforcer)
        {
        }

        // GET: api/dashboard/admin-summary?soNgay=14
        [HttpGet("admin-summary")]
        public async Task<IActionResult> GetAdminSummary([FromQuery] int soNgay = 14)
        {
            return await EnforcePermissionAndExecute(
                "dashboard",
                "show",
                async () =>
                {
                    return Ok(await Mediator.Send(
                        new GetAdminSummaryQuery
                        {
                            SoNgay = soNgay
                        }));
                });
        }
    }
}
