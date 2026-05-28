import { storage } from '../services/storage.js';
import { gemini } from '../services/gemini.js';
import { bciSyllabus } from '../data/bciSyllabus.js';

export class TestGeneratorView {
  constructor(onStartTest) {
    this.onStartTest = onStartTest;
    this.selectedPaper = 'Paper I'; // Paper I, Paper II (for BCI exam focus)
  }

  render(container) {
    this.container = container;
    const examType = storage.getTargetExam();
    
    let subjectList = [];
    let isBCI = examType === 'BCI';

    if (isBCI) {
      const paperData = bciSyllabus.papers[this.selectedPaper];
      subjectList = paperData ? paperData.subjects : [];
    } else {
      // General fallbacks for SSC/UPSC
      subjectList = [
        { id: 'polity', name: 'Indian Polity & Constitution', icon: 'fa-balance-scale' },
        { id: 'history', name: 'History of India & Art', icon: 'fa-landmark' },
        { id: 'geography', name: 'Geography & Ecology', icon: 'fa-globe-asia' },
        { id: 'economy', name: 'Indian Economy & Budget', icon: 'fa-chart-bar' },
        { id: 'quant', name: 'Quantitative Aptitude', icon: 'fa-percentage' },
        { id: 'reasoning', name: 'Logical Reasoning', icon: 'fa-brain' },
        { id: 'english', name: 'English Language & Reading', icon: 'fa-language' },
        { id: 'currents', name: 'Current Affairs & Schemes', icon: 'fa-newspaper' }
      ];
    }

    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 800px; margin: 0 auto; padding-bottom: 40px;">
        <div class="glass-panel generator-card">
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem; margin-bottom: 8px; color: var(--text-primary);">
            <i class="fas fa-sliders-h" style="color: var(--brand-primary); margin-right: 10px;"></i> Mock Exam Builder
          </h2>
          <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem;">Configure your custom practice test. Our AI engine will generate challenging syllabus-oriented questions with detailed solutions.</p>


          <!-- BCI Paper selection (only shown if BCI exam is active) -->
          ${isBCI ? `
            <div class="form-group animate-fade-in">
              <label class="form-label">Exam Paper</label>
              <div style="display: flex; background: rgba(15, 23, 42, 0.2); border: 1px solid var(--panel-border); padding: 4px; border-radius: 12px; width: max-content;">
                <button id="bci-paper-1-btn" class="outline-btn" style="padding: 8px 20px; border: none; border-radius: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 0.85rem; transition: all var(--transition-fast); ${this.selectedPaper === 'Paper I' ? 'background: var(--brand-gradient); color: white;' : 'color: var(--text-secondary);'}">Paper I (GS & Aptitude)</button>
                <button id="bci-paper-2-btn" class="outline-btn" style="padding: 8px 20px; border: none; border-radius: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 0.85rem; transition: all var(--transition-fast); ${this.selectedPaper === 'Paper II' ? 'background: var(--brand-gradient); color: white;' : 'color: var(--text-secondary);'}">Paper II (Computer Science)</button>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 8px; display: block; line-height: 1.4;">
                * ${bciSyllabus.papers[this.selectedPaper].description}
              </span>
            </div>
          ` : ''}

          <!-- Subjects Checkboxes -->
          <div class="form-group">
            <label class="form-label">Included Subjects / Topics</label>
            <div class="checkbox-grid">
              ${subjectList.map(sub => `
                <label class="checkbox-tile">
                  <input type="checkbox" name="subjects" value="${sub.name}" checked>
                  <div class="checkbox-tile-content">
                    <i class="fas ${sub.icon} checkbox-tile-icon"></i>
                    <span class="checkbox-tile-label" style="text-align: center;">${sub.name}</span>
                  </div>
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Count, Difficulty, Time Grid -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 24px;">
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Number of Questions</label>
              <select id="test-question-count" class="glass-input" style="width: 100%; cursor: pointer;">
                <option value="5">5 Questions (Quick Quiz)</option>
                <option value="10" selected>10 Questions (Standard)</option>
                <option value="25">25 Questions (Sectional)</option>
                <option value="50">50 Questions (Half Length)</option>
                <option value="100">100 Questions (Full Length)</option>
              </select>
            </div>

            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label">Difficulty Level</label>
              <select id="test-difficulty" class="glass-input" style="width: 100%; cursor: pointer;">
                <option value="Easy">Easy (Foundation)</option>
                <option value="Medium" selected>Medium (Standard Exam)</option>
                <option value="Hard">Hard (Advanced Competitor)</option>
              </select>
            </div>
          </div>

          <!-- Custom AI Prompt instructions -->
          <div class="form-group">
            <label class="form-label">Custom AI Focus Instructions (Optional)</label>
            <textarea id="test-custom-prompt" class="glass-input" style="width: 100%; height: 80px; resize: none;" placeholder="${isBCI ? 'e.g., focus more on SQL join queries, or CPU scheduling FCFS/SJF, or Rajasthan freedom fighters, or time-speed-distance...' : 'focus on specific chapters or details...' }"></textarea>
          </div>

          <!-- Start Action -->
          <div style="display: flex; justify-content: flex-end; gap: 15px; border-top: 1px solid var(--panel-border); padding-top: 20px;">
            <button id="generate-test-btn" class="glow-btn" style="width: 100%; font-size: 1.05rem; padding: 14px 0;">
              <i class="fas fa-magic" style="margin-right: 8px;"></i> Assemble Custom Test
            </button>
          </div>
        </div>
      </div>

      <!-- Loading Modal Overlay -->
      <div id="loading-overlay" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(10, 15, 30, 0.9); backdrop-filter: blur(12px); justify-content: center; align-items: center; z-index: 10000; flex-direction: column; text-align: center;">
        <div class="glass-panel" style="width: 90%; max-width: 450px; padding: 40px; display: flex; flex-direction: column; align-items: center;">
          <div style="position: relative; width: 80px; height: 80px; margin-bottom: 30px;">
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; border: 4px solid rgba(99, 102, 241, 0.1); border-top-color: var(--brand-primary); animation: spinLoader 1s linear infinite;"></div>
            <i class="fas fa-brain" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 2rem; color: var(--brand-primary); animation: pulseBrain 1.5s ease-in-out infinite;"></i>
          </div>
          <h3 id="loader-title" style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 12px;">Generating Custom Test</h3>
          <p id="loader-subtitle" style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 5px;">Invoking AI engine...</p>
          <div style="width: 100%; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; margin-top: 20px;">
            <div id="loader-progress" style="height: 100%; width: 10%; background: var(--brand-gradient); border-radius: 2px; transition: width 0.4s ease;"></div>
          </div>
        </div>
      </div>

      <style>
        @keyframes spinLoader {
          to { transform: rotate(360deg); }
        }
        @keyframes pulseBrain {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(0.9); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .radio-tile-label {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 20px;
          border-radius: 10px;
          border: 1px solid var(--panel-border);
          background: rgba(15, 23, 42, 0.2);
          font-family: var(--font-heading);
          font-weight: 700;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        
        .radio-tile input {
          display: none;
        }
        
        .radio-tile input:checked + .radio-tile-label {
          border-color: var(--brand-primary);
          background: rgba(99, 102, 241, 0.15);
          color: white;
          box-shadow: var(--glow-indigo);
        }
      </style>
    `;

    this.attachEvents(container);
  }


  attachEvents(container) {

    // BCI Paper Buttons
    const paper1Btn = container.querySelector('#bci-paper-1-btn');
    const paper2Btn = container.querySelector('#bci-paper-2-btn');

    if (paper1Btn && paper2Btn) {
      paper1Btn.addEventListener('click', () => {
        if (this.selectedPaper !== 'Paper I') {
          this.selectedPaper = 'Paper I';
          this.render(container);
        }
      });
      paper2Btn.addEventListener('click', () => {
        if (this.selectedPaper !== 'Paper II') {
          this.selectedPaper = 'Paper II';
          this.render(container);
        }
      });
    }

    const genBtn = container.querySelector('#generate-test-btn');
    if (!genBtn) return;

    genBtn.addEventListener('click', async () => {
      const examRadio = container.querySelector('input[name="target-exam"]:checked');
      const examType = examRadio ? examRadio.value : 'BCI';
      
      const subjectCheckboxes = container.querySelectorAll('input[name="subjects"]:checked');
      const selectedSubjects = Array.from(subjectCheckboxes).map(cb => cb.value);

      if (selectedSubjects.length === 0) {
        alert("Please select at least one subject to include in the test.");
        return;
      }

      const countSelect = container.querySelector('#test-question-count');
      const count = parseInt(countSelect.value, 10);

      const diffSelect = container.querySelector('#test-difficulty');
      const difficulty = diffSelect.value;

      const customPrompt = container.querySelector('#test-custom-prompt').value;

      // Show loader overlay
      const loader = container.querySelector('#loading-overlay');
      const lSubtitle = container.querySelector('#loader-subtitle');
      const lProgress = container.querySelector('#loader-progress');
      
      loader.style.display = 'flex';
      
      const steps = [
        { progress: 15, subtitle: "Initializing test generation request..." },
        { progress: 35, subtitle: "Contacting AI models on Groq/Gemini..." },
        { progress: 55, subtitle: "Constructing syllabus-matched question pool..." },
        { progress: 75, subtitle: "Fact-checking answers & building step-by-step solutions..." },
        { progress: 95, subtitle: "Finalizing formatting and compiling results..." }
      ];

      let stepIdx = 0;
      const interval = setInterval(() => {
        if (stepIdx < steps.length) {
          lProgress.style.width = `${steps[stepIdx].progress}%`;
          lSubtitle.innerText = steps[stepIdx].subtitle;
          stepIdx++;
        }
      }, 900);

      try {
        // Map target exam type for mock generator
        // If BCI is selected, pass BCI_I or BCI_II depending on selected paper
        const runExamType = examType === 'BCI' 
          ? (this.selectedPaper === 'Paper I' ? 'BCI_I' : 'BCI_II') 
          : examType;

        // BCI and UPSC have longer durations due to complexity (1.2m and 1.5m per question)
        const minPerQ = examType === 'BCI' ? 1.2 : (examType === 'UPSC' ? 1.5 : 1.0);
        const timeMinutes = Math.max(5, Math.round(count * minPerQ));

        // Call AI Service (which uses Groq/Gemini under the hood)
        const questions = await gemini.generateTest(runExamType, selectedSubjects, count, difficulty, customPrompt);
        
        clearInterval(interval);
        lProgress.style.width = '100%';
        lSubtitle.innerText = "Done! Starting exam session...";
        
        setTimeout(() => {
          loader.style.display = 'none';
          
          // Compute clean display header title
          const displayHeaderName = examType === 'BCI'
            ? `Computer Instructor (${this.selectedPaper === 'Paper I' ? 'Paper I' : 'Paper II'})`
            : examType;

          this.onStartTest(questions, timeMinutes, displayHeaderName);
        }, 500);

      } catch (err) {
        clearInterval(interval);
        loader.style.display = 'none';
        alert(`Failed to assemble test: ${err.message}`);
      }
    });
  }
}
