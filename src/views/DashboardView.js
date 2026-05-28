import { storage } from '../services/storage.js';
import { gemini } from '../services/gemini.js';
import { bciSyllabus } from '../data/bciSyllabus.js';

export class DashboardView {
  constructor(navigateTo, onStartDaily) {
    this.navigateTo = navigateTo;
    this.onStartDaily = onStartDaily;
  }

  render(container) {
    const history = storage.getTestHistory();
    const streakInfo = storage.getStreakInfo();
    const targetExam = storage.getTargetExam();
    
    // Compute quick metrics
    const totalTests = history.length;
    let avgScore = 0;
    let avgAccuracy = 0;
    
    if (totalTests > 0) {
      avgScore = Math.round(history.reduce((acc, curr) => acc + curr.scorePercentage, 0) / totalTests);
      avgAccuracy = Math.round(history.reduce((acc, curr) => acc + curr.accuracy, 0) / totalTests);
    } else {
      // Mock defaults for display
      avgScore = 0;
      avgAccuracy = 0;
    }

    container.innerHTML = `
      <div class="animate-fade-in dashboard-bento">
        <!-- Row 1 Left: Metrics -->
        <div class="dashboard-bento-metrics">
          <div class="glass-panel metric-card">
            <div class="metric-header">
              <span class="metric-title">Tests Finished</span>
              <i class="fas fa-clipboard-check metric-icon"></i>
            </div>
            <div class="metric-value">${totalTests}</div>
            <div class="metric-change positive">
              <i class="fas fa-arrow-up"></i> ${totalTests > 0 ? 'Active prep' : 'Awaiting start'}
            </div>
          </div>
          <div class="glass-panel metric-card">
            <div class="metric-header">
              <span class="metric-title">Avg Score</span>
              <i class="fas fa-chart-line metric-icon"></i>
            </div>
            <div class="metric-value">${avgScore}%</div>
            <div class="metric-change ${avgScore >= 60 ? 'positive' : 'neutral'}">
              <i class="fas fa-award"></i> Target 75%
            </div>
          </div>
          <div class="glass-panel metric-card">
            <div class="metric-header">
              <span class="metric-title">Accuracy</span>
              <i class="fas fa-bullseye metric-icon"></i>
            </div>
            <div class="metric-value">${avgAccuracy}%</div>
            <div class="metric-change ${avgAccuracy >= 70 ? 'positive' : 'neutral'}">
              <i class="fas fa-crosshairs"></i> Correct rate
            </div>
          </div>
          <div class="glass-panel metric-card">
            <div class="metric-header">
              <span class="metric-title">Streak</span>
              <i class="fas fa-fire metric-icon" style="background: linear-gradient(135deg, hsl(38, 92%, 50%), hsl(15, 90%, 55%)); -webkit-background-clip: text; -webkit-text-fill-color: transparent;"></i>
            </div>
            <div class="metric-value">${streakInfo.count || 0} Days</div>
            <div class="metric-change positive">
              <i class="fas fa-calendar-check"></i> Active
            </div>
          </div>
        </div>

        <!-- Row 1 Right: Countdown -->
        <div class="glass-panel bento-countdown" style="padding: 15px; border-radius: 16px; background: linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(15,23,42,0.6) 100%); display: flex; flex-direction: column; justify-content: center;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
            <h3 style="font-family: var(--font-heading); font-size: 0.95rem; color: var(--text-primary);"><i class="fas fa-hourglass-half" style="color: var(--brand-primary); margin-right: 8px;"></i> Exam Countdown</h3>
            <span style="font-size: 0.65rem; color: var(--brand-secondary); font-weight: 700; background: rgba(168,85,247,0.1); padding: 4px 8px; border-radius: 6px;">23 Aug, 2026</span>
          </div>
          <div id="countdown-timer" style="display: flex; justify-content: space-between; gap: 8px;">
            <!-- Filled dynamically -->
          </div>
        </div>

        <!-- Row 2 Left: Syllabus Progress -->
        <div class="glass-panel bento-progress" style="padding: 20px; border-radius: 16px; display: flex; flex-direction: column; position: relative; overflow: hidden;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
            <h3 style="font-family: var(--font-heading); font-size: 1rem; color: var(--text-primary); margin: 0;"><i class="fas fa-tasks" style="color: var(--accent-cyan); margin-right: 8px;"></i> Syllabus Progress</h3>
            <button id="view-details-btn" style="background: rgba(0, 242, 254, 0.1); border: 1px solid var(--accent-cyan); color: var(--accent-cyan); padding: 5px 10px; border-radius: 6px; font-size: 0.7rem; cursor: pointer; display: flex; align-items: center; gap: 5px; transition: all 0.2s;">
              Details <i class="fas fa-arrow-right"></i>
            </button>
          </div>

          <!-- Overall bar -->
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid var(--panel-border);">
            <span style="font-size: 1.8rem; font-weight: 700; font-family: var(--font-heading); color: var(--text-primary); line-height: 1;" id="progress-studied">0</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);">/ <span id="progress-total">79</span> topics</span>
            <div style="flex: 1; height: 8px; background: rgba(255,255,255,0.05); border-radius: 4px; overflow: hidden;">
              <div id="progress-bar-fill" style="height: 100%; width: 0%; background: var(--brand-gradient); border-radius: 4px; transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);"></div>
            </div>
            <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600; white-space: nowrap;" id="progress-percentage">0%</span>
          </div>

          <!-- Subject-wise breakdown (scrollable) -->
          <div id="subject-progress-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 8px; padding-right: 5px; min-height: 0;">
            <!-- Filled dynamically by initProgress -->
          </div>
        </div>

        <!-- Row 2 Right: Daily Briefing -->
        <div class="glass-panel daily-briefing-card bento-briefing" style="display: flex; flex-direction: column; overflow: hidden; padding: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--panel-border); padding-bottom: 12px; margin-bottom: 12px;">
            <h3 style="font-family: var(--font-heading); font-size: 1rem; color: var(--text-primary);"><i class="far fa-newspaper" style="color: var(--accent-cyan); margin-right: 8px;"></i> Daily AI Current Briefing</h3>
            <span style="font-size: 0.65rem; color: var(--accent-cyan); font-weight: 700; background: rgba(0, 242, 254, 0.1); padding: 4px 8px; border-radius: 6px;">Live Grounded</span>
          </div>
          <div id="briefing-box" class="briefing-scroll" style="flex: 1; overflow-y: auto; padding-right: 10px; line-height: 1.6; font-size: 0.9rem;">
            <!-- Skeleton -->
            <div style="display: flex; flex-direction: column; gap: 15px; padding-top: 10px;">
              <div style="height: 14px; background: rgba(255,255,255,0.05); width: 85%; border-radius: 4px; animation: pulseSkel 1.5s infinite;"></div>
              <div style="height: 12px; background: rgba(255,255,255,0.03); width: 100%; border-radius: 4px; animation: pulseSkel 1.5s infinite;"></div>
              <div style="height: 12px; background: rgba(255,255,255,0.03); width: 95%; border-radius: 4px; animation: pulseSkel 1.5s infinite;"></div>
              <div style="height: 12px; background: rgba(255,255,255,0.03); width: 98%; border-radius: 4px; animation: pulseSkel 1.5s infinite;"></div>
              <div style="height: 14px; background: rgba(255,255,255,0.05); width: 70%; border-radius: 4px; animation: pulseSkel 1.5s infinite; margin-top: 10px;"></div>
              <div style="height: 12px; background: rgba(255,255,255,0.03); width: 100%; border-radius: 4px; animation: pulseSkel 1.5s infinite;"></div>
            </div>
          </div>
        </div>

        <!-- Row 3: Navigation -->
        <div class="dashboard-bento-nav">
          <div class="feature-card" data-route="topic-practice">
            <div class="feature-card-bg" style="background-image: url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80');"></div>
            <div class="feature-card-overlay"></div>
            <div class="feature-card-content">
              <i class="fas fa-book-open feature-icon"></i>
              <h3>Practice</h3>
            </div>
          </div>
          <div class="feature-card" data-route="test-gen">
            <div class="feature-card-bg" style="background-image: url('https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=400&q=80');"></div>
            <div class="feature-card-overlay"></div>
            <div class="feature-card-content">
              <i class="fas fa-vial feature-icon"></i>
              <h3>Mocks</h3>
            </div>
          </div>
          <div class="feature-card" data-route="pyqs">
            <div class="feature-card-bg" style="background-image: url('https://images.unsplash.com/photo-1581447109200-bf2769116351?auto=format&fit=crop&w=400&q=80');"></div>
            <div class="feature-card-overlay"></div>
            <div class="feature-card-content">
              <i class="fas fa-history feature-icon"></i>
              <h3>PYQs</h3>
            </div>
          </div>
          <div class="feature-card" data-route="study-material">
            <div class="feature-card-bg" style="background-image: url('https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=400&q=80');"></div>
            <div class="feature-card-overlay"></div>
            <div class="feature-card-content">
              <i class="fas fa-book-reader feature-icon"></i>
              <h3>Study</h3>
            </div>
          </div>
          <div class="feature-card" id="card-start-daily">
            <div class="feature-card-bg" style="background-image: url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=400&q=80');"></div>
            <div class="feature-card-overlay"></div>
            <div class="feature-card-content">
              <i class="fas fa-bolt feature-icon"></i>
              <h3>Daily</h3>
            </div>
          </div>
        </div>
      </div>

      <style>
        @keyframes pulseSkel {
          0% { opacity: 0.4; }
          50% { opacity: 0.8; }
          100% { opacity: 0.4; }
        }
      </style>
    `;

    this.attachEvents(container);
  }

