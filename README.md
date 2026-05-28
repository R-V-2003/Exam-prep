# GovPrep AI 🎓🤖
### RSSB Rajasthan Computer Instructor (BCI) Exam Preparation Web Application

🔗 **Live Link:** [https://bci-exam-prep.vercel.app/](https://bci-exam-prep.vercel.app/)

GovPrep AI is a state-of-the-art, premium AI-powered test preparation dashboard tailored for the Rajasthan Staff Selection Board (RSSB) Basic Computer Instructor (BCI) exam. Built with a stunning modern dark-themed glassmorphism user interface, it provides aspirants with mock tests, topic-wise practice, AI tutoring, and syllabus progress tracking.

---

## 🚀 Key Features

* **Cloud Sync Auth System**: Integrated with Supabase Auth for separate user isolation. Synchronizes progress (test history, study records, streaks) seamlessly to the cloud.
* **Custom Mock Test Generator**: Generate exams of varying length (5 to 100 questions) and difficulty, targeted at specific syllabus subjects.
* **Topic-Wise Focused Practice**: Practice 5-question sets generated dynamically for any individual sub-topic in the syllabus.
* **Previous Year Papers (PYQs)**: Direct access to real 2022 BCI Paper I and Paper II questions with an interactive exam player and whiteboard.
* **AI Doubt Solver (Study Tutor)**: Ask questions directly to an integrated AI tutor featuring web grounding (Google Search) for real-time accurate information.
* **Syllabus Progress Tracker**: Visualize and tick off studied sub-topics across Paper I (Aptitude & GK) and Paper II (Computer Science & Pedagogy).
* **Daily Challenge & Current Affairs**: Daily state and national current affairs briefings matched with an automated 5-question review quiz.
* **Aesthetic Interactive Whiteboard**: Interactive scratchpad for solving mathematical or reasoning questions directly within the test player.

---

## 🛠️ Technology Stack

* **Frontend**: HTML5, Vanilla JavaScript (ES6+ Modules), CSS3 Variables & Glassmorphism.
* **Build Tool**: Vite
* **Backend Database & Auth**: Supabase (Authentication & PostgreSQL)
* **AI Integrations**: Groq (Llama 3.3 70B) & Google Gemini (2.5 Flash) REST APIs
* **Deployment Target**: Vercel

---

## 📦 Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/R-V-2003/Exam-prep.git
   cd Exam-prep
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory and configure your keys:
   ```env
   # API Keys for AI Engines
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GROQ_API_KEY=your_groq_api_key_here

   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_public_key
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🗄️ Supabase Backend Setup

To make the login and cloud syncing function properly, set up your Supabase database in under 2 minutes:

1. Create a free project at [Supabase](https://supabase.com/).
2. Enable Email Auth: Go to **Authentication** → **Providers** → **Email** and enable it. **Toggle OFF "Confirm email"** to allow instant developer registrations.
3. Run Database Schema: Go to **SQL Editor** → click **New Query** and run the following script to create the progress table with Row Level Security (RLS) policies:

```sql
-- Create User Data Table
create table public.user_data (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  test_history jsonb default '[]'::jsonb,
  streak_info jsonb default '{"count": 0, "lastDate": null}'::jsonb,
  studied_topics jsonb default '[]'::jsonb,
  target_exam text default 'BCI',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table public.user_data enable row level security;

-- Create Policies
create policy "Users can read own data" on public.user_data
  for select using (auth.uid() = id);

create policy "Users can update own data" on public.user_data
  for update using (auth.uid() = id);

create policy "Users can insert own data" on public.user_data
  for insert with check (auth.uid() = id);
```

---

## 🌐 Deployment to Vercel

1. Push your repository to GitHub.
2. Link the repository to your [Vercel](https://vercel.com) account.
3. Add the following keys under the **Environment Variables** tab in Vercel:
   * `VITE_SUPABASE_URL`
   * `VITE_SUPABASE_ANON_KEY`
   * `VITE_GEMINI_API_KEY`
   * `VITE_GROQ_API_KEY`
4. Deploy! Vercel will automatically parse the `vercel.json` and serve the application as a Single Page Application (SPA).
