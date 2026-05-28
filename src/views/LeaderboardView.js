import { storage } from '../services/storage.js';
import { bciSyllabus } from '../data/bciSyllabus.js';
import { supabaseService } from '../services/supabase.js';

export class LeaderboardView {
  constructor() {
    this.activeTab = 'overall'; // 'overall', 'accuracy', 'streak', 'syllabus', 'speed'
    this.searchQuery = '';
    
    // Constant total topics in BCI syllabus
    this.TOTAL_SYLLABUS_TOPICS = 79; 

    // Cache for live fetched data
    this.cachedAspirants = null;
  }

  // Calculate current user stats from storage
  getUserStats() {
    const history = storage.getTestHistory();
    const streakInfo = storage.getStreakInfo();
    const studiedTopics = storage.getStudiedTopics();

    const totalTests = history.length;
    let avgAccuracy = 0;
    let avgSpeed = 0; // average seconds per question

    if (totalTests > 0) {
      avgAccuracy = Math.round(history.reduce((acc, curr) => acc + (curr.accuracy || curr.scorePercentage || 0), 0) / totalTests);
      
      const totalQuestions = history.reduce((acc, curr) => acc + (curr.questions?.length || 10), 0);
      const totalTime = history.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);
      avgSpeed = Math.round(totalTime / totalQuestions) || 30; // default 30s
    } else {
      // Defaults for brand new users
      avgAccuracy = 0;
      avgSpeed = 0; 
    }

    const syllabusCount = studiedTopics.length;
    const syllabusPercent = Math.round((syllabusCount / this.TOTAL_SYLLABUS_TOPICS) * 100);

    // Calculate composite overall score
    // Syllabus % * 0.3 + Accuracy % * 0.4 + Streak * 1.5 + Tests * 2
    const overallScore = Number((
      (syllabusPercent * 0.3) + 
      (avgAccuracy * 0.4) + 
      ((streakInfo.count || 0) * 1.5) + 
      (totalTests * 2.0)
    ).toFixed(1));

