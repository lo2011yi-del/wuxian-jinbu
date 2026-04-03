#!/usr/bin/env python3
"""
简单可靠的本地服务器
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

# 切换到脚本所在目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 50)
print("个人学习系统服务器")
print("=" * 50)
print("")
print("启动中...")

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("")
        print("服务器已启动!")
        print("")
        print(f"请访问: http://localhost:{PORT}")
        print("")
        print("不要关闭此窗口")
        print("=" * 50)
        
        # 自动打开浏览器
        webbrowser.open(f"http://localhost:{PORT}")
        
        httpd.serve_forever()
except KeyboardInterrupt:
    print("")
    print("")
    print("服务器已停止")
except Exception as e:
    print("")
    print(f"错误: {e}")
    print("")
    print(f"可能端口 {PORT} 被占用，尝试以下方法：")
    print("1. 关闭其他程序")
    print("2. 修改 server.py 中的 PORT = 8080 为其他数字如 3000")
    input("")
