using FluentValidation;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using Newtonsoft.Json;
using Application.Behaviours;
using Application.Interfaces;
using Application.Wrappers;
using Domain.Settings;
using Infrastructure.Identity.Contexts;
using Infrastructure.Identity.Models;
using Infrastructure.Identity.Services;
using Infrastructure.Shared.Environments;
using System;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using DotNetEnv;
using System.Security.Claims;


namespace Infrastructure.Identity
{
    public static class ServiceExtensions
    {
        public static void AddInMemoryDatabase(this IServiceCollection services)
        {
            services.AddDbContext<IdentityContext>(options =>
                options.UseInMemoryDatabase("IdentityDb"));
        }

        public static void AddNpgSqlIdentityInfrastructure(this IServiceCollection services)
        {
            var sp = services.BuildServiceProvider();
            using (var scope = sp.CreateScope())
            {
                var _dbSetting = scope.ServiceProvider.GetRequiredService<IDatabaseSettingsProvider>();
                string appConnStr = _dbSetting.GetPostgresConnectionString();
                if (!string.IsNullOrWhiteSpace(appConnStr))
                {
                    services.AddDbContext<IdentityContext>(options =>
                    options.UseNpgsql(
                    appConnStr,
                    b =>
                    {
                        b.MigrationsAssembly(typeof(IdentityContext).Assembly.FullName);
                        b.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
                    }));
                }
            }
            sp.Dispose();
        }

        public static void AddIdentityRepositories(this IServiceCollection services, IConfiguration configuration)
        {
            Env.Load();
            services.AddIdentity<ApplicationUser, IdentityRole>().AddEntityFrameworkStores<IdentityContext>().AddDefaultTokenProviders();
            #region Services
            services.AddScoped<IAccountService, AccountService>();
            services.AddScoped<IUserEmailResolver, UserEmailResolver>();
            #endregion
            services.Configure<JWTSettings>(configuration.GetSection("JWTSettings"));
            services.Configure<GoogleSettings>(configuration.GetSection("GoogleSettings"));
            services.AddAuthentication(options =>
            {
                options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
                options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
            })
                .AddJwtBearer(o =>
                {
                    o.RequireHttpsMetadata = false;
                    o.SaveToken = false;
                    o.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuerSigningKey = true,
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ClockSkew = TimeSpan.Zero,
                        ValidIssuer = configuration["JWTSettings:Issuer"],
                        ValidAudience = configuration["JWTSettings:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(configuration["JWTSettings:Key"])),
                        RoleClaimType = ClaimTypes.Role
                    };
                    o.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];

                            if (!string.IsNullOrEmpty(accessToken) &&
                                context.HttpContext.Request.Path.StartsWithSegments("/api/hubs"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        },

                        OnAuthenticationFailed = context =>
                        {
                            var logger = context.HttpContext.RequestServices
                                .GetRequiredService<ILogger<JwtBearerEvents>>();

                            logger.LogWarning(
                                context.Exception,
                                "Lỗi xác thực JWT Token: {Message}",
                                context.Exception.Message);

                            // KHÔNG WriteAsync ở đây.
                            // Để OnChallenge trả response 401.
                            return Task.CompletedTask;
                        },

                        OnChallenge = async context =>
                        {
                            // Tắt response mặc định của JwtBearer.
                            context.HandleResponse();

                            if (context.Response.HasStarted)
                            {
                                return;
                            }

                            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                            context.Response.ContentType = "application/json";

                            var result = JsonConvert.SerializeObject(
                                new Response<string>(
                                    "Xác thực thất bại. Token không hợp lệ hoặc đã hết hạn."
                                )
                            );

                            await context.Response.WriteAsync(result);
                        },

                        OnForbidden = async context =>
                        {
                            if (context.Response.HasStarted)
                            {
                                return;
                            }

                            context.Response.StatusCode = StatusCodes.Status403Forbidden;
                            context.Response.ContentType = "application/json";

                            var result = JsonConvert.SerializeObject(
                                new Response<string>(
                                    "Bạn không có quyền truy cập tài nguyên này."
                                )
                            );

                            await context.Response.WriteAsync(result);
                        }
                    };
                });
        }

        public static void AddIdentityLayer(this IServiceCollection services)
        {
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(Assembly.GetExecutingAssembly()));
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
            services.AddAutoMapper(cfg => cfg.AddMaps(Assembly.GetExecutingAssembly()));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

        }
    }
}
