FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER app
WORKDIR /app
EXPOSE 8080

ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production


FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build

ARG BUILD_CONFIGURATION=Release
WORKDIR /src

COPY ["src/WebApi/WebApp.Server/WebApp.Server.csproj", "src/WebApi/WebApp.Server/"]
COPY ["src/Infrastructure/Infrastructure.Identity/Infrastructure.Identity.csproj", "src/Infrastructure/Infrastructure.Identity/"]
COPY ["src/Infrastructure/Infrastructure.Shared/Infrastructure.Shared.csproj", "src/Infrastructure/Infrastructure.Shared/"]
COPY ["src/Infrastructure/Infrastructure.Persistence/Infrastructure.Persistence.csproj", "src/Infrastructure/Infrastructure.Persistence/"]
COPY ["src/Application/Application.csproj", "src/Application/"]
COPY ["src/Domain/Domain.csproj", "src/Domain/"]

RUN dotnet restore "src/WebApi/WebApp.Server/WebApp.Server.csproj"

COPY . .

WORKDIR "/src/src/WebApi/WebApp.Server"

RUN dotnet build "WebApp.Server.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/build


FROM build AS publish

ARG BUILD_CONFIGURATION=Release

RUN dotnet publish "WebApp.Server.csproj" \
    -c $BUILD_CONFIGURATION \
    -o /app/publish \
    /p:UseAppHost=false


FROM base AS final

WORKDIR /app

COPY --from=publish /app/publish .

ENTRYPOINT ["dotnet", "WebApp.Server.dll"]