/**
 * 主应用模块
 * 处理所有页面交互和逻辑
 */

const app = {
    // 当前状态
    state: {
        currentCourse: null,
        currentLessonIndex: 0,
        generatingCourse: null
    },
    
    // 标记 app 已加载
    _loaded: console.log('[App] app.js 已加载'),

    /**
     * 更新导航栏用户状态
     */
    updateNavUser() {
        const currentUser = Storage.getCurrentUser();
        const loginBtn = document.getElementById('userLoginBtn');
        const userMenu = document.getElementById('userMenu');
        const navUserName = document.getElementById('navUserName');
        
        if (!loginBtn || !userMenu) return;
        
        if (currentUser) {
            loginBtn.style.display = 'none';
            userMenu.style.display = 'flex';
            if (navUserName) navUserName.textContent = currentUser.username;
        } else {
            loginBtn.style.display = 'inline-flex';
            userMenu.style.display = 'none';
        }
    },

    /**
     * 初始化首页
     */
    initHomePage() {
        this.updateStats();
        this.loadContinueLearning();
        this.loadRecentCourses();
        this.checkAIStatus();
        this.loadSampleCourses();
    },

    /**
     * 加载示例课程（预先生成的体验课程）
     */
    loadSampleCourses() {
        const courses = Storage.getCourses();
        const sampleSection = document.getElementById('sampleCoursesSection');
        const sampleList = document.getElementById('sampleCoursesList');
        
        if (!sampleList) return;

        // 如果没有课程，自动创建示例课程
        if (courses.length === 0) {
            this.createSampleCoursesSilently();
            return;
        }

        // 隐藏示例课程区域（已有课程则不显示）
        if (courses.length > 0 && sampleSection) {
            sampleSection.style.display = 'none';
        }
    },

    /**
     * 静默创建示例课程（不弹出确认框）
     */
    async createSampleCoursesSilently() {
        const samples = [
            {
                subject: '批判性思维入门',
                category: 'humanities',
                subjectType: '人文社科',
                level: '初级',
                duration: '7天',
                dailyTime: '1小时',
                description: '学习如何识别逻辑谬误、分析论证结构、形成理性判断',
                includeHomework: true
            },
            {
                subject: '摄影后期处理',
                category: 'practical',
                subjectType: '技能实践',
                level: '中级',
                duration: '7天',
                dailyTime: '1小时',
                description: '掌握Lightroom调色技巧、人像精修、风光后期',
                includeHomework: true
            },
            {
                subject: 'Python编程入门',
                category: 'science',
                subjectType: '理工科',
                level: '初级',
                duration: '7天',
                dailyTime: '1小时',
                description: '从零开始学习Python基础语法、数据结构和简单项目',
                includeHomework: true
            },
            {
                subject: '商务英语口语',
                category: 'language',
                subjectType: '语言学习',
                level: '中级',
                duration: '7天',
                dailyTime: '1小时',
                description: '提升商务场景英语交流能力，包括会议、谈判、演讲',
                includeHomework: true
            }
        ];

        const sampleList = document.getElementById('sampleCoursesList');
        if (sampleList) {
            sampleList.innerHTML = '<div class="loading">正在准备体验课程...</div>';
        }

        let created = 0;
        const createdCourses = [];

        for (const sample of samples) {
            try {
                // 生成课程大纲
                const outlineResult = await AIService.generateCourseOutline({
                    subject: sample.subject,
                    level: sample.level,
                    duration: sample.duration,
                    dailyTime: sample.dailyTime,
                    description: sample.description
                });

                // 创建课程对象
                const course = {
                    id: this.generateId(),
                    ...sample,
                    outline: outlineResult.outline || this.createDefaultOutline(sample),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // 保存课程
                Storage.saveCourse(course);
                createdCourses.push(course);
                created++;

            } catch (error) {
                console.error(`创建示例课程失败 ${sample.subject}:`, error);
                
                // 失败时使用默认大纲
                const course = {
                    id: this.generateId(),
                    ...sample,
                    outline: this.createDefaultOutline(sample),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                Storage.saveCourse(course);
                createdCourses.push(course);
                created++;
            }
        }

        // 渲染示例课程到体验课程区域
        this.renderSampleCourses(createdCourses);
        this.updateStats();
    },

    /**
     * 渲染示例课程卡片
     */
    renderSampleCourses(courses) {
        const sampleList = document.getElementById('sampleCoursesList');
        if (!sampleList) return;

        if (courses.length === 0) {
            sampleList.innerHTML = '<div class="empty-state">暂无体验课程</div>';
            return;
        }

        const icons = {
            humanities: '🎓',
            practical: '📷',
            science: '💻',
            language: '🌍',
            business: '💼',
            art: '🎨'
        };

        const colors = {
            humanities: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            practical: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            science: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            language: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
            business: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
            art: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)'
        };

        sampleList.innerHTML = courses.map(course => {
            const icon = icons[course.category] || '📚';
            const color = colors[course.category] || 'linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%)';
            
            return `
                <div class="course-card" onclick="app.openCourse('${course.id}')">
                    <div class="course-cover" style="background: ${color};">
                        <span style="font-size: 48px;">${icon}</span>
                    </div>
                    <div class="course-info">
                        <h3>${course.subject}</h3>
                        <p>🔰 第1课：${course.outline[0]?.title || '课程介绍'}</p>
                        <div class="course-meta-row">
                            <span class="course-tag">${course.level}</span>
                            <span class="course-tag">${course.duration}</span>
                            <span class="course-tag" style="background: #dbeafe; color: #2563eb;">体验</span>
                        </div>
                        <div class="course-progress-row">
                            <div class="progress-bar-sm">
                                <div class="progress-fill" style="width: 0%"></div>
                            </div>
                            <div class="progress-text-sm">未开始</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 更新统计信息
     */
    updateStats() {
        const stats = Storage.getStatistics();
        document.getElementById('totalCourses').textContent = stats.totalCourses;
        document.getElementById('completedLessons').textContent = stats.completedLessons;
        document.getElementById('studyStreak').textContent = stats.studyStreak;
        document.getElementById('totalHours').textContent = stats.totalStudyTime;
    },

    /**
     * 加载继续学习列表
     */
    loadContinueLearning() {
        const courses = Storage.getCourses();
        const container = document.getElementById('continueLearningList');
        
        // 找到有进度的课程（已经开始学习或有完成记录）
        const activeCourses = courses.filter(course => {
            const progress = Storage.getProgress(course.id);
            // 课程有进度：有完成章节 或 当前章节大于0 或 有学习记录
            const hasProgress = progress.completedLessons?.length > 0 || 
                               progress.currentLesson > 0 ||
                               progress.lastStudyDate;
            // 且课程未完成（当前章节小于总章节）
            const notCompleted = progress.currentLesson < (course.outline?.length || 0);
            return hasProgress && notCompleted;
        }).slice(0, 3);

        // 如果没有有进度的课程，显示最近创建的课程（最多3门）
        if (activeCourses.length === 0) {
            const recentCourses = courses.slice(0, 3);
            
            if (recentCourses.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="empty-icon">📖</span>
                        <h3>还没有课程</h3>
                        <p>创建你的第一门课程，开始学习之旅</p>
                        <a href="create-course.html" class="btn btn-primary">创建课程</a>
                    </div>
                `;
                return;
            }
            
            // 显示最近创建的课程，标记为"新创建"
            container.innerHTML = recentCourses.map(course => {
                const progress = Storage.getProgress(course.id);
                const percent = course.outline?.length 
                    ? Math.round((progress.completedLessons.length / course.outline.length) * 100)
                    : 0;
                const currentLesson = course.outline?.[progress.currentLesson] || course.outline?.[0];
                const isNew = !progress.lastStudyDate && progress.completedLessons?.length === 0;
                
                return `
                    <div class="course-card" onclick="app.openCourse('${course.id}')">
                        <div class="course-cover" style="background: linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%);">
                            <span style="font-size: 48px;">📚</span>
                        </div>
                        <div class="course-info">
                            <h3>${course.subject}</h3>
                            <p>${isNew ? '🔰 新课程，点击开始学习' : (currentLesson?.title || '第1课')}</p>
                            <div class="course-meta-row">
                                <span class="course-tag">${course.level}</span>
                                <span class="course-tag">${course.duration}</span>
                            </div>
                            <div class="course-progress-row">
                                <div class="progress-bar-sm">
                                    <div class="progress-fill" style="width: ${percent}%"></div>
                                </div>
                                <div class="progress-text-sm">${percent}% 已完成</div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            return;
        }

        container.innerHTML = activeCourses.map(course => {
            const progress = Storage.getProgress(course.id);
            const percent = course.outline?.length 
                ? Math.round((progress.completedLessons.length / course.outline.length) * 100)
                : 0;
            const currentLesson = course.outline?.[progress.currentLesson] || course.outline?.[0];
            
            return `
                <div class="course-card" onclick="app.openCourse('${course.id}')">
                    <div class="course-cover" style="background: linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%);">
                        <span style="font-size: 48px;">📚</span>
                    </div>
                    <div class="course-info">
                        <h3>${course.subject}</h3>
                        <p>📖 ${currentLesson?.title || '第1课'}</p>
                        <div class="course-meta-row">
                            <span class="course-tag">${course.level}</span>
                            <span class="course-tag">${course.duration}</span>
                        </div>
                        <div class="course-progress-row">
                            <div class="progress-bar-sm">
                                <div class="progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <div class="progress-text-sm">${percent}% 已完成</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 加载最近课程
     */
    loadRecentCourses() {
        const courses = Storage.getCourses();
        const container = document.getElementById('recentCoursesList');
        
        if (courses.length === 0) {
            document.getElementById('recentSection').style.display = 'none';
            return;
        }

        const recentCourses = courses.slice(-5).reverse();
        
        container.innerHTML = recentCourses.map(course => {
            const progress = Storage.getProgress(course.id);
            const percent = course.outline?.length 
                ? Math.round((progress.completedLessons.length / course.outline.length) * 100)
                : 0;
            
            return `
                <div class="course-list-item" onclick="app.openCourse('${course.id}')">
                    <div class="course-list-icon" style="background: linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%);">
                        📚
                    </div>
                    <div class="course-list-info">
                        <h4>${course.subject}</h4>
                        <p>${course.level} · ${course.duration} · ${course.dailyTime}/天</p>
                    </div>
                    <div class="course-list-meta">
                        <div class="course-list-progress">
                            <span class="progress-percent">${percent}%</span>
                            <span class="progress-label">已完成</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 检查 AI 状态
     */
    async checkAIStatus() {
        const statusEl = document.getElementById('aiStatus');
        if (!statusEl) return;
        
        const settings = Storage.getSettings();
        
        if (!settings.aiApiKey) {
            statusEl.textContent = '⚠️ 未设置 API Key';
            statusEl.classList.add('error');
            return;
        }

        statusEl.textContent = '🟢 AI 就绪';
    },

    /**
     * 初始化创建课程页面
     */
    initCreatePage() {
        this.checkAIStatus();
        
        // 检查 URL 参数
        const urlParams = new URLSearchParams(window.location.search);
        const template = urlParams.get('template');
        
        if (template) {
            const templateMap = {
                'philosophy': '哲学',
                'programming': 'Python编程',
                'history': '世界历史',
                'art': '艺术设计',
                'science': '科学',
                'language': '英语学习'
            };
            document.getElementById('courseSubject').value = templateMap[template] || '';
        }

        // 绑定表单提交
        document.getElementById('createCourseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCreateCourse();
        });
    },

    /**
     * 处理创建课程
     */
    async handleCreateCourse() {
        const settings = Storage.getSettings();
        if (!settings.aiApiKey) {
            alert('请先设置 AI API Key');
            window.location.href = 'settings.html';
            return;
        }

        // 获取提交按钮并禁用，防止重复提交
        const submitBtn = document.querySelector('#createCourseForm button[type="submit"]');
        const originalBtnText = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span class="btn-spinner"></span> 正在生成中...';
        }

        const courseData = {
            subject: document.getElementById('courseSubject').value,
            level: document.getElementById('courseLevel').value,
            language: document.getElementById('courseLanguage').value,
            duration: document.getElementById('courseDuration').value,
            dailyTime: document.getElementById('dailyTime').value,
            goals: document.getElementById('courseGoals').value,
            focus: document.getElementById('courseFocus').value,
            includeHomework: document.getElementById('includeHomework').checked
        };

        // 显示生成中弹窗
        this.showModal('generatingModal');
        this.updateGeneratingStatus('正在分析学习目标...');

        try {
            // 生成大纲
            this.updateGeneratingStatus('正在生成课程大纲...');
            const outline = await AIService.generateCourseOutline(courseData);

            if (!outline || outline.length === 0) {
                throw new Error('大纲生成失败');
            }

            // 创建课程对象
            const course = {
                id: this.generateId(),
                subject: courseData.subject,
                level: courseData.level,
                language: courseData.language,
                duration: courseData.duration,
                dailyTime: courseData.dailyTime,
                goals: courseData.goals,
                focus: courseData.focus,
                includeHomework: courseData.includeHomework,
                outline: outline,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            // 保存课程
            Storage.saveCourse(course);
            
            // 初始化进度
            const progress = Storage.getDefaultProgress();
            progress.startDate = new Date().toISOString();
            Storage.saveProgress(course.id, progress);

            this.closeModal('generatingModal');
            
            // 跳转到课程详情页
            window.location.href = `course-detail.html?id=${course.id}`;

        } catch (error) {
            this.closeModal('generatingModal');
            
            // 恢复提交按钮状态
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
            
            // 提供更详细的错误提示
            let errorMsg = error.message;
            if (errorMsg.includes('Failed to fetch') || errorMsg.includes('CORS')) {
                errorMsg += '\n\n解决方法：\n1. 双击运行 start-server.py\n2. 访问 http://localhost:8080\n3. 重新尝试创建课程';
            }
            
            alert('课程生成失败: ' + errorMsg);
            console.error(error);
        }
    },

    /**
     * 更新生成状态
     */
    updateGeneratingStatus(status) {
        const el = document.getElementById('generatingStatus');
        if (el) el.textContent = status;
    },

    /**
     * 初始化课程列表页面
     */
    initCoursesPage() {
        this.checkAIStatus();
        this.loadCoursesList('all');
        
        // 绑定筛选按钮
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.loadCoursesList(btn.dataset.filter);
            });
        });

        // 绑定搜索
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchCourses(e.target.value);
            });
        }
    },

    /**
     * 加载课程列表
     */
    loadCoursesList(filter = 'all') {
        const courses = Storage.getCourses();
        const container = document.getElementById('coursesGrid');
        const emptyState = document.getElementById('emptyState');
        
        let filteredCourses = courses;
        
        if (filter !== 'all') {
            filteredCourses = courses.filter(course => {
                const progress = Storage.getProgress(course.id);
                const percent = course.outline?.length 
                    ? (progress.completedLessons.length / course.outline.length)
                    : 0;
                
                if (filter === 'completed') return percent >= 1;
                if (filter === 'active') return percent > 0 && percent < 1;
                if (filter === 'not-started') return percent === 0;
                return true;
            });
        }

        if (filteredCourses.length === 0) {
            container.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        
        container.innerHTML = filteredCourses.map(course => {
            const progress = Storage.getProgress(course.id);
            const percent = course.outline?.length 
                ? Math.round((progress.completedLessons.length / course.outline.length) * 100)
                : 0;
            
            return `
                <div class="course-card" onclick="app.openCourse('${course.id}')">
                    <div class="course-cover" style="background: linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%);">
                        <span style="font-size: 48px;">📚</span>
                    </div>
                    <div class="course-info">
                        <h3>${course.subject}</h3>
                        <p>${course.level} · ${course.duration}</p>
                        <div class="course-meta-row">
                            <span class="course-tag">${course.dailyTime}/天</span>
                            ${course.includeHomework ? '<span class="course-tag">含作业</span>' : ''}
                        </div>
                        <div class="course-progress-row">
                            <div class="progress-bar-sm">
                                <div class="progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <div class="progress-text-sm">${percent}% 已完成 · ${progress.completedLessons.length}/${course.outline?.length || 0} 课</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 搜索课程
     */
    searchCourses(keyword) {
        if (!keyword) {
            this.loadCoursesList('all');
            return;
        }

        const courses = Storage.getCourses();
        const filtered = courses.filter(course => 
            course.subject.toLowerCase().includes(keyword.toLowerCase()) ||
            course.level.toLowerCase().includes(keyword.toLowerCase())
        );

        const container = document.getElementById('coursesGrid');
        if (filtered.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>没有找到匹配的课程</p></div>';
            return;
        }

        container.innerHTML = filtered.map(course => {
            const progress = Storage.getProgress(course.id);
            const percent = course.outline?.length 
                ? Math.round((progress.completedLessons.length / course.outline.length) * 100)
                : 0;
            
            return `
                <div class="course-card" onclick="app.openCourse('${course.id}')">
                    <div class="course-cover" style="background: linear-gradient(135deg, var(--primary-color) 0%, #7c3aed 100%);">
                        <span style="font-size: 48px;">📚</span>
                    </div>
                    <div class="course-info">
                        <h3>${course.subject}</h3>
                        <p>${course.level} · ${course.duration}</p>
                        <div class="course-meta-row">
                            <span class="course-tag">${course.dailyTime}/天</span>
                        </div>
                        <div class="course-progress-row">
                            <div class="progress-bar-sm">
                                <div class="progress-fill" style="width: ${percent}%"></div>
                            </div>
                            <div class="progress-text-sm">${percent}% 已完成</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    },

    /**
     * 初始化课程详情页
     */
    initCourseDetailPage() {
        this.checkAIStatus();
        
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('id');
        
        if (!courseId) {
            window.location.href = 'courses.html';
            return;
        }

        const course = Storage.getCourse(courseId);
        if (!course) {
            alert('课程不存在');
            window.location.href = 'courses.html';
            return;
        }

        this.state.currentCourse = course;
        this.renderCourseDetail(course);
    },

    /**
     * 渲染课程详情
     */
    renderCourseDetail(course) {
        const progress = Storage.getProgress(course.id);
        const totalLessons = course.outline?.length || 0;
        const completedCount = progress.completedLessons.length;
        const percent = totalLessons ? Math.round((completedCount / totalLessons) * 100) : 0;

        // 面包屑和基本信息
        document.getElementById('breadcrumbCourseName').textContent = course.subject;
        document.getElementById('courseTitle').textContent = course.subject;
        document.getElementById('courseDescription').textContent = 
            course.description || `${course.level}水平的${course.subject}课程，为期${course.duration}。`;
        
        // 标签
        document.getElementById('courseTags').innerHTML = `
            <span class="tag primary">${course.level}</span>
            <span class="tag">${course.duration}</span>
            <span class="tag">${course.dailyTime}/天</span>
            <span class="tag">${course.language || '中文'}</span>
            ${course.includeHomework ? '<span class="tag">含作业</span>' : ''}
        `;

        // 统计栏
        document.getElementById('courseLevel').textContent = course.level;
        document.getElementById('totalLessons').textContent = totalLessons + ' 课';
        document.getElementById('dailyTime').textContent = course.dailyTime;
        document.getElementById('createTime').textContent = 
            new Date(course.createdAt).toLocaleDateString('zh-CN');

        // 进度圆环
        document.getElementById('progressPercent').textContent = percent + '%';
        document.getElementById('progressCircleBar').style.strokeDashoffset = 
            283 - (283 * percent / 100);
        
        // 进度统计
        document.getElementById('completedCount').textContent = completedCount;
        document.getElementById('inProgressCount').textContent = 
            (progress.currentLesson > completedCount) ? 1 : 0;
        document.getElementById('notStartedCount').textContent = 
            totalLessons - completedCount - ((progress.currentLesson > completedCount) ? 1 : 0);

        // 预计学习时间
        const dailyMinutes = this.parseTimeToMinutes(course.dailyTime);
        const estimatedHours = Math.round((totalLessons * dailyMinutes) / 60 * 10) / 10;
        document.getElementById('estimatedTime').textContent = estimatedHours + ' 小时';
        document.getElementById('actualTime').textContent = 
            Math.round((progress.totalStudyTime || 0) / 60 * 10) / 10 + ' 小时';

        // 下一课
        const nextLessonIndex = progress.currentLesson || 0;
        const nextLesson = course.outline?.[nextLessonIndex];
        if (nextLesson) {
            document.getElementById('nextLessonTitle').textContent = nextLesson.title;
            document.getElementById('nextLessonDesc').textContent = 
                nextLesson.description || '点击开始学习这节课程';
        }

        // 大纲列表
        this.renderOutlineList(course, progress);
    },

    /**
     * 渲染大纲列表
     */
    renderOutlineList(course, progress) {
        const container = document.getElementById('outlineList');
        
        if (!course.outline || course.outline.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>暂无大纲</p></div>';
            return;
        }

        container.innerHTML = course.outline.map((lesson, index) => {
            const isCompleted = progress.completedLessons.includes(index);
            const isCurrent = index === progress.currentLesson;
            const statusClass = isCompleted ? 'completed' : (isCurrent ? 'in-progress' : 'not-started');
            const statusIcon = isCompleted ? '✓' : (isCurrent ? '▶' : (index + 1));

            return `
                <div class="outline-item ${statusClass}" onclick="app.startLesson(${index})">
                    <div class="outline-status ${statusClass}">${statusIcon}</div>
                    <div class="outline-content">
                        <div class="outline-day">第 ${lesson.day} 天</div>
                        <div class="outline-title">${lesson.title}</div>
                        <div class="outline-desc">${lesson.description || ''}</div>
                    </div>
                    <div class="outline-duration">${lesson.duration || course.dailyTime}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * 初始化学习页面
     */
    async initStudyPage() {
        this.checkAIStatus();
        
        const urlParams = new URLSearchParams(window.location.search);
        const courseId = urlParams.get('course');
        const lessonIndex = parseInt(urlParams.get('lesson') || '0');
        
        if (!courseId) {
            window.location.href = 'courses.html';
            return;
        }

        const course = Storage.getCourse(courseId);
        if (!course || !course.outline) {
            alert('课程不存在');
            window.location.href = 'courses.html';
            return;
        }

        this.state.currentCourse = course;
        this.state.currentLessonIndex = lessonIndex;

        // 渲染大纲面板
        this.renderOutlinePanel(course);
        
        // 初始化面板切换按钮状态
        this.initPanelToggleButtons();

        // 加载课程内容
        await this.loadLessonContent(course, lessonIndex);
    },

    /**
     * 渲染大纲面板
     */
    renderOutlinePanel(course) {
        const progress = Storage.getProgress(course.id);
        const container = document.getElementById('outlinePanelContent');
        
        container.innerHTML = course.outline.map((lesson, index) => {
            const isCompleted = progress.completedLessons.includes(index);
            const isCurrent = index === this.state.currentLessonIndex;
            const statusClass = isCompleted ? 'completed' : (isCurrent ? 'active' : '');
            const statusIcon = isCompleted ? '✓' : '';

            return `
                <div class="outline-panel-item ${statusClass}" onclick="app.goToLesson(${index})">
                    <div class="panel-item-status ${isCompleted ? 'completed' : (isCurrent ? 'in-progress' : 'not-started')}">
                        ${statusIcon || (index + 1)}
                    </div>
                    <div class="panel-item-title">${lesson.title}</div>
                </div>
            `;
        }).join('');
    },

    /**
     * 加载课程内容
     */
    async loadLessonContent(course, lessonIndex) {
        const lesson = course.outline[lessonIndex];
        const progress = Storage.getProgress(course.id);
        
        // 更新导航
        document.getElementById('navCourseName').textContent = course.subject;
        document.getElementById('navLessonName').textContent = lesson.title;
        document.getElementById('currentLessonNum').textContent = lessonIndex + 1;
        document.getElementById('totalLessonNum').textContent = course.outline.length;
        
        // 更新按钮状态
        document.getElementById('prevLessonBtn').disabled = lessonIndex === 0;
        document.getElementById('nextLessonBtn').disabled = lessonIndex === course.outline.length - 1;
        document.getElementById('prevLessonBottomBtn').disabled = lessonIndex === 0;
        document.getElementById('nextLessonBottomBtn').disabled = lessonIndex === course.outline.length - 1;

        // 更新课程头部
        document.getElementById('lessonDayBadge').textContent = `第 ${lesson.day} 天`;
        document.getElementById('lessonTitle').textContent = lesson.title;
        
        // 计算总学习时间（课程内容 + 作业）
        const dailyMinutes = this.parseTimeToMinutes(course.dailyTime);
        const contentMinutes = Math.round(dailyMinutes * 1.5); // 课程内容时间
        const homeworkMinutes = Math.round(dailyMinutes * 0.35); // 作业时间
        const totalMinutes = contentMinutes + homeworkMinutes;
        
        let timeDisplay = '';
        if (totalMinutes >= 60) {
            const hours = Math.floor(totalMinutes / 60);
            const mins = totalMinutes % 60;
            timeDisplay = mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
        } else {
            timeDisplay = `${totalMinutes}分钟`;
        }
        
        document.getElementById('lessonDuration').textContent = `⏱️ 约 ${timeDisplay}（内容${contentMinutes}分钟 + 作业${homeworkMinutes}分钟）`;
        
        const isCompleted = progress.completedLessons.includes(lessonIndex);
        document.getElementById('lessonStatus').textContent = isCompleted ? '✅ 已完成' : '🟡 未开始';
        
        // 更新完成按钮状态
        const markBtn = document.getElementById('markCompleteBtn');
        if (markBtn) {
            markBtn.textContent = isCompleted ? '✓ 本节课已完成' : '✅ 标记本节课完成';
            markBtn.disabled = isCompleted;
        }

        // 加载或生成内容
        const contentEl = document.getElementById('lessonContent');
        contentEl.innerHTML = '<div class="loading">正在准备课程内容，请稍候...</div>';

        try {
            let content = lesson.content;
            
            if (!content) {
                // 生成内容
                const result = await AIService.generateLessonContent(course, lessonIndex);
                content = result.content;
                
                // 保存到课程
                course.outline[lessonIndex].content = content;
                Storage.saveCourse(course);
            }
            
            contentEl.innerHTML = this.markdownToHtml(content);
            
            // 移除课程内容中的阅读进度指示器（如"0%"等）
            this.removeProgressIndicators(contentEl);
            
            // 添加代码复制按钮
            this.addCodeCopyButtons(contentEl);
            
            // 初始化阅读进度监听
            this.initReadingProgress();
        } catch (error) {
            contentEl.innerHTML = `<div class="error">加载失败: ${error.message}</div>`;
        }

        // 加载作业
        const homeworkSection = document.getElementById('homeworkSection');
        if (course.includeHomework) {
            if (homeworkSection) homeworkSection.style.display = 'block';
            await this.loadHomework(course, lessonIndex);
        } else {
            if (homeworkSection) homeworkSection.style.display = 'none';
        }

        // 更新进度条
        const progressPercent = Math.round(((lessonIndex + 1) / course.outline.length) * 100);
        document.getElementById('studyProgressFill').style.width = progressPercent + '%';
        document.getElementById('studyProgressText').textContent = progressPercent + '%';

        // 加载笔记
        const notes = Storage.getNotes(course.id, lessonIndex);
        document.getElementById('lessonNotes').value = notes;

        // 更新进度
        if (progress.currentLesson < lessonIndex) {
            progress.currentLesson = lessonIndex;
            Storage.saveProgress(course.id, progress);
        }
    },

    /**
     * 加载作业 - 新版交互式作业
     */
    async loadHomework(course, lessonIndex) {
        const lesson = course.outline[lessonIndex];
        const progress = Storage.getProgress(course.id);
        const homeworkEl = document.getElementById('homeworkBody');
        
        // 获取作业数据（可能是旧格式或新格式）
        let homework = lesson.homework;
        
        // 检查是否有已保存的答案
        const savedAnswers = Storage.getHomeworkAnswers(course.id, lessonIndex);
        const gradingResult = Storage.getHomeworkGrading(course.id, lessonIndex);
        
        // 如果没有作业数据或作业是旧格式（纯文本），生成新的结构化作业
        if (!homework || typeof homework === 'string') {
            homeworkEl.innerHTML = '<div class="loading">正在生成作业...</div>';
            try {
                const result = await AIService.generateHomework(course, lessonIndex, lesson.content || '');
                // 尝试解析为结构化数据
                homework = this.parseHomeworkToStructured(result.content || result);
                
                // 保存到课程
                course.outline[lessonIndex].homework = homework;
                Storage.saveCourse(course);
            } catch (error) {
                homeworkEl.innerHTML = `<div class="error">生成作业失败: ${error.message}</div>`;
                return;
            }
        }
        
        // 渲染交互式作业
        this.renderInteractiveHomework(homework, savedAnswers, gradingResult);
        
        // 更新作业状态UI
        this.updateHomeworkStatusUI(progress, lessonIndex, gradingResult);
    },

    /**
     * 将作业内容解析为结构化数据 - 改进版
     * 规则：简答题最多3道，以选择题和判断题为主，总题量4-8题灵活安排
     */
    parseHomeworkToStructured(content) {
        // 如果是字符串，尝试解析其中的题目
        if (typeof content === 'string') {
            const questions = [];
            
            // 过滤掉非题目行（标题、说明、时间等）
            const skipPatterns = [
                /^预计总完成时间/i,
                /^考查知识点/i,
                /^作业要求/i,
                /^注意事项/i,
                /^参考答案/i,
                /^解析/i,
                /^[#【\[]/,
                /^(作业设计|题目类型|格式要求|内容质量|根据|请|以下)/i,
                /^\s*$/
            ];
            
            // 1. 解析选择题（A. B. C. D. 格式）- 优先解析，数量不限
            const choiceRegex = /(\d+)[.．、\s]*([^\n]+?)\n\s*A[.．、\s]*([^\n]+)\n\s*B[.．、\s]*([^\n]+)\n\s*C[.．、\s]*([^\n]+)\n\s*D[.．、\s]*([^\n]+)/gi;
            let match;
            while ((match = choiceRegex.exec(content)) !== null) {
                const questionText = match[2].trim();
                if (this.isInvalidQuestion(questionText, skipPatterns)) continue;
                
                // 去重检查
                const isDuplicate = questions.some(q => 
                    q.question.substring(0, 20) === questionText.substring(0, 20)
                );
                if (isDuplicate) continue;
                
                questions.push({
                    id: `q${questions.length + 1}`,
                    type: 'choice',
                    question: questionText,
                    options: [
                        { key: 'A', text: match[3].trim() },
                        { key: 'B', text: match[4].trim() },
                        { key: 'C', text: match[5].trim() },
                        { key: 'D', text: match[6].trim() }
                    ],
                    correctAnswer: null
                });
            }
            
            // 2. 解析判断题 - 从剩余内容中匹配
            const contentWithoutChoices = content.replace(choiceRegex, '');
            const trueFalsePatterns = [
                /(\d+)[.．、\s]*([^.。\n]{10,80}[。\.])\s*[(（]\s*(正确|错误|对|错|是|否)\s*[)）]/gi,
                /(\d+)[.．、\s]*([^.。\n]{10,80}[。\.])/gi
            ];
            
            for (const tfRegex of trueFalsePatterns) {
                let tfMatch;
                while ((tfMatch = tfRegex.exec(contentWithoutChoices)) !== null) {
                    const questionText = tfMatch[2].trim();
                    if (this.isInvalidQuestion(questionText, skipPatterns)) continue;
                    
                    // 判断题特征：陈述句，不含问号，长度适中
                    if (questionText.length < 15 || questionText.length > 100) continue;
                    if (questionText.includes('？') || questionText.includes('?')) continue;
                    
                    // 去重检查
                    const isDuplicate = questions.some(q => 
                        q.question.substring(0, 20) === questionText.substring(0, 20)
                    );
                    if (isDuplicate) continue;
                    
                    questions.push({
                        id: `q${questions.length + 1}`,
                        type: 'truefalse',
                        question: questionText,
                        options: [
                            { key: 'T', text: '正确' },
                            { key: 'F', text: '错误' }
                        ],
                        correctAnswer: null
                    });
                }
            }
            
            // 3. 解析简答题 - 最多3题
            let textQuestionCount = 0;
            const maxTextQuestions = 3;
            const textRegex = /(\d+)[.．、\s]*([^\n]{10,100}[?？])/g;
            let textMatch;
            
            while ((textMatch = textRegex.exec(content)) !== null && textQuestionCount < maxTextQuestions) {
                const questionText = textMatch[2].trim();
                if (this.isInvalidQuestion(questionText, skipPatterns)) continue;
                
                // 去重检查
                const isDuplicate = questions.some(q => 
                    q.question.substring(0, 20) === questionText.substring(0, 20)
                );
                if (isDuplicate) continue;
                
                questions.push({
                    id: `q${questions.length + 1}`,
                    type: 'text',
                    question: questionText,
                    placeholder: '请输入你的回答（50-100字）...'
                });
                textQuestionCount++;
            }
            
            // 限制总题目数量在4-8题之间（根据知识点密度灵活调整）
            const finalQuestions = questions.slice(0, 8);
            
            // 如果没有解析出任何题目，创建默认题目
            if (finalQuestions.length === 0) {
                return this.createDefaultHomework();
            }
            
            return { questions: finalQuestions };
        }
        
        return content;
    },

    /**
     * 检查是否为无效题目
     */
    isInvalidQuestion(text, patterns) {
        if (!text || text.length < 10) return true;
        // 检查是否匹配任何跳过模式
        return patterns.some(pattern => pattern.test(text));
    },

    /**
     * 创建默认作业（当解析失败时使用）
     * 示例：3道选择题 + 2道判断题 + 1道简答题
     */
    createDefaultHomework() {
        return {
            questions: [
                {
                    id: 'q1',
                    type: 'choice',
                    question: '本节课的核心概念是什么？',
                    options: [
                        { key: 'A', text: '基础理论' },
                        { key: 'B', text: '实践方法' },
                        { key: 'C', text: '应用技巧' },
                        { key: 'D', text: '综合案例' }
                    ]
                },
                {
                    id: 'q2',
                    type: 'choice',
                    question: '以下哪项是本节课介绍的关键方法？',
                    options: [
                        { key: 'A', text: '分析方法A' },
                        { key: 'B', text: '分析方法B' },
                        { key: 'C', text: '分析方法C' },
                        { key: 'D', text: '分析方法D' }
                    ]
                },
                {
                    id: 'q3',
                    type: 'choice',
                    question: '这种方法最适合解决什么问题？',
                    options: [
                        { key: 'A', text: '复杂问题' },
                        { key: 'B', text: '简单问题' },
                        { key: 'C', text: '技术问题' },
                        { key: 'D', text: '管理问题' }
                    ]
                },
                {
                    id: 'q4',
                    type: 'truefalse',
                    question: '本节课介绍的方法是该领域最常用的方法之一。',
                    options: [
                        { key: 'T', text: '正确' },
                        { key: 'F', text: '错误' }
                    ]
                },
                {
                    id: 'q5',
                    type: 'truefalse',
                    question: '这种方法只适用于特定场景，不能推广到其他领域。',
                    options: [
                        { key: 'T', text: '正确' },
                        { key: 'F', text: '错误' }
                    ]
                },
                {
                    id: 'q6',
                    type: 'text',
                    question: '简述本节课所学方法的核心步骤。',
                    placeholder: '请简要回答（50-100字）...'
                }
            ]
        };
    },

    /**
     * 渲染交互式作业
     */
    renderInteractiveHomework(homework, savedAnswers = {}, gradingResult = null) {
        const homeworkEl = document.getElementById('homeworkBody');
        const questions = homework.questions || [];
        
        if (questions.length === 0) {
            homeworkEl.innerHTML = '<div class="empty-state">暂无作业题目</div>';
            return;
        }
        
        const isGraded = !!gradingResult;
        const isViewingAnswers = this.state?.viewingAnswers || false;
        
        homeworkEl.innerHTML = questions.map((q, index) => {
            const answer = savedAnswers[q.id];
            const qGrading = gradingResult?.details?.find(d => d.questionId === q.id);
            
            if (q.type === 'choice' || q.type === 'truefalse') {
                return this.renderChoiceQuestion(q, index, answer, qGrading, isViewingAnswers);
            } else {
                return this.renderTextQuestion(q, index, answer, qGrading, isViewingAnswers);
            }
        }).join('');
        
        // 更新进度显示
        this.updateHomeworkProgress(questions, savedAnswers);
    },

    /**
     * 渲染选择题/判断题
     */
    renderChoiceQuestion(q, index, answer, grading, showAnswer) {
        const statusClass = grading ? (grading.correct ? 'completed' : 'incorrect') : '';
        const typeLabel = q.type === 'truefalse' ? '判断题' : '选择题';
        
        return `
            <div class="homework-question ${statusClass}" data-question-id="${q.id}">
                <div class="question-header">
                    <span class="question-number">${index + 1}</span>
                    <span class="question-text">${this.escapeHtml(q.question)}</span>
                    <span class="question-type">${typeLabel}</span>
                </div>
                <div class="question-options">
                    ${q.options.map(opt => {
                        let optClass = '';
                        if (answer === opt.key) optClass = 'selected';
                        if (showAnswer) {
                            if (opt.key === q.correctAnswer) optClass = 'correct';
                            else if (answer === opt.key && answer !== q.correctAnswer) optClass = 'wrong';
                        } else if (grading) {
                            if (grading.correct && opt.key === answer) optClass = 'correct';
                            else if (!grading.correct && opt.key === answer) optClass = 'wrong';
                        }
                        
                        const disabled = grading || showAnswer ? 'disabled' : '';
                        const onclick = !grading && !showAnswer ? `onclick="app.selectOption('${q.id}', '${opt.key}')"` : '';
                        
                        return `
                            <div class="option-item ${optClass}" ${onclick} ${disabled}>
                                <span class="option-marker">${opt.key}</span>
                                <span class="option-text">${this.escapeHtml(opt.text)}</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                ${showAnswer && q.explanation ? `
                    <div class="correct-answer-section">
                        <div class="label">解析</div>
                        <div class="answer">${this.markdownToHtml(q.explanation)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 渲染文本题
     */
    renderTextQuestion(q, index, answer, grading, showAnswer) {
        const statusClass = grading ? (grading.correct ? 'completed' : 'incorrect') : '';
        const disabled = grading || showAnswer ? 'disabled' : '';
        
        return `
            <div class="homework-question ${statusClass}" data-question-id="${q.id}">
                <div class="question-header">
                    <span class="question-number">${index + 1}</span>
                    <span class="question-text">${this.escapeHtml(q.question)}</span>
                    <span class="question-type">简答题</span>
                </div>
                <textarea class="question-textarea" 
                    data-question-id="${q.id}" 
                    placeholder="${q.placeholder || '请输入你的回答...'}"
                    oninput="app.onAnswerChange('${q.id}', this.value)"
                    ${disabled}>${answer || ''}</textarea>
                ${showAnswer && q.correctAnswer ? `
                    <div class="correct-answer-section">
                        <div class="label">参考答案</div>
                        <div class="answer">${this.markdownToHtml(q.correctAnswer)}</div>
                    </div>
                ` : ''}
                ${grading && grading.feedback ? `
                    <div class="correct-answer-section" style="background: #eff6ff; border-color: #3b82f6;">
                        <div class="label" style="color: #1d4ed8;">AI点评</div>
                        <div class="answer" style="color: #1e40af;">${this.markdownToHtml(grading.feedback)}</div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    /**
     * 选择题选项点击
     */
    selectOption(questionId, optionKey) {
        const questionEl = document.querySelector(`.homework-question[data-question-id="${questionId}"]`);
        if (!questionEl) return;
        
        // 移除其他选中状态
        questionEl.querySelectorAll('.option-item').forEach(el => el.classList.remove('selected'));
        
        // 添加选中状态
        const selectedEl = questionEl.querySelector(`.option-item:nth-child(${optionKey.charCodeAt(0) - 64})`);
        if (selectedEl) selectedEl.classList.add('selected');
        
        // 保存答案
        this.saveHomeworkAnswer(questionId, optionKey);
    },

    /**
     * 文本题答案变化
     */
    onAnswerChange(questionId, value) {
        this.saveHomeworkAnswer(questionId, value);
    },

    /**
     * 保存作业答案
     */
    saveHomeworkAnswer(questionId, answer) {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        let answers = Storage.getHomeworkAnswers(course.id, lessonIndex);
        answers[questionId] = answer;
        Storage.saveHomeworkAnswers(course.id, lessonIndex, answers);
        
        // 更新进度显示
        const lesson = course.outline[lessonIndex];
        const questions = lesson.homework?.questions || [];
        this.updateHomeworkProgress(questions, answers);
    },

    /**
     * 更新作业进度显示
     */
    updateHomeworkProgress(questions, answers) {
        const answered = questions.filter(q => answers[q.id] && answers[q.id].toString().trim()).length;
        const total = questions.length;
        const percent = total > 0 ? Math.round((answered / total) * 100) : 0;
        
        const progressEl = document.getElementById('homeworkProgressText');
        if (progressEl) {
            progressEl.innerHTML = `
                <span class="progress-bar"><span class="progress-fill" style="width: ${percent}%"></span></span>
                已完成 ${answered}/${total} 题
            `;
        }
    },

    /**
     * 更新作业状态UI
     */
    updateHomeworkStatusUI(progress, lessonIndex, gradingResult) {
        const statusEl = document.getElementById('homeworkStatus');
        const submitBtn = document.getElementById('submitHomeworkBtn');
        const feedbackEl = document.getElementById('gradingFeedback');
        
        if (!statusEl) return;
        
        if (gradingResult) {
            statusEl.textContent = `已评分 ${gradingResult.score}分`;
            statusEl.className = 'homework-badge graded';
            if (submitBtn) submitBtn.style.display = 'none';
            if (feedbackEl) {
                feedbackEl.style.display = 'block';
                this.renderGradingFeedback(gradingResult);
            }
        } else {
            const isCompleted = progress.completedHomework?.includes(lessonIndex);
            statusEl.textContent = isCompleted ? '已完成' : '待完成';
            statusEl.className = 'homework-badge ' + (isCompleted ? 'completed' : 'pending');
            if (submitBtn) submitBtn.style.display = 'inline-flex';
            if (feedbackEl) feedbackEl.style.display = 'none';
        }
    },

    /**
     * 渲染评分反馈
     */
    renderGradingFeedback(gradingResult) {
        const scoreEl = document.getElementById('scoreNumber');
        const titleEl = document.getElementById('feedbackTitle');
        const summaryEl = document.getElementById('feedbackSummary');
        const detailsEl = document.getElementById('feedbackDetails');
        
        if (scoreEl) scoreEl.textContent = gradingResult.score;
        
        if (gradingResult.score >= 90) {
            titleEl.textContent = '🎉 太棒了！';
            summaryEl.textContent = '你的回答非常出色，继续保持！';
        } else if (gradingResult.score >= 70) {
            titleEl.textContent = '👍 表现不错';
            summaryEl.textContent = '你对知识的掌握较好，还有进步空间。';
        } else if (gradingResult.score >= 60) {
            titleEl.textContent = '💪 基本合格';
            summaryEl.textContent = '建议重新复习课程内容，巩固基础知识。';
        } else {
            titleEl.textContent = '📚 需要加强';
            summaryEl.textContent = '建议仔细阅读课程，理解核心概念后再作答。';
        }
        
        if (detailsEl && gradingResult.details) {
            detailsEl.innerHTML = gradingResult.details.map(d => {
                let iconClass = d.correct ? 'correct' : (d.partial ? 'partial' : 'wrong');
                let icon = d.correct ? '✓' : (d.partial ? '~' : '✗');
                return `
                    <div class="feedback-item">
                        <span class="feedback-icon ${iconClass}">${icon}</span>
                        <div class="feedback-content">
                            <div class="question-ref">题目 ${d.questionNum}</div>
                            <div class="feedback-text">${d.feedback || (d.correct ? '回答正确' : '回答有误')}</div>
                        </div>
                    </div>
                `;
            }).join('');
        }
    },

    /**
     * 保存作业草稿
     */
    saveHomeworkDraft() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        // 答案已经自动保存，这里显示提示
        this.showToast('草稿已保存');
    },

    /**
     * 提交作业
     */
    async submitHomework() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        const lesson = course.outline[lessonIndex];
        const homework = lesson.homework;
        const answers = Storage.getHomeworkAnswers(course.id, lessonIndex);
        const questions = homework?.questions || [];
        
        // 检查是否所有题目都已作答
        const unanswered = questions.filter(q => !answers[q.id] || !answers[q.id].toString().trim());
        if (unanswered.length > 0) {
            if (!confirm(`还有 ${unanswered.length} 道题未作答，确定要提交吗？`)) {
                return;
            }
        }
        
        // 显示评分中
        const submitBtn = document.getElementById('submitHomeworkBtn');
        const originalText = submitBtn?.textContent;
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '🔄 评分中...';
        }
        
        try {
            // 调用AI评分
            const result = await AIService.gradeHomework(questions, answers, course, lesson);
            
            // 保存评分结果
            Storage.saveHomeworkGrading(course.id, lessonIndex, result);
            
            // 更新UI
            const progress = Storage.getProgress(course.id);
            this.updateHomeworkStatusUI(progress, lessonIndex, result);
            this.renderInteractiveHomework(homework, answers, result);
            
            // 标记作业完成
            if (!progress.completedHomework) progress.completedHomework = [];
            if (!progress.completedHomework.includes(lessonIndex)) {
                progress.completedHomework.push(lessonIndex);
                Storage.saveProgress(course.id, progress);
            }
            
            this.showToast(`作业提交成功！得分：${result.score}分`);
            
        } catch (error) {
            console.error('评分失败:', error);
            this.showToast('评分失败，请稍后重试');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    },

    /**
     * 重新作答
     */
    retryHomework() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        if (!confirm('重新作答将清空当前答案，确定继续吗？')) return;
        
        // 清除答案和评分
        Storage.clearHomeworkAnswers(course.id, lessonIndex);
        Storage.clearHomeworkGrading(course.id, lessonIndex);
        
        // 重置状态
        this.state.viewingAnswers = false;
        
        // 重新加载
        const lesson = course.outline[lessonIndex];
        const progress = Storage.getProgress(course.id);
        this.renderInteractiveHomework(lesson.homework, {}, null);
        this.updateHomeworkStatusUI(progress, lessonIndex, null);
    },

    /**
     * 查看正确答案
     */
    viewCorrectAnswers() {
        this.state.viewingAnswers = true;
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        const lesson = course.outline[lessonIndex];
        const answers = Storage.getHomeworkAnswers(course.id, lessonIndex);
        const grading = Storage.getHomeworkGrading(course.id, lessonIndex);
        
        this.renderInteractiveHomework(lesson.homework, answers, grading);
    },

    /**
     * 滚动到作业区域
     */
    scrollToHomework() {
        const homeworkSection = document.getElementById('homeworkSection');
        if (homeworkSection) {
            homeworkSection.scrollIntoView({ behavior: 'smooth' });
        }
    },

    /**
     * 显示Toast提示
     */
    showToast(message) {
        // 移除旧的toast
        const oldToast = document.querySelector('.toast-message');
        if (oldToast) oldToast.remove();
        
        // 创建新toast
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #1a1a2e;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideDown 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    },

    /**
     * 移除课程内容中的阅读进度指示器
     */
    removeProgressIndicators(contentEl) {
        // 查找并移除包含百分比的 span 元素（如"0%"、"阅读进度"等）
        const spans = contentEl.querySelectorAll('span');
        spans.forEach(span => {
            const text = span.textContent.trim();
            // 匹配纯数字+%的格式（如"0%"、"50%"等）
            if (/^\d+%$/.test(text)) {
                span.remove();
            }
        });
    },

    /**
     * 添加代码复制按钮
     */
    addCodeCopyButtons(contentEl) {
        const codeBlocks = contentEl.querySelectorAll('pre');
        codeBlocks.forEach(pre => {
            const btn = document.createElement('button');
            btn.className = 'copy-code-btn';
            btn.textContent = '复制';
            btn.onclick = () => {
                const code = pre.querySelector('code')?.textContent || pre.textContent;
                navigator.clipboard.writeText(code).then(() => {
                    btn.textContent = '已复制!';
                    btn.style.background = 'rgba(72, 187, 120, 0.3)';
                    setTimeout(() => {
                        btn.textContent = '复制';
                        btn.style.background = '';
                    }, 2000);
                });
            };
            pre.appendChild(btn);
        });
    },

    /**
     * 初始化阅读进度监听
     */
    initReadingProgress() {
        const studyContent = document.querySelector('.study-content');
        const progressBar = document.getElementById('readingProgressBar');
        if (!studyContent || !progressBar) return;
        
        // 移除旧的监听器
        if (this._progressListener) {
            studyContent.removeEventListener('scroll', this._progressListener);
        }
        
        this._progressListener = () => {
            const scrollTop = studyContent.scrollTop;
            const scrollHeight = studyContent.scrollHeight - studyContent.clientHeight;
            const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
            progressBar.style.width = Math.min(100, Math.max(0, progress)) + '%';
        };
        
        studyContent.addEventListener('scroll', this._progressListener);
        // 初始更新
        this._progressListener();
    },

    /**
     * Markdown 转 HTML - 增强版，支持更多格式
     */
    markdownToHtml(markdown) {
        if (!markdown) return '';
        
        let html = markdown
            // 代码块（支持语言标识）
            .replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
                const langLabel = lang ? `<div class="code-lang">${lang}</div>` : '';
                return `<pre>${langLabel}<code>${this.escapeHtml(code.trim())}</code></pre>`;
            })
            // 行内代码
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            // 标题
            .replace(/^#### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 分隔线
            .replace(/^\s*---+\s*$/gim, '<hr>')
            // 引用块（多行支持）
            .replace(/(^> .*$\n?)+/gm, (match) => {
                const content = match.replace(/^> /gm, '').replace(/\n/g, '<br>');
                return `<blockquote>${content}</blockquote>`;
            })
            // 提示框 - 💡 提示
            .replace(/^💡\s*\*\*(.*?)\*\*:\s*(.*$)/gim, '<div class="tip-box"><strong>💡 $1:</strong> $2</div>')
            .replace(/^💡\s*(.*$)/gim, '<div class="tip-box">💡 $1</div>')
            // 注意框 - ⚠️ 注意
            .replace(/^⚠️\s*\*\*(.*?)\*\*:\s*(.*$)/gim, '<div class="warning-box"><strong>⚠️ $1:</strong> $2</div>')
            .replace(/^⚠️\s*(.*$)/gim, '<div class="warning-box">⚠️ $1</div>')
            // 关键概念框
            .replace(/^🎯\s*\*\*(.*?)\*\*:\s*(.*$)/gim, '<div class="key-concept"><strong>🎯 $1:</strong> $2</div>')
            .replace(/^🎯\s*(.*$)/gim, '<div class="key-concept">🎯 $1</div>')
            // 粗体和斜体
            .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            // 表格
            .replace(/\|(.+)\|\n\|[-:| ]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
                const headers = header.split('|').map(h => h.trim()).filter(h => h);
                const headerHtml = headers.map(h => `<th>${h}</th>`).join('');
                const rowData = rows.trim().split('\n');
                const rowsHtml = rowData.map(row => {
                    const cells = row.split('|').map(c => c.trim()).filter(c => c);
                    return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
                }).join('');
                return `<table><thead><tr>${headerHtml}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
            })
            // 图片
            .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
            // 链接
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
            // 无序列表
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            // 有序列表
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>');

        // 处理列表 - 将连续的 li 包装在 ul/ol 中
        html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => {
            return `<ul>${match}</ul>`;
        });
        
        // 修复嵌套列表的问题
        html = html.replace(/<\/ul>\s*<ul>/g, '');
        
        // 段落处理
        // 先分割成块
        const blocks = html.split(/\n\n+/);
        const processedBlocks = blocks.map(block => {
            // 如果已经是标签块，直接返回
            if (/^<(h[1-6]|pre|blockquote|div|ul|ol|table|hr|img)/.test(block.trim())) {
                return block;
            }
            // 否则包装在 p 标签中
            return `<p>${block.replace(/\n/g, '<br>')}</p>`;
        });
        
        html = processedBlocks.join('\n');
        
        return html;
    },

    /**
     * HTML 转义
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * 初始化设置页面
     */
    initSettingsPage() {
        const settings = Storage.getSettings();
        
        // 安全地设置元素值
        const setValue = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value || '';
        };
        
        const setChecked = (id, checked) => {
            const el = document.getElementById(id);
            if (el) el.checked = checked;
        };
        
        setValue('aiProvider', settings.aiProvider);
        setValue('aiApiKey', settings.aiApiKey);
        setValue('customEndpoint', settings.customEndpoint);
        setValue('userName', settings.userName);
        setValue('userGoal', settings.userGoal);
        setChecked('defaultHomework', settings.defaultHomework);
        setChecked('autoSaveProgress', settings.autoSaveProgress);
        setChecked('darkMode', settings.darkMode);
        
        // 先根据提供商更新模型选项
        this.updateModelOptions(settings.aiProvider);
        // 然后设置选中的模型
        setValue('aiModel', settings.aiModel);
        
        // 绑定 AI Provider 切换
        const providerSelect = document.getElementById('aiProvider');
        if (providerSelect) {
            providerSelect.addEventListener('change', (e) => {
                this.updateModelOptions(e.target.value);
                // 显示/隐藏自定义端点
                const customGroup = document.getElementById('customEndpointGroup');
                if (customGroup) {
                    customGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
                }
            });
            // 初始触发一次
            const customGroup = document.getElementById('customEndpointGroup');
            if (customGroup) {
                customGroup.style.display = providerSelect.value === 'custom' ? 'block' : 'none';
            }
        }
    },

    /**
     * 保存设置（别名，供HTML调用）
     */
    saveAISettings() {
        return this.saveSettings();
    },

    /**
     * 保存设置
     */
    saveSettings() {
        const getValue = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        };
        
        const getChecked = (id) => {
            const el = document.getElementById(id);
            return el ? el.checked : false;
        };
        
        const settings = {
            aiProvider: getValue('aiProvider') || 'kimi',
            aiApiKey: getValue('aiApiKey'),
            aiModel: getValue('aiModel') || 'kimi-coding/k2p5',
            customEndpoint: getValue('customEndpoint'),
            userName: getValue('userName'),
            userGoal: getValue('userGoal'),
            defaultHomework: getChecked('defaultHomework'),
            autoSaveProgress: getChecked('autoSaveProgress'),
            darkMode: getChecked('darkMode')
        };
        
        Storage.saveSettings(settings);
        alert('设置已保存');
        
        // 应用深色模式
        if (settings.darkMode) {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    },

    /**
     * 切换 API Key 可见性
     */
    toggleApiKeyVisibility() {
        const input = document.getElementById('aiApiKey');
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    /**
     * 导出数据
     */
    exportData() {
        const data = Storage.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `learning-system-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * 导入数据
     */
    importData() {
        this.showModal('importModal');
        
        const fileInput = document.getElementById('importFileInput');
        const handleFile = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    if (Storage.importData(event.target.result)) {
                        alert('数据导入成功');
                        this.closeModal('importModal');
                        window.location.reload();
                    } else {
                        alert('数据导入失败');
                    }
                } catch (error) {
                    alert('文件格式错误: ' + error.message);
                }
            };
            reader.readAsText(file);
            
            // 移除事件监听
            fileInput.removeEventListener('change', handleFile);
        };
        
        fileInput.addEventListener('change', handleFile);
        
        // 拖放支持
        const dropArea = document.getElementById('fileUploadArea');
        dropArea.ondragover = (e) => { e.preventDefault(); dropArea.classList.add('dragover'); };
        dropArea.ondragleave = () => dropArea.classList.remove('dragover');
        dropArea.ondrop = (e) => {
            e.preventDefault();
            dropArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                fileInput.dispatchEvent(new Event('change'));
            }
        };
    },

    /**
     * 清除所有数据
     */
    clearAllData() {
        if (confirm('确定要清除所有数据吗？此操作不可撤销。')) {
            Storage.clearAllData();
            alert('所有数据已清除');
            window.location.reload();
        }
    },

    // ==================== 导航方法 ====================

    openCourse(courseId) {
        window.location.href = `course-detail.html?id=${courseId}`;
    },

    startLearning() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        const progress = Storage.getProgress(course.id);
        const nextLessonIndex = progress.currentLesson || 0;
        
        window.location.href = `study.html?course=${course.id}&lesson=${nextLessonIndex}`;
    },

    startLesson(lessonIndex) {
        const courseId = this.state.currentCourse?.id;
        if (courseId) {
            window.location.href = `study.html?course=${courseId}&lesson=${lessonIndex}`;
        }
    },

    goToLesson(lessonIndex) {
        this.state.currentLessonIndex = lessonIndex;
        const url = new URL(window.location);
        url.searchParams.set('lesson', lessonIndex);
        window.history.pushState({}, '', url);
        this.loadLessonContent(this.state.currentCourse, lessonIndex);
    },

    prevLesson() {
        if (this.state.currentLessonIndex > 0) {
            this.goToLesson(this.state.currentLessonIndex - 1);
        }
    },

    nextLesson() {
        const course = this.state.currentCourse;
        if (this.state.currentLessonIndex < course.outline.length - 1) {
            this.goToLesson(this.state.currentLessonIndex + 1);
        }
    },

    backToCourse() {
        if (this.state.currentCourse) {
            window.location.href = `course-detail.html?id=${this.state.currentCourse.id}`;
        }
    },

    continueStudy() {
        const course = this.state.currentCourse;
        if (course) {
            const progress = Storage.getProgress(course.id);
            this.startLesson(progress.currentLesson || 0);
        }
    },

    startNextLesson() {
        const course = this.state.currentCourse;
        if (course) {
            const progress = Storage.getProgress(course.id);
            this.startLesson(progress.currentLesson || 0);
        }
    },

    // ==================== 大纲编辑 ====================

    editOutline() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        // 简单的提示，实际功能可以后续添加
        alert('修改大纲功能正在开发中，您可以删除课程后重新创建。');
    },

    /**
     * 打开 AI 重新生成弹窗
     */
    regenerateWithAI() {
        console.log('[App] 打开 AI 调整课程弹窗');
        const course = this.state.currentCourse;
        if (!course) {
            console.error('[App] 没有当前课程');
            return;
        }
        
        // 先显示弹窗
        this.showModal('editOutlineModal');
        
        // 切换到 AI 标签
        this.switchEditTab('ai');
        
        // 清空之前的输入
        const requestInput = document.getElementById('modificationRequest');
        if (requestInput) {
            requestInput.value = '';
        }
    },

    /**
     * 切换编辑标签页
     */
    switchEditTab(tab) {
        console.log('[App] 切换标签页到:', tab);
        
        const manualTab = document.getElementById('manualTab');
        const aiTab = document.getElementById('aiTab');
        const manualArea = document.getElementById('manualEditArea');
        const aiArea = document.getElementById('aiEditArea');
        const saveManualBtn = document.getElementById('saveManualBtn');
        const regenerateAIBtn = document.getElementById('regenerateAIBtn');
        
        if (!manualTab || !aiTab || !manualArea || !aiArea) {
            console.error('[App] 找不到标签页元素');
            return;
        }
        
        if (tab === 'manual') {
            manualTab.classList.add('active');
            aiTab.classList.remove('active');
            manualArea.style.display = 'block';
            aiArea.style.display = 'none';
            if (saveManualBtn) saveManualBtn.style.display = 'inline-block';
            if (regenerateAIBtn) regenerateAIBtn.style.display = 'none';
        } else {
            manualTab.classList.remove('active');
            aiTab.classList.add('active');
            manualArea.style.display = 'none';
            aiArea.style.display = 'block';
            if (saveManualBtn) saveManualBtn.style.display = 'none';
            if (regenerateAIBtn) regenerateAIBtn.style.display = 'inline-block';
        }
    },

    /**
     * 填充示例修改需求
     */
    fillModificationRequest(text) {
        const input = document.getElementById('modificationRequest');
        if (input) {
            input.value = text;
        }
    },

    /**
     * 确认使用 AI 重新生成课程
     */
    async confirmRegenerateWithAI() {
        const course = this.state.currentCourse;
        if (!course) {
            console.error('[App] 没有当前课程');
            return;
        }
        
        const requestInput = document.getElementById('modificationRequest');
        if (!requestInput) {
            console.error('[App] 找不到输入框');
            return;
        }
        
        const modificationRequest = requestInput.value.trim();
        
        if (!modificationRequest) {
            alert('请先描述你的修改需求');
            return;
        }
        
        if (!confirm('⚠️ 重新生成课程将清空现有的课程内容和作业，学习进度也会重置。是否继续？')) {
            return;
        }
        
        const btn = document.getElementById('regenerateAIBtn');
        if (!btn) {
            console.error('[App] 找不到按钮');
            return;
        }
        
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-text">⏳ AI 正在重新设计课程...</span>';
        btn.disabled = true;
        
        try {
            // 调用 AI 重新生成大纲
            const newOutline = await AIService.regenerateOutlineWithChanges(
                course, 
                modificationRequest, 
                course.outline
            );
            
            // 更新课程数据
            course.outline = newOutline;
            course.updatedAt = new Date().toISOString();
            
            // 清空所有课程内容（因为大纲变了）
            course.outline.forEach(lesson => {
                lesson.content = null;
                lesson.homework = null;
            });
            
            // 保存课程
            Storage.saveCourse(course);
            
            // 重置学习进度
            const progress = Storage.getProgress(course.id);
            progress.completedLessons = [];
            progress.completedHomework = [];
            progress.currentLesson = 0;
            Storage.saveProgress(course.id, progress);
            
            this.closeModal('editOutlineModal');
            this.renderCourseDetail(course);
            
            alert('✅ 课程已根据你的要求重新设计！\n\n所有课程内容和作业已清空，你可以重新开始学习新设计的课程。');
            
        } catch (error) {
            console.error('重新生成课程失败:', error);
            alert('❌ 重新生成失败: ' + error.message);
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    },

    saveOutlineChanges() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        const editor = document.getElementById('outlineEditor');
        const lines = editor.value.split('\n').filter(l => l.trim());
        
        const newOutline = lines.map((line, index) => {
            const parts = line.split('|');
            const dayMatch = parts[0]?.match(/\d+/);
            return {
                day: parseInt(dayMatch?.[0]) || (index + 1),
                title: parts[1]?.trim() || `第 ${index + 1} 天`,
                description: parts[2]?.trim() || '',
                duration: course.dailyTime,
                content: null,
                homework: null
            };
        });
        
        course.outline = newOutline;
        course.updatedAt = new Date().toISOString();
        Storage.saveCourse(course);
        
        this.closeModal('editOutlineModal');
        this.renderCourseDetail(course);
        alert('大纲已更新');
    },

    expandAll() {
        // 大纲默认全部展开，此方法预留
    },

    collapseAll() {
        // 大纲默认全部展开，此方法预留
    },

    // ==================== 学习操作 ====================

    async markLessonComplete() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        const progress = Storage.getProgress(course.id);
        
        if (!progress.completedLessons.includes(lessonIndex)) {
            progress.completedLessons.push(lessonIndex);
            progress.completedLessons.sort((a, b) => a - b);
        }
        
        // 计算学习时间（按实际学习时间估算，而不是计划时间）
        // 实际学习时间通常为计划时间的 60-80%
        const plannedMinutes = this.parseTimeToMinutes(course.dailyTime);
        const actualMinutes = Math.round(plannedMinutes * 0.7); // 按70%计算
        progress.totalStudyTime = (progress.totalStudyTime || 0) + actualMinutes;
        progress.lastStudyDate = new Date().toISOString();
        
        // 更新当前课程进度（不自动跳到下一课）
        if (progress.currentLesson < lessonIndex + 1) {
            progress.currentLesson = lessonIndex + 1;
        }
        
        Storage.saveProgress(course.id, progress);
        
        // 更新按钮状态
        const markBtn = document.getElementById('markCompleteBtn');
        if (markBtn) {
            markBtn.textContent = '✓ 本节课已完成';
            markBtn.disabled = true;
        }
        document.getElementById('lessonStatus').textContent = '✅ 已完成';
        
        // 显示完成提示（小提示，不弹窗）
        this.showToast('✅ 本节课已标记为完成！');
    },

    /**
     * 跳过当前课程
     */
    skipLesson() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        if (!confirm('确定要跳过这节课吗？跳过后可以重新学习。')) {
            return;
        }
        
        const progress = Storage.getProgress(course.id);
        
        // 更新当前课程进度
        if (progress.currentLesson < lessonIndex + 1) {
            progress.currentLesson = lessonIndex + 1;
        }
        
        Storage.saveProgress(course.id, progress);
        
        this.showToast('⏭️ 已跳过本节课');
        
        // 自动跳到下一课
        if (lessonIndex < course.outline.length - 1) {
            this.nextLesson();
        }
    },

    /**
     * 显示提示消息
     */
    showToast(message) {
        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'toast-message';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideDown 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // 3秒后移除
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    toggleHomeworkComplete() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        const progress = Storage.getProgress(course.id);
        
        if (!progress.completedHomework) {
            progress.completedHomework = [];
        }
        
        const index = progress.completedHomework.indexOf(lessonIndex);
        if (index >= 0) {
            progress.completedHomework.splice(index, 1);
        } else {
            progress.completedHomework.push(lessonIndex);
        }
        
        Storage.saveProgress(course.id, progress);
        this.loadHomework(course, lessonIndex);
    },

    /**
     * 初始化面板切换按钮状态
     */
    initPanelToggleButtons() {
        const outlinePanel = document.getElementById('outlinePanel');
        const outlineToggleBtn = document.getElementById('outlineToggleBtn');
        const outlineHeaderBtn = document.getElementById('outlineToggleHeaderBtn');
        
        // 设置大纲面板按钮状态
        if (outlinePanel && outlinePanel.classList.contains('collapsed')) {
            if (outlineToggleBtn) {
                outlineToggleBtn.innerHTML = '▶';
                outlineToggleBtn.title = '展开大纲';
            }
            if (outlineHeaderBtn) {
                outlineHeaderBtn.innerHTML = '📋 展开大纲';
            }
        }
    },

    toggleOutline() {
        const panel = document.getElementById('outlinePanel');
        const toggleBtn = document.getElementById('outlineToggleBtn');
        const headerBtn = document.getElementById('outlineToggleHeaderBtn');
        
        panel.classList.toggle('collapsed');
        const isCollapsed = panel.classList.contains('collapsed');
        
        // 更新切换按钮图标
        if (toggleBtn) {
            toggleBtn.innerHTML = isCollapsed ? '▶' : '◀';
            toggleBtn.title = isCollapsed ? '展开大纲' : '收起大纲';
        }
        
        // 更新顶部按钮文本
        if (headerBtn) {
            headerBtn.innerHTML = isCollapsed ? '📋 展开大纲' : '📋 收起大纲';
        }
    },

    toggleHomeworkPanel() {
        // 新版作业面板在内容底部，不需要切换，滚动到作业区域即可
        this.scrollToHomework();
    },

    toggleNotes() {
        const sidebar = document.getElementById('notesSidebar');
        sidebar.classList.toggle('open');
    },

    saveNotes() {
        const course = this.state.currentCourse;
        const lessonIndex = this.state.currentLessonIndex;
        if (!course) return;
        
        const notes = document.getElementById('lessonNotes').value;
        Storage.saveNotes(course.id, lessonIndex, notes);
        alert('笔记已保存');
    },

    scrollToTop() {
        document.querySelector('.study-content').scrollTop = 0;
    },

    // ==================== 课程操作 ====================

    continueLearning() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        const progress = Storage.getProgress(course.id);
        const nextLessonIndex = progress.currentLesson || 0;
        
        window.location.href = `study.html?course=${course.id}&lesson=${nextLessonIndex}`;
    },

    startNextLesson() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        const progress = Storage.getProgress(course.id);
        const nextLessonIndex = progress.currentLesson || 0;
        
        window.location.href = `study.html?course=${course.id}&lesson=${nextLessonIndex}`;
    },

    expandAllOutline() {
        document.querySelectorAll('.outline-item').forEach(item => {
            item.classList.add('expanded');
        });
    },

    collapseAllOutline() {
        document.querySelectorAll('.outline-item').forEach(item => {
            item.classList.remove('expanded');
        });
    },

    deleteCourse() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        document.getElementById('deleteCourseName').textContent = `"${course.subject}"`;
        this.showModal('deleteModal');
    },

    confirmDeleteCourse() {
        const course = this.state.currentCourse;
        if (!course) return;
        
        Storage.deleteCourse(course.id);
        this.closeModal('deleteModal');
        window.location.href = 'courses.html';
    },

    // ==================== 工具方法 ====================

    showModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    },

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    parseTimeToMinutes(timeStr) {
        if (timeStr.includes('小时')) {
            const hours = parseFloat(timeStr);
            return Math.round(hours * 60);
        } else if (timeStr.includes('分钟')) {
            return parseInt(timeStr);
        }
        return 60;
    },

    navigateTo(view) {
        const map = {
            'dashboard': 'index.html',
            'courses': 'courses.html',
            'create': 'create-course.html',
            'settings': 'settings.html'
        };
        if (map[view]) {
            window.location.href = map[view];
        }
    },

    updateModelOptions(provider) {
        const modelSelect = document.getElementById('aiModel');
        const options = {
            'kimi': [
                { value: 'kimi-coding/k2p5', text: 'Kimi K2.5' },
                { value: 'moonshot-v1-8k', text: 'Moonshot v1 8K' },
                { value: 'moonshot-v1-32k', text: 'Moonshot v1 32K' },
                { value: 'moonshot-v1-128k', text: 'Moonshot v1 128K' }
            ],
            'kimi-coding': [
                { value: 'kimi-coding/k2p5', text: 'Kimi Coding K2.5 (代码专用)' }
            ],
            'deepseek': [
                { value: 'deepseek-chat', text: 'DeepSeek V3' },
                { value: 'deepseek-reasoner', text: 'DeepSeek R1 (推理)' }
            ],
            'openai': [
                { value: 'gpt-4', text: 'GPT-4' },
                { value: 'gpt-4-turbo', text: 'GPT-4 Turbo' },
                { value: 'gpt-3.5-turbo', text: 'GPT-3.5 Turbo' }
            ]
        };
        
        const opts = options[provider] || options.kimi;
        modelSelect.innerHTML = opts.map(o => `<option value="${o.value}">${o.text}</option>`).join('');
    },

    /**
     * 测试 AI 连接
     */
    async testAIConnection() {
        const resultDiv = document.getElementById('aiTestResult');
        if (!resultDiv) {
            alert('测试结果展示区域不存在，请刷新页面');
            return;
        }
        resultDiv.style.display = 'block';
        
        // 检查当前访问方式
        const isFileProtocol = window.location.protocol === 'file:';
        const currentUrl = window.location.href;
        
        let warningHtml = '';
        if (isFileProtocol) {
            warningHtml = `
                <div style="background: #fee2e2; border: 2px solid #dc2626; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
                    <h4 style="color: #dc2626; margin-bottom: 8px;">⚠️ 检测到问题！</h4>
                    <p style="color: #7f1d1d; margin-bottom: 8px;">
                        你是直接从文件打开的（file://），这会导致 API 请求被浏览器阻止。
                    </p>
                    <p style="color: #7f1d1d; font-weight: bold;">
                        解决方法：双击运行 start-server.bat，然后访问 http://localhost:8080
                    </p>
                </div>
            `;
        }
        
        resultDiv.innerHTML = warningHtml + '<div class="loading">正在测试连接，请稍候（最多10秒）...</div>';
        
        try {
            const result = await AIService.testConnection();
            
            let html = '<div class="test-details">';
            html += '<h4>🔍 诊断结果</h4>';
            html += '<div class="test-info">';
            html += `<p><strong>服务提供商:</strong> ${result.settings.provider}</p>`;
            html += `<p><strong>选择模型:</strong> ${result.settings.model}</p>`;
            html += `<p><strong>实际模型:</strong> ${result.settings.actualModel}</p>`;
            html += `<p><strong>API 端点:</strong> ${result.settings.endpoint}</p>`;
            html += `<p><strong>API Key:</strong> ${result.settings.hasKey ? '已设置 ✓' : '未设置 ✗'}</p>`;
            html += '</div>';
            
            html += '<div class="test-steps">';
            result.steps.forEach(step => {
                const statusClass = step.status === '通过' ? 'success' : 'error';
                html += `<div class="test-step ${statusClass}">`;
                html += `<span class="step-status">${step.status}</span>`;
                html += `<span class="step-name">${step.step}</span>`;
                if (step.message) {
                    html += `<span class="step-message">${step.message}</span>`;
                }
                html += '</div>';
                
                // 显示具体建议
                if (step.suggestion) {
                    html += `<div class="step-suggestion">💡 ${step.suggestion}</div>`;
                }
                
                // 显示详细错误信息
                if (step.detail && step.status === '失败') {
                    html += `<div class="step-detail">详细信息: ${step.detail.substring(0, 200)}...</div>`;
                }
            });
            html += '</div>';
            
            // 添加解决方案提示
            const hasError = result.steps.some(s => s.status === '失败');
            if (hasError) {
                html += '<div class="test-solutions">';
                html += '<h4>🔧 解决方案:</h4>';
                html += '<ol>';
                
                // 检查是否是 CORS 问题
                const isCorsError = result.steps.some(s => 
                    s.message && s.message.includes('CORS')
                );
                
                if (isCorsError) {
                    html += '<li style="color: #dc2626; font-weight: bold;">【关键】请使用本地服务器访问：双击运行 start-server.bat，然后访问 http://localhost:8080</li>';
                }
                
                // 检查是否是 API Key 问题
                const isKeyError = result.steps.some(s => 
                    s.message && s.message.includes('401')
                );
                
                if (isKeyError) {
                    html += '<li style="color: #dc2626; font-weight: bold;">【关键】API Key 无效，请重新到 https://platform.moonshot.cn 创建新的 API Key</li>';
                    html += '<li>确保 Key 没有被禁用或过期</li>';
                }
                
                html += '<li>确保网络连接正常，可以访问互联网</li>';
                html += '<li>尝试切换模型（推荐 moonshot-v1-8k）</li>';
                html += '</ol>';
                html += '</div>';
            } else {
                html += '<div style="background: #d1fae5; padding: 12px; border-radius: 6px; margin-top: 12px;">✅ 所有测试通过！AI 功能可以正常使用。</div>';
            }
            
            html += '</div>';
            resultDiv.innerHTML = html;
            
        } catch (error) {
            resultDiv.innerHTML = `<div class="error">测试程序出错: ${error.message}</div>`;
        }
    },

    // ==================== 示例课程 ====================

    /**
     * 创建示例课程（6个类别，7天x1小时）
     */
    async createSampleCourses() {
        if (!confirm('这将创建6门示例课程（人文社科、技能实践、理工科、语言、商业、艺术），每门7天共7小时。确定继续吗？')) {
            return;
        }

        const samples = [
            {
                subject: '批判性思维入门',
                category: 'humanities',
                subjectType: '人文社科',
                level: '初级',
                duration: '7天',
                dailyTime: '1小时',
                description: '学习如何识别逻辑谬误、分析论证结构、形成理性判断',
                includeHomework: true
            },
            {
                subject: '摄影后期处理',
                category: 'practical',
                subjectType: '技能实践',
                level: '中级',
                duration: '7天',
                dailyTime: '1小时',
                description: '掌握Lightroom调色技巧、人像精修、风光后期',
                includeHomework: true
            },
            {
                subject: 'Python编程入门',
                category: 'science',
                subjectType: '理工科',
                level: '初级',
                duration: '7天',
                dailyTime: '1小时',
                description: '从零开始学习Python基础语法、数据结构和简单项目',
                includeHomework: true
            },
            {
                subject: '商务英语口语',
                category: 'language',
                subjectType: '语言学习',
                level: '中级',
                duration: '7天',
                dailyTime: '1小时',
                description: '提升商务场景英语交流能力，包括会议、谈判、演讲',
                includeHomework: true
            },
            {
                subject: '产品经理思维',
                category: 'business',
                subjectType: '商业管理',
                level: '中级',
                duration: '7天',
                dailyTime: '1小时',
                description: '学习需求分析、用户研究、产品设计思维',
                includeHomework: true
            },
            {
                subject: '印象派艺术鉴赏',
                category: 'art',
                subjectType: '艺术鉴赏',
                level: '初级',
                duration: '7天',
                dailyTime: '1小时',
                description: '欣赏莫奈、梵高、雷诺阿等大师作品，理解光影与色彩',
                includeHomework: true
            }
        ];

        let created = 0;
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.disabled = true;

        for (const sample of samples) {
            try {
                btn.innerHTML = `<span>⏳ 正在创建: ${sample.subject}...</span>`;
                
                // 生成课程大纲
                const outlineResult = await AIService.generateCourseOutline({
                    subject: sample.subject,
                    level: sample.level,
                    duration: sample.duration,
                    dailyTime: sample.dailyTime,
                    description: sample.description
                });

                // 创建课程对象
                const course = {
                    id: this.generateId(),
                    ...sample,
                    outline: outlineResult.outline || this.createDefaultOutline(sample),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };

                // 保存课程
                Storage.saveCourse(course);
                created++;

            } catch (error) {
                console.error(`创建示例课程失败 ${sample.subject}:`, error);
                
                // 失败时使用默认大纲
                const course = {
                    id: this.generateId(),
                    ...sample,
                    outline: this.createDefaultOutline(sample),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                Storage.saveCourse(course);
                created++;
            }
        }

        btn.innerHTML = originalText;
        btn.disabled = false;

        this.showToast(`成功创建 ${created} 门示例课程！`);
        this.initHomePage(); // 刷新首页
    },

    /**
     * 创建默认课程大纲
     */
    createDefaultOutline(sample) {
        const frameworks = {
            humanities: [
                { day: 1, title: '导论与基本概念', description: '课程概述与核心概念介绍', duration: '1小时' },
                { day: 2, title: '历史背景与发展', description: '了解领域发展历程', duration: '1小时' },
                { day: 3, title: '核心理论框架', description: '学习主要理论观点', duration: '1小时' },
                { day: 4, title: '经典案例分析', description: '分析经典案例与文献', duration: '1小时' },
                { day: 5, title: '批判性思考', description: '培养批判性思维能力', duration: '1小时' },
                { day: 6, title: '当代应用', description: '理论在当代的应用', duration: '1小时' },
                { day: 7, title: '综合讨论与总结', description: '课程回顾与深入讨论', duration: '1小时' }
            ],
            practical: [
                { day: 1, title: '工具与环境准备', description: '软件安装与基础设置', duration: '1小时' },
                { day: 2, title: '基础操作练习', description: '掌握核心操作技能', duration: '1小时' },
                { day: 3, title: '进阶技巧学习', description: '学习高级功能与技巧', duration: '1小时' },
                { day: 4, title: '实战案例演练', description: '跟随案例动手实践', duration: '1小时' },
                { day: 5, title: '问题排查与优化', description: '常见问题解决方案', duration: '1小时' },
                { day: 6, title: '综合项目实践', description: '完成综合练习项目', duration: '1小时' },
                { day: 7, title: '作品完善与展示', description: '完善作品并分享交流', duration: '1小时' }
            ],
            science: [
                { day: 1, title: '基础概念与原理', description: '核心概念与基本原理', duration: '1小时' },
                { day: 2, title: '数学基础回顾', description: '相关数学知识准备', duration: '1小时' },
                { day: 3, title: '核心算法学习', description: '学习关键算法与公式', duration: '1小时' },
                { day: 4, title: '编程实践一', description: '动手实现基础代码', duration: '1小时' },
                { day: 5, title: '编程实践二', description: '进阶编程练习', duration: '1小时' },
                { day: 6, title: '综合应用案例', description: '综合案例分析与实现', duration: '1小时' },
                { day: 7, title: '项目总结与拓展', description: '项目完善与知识拓展', duration: '1小时' }
            ],
            language: [
                { day: 1, title: '语音与发音基础', description: '语音规则与发音练习', duration: '1小时' },
                { day: 2, title: '基础词汇与表达', description: '核心词汇与日常表达', duration: '1小时' },
                { day: 3, title: '语法结构学习', description: '关键语法点讲解', duration: '1小时' },
                { day: 4, title: '听力理解训练', description: '听力材料练习', duration: '1小时' },
                { day: 5, title: '口语表达练习', description: '情景对话与口语练习', duration: '1小时' },
                { day: 6, title: '阅读理解训练', description: '阅读材料分析理解', duration: '1小时' },
                { day: 7, title: '综合应用与交流', description: '综合运用与交流练习', duration: '1小时' }
            ],
            business: [
                { day: 1, title: '商业思维入门', description: '商业基础概念与思维', duration: '1小时' },
                { day: 2, title: '市场与用户分析', description: '了解市场与用户需求', duration: '1小时' },
                { day: 3, title: '核心方法论', description: '学习专业方法与工具', duration: '1小时' },
                { day: 4, title: '经典案例研究', description: '分析成功商业案例', duration: '1小时' },
                { day: 5, title: '实战模拟练习', description: '模拟商业场景练习', duration: '1小时' },
                { day: 6, title: '问题解决实战', description: '解决实际商业问题', duration: '1小时' },
                { day: 7, title: '方案展示与复盘', description: '展示方案并复盘总结', duration: '1小时' }
            ],
            art: [
                { day: 1, title: '艺术流派概述', description: '了解主要艺术流派', duration: '1小时' },
                { day: 2, title: '代表艺术家介绍', description: '认识重要艺术家生平', duration: '1小时' },
                { day: 3, title: '经典作品赏析一', description: '深度解析经典作品', duration: '1小时' },
                { day: 4, title: '经典作品赏析二', description: '继续赏析代表作品', duration: '1小时' },
                { day: 5, title: '技法与风格分析', description: '分析创作技法特点', duration: '1小时' },
                { day: 6, title: '时代背景解读', description: '了解作品时代背景', duration: '1小时' },
                { day: 7, title: '审美能力提升', description: '综合提升艺术鉴赏力', duration: '1小时' }
            ]
        };

        const outline = frameworks[sample.category] || frameworks.humanities;
        return outline.map(item => ({
            ...item,
            content: null,
            homework: null
        }));
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = app;
}
