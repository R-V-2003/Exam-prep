import { storage } from '../services/storage.js';

export class Sidebar {
  constructor(onNavigate, onLogout) {
    this.onNavigate = onNavigate;
    this.onLogout = onLogout;
    this.container = null;
    this.currentViewId = 'dashboard';
  }

  render(container) {
    this.container = container;
    container.innerHTML = `
      <nav class="sidebar">
        <div class="sidebar-brand">
          <a href="#" class="brand-logo">
            <div class="brand-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            GovPrep AI
          </a>
        </div>

        <div class="sidebar-nav">
          <a href="#" class="nav-item active" data-route="dashboard">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
          </a>
          
          <div style="margin: 15px 0 5px 16px; font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.05em;">Preparation</div>
          
          <a href="#" class="nav-item" data-route="topic-practice">
            <i class="fas fa-book-open"></i>
            <span>Topic Practice</span>
          </a>
          
          <a href="#" class="nav-item" data-route="test-gen">
            <i class="fas fa-vial"></i>
            <span>Custom Mocks</span>
          </a>
          
          <a href="#" class="nav-item" data-route="pyqs">
            <i class="fas fa-history"></i>
            <span>Previous Papers</span>
          </a>

          <a href="#" class="nav-item" data-route="study-material">
            <i class="fas fa-book-reader"></i>
            <span>Study Content</span>
          </a>

          <a href="#" class="nav-item" data-route="analysis">
            <i class="fas fa-chart-bar"></i>
            <span>Analysis</span>
          </a>
        </div>

        <div class="sidebar-user-section" style="padding: 16px; border-top: 1px solid var(--panel-border);">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
            <div style="width: 34px; height: 34px; border-radius: 10px; background: var(--brand-gradient); display: flex; align-items: center; justify-content: center; font-size: 0.85rem; color: white; font-weight: 700; flex-shrink: 0;">
              ${(storage.getUserDisplayName() || 'G').charAt(0).toUpperCase()}
            </div>
            <div style="overflow: hidden;">
              <div style="font-size: 0.85rem; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${storage.getUserDisplayName()}</div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">@${storage.getCurrentUser() || 'guest'}</div>
            </div>
          </div>
          <button id="sidebar-logout-btn" class="outline-btn" style="width: 100%; padding: 8px; font-size: 0.78rem; display: flex; align-items: center; justify-content: center; gap: 6px; border-color: rgba(239,68,68,0.3); color: var(--danger);">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </nav>
    `;

    this.attachEvents();
    this.setActive(this.currentViewId);
  }

  attachEvents() {
    const navItems = this.container.querySelectorAll('.nav-item[data-route]');
    navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route');
        if (this.onNavigate) {
          this.onNavigate(route);
        }
        
        // Auto-close sidebar on mobile
        const sidebarTarget = document.getElementById('sidebar-target');
        if (sidebarTarget && sidebarTarget.classList.contains('mobile-open')) {
          sidebarTarget.classList.remove('mobile-open');
          const backdrop = document.querySelector('.sidebar-backdrop');
          if (backdrop) backdrop.classList.remove('active');
        }
      });
    });

    const logoutBtn = this.container.querySelector('#sidebar-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        if (this.onLogout) this.onLogout();
      });
    }
  }

  setActive(viewId) {
    this.currentViewId = viewId;
    if (!this.container) return;

    const navItems = this.container.querySelectorAll('.nav-item[data-route]');
    navItems.forEach(item => {
      item.classList.remove('active');
      if (item.getAttribute('data-route') === viewId) {
        item.classList.add('active');
      }
    });
  }
}
