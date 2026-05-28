import { storage } from '../services/storage.js';
import { gemini } from '../services/gemini.js';

export class ChatView {
  constructor() {
    this.messages = [];
    this.activeQuestion = null; // { subject, question, options, correctIndex, explanation }
    this.isLoading = false;
  }

  // Pre-load a context question to ask doubt about
  setContextQuestion(question) {
    this.activeQuestion = question;
    
    // Auto-inject a welcome message context for user ease
    if (question) {
      this.messages = [
        {
          sender: 'tutor',
          text: `I've loaded your mock test question regarding **${question.subject}**. How can I help you understand this question better? You can ask me to explain the core concept, break down the calculations, or provide real-life analogies.`,
          citations: []
        }
      ];
    } else {
      this.messages = [];
    }
  }

  render(container) {
    const hasKey = storage.hasApiKey();

    container.innerHTML = `
      <div class="chat-layout animate-fade-in">
        <!-- Left presets sidebar -->
        <div class="glass-panel chat-presets">
          <div class="preset-title">Study Shortcuts</div>
          <button class="preset-btn" data-query="Explain Part III (Fundamental Rights) of the Indian Constitution in simple terms.">
            <i class="fas fa-balance-scale" style="color: var(--brand-primary); margin-right: 6px;"></i> Explain Fundamental Rights
          </button>
          <button class="preset-btn" data-query="Give me a cheat sheet of quick shortcut formulas for Time, Speed & Distance questions.">
            <i class="fas fa-calculator" style="color: var(--accent-cyan); margin-right: 6px;"></i> Quant Speed Formulas
          </button>
          <button class="preset-btn" data-query="What are the rules and shortcut tricks for Syllogism questions in reasoning?">
            <i class="fas fa-brain" style="color: var(--brand-secondary); margin-right: 6px;"></i> Syllogism Reasoning Rules
          </button>
          <button class="preset-btn" data-query="List the top 5 recent government schemes launched in India for renewable energy.">
            <i class="fas fa-sun" style="color: var(--warning); margin-right: 6px;"></i> Renewable Energy Schemes
          </button>

          ${this.activeQuestion ? `
            <div class="preset-title" style="margin-top: 15px;">Active Context</div>
            <button id="clear-chat-context" class="outline-btn" style="width: 100%; font-size: 0.8rem; padding: 8px; border-color: var(--danger); color: var(--danger);">
              <i class="fas fa-times-circle"></i> Clear Question Context
            </button>
          ` : ''}
        </div>

        <!-- Right Main Chat Workspace -->
        <div class="glass-panel chat-feed-container">
          <!-- Question context banner -->
          ${this.activeQuestion ? `
            <div style="background: rgba(99,102,241,0.08); border-bottom: 1px solid var(--panel-border); padding: 12px 20px; display: flex; align-items: center; justify-content: space-between; border-top-left-radius: 20px; border-top-right-radius: 20px;">
              <span style="font-size: 0.85rem; color: var(--brand-primary); font-weight: 500;">
                <i class="fas fa-info-circle"></i> Question Context Loaded: <strong>${this.activeQuestion.subject}</strong>
              </span>
              <span style="font-size: 0.8rem; color: var(--text-secondary); max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                "${this.activeQuestion.question}"
              </span>
            </div>
          ` : ''}

          <!-- Message Feed -->
          <div id="chat-feed" class="chat-messages">
            ${this.messages.length === 0 ? this.renderWelcomeMessage() : this.renderMessages()}
          </div>

          <!-- Bottom Action Input Area -->
          <div class="chat-input-wrapper glass-panel" style="border-radius: 0; border-bottom: none; border-left: none; border-right: none;">
            <!-- Grounding Toggle -->
            <div class="grounding-toggle-container">
              <label class="toggle-switch">
                <input type="checkbox" id="chat-grounding-toggle" ${hasKey ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
              <span class="toggle-label">Search Live</span>
            </div>

            <!-- Input Container -->
            <div class="chat-input-container">
              <input type="text" id="chat-text-box" class="glass-input chat-text-input" placeholder="Ask your exam or concept doubt here..." style="border-radius: 12px; height: 48px;">
              <button id="chat-send-btn" class="chat-send-btn">
                <i class="fas fa-paper-plane" style="font-size: 0.95rem;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents(container);
    this.scrollToBottom();
  }

  renderWelcomeMessage() {
    return `
      <div style="margin: auto; text-align: center; max-width: 400px; padding: 40px 20px; display: flex; flex-direction: column; align-items: center; gap: 15px;" class="animate-fade-in">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: rgba(99, 102, 241, 0.1); border: 1px solid var(--panel-border-hover); display: flex; justify-content: center; align-items: center; box-shadow: var(--glow-indigo);">
          <i class="fas fa-robot" style="color: var(--brand-primary); font-size: 1.6rem;"></i>
        </div>
        <h3 style="font-family: var(--font-heading); font-size: 1.25rem;">GovPrep AI Study Assistant</h3>
        <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.5;">Ask doubts regarding quantitative aptitude, logical reasoning formulas, historical event details, polity concepts, or current affairs news.</p>
        <span style="font-size: 0.75rem; color: var(--accent-cyan); font-weight: 600; background: rgba(0, 242, 254, 0.08); padding: 4px 10px; border-radius: 20px;">
          <i class="fas fa-globe"></i> Enable "Search Live" for Google Web Grounding
        </span>
      </div>
    `;
  }

  renderMessages() {
    return this.messages.map(msg => {
      const isUser = msg.sender === 'user';
      
      // Simple parse markdown to HTML for tutor responses
      let textHTML = msg.text;
      if (!isUser) {
        textHTML = textHTML
          .replace(/### (.*)/g, '<h4 style="font-family:var(--font-heading); margin: 15px 0 8px 0; color: var(--brand-primary);">$1</h4>')
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\n\d\.\s(.*)/g, '<li style="margin-left: 20px; margin-bottom: 6px;">$1</li>')
          .replace(/\n-\s(.*)/g, '<li style="margin-left: 20px; list-style-type: square; margin-bottom: 4px;">$1</li>')
          // Double line breaks to p
          .split('\n\n').map(p => {
            if (p.trim().startsWith('<li') || p.trim().startsWith('<h4')) return p;
            return `<p style="margin-bottom: 12px;">${p.trim()}</p>`;
          }).join('');

        // Math equations simple render
        textHTML = textHTML.replace(/\$\$(.*?)\$\$/g, '<div style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px; border-radius: 6px; margin: 10px 0; text-align: center;">$1</div>');
      } else {
        // Escape HTML tags to prevent cross site scripting
        textHTML = textHTML.replace(/</g, '&lt;').replace(/>/g, '&gt;');
      }

      return `
        <div class="msg-bubble ${isUser ? 'user' : 'tutor'}">
          <div>${textHTML}</div>

          <!-- Renders grounding citation links underneath bubble -->
          ${(!isUser && msg.citations && msg.citations.length > 0) ? `
            <div class="citations-container" style="margin-top: 15px; border-color: rgba(255,255,255,0.05);">
              <div class="citations-title">Sources Consulted:</div>
              <div class="citation-chips">
                ${msg.citations.map(c => `
                  <a href="${c.url}" target="_blank" class="citation-chip" style="background: rgba(99,102,241,0.06);">
                    <i class="fas fa-link" style="font-size: 0.6rem;"></i> ${c.title}
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  attachEvents(container) {
    // Send click
    const sendBtn = container.querySelector('#chat-send-btn');
    const textBox = container.querySelector('#chat-text-box');
    
    const triggerSend = () => {
      const text = textBox.value.trim();
      if (text && !this.isLoading) {
        this.sendMessage(text, container);
        textBox.value = '';
      }
    };

    if (sendBtn && textBox) {
      sendBtn.addEventListener('click', triggerSend);
      textBox.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSend();
      });
    }

    // Preset selection clicks
    container.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        if (!this.isLoading) {
          this.sendMessage(query, container);
        }
      });
    });

    // Clear context banner
    const clearCtx = container.querySelector('#clear-chat-context');
    if (clearCtx) {
      clearCtx.addEventListener('click', () => {
        this.setContextQuestion(null);
        this.render(container);
      });
    }
  }

  async sendMessage(text, container) {
    // 1. Add user message
    this.messages.push({
      sender: 'user',
      text,
      citations: []
    });

    this.isLoading = true;
    this.renderMessageFeedOnly(container);

    // 2. Add loading typing indicator bubble
    const feed = container.querySelector('#chat-feed');
    const tempIndicator = document.createElement('div');
    tempIndicator.className = 'msg-bubble tutor';
    tempIndicator.id = 'chat-temp-loading';
    tempIndicator.innerHTML = `
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    `;
    feed.appendChild(tempIndicator);
    this.scrollToBottom();

    // 3. Query Gemini
    const searchToggle = container.querySelector('#chat-grounding-toggle');
    const enableSearch = searchToggle ? searchToggle.checked : false;

    try {
      const response = await gemini.askDoubt(text, this.messages.slice(0, -1), this.activeQuestion, enableSearch);
      
      // Remove loading
      const loadBubble = document.getElementById('chat-temp-loading');
      if (loadBubble) loadBubble.remove();

      this.messages.push({
        sender: 'tutor',
        text: response.text,
        citations: response.citations || []
      });

    } catch (err) {
      const loadBubble = document.getElementById('chat-temp-loading');
      if (loadBubble) loadBubble.remove();

      this.messages.push({
        sender: 'tutor',
        text: `Error connecting: ${err.message}. Please configure your API key inside settings.`,
        citations: []
      });
    } finally {
      this.isLoading = false;
      this.renderMessageFeedOnly(container);
      this.attachEvents(container); // Rebind preset event listeners after feed renders
    }
  }

  renderMessageFeedOnly(container) {
    const feed = container.querySelector('#chat-feed');
    if (feed) {
      feed.innerHTML = this.messages.length === 0 ? this.renderWelcomeMessage() : this.renderMessages();
      this.scrollToBottom();
    }
  }

  scrollToBottom() {
    const feed = document.getElementById('chat-feed');
    if (feed) {
      feed.scrollTop = feed.scrollHeight;
    }
  }
}
