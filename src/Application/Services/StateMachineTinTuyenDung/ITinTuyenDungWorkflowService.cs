using Domain.Entities;
using Domain.Enums;
using System.Threading;
using System.Threading.Tasks;

namespace Application.Services.StateMachineTinTuyenDung
{
    public interface ITinTuyenDungWorkflowService
    {
        Task HandleSideEffectsAsync(
            TinTuyenDung entity,
            TriggerTinTuyenDung trigger,
            string note,
            CancellationToken ct = default
        );
    }
}
