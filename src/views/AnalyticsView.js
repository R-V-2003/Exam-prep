import { Analytics } from '../components/Analytics.js';

export class AnalyticsView {
  constructor() {
    this.analytics = new Analytics();
  }

  render(container) {
    container.innerHTML = `
      <div class="animate-fade-in dashboard-bento" style="height: auto; overflow: visible;">
        <div style="margin-bottom: 20px;">
          <h2 style="font-family: var(--font-heading); font-size: 1.5rem; color: var(--text-primary);">Performance Analysis</h2>
          <p style="color: var(--text-secondary); font-size: 0.9rem;">Deep dive into your test performance and identify weak areas.</p>
        </div>

        <div class="dashboard-bento-charts" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 20px; min-height: 800px;">
          <div class="glass-panel chart-panel" style="display: flex; flex-direction: column;">
            <div class="chart-header">
              <h3 style="font-size: 1.1rem;"><i class="fas fa-chart-pie" style="color: var(--brand-primary); margin-right: 8px;"></i> Subject Proficiency</h3>
            </div>
            <div class="chart-container" style="flex: 1; min-height: 0; position: relative;">
              <canvas id="analytics-radar-canvas" class="chart-canvas"></canvas>
            </div>
          </div>

          <div class="glass-panel chart-panel" style="display: flex; flex-direction: column;">
            <div class="chart-header">
              <h3 style="font-size: 1.1rem;"><i class="fas fa-history" style="color: var(--brand-primary); margin-right: 8px;"></i> Score Trend</h3>
            </div>
            <div class="chart-container" style="flex: 1; min-height: 0; position: relative;">
              <canvas id="analytics-history-canvas" class="chart-canvas"></canvas>
            </div>
          </div>

          <div class="glass-panel chart-panel" style="display: flex; flex-direction: column;">
            <div class="chart-header">
              <h3 style="font-size: 1.1rem;"><i class="fas fa-book" style="color: var(--brand-primary); margin-right: 8px;"></i> Syllabus Coverage</h3>
            </div>
            <div class="chart-container" style="flex: 1; min-height: 0; position: relative;">
              <canvas id="analytics-syllabus-canvas" class="chart-canvas"></canvas>
            </div>
          </div>

          <div class="glass-panel chart-panel" style="display: flex; flex-direction: column;">
            <div class="chart-header">
              <h3 style="font-size: 1.1rem;"><i class="fas fa-bolt" style="color: var(--brand-primary); margin-right: 8px;"></i> Solving Speed Trend</h3>
            </div>
            <div class="chart-container" style="flex: 1; min-height: 0; position: relative;">
              <canvas id="analytics-speed-canvas" class="chart-canvas"></canvas>
            </div>
          </div>
        </div>
      </div>
    `;

    // Wait for DOM
    setTimeout(() => {
      this.analytics.drawRadar('analytics-radar-canvas');
      this.analytics.drawHistory('analytics-history-canvas');
      this.analytics.drawSyllabus('analytics-syllabus-canvas');
      this.analytics.drawSpeed('analytics-speed-canvas');
    }, 100);

    // Theme support for charts
    this.themeChangeHandler = () => {
      this.analytics.drawRadar('analytics-radar-canvas');
      this.analytics.drawHistory('analytics-history-canvas');
      this.analytics.drawSyllabus('analytics-syllabus-canvas');
      this.analytics.drawSpeed('analytics-speed-canvas');
    };
    window.addEventListener('themechanged', this.themeChangeHandler);
  }

  onUnmount() {
    if (this.themeChangeHandler) {
      window.removeEventListener('themechanged', this.themeChangeHandler);
    }
  }
}
