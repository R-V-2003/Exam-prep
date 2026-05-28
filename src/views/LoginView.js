import { storage } from '../services/storage.js';

export class LoginView {
  constructor(onLoginSuccess) {
    this.onLoginSuccess = onLoginSuccess;
    this.mode = 'login'; // 'login' | 'register'
    this.error = '';
    this.isLoading = false;
  }

  render(container) {
    container.innerHTML = `
      <div class="login-screen">
        <div class="login-bg-gradient"></div>
        <div class="login-card glass-panel animate-fade-in">
          <div class="login-brand">
            <div class="login-brand-icon">
              <i class="fas fa-graduation-cap"></i>
            </div>
            <h1>GovPrep AI</h1>
            <p>RSSB Computer Instructor Exam Preparation</p>
          </div>

          <div class="login-tabs">
            <button id="tab-login" class="login-tab ${this.mode === 'login' ? 'active' : ''}">Sign In</button>
            <button id="tab-register" class="login-tab ${this.mode === 'register' ? 'active' : ''}">Create Account</button>
          </div>

          <form id="auth-form" class="login-form">
            ${this.mode === 'register' ? `
              <div class="login-field">
                <label for="auth-display-name"><i class="fas fa-user"></i> Display Name</label>
                <input type="text" id="auth-display-name" placeholder="Your name" autocomplete="name" />
              </div>
            ` : ''}

            <div class="login-field">
              <label for="auth-username"><i class="fas fa-at"></i> Username</label>
              <input type="text" id="auth-username" placeholder="Enter username" autocomplete="username" required />
            </div>

            <div class="login-field">
              <label for="auth-password"><i class="fas fa-lock"></i> Password</label>
              <input type="password" id="auth-password" placeholder="Enter password" autocomplete="${this.mode === 'register' ? 'new-password' : 'current-password'}" required />
            </div>

            ${this.error ? `<div class="login-error"><i class="fas fa-exclamation-circle"></i> ${this.error}</div>` : ''}

            <button type="submit" class="glow-btn login-submit" ${this.isLoading ? 'disabled' : ''}>
              ${this.isLoading ? '<i class="fas fa-spinner fa-spin"></i> Please wait...' :
                this.mode === 'login' ? '<i class="fas fa-sign-in-alt"></i> Sign In' : '<i class="fas fa-user-plus"></i> Create Account'}
            </button>
          </form>

          <p class="login-footer">
            ${this.mode === 'login'
              ? 'Don\'t have an account? <a href="#" id="switch-to-register">Create one</a>'
              : 'Already have an account? <a href="#" id="switch-to-login">Sign in</a>'}
          </p>
        </div>
      </div>

      <style>
        .login-screen {
          position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
          display: flex; align-items: center; justify-content: center;
          background: var(--bg-primary);
          z-index: 9999;
        }
        .login-bg-gradient {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background:
            radial-gradient(ellipse at 20% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 20%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, rgba(0, 242, 254, 0.08) 0%, transparent 50%);
          pointer-events: none;
        }
        .login-card {
          position: relative;
          width: 420px; max-width: 92vw;
          padding: 40px;
          border-radius: 24px;
          text-align: center;
        }
        .login-brand { margin-bottom: 30px; }
        .login-brand-icon {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: var(--brand-gradient);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 16px;
          font-size: 1.8rem; color: white;
          box-shadow: 0 8px 30px rgba(99, 102, 241, 0.3);
        }
        .login-brand h1 {
          font-family: var(--font-heading);
          font-size: 1.8rem; font-weight: 800;
          background: var(--brand-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 6px;
        }
        .login-brand p {
          font-size: 0.85rem; color: var(--text-secondary);
        }
        .login-tabs {
          display: flex; gap: 4px;
          background: rgba(15, 23, 42, 0.3);
          border: 1px solid var(--panel-border);
          border-radius: 12px; padding: 4px;
          margin-bottom: 25px;
        }
        .login-tab {
          flex: 1; padding: 10px;
          border: none; border-radius: 10px;
          background: transparent;
          color: var(--text-secondary);
          font-family: var(--font-heading);
          font-weight: 700; font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .login-tab.active {
          background: var(--brand-gradient);
          color: white;
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }
        .login-form { display: flex; flex-direction: column; gap: 18px; }
        .login-field { text-align: left; }
        .login-field label {
          display: block; font-size: 0.8rem; font-weight: 600;
          color: var(--text-secondary); margin-bottom: 6px;
          display: flex; align-items: center; gap: 6px;
        }
        .login-field label i { color: var(--brand-primary); font-size: 0.75rem; }
        .login-field input {
          width: 100%; padding: 12px 16px;
          background: rgba(15, 23, 42, 0.4);
          border: 1px solid var(--panel-border);
          border-radius: 12px;
          color: var(--text-primary);
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s;
          box-sizing: border-box;
        }
        .login-field input:focus {
          border-color: var(--brand-primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
        }
        .login-field input::placeholder { color: var(--text-muted); }
        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--danger);
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.85rem;
          display: flex; align-items: center; gap: 8px;
        }
        .login-submit {
          width: 100%; padding: 14px;
          font-size: 1rem; font-weight: 700;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center; gap: 8px;
          margin-top: 5px;
        }
        .login-footer {
          margin-top: 20px;
          font-size: 0.85rem;
          color: var(--text-muted);
        }
        .login-footer a {
          color: var(--brand-primary);
          text-decoration: none;
          font-weight: 600;
        }
        .login-footer a:hover { text-decoration: underline; }
      </style>
    `;

    this.attachEvents(container);
  }

  attachEvents(container) {
    const tabLogin = container.querySelector('#tab-login');
    const tabRegister = container.querySelector('#tab-register');
    const switchToRegister = container.querySelector('#switch-to-register');
    const switchToLogin = container.querySelector('#switch-to-login');
    const form = container.querySelector('#auth-form');

    if (tabLogin) {
      tabLogin.addEventListener('click', () => {
        this.mode = 'login'; this.error = ''; this.render(container);
      });
    }
    if (tabRegister) {
      tabRegister.addEventListener('click', () => {
        this.mode = 'register'; this.error = ''; this.render(container);
      });
    }
    if (switchToRegister) {
      switchToRegister.addEventListener('click', (e) => {
        e.preventDefault();
        this.mode = 'register'; this.error = ''; this.render(container);
      });
    }
    if (switchToLogin) {
      switchToLogin.addEventListener('click', (e) => {
        e.preventDefault();
        this.mode = 'login'; this.error = ''; this.render(container);
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = container.querySelector('#auth-username')?.value;
        const password = container.querySelector('#auth-password')?.value;
        const displayName = container.querySelector('#auth-display-name')?.value;

        if (!username || !password) {
          this.error = 'Please fill in all fields';
          this.render(container);
          return;
        }

        this.isLoading = true;
        this.error = '';
        this.render(container);

        try {
          if (this.mode === 'register') {
            await storage.register(username, password, displayName);
          } else {
            await storage.login(username, password);
          }
          // Success
          if (this.onLoginSuccess) this.onLoginSuccess();
        } catch (err) {
          this.error = err.message;
          this.isLoading = false;
          this.render(container);
        }
      });
    }
  }
}
