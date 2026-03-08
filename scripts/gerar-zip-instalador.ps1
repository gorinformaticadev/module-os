param(
    [string]$OutputDir = "dist",
    [string]$ArchiveName
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $scriptDir ".."))
$rootManifestPath = Join-Path $repoRoot "module.json"
$backendManifestPath = Join-Path $repoRoot "backend\\module.json"
$backendRoot = Join-Path $repoRoot "backend"
$frontendRoot = Join-Path $repoRoot "frontend"

$allowedExtensions = @(
    ".json", ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".css", ".scss", ".md", ".txt", ".sql", ".yml", ".yaml",
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico"
)

function Resolve-OutputDirectory {
    param([string]$BasePath, [string]$ProjectRoot)

    if ([System.IO.Path]::IsPathRooted($BasePath)) {
        return [System.IO.Path]::GetFullPath($BasePath)
    }

    return [System.IO.Path]::GetFullPath((Join-Path $ProjectRoot $BasePath))
}

function Get-RelativePathCompat {
    param(
        [string]$BasePath,
        [string]$TargetPath
    )

    $normalizedBase = [System.IO.Path]::GetFullPath($BasePath).TrimEnd("\")
    $normalizedTarget = [System.IO.Path]::GetFullPath($TargetPath)
    $baseUri = New-Object System.Uri(($normalizedBase + "\"))
    $targetUri = New-Object System.Uri($normalizedTarget)
    $relativeUri = $baseUri.MakeRelativeUri($targetUri)

    return [System.Uri]::UnescapeDataString($relativeUri.ToString()).Replace("/", "\")
}

function Test-IncludedRelativePath {
    param([string]$RelativePath)

    $normalized = $RelativePath.Replace("\", "/")
    $fileName = [System.IO.Path]::GetFileName($normalized)
    $extension = [System.IO.Path]::GetExtension($fileName).ToLowerInvariant()

    if ([string]::IsNullOrWhiteSpace($extension)) {
        return $false
    }

    if ($fileName.StartsWith(".")) {
        return $false
    }

    if ($fileName -eq "install.js") {
        return $false
    }

    if ($normalized -match "^backend/module\.json$") {
        return $false
    }

    if ($normalized -match "(^|/)(README|CHANGELOG|TUTORIAL[^/]*)\.md$") {
        return $false
    }

    if ($normalized -match "(^|/)(install|build)\.(js|sh|ps1|cmd|bat)$") {
        return $false
    }

    if ($normalized -match "(^|/)(node_modules|\.git|\.qoder|dist|DOCS|docs|scripts)/") {
        return $false
    }

    if ($fileName -eq "package-lock.json") {
        return $false
    }

    return $allowedExtensions -contains $extension
}

function Copy-IncludedTree {
    param(
        [string]$SourceRoot,
        [string]$TargetRoot,
        [string]$ProjectRoot
    )

    $copiedFiles = New-Object System.Collections.Generic.List[string]

    foreach ($file in Get-ChildItem -Path $SourceRoot -Recurse -File) {
        $relativeFromRepo = (Get-RelativePathCompat -BasePath $ProjectRoot -TargetPath $file.FullName).Replace("\", "/")

        if (-not (Test-IncludedRelativePath -RelativePath $relativeFromRepo)) {
            continue
        }

        $relativeInsideSource = Get-RelativePathCompat -BasePath $SourceRoot -TargetPath $file.FullName
        $destination = Join-Path $TargetRoot $relativeInsideSource
        $destinationDir = Split-Path -Parent $destination

        if (-not [string]::IsNullOrWhiteSpace($destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }

        Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
        $copiedFiles.Add($relativeFromRepo) | Out-Null
    }

    return $copiedFiles
}

if (-not (Test-Path -LiteralPath $rootManifestPath)) {
    throw "Arquivo module.json nao encontrado na raiz do repositorio."
}

if (-not (Test-Path -LiteralPath $backendRoot)) {
    throw "Pasta backend nao encontrada."
}

if (-not (Test-Path -LiteralPath $frontendRoot)) {
    throw "Pasta frontend nao encontrada."
}

$moduleManifest = Get-Content -LiteralPath $rootManifestPath -Raw | ConvertFrom-Json
$moduleSlug = [string]$moduleManifest.name
$moduleVersion = [string]$moduleManifest.version

if ([string]::IsNullOrWhiteSpace($moduleSlug)) {
    throw "Campo name ausente em module.json."
}

if ([string]::IsNullOrWhiteSpace($moduleVersion)) {
    throw "Campo version ausente em module.json."
}

if ([string]::IsNullOrWhiteSpace($ArchiveName)) {
    $ArchiveName = "{0}-installer-{1}.zip" -f $moduleSlug, $moduleVersion
}

$resolvedOutputDir = Resolve-OutputDirectory -BasePath $OutputDir -ProjectRoot $repoRoot
$stagingRoot = Join-Path $resolvedOutputDir ".tmp-installer-$moduleSlug"
$packageRoot = Join-Path $stagingRoot "package"
$zipPath = Join-Path $resolvedOutputDir $ArchiveName
$fileListPath = Join-Path $resolvedOutputDir ("{0}-installer-{1}.files.txt" -f $moduleSlug, $moduleVersion)

if (Test-Path -LiteralPath $resolvedOutputDir) {
    $null = $resolvedOutputDir
} else {
    New-Item -ItemType Directory -Path $resolvedOutputDir -Force | Out-Null
}

if (Test-Path -LiteralPath $stagingRoot) {
    Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
}

if (Test-Path -LiteralPath $backendManifestPath) {
    $rootManifestRaw = (Get-Content -LiteralPath $rootManifestPath -Raw).Trim()
    $backendManifestRaw = (Get-Content -LiteralPath $backendManifestPath -Raw).Trim()

    if ($rootManifestRaw -ne $backendManifestRaw) {
        Write-Warning "backend/module.json diverge de module.json. O pacote usa apenas o module.json da raiz para evitar sobrescrita ambigua no instalador interno."
    }
}

try {
    New-Item -ItemType Directory -Path $packageRoot -Force | Out-Null

    Copy-Item -LiteralPath $rootManifestPath -Destination (Join-Path $packageRoot "module.json") -Force

    $backendFiles = Copy-IncludedTree -SourceRoot $backendRoot -TargetRoot (Join-Path $packageRoot "backend") -ProjectRoot $repoRoot
    $frontendFiles = Copy-IncludedTree -SourceRoot $frontendRoot -TargetRoot (Join-Path $packageRoot "frontend") -ProjectRoot $repoRoot

    if ($backendFiles.Count -eq 0) {
        throw "Nenhum arquivo de backend foi incluido no pacote."
    }

    if ($frontendFiles.Count -eq 0) {
        throw "Nenhum arquivo de frontend foi incluido no pacote."
    }

    Compress-Archive -Path (Join-Path $packageRoot "*") -DestinationPath $zipPath -Force

    $fileList = New-Object System.Collections.Generic.List[string]
    $fileList.Add("Modulo: $moduleSlug") | Out-Null
    $fileList.Add("Versao: $moduleVersion") | Out-Null
    $fileList.Add("Arquivo ZIP: $zipPath") | Out-Null
    $fileList.Add("") | Out-Null
    $fileList.Add("Arquivos incluidos:") | Out-Null
    $fileList.Add("module.json") | Out-Null

    foreach ($file in $backendFiles) {
        $fileList.Add($file) | Out-Null
    }

    foreach ($file in $frontendFiles) {
        $fileList.Add($file) | Out-Null
    }

    Set-Content -LiteralPath $fileListPath -Value $fileList -Encoding UTF8

    Write-Host ""
    Write-Host "Pacote gerado com sucesso." -ForegroundColor Green
    Write-Host "Modulo : $moduleSlug"
    Write-Host "Versao : $moduleVersion"
    Write-Host "ZIP    : $zipPath"
    Write-Host "Lista  : $fileListPath"
    Write-Host ("Backend incluidos : {0}" -f $backendFiles.Count)
    Write-Host ("Frontend incluidos: {0}" -f $frontendFiles.Count)
    Write-Host ""
    Write-Host "Use este ZIP no instalador interno em Configuracoes > Sistema > Modulos." -ForegroundColor Cyan
} finally {
    if (Test-Path -LiteralPath $stagingRoot) {
        Remove-Item -LiteralPath $stagingRoot -Recurse -Force
    }
}
