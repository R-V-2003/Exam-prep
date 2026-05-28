import { storage } from '../services/storage.js';

export class Analytics {
  constructor() {
    this.subjects = ['Quant', 'Reasoning', 'English', 'General Awareness'];
  }

  // Calculate subject averages from test history
  getSubjectData() {
    const history = storage.getTestHistory();
    const totals = { 'Quant': 0, 'Reasoning': 0, 'English': 0, 'General Awareness': 0, 'Polity': 0, 'History': 0, 'Geography': 0, 'Economy': 0, 'Current Affairs': 0 };
    const counts = { 'Quant': 0, 'Reasoning': 0, 'English': 0, 'General Awareness': 0, 'Polity': 0, 'History': 0, 'Geography': 0, 'Economy': 0, 'Current Affairs': 0 };
    
    // Group subjects into core categories
    const mapSubject = (sub) => {
      const s = sub.toLowerCase();
      if (s.includes('quant') || s.includes('aptitude')) return 'Quant';
      if (s.includes('reason')) return 'Reasoning';
      if (s.includes('eng')) return 'English';
      return 'General Awareness';
    };

    history.forEach(record => {
      if (record.questions && record.userAnswers) {
        record.questions.forEach((q, idx) => {
          const category = mapSubject(q.subject);
          const isCorrect = record.userAnswers[idx] === q.correctIndex;
          totals[category] += isCorrect ? 1 : 0;
          counts[category] += 1;
        });
      }
    });

    let hasData = false;
    const result = this.subjects.map(sub => {
      if (counts[sub] > 0) {
        hasData = true;
        return Math.round((totals[sub] / counts[sub]) * 100);
      }
      return 0;
    });

    return hasData ? result : null;
  }

  // Helper for drawing empty states
  _drawEmptyState(ctx, w, h, isLight, message) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw icon
    ctx.font = '24px "Font Awesome 5 Free"';
    ctx.fillText('\uf01c', w/2, h/2 - 20); // Inbox icon
    
    ctx.font = '500 14px Inter, sans-serif';
    ctx.fillText('No Data Available', w/2, h/2 + 10);
    
