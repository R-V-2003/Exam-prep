import { gemini } from '../services/gemini.js';
import { bciSyllabus } from '../data/bciSyllabus.js';
import { storage } from '../services/storage.js';

export class StudyMaterialView {
  constructor() {
    this.viewState = 'list'; // 'list' | 'content'
    this.subject = null;
    this.topic = null;
    this.content = null;
    this.isLoading = false;
    this.error = null;
    this.activePaperTab = 'Paper II';
  }



  render(container) {
    if (this.viewState === 'list') {
      this.renderList(container);
    } else {
      this.renderContent(container);
    }
  }

  renderList(container) {
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--panel-border); padding-bottom: 15px;">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.4rem; color: var(--text-primary);">Study Content</h2>
            <p style="color: var(--text-secondary); font-size: 0.85rem; margin-top: 3px;">Select a topic to generate an AI-powered comprehensive study guide based on the syllabus.</p>
          </div>
          
          <div style="display: flex; background: rgba(15, 23, 42, 0.2); border: 1px solid var(--panel-border); padding: 4px; border-radius: 12px; height: max-content;">
            <button id="study-tab-1" class="outline-btn" style="padding: 8px 16px; border: none; border-radius: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast); ${this.activePaperTab === 'Paper I' ? 'background: var(--brand-gradient); color: white;' : 'color: var(--text-secondary);'}">Paper I (Aptitude & GK)</button>
            <button id="study-tab-2" class="outline-btn" style="padding: 8px 16px; border: none; border-radius: 10px; font-family: var(--font-heading); font-weight: 700; font-size: 0.8rem; cursor: pointer; transition: all var(--transition-fast); ${this.activePaperTab === 'Paper II' ? 'background: var(--brand-gradient); color: white;' : 'color: var(--text-secondary);'}">Paper II (Computer Science)</button>
          </div>
        </div>

        <div style="display: flex; flex-direction: column; gap: 15px;">
          ${this.renderSubjects()}
        </div>
      </div>
      <style>
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

