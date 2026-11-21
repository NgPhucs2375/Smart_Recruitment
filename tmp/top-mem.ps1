Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 12 Name, Id, @{n='MemGB';e={[math]::Round($_.WorkingSet64/1GB,2)}} | Format-Table -AutoSize | Out-String
$os = Get-CimInstance Win32_OperatingSystem
"RAM free: {0:N1} GB / {1:N1} GB" -f ($os.FreePhysicalMemory/1MB), ($os.TotalVisibleMemorySize/1MB)