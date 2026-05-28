import './styles/index.css';
import './styles/dashboard.css';
import './styles/quiz.css';
import './styles/chat.css';

import { storage } from './services/storage.js';
import { gemini } from './services/gemini.js';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { DashboardView } from './views/DashboardView.js';
import { TestActiveView } from './views/TestActiveView.js';
import { TestReviewView } from './views/TestReviewView.js';
import { StudyMaterialView } from './views/StudyMaterialView.js';
import { ChatWidget } from './components/ChatWidget.js';
import { TestGeneratorView } from './views/TestGeneratorView.js';
import { PracticeTopicView } from './views/PracticeTopicView.js';
import { PyqView } from './views/PyqView.js';
import { AnalyticsView } from './views/AnalyticsView.js';
import { SyllabusProgressView } from './views/SyllabusProgressView.js';
import { LoginView } from './views/LoginView.js';

class App {
  constructor() {
    this.currentViewId = 'dashboard';
    this.activeViewInstance = null;
    this.chatWidget = null;
    this.sidebar = null;
    this.header = null;
    this.views = {};
  }

  init() {
    if (storage.isLoggedIn()) {
      this.initApp();
    } else {
      this.showLogin();
    }
  }

  showLogin() {
    // Hide the app layout, show login fullscreen
    const appContainer = document.getElementById('app');
    const sidebarTarget = document.getElementById('sidebar-target');
    const headerTarget = document.getElementById('header-target');
    const viewTarget = document.getElementById('view-target');

    if (sidebarTarget) sidebarTarget.style.display = 'none';
    if (headerTarget) headerTarget.style.display = 'none';
    if (appContainer) appContainer.style.display = 'block';

    const loginView = new LoginView(() => {
      // On login success, initialize the full app
      this.initApp();
    });

    if (viewTarget) {
      viewTarget.style.padding = '0';
      loginView.render(viewTarget);
    }
  }

  initApp() {
    const sidebarTarget = document.getElementById('sidebar-target');
    const headerTarget = document.getElementById('header-target');
    const viewTarget = document.getElementById('view-target');
    const appContainer = document.getElementById('app');

    // Restore app layout
    if (sidebarTarget) sidebarTarget.style.display = '';
    if (headerTarget) headerTarget.style.display = '';
    if (viewTarget) viewTarget.style.padding = '';
    if (appContainer) appContainer.style.display = '';

    // Theme initialization
    const theme = storage.getTheme();
    document.documentElement.setAttribute('data-theme', theme);

    // Sidebar with logout handler
    this.sidebar = new Sidebar(
      (viewId) => this.navigate(viewId),
      () => this.handleLogout()
    );

    // Header
    this.header = new Header(() => this.onSettingsChange());

    // Initialize all views
    this.views = {
      'dashboard': new DashboardView(
        (viewId) => this.navigate(viewId),
        () => this.startDailyQuiz()
      ),
      'topic-practice': new PracticeTopicView(
        (questions, timeLimit, title) => this.startTestSession(questions, timeLimit, title)
      ),
      'test-gen': new TestGeneratorView(
        (questions, timeLimit, title) => this.startTestSession(questions, timeLimit, title)
      ),
      'pyqs': new PyqView(
        (questions, timeLimit, title) => this.startTestSession(questions, timeLimit, title)
      ),
      'test-active': new TestActiveView((record) => this.showTestReview(record)),
      'test-review': new TestReviewView(
        (viewId) => this.navigate(viewId),
        (qIdx) => this.linkToChatContext(qIdx)
      ),
      'study-material': new StudyMaterialView(),
      'analysis': new AnalyticsView(),
      'progress': new SyllabusProgressView((viewId) => this.navigate(viewId))
    };

    // Render layout components
    if (headerTarget) this.header.render(headerTarget);
    if (sidebarTarget) this.sidebar.render(sidebarTarget);

    // Initialize global chat widget
    this.chatWidget = new ChatWidget();

    this.navigate('dashboard');
  }

