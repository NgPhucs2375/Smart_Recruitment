using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace Infrastructure.Identity.Helpers
{
    public class AuthenticationHelper
    {
        public static void ConfigureService(IServiceCollection service, string Issuer, string Audience, string Key)
        {
            service.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })

                .AddJwtBearer(o =>
                {
                    // SignalR sends the bearer token as access_token in the query
                    // string when it cannot set an Authorization header.
                    o.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            if (context.Request.Path.StartsWithSegments("/api/hubs") &&
                                string.IsNullOrEmpty(context.Token))
                            {
                                context.Token = context.Request.Query["access_token"];
                            }

                            return Task.CompletedTask;
                        },
                    };

                    o.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,

                        ValidIssuer = Issuer,
                        ValidAudience = Audience,
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(Key))
                    };
                });
        }
    }
}
