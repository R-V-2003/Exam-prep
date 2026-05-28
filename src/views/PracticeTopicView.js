import { bciSyllabus } from '../data/bciSyllabus.js';
import { gemini } from '../services/gemini.js';
import { storage } from '../services/storage.js';

export class PracticeTopicView {
  constructor(onStartPractice) {
    this.onStartPractice = onStartPractice;
    this.activePaperTab = 'Paper II'; // default to Computer Science since it's the core focus
  }

  render(container) {
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
        <!-- Top selection tabs -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--panel-border); padding-bottom: 15px;">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-primary);">Topic-Wise Practice</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 3px;">Select any specific sub-topic from the syllabus to start a focused 5-question AI-generated practice set.</p>
          </div>
          
          <div style="display: flex; background: rgba(15, 23, 42, 0.2); border: 1px solid var(--panel-border); padding: 4px; border-radius: 12px; height: max-content;">
            <button id="practice-tab-1" class="outline-btn" style="padding: 8px 16px; border: none; border-radius: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast); ${this.activePaperTab === 'Paper I' ? 'background: var(--brand-gradient); color: white;' : 'color: var(--text-secondary);'}">Paper I (Aptitude & GK)</button>
            <button id="practice-tab-2" class="outline-btn" style="padding: 8px 16px; border: none; border-radius: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast); ${this.activePaperTab === 'Paper II' ? 'background: var(--brand-gradient); color: white;' : 'color: var(--text-secondary);'}">Paper II (Computer Science)</button>
          </div>
        </div>

        <!-- Collapsible subjects layout -->
        <div style="display: flex; flex-direction: column; gap: 15px;" id="subjects-container">
          ${this.renderSubjects()}
        </div>
      </div>

      <!-- Loading Modal Overlay -->
      <div id="practice-loading-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10, 15, 30, 0.95); backdrop-filter: blur(12px); justify-content: center; align-items: center; z-index: 10000; flex-direction: column; text-align: center;">
        <div class="glass-panel" style="width: 90%; max-width: 450px; padding: 40px; display: flex; flex-direction: column; align-items: center;">
          <div style="position: relative; width: 70px; height: 70px; margin-bottom: 25px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; border: 3px solid rgba(99, 102, 241, 0.1); border-top-color: var(--accent-cyan); animation: spinLoader 1s linear infinite;"></div>
            <i class="fas fa-magic" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.6rem; color: var(--accent-cyan); animation: pulseMagic 1.5s infinite;"></i>
          </div>
          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; margin-bottom: 8px;" id="overlay-load-title">Assembling Practice Set</h3>
          <p id="overlay-load-subtitle" style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">Generating 5 custom questions on selected topic using Groq Llama 3.3...</p>
          <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin-top: 20px;">
            <div id="overlay-load-progress" style="height: 100%; width: 15%; background: var(--cyan-gradient); border-radius: 2px; transition: width 0.4s ease;"></div>
          </div>
        </div>
      </div>

