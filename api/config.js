/**
 * Vercel Serverless Function - 配置管理
 * 管理员查看和更新 AI 配置
 */

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  
  // 简单的密码验证
  const authHeader = req.headers['x-admin-password'];
  const isAuthenticated = ADMIN_PASSWORD && authHeader === ADMIN_PASSWORD;

  // GET 请求 - 返回当前配置（不含密钥）
  if (req.method === 'GET') {
    return res.status(200).json({
      provider: process.env.AI_PROVIDER || 'kimi',
      model: process.env.AI_MODEL || 'moonshot-v1-8k',
      hasKey: !!process.env.AI_API_KEY,
      authenticated: isAuthenticated
    });
  }

  // POST 请求 - 需要验证
  if (req.method === 'POST') {
    if (!isAuthenticated) {
      return res.status(401).json({ error: '未授权访问' });
    }

    const { provider, model, apiKey } = req.body;
    
    // 注意：这里只是返回成功，实际更新需要在 Vercel Dashboard 中设置环境变量
    // 因为 serverless 函数无法持久化修改环境变量
    return res.status(200).json({
      success: true,
      message: '配置已接收。注意：实际更新需要在 Vercel Dashboard 的 Environment Variables 中设置。',
      config: {
        provider: provider || process.env.AI_PROVIDER,
        model: model || process.env.AI_MODEL,
        hasKey: !!(apiKey || process.env.AI_API_KEY)
      }
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
