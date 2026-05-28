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
      <header class="glass-panel" style="height: var(--header-height); border-radius: 0; border-bottom: 1px solid var(--panel-border); border-top: none; border-left: none; border-right: none; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; position: sticky; top: 0; z-index: 50;">
        <!-- Left Title & Toggle -->
        <div style="display: flex; align-items: center;">
          <button id="mobile-menu-toggle" class="mobile-nav-toggle" style="background: transparent; border: none; color: var(--text-primary); font-size: 1.25rem; margin-right: 15px; cursor: pointer; padding: 5px; display: none;">
            <i class="fas fa-bars"></i>
          </button>
          <h1 id="header-title" style="font-size: 1.25rem; font-weight: 700; font-family: var(--font-heading);">${this.title}</h1>
        </div>

        <!-- Right Controls -->
        <div style="display: flex; align-items: center; gap: 15px;">
          <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 700; background: rgba(0, 242, 254, 0.08); padding: 5px 12px; border-radius: 20px; font-family: var(--font-heading);">
            <i class="fas fa-graduation-cap"></i> RSSB BCI prep
          </span>
        </div>
      </header>
    `;

    // Toggle logic for mobile navigation drawer
    const toggleBtn = container.querySelector('#mobile-menu-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar-target');
        if (sidebar) {
          sidebar.classList.add('mobile-open');
          
          // Create or activate backdrop
          let backdrop = document.querySelector('.sidebar-backdrop');
          if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            document.body.appendChild(backdrop);
            backdrop.addEventListener('click', () => {
              sidebar.classList.remove('mobile-open');
              backdrop.classList.remove('active');
            });
          }
          setTimeout(() => backdrop.classList.add('active'), 10);
        }
      });
    }
  }
}
