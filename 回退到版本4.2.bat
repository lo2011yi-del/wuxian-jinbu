@echo off
chcp 65001 >nul
echo ==========================================
echo   个人学习系统 - 版本 4.2 回退工具
echo ==========================================
echo.

set "BACKUP_DIR=%~dp0"
set "TARGET_DIR=C:\Users\Administrator\learning-system"

echo 📁 备份位置: %BACKUP_DIR%
echo 🎯 目标位置: %TARGET_DIR%
echo.

if not exist "%TARGET_DIR%" (
    echo ❌ 错误: 目标目录不存在
    pause
    exit /b 1
)

echo ⚠️  警告: 这将覆盖当前系统文件！
echo.
set /p confirm="确定要回退到版本 4.2 吗? (yes/no): "

if /i not "%confirm%"=="yes" (
    echo 已取消回退操作
    pause
    exit /b 0
)

echo.
echo 🔄 正在回退...

xcopy /Y /E /I "%BACKUP_DIR%\css" "%TARGET_DIR%\css" >nul
xcopy /Y /E /I "%BACKUP_DIR%\js" "%TARGET_DIR%\js" >nul
copy /Y "%BACKUP_DIR%\*.html" "%TARGET_DIR%\" >nul 2>&1
copy /Y "%BACKUP_DIR%\*.bat" "%TARGET_DIR%\" >nul 2>&1
copy /Y "%BACKUP_DIR%\*.py" "%TARGET_DIR%\" >nul 2>&1
copy /Y "%BACKUP_DIR%\*.ps1" "%TARGET_DIR%\" >nul 2>&1
copy /Y "%BACKUP_DIR%\VERSION-4.2.txt" "%TARGET_DIR%\" >nul 2>&1

echo.
echo ✅ 回退完成！
echo 📝 版本: 4.2
echo.
echo 请刷新浏览器页面查看效果
pause
