using AutoMapper;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Application.Behaviours;
using Application.Interfaces;
using Application.Services.StateMachineCV;
using Application.Services.StateMachineDonUngTuyen;
using Application.Services.StateMachineLoiMoi;
using Application.Services.StateMachineTinTuyenDung;
using System.Reflection;

namespace Application
{
    public static class ServiceExtensions
    {
        public static void AddApplicationLayer(this IServiceCollection services)
        {
            services.AddMediatR(cfg => cfg.RegisterServicesFromAssemblies(Assembly.GetExecutingAssembly()));
            services.AddValidatorsFromAssembly(Assembly.GetExecutingAssembly());
            services.AddAutoMapper(cfg => cfg.AddMaps(Assembly.GetExecutingAssembly()));
            services.AddTransient(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));

            #region State Machine DonUngTuyen
            services.AddScoped<IDonUngTuyenWorkflowService, DonUngTuyenWorkflowService>();
            #endregion

            #region State Machine CVUngVien
            services.AddScoped<ICVWorkflowService, CVWorkflowService>();
            #endregion

            #region State Machine TinTuyenDung
            services.AddScoped<ITinTuyenDungWorkflowService, TinTuyenDungWorkflowService>();
            #endregion

            #region State Machine LoiMoiNhanSu
            services.AddScoped<ILoiMoiNhanSuWorkflowService, LoiMoiNhanSuWorkflowService>();
            #endregion
        }
    }
}
