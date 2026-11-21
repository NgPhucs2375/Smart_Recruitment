$os = Get-CimInstance Win32_OperatingSystem
"RAM free: {0:N1} GB / {1:N1} GB" -f ($os.FreePhysicalMemory/1MB), ($os.TotalVisibleMemorySize/1MB)
Get-Process | Where-Object { $_.Name -like 'com.docker*' -or $_.Name -like 'docker*' -or $_.Name -eq 'vmmem' -or $_.Name -eq 'vmmemWSL' } |
  Select-Object Name, Id, @{n='MemGB';e={[math]::Round($_.WorkingSet64/1GB,2)}}, Responding |
  Format-Table -AutoSize | Out-String