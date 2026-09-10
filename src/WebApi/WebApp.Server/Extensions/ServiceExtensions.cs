using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Mvc;
using Infrastructure.Shared.Environments;
using Microsoft.OpenApi;

namespace WebApp.Server.Extensions
{
    public static class ServiceExtensions
    {
        public static void AddSwaggerExtension(this IServiceCollection services)
        {
            services.AddSwaggerGen(c =>
            {
                // Include XML comments for documentation
                var xmlFilename = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
                var xmlPath = System.IO.Path.Combine(System.AppContext.BaseDirectory, xmlFilename);
                c.IncludeXmlComments(xmlPath);
                if (File.Exists(xmlPath))
                {
                    c.IncludeXmlComments(xmlPath);
                }

                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Version = "v1",
                    Title = "Clean Architecture ",
                    Description = "This Api will be responsible for overall data distribution and authorization.",
                    Contact = new OpenApiContact
                    {
                        Name = "codewithmukesh",
                        Email = "hello@codewithmukesh.com",
                        Url = new Uri("https://codewithmukesh.com/contact"),
                    }
                });

                

                // Add security definition
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    BearerFormat = "JWT",
                    Description = "Nhập JWT token. Swagger sẽ tự thêm tiền tố Bearer.",
                });

                c.AddSecurityRequirement(doc => new OpenApiSecurityRequirement
                    {
                        {
                            new OpenApiSecuritySchemeReference("Bearer", doc),
                            new List<string>()
                        },
                    });
            });
        }
        public static void AddApiVersioningExtension(this IServiceCollection services)
        {
            //services.AddApiVersioning(config =>
            //{
            //    // Specify the default API Version as 1.0
            //    config.DefaultApiVersion = new ApiVersion(1, 0);
            //    // If the client hasn't specified the API version in the request, use the default API version number 
            //    config.AssumeDefaultVersionWhenUnspecified = true;
            //    // Advertise the API versions supported for the particular endpoint
            //    config.ReportApiVersions = true;
            //});
        }

        public static void AddEnvironmentVariablesExtension(this IServiceCollection services)
        {
            services.AddTransient<IDatabaseSettingsProvider, DatabaseSettingsProvider>();
            services.AddTransient<IRedisSettingsProvider, RedisSettingsProvider>();
            services.AddTransient<IElasticSettingsProvider, ElasticSettingsProvider>();
            services.AddTransient<ICloudinarySettingsProvider, CloudinarySettingsProvider>();
        }
    }
}
