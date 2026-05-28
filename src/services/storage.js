// Storage service to handle local persistence of user settings and test records

// Auth keys (global, not user-scoped)
const AUTH_KEYS = {
  USERS: 'govprep_users',
  CURRENT_USER: 'govprep_current_user'
};

// Per-user data keys (will be prefixed with username)
const DATA_KEYS = {
  API_KEY: 'api_key',
  GROQ_API_KEY: 'groq_key',
  TARGET_EXAM: 'target_exam',
  THEME: 'theme',
  TEST_HISTORY: 'test_history',
  STREAK_INFO: 'streak_info',
  DAILY_CURRENTS: 'daily_currents',
  STUDIED_TOPICS: 'studied_topics'
};

// Simple hash for passwords (client-side only, not production-grade)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + '_govprep_salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const storage = {
  // ========== AUTH METHODS ==========
  
  getCurrentUser() {
    return localStorage.getItem(AUTH_KEYS.CURRENT_USER) || null;
  },

  isLoggedIn() {
    return !!this.getCurrentUser();
  },

  getAllUsers() {
    try {
      const data = localStorage.getItem(AUTH_KEYS.USERS);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  },

  async register(username, password, displayName) {
    const users = this.getAllUsers();
    const key = username.toLowerCase().trim();
    
    if (users[key]) {
      throw new Error('Username already exists');
    }
    if (!key || key.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }
    if (!password || password.length < 4) {
      throw new Error('Password must be at least 4 characters');
    }

    const hashedPw = await hashPassword(password);
    users[key] = {
      username: key,
      displayName: displayName || username,
      passwordHash: hashedPw,
      createdAt: new Date().toISOString()
    };

    localStorage.setItem(AUTH_KEYS.USERS, JSON.stringify(users));
    localStorage.setItem(AUTH_KEYS.CURRENT_USER, key);

    // Initialize default keys for the new user
    this._initUserDefaults(key);
    
    return users[key];
  },

  async login(username, password) {
    const users = this.getAllUsers();
    const key = username.toLowerCase().trim();
    
    if (!users[key]) {
      throw new Error('User not found');
    }

    const hashedPw = await hashPassword(password);
    if (users[key].passwordHash !== hashedPw) {
      throw new Error('Incorrect password');
    }

    localStorage.setItem(AUTH_KEYS.CURRENT_USER, key);
    return users[key];
  },

  logout() {
    localStorage.removeItem(AUTH_KEYS.CURRENT_USER);
  },

  getUserDisplayName() {
    const user = this.getCurrentUser();
    if (!user) return 'Guest';
    const users = this.getAllUsers();
    return users[user]?.displayName || user;
  },

  // ========== PRIVATE: USER-SCOPED KEY HELPER ==========

  _userKey(dataKey) {
    const user = this.getCurrentUser();
    if (!user) return `govprep_guest_${dataKey}`;
    return `govprep_${user}_${dataKey}`;
  },

  _initUserDefaults(username) {
    const prefix = `govprep_${username}_`;
    // Set default Groq key from env
    if (!localStorage.getItem(prefix + DATA_KEYS.GROQ_API_KEY)) {
      const groqKey = import.meta.env.VITE_GROQ_API_KEY || '';
      if (groqKey) localStorage.setItem(prefix + DATA_KEYS.GROQ_API_KEY, groqKey);
    }
    // Set Gemini key from env
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (geminiKey) localStorage.setItem(prefix + DATA_KEYS.API_KEY, geminiKey);
    // Set default exam
    if (!localStorage.getItem(prefix + DATA_KEYS.TARGET_EXAM)) {
      localStorage.setItem(prefix + DATA_KEYS.TARGET_EXAM, 'BCI');
    }
  },

  // ========== API KEY MANAGEMENT ==========

  getApiKey() {
    return localStorage.getItem(this._userKey(DATA_KEYS.API_KEY)) || '';
  },
  setApiKey(key) {
    localStorage.setItem(this._userKey(DATA_KEYS.API_KEY), key.trim());
  },
  hasApiKey() {
    return !!this.getApiKey();
  },

  getGroqApiKey() {
    return localStorage.getItem(this._userKey(DATA_KEYS.GROQ_API_KEY)) || '';
  },
  setGroqApiKey(key) {
    localStorage.setItem(this._userKey(DATA_KEYS.GROQ_API_KEY), key.trim());
  },
  hasGroqApiKey() {
    return !!this.getGroqApiKey();
  },

  // Target Exam is locked to BCI
  getTargetExam() {
    return 'BCI';
  },
  setTargetExam(exam) {
    localStorage.setItem(this._userKey(DATA_KEYS.TARGET_EXAM), 'BCI');
  },

  // Theme Settings
  getTheme() {
    return localStorage.getItem(this._userKey(DATA_KEYS.THEME)) || 'dark';
  },
  setTheme(theme) {
    localStorage.setItem(this._userKey(DATA_KEYS.THEME), theme);
  },

  // Test History
  getTestHistory() {
    try {
      const data = localStorage.getItem(this._userKey(DATA_KEYS.TEST_HISTORY));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("Error parsing test history", e);
      return [];
    }
  },
  saveTestResult(testResult) {
    const history = this.getTestHistory();
    const record = {
      id: testResult.id || 'test_' + Date.now(),
      date: new Date().toISOString(),
      ...testResult
    };
    history.unshift(record);
    localStorage.setItem(this._userKey(DATA_KEYS.TEST_HISTORY), JSON.stringify(history));
    this.updateStreak();
    return record;
  },

  // Streak
  getStreakInfo() {
    try {
      const data = localStorage.getItem(this._userKey(DATA_KEYS.STREAK_INFO));
      return data ? JSON.parse(data) : { count: 0, lastDate: null };
    } catch (e) {
      return { count: 0, lastDate: null };
    }
  },
  updateStreak() {
    const info = this.getStreakInfo();
    const today = new Date().toDateString();
    
    if (!info.lastDate) {
      info.count = 1;
      info.lastDate = today;
    } else {
      const last = new Date(info.lastDate).toDateString();
      if (last === today) {
        // Already recorded today
      } else {
        const diffTime = Math.abs(new Date(today) - new Date(last));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          info.count += 1;
        } else {
          info.count = 1;
        }
        info.lastDate = today;
      }
    }
    localStorage.setItem(this._userKey(DATA_KEYS.STREAK_INFO), JSON.stringify(info));
  },

  // Daily Currents caching
  getCachedCurrentAffairs() {
    try {
      const data = localStorage.getItem(this._userKey(DATA_KEYS.DAILY_CURRENTS));
      if (!data) return null;
      const parsed = JSON.parse(data);
      const today = new Date().toDateString();
      if (parsed.date === today) {
        return parsed.content;
      }
      return null;
    } catch (e) {
      return null;
    }
  },
  setCachedCurrentAffairs(content) {
    const today = new Date().toDateString();
    localStorage.setItem(this._userKey(DATA_KEYS.DAILY_CURRENTS), JSON.stringify({
      date: today,
      content
    }));
  },

  // Syllabus Progress
  getStudiedTopics() {
    try {
      const data = localStorage.getItem(this._userKey(DATA_KEYS.STUDIED_TOPICS));
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  },
  markTopicStudied(topic) {
    if (!topic) return;
    const topics = this.getStudiedTopics();
    if (!topics.includes(topic)) {
      topics.push(topic);
      localStorage.setItem(this._userKey(DATA_KEYS.STUDIED_TOPICS), JSON.stringify(topics));
    }
  }
};
