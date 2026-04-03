# 部署指南

## 手动推送到 GitHub

由于网络问题，无法自动推送到 GitHub。请手动执行以下步骤：

### 1. 配置 Git 用户信息（如果尚未配置）
```bash
git config --global user.name "你的名字"
git config --global user.email "你的邮箱"
```

### 2. 推送到 GitHub
```bash
cd C:\Users\Administrator\learning-system
git remote add origin https://github.com/lo2011yi-del/wuxian-jinbu.git
git push -u origin master --force
```

如果 HTTPS 连接失败，可以尝试使用 SSH：
```bash
git remote set-url origin git@github.com:lo2011yi-del/wuxian-jinbu.git
git push -u origin master --force
```

### 3. 或者使用 GitHub Desktop 上传
1. 下载并安装 GitHub Desktop
2. 选择 "Add existing repository"
3. 选择 `C:\Users\Administrator\learning-system` 目录
4. 推送到 GitHub

## Vercel 部署

### 方法一：GitHub 集成（推荐）

1. 访问 https://vercel.com/new
2. 导入 GitHub 仓库 `wuxian-jinbu`
3. 项目会自动部署

### 方法二：Vercel CLI 本地部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 进入项目目录
cd C:\Users\Administrator\learning-system

# 登录并部署
vercel login
vercel --prod
```

### 方法三：手动上传

1. 访问 https://vercel.com/new
2. 选择 "Import Git Repository" 下方的 "Upload"
3. 将整个 `learning-system` 文件夹压缩为 zip
4. 上传并部署

## 配置环境变量

部署后，需要在 Vercel Dashboard 中配置以下环境变量：

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `AI_PROVIDER` | AI 提供商 | `kimi`, `openai`, `deepseek` |
| `AI_API_KEY` | API 密钥 | `sk-...` |
| `AI_MODEL` | 模型名称 | `moonshot-v1-8k` |
| `ADMIN_PASSWORD` | 管理员密码 | 自定义强密码 |

配置步骤：
1. 进入 Vercel Dashboard
2. 选择你的项目
3. 点击 "Settings" → "Environment Variables"
4. 添加上述变量
5. 重新部署项目

## 访问管理面板

部署完成后，访问：
- 主页：`https://你的域名.vercel.app/`
- 管理面板：`https://你的域名.vercel.app/admin.html`

使用 `ADMIN_PASSWORD` 中设置的密码登录管理面板。

## 本地测试

在部署前，可以先本地测试：

```bash
# 启动本地服务器
cd C:\Users\Administrator\learning-system
python server.py

# 访问 http://localhost:8080
```

注意：本地测试时 AI 功能需要在前端设置 API Key（因为服务端 API 需要环境变量）。
