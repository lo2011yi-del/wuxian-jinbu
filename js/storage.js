/**
 * 本地存储管理模块
 * 使用 localStorage 存储课程数据和学习进度
 */

const Storage = {
    // 存储键名
    KEYS: {
        COURSES: 'learning_system_courses',
        SETTINGS: 'learning_system_settings',
        PROGRESS: 'learning_system_progress',
        NOTES: 'learning_system_notes',
        HOMEWORK_ANSWERS: 'learning_system_homework_answers',
        HOMEWORK_GRADING: 'learning_system_homework_grading',
        USERS: 'learning_system_users',
        CURRENT_USER: 'learning_system_current_user'
    },

    /**
     * 获取所有课程
     */
    getCourses() {
        try {
            const data = localStorage.getItem(this.KEYS.COURSES);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error reading courses:', e);
            return [];
        }
    },

    /**
     * 保存课程列表
     */
    saveCourses(courses) {
        try {
            localStorage.setItem(this.KEYS.COURSES, JSON.stringify(courses));
            return true;
        } catch (e) {
            console.error('Error saving courses:', e);
            return false;
        }
    },

    /**
     * 获取单个课程
     */
    getCourse(courseId) {
        const courses = this.getCourses();
        return courses.find(c => c.id === courseId);
    },

    /**
     * 保存单个课程
     */
    saveCourse(course) {
        const courses = this.getCourses();
        const index = courses.findIndex(c => c.id === course.id);
        if (index >= 0) {
            courses[index] = course;
        } else {
            courses.push(course);
        }
        return this.saveCourses(courses);
    },

    /**
     * 删除课程
     */
    deleteCourse(courseId) {
        const courses = this.getCourses().filter(c => c.id !== courseId);
        return this.saveCourses(courses);
    },

    /**
     * 获取设置
     */
    getSettings() {
        try {
            const data = localStorage.getItem(this.KEYS.SETTINGS);
            return data ? JSON.parse(data) : this.getDefaultSettings();
        } catch (e) {
            console.error('Error reading settings:', e);
            return this.getDefaultSettings();
        }
    },

    /**
     * 保存设置
     */
    saveSettings(settings) {
        try {
            localStorage.setItem(this.KEYS.SETTINGS, JSON.stringify(settings));
            return true;
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    },

    /**
     * 默认设置
     */
    getDefaultSettings() {
        return {
            aiProvider: 'kimi',
            aiApiKey: '',
            aiModel: 'kimi-coding/k2p5',
            customEndpoint: '',
            userName: '',
            userGoal: '',
            defaultHomework: true,
            autoSaveProgress: true,
            darkMode: false
        };
    },

    /**
     * 获取学习进度
     */
    getProgress(courseId) {
        try {
            const data = localStorage.getItem(this.KEYS.PROGRESS);
            const allProgress = data ? JSON.parse(data) : {};
            return allProgress[courseId] || this.getDefaultProgress();
        } catch (e) {
            console.error('Error reading progress:', e);
            return this.getDefaultProgress();
        }
    },

    /**
     * 保存学习进度
     */
    saveProgress(courseId, progress) {
        try {
            const data = localStorage.getItem(this.KEYS.PROGRESS);
            const allProgress = data ? JSON.parse(data) : {};
            allProgress[courseId] = progress;
            localStorage.setItem(this.KEYS.PROGRESS, JSON.stringify(allProgress));
            return true;
        } catch (e) {
            console.error('Error saving progress:', e);
            return false;
        }
    },

    /**
     * 默认进度
     */
    getDefaultProgress() {
        return {
            completedLessons: [],
            completedHomework: [],
            currentLesson: 0,
            totalStudyTime: 0,
            startDate: null,
            lastStudyDate: null,
            notes: {}
        };
    },

    /**
     * 获取笔记
     */
    getNotes(courseId, lessonIndex) {
        try {
            const data = localStorage.getItem(this.KEYS.NOTES);
            const allNotes = data ? JSON.parse(data) : {};
            const courseNotes = allNotes[courseId] || {};
            return courseNotes[lessonIndex] || '';
        } catch (e) {
            console.error('Error reading notes:', e);
            return '';
        }
    },

    /**
     * 保存笔记
     */
    saveNotes(courseId, lessonIndex, notes) {
        try {
            const data = localStorage.getItem(this.KEYS.NOTES);
            const allNotes = data ? JSON.parse(data) : {};
            if (!allNotes[courseId]) {
                allNotes[courseId] = {};
            }
            allNotes[courseId][lessonIndex] = notes;
            localStorage.setItem(this.KEYS.NOTES, JSON.stringify(allNotes));
            return true;
        } catch (e) {
            console.error('Error saving notes:', e);
            return false;
        }
    },

    /**
     * 导出所有数据
     */
    exportData() {
        const data = {
            courses: this.getCourses(),
            settings: this.getSettings(),
            progress: localStorage.getItem(this.KEYS.PROGRESS) || '{}',
            notes: localStorage.getItem(this.KEYS.NOTES) || '{}',
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    },

    /**
     * 导入数据
     */
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            if (data.courses) {
                this.saveCourses(data.courses);
            }
            if (data.settings) {
                this.saveSettings(data.settings);
            }
            if (data.progress) {
                localStorage.setItem(this.KEYS.PROGRESS, 
                    typeof data.progress === 'string' ? data.progress : JSON.stringify(data.progress));
            }
            if (data.notes) {
                localStorage.setItem(this.KEYS.NOTES, 
                    typeof data.notes === 'string' ? data.notes : JSON.stringify(data.notes));
            }
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    },

    /**
     * 清除所有数据
     */
    clearAllData() {
        try {
            Object.values(this.KEYS).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (e) {
            console.error('Error clearing data:', e);
            return false;
        }
    },

    /**
     * 获取学习统计
     */
    getStatistics() {
        const courses = this.getCourses();
        const allProgress = localStorage.getItem(this.KEYS.PROGRESS);
        const progressData = allProgress ? JSON.parse(allProgress) : {};
        
        let totalLessons = 0;
        let completedLessons = 0;
        let totalStudyTime = 0;
        
        courses.forEach(course => {
            const progress = progressData[course.id] || this.getDefaultProgress();
            if (course.outline) {
                totalLessons += course.outline.length;
            }
            completedLessons += progress.completedLessons.length;
            totalStudyTime += progress.totalStudyTime || 0;
        });

        // 计算连续学习天数
        const studyDates = new Set();
        Object.values(progressData).forEach(progress => {
            if (progress.lastStudyDate) {
                studyDates.add(progress.lastStudyDate.split('T')[0]);
            }
        });
        
        const streak = this.calculateStreak(Array.from(studyDates).sort());

        return {
            totalCourses: courses.length,
            totalLessons,
            completedLessons,
            totalStudyTime: Math.round(totalStudyTime / 60 * 10) / 10, // 转换为小时
            studyStreak: streak
        };
    },

    /**
     * 计算连续学习天数
     */
    calculateStreak(dates) {
        if (dates.length === 0) return 0;
        
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        // 如果今天或昨天没有学习，返回0
        if (!dates.includes(today) && !dates.includes(yesterday)) {
            return 0;
        }
        
        let streak = 0;
        let currentDate = new Date();
        
        while (true) {
            const dateStr = currentDate.toISOString().split('T')[0];
            if (dates.includes(dateStr)) {
                streak++;
                currentDate.setDate(currentDate.getDate() - 1);
            } else if (dateStr === today) {
                // 今天还没学，继续检查昨天
                currentDate.setDate(currentDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    },

    /**
     * 获取作业答案
     */
    getHomeworkAnswers(courseId, lessonIndex) {
        try {
            const data = localStorage.getItem(this.KEYS.HOMEWORK_ANSWERS);
            const allAnswers = data ? JSON.parse(data) : {};
            const courseAnswers = allAnswers[courseId] || {};
            return courseAnswers[lessonIndex] || {};
        } catch (e) {
            console.error('Error reading homework answers:', e);
            return {};
        }
    },

    /**
     * 保存作业答案
     */
    saveHomeworkAnswers(courseId, lessonIndex, answers) {
        try {
            const data = localStorage.getItem(this.KEYS.HOMEWORK_ANSWERS);
            const allAnswers = data ? JSON.parse(data) : {};
            if (!allAnswers[courseId]) {
                allAnswers[courseId] = {};
            }
            allAnswers[courseId][lessonIndex] = answers;
            localStorage.setItem(this.KEYS.HOMEWORK_ANSWERS, JSON.stringify(allAnswers));
            return true;
        } catch (e) {
            console.error('Error saving homework answers:', e);
            return false;
        }
    },

    /**
     * 清除作业答案
     */
    clearHomeworkAnswers(courseId, lessonIndex) {
        return this.saveHomeworkAnswers(courseId, lessonIndex, {});
    },

    /**
     * 获取作业评分
     */
    getHomeworkGrading(courseId, lessonIndex) {
        try {
            const data = localStorage.getItem(this.KEYS.HOMEWORK_GRADING);
            const allGrading = data ? JSON.parse(data) : {};
            const courseGrading = allGrading[courseId] || {};
            return courseGrading[lessonIndex] || null;
        } catch (e) {
            console.error('Error reading homework grading:', e);
            return null;
        }
    },

    /**
     * 保存作业评分
     */
    saveHomeworkGrading(courseId, lessonIndex, grading) {
        try {
            const data = localStorage.getItem(this.KEYS.HOMEWORK_GRADING);
            const allGrading = data ? JSON.parse(data) : {};
            if (!allGrading[courseId]) {
                allGrading[courseId] = {};
            }
            allGrading[courseId][lessonIndex] = grading;
            localStorage.setItem(this.KEYS.HOMEWORK_GRADING, JSON.stringify(allGrading));
            return true;
        } catch (e) {
            console.error('Error saving homework grading:', e);
            return false;
        }
    },

    /**
     * 清除作业评分
     */
    clearHomeworkGrading(courseId, lessonIndex) {
        try {
            const data = localStorage.getItem(this.KEYS.HOMEWORK_GRADING);
            const allGrading = data ? JSON.parse(data) : {};
            if (allGrading[courseId]) {
                delete allGrading[courseId][lessonIndex];
                localStorage.setItem(this.KEYS.HOMEWORK_GRADING, JSON.stringify(allGrading));
            }
            return true;
        } catch (e) {
            console.error('Error clearing homework grading:', e);
            return false;
        }
    },

    // ==================== 用户账户管理 ====================

    /**
     * 注册用户
     */
    register(username, password) {
        try {
            const users = this.getUsers();
            
            // 检查用户名是否已存在
            if (users.find(u => u.username === username)) {
                return { success: false, message: '用户名已存在' };
            }

            // 验证用户名和密码
            if (!username || username.length < 2 || username.length > 20) {
                return { success: false, message: '用户名长度应为2-20个字符' };
            }

            if (!password || password.length < 6) {
                return { success: false, message: '密码长度至少为6位' };
            }

            // 创建用户（简化存储，不加密，仅用于演示）
            const user = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                username: username,
                password: password, // 注意：生产环境应使用加密
                createdAt: new Date().toISOString()
            };

            users.push(user);
            localStorage.setItem(this.KEYS.USERS, JSON.stringify(users));

            return { success: true, message: '注册成功' };
        } catch (e) {
            console.error('Error registering user:', e);
            return { success: false, message: '注册失败，请重试' };
        }
    },

    /**
     * 用户登录
     */
    login(username, password) {
        try {
            const users = this.getUsers();
            const user = users.find(u => u.username === username && u.password === password);

            if (!user) {
                return { success: false, message: '用户名或密码错误' };
            }

            // 保存当前登录用户（不保存密码）
            const sessionUser = {
                id: user.id,
                username: user.username,
                loginAt: new Date().toISOString()
            };
            localStorage.setItem(this.KEYS.CURRENT_USER, JSON.stringify(sessionUser));

            return { success: true, message: '登录成功', user: sessionUser };
        } catch (e) {
            console.error('Error logging in:', e);
            return { success: false, message: '登录失败，请重试' };
        }
    },

    /**
     * 退出登录
     */
    logout() {
        localStorage.removeItem(this.KEYS.CURRENT_USER);
        return true;
    },

    /**
     * 获取当前登录用户
     */
    getCurrentUser() {
        try {
            const data = localStorage.getItem(this.KEYS.CURRENT_USER);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error getting current user:', e);
            return null;
        }
    },

    /**
     * 获取所有用户
     */
    getUsers() {
        try {
            const data = localStorage.getItem(this.KEYS.USERS);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Error getting users:', e);
            return [];
        }
    },

    /**
     * 检查是否已登录
     */
    isLoggedIn() {
        return !!this.getCurrentUser();
    }
};

// 导出模块
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Storage;
}
