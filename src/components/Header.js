import { storage } from '../services/storage.js';

export class Header {
  constructor(onSettingsChanged) {
    this.onSettingsChanged = onSettingsChanged;
    this.title = 'Dashboard';
  }

  setTitle(title) {
    this.title = title;
    const titleEl = document.getElementById('header-title');
    if (titleEl) {
      titleEl.innerText = title;
    }
  }

  render(container) {
    container.innerHTML = `
      <header class="glass-panel" style="height: var(--header-height); border-radius: 0; border-bottom: 1px solid var(--panel-border); border-top: none; border-left: none; border-right: none; display: flex; justify-content: space-between; align-items: center; padding: 0 30px; position: sticky; top: 0; z-index: 50;">
        <!-- Left Title -->
        <h1 id="header-title" style="font-size: 1.35rem; font-weight: 700; font-family: var(--font-heading);">${this.title}</h1>

        <!-- Right Controls -->
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="font-size: 0.8rem; color: var(--accent-cyan); font-weight: 700; background: rgba(0, 242, 254, 0.08); padding: 5px 12px; border-radius: 20px; font-family: var(--font-heading);">
            <i class="fas fa-graduation-cap"></i> RSSB BCI prep
          </span>
        </div>
      </header>
    `;
  }
}
