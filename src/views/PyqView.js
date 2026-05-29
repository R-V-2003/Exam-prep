import { supabaseService } from '../services/supabase.js';

export class PyqView {
  constructor(onStartExam) {
    this.onStartExam = onStartExam;
  }

  render(container) {
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
        <div style="margin-bottom: 25px; border-bottom: 1px solid var(--panel-border); padding-bottom: 15px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-primary);">Previous Year Papers</h2>
          <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 3px;">Solve actual historical papers from the RSSB Rajasthan Computer Instructor 2022 exams under real exam conditions.</p>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- Basic Instructor Card 1 -->
          <div class="glass-panel" style="padding: 24px; display: flex; flex-direction: column; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700; background: rgba(0, 242, 254, 0.08); padding: 4px 10px; border-radius: 6px;">Basic Instructor</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">18 June 2022</span>
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 8px; color: var(--text-primary);">2022 Basic Paper I (General Studies)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px; flex-grow: 1;">Includes Rajasthan history, geography, art & culture, quantitative aptitude, and reasoning ability. Real questions from the June 18, 2022 shift.</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--panel-border); padding-top: 15px; margin-top: auto;">
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                <i class="far fa-clock" style="margin-right: 4px;"></i> 120 Mins &bull; <i class="far fa-file-alt" style="margin-right: 4px;"></i> 100 Qs
              </div>
              <button class="glow-btn start-pyq-btn" data-db="Basic - Paper I" data-title="2022 Basic Computer Instructor - Paper I" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 8px;">
                <i class="fas fa-play" style="font-size: 0.7rem; margin-right: 5px;"></i> Start Exam
              </button>
            </div>
          </div>

          <!-- Basic Instructor Card 2 -->
          <div class="glass-panel" style="padding: 24px; display: flex; flex-direction: column; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700; background: rgba(0, 242, 254, 0.08); padding: 4px 10px; border-radius: 6px;">Basic Instructor</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">18 June 2022</span>
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 8px; color: var(--text-primary);">2022 Basic Paper II (Computer Science)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px; flex-grow: 1;">Includes computer fundamentals, programming languages, DBMS, algorithms, networks, operating systems, and pedagogy. Real questions from the June 18, 2022 shift.</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--panel-border); padding-top: 15px; margin-top: auto;">
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                <i class="far fa-clock" style="margin-right: 4px;"></i> 120 Mins &bull; <i class="far fa-file-alt" style="margin-right: 4px;"></i> 100 Qs
              </div>
              <button class="glow-btn start-pyq-btn" data-db="Basic - Paper II" data-title="2022 Basic Computer Instructor - Paper II" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 8px; background: var(--cyan-gradient); box-shadow: 0 4px 15px rgba(0, 242, 254, 0.15);">
                <i class="fas fa-play" style="font-size: 0.7rem; margin-right: 5px;"></i> Start Exam
              </button>
            </div>
          </div>

          <!-- Senior Instructor Card 1 -->
          <div class="glass-panel" style="padding: 24px; display: flex; flex-direction: column; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <span style="font-size: 0.75rem; color: var(--brand-secondary); font-weight: 700; background: rgba(168, 85, 247, 0.1); padding: 4px 10px; border-radius: 6px;">Senior Instructor</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">19 June 2022</span>
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 8px; color: var(--text-primary);">2022 Senior Paper I (General Studies)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px; flex-grow: 1;">Advanced General Studies shift with a heavy focus on Rajasthan arts, heritage, administrative geography, and analytical mental ability.</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--panel-border); padding-top: 15px; margin-top: auto;">
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                <i class="far fa-clock" style="margin-right: 4px;"></i> 120 Mins &bull; <i class="far fa-file-alt" style="margin-right: 4px;"></i> 100 Qs
              </div>
              <button class="glow-btn start-pyq-btn" data-db="Senior - Paper I" data-title="2022 Senior Computer Instructor - Paper I" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 8px;">
                <i class="fas fa-play" style="font-size: 0.7rem; margin-right: 5px;"></i> Start Exam
              </button>
            </div>
          </div>

          <!-- Senior Instructor Card 2 -->
          <div class="glass-panel" style="padding: 24px; display: flex; flex-direction: column; border-radius: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 15px;">
              <span style="font-size: 0.75rem; color: var(--brand-secondary); font-weight: 700; background: rgba(168, 85, 247, 0.1); padding: 4px 10px; border-radius: 6px;">Senior Instructor</span>
              <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">19 June 2022</span>
            </div>
            <h3 style="font-family: var(--font-heading); font-size: 1.15rem; margin-bottom: 8px; color: var(--text-primary);">2022 Senior Paper II (Advanced CS)</h3>
            <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5; margin-bottom: 20px; flex-grow: 1;">Advanced computer science topics, including software engineering models, digital electronics logic, data communications, and object-oriented architectures.</p>
            
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--panel-border); padding-top: 15px; margin-top: auto;">
              <div style="font-size: 0.8rem; color: var(--text-secondary);">
                <i class="far fa-clock" style="margin-right: 4px;"></i> 120 Mins &bull; <i class="far fa-file-alt" style="margin-right: 4px;"></i> 100 Qs
              </div>
              <button class="glow-btn start-pyq-btn" data-db="Senior - Paper II" data-title="2022 Senior Computer Instructor - Paper II" style="padding: 8px 16px; font-size: 0.8rem; border-radius: 8px; background: var(--cyan-gradient); box-shadow: 0 4px 15px rgba(0, 242, 254, 0.15);">
                <i class="fas fa-play" style="font-size: 0.7rem; margin-right: 5px;"></i> Start Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
  }

  attachEvents(container) {
    container.querySelectorAll('.start-pyq-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const dbType = btn.getAttribute('data-db');
        const title = btn.getAttribute('data-title');
        
        // Show loading state
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        btn.disabled = true;
        
        try {
          // Load the actual real questions pool from Supabase
          const questionsList = await supabaseService.getFullPaper(dbType);
          
          if (!questionsList || questionsList.length === 0) {
            alert("Error: could not load historical paper questions. They might not be available yet.");
            return;
          }

          // Full-length papers receive 120 minutes (2.0 hours) as per RSSB guidelines
          this.onStartExam(questionsList, 120, title);
        } catch (e) {
          console.error(e);
          alert("Error loading paper.");
        } finally {
          // Restore button
          btn.innerHTML = originalText;
          btn.disabled = false;
        }
      });
    });
  }
}
