using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using System.Threading.Tasks;
using System.Threading;

using LoiMoiNhanSu = Domain.Entities.LoiMoiNhanSu;

namespace Application.Services.StateMachineLoiMoi
{
    public interface ILoiMoiNhanSuWorkflowService
    {
        Task HandleSideEffectsAsync(
            LoiMoiNhanSu entity,
            TriggerLoiMoi trigger,
            string note,
            CancellationToken ct = default
        );
    }
} 