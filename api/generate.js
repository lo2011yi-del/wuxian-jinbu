/**
 * Vercel Serverless Function - AI 生成
 * 服务端代理 AI API 调用，保护 API 密钥
 */

module.exports = async (req, res) => {
  // 设置 CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, temperature = 0.7, max_tokens = 4000, stream = false } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing or invalid messages' });
    }

    // 从环境变量获取配置
    const AI_PROVIDER = process.env.AI_PROVIDER || 'kimi';
    const AI_API_KEY = process.env.AI_API_KEY;
    const AI_MODEL = process.env.AI_MODEL || 'moonshot-v1-8k';

    if (!AI_API_KEY) {
      return res.status(500).json({ error: 'AI API 密钥未配置' });
    }

    let endpoint, headers, body;

    // 根据不同提供商配置请求
    switch (AI_PROVIDER.toLowerCase()) {
      case 'kimi':
        endpoint = 'https://api.moonshot.cn/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        };
        body = {
          model: AI_MODEL,
          messages,
          temperature,
          max_tokens
        };
        break;
        
      case 'openai':
        endpoint = 'https://api.openai.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        };
        body = {
          model: AI_MODEL || 'gpt-3.5-turbo',
          messages,
          temperature,
          max_tokens
        };
        break;
        
      case 'deepseek':
        endpoint = 'https://api.deepseek.com/v1/chat/completions';
        headers = {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        };
        body = {
          model: AI_MODEL || 'deepseek-chat',
          messages,
          temperature,
          max_tokens
        };
        break;
        
      default:
        return res.status(400).json({ error: `Unknown AI provider: ${AI_PROVIDER}` });
    }

    // 发送请求到 AI API
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('AI API Error:', error);
      return res.status(response.status).json({ 
        error: 'AI API 请求失败',
        details: error
      });
    }

    const data = await response.json();
    
    // 返回标准化的响应
    return res.status(200).json({
      success: true,
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
      model: data.model
    });

  } catch (error) {
    console.error('Server Error:', error);
    return res.status(500).json({ 
      error: '服务器内部错误',
      message: error.message
    });
  }
};
