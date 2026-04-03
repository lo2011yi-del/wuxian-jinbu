/**
 * AI 服务模块
 * 用于与 AI API 交互，生成课程内容
 */

const AIService = {
    // API 端点配置
    ENDPOINTS: {
        kimi: 'https://api.moonshot.cn/v1/chat/completions',
        'kimi-coding': 'https://api.kimi.com/coding/v1/chat/completions',  // Kimi Coding 专用端点
        openai: 'https://api.openai.com/v1/chat/completions',
        deepseek: 'https://api.deepseek.com/v1/chat/completions'
    },

    // 模型名称映射 - 如果使用特殊模型名需要转换
    MODEL_MAP: {
        // 直接使用用户选择的模型名称
        'kimi-coding/k2p5': 'kimi-coding/k2p5',  // Kimi K2.5 直接使用
        'moonshot-v1-8k': 'moonshot-v1-8k',
        'moonshot-v1-32k': 'moonshot-v1-32k',
        'moonshot-v1-128k': 'moonshot-v1-128k'
    },

    /**
     * 生成课程大纲
     */
    async generateCourseOutline(courseData) {
        const settings = Storage.getSettings();
        const prompt = this.buildOutlinePrompt(courseData);
        
        console.log('[AI] 生成大纲提示词:', prompt.substring(0, 200) + '...');
        
        const response = await this.callAI({
            messages: [
                {
                    role: 'system',
                    content: '你是一个专业的教育内容设计师，擅长根据学习目标设计系统化的课程大纲。请使用中文回复。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        return this.parseOutlineResponse(response, courseData);
    },

    /**
     * 生成具体课程内容
     */
    async generateLessonContent(course, lessonIndex) {
        const settings = Storage.getSettings();
        const lesson = course.outline[lessonIndex];
        const prompt = this.buildLessonPrompt(course, lesson, lessonIndex);
        
        const response = await this.callAI({
            messages: [
                {
                    role: 'system',
                    content: `你是一位专业的${course.subject}教师，擅长将复杂的知识讲解得通俗易懂。请使用中文回复，使用 Markdown 格式输出。`
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        return {
            content: response,
            generatedAt: new Date().toISOString()
        };
    },

    /**
     * 生成课后作业
     */
    async generateHomework(course, lessonIndex, lessonContent) {
        const prompt = this.buildHomeworkPrompt(course, lessonIndex, lessonContent);
        
        const response = await this.callAI({
            messages: [
                {
                    role: 'system',
                    content: '你是一位专业的教育评估专家，擅长设计有针对性的课后练习。请使用中文回复，使用 Markdown 格式输出。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 2000
        });

        return {
            content: response,
            generatedAt: new Date().toISOString()
        };
    },

    /**
     * 清理 API Key，去除所有可能的不可见字符
     */
    sanitizeApiKey(apiKey) {
        if (!apiKey) return '';
        // 去除所有空白字符（包括空格、换行、回车、制表符等）
        return apiKey.replace(/\s/g, '');
    },

    /**
     * 调用后端 API（Vercel 部署时使用）
     */
    async callServerAPI(params) {
        console.log('[AI] 使用服务端 API');
        
        const response = await fetch('/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: params.messages,
                temperature: params.temperature || 0.7,
                max_tokens: params.max_tokens || 2000
            })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || `服务端请求失败: ${response.status}`);
        }
        
        if (!data.success) {
            throw new Error(data.error || 'AI 生成失败');
        }
        
        return data.content;
    },

    /**
     * 调用 AI API
     */
    async callAI(params) {
        const settings = Storage.getSettings();
        
        // 检测是否使用服务端后端（Vercel 部署或未设置 API Key）
        const isServerBackend = window.location.hostname.includes('vercel') || 
                               window.location.hostname.includes('localhost') === false ||
                               !settings.aiApiKey;
        
        if (isServerBackend) {
            try {
                return await this.callServerAPI(params);
            } catch (error) {
                console.error('[AI] 服务端 API 调用失败:', error);
                // 如果服务端调用失败且没有客户端 API Key，则报错
                if (!settings.aiApiKey) {
                    throw new Error('AI 服务暂时不可用，请稍后重试或配置客户端 API Key');
                }
                // 否则回退到客户端调用
                console.log('[AI] 回退到客户端 API 调用');
            }
        }
        
        // 清理 API Key（去除所有空白字符）
        const rawKey = settings.aiApiKey || '';
        const apiKey = this.sanitizeApiKey(rawKey);
        
        console.log('[AI] 当前设置:', {
            provider: settings.aiProvider,
            model: settings.aiModel,
            hasApiKey: !!apiKey,
            rawKeyLength: rawKey.length,
            sanitizedKeyLength: apiKey.length,
            apiKeyPrefix: apiKey ? apiKey.substring(0, 15) + '...' : 'none',
            startsWithSk: apiKey.startsWith('sk-')
        });
        
        // 检查 API Key
        if (!apiKey) {
            throw new Error('请先设置 AI API Key，或在 Vercel 部署使用服务端 API');
        }
        
        // 验证 API Key 格式
        if (!apiKey.startsWith('sk-')) {
            console.warn('[AI] API Key 格式警告: 应该以 sk- 开头');
        }

        const endpoint = settings.customEndpoint || 
            this.ENDPOINTS[settings.aiProvider] || 
            this.ENDPOINTS.kimi;

        // 模型名称 - 直接使用用户选择的模型
        const modelName = settings.aiModel || 'kimi-coding/k2p5';

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        };

        const body = {
            model: modelName,
            messages: params.messages,
            temperature: params.temperature || 0.7,
            max_tokens: params.max_tokens || 2000
        };

        console.log('[AI] 请求信息:', {
            endpoint: endpoint,
            model: modelName,
            messagesCount: params.messages.length,
            headers: Object.keys(headers)
        });

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify(body)
            });

            console.log('[AI] 响应状态:', response.status, response.statusText);

            // 获取响应文本用于调试
            const responseText = await response.text();
            console.log('[AI] 原始响应:', responseText.substring(0, 500));

            if (!response.ok) {
                let errorMessage = `HTTP ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error?.message || errorData.message || errorMessage;
                } catch (e) {
                    errorMessage = responseText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const data = JSON.parse(responseText);
            console.log('[AI] 解析后的数据:', data);
            
            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('API 返回数据格式异常');
            }
            
            return data.choices[0].message.content || '';
        } catch (error) {
            console.error('[AI] 请求错误:', error);
            
            // 提供更详细的错误信息
            if (error.message.includes('Failed to fetch')) {
                throw new Error('网络请求失败\n\n可能原因：\n1. 浏览器 CORS 限制 - 请通过 http://localhost:8080 访问\n2. 网络连接问题\n3. API 端点不可用');
            }
            
            if (error.message.includes('401')) {
                throw new Error('API Key 无效或已过期\n\n请检查：\n1. API Key 是否正确复制\n2. Key 是否已在 Moonshot 平台启用\n3. Key 是否已过期');
            }
            
            if (error.message.includes('429')) {
                throw new Error('请求过于频繁或额度已用完\n\n请检查：\n1. API 账户是否有足够余额\n2. 是否超出速率限制');
            }
            
            throw new Error(`AI 请求失败: ${error.message}`);
        }
    },

    /**
     * 根据修改要求重新生成课程大纲
     * @param {Object} course - 原课程数据
     * @param {string} modificationRequest - 用户的修改要求描述
     * @param {Array} currentOutline - 当前大纲
     */
    async regenerateOutlineWithChanges(course, modificationRequest, currentOutline) {
        const prompt = this.buildRegeneratePrompt(course, modificationRequest, currentOutline);
        
        console.log('[AI] 重新生成大纲，修改要求:', modificationRequest);
        
        const response = await this.callAI({
            messages: [
                {
                    role: 'system',
                    content: '你是一位专业的教育内容设计师。请根据用户的修改要求，重新设计课程大纲。保持原有的课程结构（天数不变），但按照用户要求调整内容深度、风格或重点。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 4000
        });

        return this.parseOutlineResponse(response, course);
    },

    /**
     * 构建重新生成大纲的提示词
     */
    buildRegeneratePrompt(course, modificationRequest, currentOutline) {
        const durationMap = {
            '7天': 7,
            '14天': 14,
            '30天': 30,
            '3个月': 90,
            '6个月': 180
        };

        const days = durationMap[course.duration] || 30;
        const dailyMinutes = this.parseTimeToMinutes(course.dailyTime);
        
        // 格式化当前大纲
        const outlineText = currentOutline.map(l => 
            `第${l.day}天: ${l.title} - ${l.description || '无描述'}`
        ).join('\n');

        return `请根据以下要求重新设计课程大纲：

【原课程信息】
- 学习主题：${course.subject}
- 学习层次：${course.level}
- 课程时长：${course.duration}（共 ${days} 天）
- 每日学习时间：${course.dailyTime}（约 ${dailyMinutes} 分钟）
${course.goals ? `- 学习目标：${course.goals}` : ''}

【当前大纲】
${outlineText}

【用户的修改要求】
${modificationRequest}

【重新生成要求】
1. 保持 ${days} 天的课程结构不变
2. 严格按照用户的修改要求调整内容
3. 每一天的内容要适合在 ${dailyMinutes} 分钟内完成
4. 使用以下格式输出：

第1天|标题|内容简介
第2天|标题|内容简介
...

请确保新的大纲比原大纲更符合用户需求，内容更加详实和实用。`;
    },

    /**
     * 根据学科类型获取对应的大纲框架指导
     */
    getSubjectFramework(subject) {
        const subjectLower = subject.toLowerCase();
        
        // 人文社科类
        if (/历史|哲学|文学|社会学|心理学|经济学|政治学|人类学|考古/.test(subjectLower)) {
            return {
                type: '人文社科',
                framework: `
【人文社科类课程大纲设计原则】

1. 不是按照"概念-理论-应用"的死板模式，而是按照：
   - 问题驱动：每一天从一个核心问题或现象出发
   - 时空脉络：按时间线、思想演变或因果链条组织
   - 多元视角：呈现不同学派、观点的对比与争论
   - 现实关联：与当代社会、个人经验的连接

2. 内容质量标准：
   - 历史类：必须包含具体的人物、事件、史料分析，不是泛泛而谈"某个时期的特点"
   - 哲学类：必须深入分析原著思想、论证逻辑，不是简单罗列"某某哲学家认为"
   - 社科类：必须有真实的案例、数据、田野调查或实验研究支撑

3. 每天的学习应该包括：
   - 核心材料精读（一手资料或经典文献）
   - 关键问题分析（为什么是这样？背后的逻辑是什么？）
   - 批判性思考（这个观点有什么问题？还有什么视角？）
   - 现实映射（这对理解今天的世界有什么帮助？）

4. 禁止出现的表述：
   - "了解XX的概念"
   - "掌握XX的基础知识"
   - "认识XX的重要性"
   必须改为："分析XX事件的前因后果"、"比较XX与YY的异同"、"评价ZZ观点的合理性"`
            };
        }
        
        // 技能实践类
        if (/编程|设计|写作|演讲|烹饪|摄影|绘画|音乐|乐器|运动|瑜伽|健身|手工/.test(subjectLower)) {
            return {
                type: '技能实践',
                framework: `
【技能实践类课程大纲设计原则】

1. 项目驱动式学习，不是知识点堆砌：
   - 每一天都有明确的产出目标（完成什么作品/实现什么功能）
   - 从简单项目开始，逐步增加复杂度
   - 最后一天完成一个综合项目

2. 学习路径：
   - 工具熟悉 → 基础技法 → 组合应用 → 风格形成
   - 模仿练习 → 变形创作 → 独立设计

3. 每天内容必须包含：
   - 技能点详解（怎么做？关键要领是什么？常见错误？）
   - 示范案例（优秀作品分析，为什么好？）
   - 实操任务（今天必须动手完成的练习）
   - 反馈要点（如何评价自己的练习成果？）

4. 内容质量标准：
   - 必须有具体的操作步骤，不能只有"多练习"
   - 必须有判断标准（什么是好的？什么需要改进？）
   - 必须循序渐进，今天的内容是明天的基础`
            };
        }
        
        // 理工科类
        if (/数学|物理|化学|生物|计算机|工程|算法|数据结构|机器学习|统计/.test(subjectLower)) {
            return {
                type: '理工科',
                framework: `
【理工科类课程大纲设计原则】

1. 问题导向，不是定义堆砌：
   - 每个概念都从"为什么需要这个？"开始
   - 展现知识的演化过程（人类是怎么发现/发明这个的？）
   - 强调直观理解，再形式化

2. 学习路径：
   - 直观理解 → 形式化定义 → 性质推导 → 应用场景
   - 简单例子 → 一般化 → 边界情况 → 实际复杂问题

3. 每天内容必须包含：
   - 核心概念/定理的直观解释（为什么是这样？）
   - 形式化定义和推导（严谨的细节）
   - 具体计算/实现例子（手算或编码走一遍）
   - 常见错误和注意事项（学生容易在哪里出错？）

4. 内容质量标准：
   - 必须有具体的计算/推导过程，不能只有"根据XX定理可得"
   - 必须有可视化的直观解释（图、动画、类比）
   - 必须连接实际应用（这个知识解决什么问题？）`
            };
        }
        
        // 语言学习类
        if (/英语|日语|法语|德语|西班牙语|中文|韩语|语言|口语/.test(subjectLower)) {
            return {
                type: '语言学习',
                framework: `
【语言学习类课程大纲设计原则】

1. 交际场景驱动：
   - 每一天围绕一个真实交际场景（点餐、问路、面试等）
   - 不是按照语法点组织，而是按照功能组织

2. 学习内容：
   - 核心词汇（这个场景最常用的20-30个词）
   - 关键句型（高频表达的多种说法）
   - 文化背景（语言使用的语境和禁忌）
   - 互动练习（角色对话、听力理解）

3. 技能平衡：
   - 输入（听、读）与输出（说、写）交替进行
   - 准确性练习与流利性练习结合

4. 内容质量标准：
   - 必须有真实语料（不是教科书式生造句子）
   - 必须有发音/语调指导
   - 必须有文化语境说明`
            };
        }
        
        // 商业管理类
        if (/管理|营销|创业|投资|金融|商业|领导力|沟通|谈判/.test(subjectLower)) {
            return {
                type: '商业管理',
                framework: `
【商业管理类课程大纲设计原则】

1. 案例驱动：
   - 每一天分析1-2个真实商业案例（成功或失败）
   - 从案例中提炼原则，不是先讲理论再举例子

2. 学习者视角：
   - "如果你是当时的决策者，你会怎么做？"
   - "这个策略在你的行业/公司如何应用？"

3. 内容结构：
   - 案例背景（发生了什么？）
   - 关键决策点（当时面临什么选择？）
   - 分析与讨论（为什么这样决策？还有什么可能？）
   - 原则提炼（从案例中总结的一般性原则）
   - 迁移应用（如何应用到你的情境？）

4. 内容质量标准：
   - 必须是真实案例，有具体数据和时间线
   - 必须呈现决策的复杂性（不是事后诸葛亮）
   - 必须讨论失败案例和教训`
            };
        }
        
        // 艺术鉴赏类
        if (/艺术|美术|音乐鉴赏|电影|戏剧|建筑|美学|艺术史/.test(subjectLower)) {
            return {
                type: '艺术鉴赏',
                framework: `
【艺术鉴赏类课程大纲设计原则】

1. 作品为中心：
   - 每一天深入分析1-2件具体作品（不是泛泛介绍某个流派）
   - 从作品细节出发，不是从概念出发

2. 多维度分析：
   - 形式分析（构图、色彩、技法等）
   - 历史语境（创作背景、艺术家的处境）
   - 意义阐释（这件作品想表达什么？产生了什么影响？）
   - 个人回应（你从中感受到了什么？）

3. 比较视野：
   - 同主题不同艺术家的处理
   - 同艺术家不同时期的变化
   - 不同文化中的相似主题

4. 内容质量标准：
   - 必须有具体的作品细节分析，不能只说"XX大师的杰作"
   - 必须提供图像/音频材料描述
   - 必须包含不同解读视角`
            };
        }
        
        // 默认/通用
        return {
            type: '通用',
            framework: `
【通用课程大纲设计原则】

1. 问题驱动，不是概念罗列：
   - 每一天从一个真实问题出发
   - 学习是为了解决问题，不是为了"掌握知识"

2. 内容质量标准：
   - 必须有具体的例子、案例、数据支撑
   - 必须有可操作的方法/步骤
   - 必须有判断标准（什么是好的？）
   - 必须避免"了解"、"认识"、"掌握基础"等空泛表述

3. 每天的学习应该包括：
   - 问题背景（为什么这很重要？）
   - 核心内容（具体的知识、方法、技能）
   - 实践应用（今天学的怎么用？）
   - 反思总结（关键点是什么？还有什么疑问？）`
        };
    },

    /**
     * 构建大纲生成提示词
     */
    buildOutlinePrompt(courseData) {
        const durationMap = {
            '7天': 7,
            '14天': 14,
            '30天': 30,
            '3个月': 90,
            '6个月': 180
        };

        const days = durationMap[courseData.duration] || 30;
        const dailyMinutes = this.parseTimeToMinutes(courseData.dailyTime);

        // 根据学习层次调整内容深度
        const levelGuidance = {
            '入门': '从零开始，具体、可操作，避免抽象概念',
            '进阶': '在基础上深入，强调批判性思维和应用能力',
            '专家': '前沿深度内容，鼓励质疑和创新'
        };
        
        // 获取学科特定框架
        const subjectFramework = this.getSubjectFramework(courseData.subject);

        return `请为以下学习需求设计高质量的详细课程大纲：

【学习主题】${courseData.subject}
【学科类型】${subjectFramework.type}
【学习层次】${courseData.level}
【课程时长】${courseData.duration}（共约 ${days} 天）
【每日学习时间】${courseData.dailyTime}（约 ${dailyMinutes} 分钟）
【课程语言】${courseData.language || '中文'}
${courseData.goals ? `【学习目标】${courseData.goals}` : ''}
${courseData.focus ? `【重点关注】${courseData.focus}` : ''}

${subjectFramework.framework}

【学习层次要求】
${levelGuidance[courseData.level] || '循序渐进，由浅入深'}

【每天的设计标准】
1. 标题要具体（例如："分析鸦片战争的经济背景" 而不是 "了解近代史"）
2. 内容简介要包含：
   - 具体学什么（不是什么概念，而是什么材料/案例/技能）
   - 到什么程度（能分析到什么程度？能完成什么产出？）
   - 怎么学（阅读？实践？讨论？）

3. 内容充实度要求：
   - ${dailyMinutes <= 30 ? '聚焦1个核心，讲深讲透' : dailyMinutes <= 60 ? '1个核心+2-3个支撑点' : '1个核心主题，多角度深入分析'}
   - 必须有具体材料/案例/练习支撑，不能只有"讲解XX概念"

【绝对禁止的表述】
- "了解XX的基本概念" ❌
- "掌握XX的基础知识" ❌
- "认识XX的重要性" ❌
- "学习XX的原理" ❌

【必须使用的表述】
- "分析XX的具体案例，探讨..." ✅
- "通过YY材料，理解ZZ是如何..." ✅
- "完成AA练习，掌握BB技巧" ✅
- "比较XX与YY的异同，评价..." ✅

【输出格式】
第1天|具体可执行的标题|详细内容简介（包含：学习材料/案例 + 具体任务 + 预期产出）

请确保：
- 大纲符合${subjectFramework.type}的学科特点
- 每一天都有具体的学习材料和明确的产出
- 内容质量高，不是泛泛而谈
- 适合${courseData.level}水平的学习者`;
    },

    /**
     * 获取学科类型的内容生成框架
     */
    getLessonFramework(subject) {
        const subjectLower = subject.toLowerCase();
        
        // 人文社科类
        if (/历史|哲学|文学|社会学|心理学|经济学|政治学|人类学|考古/.test(subjectLower)) {
            return {
                type: '人文社科',
                structure: `
【人文社科类课程内容结构】

## 一、引入：问题或现象
- 从一个具体的历史场景、哲学问题或社会现象开始
- 为什么这个问题值得思考？与今天有什么关联？

## 二、核心材料分析
- 呈现一手材料（历史文献、哲学原著、研究数据等）
- 细读分析：材料说了什么？为什么这么说？
- 批判性思考：材料的可信度？还有什么视角？

## 三、多维度探讨
- 不同观点的对比（不同学派、不同时代、不同文化）
- 深入分析核心概念（不是定义，而是探究和辨析）
- 具体案例支撑（真实的人物、事件、研究）

## 四、当代映射
- 这对理解今天的世界有什么启示？
- 对个人思考或社会实践的指导意义

💡 提示框用于：学习方法、记忆技巧、延伸资源
🎯 关键概念框用于：核心术语的深度解析
⚠️ 注意框用于：常见误解、争议观点、批判性提醒`,
                requirements: `
【人文社科内容质量标准】
- 必须有具体的历史人物/事件/文本，不能泛泛而谈"某个时期"
- 必须呈现多种观点，不是单一视角的灌输
- 必须引导批判性思考，鼓励质疑和反思
- 禁止："XX认为..."罗列式表述，必须有分析和评价`,
            };
        }
        
        // 技能实践类
        if (/编程|设计|写作|演讲|烹饪|摄影|绘画|音乐|乐器|运动|瑜伽|健身|手工/.test(subjectLower)) {
            return {
                type: '技能实践',
                structure: `
【技能实践类课程内容结构】

## 一、今日目标
- 今天要完成什么作品/实现什么功能？
- 最终效果展示（参考案例）

## 二、技能详解
- 核心技法分步讲解（每一步的关键要领）
- 常见错误及如何避免
- 优秀作品分析（为什么好？好在哪里？）

## 三、示范演示
- 完整操作过程的详细展示
- 关键步骤的注意事项
- 替代方法或变体技巧

## 四、实操任务
- 具体练习内容（必须明确产出要求）
- 分阶段目标（先完成什么，再完善什么）
- 自评标准（如何判断自己的作品质量？）

💡 提示框用于：效率技巧、工具推荐、避坑指南
🎯 关键概念框用于：核心技法原理、审美标准
⚠️ 注意框用于：常见错误、安全提醒、质量红线`,
                requirements: `
【技能实践内容质量标准】
- 必须有可执行的操作步骤，不能只有"多练习"
- 必须有明确的产出标准和评判依据
- 必须有具体示范（示例作品、参考案例）
- 禁止："努力学习"、"多加练习"等空洞建议`,
            };
        }
        
        // 理工科类
        if (/数学|物理|化学|生物|计算机|工程|算法|数据结构|机器学习|统计/.test(subjectLower)) {
            return {
                type: '理工科',
                structure: `
【理工科类课程内容结构】

## 一、动机：为什么需要这个？
- 从实际问题出发（什么难题需要解决？）
- 直观理解（这个概念的直观图像/类比是什么？）

## 二、形式化定义与推导
- 严谨的定义和符号表示
- 逐步推导过程（不跳步）
- 关键定理/性质的证明思路

## 三、具体计算/实现
- 简单例子手算/手推（完整过程）
- 一般化推广（从简单到复杂）
- 边界情况和特殊情况

## 四、应用与拓展
- 实际应用场景（解决什么问题？）
- 与其他知识点的联系
- 常见错误和注意事项

💡 提示框用于：计算技巧、记忆方法、可视化工具
🎯 关键概念框用于：核心定理、关键公式、本质理解
⚠️ 注意框用于：常见计算错误、概念混淆、边界条件`,
                requirements: `
【理工科内容质量标准】
- 必须有完整的推导/计算过程，不能只有结论
- 必须有直观解释（图、类比、实例）
- 必须讨论边界条件和反例
- 禁止："易得"、"显然"、"根据XX定理"等跳过过程的表述`,
            };
        }
        
        // 语言学习类
        if (/英语|日语|法语|德语|西班牙语|中文|韩语|语言|口语/.test(subjectLower)) {
            return {
                type: '语言学习',
                structure: `
【语言学习类课程内容结构】

## 一、交际场景导入
- 今日场景（在什么情况下需要使用？）
- 对话范例（真实语境中的完整对话）

## 二、核心表达
- 关键词汇（10-15个核心词，含发音提示）
- 关键句型（3-5个高频表达，多种说法）
- 语法点（简要解释，重在应用）

## 三、文化语境
- 语用规则（什么时候用？对谁用？）
- 文化差异（不同文化的表达习惯）
- 常见禁忌（容易冒犯的地方）

## 四、互动练习
- 听力理解（真实语料）
- 角色对话（情境模拟）
- 输出任务（写作或口语练习）

💡 提示框用于：记忆技巧、发音窍门、学习资源
🎯 关键概念框用于：核心语法、固定搭配、语用规则
⚠️ 注意框用于：易混淆词汇、中式英语、文化误区`,
                requirements: `
【语言学习内容质量标准】
- 必须有真实语料，不能是教科书式生造句
- 必须有发音/语调指导
- 必须有文化语境说明（什么时候用？）
- 禁止：脱离语境的词汇列表、孤立语法讲解`,
            };
        }
        
        // 商业管理类
        if (/管理|营销|创业|投资|金融|商业|领导力|沟通|谈判/.test(subjectLower)) {
            return {
                type: '商业管理',
                structure: `
【商业管理类课程内容结构】

## 一、案例背景
- 真实企业/项目的情况介绍
- 当时面临的具体挑战和决策情境

## 二、关键决策点
- 决策者当时有哪些选择？
- 每种选择的利弊分析
- 最终决策及其理由

## 三、深度分析
- 决策背后的商业逻辑
- 成功或失败的关键因素
- 当时的约束条件和市场环境

## 四、原则提炼与应用
- 从案例总结的一般性原则
- 如何应用到你的行业/公司？
- 类似情境的决策框架

💡 提示框用于：分析工具、决策框架、行业洞察
🎯 关键概念框用于：核心商业概念、关键指标
⚠️ 注意框用于：决策陷阱、幸存者偏差、常见误判`,
                requirements: `
【商业管理内容质量标准】
- 必须是真实案例，有具体数据和时间线
- 必须呈现决策的复杂性，不是事后诸葛亮
- 必须有可迁移的原则和方法
- 禁止：成功学鸡汤、空泛的管理格言`,
            };
        }
        
        // 艺术鉴赏类
        if (/艺术|美术|音乐鉴赏|电影|戏剧|建筑|美学|艺术史/.test(subjectLower)) {
            return {
                type: '艺术鉴赏',
                structure: `
【艺术鉴赏类课程内容结构】

## 一、作品介绍
- 作品基本信息（创作者、年代、背景）
- 作品呈现（详细描述作品的外观/声音/结构）

## 二、形式分析
- 技法分析（用了什么手法？有什么特点？）
- 元素分析（色彩、构图、旋律、节奏等）
- 风格定位（属于什么流派？有什么创新？）

## 三、语境与意义
- 创作背景（艺术家的处境和意图）
- 文化语境（当时的社会文化环境）
- 作品影响（对后世的影响和评价）

## 四、比较与回应
- 同主题不同作品的比较
- 个人观感与体验（你感受到了什么？）
- 多元解读（不同视角的理解）

💡 提示框用于：鉴赏方法、背景知识、延伸推荐
🎯 关键概念框用于：艺术术语、风格特征、技法原理
⚠️ 注意框用于：常见误读、过度解读、审美偏见`,
                requirements: `
【艺术鉴赏内容质量标准】
- 必须有具体的作品细节分析
- 必须呈现创作背景和文化语境
- 必须包含多元解读视角
- 禁止：空泛的形容词堆砌（"伟大的杰作"）、单一的权威解读`,
            };
        }
        
        // 默认/通用
        return {
            type: '通用',
            structure: `
【通用课程内容结构】

## 一、问题导入
- 今天解决什么问题？
- 为什么这个问题重要？

## 二、核心内容
- 具体知识/方法/技能的详细讲解
- 多个例子说明
- 实际应用场景

## 三、深入探讨
- 常见误区和注意事项
- 进阶技巧或拓展思考
- 与其他知识点的联系

## 四、总结与应用
- 核心要点回顾
- 今日实践任务
- 进一步学习建议

💡 提示框用于：学习技巧、记忆方法、实用工具
🎯 关键概念框用于：核心定义、关键原理
⚠️ 注意框用于：常见错误、重要提醒`,
            requirements: `
【通用内容质量标准】
- 必须有具体的例子和案例
- 必须有可操作的方法或步骤
- 必须有明确的产出或应用方向
- 禁止：纯概念罗列、空洞的建议`,
        };
    },

    /**
     * 构建课程内容生成提示词
     */
    buildLessonPrompt(course, lesson, lessonIndex) {
        const dailyMinutes = this.parseTimeToMinutes(course.dailyTime);
        // 实际阅读时间约为计划时间的1.5倍（包含思考和理解）
        const actualContentMinutes = Math.round(dailyMinutes * 1.5);
        
        // 获取学科特定框架
        const lessonFramework = this.getLessonFramework(course.subject);
        
        return `请为以下课程生成详细、充实的第 ${lessonIndex + 1} 天学习内容：

【课程主题】${course.subject}
【学科类型】${lessonFramework.type}
【学习层次】${course.level}
【今日课程】${lesson.title}
【课程简介】${lesson.description || '无'}
【计划学习时间】${course.dailyTime}（约 ${dailyMinutes} 分钟）

${lessonFramework.structure}

${lessonFramework.requirements}

【通用要求】
1. 内容长度标准：
   - 字数要求：至少 1500-2000 字
   - 阅读时间：约 ${actualContentMinutes} 分钟（包含理解和思考时间）
   - 必须包含足够的细节，让学习者能真正学会，而不是泛泛了解

2. 禁止出现的表述：
   - "了解XX的概念"、"掌握XX的基础"、"认识XX的重要性"
   - "我们知道..."、"人们认为..."、"显然..."
   - 空泛的形容词堆砌（"伟大的"、"重要的"、"基础的"）

3. 必须做到：
   - 每个观点都有具体支撑（案例、数据、文本、推导）
   - 引导学习者思考，不是简单灌输
   - 内容具体、可操作、有明确产出

4. 排版格式：
   - 使用 ## 和 ### 进行层级标题
   - 关键概念使用 **加粗** 强调
   - 使用有序/无序列表整理要点
   - 使用 💡 🎯 ⚠️ 等图标标注重要信息
   - 使用 > 引用格式
   - 使用 | 表格对比
   - 使用代码块展示代码或公式

请生成符合${lessonFramework.type}学科特点的完整课程内容。`;
    },

    /**
     * 构建作业生成提示词
     */
    buildHomeworkPrompt(course, lessonIndex, lessonContent) {
        const dailyMinutes = this.parseTimeToMinutes(course.dailyTime);
        // 作业时间占总学习时间的 30-40%
        const homeworkMinutes = Math.round(dailyMinutes * 0.35);
        
        return `请为以下课程内容设计课后作业：

【课程主题】${course.subject}
【第 ${lessonIndex + 1} 天】${course.outline[lessonIndex]?.title || ''}
【课程内容摘要】${lessonContent.substring(0, 500)}...

作业设计要求：
1. 作业数量和时间控制：
   - 共设计 3-4 道作业题
   - 预计完成时间：${homeworkMinutes} 分钟
   - 每道题控制在 5-10 分钟内完成

2. 题目数量与类型（根据知识点密度灵活安排）：
   【总题量】5-8题，根据课程内容多少动态调整
   【选择题】占比50%以上（3-5题），每题4个选项(A/B/C/D)，考查核心概念理解
   【判断题】占比30%左右（2-3题），考查易混淆知识点
   【简答题】最多3题，每题答案50-100字，考查综合运用能力
   
   知识点密集的课程：可多安排选择题和判断题（6-8题）
   知识点较少的课程：可减少题量（4-5题），以选择题为主

3. 题目格式要求：
   【选择题】题干 + A/B/C/D四个选项 + 正确答案
   示例：哲学的核心研究对象是？A. 自然现象 B. 人类思维 C. 世界本质 D. 社会制度
   
   【判断题】陈述句形式 + 正确/错误
   示例：柏拉图是苏格拉底的学生。（正确）
   
   【简答题】明确具体的问题，避免开放式问题
   示例：简述"理念论"的核心观点。（50字以内）

4. 禁止出现的内容：
   - 不要使用"预计总完成时间"、"考查知识点"等作为题目
   - 不要出现纯说明性文字、标题、提示语
   - 每道题必须是真正的练习题，有明确的作答要求

请根据课程内容的知识点密度，灵活安排题目数量和类型分布。`;
    },

    /**
     * 评分作业
     */
    async gradeHomework(questions, answers, course, lesson) {
        const prompt = this.buildGradingPrompt(questions, answers, course, lesson);
        
        const response = await this.callAI({
            messages: [
                {
                    role: 'system',
                    content: '你是一位专业的教育评估专家，擅长客观公正地评估学生作业。请严格按照评分标准进行评估，给出具体的分数和详细的反馈。使用 JSON 格式返回结果。'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2500
        });

        // 解析评分结果
        try {
            // 尝试从响应中提取 JSON
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const result = JSON.parse(jsonMatch[0]);
                return {
                    score: result.score || 0,
                    totalScore: result.totalScore || 100,
                    details: result.details || [],
                    summary: result.summary || '',
                    suggestions: result.suggestions || [],
                    gradedAt: new Date().toISOString()
                };
            }
        } catch (e) {
            console.warn('[AI] 评分结果解析失败，使用备用评分:', e);
        }

        // 备用评分（简单的百分比计算）
        return this.calculateBackupGrade(questions, answers);
    },

    /**
     * 构建评分提示词
     */
    buildGradingPrompt(questions, answers, course, lesson) {
        // 构建题目和答案的JSON表示
        const qaPairs = questions.map((q, i) => ({
            num: i + 1,
            id: q.id,
            type: q.type,
            question: q.question,
            options: q.options || null,
            correctAnswer: q.correctAnswer || null,
            studentAnswer: answers[q.id] || '(未作答)',
            points: q.points || (100 / questions.length)
        }));

        return `请对以下作业进行评分。

【课程信息】
- 课程主题：${course.subject}
- 课程层次：${course.level}
- 第 ${lesson.day} 天：${lesson.title}

【题目和学生答案】
${JSON.stringify(qaPairs, null, 2)}

【评分要求】
1. 总分为 100 分，每题分值均等或根据难度调整
2. 选择题：答案完全正确得满分，错误得 0 分
3. 简答题：根据回答的完整性、准确性和深度评分
   - 回答完整准确：满分
   - 回答基本正确但有遗漏：得 60-80% 分数
   - 回答部分正确：得 30-50% 分数
   - 回答错误或未作答：得 0 分

【输出格式】
请使用以下 JSON 格式返回评分结果：

{\n  "score": 75,\n  "totalScore": 100,\n  "details": [\n    {\n      "questionId": "q1",\n      "questionNum": 1,\n      "correct": true,\n      "partial": false,\n      "points": 25,\n      "feedback": "回答正确，理解到位"\n    },\n    {\n      "questionId": "q2",\n      "questionNum": 2,\n      "correct": false,\n      "partial": true,\n      "points": 15,\n      "feedback": "回答部分正确，但遗漏了关键要点..."\n    }\n  ],\n  "summary": "整体表现良好，但在...方面需要加强",\n  "suggestions": [\n    "建议复习...",\n    "注意..."\n  ]\n}`;
    },

    /**
     * 计算备用评分（当AI评分失败时使用）
     */
    calculateBackupGrade(questions, answers) {
        let score = 0;
        const details = [];
        const pointsPerQuestion = 100 / questions.length;

        questions.forEach((q, index) => {
            const answer = answers[q.id];
            let isCorrect = false;
            let isPartial = false;
            let points = 0;
            let feedback = '';

            if (!answer || !answer.toString().trim()) {
                feedback = '未作答';
            } else if (q.type === 'choice') {
                // 选择题简单匹配
                isCorrect = answer === q.correctAnswer;
                points = isCorrect ? pointsPerQuestion : 0;
                feedback = isCorrect ? '回答正确' : '回答错误';
            } else {
                // 简答题：只要有内容就给部分分
                const length = answer.toString().trim().length;
                if (length > 50) {
                    isPartial = true;
                    points = pointsPerQuestion * 0.6;
                    feedback = '已作答（AI详细评分暂不可用，请查看课程解析）';
                } else {
                    points = pointsPerQuestion * 0.3;
                    feedback = '回答较简短（AI详细评分暂不可用）';
                }
            }

            score += points;
            details.push({
                questionId: q.id,
                questionNum: index + 1,
                correct: isCorrect,
                partial: isPartial,
                points: Math.round(points),
                feedback
            });
        });

        return {
            score: Math.round(score),
            totalScore: 100,
            details,
            summary: '自动评分（AI服务暂时不可用）',
            suggestions: ['建议稍后重新提交作业获取详细反馈', '可以参考课程解析自查学习效果'],
            gradedAt: new Date().toISOString()
        };
    },

    /**
     * 解析大纲响应
     */
    parseOutlineResponse(response, courseData) {
        console.log('[AI] 解析大纲响应:', response.substring(0, 500));
        
        const outline = [];
        const lines = response.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
            // 尝试匹配格式：第1天|标题|内容简介
            const match = line.match(/第?\s*(\d+)\s*[天日]?\s*[|:：]\s*(.+?)(?:\s*[|:：]\s*(.+))?$/);
            if (match) {
                const day = parseInt(match[1]);
                const title = match[2]?.trim() || `第 ${day} 天`;
                const description = match[3]?.trim() || '';
                
                outline.push({
                    day,
                    title,
                    description,
                    duration: courseData.dailyTime,
                    content: null,
                    homework: null
                });
            }
        }

        // 如果没有解析成功，尝试另一种方式
        if (outline.length === 0) {
            let dayCounter = 1;
            for (const line of lines) {
                if (line.includes('天') || line.match(/^\d+[.、]/)) {
                    const cleanLine = line.replace(/^\d+[.、]\s*/, '').replace(/^第\d+天[:：]?\s*/, '');
                    const parts = cleanLine.split(/[：:]/);
                    outline.push({
                        day: dayCounter,
                        title: parts[0]?.trim() || `第 ${dayCounter} 天`,
                        description: parts[1]?.trim() || '',
                        duration: courseData.dailyTime,
                        content: null,
                        homework: null
                    });
                    dayCounter++;
                }
            }
        }

        console.log('[AI] 解析出大纲条目数:', outline.length);
        return outline;
    },

    /**
     * 将时间字符串转换为分钟
     */
    parseTimeToMinutes(timeStr) {
        if (timeStr.includes('小时')) {
            const hours = parseFloat(timeStr);
            return Math.round(hours * 60);
        } else if (timeStr.includes('分钟')) {
            return parseInt(timeStr);
        }
        return 60;
    },

    /**
     * 检查 API 是否可用
     */
    async checkAPI() {
        try {
            const settings = Storage.getSettings();
            const apiKey = this.sanitizeApiKey(settings.aiApiKey || '');
            
            if (!apiKey) {
                return { available: false, message: '未设置 API Key' };
            }

            console.log('[AI] 检查 API 可用性...');
            
            // 发送一个简单的测试请求
            const response = await this.callAI({
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 5
            });

            console.log('[AI] API 检查成功');
            return { available: true, message: 'API 正常' };
        } catch (error) {
            console.error('[AI] API 检查失败:', error);
            return { available: false, message: error.message };
        }
    },

    /**
     * 测试 API 连接（带详细日志）
     */
    async testConnection() {
        const settings = Storage.getSettings();
        
        // 清理 API Key
        const rawKey = settings.aiApiKey || '';
        const apiKey = this.sanitizeApiKey(rawKey);
        
        const results = {
            settings: {
                provider: settings.aiProvider,
                model: settings.aiModel,
                actualModel: settings.aiModel || 'kimi-coding/k2p5',
                hasKey: !!apiKey,
                rawKeyLength: rawKey.length,
                sanitizedKeyLength: apiKey.length,
                keyPreview: apiKey ? apiKey.substring(0, 15) + '...' + apiKey.substring(apiKey.length - 4) : 'N/A',
                endpoint: settings.customEndpoint || this.ENDPOINTS[settings.aiProvider]
            },
            steps: []
        };

        // Step 1: 检查设置
        if (!apiKey) {
            results.steps.push({ step: '检查 API Key', status: '失败', message: '未设置 API Key' });
            return results;
        }
        
        // 检查 Key 格式
        if (!apiKey.startsWith('sk-')) {
            results.steps.push({ 
                step: '检查 API Key', 
                status: '警告', 
                message: `API Key 格式异常: 应该以 "sk-" 开头，当前开头: "${apiKey.substring(0, 5)}"` 
            });
        } else {
            results.steps.push({ step: '检查 API Key', status: '通过' });
        }

        // Step 2: 测试网络连接
        try {
            const endpoint = settings.customEndpoint || this.ENDPOINTS[settings.aiProvider];
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
            
            console.log('[AI] 测试连接使用 Key:', apiKey.substring(0, 15) + '...');
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: settings.aiModel || 'kimi-coding/k2p5',
                    messages: [{ role: 'user', content: 'Hi' }],
                    max_tokens: 5
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                results.steps.push({ step: 'API 连接测试', status: '通过', message: `HTTP ${response.status}` });
            } else {
                let errorMsg = `HTTP ${response.status}`;
                let errorDetail = '';
                try {
                    const err = await response.json();
                    errorMsg = err.error?.message || err.message || errorMsg;
                    errorDetail = JSON.stringify(err);
                } catch (e) {
                    errorMsg = await response.text() || errorMsg;
                }
                
                // 根据状态码提供具体建议
                let suggestion = '';
                if (response.status === 401) {
                    suggestion = 'API Key 无效或已过期，请在 Moonshot 平台重新创建';
                } else if (response.status === 429) {
                    suggestion = '请求过于频繁或账户余额不足';
                } else if (response.status === 400) {
                    suggestion = '请求参数错误，可能是模型名称不正确';
                }
                
                results.steps.push({ 
                    step: 'API 连接测试', 
                    status: '失败', 
                    message: errorMsg,
                    detail: errorDetail,
                    suggestion: suggestion
                });
            }
        } catch (error) {
            let errorMsg = error.message;
            let suggestion = '';
            let detail = '';
            
            if (error.name === 'AbortError') {
                errorMsg = '请求超时（10秒）';
                suggestion = '网络连接缓慢或 API 服务响应慢';
            } else if (errorMsg.includes('Failed to fetch')) {
                errorMsg = '网络请求失败 (CORS 或网络问题)';
                suggestion = '请确保通过 http://localhost:8080 访问，而不是直接从文件打开';
                detail = `当前页面协议: ${window.location.protocol}, 主机: ${window.location.host}`;
            } else {
                detail = `错误类型: ${error.name}, 完整信息: ${error.toString()}`;
            }
            
            results.steps.push({ 
                step: 'API 连接测试', 
                status: '失败', 
                message: errorMsg,
                suggestion: suggestion,
                detail: detail
            });
        }

        return results;
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIService;
}
