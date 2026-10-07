$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$nodeDir = Join-Path $root 'runtime'
$nodeExe = Join-Path $nodeDir 'node.exe'

if (!(Test-Path $nodeExe)) {
  Write-Host 'Primera vez: preparando el programa...' -ForegroundColor Cyan
  $url = 'https://nodejs.org/dist/v22.16.0/node-v22.16.0-win-x64.zip'
  $zip = Join-Path $env:TEMP 'anime-detector-node.zip'
  Invoke-WebRequest -Uri $url -OutFile $zip
  if (Test-Path $nodeDir) { Remove-Item $nodeDir -Recurse -Force }
  New-Item -ItemType Directory -Path $nodeDir | Out-Null
  $tmp = Join-Path $env:TEMP 'anime-detector-node-extract'
  if (Test-Path $tmp) { Remove-Item $tmp -Recurse -Force }
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $src = Get-ChildItem $tmp -Directory | Select-Object -First 1
  Copy-Item (Join-Path $src.FullName '*') $nodeDir -Recurse -Force
  Remove-Item $tmp -Recurse -Force
  Remove-Item $zip -Force
}

if (!(Test-Path (Join-Path $root 'node_modules'))) {
  Write-Host 'Instalando componentes (solo la primera vez)...' -ForegroundColor Yellow
  & $nodeExe (Join-Path $nodeDir 'node_modules\npm\bin\npm-cli.js') install --omit=dev
  if ($LASTEXITCODE -ne 0) { throw 'No se pudieron instalar los componentes.' }
}

Start-Process 'http://localhost:3000'
& $nodeExe (Join-Path $root 'server.js')
