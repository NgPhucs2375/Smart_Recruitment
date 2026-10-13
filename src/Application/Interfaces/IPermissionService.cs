namespace Application.Interfaces;

public interface IPermissionService
{
    Task RequireAsync(string resource, string action, CancellationToken cancellationToken = default);
}
