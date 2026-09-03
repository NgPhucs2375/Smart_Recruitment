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
                        IssuerSigningKey = new SymmetricSecurityKey(Convert.FromBase64String(configuration["JWTSettings:Key"]))
                    };
                    o.Events = new JwtBearerEvents()
                    {
                        OnAuthenticationFailed = c =>
                        {
                            c.NoResult();
                            c.Response.StatusCode = 500;
                            c.Response.ContentType = "text/plain";
                            return c.Response.WriteAsync(c.Exception.ToString());
                        },
                        OnChallenge = context =>
                        {
                            context.HandleResponse();
                            context.Response.StatusCode = 401;
                            context.Response.ContentType = "application/json";
                            var result = JsonConvert.SerializeObject(new Response<string>("You are not Authorized"));
                            return context.Response.WriteAsync(result);
                        },
                        OnForbidden = context =>
                        {
                            context.Response.StatusCode = 403;
                            context.Response.ContentType = "application/json";
                            var result = JsonConvert.SerializeObject(new Response<string>("You are not authorized to access this resource"));
                            return context.Response.WriteAsync(result);
                        },
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