  onMount() {
    // Initialize countdown and progress bar
    setTimeout(() => {
      this.initCountdown();
      this.initProgress();
    }, 100);

    // Load Daily Current affairs via Gemini
    this.loadCurrentAffairs();
  }

  initCountdown() {
    const targetDate = new Date('2026-08-23T00:00:00');
    const timerContainer = document.getElementById('countdown-timer');
    if (!timerContainer) return;

    const updateTimer = () => {
      const now = new Date();
      const diff = targetDate - now;

      if (diff <= 0) {
        timerContainer.innerHTML = '<div style="color: var(--success); font-weight: bold;">Exam Day!</div>';
        return;
      }

      // Very rough approximation for display purposes
      const months = Math.floor(diff / (1000 * 60 * 60 * 24 * 30));
      const days = Math.floor((diff % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const timeUnits = [
        { label: 'Months', value: months },
        { label: 'Days', value: days },
        { label: 'Hours', value: hours }
      ];

      timerContainer.innerHTML = timeUnits.map(u => `
        <div style="flex: 1; background: rgba(15, 23, 42, 0.5); border: 1px solid var(--panel-border); border-radius: 10px; padding: 10px 5px; text-align: center;">
          <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 700; color: var(--text-primary); line-height: 1;">${u.value}</div>
          <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">${u.label}</div>
        </div>
      `).join('');
    };

    updateTimer();
    this.countdownInterval = setInterval(updateTimer, 1000 * 60 * 60); // Update every hour is enough
  }

  initProgress() {
    const studiedTopics = storage.getStudiedTopics();
    const count = studiedTopics.length;
    const total = 79;
    const percentage = Math.round((count / total) * 100);

    // Overall bar
    const countEl = document.getElementById('progress-studied');
    const fillEl = document.getElementById('progress-bar-fill');
    const textEl = document.getElementById('progress-percentage');

    if (countEl && fillEl && textEl) {
      countEl.textContent = count;
      textEl.textContent = `${percentage}%`;
      setTimeout(() => { fillEl.style.width = `${percentage}%`; }, 300);
    }

    // Subject-wise breakdown
    const listEl = document.getElementById('subject-progress-list');
    if (!listEl) return;

    const colors = [
      'hsl(262, 83%, 58%)', 'hsl(199, 89%, 48%)', 'hsl(340, 82%, 52%)',
      'hsl(38, 92%, 50%)', 'hsl(142, 71%, 45%)', 'hsl(280, 67%, 55%)',
      'hsl(210, 79%, 46%)', 'hsl(16, 85%, 55%)', 'hsl(172, 66%, 40%)',
      'hsl(45, 93%, 47%)', 'hsl(330, 70%, 50%)', 'hsl(200, 70%, 50%)'
    ];

    let colorIdx = 0;
    let subjectHtml = '';

    Object.values(bciSyllabus.papers).forEach(paper => {
      paper.subjects.forEach(subject => {
        const subTotal = subject.topics.length;
        const subDone = subject.topics.filter(t => studiedTopics.includes(t)).length;
        const subPct = Math.round((subDone / subTotal) * 100);
        const color = colors[colorIdx % colors.length];
        colorIdx++;

        subjectHtml += `
          <div style="display: flex; align-items: center; gap: 8px;">
            <i class="fas ${subject.icon}" style="color: ${color}; font-size: 0.8rem; width: 16px; text-align: center;"></i>
            <span style="font-size: 0.78rem; color: var(--text-secondary); width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-shrink: 0;" title="${subject.name}">${subject.name}</span>
            <div style="flex: 1; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden;">
              <div style="height: 100%; width: ${subPct}%; background: ${color}; border-radius: 3px; transition: width 1s ease;"></div>
            </div>
            <span style="font-size: 0.7rem; color: ${subPct === 100 ? 'var(--success)' : 'var(--text-muted)'}; font-weight: 600; width: 36px; text-align: right; flex-shrink: 0;">${subDone}/${subTotal}</span>
          </div>
        `;
      });
    });

    listEl.innerHTML = subjectHtml;
  }

  onUnmount() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  attachEvents(container) {
    // Feature card navigation
    container.querySelectorAll('.feature-card[data-route]').forEach(card => {
      card.addEventListener('click', () => {
        const route = card.getAttribute('data-route');
        if (this.navigateTo) this.navigateTo(route);
      });
    });

    const cardStartDaily = container.querySelector('#card-start-daily');
    if (cardStartDaily) {
      cardStartDaily.addEventListener('click', () => {
        if (this.onStartDaily) this.onStartDaily();
      });
    }

    const detailsBtn = container.querySelector('#view-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', () => {
        if (this.navigateTo) this.navigateTo('progress');
      });
      // Add hover effect
      detailsBtn.addEventListener('mouseenter', () => {
        detailsBtn.style.background = 'var(--accent-cyan)';
        detailsBtn.style.color = '#000';
      });
      detailsBtn.addEventListener('mouseleave', () => {
        detailsBtn.style.background = 'rgba(0, 242, 254, 0.1)';
        detailsBtn.style.color = 'var(--accent-cyan)';
      });
    }
  }

  async loadCurrentAffairs() {
    const briefingBox = document.getElementById('briefing-box');
    
    if (!briefingBox) return;

    try {
      const data = await gemini.generateDailyCurrentsAndQuiz();
      
      // Render briefing markdown (simple HTML conversion)
      let htmlContent = data.summary
        .replace(/### (.*)/g, '<h4 style="font-family:var(--font-heading); margin: 15px 0 8px 0; color: var(--brand-primary);">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\d\.\s(.*)/g, '<li style="margin-bottom:8px;">$1</li>');

      // Wrap list items in ul
      if (htmlContent.includes('<li')) {
        htmlContent = htmlContent.replace(/(<li.*<\/li>)/gs, '<ul style="padding-left:18px; margin: 10px 0;">$1</ul>');
      }

      briefingBox.innerHTML = htmlContent;

    } catch (err) {
      console.error("Failed to load daily briefing", err);
      briefingBox.innerHTML = `<p style="color: var(--danger);">Failed to load daily briefing. Error: ${err.message}</p>`;
    }
  }
}
