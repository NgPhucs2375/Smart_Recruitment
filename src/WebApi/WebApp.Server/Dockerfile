#See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER app
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV ASPNETCORE_ENVIRONMENT=Production

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/WebApi/WebApp.Client/nuget.config", "WebApi/WebApp.Client/"]
COPY ["src/WebApi/WebApp.Server/WebApp.Server.csproj", "WebApi/WebApp.Server/"]
COPY ["src/Infrastructure/Infrastructure.Identity/Infrastructure.Identity.csproj", "Infrastructure/Infrastructure.Identity/"]
COPY ["src/Infrastructure/Infrastructure.Shared/Infrastructure.Shared.csproj", "Infrastructure/Infrastructure.Shared/"]
COPY ["src/Application/Application.csproj", "Application/"]
COPY ["src/Domain/Domain.csproj", "Domain/"]
COPY ["src/Infrastructure/Infrastructure.Persistence/Infrastructure.Persistence.csproj", "Infrastructure/Infrastructure.Persistence/"]
COPY ["src/WebApi/WebApp.Client/WebApp.Client.esproj", "WebApp.Client/"]
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install -y nodejs
RUN dotnet restore "./WebApi/WebApp.Server/WebApp.Server.csproj"
COPY . .
WORKDIR "/src/WebApi/WebApp.Server"
RUN dotnet build "./WebApp.Server.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./WebApp.Server.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "WebApp.Server.dll"]