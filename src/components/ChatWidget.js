import { storage } from '../services/storage.js';
import { gemini } from '../services/gemini.js';

export class ChatWidget {
  constructor() {
    this.messages = [];
    this.activeQuestion = null;
    this.isLoading = false;
    this.isOpen = false;
    this.container = null;
    this.init();
  }

  init() {
    // Create the global container for the widget
    this.container = document.createElement('div');
    this.container.id = 'chat-widget-container';
    this.container.style.position = 'fixed';
    this.container.style.bottom = '20px';
    this.container.style.right = '20px';
    this.container.style.zIndex = '9999';
    this.container.style.display = 'flex';
    this.container.style.flexDirection = 'column';
    this.container.style.alignItems = 'flex-end';
    document.body.appendChild(this.container);

    this.render();
  }

  setContextQuestion(question) {
    this.activeQuestion = question;
    if (question) {
      this.messages = [{
        sender: 'tutor',
        text: `I've loaded your mock test question regarding **${question.subject}**. How can I help you understand this question better?`,
        citations: []
      }];
      this.isOpen = true; // Auto-open when context is set
    } else {
      this.messages = [];
    }
    this.render();
  }

  toggleOpen() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  render() {
    const hasKey = storage.hasApiKey();

    if (this.isOpen) {
      this.container.innerHTML = `
        <div class="chat-widget-window glass-panel" style="width: 380px; height: 600px; max-height: 80vh; max-width: 90vw; display: flex; flex-direction: column; border-radius: 16px; margin-bottom: 15px; box-shadow: 0 10px 40px rgba(0,0,0,0.5); overflow: hidden; animation: slideUp 0.3s ease; background: var(--panel-bg);">
          
          <!-- Header -->
          <div style="background: rgba(99,102,241,0.1); padding: 15px; border-bottom: 1px solid var(--panel-border); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <i class="fas fa-robot" style="color: var(--brand-primary); font-size: 1.2rem;"></i>
              <span style="font-family: var(--font-heading); font-weight: 600; font-size: 1.1rem; color: var(--text-primary);">AI Tutor</span>
            </div>
            <button id="close-chat-widget" style="color: var(--text-secondary); background: none; border: none; cursor: pointer; font-size: 1.1rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <!-- Context Banner -->
          ${this.activeQuestion ? `
            <div style="background: rgba(0,242,254,0.08); border-bottom: 1px solid var(--panel-border); padding: 10px 15px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 0.8rem; color: var(--accent-cyan); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 80%;">
                <i class="fas fa-info-circle"></i> Context: ${this.activeQuestion.subject}
              </div>
              <button id="clear-chat-context" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:0.75rem;">Clear</button>
            </div>
          ` : ''}

          <!-- Feed -->
          <div id="chat-feed" class="chat-messages" style="flex: 1; overflow-y: auto; padding: 15px; display: flex; flex-direction: column; gap: 15px;">
             ${this.messages.length === 0 ? this.renderWelcomeMessage() : this.renderMessages()}
          </div>

          <!-- Input Area -->
          <div style="padding: 15px; border-top: 1px solid var(--panel-border); background: rgba(0,0,0,0.2);">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px; align-items: center;">
              <div style="display: flex; align-items: center; gap: 6px;">
                <label class="toggle-switch" style="transform: scale(0.7); transform-origin: left center; margin: 0;">
                  <input type="checkbox" id="chat-grounding-toggle" ${hasKey ? 'checked' : ''}>
                  <span class="slider"></span>
                </label>
                <span style="font-size: 0.75rem; color: var(--text-secondary);">Search Live</span>
              </div>
            </div>
            <div style="display: flex; gap: 10px;">
              <input type="text" id="chat-text-box" class="glass-input" placeholder="Ask a doubt..." style="flex: 1; border-radius: 20px; padding: 10px 15px; font-size: 0.9rem; border: 1px solid var(--panel-border);">
              <button id="chat-send-btn" class="glow-btn" style="border-radius: 50%; width: 42px; height: 42px; display: flex; justify-content: center; align-items: center; padding: 0; flex-shrink: 0;">
                <i class="fas fa-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      `;
    } else {
      this.container.innerHTML = `
        <!-- Toggle Button (Closed state) -->
        <button id="chat-widget-toggle" class="glow-btn" style="width: 60px; height: 60px; border-radius: 50%; font-size: 1.5rem; display: flex; justify-content: center; align-items: center; box-shadow: 0 4px 20px rgba(99,102,241,0.4);">
          <i class="fas fa-comment-dots"></i>
        </button>
      `;
    }

    this.attachEvents();
    if (this.isOpen) this.scrollToBottom();
  }

  renderWelcomeMessage() {
    return `
      <div style="margin: auto; text-align: center; padding: 20px; display: flex; flex-direction: column; align-items: center; gap: 15px;" class="animate-fade-in">
        <div style="width: 50px; height: 50px; border-radius: 50%; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--panel-border-hover); display: flex; justify-content: center; align-items: center;">
          <i class="fas fa-robot" style="color: var(--brand-primary); font-size: 1.4rem;"></i>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-primary);">GovPrep Assistant</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.5;">Ask doubts regarding formulas, polity concepts, or current affairs.</p>
        
        <div style="display: flex; flex-direction: column; gap: 8px; width: 100%; margin-top: 10px;">
          <button class="preset-btn outline-btn" data-query="Explain Fundamental Rights" style="font-size: 0.8rem; padding: 8px;">
             Fundamental Rights
          </button>
          <button class="preset-btn outline-btn" data-query="Quant Speed Formulas" style="font-size: 0.8rem; padding: 8px;">
             Quant Formulas
          </button>
        </div>
      </div>
    `;
  }

