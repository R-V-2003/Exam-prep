import { storage } from '../services/storage.js';

export class TestActiveView {
  constructor(onFinishTest) {
    this.onFinishTest = onFinishTest;
    this.questions = [];
    this.timeMinutes = 0;
    this.examType = 'SSC';
    
    this.currentIdx = 0;
    this.userAnswers = {}; // { qIdx: selectedOptionIdx }
    this.markedForReview = {}; // { qIdx: boolean }
    this.visitedQuestions = { 0: true }; // { qIdx: boolean }
    
    this.timerInterval = null;
    this.timeLeftSeconds = 0;
    
    // Scratchpad variables
    this.scratchpadActive = false;
    this.isDrawing = false;
    this.penMode = 'draw'; // draw, erase
    this.penColor = '#00f2fe';
    this.penWidth = 3;
    this.lastX = 0;
    this.lastY = 0;
    
    // Calculator variables
    this.calcActive = false;
  }

  setup(questions, timeMinutes, examType) {
    this.questions = questions;
    this.timeMinutes = timeMinutes;
    this.examType = examType;
    
    this.currentIdx = 0;
    this.userAnswers = {};
    this.markedForReview = {};
    this.visitedQuestions = { 0: true };
    this.timeLeftSeconds = timeMinutes * 60;
    this.scratchpadActive = false;
    this.calcActive = false;
  }

