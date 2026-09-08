using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using System.Threading.Tasks;
using System.Threading;

using CVUngVien = Domain.Entities.CVUngVien;

namespace Application.Services.StateMachineCV
{
    public interface ICVWorkflowService
    {
        Task HandleSideEffectsAsync(
            CVUngVien entity,
            TriggerCVUngVien trigger,
            string note,
            CancellationToken ct = default
        );
    }
} 