  handleLogout() {
    // Unmount active view
    if (this.activeViewInstance && typeof this.activeViewInstance.onUnmount === 'function') {
      this.activeViewInstance.onUnmount();
    }
    
    storage.logout();
    
    // Clear layout
    const sidebarTarget = document.getElementById('sidebar-target');
    const headerTarget = document.getElementById('header-target');
    const viewTarget = document.getElementById('view-target');
    if (sidebarTarget) sidebarTarget.innerHTML = '';
    if (headerTarget) headerTarget.innerHTML = '';
    if (viewTarget) viewTarget.innerHTML = '';

    // Remove chat widget
    const chatEl = document.querySelector('.chat-bubble');
    if (chatEl) chatEl.remove();
    const chatPanel = document.querySelector('.chat-panel');
    if (chatPanel) chatPanel.remove();
    
    this.chatWidget = null;
    this.sidebar = null;
    this.header = null;
    this.views = {};
    this.activeViewInstance = null;

    this.showLogin();
  }

  // Handle SPA View Swapping
  navigate(viewId) {
    // Unmount previous view
    if (this.activeViewInstance && typeof this.activeViewInstance.onUnmount === 'function') {
      this.activeViewInstance.onUnmount();
    }

    this.currentViewId = viewId;
    if (this.sidebar) {
      this.sidebar.setActive(viewId);
    }
    
    const viewTarget = document.getElementById('view-target');
    if (!viewTarget) return;

    viewTarget.innerHTML = '';

    // Handle special views
    if (viewId === 'daily-quiz') {
      this.header.setTitle('Daily Challenge');
      this.startDailyQuiz();
      return;
    }

    // Standard views
    const view = this.views[viewId];
    this.activeViewInstance = view;

    // Set Header Title
    const titles = {
      'dashboard': 'Dashboard',
      'test-gen': 'Full-Length Mock Exams',
      'test-active': 'Active Exam Player',
      'test-review': 'Test Performance Review',
      'chat': 'BCI AI Study Tutor',
      'topic-practice': 'Topic-Wise Practice',
      'pyqs': 'Previous Year Papers (PYQs)'
    };
    this.header.setTitle(titles[viewId] || 'GovPrep AI');

    // Render View
    view.render(viewTarget);
    
    // Mount Lifecycle hook
    if (typeof view.onMount === 'function') {
      view.onMount();
    }
  }

  // Settings Callback
  onSettingsChange() {
    const sidebarContainer = document.getElementById('sidebar-target');
    if (sidebarContainer) this.sidebar.render(sidebarContainer);
    
    this.navigate(this.currentViewId);
  }

  // Start a test session
  startTestSession(questions, timeLimit, examType) {
    const activeView = this.views['test-active'];
    activeView.setup(questions, timeLimit, examType);
    this.navigate('test-active');
  }

  // Daily current affairs quiz
  async startDailyQuiz() {
    const viewTarget = document.getElementById('view-target');
    
    viewTarget.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 50vh; text-align: center;" class="animate-fade-in">
        <div style="position: relative; width: 60px; height: 60px; margin-bottom: 20px;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; border: 3px solid rgba(99, 102, 241, 0.1); border-top-color: var(--brand-primary); animation: spinLoader 1s linear infinite;"></div>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.2rem; margin-bottom: 8px;">Fetching Today's Current Affairs Quiz</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem;">Using Google Search grounding to retrieve latest events...</p>
      </div>
      <style>
        @keyframes spinLoader { to { transform: rotate(360deg); } }
      </style>
    `;

    try {
      const data = await gemini.generateDailyCurrentsAndQuiz();
      if (data && data.quiz && data.quiz.length > 0) {
        this.startTestSession(data.quiz, 10, 'Current Affairs');
      } else {
        throw new Error("Could not construct daily quiz.");
      }
    } catch (err) {
      alert(`Failed to load Daily Challenge: ${err.message}`);
      this.navigate('dashboard');
    }
  }

  // Show test review
  showTestReview(record) {
    const reviewView = this.views['test-review'];
    reviewView.setRecord(record);
    this.navigate('test-review');
  }

  // Link question to chat context
  linkToChatContext(qIdx) {
    if (!this.views['test-review'].record) return;
    const question = this.views['test-review'].record.questions[qIdx];
    
    if (this.chatWidget) {
      this.chatWidget.setContextQuestion(question);
    }
  }

  // Open study material
  openStudyMaterial(subject, topic) {
    this.views['study-material'] = new StudyMaterialView(subject, topic, () => this.navigate('topic-practice'));
    this.navigate('study-material');
  }
}

// Launch
const app = new App();
window.addEventListener('DOMContentLoaded', () => app.init());
export default app;