  render(container) {
    container.innerHTML = `
      <div class="test-layout animate-fade-in">
        <!-- Main Left Question Panel -->
        <div class="glass-panel question-panel">
          <!-- Scrollable Content Area -->
          <div class="question-scroll-area">
            <div class="question-header">
              <span style="font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; color: var(--brand-primary);">Question ${this.currentIdx + 1} of ${this.questions.length}</span>
              <div class="question-meta">
                <span class="badge badge-subject">${this.questions[this.currentIdx].subject}</span>
                <span class="badge badge-difficulty">${this.examType} Focus</span>
              </div>
            </div>

            <!-- Question Content -->
            <div class="question-text" id="active-question-text">${this.formatQuestionText(this.questions[this.currentIdx].question)}</div>

            <!-- Options -->
            <div class="options-list" id="active-options-list">
              ${this.renderOptions()}
            </div>
          </div>

          <!-- Action row at bottom (Fixed) -->
          <div class="action-row" style="margin-top: auto; padding-top: 20px; border-top: 1px solid var(--panel-border);">
            <button id="test-prev-btn" class="outline-btn" style="padding: 10px 18px;" ${this.currentIdx === 0 ? 'disabled' : ''}>
              <i class="fas fa-arrow-left"></i> Previous
            </button>

            <button id="test-mark-btn" class="outline-btn" style="padding: 10px 18px; border-color: var(--warning); color: var(--warning);">
              <i class="far fa-star"></i> Mark for Review
            </button>

            <button id="test-clear-ans-btn" class="outline-btn" style="padding: 10px 15px; font-size: 0.85rem;">Clear Answer</button>
            <button id="test-next-btn" class="glow-btn" style="padding: 10px 24px;">
              ${this.currentIdx === this.questions.length - 1 ? 'Save & Review' : 'Next Question <i class="fas fa-arrow-right"></i>'}
            </button>
          </div>
        </div>

        <!-- Right Control Panel -->
        <div class="glass-panel control-panel">
          <!-- Countdown Timer -->
          <div id="test-timer" class="timer-box">
            <i class="far fa-clock"></i> <span id="timer-text">00:00</span>
          </div>

          <!-- Helper Utilities -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
            <button id="toggle-scratchpad-btn" class="outline-btn" style="padding: 10px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="fas fa-paint-brush" style="color: var(--accent-cyan);"></i> Scratchpad
            </button>
            <button id="toggle-calc-btn" class="outline-btn" style="padding: 10px; font-size: 0.8rem; display: flex; align-items: center; justify-content: center; gap: 8px;">
              <i class="fas fa-calculator" style="color: var(--brand-secondary);"></i> Calculator
            </button>
          </div>

          <!-- Question Index Palette -->
          <div style="font-family: var(--font-heading); font-size: 0.85rem; font-weight: 600; text-transform: uppercase; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.05em;">Question Palette</div>
          <div class="palette-grid" id="test-palette-grid">
            ${this.renderPalette()}
          </div>

          <!-- Palette Legend -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.75rem; color: var(--text-secondary); border-top: 1px solid var(--panel-border); padding-top: 15px;">
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: var(--success); border-radius: 50%;"></span> Answered</div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: var(--warning); border-radius: 50%;"></span> Marked</div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; background: rgba(255,255,255,0.1); border-radius: 50%;"></span> Visited</div>
            <div style="display: flex; align-items: center; gap: 6px;"><span style="width: 8px; height: 8px; border: 1px solid var(--panel-border); border-radius: 50%;"></span> Unvisited</div>
          </div>

          <!-- End Session Trigger -->
          <button id="test-submit-btn" class="glow-btn" style="margin-top: auto; width: 100%; background: var(--cyan-gradient); box-shadow: 0 4px 15px rgba(0, 242, 254, 0.2);">
            Submit Full Test
          </button>
        </div>
      </div>

      <!-- Scratchpad slide-over Drawer -->
      <div id="scratchpad-drawer" class="scratchpad-container glass-panel">
        <div class="scratchpad-header">
          <h3 style="font-family: var(--font-heading); font-size: 1.1rem; display: flex; align-items: center; gap: 8px;">
            <i class="fas fa-edit" style="color: var(--accent-cyan);"></i> Scratch Workspace
          </h3>
          <div style="display: flex; gap: 8px;">
            <button id="scratch-pen-mode" class="outline-btn" style="padding: 6px 12px; font-size: 0.75rem; background: rgba(0,242,254,0.1); border-color: var(--accent-cyan); color: var(--accent-cyan);">Pen</button>
            <button id="scratch-eraser-mode" class="outline-btn" style="padding: 6px 12px; font-size: 0.75rem;">Eraser</button>
            <button id="scratch-clear-btn" class="outline-btn" style="padding: 6px 12px; font-size: 0.75rem; border-color: var(--danger); color: var(--danger);">Clear</button>
            <button id="scratch-close-btn" class="outline-btn" style="padding: 6px; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; border-radius: 50%;"><i class="fas fa-times"></i></button>
          </div>
        </div>
        <div class="canvas-wrapper">
          <canvas id="scratch-canvas"></canvas>
        </div>
        <span style="font-size: 0.75rem; color: var(--text-muted); text-align: center;">Use mouse/finger to write rough work for mathematical questions.</span>
      </div>

      <!-- Small Overlay Calculator -->
      <div id="calculator-overlay" style="display: ${this.calcActive ? 'block' : 'none'}; position: absolute; top: 120px; right: 350px; width: 230px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(20px); border: 1px solid var(--panel-border-hover); border-radius: 16px; padding: 15px; z-index: 200; box-shadow: var(--shadow-lg);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 1px solid var(--panel-border); padding-bottom: 8px;">
          <span style="font-family: var(--font-heading); font-size: 0.85rem; font-weight: 700; color: var(--brand-secondary);">Calculator</span>
          <button id="calc-close" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-times"></i></button>
        </div>
        <input type="text" id="calc-display" readonly style="width: 100%; height: 36px; background: rgba(0,0,0,0.3); border: 1px solid var(--panel-border); border-radius: 8px; color: white; padding: 8px; text-align: right; font-family: monospace; font-size: 1rem; margin-bottom: 10px; outline: none;">
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px;">
          ${['C', '(', ')', '/'].map(btn => this.renderCalcBtn(btn, 'operator')).join('')}
          ${['7', '8', '9', '*'].map(btn => this.renderCalcBtn(btn)).join('')}
          ${['4', '5', '6', '-'].map(btn => this.renderCalcBtn(btn)).join('')}
          ${['1', '2', '3', '+'].map(btn => this.renderCalcBtn(btn)).join('')}
          ${['0', '.', '=', ''].map(btn => this.renderCalcBtn(btn)).join('')}
        </div>
      </div>
    `;

    this.attachEvents(container);
    this.startTimer();
  }

  renderOptions() {
    const q = this.questions[this.currentIdx];
    const selected = this.userAnswers[this.currentIdx];

    return q.options.map((opt, oIdx) => {
      const isSelected = selected === oIdx;
      const letter = String.fromCharCode(65 + oIdx);
      
      return `
        <div class="option-card ${isSelected ? 'selected' : ''}" data-index="${oIdx}">
          <div class="option-indicator">${letter}</div>
          <div class="option-text">${opt}</div>
        </div>
      `;
    }).join('');
  }

