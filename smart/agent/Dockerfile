FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["ProverbsAgent.csproj", "./"]
RUN dotnet restore "ProverbsAgent.csproj"
COPY . .
RUN dotnet build "ProverbsAgent.csproj" -c Release -o /app/build
RUN dotnet publish "ProverbsAgent.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ProverbsAgent.dll"]