      <style>
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        @keyframes pulseMagic {
          0%, 100% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        .collapsible-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 24px;
          cursor: pointer;
          border-radius: 16px;
          transition: all var(--transition-fast);
        }
        .collapsible-header:hover {
          background: rgba(99, 102, 241, 0.05);
          border-color: var(--panel-border-hover);
        }
        .collapsible-content {
          padding: 0 24px 18px 24px;
          border-top: 1px solid var(--panel-border);
          display: none;
          flex-direction: column;
          gap: 12px;
          animation: slideDown 0.25s ease forwards;
        }
        .collapsible-card.active .collapsible-content {
          display: flex;
        }
        .collapsible-card.active .collapsible-header {
          border-bottom-left-radius: 0;
          border-bottom-right-radius: 0;
          background: rgba(99, 102, 241, 0.03);
        }
        .collapsible-card.active .chevron-icon {
          transform: rotate(180deg);
        }
        .topic-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-radius: 10px;
          background: rgba(15, 23, 42, 0.15);
          border: 1px solid var(--panel-border);
          transition: border-color var(--transition-fast);
        }
        .topic-row:hover {
          border-color: var(--panel-border-hover);
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    this.attachEvents(container);
  }

  renderSubjects() {
    const paperData = bciSyllabus.papers[this.activePaperTab];
    if (!paperData) return '';

    return paperData.subjects.map((sub, idx) => {
      // Default first card to active
      const isActive = idx === 0;

      return `
        <div class="glass-panel collapsible-card ${isActive ? 'active' : ''}" style="overflow: hidden; border-radius: 16px;">
          <div class="collapsible-header" data-subid="${sub.id}">
            <div style="display: flex; align-items: center; gap: 15px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--panel-border); display: flex; justify-content: center; align-items: center;">
                <i class="fas ${sub.icon}" style="color: var(--brand-primary); font-size: 1.1rem;"></i>
              </div>
              <div>
                <h3 style="font-size: 1.05rem; font-weight: 700; color: var(--text-primary);">${sub.name}</h3>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">${sub.topics.length} core sub-topics</span>
              </div>
            </div>
            <i class="fas fa-chevron-down chevron-icon" style="color: var(--text-muted); font-size: 0.9rem; transition: transform var(--transition-fast);"></i>
          </div>

          <div class="collapsible-content">
            <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 15px;">
              ${sub.topics.map(topic => `
                <div class="topic-row">
                  <span style="font-size: 0.9rem; font-weight: 500; color: var(--text-primary); padding-right: 20px;">${topic}</span>
                  <div style="display: flex; gap: 8px;">
                    <button class="outline-btn start-topic-practice-btn" data-subject="${sub.name}" data-topic="${topic}" style="padding: 6px 14px; font-size: 0.75rem; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-family: var(--font-heading); font-weight: 700;">
                      <i class="fas fa-play" style="font-size: 0.65rem; color: var(--brand-primary);"></i> Practice
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  attachEvents(container) {
    // Paper tab switches
    const tab1 = container.querySelector('#practice-tab-1');
    const tab2 = container.querySelector('#practice-tab-2');

    if (tab1 && tab2) {
      tab1.addEventListener('click', () => {
        if (this.activePaperTab !== 'Paper I') {
          this.activePaperTab = 'Paper I';
          this.render(container);
        }
      });
      tab2.addEventListener('click', () => {
        if (this.activePaperTab !== 'Paper II') {
          this.activePaperTab = 'Paper II';
          this.render(container);
        }
      });
    }

    // Collapsible cards toggle
    container.querySelectorAll('.collapsible-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.closest('.collapsible-card');
        card.classList.toggle('active');
      });
    });

    const practiceBtns = container.querySelectorAll('.start-topic-practice-btn');
    practiceBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const subject = btn.getAttribute('data-subject');
        const topic = btn.getAttribute('data-topic');
        storage.markTopicStudied(topic);
        this.startPracticeSession(subject, topic, container);
      });
    });
  }

  async startPracticeSession(subject, topic, container) {
    const loader = container.querySelector('#practice-loading-overlay');
    const lSubtitle = container.querySelector('#overlay-load-subtitle');
    const lProgress = container.querySelector('#overlay-load-progress');

    loader.style.display = 'flex';
    lSubtitle.innerText = `Assembling questions for "${topic}"...`;
    lProgress.style.width = '20%';

    const steps = [
      { progress: 45, subtitle: `Invoking AI model to draft concept questions...` },
      { progress: 75, subtitle: `Building answer validation keys & detailed explanations...` },
      { progress: 95, subtitle: `Compiling practice set...` }
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      if (stepIdx < steps.length) {
        lProgress.style.width = `${steps[stepIdx].progress}%`;
        lSubtitle.innerText = steps[stepIdx].subtitle;
        stepIdx++;
      }
    }, 800);

    try {
      const qCount = 5;
      const difficulty = 'Medium';
      const customPrompt = `Generate exactly 5 questions focusing deeply and exclusively on the sub-topic: "${topic}" under the main subject "${subject}". Ensure the questions test core terminology, code outputs, or historical facts depending on the subject type.`;

      // Call AI test generator (which uses Groq/fallback tests)
      // Map to fallback mock bank key depending on which Paper we are on
      const runExamType = this.activePaperTab === 'Paper I' ? 'BCI_I' : 'BCI_II';
      
      const questions = await gemini.generateTest(runExamType, [subject], qCount, difficulty, customPrompt);
      
      clearInterval(interval);
      lProgress.style.width = '100%';
      lSubtitle.innerText = "Done! Starting practice set...";

      setTimeout(() => {
        loader.style.display = 'none';
        
        // 5 questions practice set gets 6 minutes (1.2 mins per question)
        this.onStartPractice(questions, 6, `Practice: ${topic}`);
      }, 500);

    } catch (err) {
      clearInterval(interval);
      loader.style.display = 'none';
      alert(`Failed to start practice session: ${err.message}`);
    }
  }
}