  renderPalette() {
    return this.questions.map((_, idx) => {
      const isActive = idx === this.currentIdx;
      const isAnswered = this.userAnswers[idx] !== undefined;
      const isMarked = this.markedForReview[idx] === true;
      const isVisited = this.visitedQuestions[idx] === true;

      let cls = '';
      if (isAnswered) cls = 'answered';
      else if (isMarked) cls = 'marked';
      else if (isVisited) cls = 'visited';

      return `
        <button class="palette-btn ${isActive ? 'active' : ''} ${cls}" data-index="${idx}">
          ${idx + 1}
        </button>
      `;
    }).join('');
  }

  renderCalcBtn(val, type = '') {
    if (val === '') return '<span></span>';
    let style = 'background: rgba(255,255,255,0.05); color: white;';
    if (type === 'operator') {
      style = 'background: rgba(168, 85, 247, 0.15); color: var(--brand-secondary); font-weight: bold;';
    } else if (val === '=') {
      style = 'background: var(--brand-gradient); color: white; font-weight: bold; grid-column: span 2;';
    }
    
    return `<button class="calc-btn outline-btn" data-val="${val}" style="padding: 8px; border-radius: 8px; font-size: 0.85rem; height: 35px; min-width: 0; display: flex; justify-content: center; align-items: center; ${style}">${val}</button>`;
  }

  onMount() {
    this.initScratchpad();
  }

  onUnmount() {
    this.stopTimer();
  }

