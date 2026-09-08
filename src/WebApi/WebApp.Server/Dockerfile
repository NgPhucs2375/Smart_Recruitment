FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY ["RecruitmentSmart.sln", "./"]
COPY ["src/WebApi/WebApp.Server/WebApp.Server.csproj", "src/WebApi/WebApp.Server/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["src/Domain/Domain.csproj", "src/Domain/"]
COPY ["src/Infrastructure/Infrastructure.Identity/Infrastructure.Identity.csproj", "src/Infrastructure/Infrastructure.Identity/"]
COPY ["src/Infrastructure/Infrastructure.Persistence/Infrastructure.Persistence.csproj", "src/Infrastructure/Infrastructure.Persistence/"]
COPY ["src/Infrastructure/Infrastructure.Shared/Infrastructure.Shared.csproj", "src/Infrastructure/Infrastructure.Shared/"]
RUN dotnet restore "src/WebApi/WebApp.Server/WebApp.Server.csproj"
COPY . .
WORKDIR "/src/src/WebApi/WebApp.Server"
RUN dotnet build "WebApp.Server.csproj" -c Release -o /app/build
RUN dotnet publish "WebApp.Server.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "WebApp.Server.dll"]
