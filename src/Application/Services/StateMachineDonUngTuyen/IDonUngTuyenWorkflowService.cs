using Application.Interfaces;
using Application.Wrappers;
using Domain.Entities;
using Domain.Enums;
using System.Threading.Tasks;
using System.Threading;

using DonUngTuyen = Domain.Entities.DonUngTuyen;

namespace Application.Services.StateMachineDonUngTuyen
{
    public interface IDonUngTuyenWorkflowService
    {
        Task HandleSideEffectsAsync(
            DonUngTuyen entity,
            TriggerDonUngTuyen trigger,
            string note,
            CancellationToken ct = default
        );
    }
} 