  startTimer() {
    this.stopTimer();
    this.updateTimerUI();

    this.timerInterval = setInterval(() => {
      this.timeLeftSeconds--;
      this.updateTimerUI();

      if (this.timeLeftSeconds <= 0) {
        this.stopTimer();
        alert("Time limit reached! Submitting your test answers.");
        this.submitTest();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  updateTimerUI() {
    const timerBox = document.getElementById('test-timer');
    const timerText = document.getElementById('timer-text');
    if (!timerText) return;

    const m = Math.floor(this.timeLeftSeconds / 60);
    const s = this.timeLeftSeconds % 60;
    timerText.innerText = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    // Alert color under 5 minutes
    if (this.timeLeftSeconds < 300) {
      timerBox?.classList.add('warning');
    } else {
      timerBox?.classList.remove('warning');
    }
  }

  attachEvents(container) {
    // Options select
    const listContainer = container.querySelector('#active-options-list');
    if (listContainer) {
      listContainer.addEventListener('click', (e) => {
        const optionCard = e.target.closest('.option-card');
        if (optionCard) {
          const oIdx = parseInt(optionCard.getAttribute('data-index'), 10);
          this.userAnswers[this.currentIdx] = oIdx;
          
          // Render changes
          this.refreshQuestionView(container);
        }
      });
    }

    // Previous Button
    const prevBtn = container.querySelector('#test-prev-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (this.currentIdx > 0) {
          this.currentIdx--;
          this.visitedQuestions[this.currentIdx] = true;
          this.refreshQuestionView(container);
        }
      });
    }

    // Next Button
    const nextBtn = container.querySelector('#test-next-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (this.currentIdx < this.questions.length - 1) {
          this.currentIdx++;
          this.visitedQuestions[this.currentIdx] = true;
          this.refreshQuestionView(container);
        } else {
          // Review session submission dialog
          this.submitTest();
        }
      });
    }

    // Clear Answer Button
    const clearBtn = container.querySelector('#test-clear-ans-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        delete this.userAnswers[this.currentIdx];
        this.refreshQuestionView(container);
      });
    }

    // Mark for Review Button
    const markBtn = container.querySelector('#test-mark-btn');
    if (markBtn) {
      markBtn.addEventListener('click', () => {
        this.markedForReview[this.currentIdx] = !this.markedForReview[this.currentIdx];
        this.refreshQuestionView(container);
      });
    }

    // Palette Jump
    const palette = container.querySelector('#test-palette-grid');
    if (palette) {
      palette.addEventListener('click', (e) => {
        const pBtn = e.target.closest('.palette-btn');
        if (pBtn) {
          const idx = parseInt(pBtn.getAttribute('data-index'), 10);
          this.currentIdx = idx;
          this.visitedQuestions[this.currentIdx] = true;
          this.refreshQuestionView(container);
        }
      });
    }

    // Submit Test
    const submitBtn = container.querySelector('#test-submit-btn');
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to finish the test and submit your responses?")) {
          this.submitTest();
        }
      });
    }

    // Toggle Scratchpad
    const scratchBtn = container.querySelector('#toggle-scratchpad-btn');
    const scratchDrawer = container.querySelector('#scratchpad-drawer');
    if (scratchBtn && scratchDrawer) {
      scratchBtn.addEventListener('click', () => {
        this.scratchpadActive = !this.scratchpadActive;
        if (this.scratchpadActive) {
          scratchDrawer.classList.add('active');
          this.resizeCanvas();
        } else {
          scratchDrawer.classList.remove('active');
        }
      });
    }

    const scratchClose = container.querySelector('#scratch-close-btn');
    if (scratchClose && scratchDrawer) {
      scratchClose.addEventListener('click', () => {
        this.scratchpadActive = false;
        scratchDrawer.classList.remove('active');
      });
    }

    // Toggle Calculator
    const calcBtn = container.querySelector('#toggle-calc-btn');
    const calcOverlay = container.querySelector('#calculator-overlay');
    if (calcBtn && calcOverlay) {
      calcBtn.addEventListener('click', () => {
        this.calcActive = !this.calcActive;
        calcOverlay.style.display = this.calcActive ? 'block' : 'none';
      });
    }

    const calcClose = container.querySelector('#calc-close');
    if (calcClose && calcOverlay) {
      calcClose.addEventListener('click', () => {
        this.calcActive = false;
        calcOverlay.style.display = 'none';
      });
    }

    // Calculator buttons functionality
    const calcDisplay = container.querySelector('#calc-display');
    if (calcDisplay) {
      container.querySelectorAll('.calc-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const val = btn.getAttribute('data-val');
          if (val === 'C') {
            calcDisplay.value = '';
          } else if (val === '=') {
            try {
              // Simple math evaluation (safe replacement for calculator purposes)
              const expression = calcDisplay.value.replace(/[^0-9+\-*/().]/g, '');
              calcDisplay.value = Function(`"use strict"; return (${expression})`)();
            } catch (err) {
              calcDisplay.value = 'Error';
            }
          } else {
            if (calcDisplay.value === 'Error') calcDisplay.value = '';
            calcDisplay.value += val;
          }
        });
      });
    }
  }

  formatQuestionText(text) {
    if (!text) return '';
    
    // Replace ```text ... ``` blocks with styled <pre> blocks for diagrams
    let formatted = text.replace(/```text\n([\s\S]*?)\n```/g, '<pre style="font-family: \'Courier New\', Courier, monospace; background: var(--surface-1); padding: 12px; border-radius: 8px; border: 1px solid var(--panel-border); overflow-x: auto; color: var(--text-primary); margin: 10px 0; font-size: 0.95rem;">$1</pre>');
    
    // Replace basic newlines with <br> since we will use innerHTML, unless they are inside <pre>
    // Actually, CSS has white-space: pre-wrap on .question-text, so standard newlines will still break properly!
    
    // Escape HTML to prevent injection but allow our <pre> blocks
    // Note: A simple string replacement is safe enough since the DB content is controlled by us
    return formatted;
  }

  refreshQuestionView(container) {
    // Update active question elements
    const qText = container.querySelector('#active-question-text');
    if (qText) qText.innerHTML = this.formatQuestionText(this.questions[this.currentIdx].question);

    const oList = container.querySelector('#active-options-list');
    if (oList) oList.innerHTML = this.renderOptions();

    const paletteGrid = container.querySelector('#test-palette-grid');
    if (paletteGrid) paletteGrid.innerHTML = this.renderPalette();

    const prevBtn = container.querySelector('#test-prev-btn');
    if (prevBtn) prevBtn.disabled = (this.currentIdx === 0);

    const nextBtn = container.querySelector('#test-next-btn');
    if (nextBtn) {
      nextBtn.innerHTML = this.currentIdx === this.questions.length - 1 
        ? 'Save & Review' 
        : 'Next Question <i class="fas fa-arrow-right"></i>';
    }

    // Mark Star Outline / Filled
    const markBtn = container.querySelector('#test-mark-btn');
    if (markBtn) {
      const isMarked = this.markedForReview[this.currentIdx] === true;
      markBtn.innerHTML = isMarked
        ? '<i class="fas fa-star"></i> Unmark Review'
        : '<i class="far fa-star"></i> Mark for Review';
    }
  }

  // Scratchpad drawing logic
  initScratchpad() {
    const canvas = document.getElementById('scratch-canvas');
    if (!canvas) return;

    this.resizeCanvas();
    const ctx = canvas.getContext('2d');

    const draw = (e) => {
      if (!this.isDrawing) return;
      
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.beginPath();
      ctx.moveTo(this.lastX, this.lastY);
      ctx.lineTo(x, y);
      
      if (this.penMode === 'erase') {
        ctx.strokeStyle = '#05070f'; // Matches canvas background dark color
        ctx.lineWidth = 20;
      } else {
        ctx.strokeStyle = this.penColor;
        ctx.lineWidth = this.penWidth;
      }
      
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      this.lastX = x;
      this.lastY = y;
    };

    const startDraw = (e) => {
      this.isDrawing = true;
      
      let clientX, clientY;
      if (e.touches) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
        e.preventDefault(); // Stop mobile scroll
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      const rect = canvas.getBoundingClientRect();
      this.lastX = clientX - rect.left;
      this.lastY = clientY - rect.top;
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', () => this.isDrawing = false);
    canvas.addEventListener('mouseout', () => this.isDrawing = false);

    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', () => this.isDrawing = false);

    // Pen Mode Selectors
    const penBtn = document.getElementById('scratch-pen-mode');
    const eraserBtn = document.getElementById('scratch-eraser-mode');
    
    if (penBtn && eraserBtn) {
      penBtn.addEventListener('click', () => {
        this.penMode = 'draw';
        penBtn.style.background = 'rgba(0,242,254,0.1)';
        penBtn.style.borderColor = 'var(--accent-cyan)';
        penBtn.style.color = 'var(--accent-cyan)';
        eraserBtn.style.background = 'transparent';
        eraserBtn.style.borderColor = 'var(--panel-border)';
        eraserBtn.style.color = 'var(--text-primary)';
      });

      eraserBtn.addEventListener('click', () => {
        this.penMode = 'erase';
        eraserBtn.style.background = 'rgba(168, 85, 247, 0.15)';
        eraserBtn.style.borderColor = 'var(--brand-secondary)';
        eraserBtn.style.color = 'var(--brand-secondary)';
        penBtn.style.background = 'transparent';
        penBtn.style.borderColor = 'var(--panel-border)';
        penBtn.style.color = 'var(--text-primary)';
      });
    }

    const clearBtn = document.getElementById('scratch-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      });
    }
  }

  resizeCanvas() {
    const canvas = document.getElementById('scratch-canvas');
    if (!canvas) return;

    const wrapper = canvas.parentNode;
    canvas.width = wrapper.clientWidth;
    canvas.height = wrapper.clientHeight;
  }

  // Submit test and compute results
  submitTest() {
    this.stopTimer();
    
    // Evaluate scores
    let correctCount = 0;
    let incorrectCount = 0;
    let skippedCount = 0;

    const qCount = this.questions.length;
    
    this.questions.forEach((q, idx) => {
      const userSel = this.userAnswers[idx];
      if (userSel === undefined) {
        skippedCount++;
      } else if (userSel === q.correctIndex) {
        correctCount++;
      } else {
        incorrectCount++;
      }
    });

    // Score calculations
    // UPSC marking: +2.0 marks, -0.66 negative. SSC: +2.0, -0.5. Banking: +1.0, -0.25
    let positiveWeight = 1.0;
    let negativeWeight = 0.25;
    if (this.examType === 'UPSC') {
      positiveWeight = 2.0;
      negativeWeight = 0.66;
    } else if (this.examType === 'SSC') {
      positiveWeight = 2.0;
      negativeWeight = 0.50;
    }

    const totalPossibleMarks = qCount * positiveWeight;
    const scoredMarks = Math.max(0, (correctCount * positiveWeight) - (incorrectCount * negativeWeight));
    const scorePercentage = Math.round((scoredMarks / totalPossibleMarks) * 100);
    const accuracy = correctCount + incorrectCount > 0 
      ? Math.round((correctCount / (correctCount + incorrectCount)) * 100) 
      : 0;

    const timeSpentSeconds = (this.timeMinutes * 60) - this.timeLeftSeconds;

    const testResult = {
      examType: this.examType,
      questions: this.questions,
      userAnswers: this.userAnswers,
      correctCount,
      incorrectCount,
      skippedCount,
      scorePercentage,
      accuracy,
      timeSpentSeconds,
      scoredMarks: Number(scoredMarks.toFixed(2)),
      totalPossibleMarks
    };

    // Save to storage
    const savedRecord = storage.saveTestResult(testResult);

    // Navigate to Review View
    this.onFinishTest(savedRecord);
  }
}