  renderMessages() {
    return this.messages.map(msg => {
      const isUser = msg.sender === 'user';
      
      let textHTML = msg.text;
      if (!isUser) {
        textHTML = textHTML
          .replace(/### (.*)/g, '<h4 style="margin: 10px 0 5px 0; color: var(--brand-primary); font-size: 1rem;">$1</h4>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n-\s(.*)/g, '<li style="margin-left: 15px; margin-bottom: 4px; font-size: 0.9rem;">$1</li>')
          .split('\n\n').map(p => {
            if (p.trim().startsWith('<li') || p.trim().startsWith('<h4')) return p;
            return `<p style="margin-bottom: 10px; font-size: 0.9rem; line-height: 1.4;">${p.trim()}</p>`;
          }).join('');
      } else {
        textHTML = textHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      return `
        <div style="display: flex; justify-content: ${isUser ? 'flex-end' : 'flex-start'}; margin-bottom: 5px;">
          <div style="max-width: 85%; padding: 10px 14px; border-radius: 12px; ${isUser ? 'background: var(--brand-primary); color: #fff; border-bottom-right-radius: 2px;' : 'background: rgba(255,255,255,0.05); color: var(--text-primary); border-bottom-left-radius: 2px; border: 1px solid var(--panel-border);'}">
            ${textHTML}
            ${(!isUser && msg.citations && msg.citations.length > 0) ? `
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 5px;">
                ${msg.citations.map(c => `
                  <a href="${c.url}" target="_blank" style="font-size: 0.7rem; color: var(--accent-cyan); background: rgba(0,242,254,0.1); padding: 2px 6px; border-radius: 4px; text-decoration: none;">
                    <i class="fas fa-link"></i> ${c.title.substring(0, 15)}...
                  </a>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  attachEvents() {
    const toggleBtn = this.container.querySelector('#chat-widget-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleOpen());
    }

    const closeBtn = this.container.querySelector('#close-chat-widget');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.toggleOpen());
    }

    const sendBtn = this.container.querySelector('#chat-send-btn');
    const textBox = this.container.querySelector('#chat-text-box');
    
    const triggerSend = () => {
      const text = textBox.value.trim();
      if (text && !this.isLoading) {
        this.sendMessage(text);
        textBox.value = '';
      }
    };

    if (sendBtn && textBox) {
      sendBtn.addEventListener('click', triggerSend);
      textBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSend();
      });
    }

    this.container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (!this.isLoading) {
          this.sendMessage(query);
        }
      });
    });

    const clearCtx = this.container.querySelector('#clear-chat-context');
    if (clearCtx) {
      clearCtx.addEventListener('click', () => {
        this.setContextQuestion(null);
      });
    }
  }

  async sendMessage(text) {
    this.messages.push({ sender: 'user', text, citations: [] });
    this.isLoading = true;
    this.renderMessageFeedOnly();

    const feed = this.container.querySelector('#chat-feed');
    const tempIndicator = document.createElement('div');
    tempIndicator.id = 'chat-temp-loading';
    tempIndicator.style.display = 'flex';
    tempIndicator.innerHTML = `<div style="background: rgba(255,255,255,0.05); padding: 10px 14px; border-radius: 12px; border-bottom-left-radius: 2px; border: 1px solid var(--panel-border);">
        <i class="fas fa-circle-notch fa-spin" style="color: var(--accent-cyan);"></i> Thinking...
      </div>`;
    feed.appendChild(tempIndicator);
    this.scrollToBottom();

    const searchToggle = this.container.querySelector('#chat-grounding-toggle');
    const enableSearch = searchToggle ? searchToggle.checked : false;

    try {
      const response = await gemini.askDoubt(text, this.messages.slice(0, -1), this.activeQuestion, enableSearch);
      
      const loadBubble = this.container.querySelector('#chat-temp-loading');
      if (loadBubble) loadBubble.remove();

      this.messages.push({
        sender: 'tutor',
        text: response.text,
        citations: response.citations || []
      });

    } catch (err) {
      const loadBubble = this.container.querySelector('#chat-temp-loading');
      if (loadBubble) loadBubble.remove();

      this.messages.push({
        sender: 'tutor',
        text: `Error connecting: ${err.message}`,
        citations: []
      });
    } finally {
      this.isLoading = false;
      this.renderMessageFeedOnly();
      this.attachEvents(); 
    }
  }

  renderMessageFeedOnly() {
    const feed = this.container.querySelector('#chat-feed');
    if (feed) {
      feed.innerHTML = this.messages.length === 0 ? this.renderWelcomeMessage() : this.renderMessages();
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    const feed = this.container.querySelector('#chat-feed');
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }
}
