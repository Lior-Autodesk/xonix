'use strict';

class UI {
  constructor(onStartGame, onShowScores) {
    this.overlay   = document.getElementById('overlay');

    this.screens = {
      title:         document.getElementById('screen-title'),
      levelComplete: document.getElementById('screen-level-complete'),
      gameOver:      document.getElementById('screen-gameover'),
      win:           document.getElementById('screen-win'),
      scores:        document.getElementById('screen-scores')
    };

    this._onStartGame  = onStartGame;
    this._onShowScores = onShowScores;
    this._currentScreen = null;
    this._onContinue = null;
    this._instructions = document.getElementById('game-instructions');

    this._bindButtons();
  }

  _bindButtons() {
    // Title
    document.getElementById('title-start').addEventListener('click', () => {
      this._onStartGame();
    });
    document.getElementById('title-scores').addEventListener('click', () => {
      this.showScores();
    });

    // Level complete
    document.getElementById('lc-continue').addEventListener('click', () => {
      const cb = this._onContinue;
      this._onContinue = null;
      if (cb) cb();
    });

    // Game Over
    document.getElementById('go-save').addEventListener('click', () => {
      const name  = document.getElementById('go-name').value;
      const score = parseInt(this.screens.gameOver.dataset.score || '0', 10);
      const level = parseInt(this.screens.gameOver.dataset.level || '1', 10);
      saveScore(name, score, level);
      this.showScores();
    });
    document.getElementById('go-restart').addEventListener('click', () => {
      this._onStartGame();
    });

    // Win
    document.getElementById('win-save').addEventListener('click', () => {
      const name  = document.getElementById('win-name').value;
      const score = parseInt(this.screens.win.dataset.score || '0', 10);
      saveScore(name, score, CONFIG.LEVELS_TOTAL);
      this.showScores();
    });

    // Scores
    document.getElementById('scores-start').addEventListener('click', () => {
      this._onStartGame();
    });
    document.getElementById('scores-back').addEventListener('click', () => {
      this.showTitle();
    });
  }

  _showScreen(name) {
    this.overlay.classList.remove('hidden');
    for (const [key, el] of Object.entries(this.screens)) {
      if (key === name) {
        el.classList.remove('hidden');
      } else {
        el.classList.add('hidden');
      }
    }
    this._currentScreen = name;
  }

  hide() {
    this.overlay.classList.add('hidden');
    for (const el of Object.values(this.screens)) {
      el.classList.add('hidden');
    }
    this._currentScreen = null;
    this._instructions.classList.add('hidden');
  }

  showTitle() {
    this._showScreen('title');
    this._instructions.classList.remove('hidden');
  }

  showLevelComplete(level, levelScore, totalScore, areaPct, onContinue) {
    this._onContinue = onContinue;
    document.getElementById('lc-badge').textContent = level >= CONFIG.LEVELS_TOTAL ? '🏁' : '✅';
    document.getElementById('lc-title').textContent = `שלב ${level} הושלם!`;
    document.getElementById('lc-area').textContent  = Math.floor(areaPct * 100) + '%';
    document.getElementById('lc-level-score').textContent = levelScore.toLocaleString();
    document.getElementById('lc-total-score').textContent = totalScore.toLocaleString();
    document.getElementById('lc-next-msg').textContent =
      level < CONFIG.LEVELS_TOTAL ? `הכן את עצמך לשלב ${level + 1}!` : 'סיימת את כל השלבים!';
    this._showScreen('levelComplete');
  }

  showGameOver(score, level) {
    document.getElementById('go-score').textContent = score.toLocaleString();
    document.getElementById('go-level').textContent = level;
    document.getElementById('go-name').value = '';
    this.screens.gameOver.dataset.score = score;
    this.screens.gameOver.dataset.level = level;
    this._showScreen('gameOver');
    // Auto-focus name input for mobile keyboard
    setTimeout(() => document.getElementById('go-name').focus(), 300);
  }

  showWin(score) {
    document.getElementById('win-score').textContent = score.toLocaleString();
    document.getElementById('win-name').value = '';
    this.screens.win.dataset.score = score;
    this._showScreen('win');
    setTimeout(() => document.getElementById('win-name').focus(), 300);
  }

  showScores() {
    const scores = getScores();
    const tbody  = document.getElementById('scores-body');
    const medals = ['🥇', '🥈', '🥉'];

    tbody.innerHTML = '';
    if (scores.length === 0) {
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="color:#556677;padding:16px">אין ניקוד עדיין</td>';
      tbody.appendChild(tr);
    } else {
      scores.forEach((s, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${medals[i] || (i + 1)}</td>
          <td>${escapeHtml(s.name)}</td>
          <td>${s.score.toLocaleString()}</td>
          <td>${s.level}</td>
          <td>${s.date}</td>
        `;
        tbody.appendChild(tr);
      });
    }
    this._showScreen('scores');
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
