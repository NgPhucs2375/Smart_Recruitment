$ErrorActionPreference = 'SilentlyContinue'
Stop-Process -Name 'Docker Desktop' -Force
Stop-Process -Name 'com.docker.backend' -Force
Stop-Process -Name 'com.docker.build' -Force
Start-Sleep -Seconds 3
wsl --shutdown
Start-Sleep -Seconds 2
Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$ok = $false
for ($i = 0; $i -lt 40; $i++) {
    Start-Sleep -Seconds 5
    docker info *> $null
    if ($LASTEXITCODE -eq 0) { $ok = $true; break }
}
if ($ok) { Write-Output "ENGINE OK after $($i*5)s" } else { Write-Output 'ENGINE TIMEOUT 200s' }