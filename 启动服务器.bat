@echo off
cd /d "%~dp0"
echo ===========================================
echo 个人学习系统 - 启动服务器
echo ===========================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo 未找到 python 命令，尝试 py...
    py --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo 错误：未找到 Python！
        echo 请安装 Python：https://www.python.org/downloads/
        pause
        exit /b
    ) else (
        set PYTHON=py
    )
) else (
    set PYTHON=python
)

echo 使用 Python: %PYTHON%
echo.
echo 正在检查端口并启动服务器...
echo.

%PYTHON% check-server.py