    this.attachListEvents(container);
  }

  renderSubjects() {
    const paperData = bciSyllabus.papers[this.activePaperTab];
    if (!paperData) return '';

    return paperData.subjects.map((sub, idx) => {
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
                    <button class="outline-btn read-study-guide-btn" data-subject="${sub.name}" data-topic="${topic}" style="padding: 6px 14px; font-size: 0.75rem; border-radius: 8px; display: flex; align-items: center; gap: 6px; font-family: var(--font-heading); font-weight: 700;">
                      <i class="fas fa-book" style="font-size: 0.65rem; color: var(--accent-cyan);"></i> Read Guide
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

  attachListEvents(container) {
    const tab1 = container.querySelector('#study-tab-1');
    const tab2 = container.querySelector('#study-tab-2');

    if (tab1 && tab2) {
      tab1.addEventListener('click', () => {
        this.activePaperTab = 'Paper I';
        this.render(container);
      });
      tab2.addEventListener('click', () => {
        this.activePaperTab = 'Paper II';
        this.render(container);
      });
    }

    container.querySelectorAll('.collapsible-header').forEach(header => {
      header.addEventListener('click', () => {
        const card = header.parentElement;
        const isActive = card.classList.contains('active');
        container.querySelectorAll('.collapsible-card').forEach(c => c.classList.remove('active'));
        if (!isActive) {
          card.classList.add('active');
        }
      });
    });

    container.querySelectorAll('.read-study-guide-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.subject = btn.getAttribute('data-subject');
        this.topic = btn.getAttribute('data-topic');
        this.viewState = 'content';
        this.isLoading = true;
        this.error = null;
        this.render(container);
        this.loadContent(container);
      });
    });
  }

  async loadContent(container) {
    try {
      storage.markTopicStudied(this.topic);
      this.content = await gemini.generateStudyGuide(this.subject, this.topic);
    } catch (err) {
      this.error = err.message;
    } finally {
      this.isLoading = false;
      this.render(container);
    }
  }

  parseMarkdown(text) {
    // Normalize line endings
    let md = text.replace(/\r\n/g, '\n');

    // Code blocks (``` ... ```)
    md = md.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
      return `<pre class="study-code"><code>${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
    });

    // Inline code
    md = md.replace(/`([^`]+)`/g, '<code class="study-inline-code">$1</code>');

    // Tables
    md = md.replace(/((?:\|.*\|(?:\n|$))+)/g, (tableBlock) => {
      const rows = tableBlock.trim().split('\n').filter(r => r.trim());
      if (rows.length < 2) return tableBlock;

      // Check if row 2 is a separator (|---|---|)
      const isSep = /^\|[\s\-:|]+\|$/.test(rows[1].trim());
      let html = '<div class="study-table-wrap"><table class="study-table">';

      rows.forEach((row, i) => {
        if (isSep && i === 1) return; // skip separator row
        const cells = row.split('|').filter((c, ci, arr) => ci > 0 && ci < arr.length - 1);
        const tag = (isSep && i === 0) ? 'th' : 'td';
        const rowTag = (isSep && i === 0) ? 'thead' : '';
        if (i === 0 && isSep) html += '<thead>';
        if (i === 2 && isSep) html += '<tbody>';
        html += '<tr>' + cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('') + '</tr>';
        if (i === 0 && isSep) html += '</thead>';
      });
      if (isSep && rows.length > 2) html += '</tbody>';
      html += '</table></div>';
      return html;
    });

    // Split into lines for block-level processing
    const lines = md.split('\n');
    let result = [];
    let inList = false;
    let listType = ''; // 'ul' or 'ol'

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Headings
      if (trimmed.startsWith('#### ')) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push(`<h5 class="study-h4">${this.inlineFormat(trimmed.slice(5))}</h5>`);
        continue;
      }
      if (trimmed.startsWith('### ')) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push(`<h4 class="study-h3">${this.inlineFormat(trimmed.slice(4))}</h4>`);
        continue;
      }
      if (trimmed.startsWith('## ')) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push(`<h3 class="study-h2">${this.inlineFormat(trimmed.slice(3))}</h3>`);
        continue;
      }
      if (trimmed.startsWith('# ')) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push(`<h2 class="study-h1">${this.inlineFormat(trimmed.slice(2))}</h2>`);
        continue;
      }

      // Horizontal rule
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push('<hr class="study-hr">');
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        if (inList) { result.push(`</${listType}>`); inList = false; }
        result.push(`<blockquote class="study-blockquote"><i class="fas fa-lightbulb study-bq-icon"></i> ${this.inlineFormat(trimmed.slice(2))}</blockquote>`);
        continue;
      }

      // Unordered list items (- or * prefix)
      const ulMatch = trimmed.match(/^[-*]\s+(.*)/);
      if (ulMatch) {
        if (!inList || listType !== 'ul') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ul class="study-ul">');
          inList = true;
          listType = 'ul';
        }
        result.push(`<li>${this.inlineFormat(ulMatch[1])}</li>`);
        continue;
      }

      // Ordered list items (1. 2. etc)
      const olMatch = trimmed.match(/^\d+\.\s+(.*)/);
      if (olMatch) {
        if (!inList || listType !== 'ol') {
          if (inList) result.push(`</${listType}>`);
          result.push('<ol class="study-ol">');
          inList = true;
          listType = 'ol';
        }
        result.push(`<li>${this.inlineFormat(olMatch[1])}</li>`);
        continue;
      }

      // Close any open list on blank/non-list line
      if (inList) {
        result.push(`</${listType}>`);
        inList = false;
      }

      // Skip empty lines (spacing handled by CSS)
      if (trimmed === '') continue;

      // Already processed blocks (tables, pre)
      if (trimmed.startsWith('<')) {
        result.push(line);
        continue;
      }

      // Regular paragraph
      result.push(`<p class="study-para">${this.inlineFormat(trimmed)}</p>`);
    }

    if (inList) result.push(`</${listType}>`);

    return result.join('\n');
  }

  inlineFormat(text) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  }

  renderContent(container) {
    container.innerHTML = `
      <div class="animate-fade-in" style="max-width: 900px; margin: 0 auto; padding-bottom: 50px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid var(--panel-border); padding-bottom: 15px;">
          <div>
            <button id="back-to-topics-btn" class="outline-btn" style="padding: 6px 12px; margin-bottom: 15px; font-size: 0.8rem; display: flex; align-items: center; gap: 8px;">
              <i class="fas fa-arrow-left"></i> Back to Topics
            </button>
            <h2 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--text-primary);">
              <i class="fas fa-book-open" style="color: var(--accent-cyan); margin-right: 10px;"></i>
              ${this.topic}
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 5px;">Subject: ${this.subject}</p>
          </div>
        </div>

        <div class="glass-panel study-content-panel" style="padding: 35px 40px; border-radius: 16px;">
          ${this.isLoading ? this.renderSkeleton() : 
            this.error ? this.renderError() : 
            `<div class="study-body">${this.parseMarkdown(this.content)}</div>`
          }
        </div>
      </div>

      <style>
        .study-body { color: var(--text-primary); font-size: 1rem; overflow-wrap: break-word; line-height: 1.8; }
        .study-h1 { font-family: var(--font-heading); font-size: 1.6rem; color: var(--accent-cyan); margin: 30px 0 15px; border-bottom: 2px solid rgba(0,242,254,0.2); padding-bottom: 8px; }
        .study-h2 { font-family: var(--font-heading); font-size: 1.35rem; color: var(--accent-cyan); margin: 28px 0 12px; border-bottom: 2px solid rgba(0,242,254,0.15); padding-bottom: 6px; }
        .study-h3 { font-family: var(--font-heading); font-size: 1.15rem; color: var(--brand-primary); margin: 22px 0 10px; border-bottom: 1px solid rgba(99,102,241,0.2); padding-bottom: 5px; }
        .study-h4 { font-family: var(--font-heading); font-size: 1.05rem; color: var(--brand-secondary); margin: 18px 0 8px; }
        .study-hr { border: none; border-top: 1px solid var(--panel-border); margin: 25px 0; }
        .study-para { margin-bottom: 16px; line-height: 1.8; color: var(--text-secondary); font-size: 1rem; }
        .study-para strong { color: var(--text-primary); }
        .study-blockquote {
          border-left: 4px solid var(--accent-cyan);
          background: rgba(0,242,254,0.04);
          padding: 14px 18px;
          margin: 18px 0;
          border-radius: 0 10px 10px 0;
          color: var(--text-primary);
          font-size: 0.95rem;
          line-height: 1.7;
        }
        .study-bq-icon { color: var(--accent-cyan); margin-right: 10px; }
        .study-ul, .study-ol {
          padding-left: 8px;
          margin: 12px 0;
          list-style: none;
        }
        .study-ul li, .study-ol li {
          position: relative;
          padding: 8px 12px 8px 28px;
          margin-bottom: 6px;
          background: rgba(15, 23, 42, 0.15);
          border: 1px solid var(--panel-border);
          border-radius: 8px;
          line-height: 1.7;
          font-size: 0.95rem;
          color: var(--text-secondary);
          transition: border-color 0.2s;
        }
        .study-ul li:hover, .study-ol li:hover {
          border-color: var(--panel-border-hover);
        }
        .study-ul li::before {
          content: '';
          position: absolute;
          left: 12px;
          top: 16px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--brand-primary);
        }
        .study-ol { counter-reset: study-counter; }
        .study-ol li { counter-increment: study-counter; }
        .study-ol li::before {
          content: counter(study-counter);
          position: absolute;
          left: 8px;
          top: 8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(99,102,241,0.15);
          color: var(--brand-primary);
          font-size: 0.7rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .study-ul li strong, .study-ol li strong { color: var(--text-primary); }
        .study-code {
          background: rgba(15,23,42,0.6);
          padding: 18px;
          border-radius: 12px;
          overflow-x: auto;
          font-family: 'Fira Code', monospace;
          color: #a5b4fc;
          border: 1px solid var(--panel-border);
          margin: 20px 0;
          font-size: 0.9rem;
          line-height: 1.6;
          box-shadow: inset 0 2px 10px rgba(0,0,0,0.2);
        }
        .study-inline-code {
          background: rgba(99,102,241,0.12);
          padding: 2px 7px;
          border-radius: 5px;
          font-family: 'Fira Code', monospace;
          color: #818cf8;
          font-size: 0.88em;
        }
        .study-table-wrap { overflow-x: auto; margin: 18px 0; border-radius: 10px; border: 1px solid var(--panel-border); }
        .study-table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
        .study-table th {
          background: rgba(99,102,241,0.1);
          color: var(--brand-primary);
          font-weight: 700;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 2px solid var(--panel-border);
        }
        .study-table td {
          padding: 10px 16px;
          border-bottom: 1px solid var(--panel-border);
          color: var(--text-secondary);
          line-height: 1.6;
        }
        .study-table tr:last-child td { border-bottom: none; }
        .study-table tr:hover td { background: rgba(99,102,241,0.03); }
      </style>
    `;

    const backBtn = container.querySelector('#back-to-topics-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.viewState = 'list';
        this.render(container);
      });
    }
  }

  renderSkeleton() {
    return `
      <div style="display: flex; flex-direction: column; gap: 20px; align-items: center; justify-content: center; padding: 40px 0;">
        <div style="position: relative; width: 60px; height: 60px; margin-bottom: 15px;">
          <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: 50%; border: 3px solid rgba(0, 242, 254, 0.1); border-top-color: var(--accent-cyan); animation: spinLoader 1s linear infinite;"></div>
          <i class="fas fa-brain" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); font-size: 1.4rem; color: var(--accent-cyan);"></i>
        </div>
        <h3 style="font-family: var(--font-heading); color: var(--text-primary);">Generating Study Guide...</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; max-width: 400px; text-align: center;">The AI is reading the syllabus and assembling a detailed concept review for "${this.topic}". This takes a few seconds.</p>
        
        <div style="width: 100%; margin-top: 30px; display: flex; flex-direction: column; gap: 15px; opacity: 0.3; animation: pulseMagic 1.5s infinite;">
          <div style="height: 24px; width: 40%; background: var(--panel-border); border-radius: 4px;"></div>
          <div style="height: 16px; width: 100%; background: var(--panel-border); border-radius: 4px;"></div>
          <div style="height: 16px; width: 90%; background: var(--panel-border); border-radius: 4px;"></div>
          <div style="height: 16px; width: 95%; background: var(--panel-border); border-radius: 4px;"></div>
        </div>
      </div>
      <style>
        @keyframes spinLoader { to { transform: rotate(360deg); } }
        @keyframes pulseMagic { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      </style>
    `;
  }

  renderError() {
    return `
      <div style="text-align: center; padding: 40px;">
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: var(--danger); margin-bottom: 15px;"></i>
        <h3 style="color: var(--text-primary); margin-bottom: 10px;">Failed to generate content</h3>
        <p style="color: var(--text-secondary);">${this.error}</p>
      </div>
    `;
  }
}
