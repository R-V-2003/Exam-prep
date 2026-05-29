// Supabase Backend Service
// Free tier: 500MB database, 50K monthly active users, unlimited API requests
//
// SETUP (one-time, 2 minutes):
// 1. Go to https://supabase.com → Sign up free with GitHub
// 2. Click "New Project" → name it "govprep" → set a DB password → create
// 3. Go to Project Settings → API → copy "Project URL" and "anon public" key
// 4. Paste into your .env file as VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// 5. Go to Authentication → Providers → enable Email (disable "Confirm email" for dev)
// 6. Go to SQL Editor → run the SQL below to create the table:
//
//    create table public.user_data (
//      id uuid references auth.users on delete cascade primary key,
//      display_name text,
//      test_history jsonb default '[]'::jsonb,
//      streak_info jsonb default '{"count": 0, "lastDate": null}'::jsonb,
//      studied_topics jsonb default '[]'::jsonb,
//      target_exam text default 'BCI',
//      created_at timestamptz default now()
//    );
//
//    alter table public.user_data enable row level security;
//
//    drop policy if exists "Users can read own data" on public.user_data;
//
//    create policy "Anyone can read user_data" on public.user_data
//      for select using (true);
//
//    create policy "Users can update own data" on public.user_data
//      for update using (auth.uid() = id);
//
//    create policy "Users can insert own data" on public.user_data
//      for insert with check (auth.uid() = id);

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const isConfigured = !!(supabaseUrl && supabaseAnonKey);

let supabase = null;
let cachedUser = null;
if (isConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  supabase.auth.onAuthStateChange((event, session) => {
    cachedUser = session?.user || null;
  });
}

