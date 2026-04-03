# 个人学习系统启动脚本
$port = 8080

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "📚 个人学习系统 - 启动服务器" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# 切换到脚本所在目录
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "工作目录: $scriptPath" -ForegroundColor Gray
Write-Host ""

# 检查 Python
$python = Get-Command python -ErrorAction SilentlyContinue
if (-not $python) {
    $python = Get-Command py -ErrorAction SilentlyContinue
}
if (-not $python) {
    $python = Get-Command python3 -ErrorAction SilentlyContinue
}

if (-not $python) {
    Write-Host "❌ 未找到 Python" -ForegroundColor Red
    Write-Host "请安装 Python: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit
}

Write-Host "✅ 找到 Python: $($python.Source)" -ForegroundColor Green
Write-Host ""
Write-Host "启动服务器..." -ForegroundColor Cyan
Write-Host ""

try {
    # 启动服务器
    & $python.Source server.py
} catch {
    Write-Host "❌ 启动失败: $_" -ForegroundColor Red
    pause
}
