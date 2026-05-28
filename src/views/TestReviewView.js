export class TestReviewView {
  constructor(onNavigate, onAskTutor) {
    this.onNavigate = onNavigate;
    this.onAskTutor = onAskTutor;
    this.record = null;
    this.activeFilter = 'all'; // all, correct, incorrect, skipped
  }

  setRecord(record) {
    this.record = record;
    this.activeFilter = 'all';
  }

  render(container) {
    if (!this.record) {
      container.innerHTML = `<p>No test review is loaded. Please take a mock test first.</p>`;
      return;
    }

    const {
      examType,
      correctCount,
      incorrectCount,
      skippedCount,
      scorePercentage,
      accuracy,
      timeSpentSeconds,
      scoredMarks,
      totalPossibleMarks,
      questions
    } = this.record;

    const min = Math.floor(timeSpentSeconds / 60);
    const sec = timeSpentSeconds % 60;
    
    // SVG circular arc parameters
    const radius = 60;
    const circ = 2 * Math.PI * radius;
    const strokeDashoffset = circ - (scorePercentage / 100) * circ;

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
        <!-- Header Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.4rem;">Performance Summary</h2>
          <button id="review-to-dashboard-btn" class="outline-btn" style="padding: 10px 20px; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-home"></i> Back to Dashboard
          </button>
        </div>

        <!-- Scorecard Card -->
        <div class="glass-panel results-card">
          <span class="badge badge-difficulty" style="margin-bottom: 15px; font-size: 0.8rem;">${examType} Custom Practice</span>
          
          <div style="display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 40px;">
            <!-- Circular Progress Indicator -->
            <div class="score-circle-container">
              <svg width="150" height="150" style="transform: rotate(-90deg);">
                <circle cx="75" cy="75" r="${radius}" fill="transparent" stroke="rgba(255,255,255,0.05)" stroke-width="8"></circle>
                <circle cx="75" cy="75" r="${radius}" fill="transparent" stroke="url(#g-score)" stroke-width="8" stroke-dasharray="${circ}" stroke-dashoffset="${strokeDashoffset}" stroke-linecap="round" style="transition: stroke-dashoffset 1s ease;"></circle>
                <defs>
                  <linearGradient id="g-score" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#6366f1"></stop>
                    <stop offset="100%" stop-color="#a855f7"></stop>
                  </linearGradient>
                </defs>
              </svg>
              <div class="score-circle-text">
                <div class="score-num glow-text" style="background: var(--brand-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">${scorePercentage}%</div>
                <div class="score-label">Net Score</div>
              </div>
            </div>

            <!-- Descriptive verdict -->
            <div style="text-align: left; max-width: 350px;">
              <h3 style="font-size: 1.4rem; margin-bottom: 8px;">${this.getVerdictMessage(scorePercentage)}</h3>
              <p style="color: var(--text-secondary); font-size: 0.9rem;">You secured <strong>${scoredMarks}</strong> marks out of a total possible <strong>${totalPossibleMarks}</strong> (calculated with active negative marking penalties).</p>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="score-stats">
            <div class="stat-item">
              <h4>Accuracy</h4>
              <p style="color: var(--brand-primary);">${accuracy}%</p>
            </div>
            <div class="stat-item" style="border-left: 1px solid var(--panel-border); border-right: 1px solid var(--panel-border);">
              <h4>Time Taken</h4>
              <p>${min}m ${sec}s</p>
            </div>
            <div class="stat-item">
              <h4>Correct/Wrong</h4>
              <p><span style="color: var(--success);">${correctCount}</span> / <span style="color: var(--danger);">${incorrectCount}</span></p>
            </div>
          </div>
        </div>

        <!-- Filter navigation row -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--panel-border); padding-bottom: 12px;">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-primary);">Question Analysis</h3>
          <div style="display: flex; gap: 8px;">
            ${this.renderFilterBtn('all', 'All')}
            ${this.renderFilterBtn('correct', 'Correct')}
            ${this.renderFilterBtn('incorrect', 'Wrong')}
            ${this.renderFilterBtn('skipped', 'Skipped')}
          </div>
        </div>

        <!-- Review Question List -->
        <div id="review-questions-list">
          ${this.renderQuestionsList()}
        </div>
      </div>
    `;

    this.attachEvents(container);
  }

  getVerdictMessage(percentage) {
    if (percentage >= 80) return "Excellent Attempt! Rank standard achieved.";
    if (percentage >= 65) return "Good performance! Keep polishing subjects.";
    if (percentage >= 45) return "Average score. Target weak topics first.";
    return "Needs improvement. Use AI Tutor to learn foundations.";
  }

  renderFilterBtn(filter, label) {
    const isActive = this.activeFilter === filter;
    const style = isActive
      ? 'background: var(--brand-gradient); border-color: transparent; color: white;'
      : 'color: var(--text-secondary);';
    return `<button class="filter-btn outline-btn" data-filter="${filter}" style="padding: 6px 12px; font-size: 0.8rem; border-radius: 8px; ${style}">${label}</button>`;
  }

  renderQuestionsList() {
    const { questions, userAnswers } = this.record;
    
    // Filter questions
    const filtered = questions.map((q, idx) => ({ q, idx })).filter(item => {
      const userSel = userAnswers[item.idx];
      if (this.activeFilter === 'correct') return userSel === item.q.correctIndex;
      if (this.activeFilter === 'incorrect') return userSel !== undefined && userSel !== item.q.correctIndex;
      if (this.activeFilter === 'skipped') return userSel === undefined;
      return true; // all
    });

    if (filtered.length === 0) {
      return `<div class="glass-panel" style="padding: 30px; text-align: center; color: var(--text-secondary);">No questions match this filter.</div>`;
    }

    return filtered.map(({ q, idx }) => {
      const userSel = userAnswers[idx];
      const isCorrect = userSel === q.correctIndex;
      const isSkipped = userSel === undefined;
      
      let statusClass = 'skipped';
      let statusText = '<i class="far fa-circle"></i> Skipped';
      if (isCorrect) {
        statusClass = 'correct';
        statusText = '<i class="fas fa-check-circle"></i> Correct Answer';
      } else if (!isSkipped) {
        statusClass = 'incorrect';
        statusText = '<i class="fas fa-times-circle"></i> Incorrect Answer';
      }

      return `
        <div class="glass-panel review-item ${statusClass}">
          <div class="review-status-label">${statusText}</div>
          
          <div style="font-family: var(--font-heading); font-size: 0.8rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 10px;">
            Question ${idx + 1} &bull; <span style="color: var(--brand-primary);">${q.subject}</span>
          </div>

          <!-- Question Text -->
          <div style="font-weight: 500; font-size: 1.02rem; margin-bottom: 20px; white-space: pre-wrap;">${q.question}</div>

          <!-- Options review list -->
          <div class="options-list">
            ${q.options.map((opt, oIdx) => {
              let optClass = '';
              const letter = String.fromCharCode(65 + oIdx);
              
              if (oIdx === q.correctIndex) {
                optClass = 'correct-ans';
              } else if (userSel === oIdx) {
                optClass = 'incorrect-ans';
              }

              return `
                <div class="option-card ${optClass}" style="cursor: default;">
                  <div class="option-indicator">${letter}</div>
                  <div class="option-text">${opt}</div>
                </div>
              `;
            }).join('')}
          </div>

          <!-- Solution Explanation -->
          <div class="review-explanation">
            <h4 style="font-family: var(--font-heading); font-size: 0.85rem; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px;">Detailed Solution:</h4>
            <p>${q.explanation}</p>
          </div>

          <!-- Ask AI Integration link -->
          <button class="ask-tutor-trigger" data-qidx="${idx}">
            <i class="fas fa-robot"></i> Stuck here? Ask GovPrep AI Tutor to explain this concept
          </button>
        </div>
      `;
    }).join('');
  }

  attachEvents(container) {
    // Back to dashboard
    const backBtn = container.querySelector('#review-to-dashboard-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.onNavigate('dashboard'));
    }

    // Filter toggle
    container.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const filter = btn.getAttribute('data-filter');
        this.activeFilter = filter;
        
        // Re-render only list part and button states
        container.querySelectorAll('.filter-btn').forEach(b => {
          b.className = 'filter-btn outline-btn';
          b.style.background = 'transparent';
          b.style.borderColor = 'var(--panel-border-hover)';
          b.style.color = 'var(--text-secondary)';
        });
        
        btn.style.background = 'var(--brand-gradient)';
        btn.style.borderColor = 'transparent';
        btn.style.color = 'white';

        const list = container.querySelector('#review-questions-list');
        if (list) {
          list.innerHTML = this.renderQuestionsList();
          this.attachAskTutorEvents(container);
        }
      });
    });

    this.attachAskTutorEvents(container);
  }

  attachAskTutorEvents(container) {
    container.querySelectorAll('.ask-tutor-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const qIdx = parseInt(btn.getAttribute('data-qidx'), 10);
        if (this.onAskTutor) {
          this.onAskTutor(qIdx);
        }
      });
    });
  }
}
