# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

# Copy csproj and restore
COPY ["SchoolGuardian.Api.csproj", "./"]
RUN dotnet restore "SchoolGuardian.Api.csproj"

# Copy everything else and build
COPY . .
RUN dotnet publish "SchoolGuardian.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 2: Serve
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base
WORKDIR /app
EXPOSE 3000

# Copy from build stage
COPY --from=build /app/publish .

# Set environment variables for the application
ENV ASPNETCORE_URLS=http://+:3000

ENTRYPOINT ["dotnet", "SchoolGuardian.Api.dll"]