export const supabaseService = {
  isConfigured() {
    return isConfigured;
  },

  getClient() {
    return supabase;
  },

  // ========== AUTH ==========

  async register(email, password, displayName) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });

    if (error) throw error;

    // Create user data row
    if (data.user) {
      await supabase.from('user_data').insert({
        id: data.user.id,
        display_name: displayName || email.split('@')[0],
        test_history: [],
        streak_info: { count: 0, lastDate: null },
        studied_topics: [],
        target_exam: 'BCI'
      });
    }

    return data.user;
  },

  async login(email, password) {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data.user;
  },

  async logout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    cachedUser = null;
  },

  async getCurrentUser() {
    if (!supabase) return null;
    if (cachedUser) return cachedUser;
    const { data } = await supabase.auth.getUser();
    cachedUser = data?.user || null;
    return cachedUser;
  },

  getCachedUser() {
    return cachedUser;
  },

  getCurrentSession() {
    if (!supabase) return null;
    return supabase.auth.getSession();
  },

  onAuthChange(callback) {
    if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user || null, event);
    });
  },

  // ========== USER DATA ==========

  async getUserData() {
    if (!supabase) return null;
    const user = (await this.getCurrentUser());
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
    return data;
  },

  async getAllUsersData() {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('user_data')
      .select('*');

    if (error) {
      console.error('Error fetching all users data:', error);
      return [];
    }
    return data || [];
  },

  async saveTestResult(testResult) {
    const user = await this.getCurrentUser();
    if (!user || !supabase) return null;

    const record = {
      id: testResult.id || 'test_' + Date.now(),
      date: new Date().toISOString(),
      ...testResult
    };

    // Get current history and append
    const userData = await this.getUserData();
    const history = userData?.test_history || [];
    history.unshift(record);

    await supabase
      .from('user_data')
      .update({ test_history: history })
      .eq('id', user.id);

    await this.updateStreak();
    return record;
  },

  async updateStreak() {
    const user = await this.getCurrentUser();
    if (!user || !supabase) return;

    const userData = await this.getUserData();
    const info = userData?.streak_info || { count: 0, lastDate: null };
    const today = new Date().toDateString();

    if (!info.lastDate) {
      info.count = 1;
      info.lastDate = today;
    } else {
      const last = new Date(info.lastDate).toDateString();
      if (last !== today) {
        const diffTime = Math.abs(new Date(today) - new Date(last));
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        info.count = diffDays === 1 ? info.count + 1 : 1;
        info.lastDate = today;
      }
    }

    await supabase
      .from('user_data')
      .update({ streak_info: info })
      .eq('id', user.id);
  },

  async markTopicStudied(topic) {
    const user = await this.getCurrentUser();
    if (!user || !supabase || !topic) return;

    const userData = await this.getUserData();
    const topics = userData?.studied_topics || [];
    if (!topics.includes(topic)) {
      topics.push(topic);
      await supabase
        .from('user_data')
        .update({ studied_topics: topics })
        .eq('id', user.id);
    }
  },

  async getStudiedTopics() {
    const data = await this.getUserData();
    return data?.studied_topics || [];
  },

  async getTestHistory() {
    const data = await this.getUserData();
    return data?.test_history || [];
  },

  async getStreakInfo() {
    const data = await this.getUserData();
    return data?.streak_info || { count: 0, lastDate: null };
  },

  getDisplayName() {
    if (!supabase) return 'Guest';
    return cachedUser?.user_metadata?.display_name || cachedUser?.email?.split('@')[0] || 'User';
  },

  async uploadUserData(data) {
    const user = await this.getCurrentUser();
    if (!user || !supabase) return;
    const { error } = await supabase
      .from('user_data')
      .update(data)
      .eq('id', user.id);
    if (error) {
      console.error('Error uploading user data to Supabase:', error);
    }
  },

  // ========== STUDY GUIDES CACHING ==========

  async getStudyGuide(topic) {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('study_guides')
        .select('content')
        .eq('topic', topic)
        .maybeSingle();
      
      if (error) {
        console.warn('Could not query study_guides table:', error.message);
        return null;
      }
      return data?.content || null;
    } catch (e) {
      console.warn('Failed to fetch study guide from database:', e);
      return null;
    }
  },

  async saveStudyGuide(subject, topic, content) {
    if (!supabase) return;
    try {
      const { error } = await supabase
        .from('study_guides')
        .insert({ subject, topic, content });
      
      if (error) {
        console.error('Error saving study guide to database:', error);
      }
    } catch (e) {
      console.error('Failed to save study guide to database:', e);
    }
  },

  // ========== SYLLABUS & PYQ RETRIEVAL ==========

  async getSyllabusDescription(subjectName) {
    if (!supabase) return null;
    try {
      // Look up description using partial matching (ilike)
      const { data, error } = await supabase
        .from('syllabus_info')
        .select('official_description')
        .ilike('subject_name', `%${subjectName}%`)
        .maybeSingle();

      if (error) {
        console.warn('Could not query syllabus_info:', error.message);
        return null;
      }
      return data?.official_description || null;
    } catch (e) {
      console.warn('Failed to fetch syllabus description:', e);
      return null;
    }
  },

  async getRelevantPYQs(subjectName, topicName) {
    if (!supabase) return [];
    try {
      let query = supabase.from('pyqs').select('*');
      
      // Filter by subject name
      if (subjectName) {
        query = query.ilike('subject', `%${subjectName}%`);
      }
      
      // Check if topicName exists inside topic, question or explanation
      if (topicName) {
        query = query.or(`topic.ilike.%${topicName}%,question.ilike.%${topicName}%,explanation.ilike.%${topicName}%`);
      }

      // Limit to 4 relevant questions to avoid overloading the AI context
      const { data, error } = await query.limit(4);
      if (error) {
        console.warn('Could not query pyqs table:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      console.warn('Failed to fetch PYQs:', e);
      return [];
    }
  },

  async getFullPaper(paperIdentifier) {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('pyqs')
        .select('*')
        .eq('paper_type', paperIdentifier);
      
      if (error) {
        console.error("Error fetching paper:", error);
        return [];
      }
      
      // Map to the frontend question format
      return data.map(q => ({
        id: q.id,
        subject: q.subject || "General",
        topic: q.topic || "PYQ",
        question: q.question,
        options: q.options || [],
        correctIndex: q.correct_index,
        explanation: q.explanation || ""
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  }
};