    return {
      displayName: storage.getUserDisplayName() || 'You',
      isCurrentUser: true,
      accuracy: avgAccuracy,
      streak: streakInfo.count || 0,
      syllabusCount: syllabusCount,
      syllabusPercent: syllabusPercent,
      speed: avgSpeed,
      testCount: totalTests,
      overallScore: overallScore
    };
  }

  // Combine user stats and peer profiles, and calculate composite scores for peers
  getRankedAspirants() {
    const aspirants = [...(this.cachedAspirants || [])];
    
    // Check if current user is in the list. If not (guest), add local stats.
    let user = aspirants.find(a => a.isCurrentUser);
    if (!user) {
      user = this.getUserStats();
      aspirants.push(user);
    }

    // Sort based on current tab
    if (this.activeTab === 'overall') {
      aspirants.sort((a, b) => b.overallScore - a.overallScore);
    } else if (this.activeTab === 'accuracy') {
      aspirants.sort((a, b) => b.accuracy - a.accuracy);
    } else if (this.activeTab === 'streak') {
      aspirants.sort((a, b) => b.streak - a.streak);
    } else if (this.activeTab === 'syllabus') {
      aspirants.sort((a, b) => b.syllabusPercent - a.syllabusPercent);
    } else if (this.activeTab === 'speed') {
      // For speed, lower average seconds per question is better
      // But if speed is 0 (no tests taken), place them at the bottom
      aspirants.sort((a, b) => {
        if (a.speed === 0) return 1;
        if (b.speed === 0) return -1;
        return a.speed - b.speed;
      });
    }

    return aspirants;
  }

  // Helper to generate initials avatar with HSL gradient
  getAvatarColorStyle(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash % 360);
    const s = 70 + Math.abs((hash >> 8) % 20); // 70% - 90%
    const l = 50 + Math.abs((hash >> 16) % 10); // 50% - 60%
    return `background: linear-gradient(135deg, hsl(${h}, ${s}%, ${l}%), hsl(${(h + 40) % 360}, ${s}%, ${l - 10}%));`;
  }

  async render(container) {
    container.innerHTML = `
      <div class="animate-fade-in" style="display:flex; justify-content:center; align-items:center; min-height: 400px;">
        <div style="text-align:center; color:var(--brand-primary);">
          <i class="fas fa-circle-notch fa-spin fa-3x" style="margin-bottom:15px;"></i>
          <h3>Loading Live Rankings...</h3>
        </div>
      </div>
    `;

    // Fetch from supabase
    const rawUsers = await supabaseService.getAllUsersData();
    const sessionUser = await supabaseService.getCurrentUser();
    const currentUserId = sessionUser ? sessionUser.id : null;

    // Transform raw users into aspirant format
    this.cachedAspirants = rawUsers.map(u => {
      const history = u.test_history || [];
      const streakInfo = u.streak_info || { count: 0 };
      const studiedTopics = u.studied_topics || [];
      const isCurrentUser = u.id === currentUserId;

      const totalTests = history.length;
      let avgAccuracy = 0;
      let avgSpeed = 0;
      
      if (totalTests > 0) {
        avgAccuracy = Math.round(history.reduce((acc, curr) => acc + (curr.accuracy || curr.scorePercentage || 0), 0) / totalTests);
        const totalQuestions = history.reduce((acc, curr) => acc + (curr.questions?.length || 10), 0);
        const totalTime = history.reduce((acc, curr) => acc + (curr.timeSpentSeconds || 0), 0);
        avgSpeed = Math.round(totalTime / totalQuestions) || 30;
      }

      const syllabusCount = studiedTopics.length;
      const syllabusPercent = Math.round((syllabusCount / this.TOTAL_SYLLABUS_TOPICS) * 100);

      const overallScore = Number((
        (syllabusPercent * 0.3) + 
        (avgAccuracy * 0.4) + 
        ((streakInfo.count || 0) * 1.5) + 
        (totalTests * 2.0)
      ).toFixed(1));

      return {
        id: u.id,
        name: u.display_name || 'Aspirant',
        displayName: u.display_name || 'Aspirant',
        isCurrentUser,
        accuracy: avgAccuracy,
        streak: streakInfo.count || 0,
        syllabusCount,
        syllabusPercent,
        speed: avgSpeed,
        testCount: totalTests,
        overallScore
      };
    });

    this.renderComplete(container);
  }

  renderComplete(container) {
    const rankedAll = this.getRankedAspirants();
    const user = rankedAll.find(a => a.isCurrentUser) || this.getUserStats();
    
    // Find current user's position
    const userIndex = rankedAll.findIndex(a => a.isCurrentUser);
    const userRank = userIndex + 1;
    const totalAspirants = rankedAll.length;
    const percentile = Math.round(((totalAspirants - userRank) / totalAspirants) * 100);

    // Calculate aspect specific values for hero card
    let aspectValueText = '';
    if (this.activeTab === 'overall') {
      aspectValueText = `${user.overallScore} Pts`;
    } else if (this.activeTab === 'accuracy') {
      aspectValueText = `${user.accuracy}%`;
    } else if (this.activeTab === 'streak') {
      aspectValueText = `${user.streak} Days`;
    } else if (this.activeTab === 'syllabus') {
      aspectValueText = `${user.syllabusPercent}%`;
    } else if (this.activeTab === 'speed') {
      aspectValueText = user.speed > 0 ? `${user.speed}s/Q` : 'N/A';
    }

    let html = `
      <div class="animate-fade-in" style="max-width: 1100px; margin: 0 auto; padding-bottom: 40px;">
        
        <!-- Hero summary banner -->
        <div class="leaderboard-hero">
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.6rem; color: var(--text-primary); margin-bottom: 8px;">
              <i class="fas fa-trophy" style="color: #fbbf24; margin-right: 10px;"></i>National BCI Aspirants Rank
            </h2>
            <p style="color: var(--text-secondary); font-size: 0.92rem; max-width: 500px;">
              Compare your progress with other computer instructor aspirants. Take mock exams and study topics to climb the leaderboard!
            </p>
          </div>
          
          <div class="hero-stats-group">
            <div class="hero-stat-box">
              <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Your Rank</div>
              <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: #fbbf24;">#${userRank}</div>
              <div style="font-size: 0.65rem; color: var(--text-secondary);">out of ${totalAspirants}</div>
            </div>
            <div class="hero-stat-box">
              <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Percentile</div>
              <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--accent-cyan);">Top ${100 - percentile}%</div>
              <div style="font-size: 0.65rem; color: var(--text-secondary);">Better than ${percentile}%</div>
            </div>
            <div class="hero-stat-box">
              <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 4px;">Active Stat</div>
              <div style="font-family: var(--font-heading); font-size: 1.6rem; font-weight: 800; color: var(--brand-secondary);">${aspectValueText}</div>
              <div style="font-size: 0.65rem; color: var(--text-secondary); text-transform: capitalize;">${this.activeTab}</div>
            </div>
          </div>
        </div>

        <!-- Controls section: tabs + search filter -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 20px; flex-wrap: wrap; margin-bottom: 20px;">
          <div class="leaderboard-tabs" style="margin-bottom: 0;">
            <button class="leaderboard-tab-btn ${this.activeTab === 'overall' ? 'active' : ''}" data-tab="overall">
              <i class="fas fa-chart-line"></i> Overall Standing
            </button>
            <button class="leaderboard-tab-btn ${this.activeTab === 'accuracy' ? 'active' : ''}" data-tab="accuracy">
              <i class="fas fa-bullseye"></i> Mock Accuracy
            </button>
            <button class="leaderboard-tab-btn ${this.activeTab === 'streak' ? 'active' : ''}" data-tab="streak">
              <i class="fas fa-fire"></i> Practice Streak
            </button>
            <button class="leaderboard-tab-btn ${this.activeTab === 'syllabus' ? 'active' : ''}" data-tab="syllabus">
              <i class="fas fa-book"></i> Syllabus Coverage
            </button>
            <button class="leaderboard-tab-btn ${this.activeTab === 'speed' ? 'active' : ''}" data-tab="speed">
              <i class="fas fa-bolt"></i> Speed & Efficiency
            </button>
          </div>
          
          <div class="search-control-container">
            <i class="fas fa-search"></i>
            <input type="text" id="leaderboard-search" class="glass-input" placeholder="Search aspirants..." value="${this.searchQuery}">
          </div>
        </div>

        <!-- Main split layout -->
        <div class="leaderboard-layout">
          
          <!-- Left: Table of contestants -->
          <div class="glass-panel" style="padding: 20px; min-height: 400px;">
            <div class="rankings-list-container" id="rankings-list-target">
              ${this.renderRankingsList(rankedAll)}
            </div>
          </div>

          <!-- Right: Peer comparison panel -->
          <div class="glass-panel compare-panel">
            <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--text-primary); border-bottom: 1px solid var(--panel-border); padding-bottom: 10px; margin-bottom: 5px;">
              <i class="fas fa-chart-bar" style="color: var(--brand-primary); margin-right: 8px;"></i>Comparative Insights
            </h3>
            
            <div id="compare-details-target">
              ${this.renderCompareDetails(rankedAll, user)}
            </div>
          </div>

        </div>

      </div>
    `;

    container.innerHTML = html;
    this.attachEvents(container);
  }

  renderRankingsList(rankedAll) {
    // Apply search filter
    let filtered = rankedAll;
    if (this.searchQuery.trim().length > 0) {
      const q = this.searchQuery.toLowerCase().trim();
      filtered = rankedAll.filter(a => a.isCurrentUser ? a.displayName.toLowerCase().includes(q) : a.name.toLowerCase().includes(q));
    }

    if (filtered.length === 0) {
      return `
        <div class="leaderboard-empty-state">
          <i class="fas fa-search-minus"></i>
          <h4>No aspirants match "${this.searchQuery}"</h4>
          <p>Try searching for a different name or clear the search query.</p>
        </div>
      `;
    }

    return filtered.map(aspirant => {
      // Find original rank in complete list
      const originalRank = rankedAll.findIndex(a => a === aspirant) + 1;
      
      // Determine medal classes
      let rankContent = `#${originalRank}`;
      if (originalRank === 1) rankContent = `<i class="fas fa-medal rank-gold" title="1st Place"></i>`;
      else if (originalRank === 2) rankContent = `<i class="fas fa-medal rank-silver" title="2nd Place"></i>`;
      else if (originalRank === 3) rankContent = `<i class="fas fa-medal rank-bronze" title="3rd Place"></i>`;

      // Get values depending on selected aspect
      let displayVal = '';
      let subLabel = '';
      let progressPct = 0;
      let statusBadge = '';

      const name = aspirant.isCurrentUser ? aspirant.displayName : aspirant.name;
      const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

      if (this.activeTab === 'overall') {
        displayVal = `${aspirant.overallScore} Pts`;
        subLabel = `${aspirant.testCount} tests completed`;
        // Scale to 120 max points for visual bar
        progressPct = Math.min(100, Math.round((aspirant.overallScore / 120) * 100));
        
        if (originalRank <= 3) statusBadge = `<span class="status-badge badge-top-performer"><i class="fas fa-crown"></i> Elite Rank</span>`;
        else if (aspirant.streak >= 10) statusBadge = `<span class="status-badge badge-consistent"><i class="fas fa-fire"></i> Consistent</span>`;
        else statusBadge = `<span class="status-badge badge-steady"><i class="far fa-smile"></i> Steady Progress</span>`;
        
      } else if (this.activeTab === 'accuracy') {
        displayVal = `${aspirant.accuracy}%`;
        subLabel = `Accuracy Champion`;
        progressPct = aspirant.accuracy;
        
        if (aspirant.accuracy >= 85) statusBadge = `<span class="status-badge badge-top-performer"><i class="fas fa-award"></i> High Accuracy</span>`;
        else if (aspirant.accuracy >= 70) statusBadge = `<span class="status-badge badge-steady"><i class="fas fa-check"></i> Proficient</span>`;
        else statusBadge = `<span class="status-badge badge-steady" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border-color: var(--panel-border);">Needs Practice</span>`;
        
      } else if (this.activeTab === 'streak') {
        displayVal = `${aspirant.streak} Days`;
        subLabel = `Active daily streak`;
        // Scale streak up to 25 days
        progressPct = Math.min(100, Math.round((aspirant.streak / 25) * 100));
        
        if (aspirant.streak >= 10) statusBadge = `<span class="status-badge badge-consistent"><i class="fas fa-fire"></i> Streak King</span>`;
        else if (aspirant.streak >= 3) statusBadge = `<span class="status-badge badge-steady"><i class="fas fa-running"></i> Active</span>`;
        else statusBadge = `<span class="status-badge badge-steady" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border-color: var(--panel-border);">Resting</span>`;
        
      } else if (this.activeTab === 'syllabus') {
        displayVal = `${aspirant.syllabusPercent}%`;
        subLabel = `${aspirant.syllabusCount} of 79 topics studied`;
        progressPct = aspirant.syllabusPercent;
        
        if (aspirant.syllabusPercent >= 75) statusBadge = `<span class="status-badge badge-syllabus-champion"><i class="fas fa-book-reader"></i> Syllabus Master</span>`;
        else if (aspirant.syllabusPercent >= 40) statusBadge = `<span class="status-badge badge-steady"><i class="fas fa-book-open"></i> Intermediate</span>`;
        else statusBadge = `<span class="status-badge badge-steady" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border-color: var(--panel-border);">Starter</span>`;
        
      } else if (this.activeTab === 'speed') {
        if (aspirant.speed === 0) {
          displayVal = 'N/A';
          subLabel = 'No test records';
          progressPct = 0;
          statusBadge = `<span class="status-badge badge-steady" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border-color: var(--panel-border);">Pending Mock</span>`;
        } else {
          displayVal = `${aspirant.speed}s / Q`;
          subLabel = `Time spent per question`;
          // Map speed where 15s is 100%, 90s is 0%
          progressPct = Math.max(5, Math.min(100, Math.round(((90 - aspirant.speed) / 75) * 100)));
          
          if (aspirant.speed <= 25) statusBadge = `<span class="status-badge badge-fast"><i class="fas fa-tachometer-alt"></i> Fast solver</span>`;
          else if (aspirant.speed <= 45) statusBadge = `<span class="status-badge badge-steady"><i class="far fa-clock"></i> Optimal Pace</span>`;
          else statusBadge = `<span class="status-badge badge-steady" style="background: rgba(255,255,255,0.03); color: var(--text-muted); border-color: var(--panel-border);">Deliberate</span>`;
        }
      }

      // Progress bar colors
      const progressColors = {
        'overall': 'var(--brand-gradient)',
        'accuracy': 'linear-gradient(135deg, #10b981, #059669)',
        'streak': 'linear-gradient(135deg, #f59e0b, #d97706)',
        'syllabus': 'var(--cyan-gradient)',
        'speed': 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
      };

      return `
        <div class="ranking-item-row ${aspirant.isCurrentUser ? 'is-current-user' : ''}">
          <div class="rank-badge-col">${rankContent}</div>
          
          <div class="profile-col">
            <div class="profile-avatar" style="${this.getAvatarColorStyle(name)}">
              ${initials}
            </div>
            <div style="min-width: 0;">
              <span class="profile-name" title="${name}">${name}</span>
              ${aspirant.isCurrentUser ? '<span class="you-badge">You</span>' : ''}
            </div>
          </div>

          <div class="aspect-score-col">
            <span class="aspect-value-text">${displayVal}</span>
            <span class="aspect-value-label">${subLabel}</span>
            <div class="aspect-progress-wrapper">
              <div class="aspect-progress-fill" style="width: ${progressPct}%; background: ${progressColors[this.activeTab]}"></div>
            </div>
          </div>

          <div style="display: flex; align-items: center;">
            ${statusBadge}
          </div>
        </div>
      `;
    }).join('');
  }

  renderCompareDetails(rankedAll, user) {
    const validCompetitors = rankedAll.filter(a => this.activeTab !== 'speed' || a.speed > 0);
    const sortedForAvg = [...validCompetitors];

    // Compute averages
    let userVal = 0;
    let top10Avg = 0;
    let allAvg = 0;
    let label = '';
    let suffix = '';
    let positiveBetter = true;

    // Helper to calculate average of a key
    const getAvgKey = (arr, key) => arr.reduce((acc, curr) => acc + curr[key], 0) / arr.length;

    if (this.activeTab === 'overall') {
      userVal = user.overallScore;
      sortedForAvg.sort((a, b) => b.overallScore - a.overallScore);
      top10Avg = Number((sortedForAvg.slice(0, 10).reduce((acc, curr) => acc + curr.overallScore, 0) / Math.min(10, sortedForAvg.length)).toFixed(1));
      allAvg = Number(getAvgKey(sortedForAvg, 'overallScore').toFixed(1));
      label = 'Overall Composite Score';
      suffix = ' Pts';
      
    } else if (this.activeTab === 'accuracy') {
      userVal = user.accuracy;
      sortedForAvg.sort((a, b) => b.accuracy - a.accuracy);
      top10Avg = Math.round(sortedForAvg.slice(0, 10).reduce((acc, curr) => acc + curr.accuracy, 0) / Math.min(10, sortedForAvg.length));
      allAvg = Math.round(getAvgKey(sortedForAvg, 'accuracy'));
      label = 'Average Test Score / Accuracy';
      suffix = '%';
      
    } else if (this.activeTab === 'streak') {
      userVal = user.streak;
      sortedForAvg.sort((a, b) => b.streak - a.streak);
      top10Avg = Math.round(sortedForAvg.slice(0, 10).reduce((acc, curr) => acc + curr.streak, 0) / Math.min(10, sortedForAvg.length));
      allAvg = Math.round(getAvgKey(sortedForAvg, 'streak'));
      label = 'Active Preparation Streak';
      suffix = ' Days';
      
    } else if (this.activeTab === 'syllabus') {
      userVal = user.syllabusPercent;
      sortedForAvg.sort((a, b) => b.syllabusPercent - a.syllabusPercent);
      top10Avg = Math.round(sortedForAvg.slice(0, 10).reduce((acc, curr) => acc + curr.syllabusPercent, 0) / Math.min(10, sortedForAvg.length));
      allAvg = Math.round(getAvgKey(sortedForAvg, 'syllabusPercent'));
      label = 'Syllabus Coverage completion';
      suffix = '%';
      
    } else if (this.activeTab === 'speed') {
      userVal = user.speed;
      sortedForAvg.sort((a, b) => a.speed - b.speed); // Lower speed is better
      top10Avg = Math.round(sortedForAvg.slice(0, 10).reduce((acc, curr) => acc + curr.speed, 0) / Math.min(10, sortedForAvg.length));
      allAvg = Math.round(getAvgKey(sortedForAvg, 'speed'));
      label = 'Average Solving Speed (s/Question)';
      suffix = 's / Q';
      positiveBetter = false;
    }

    // Comparison percentages for rendering bars
    // Calculate scaling maximum
    const maxVal = Math.max(userVal, top10Avg, allAvg, 1);
    const scale = (val) => {
      if (this.activeTab === 'speed') {
        // For speed, smaller values are wider bars if we invert it, or let's keep it simple: scale linearly to max speed (say 90s)
        const maxLimit = Math.max(maxVal, 90);
        return Math.round((val / maxLimit) * 100);
      }
      return Math.round((val / maxVal) * 100);
    };

    // Determine performance insight tip
    let insightTip = '';
    const diffToTop10 = userVal - top10Avg;
    const diffToAll = userVal - allAvg;

    if (this.activeTab === 'overall') {
      if (user.testCount === 0) {
        insightTip = 'Take your first full mock test to begin building your preparation score points and claim a spot on the leaderboard!';
      } else if (diffToTop10 >= 0) {
        insightTip = '🥇 Brilliant performance! You are dominating the elite rankings. Maintain your daily streak to preserve this leadership position.';
      } else if (diffToAll >= 0) {
        insightTip = 'You are performing above the general aspirant average. Focus on syllabus completion to break into the Top 10 Elite bracket.';
      } else {
        insightTip = 'Your preparation index is currently below average. Increase your study sessions and complete custom mock tests to boost your standing.';
      }
    } else if (this.activeTab === 'accuracy') {
      if (user.testCount === 0) {
        insightTip = 'No accuracy stats available. Generate a topic practice test or custom mock exam to record your first score!';
      } else if (diffToTop10 >= 0) {
        insightTip = '🎯 Absolute precision! Your average accuracy ranks with the best. Keep solving PYQs to maintain this level of accuracy.';
      } else if (diffToAll >= 0) {
        insightTip = 'Good test accuracy! Analyze your weak subjects in the "Analysis" page to fix errors and increase your average above 85%.';
      } else {
        insightTip = 'Your test accuracy is currently below average. Use the BCI Study Tutor widget to review wrong answers from your test history.';
      }
    } else if (this.activeTab === 'streak') {
      if (user.streak === 0) {
        insightTip = 'Start practicing today! Completing just one practice question or quiz will establish your active streak.';
      } else if (user.streak >= top10Avg) {
        insightTip = '🔥 Superb consistency! You are outperforming peers in daily study dedication. Keep this momentum until the computer instructor exam!';
      } else if (user.streak >= allAvg) {
        insightTip = 'You have a healthy active streak. Aim for a 10-day streak milestones to build strong conceptual retention.';
      } else {
        insightTip = 'Your study streak is lower than peers. Establish a daily pattern by solving at least one Current Affairs Quiz every morning.';
      }
    } else if (this.activeTab === 'syllabus') {
      if (user.syllabusPercent === 0) {
        insightTip = 'Go to the "Syllabus Details" page and mark topics as studied as you cover them to track your curriculum milestones.';
      } else if (diffToTop10 >= 0) {
        insightTip = '📚 Masterful curriculum coverage! You have covered almost the entire computer science syllabus. Start focusing on full-length mock exams.';
      } else if (diffToAll >= 0) {
        insightTip = 'Excellent syllabus coverage. Ensure you practice topics under "Programming Fundamentals" and "DSA" to solidify your coverage.';
      } else {
        insightTip = 'Your curriculum coverage is lagging behind competitors. Complete study materials in "Operating Systems" or "DBMS" to catch up.';
      }
    } else if (this.activeTab === 'speed') {
      if (user.speed === 0) {
        insightTip = 'Mock test speed is logged automatically upon submitting full length or topic-wise tests.';
      } else if (user.speed <= top10Avg) {
        insightTip = '⚡ Blazing fast calculations! You solve questions quicker than 90% of competitors. Pair this speed with high accuracy for a top rank.';
      } else if (user.speed <= allAvg) {
        insightTip = 'You are solving at a standard average pace. Practice math/reasoning questions daily to shave off another 5 seconds per question.';
      } else {
        insightTip = 'You are spending more time per question than other aspirants. Practice with custom mock tests under time limits to build agility.';
      }
    }

    // Bar colors
    const topBarColor = 'linear-gradient(90deg, #fbbf24, #f59e0b)';
    const allBarColor = 'rgba(255, 255, 255, 0.2)';
    let userBarColor = 'var(--brand-gradient)';
    if (this.activeTab === 'speed') {
      // For speed, smaller speed is better. Show user's speed in accent-cyan if fast, red if slow.
      userBarColor = user.speed <= allAvg ? 'var(--cyan-gradient)' : 'linear-gradient(90deg, var(--danger), rgba(239,68,68,0.5))';
    }

    return `
      <div style="font-size: 0.8rem; text-transform: uppercase; color: var(--text-muted); font-weight: 600; letter-spacing: 0.05em; margin-bottom: 12px; margin-top: 10px;">Comparing: ${label}</div>
      
      <div class="compare-card-stat">
        <div class="compare-bar-container">
          
          <!-- Current User -->
          <div>
            <div class="compare-bar-item">
              <span class="compare-bar-name" style="color: var(--text-primary); font-weight: 600;">You</span>
              <span class="compare-bar-val">${userVal > 0 || this.activeTab !== 'speed' ? userVal + suffix : 'N/A'}</span>
            </div>
            <div class="compare-bar-track">
              <div class="compare-bar-fill" style="width: ${userVal > 0 || this.activeTab !== 'speed' ? scale(userVal) : 0}%; background: ${userBarColor};"></div>
            </div>
          </div>
          
          <!-- Top 10 Average -->
          <div style="margin-top: 5px;">
            <div class="compare-bar-item">
              <span class="compare-bar-name">Top 10 Avg</span>
              <span class="compare-bar-val">${top10Avg}${suffix}</span>
            </div>
            <div class="compare-bar-track">
              <div class="compare-bar-fill" style="width: ${scale(top10Avg)}%; background: ${topBarColor};"></div>
            </div>
          </div>
          
          <!-- All Aspirants Average -->
          <div style="margin-top: 5px;">
            <div class="compare-bar-item">
              <span class="compare-bar-name">Peer Avg</span>
              <span class="compare-bar-val">${allAvg}${suffix}</span>
            </div>
            <div class="compare-bar-track">
              <div class="compare-bar-fill" style="width: ${scale(allAvg)}%; background: ${allBarColor};"></div>
            </div>
          </div>

        </div>
      </div>

      <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid var(--panel-border); border-radius: 14px; padding: 15px; margin-top: 20px; line-height: 1.5;">
        <h4 style="font-family: var(--font-heading); font-size: 0.85rem; font-weight: 700; color: var(--brand-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          <i class="fas fa-lightbulb"></i> Performance Recommendation
        </h4>
        <p style="font-size: 0.82rem; color: var(--text-secondary); margin: 0;">${insightTip}</p>
      </div>

      <div style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--panel-border); border-radius: 14px; padding: 15px; margin-top: 15px; text-align: center;">
        <div style="font-family: var(--font-heading); font-size: 0.72rem; text-transform: uppercase; color: var(--text-muted); letter-spacing: 0.05em; margin-bottom: 8px;">BCI Syllabus Master Ratio</div>
        <div style="font-size: 1.4rem; font-weight: 700; font-family: var(--font-heading); color: var(--text-primary);">${user.syllabusCount} / 79</div>
        <div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 4px;">Topics catalogued in studied topics.</div>
        <button id="lead-study-more-btn" class="outline-btn" style="width: 100%; padding: 8px; font-size: 0.75rem; border-color: rgba(99,102,241,0.3); color: var(--brand-primary); margin-top: 12px;">
          <i class="fas fa-book-open"></i> Go to Syllabus Progress
        </button>
      </div>
    `;
  }

  attachEvents(container) {
    // Tab buttons
    container.querySelectorAll('.leaderboard-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        this.activeTab = tab;
        
        // Update active tab buttons
        container.querySelectorAll('.leaderboard-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Update list and details
        this.refreshRankingsAndInsights(container);
      });
    });

    // Search input
    const searchInput = container.querySelector('#leaderboard-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.refreshRankingsAndInsights(container);
      });
    }

    // "Go to Syllabus Progress" button
    const studyMoreBtn = container.querySelector('#lead-study-more-btn');
    if (studyMoreBtn) {
      studyMoreBtn.addEventListener('click', () => {
        // Access application navigate method (attached via app module)
        const sidebarTarget = document.getElementById('sidebar-target');
        // Let's dispatch a custom event or directly trigger main navigation if app is globally accessible
        // We can simply find a sidebar item for 'progress' and click it, or let's use the click selector
        const routeBtn = document.querySelector('.nav-item[data-route="progress"]');
        if (routeBtn) {
          routeBtn.click();
        } else {
          // Fallback to direct click trigger on progress sidebar nav
          const navItems = document.querySelectorAll('.nav-item[data-route]');
          navItems.forEach(item => {
            if (item.getAttribute('data-route') === 'progress') item.click();
          });
        }
      });
    }
  }

  refreshRankingsAndInsights(container) {
    const rankedAll = this.getRankedAspirants();
    const user = rankedAll.find(a => a.isCurrentUser) || this.getUserStats();

    // Re-render list
    const rankingsTarget = container.querySelector('#rankings-list-target');
    if (rankingsTarget) {
      rankingsTarget.innerHTML = this.renderRankingsList(rankedAll);
    }

    // Re-render comparative insights
    const compareTarget = container.querySelector('#compare-details-target');
    if (compareTarget) {
      compareTarget.innerHTML = this.renderCompareDetails(rankedAll, user);
    }

    // Re-attach button action for studyMoreBtn in the comparative insights
    const studyMoreBtn = container.querySelector('#lead-study-more-btn');
    if (studyMoreBtn) {
      studyMoreBtn.addEventListener('click', () => {
        const routeBtn = document.querySelector('.nav-item[data-route="progress"]');
        if (routeBtn) {
          routeBtn.click();
        } else {
          const navItems = document.querySelectorAll('.nav-item[data-route]');
          navItems.forEach(item => {
            if (item.getAttribute('data-route') === 'progress') item.click();
          });
        }
      });
    }

    // Re-render Hero stat box active values
    const heroBoxEl = container.querySelector('.hero-stat-box:nth-child(3)');
    if (heroBoxEl) {
      let aspectValueText = '';
      if (this.activeTab === 'overall') {
        aspectValueText = `${user.overallScore} Pts`;
      } else if (this.activeTab === 'accuracy') {
        aspectValueText = `${user.accuracy}%`;
      } else if (this.activeTab === 'streak') {
        aspectValueText = `${user.streak} Days`;
      } else if (this.activeTab === 'syllabus') {
        aspectValueText = `${user.syllabusPercent}%`;
      } else if (this.activeTab === 'speed') {
        aspectValueText = user.speed > 0 ? `${user.speed}s/Q` : 'N/A';
      }
      
      const valEl = heroBoxEl.querySelector('div:nth-child(2)');
      const labelEl = heroBoxEl.querySelector('div:nth-child(3)');
      if (valEl) valEl.textContent = aspectValueText;
      if (labelEl) labelEl.textContent = this.activeTab;
    }

    // Re-render user rank/percentile
    const userIndex = rankedAll.findIndex(a => a.isCurrentUser);
    const userRank = userIndex + 1;
    const totalAspirants = rankedAll.length;
    const percentile = Math.round(((totalAspirants - userRank) / totalAspirants) * 100);

    const rankBoxEl = container.querySelector('.hero-stat-box:nth-child(1)');
    if (rankBoxEl) {
      const valEl = rankBoxEl.querySelector('div:nth-child(2)');
      if (valEl) valEl.textContent = `#${userRank}`;
    }

    const pctBoxEl = container.querySelector('.hero-stat-box:nth-child(2)');
    if (pctBoxEl) {
      const valEl = pctBoxEl.querySelector('div:nth-child(2)');
      const descEl = pctBoxEl.querySelector('div:nth-child(3)');
      if (valEl) valEl.textContent = `Top ${100 - percentile}%`;
      if (descEl) descEl.textContent = `Better than ${percentile}%`;
    }
  }
}
