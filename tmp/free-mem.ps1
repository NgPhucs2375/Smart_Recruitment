$os = Get-CimInstance Win32_OperatingSystem
'FreeMB: ' + [int]($os.FreePhysicalMemory/1024) + ' / TotalMB: ' + [int]($os.TotalVisibleMemorySize/1024)