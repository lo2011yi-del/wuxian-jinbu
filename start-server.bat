@echo off
echo 正在启动个人学习系统服务器...
echo 请等待...
python -m http.server 8080 --bind 127.0.0.1
echo.
echo 服务器已启动！
echo 请在浏览器访问: http://localhost:8080
echo.
pause