    ctx.font = '400 12px Inter, sans-serif';
    ctx.fillText(message, w/2, h/2 + 30);
  }

  // Draw subject strengths radar chart
  drawRadar(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    // Support high DPI
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2 + 10;
    const r = Math.min(w, h) * 0.35;

    const values = this.getSubjectData();
    const isLight = storage.getTheme() === 'light';
    
    if (!values) {
      this._drawEmptyState(ctx, w, h, isLight, 'Take a mock test to analyze your subject proficiency.');
      return;
    }

    const numPoints = this.subjects.length;
    
    // Theme styling
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)';
    const labelColor = isLight ? '#1e293b' : '#f8fafc';
    const axisColor = isLight ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.2)';

    ctx.clearRect(0, 0, w, h);

    // Draw concentric scale rings
    const rings = 4;
    ctx.lineWidth = 1;
    for (let j = 1; j <= rings; j++) {
      ctx.beginPath();
      const currentR = r * (j / rings);
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const x = cx + currentR * Math.cos(angle);
        const y = cy + currentR * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = gridColor;
      ctx.stroke();
    }

    // Draw axis lines and labels
    ctx.font = '500 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);

      // Draw axis lines
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = axisColor;
      ctx.stroke();

      // Label positions
      const labelOffset = 22;
      const lx = cx + (r + labelOffset) * Math.cos(angle);
      const ly = cy + (r + labelOffset) * Math.sin(angle);
      
      ctx.fillStyle = labelColor;
      ctx.fillText(`${this.subjects[i]} (${values[i]}%)`, lx, ly);
    }

    // Draw strength data polygon
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const score = values[i] / 100;
      const x = cx + r * score * Math.cos(angle);
      const y = cy + r * score * Math.sin(angle);

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    
    // Fill with gradient
    const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)');
    gradient.addColorStop(1, 'rgba(168, 85, 247, 0.45)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Outline
    ctx.strokeStyle = 'hsl(250, 89%, 65%)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vertex dots
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const score = values[i] / 100;
      const x = cx + r * score * Math.cos(angle);
      const y = cy + r * score * Math.sin(angle);
      
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#00f2fe';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  // Draw bar chart for history score performance
  drawHistory(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    // Load data from history, take last 5 tests
    const history = [...storage.getTestHistory()].reverse().slice(-5);
    const isLight = storage.getTheme() === 'light';
    
    if (history.length === 0) {
      this._drawEmptyState(ctx, w, h, isLight, 'Complete a mock test to see your score trend.');
      return;
    }

    const chartData = history.map((item, idx) => ({
      scorePercentage: Math.round(item.scorePercentage || item.accuracy || 0),
      dateStr: `Test ${idx + 1}`
    }));

    const labelColor = isLight ? '#475569' : '#94a3b8';
    const gridColor = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';

    ctx.clearRect(0, 0, w, h);

    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;

    const chartWidth = w - paddingLeft - paddingRight;
    const chartHeight = h - paddingTop - paddingBottom;

    // Y Axis grid lines (0%, 25%, 50%, 75%, 100%)
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = labelColor;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const yTicks = [0, 25, 50, 75, 100];
    yTicks.forEach(tick => {
      const y = paddingTop + chartHeight * (1 - tick / 100);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.stroke();
      ctx.fillText(`${tick}%`, paddingLeft - 8, y);
    });

    // Draw bars
    const numBars = chartData.length;
    const barSpacing = 20;
    const barWidth = (chartWidth - (barSpacing * (numBars - 1))) / numBars;

    chartData.forEach((d, idx) => {
      const x = paddingLeft + idx * (barWidth + barSpacing);
      const barHeight = chartHeight * (d.scorePercentage / 100);
      const y = paddingTop + chartHeight - barHeight;

      // Rounded rectangle for bar
      const radius = 6;
      ctx.beginPath();
      ctx.moveTo(x, y + radius);
      ctx.lineTo(x, y);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.lineTo(x + barWidth - radius, y);
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
      ctx.lineTo(x + barWidth, paddingTop + chartHeight);
      ctx.lineTo(x, paddingTop + chartHeight);
      ctx.closePath();

      // Create gradient fill
      const grad = ctx.createLinearGradient(x, y, x, paddingTop + chartHeight);
      grad.addColorStop(0, 'hsl(250, 89%, 65%)');
      grad.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Draw values over bar
      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${d.scorePercentage}%`, x + barWidth / 2, y - 8);

      // Draw X label
      ctx.fillStyle = labelColor;
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(d.dateStr, x + barWidth / 2, paddingTop + chartHeight + 15);
    });
  }

  // Draw Doughnut Chart for Syllabus Progress
  drawSyllabus(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    
    const isLight = storage.getTheme() === 'light';
    const studiedTopics = storage.getStudiedTopics().length;
    const totalTopics = 79;
    
    if (studiedTopics === 0) {
      this._drawEmptyState(ctx, w, h, isLight, 'Mark topics as studied to track coverage.');
      return;
    }

    ctx.clearRect(0, 0, w, h);
    
    const cx = w/2;
    const cy = h/2;
    const r = Math.min(w, h) * 0.35;
    const thickness = 20;

    // Background track
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.strokeStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    ctx.lineWidth = thickness;
    ctx.stroke();

    // Progress arc
    const percent = studiedTopics / totalTopics;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, (-Math.PI / 2) + (2 * Math.PI * percent));
    ctx.strokeStyle = '#10b981'; // Emerald Green
    ctx.lineWidth = thickness;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Inner text
    ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${Math.round(percent * 100)}%`, cx, cy - 8);
    
    ctx.fillStyle = isLight ? '#64748b' : '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`${studiedTopics}/${totalTopics} Topics`, cx, cy + 16);
  }

  // Draw Line Chart for Speed Trend
  drawSpeed(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    
    const isLight = storage.getTheme() === 'light';
    const history = [...storage.getTestHistory()].reverse().slice(-5);
    
    // Map to seconds per question
    const speedData = history
      .filter(item => item.timeSpentSeconds && item.questions)
      .map(item => item.timeSpentSeconds / item.questions.length);

    if (speedData.length === 0) {
      this._drawEmptyState(ctx, w, h, isLight, 'Complete a timed test to track solving speed.');
      return;
    }

    ctx.clearRect(0, 0, w, h);
    
    const paddingLeft = 35;
    const paddingRight = 15;
    const paddingTop = 20;
    const paddingBottom = 30;
    
    const chartWidth = w - paddingLeft - paddingRight;
    const chartHeight = h - paddingTop - paddingBottom;
    
    // Determine max speed scale (at least 60s)
    const maxSpeed = Math.max(...speedData, 60); 
    
    // Draw Y grid
    ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    
    const yTicks = [0, maxSpeed/2, maxSpeed];
    yTicks.forEach(tick => {
      const y = paddingTop + chartHeight * (1 - tick / maxSpeed);
      ctx.beginPath();
      ctx.moveTo(paddingLeft, y);
      ctx.lineTo(w - paddingRight, y);
      ctx.stroke();
      ctx.fillText(`${Math.round(tick)}s`, paddingLeft - 8, y);
    });

    // Draw connecting line
    const xStep = chartWidth / Math.max(1, (speedData.length - 1));
    
    ctx.beginPath();
    speedData.forEach((speed, idx) => {
      const x = paddingLeft + (speedData.length === 1 ? chartWidth/2 : idx * xStep);
      const y = paddingTop + chartHeight * (1 - speed / maxSpeed);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#f59e0b'; // Amber gradient
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw data points and X labels
    speedData.forEach((speed, idx) => {
      const x = paddingLeft + (speedData.length === 1 ? chartWidth/2 : idx * xStep);
      const y = paddingTop + chartHeight * (1 - speed / maxSpeed);
      
      // Point
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2*Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      
      // Values above point
      ctx.fillStyle = isLight ? '#0f172a' : '#ffffff';
      ctx.font = 'bold 10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(speed)}s/Q`, x, y - 10);
      
      // X Label
      ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`Test ${idx+1}`, x, paddingTop + chartHeight + 15);
    });
  }
}
