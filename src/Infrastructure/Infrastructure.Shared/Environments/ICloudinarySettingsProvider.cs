using System;

namespace Infrastructure.Shared.Environments
{
    public interface ICloudinarySettingsProvider
    {
        string GetConnectionString();
    }
}
