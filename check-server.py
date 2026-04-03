#!/usr/bin/env python3
"""
检查服务器状态并自动启动
"""

import socket
import subprocess
import sys
import os

def check_port(port):
    """检查端口是否被占用"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        try:
            s.bind(('', port))
            return True  # 端口可用
        except socket.error:
            return False  # 端口被占用

def find_available_port():
    """查找可用端口"""
    for port in [8080, 3000, 5000, 8000, 9000]:
        if check_port(port):
            return port
    return None

def main():
    print("=" * 50)
    print("服务器状态检查")
    print("=" * 50)
    print("")
    
    # 检查 8080 端口
    if check_port(8080):
        print("✓ 端口 8080 可用")
        port = 8080
    else:
        print("✗ 端口 8080 被占用")
        port = find_available_port()
        if port:
            print(f"✓ 找到可用端口: {port}")
        else:
            print("✗ 无法找到可用端口")
            input("\n按回车键退出...")
            return
    
    print("")
    print(f"即将启动服务器，使用端口 {port}")
    print(f"访问地址: http://localhost:{port}")
    print("")
    print("=" * 50)
    
    # 启动服务器
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    # 修改 server.py 的端口
    with open('server.py', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换端口
    content = content.replace(f'PORT = 8080', f'PORT = {port}')
    
    with open('server_temp.py', 'w', encoding='utf-8') as f:
        f.write(content)
    
    print("启动中...")
    print("")
    
    try:
        subprocess.run([sys.executable, 'server_temp.py'])
    except KeyboardInterrupt:
        pass
    finally:
        # 清理临时文件
        if os.path.exists('server_temp.py'):
            os.remove('server_temp.py')

if __name__ == '__main__':
    main()
