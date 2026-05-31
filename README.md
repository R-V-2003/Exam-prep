# 🎓 GovPrep AI (BCI-Prep)

GovPrep AI (packaged for mobile as **BCI-Prep**) is a comprehensive, AI-integrated exam preparation ecosystem designed specifically for aspirants of the **RSSB Rajasthan Computer Instructor (Basic & Senior) Exam**. 

It runs as a premium, high-fidelity **Progressive Web App (PWA)** and is compiled as a native **Android APK** using **Ionic Capacitor**. 

---

## 🚀 Quick Access & Deployment

* **🌐 Web Platform:** Hosted and deployed on Vercel.
* **🤖 Android Application:** **[Download BCI-Prep APK here](https://raw.githubusercontent.com/R-V-2003/RAHUL_MALI_PORTFOLIO.github.io/main/exam-prep.apk)** (Compiled & optimized for Android devices).

---

## 🌟 Key Features

### 1. 📊 Bento-Style Interactive Dashboard
* **Performance Metrics:** Real-time calculation and visualization of tests completed, average score percentages, answer accuracy, and preparation streaks.
* **Exam Countdown:** Dynamic visual countdown timer leading up to the target exam date (scheduled for August 23, 2026).
* **Live Grounded AI Briefing:** Daily AI-generated current affairs briefings utilizing web grounding/search integrations to fetch up-to-date regional and national news.

### 2. 📚 Syllabus Progress Tracker
* **Subject Coverage:** Interactive tracker covering **79+ topics** across **Paper I** (General Studies, Rajasthan History, Geography, Art & Culture, Current Affairs, Quant & Reasoning) and **Paper II** (Computer Science concepts: DSA, OOPs, Networking, DBMS, OS, Pedagogy).
* **Granular Control:** Mark individual topics as studied, track subject-specific progress percentage, and dynamically trigger targeted AI study content generation or practice tests.

### 3. 🤖 AI Study Material & Question Generator
* **Deep Study Engine:** Generates highly exhaustive, high-depth study materials matching the exact complexity and format of previous year question papers.
* **Custom Mock Test Generator:** Configure personalized test sessions. Choose specific subjects, select the desired number of questions, and set custom time limits.
* **Grounding & Retrieval:** Pulls context from the official syllabus and relevant past year questions to generate high-fidelity practice questions and explanations.

### 4. 📝 Previous Year Papers (PYQs)
* **Real Exam Simulation:** Full-length, timed mock tests of historical papers (including the **Rajasthan Computer Teacher 2022 Paper 1 & Paper 2** for both Basic and Senior instructors).
* **Ingestion Utilities:** Custom automated Python scripts parse raw question text, classify subjects/topics, map key options, and upload them structured into the database.

### 5. 🔍 Timed Test Environment & Detailed Review
* **Active Exam Mode:** Professional testing interface with a navigation palette, flag-for-review bookmarks, a live timer, and visual indicators.
* **In-Depth Explanations:** View detailed step-by-step solutions for every question, review incorrect/skipped questions, and instantly launch a chat widget with the question's context prepopulated.

### 6. 💬 Context-Aware AI Chat Helper
* **Gemini & Groq Integration:** Accessible from any view to ask custom doubts, request explanations of complex terms, summarize study guides, or grill you on specific syllabus topics.

### 7. 🏆 Gamified Leaderboard
* **Competition System:** Global and weekly leaderboards scoring users on Mock Performance, Study Streaks, and total questions answered to drive active engagement.

---

## 🛠️ Technology Stack

| Layer | Technologies Used | Description |
| :--- | :--- | :--- |
| **Frontend** | Vanilla ES6 JavaScript, HTML5, Custom CSS | High-performance modular JS bundling, sleek glassmorphic themes, responsive grids, and visual animations. |
| **Bundler & Dev Server** | Vite | Ultra-fast local compilation and asset loading. |
| **Backend & Database** | Supabase (PostgreSQL), Firebase | User auth state, streak logging, test history tracking, and study guide caching. |
| **Mobile Shell** | Ionic Capacitor (Core, CLI, Android) | Wraps the built web bundle into a native Android runtime. |
| **AI Processing** | Google Gemini API (2.5/3.5/Flash), Groq API (Llama 3.3 70B) | Powers study material generation, question synthesis, interactive chat, and live grounded briefings. |
| **Data Ingestion** | Python 3 (google-generativeai, requests, regex) | ETL scripts to parse, classify, and populate database tables with PYQs. |

---

## 🗄️ Supabase Database Schema

To enable sync and leaderboard features, the platform integrates with Supabase. Set up the following tables in the SQL editor:

### `user_data` Table
Tracks user progress, streaks, and mock records:
```sql
create table public.user_data (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  test_history jsonb default '[]'::jsonb,
  streak_info jsonb default '{"count": 0, "lastDate": null}'::jsonb,
  studied_topics jsonb default '[]'::jsonb,
  target_exam text default 'BCI',
  created_at timestamptz default now()
);

-- Row Level Security (RLS) configuration
alter table public.user_data enable row level security;
create policy "Anyone can read user_data" on public.user_data for select using (true);
create policy "Users can update own data" on public.user_data for update using (auth.uid() = id);
create policy "Users can insert own data" on public.user_data for insert with check (auth.uid() = id);
```

### `study_guides` Table
Caches generated study content to minimize redundant AI calls:
```sql
create table public.study_guides (
  id bigint generated always as identity primary key,
  subject text not null,
  topic text not null unique,
  content text not null,
  created_at timestamptz default now()
);
```

### `pyqs` Table
Stores past year exam questions:
```sql
create table public.pyqs (
  id bigint generated always as identity primary key,
  paper_type text not null, -- 'basic_p1', 'basic_p2', 'senior_p1', 'senior_p2'
  subject text,
  topic text,
  question text not null,
  options jsonb not null, -- Array of strings e.g. ["A", "B", "C", "D"]
  correct_index integer not null,
  explanation text,
  created_at timestamptz default now()
);
```

---

## ⚙️ Developer Setup & Build Instructions

### 1. Configure Environment Variables
Create a `.env` file in the root directory and define the following credentials:
```env
VITE_SUPABASE_URL=https://your-supabase-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-public-key
VITE_GEMINI_API_KEY=your-gemini-api-key
VITE_GROQ_API_KEY=your-groq-api-key # Optional fallback
VITE_API_BASE_URL=https://your-serverless-endpoint.com # Optional proxy
```

### 2. Local Web Setup
```bash
# Install NPM dependencies
npm install

# Run the local Vite development server
npm run dev

# Preview production build locally
npm run build
npm run preview
```

### 3. Native Android Build (Capacitor)
If you are compiling the Android application (APK) and have multiple Java configurations or build conflicts on your machine, you can run the build process with the bundled, portable JDK:

```powershell
# Build the production assets
npm run build

# Sync files with Capacitor
npx cap sync android

# Override system JAVA_HOME to use JDK 21 and run Gradle build
$env:JAVA_HOME="$PWD\jdk21\jdk-21.0.4+7"
cd android
.\gradlew assembleDebug
```
The compiled, installable APK will be generated here:  
`android/app/build/outputs/apk/debug/app-debug.apk`

---

## 📂 Project Directory Structure
```
Exam-prep/
├── android/                 # Capacitor Android native project
├── api/                     # Backend proxy routes / serverless configurations
├── src/
│   ├── assets/              # App images, logos, and global icons
│   ├── components/          # Reusable UI widgets (Header, Sidebar, ChatWidget)
│   ├── data/                # Static syllabus data & fallback tests
│   ├── services/            # Client integrations (Gemini, Supabase, Storage)
│   ├── styles/              # Vanilla CSS stylesheets (Bento grids, quiz layout)
│   ├── views/               # SPA Views (Dashboard, Analytics, Leaderboard, etc.)
│   └── main.js              # Core Application Shell & client router
├── parse_and_upload_txt.py  # Python Ingestion script for PYQ text documents
├── populate_db.py           # Ingestion helper to structure syllabus questions
├── package.json             # App scripts and dependencies
└── README.md                # Project documentation
```

---
*Developed with 💙 for Rajasthan Computer Teacher aspirants. Built by [Rahul Mali](https://r-v-2003.github.io/RAHUL_MALI_PORTFOLIO.github.io/)*
