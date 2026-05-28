import { bciSyllabus } from '../data/bciSyllabus.js';
import { storage } from '../services/storage.js';

export class SyllabusProgressView {
  constructor(navigateTo) {
    this.navigateTo = navigateTo;
    this.studiedTopics = storage.getStudiedTopics();
  }

  render(container) {
    let html = `
      <div class="animate-fade-in" style="max-width: 1000px; margin: 0 auto; padding-bottom: 40px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.8rem; font-weight: 700; color: var(--text-primary); margin-bottom: 5px;">
              <i class="fas fa-tasks" style="color: var(--brand-primary); margin-right: 10px;"></i>Detailed Syllabus Progress
            </h2>
            <p style="color: var(--text-secondary);">Breakdown of all BCI subjects and topics. Green checks indicate topics you have studied or practiced.</p>
          </div>
          <button id="back-to-dash-btn" class="outline-btn" style="padding: 10px 18px;">
            <i class="fas fa-arrow-left"></i> Back to Dashboard
          </button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 40px;">
    `;

    // Iterate through papers
    Object.keys(bciSyllabus.papers).forEach(paperKey => {
      const paper = bciSyllabus.papers[paperKey];
      html += `
        <div>
          <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--panel-border); border-radius: 12px; padding: 15px 20px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
            <h3 style="font-family: var(--font-heading); font-size: 1.3rem; color: var(--brand-secondary); mragin: 0;">${paper.name}</h3>
            <span style="font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 4px 10px; border-radius: 20px;">${paper.description}</span>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px;">
      `;

      // Iterate through subjects
      paper.subjects.forEach(subject => {
        let subjectTopicsHtml = '';
        let subjectCompleted = 0;

        subject.topics.forEach(topic => {
          const isStudied = this.studiedTopics.includes(topic);
          if (isStudied) subjectCompleted++;

          subjectTopicsHtml += `
            <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 12px; padding: 8px; border-radius: 6px; background: ${isStudied ? 'rgba(34, 197, 94, 0.05)' : 'transparent'}; border: 1px solid ${isStudied ? 'rgba(34, 197, 94, 0.2)' : 'transparent'};">
              <i class="${isStudied ? 'fas fa-check-circle' : 'far fa-circle'}" style="color: ${isStudied ? 'var(--success)' : 'var(--text-muted)'}; margin-top: 3px; font-size: 1.1rem;"></i>
              <span style="font-size: 0.9rem; color: ${isStudied ? 'var(--text-primary)' : 'var(--text-secondary)'}; line-height: 1.4;">${topic}</span>
            </div>
          `;
        });

        const subjectProgress = Math.round((subjectCompleted / subject.topics.length) * 100);

        html += `
          <div class="glass-panel" style="padding: 20px; border-radius: 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px solid var(--panel-border); padding-bottom: 10px;">
              <h4 style="font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 8px; color: var(--text-primary);">
                <i class="fas ${subject.icon}" style="color: var(--accent-cyan);"></i> ${subject.name}
              </h4>
              <span style="font-size: 0.8rem; font-weight: 700; color: ${subjectProgress === 100 ? 'var(--success)' : 'var(--brand-primary)'};">${subjectCompleted}/${subject.topics.length}</span>
            </div>
            
            <div style="width: 100%; height: 6px; background: rgba(255,255,255,0.05); border-radius: 3px; overflow: hidden; margin-bottom: 20px;">
              <div style="height: 100%; width: ${subjectProgress}%; background: ${subjectProgress === 100 ? 'var(--success)' : 'var(--brand-gradient)'}; border-radius: 3px;"></div>
            </div>

            <div style="max-height: 300px; overflow-y: auto; padding-right: 5px;" class="custom-scroll">
              ${subjectTopicsHtml}
            </div>
          </div>
        `;
      });

      html += `
          </div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
      <style>
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
      </style>
    `;

    container.innerHTML = html;

    const backBtn = container.querySelector('#back-to-dash-btn');
    if (backBtn && this.navigateTo) {
      backBtn.addEventListener('click', () => {
        this.navigateTo('dashboard');
      });
    }
  }
}
