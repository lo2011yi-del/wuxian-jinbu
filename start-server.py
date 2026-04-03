#!/usr/bin/env python3
"""
本地开发服务器
用于运行学习系统，避免浏览器的 CORS 限制

使用方法:
    python start-server.py
    
然后访问 http://localhost:8080
"""

import http.server
import socketserver
import socket
import webbrowser
import os
import sys

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # 添加 CORS 头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        # 自定义日志格式
        print(f"[{self.log_date_time_string()}] {args[0]}")

def check_port_available(port):
    """检查端口是否可用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('', port))
            return True
        except socket.error:
            return False

def find_available_port(start_port):
    """查找可用端口"""
    port = start_port
    while port < start_port + 100:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(('', port))
                return port
            except socket.error:
                port += 1
    return None

if __name__ == "__main__":
    # 切换到脚本所在目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)
    
    print(f"=" * 60)
    print(f"📚 个人学习系统 - 本地服务器")
    print(f"=" * 60)
    print(f"\n📂 工作目录: {script_dir}")
    
    # 检查端口
    if not check_port_available(PORT):
        new_port = find_available_port(PORT + 1)
        if new_port:
            print(f"⚠️  端口 {PORT} 已被占用，将使用端口 {new_port}")
            PORT = new_port
        else:
            print(f"❌ 无法找到可用端口 (8080-8180)")
            input("\n按回车键退出...")
            sys.exit(1)
    
    try:
        with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
            print(f"\n✅ 服务器启动成功!")
            print(f"\n🌐 访问地址: http://localhost:{PORT}")
            print(f"\n📱 局域网访问: http://{socket.gethostbyname(socket.gethostname())}:{PORT}")
            print(f"\n⚠️  请勿关闭此窗口")
            print(f"=" * 60)
            
            # 自动打开浏览器
            try:
                webbrowser.open(f"http://localhost:{PORT}")
                print("🌍 已自动打开浏览器")
            except Exception as e:
                print(f"⚠️  自动打开浏览器失败: {e}")
            
            print(f"\n按 Ctrl+C 停止服务器\n")
            
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print(f"\n\n👋 服务器已停止")
                sys.exit(0)
                
    except Exception as e:
        print(f"\n❌ 服务器启动失败: {e}")
        print(f"\n可能的原因:")
        print(f"1. 防火墙阻止了端口 {PORT}")
        print(f"2. 权限不足（尝试使用管理员权限运行）")
        print(f"3. 网络接口异常")
        input("\n按回车键退出...")
        sys.exit(1)
