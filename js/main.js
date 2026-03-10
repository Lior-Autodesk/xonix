'use strict';

const STATE = {
  TITLE:          'TITLE',
  PLAYING:        'PLAYING',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE',
  GAME_OVER:      'GAME_OVER',
  WIN:            'WIN',
  SCORES:         'SCORES'
};

class Game {
  constructor() {
    this.canvas   = document.getElementById('gameCanvas');
    this.renderer = new Renderer(this.canvas);

    this.ui = new UI(
      () => this._startGame(),
      () => this.ui.showScores()
    );

    this.state    = STATE.TITLE;
    this.level    = 1;
    this.lives    = CONFIG.LIVES_START;
    this.score    = 0;
    this.levelScore = 0;

    this.grid    = new Grid();
    this.player  = null;
    this.enemies = [];

    this.lastTime = 0;
    this._raf = null;
    this._godMode = false;

    this._setupInput();
  }

  start() {
    this.renderer.loadImages(() => {
      this.ui.showTitle();
      this._raf = requestAnimationFrame((t) => this._loop(t));
    });
  }

  // ─── INPUT ────────────────────────────────────────────────────────────────

  _setupInput() {
    // Keyboard
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) {
        e.preventDefault();
      }
      if (this.state !== STATE.PLAYING) return;
      switch (e.code) {
        case 'ArrowUp':    this.player.setDir(0, -1); break;
        case 'ArrowDown':  this.player.setDir(0,  1); break;
        case 'ArrowLeft':  this.player.setDir(-1, 0); break;
        case 'ArrowRight': this.player.setDir( 1, 0); break;
        case 'Space':      this._godMode = !this._godMode; break;
      }
    });

    // D-pad buttons
    const dirs = { up:[0,-1], down:[0,1], left:[-1,0], right:[1,0] };
    for (const btn of document.querySelectorAll('.dpad-btn')) {
      const [dx, dy] = dirs[btn.dataset.dir];
      const fire = (e) => {
        e.preventDefault();
        if (this.state === STATE.PLAYING && this.player) {
          this.player.setDir(dx, dy);
        }
      };
      btn.addEventListener('touchstart', fire, { passive: false });
      btn.addEventListener('mousedown',  fire);
    }

    // Swipe support
    let touchStartX = 0, touchStartY = 0;
    this.canvas.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    this.canvas.addEventListener('touchend', (e) => {
      if (this.state !== STATE.PLAYING) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        this.player.setDir(dx > 0 ? 1 : -1, 0);
      } else {
        this.player.setDir(0, dy > 0 ? 1 : -1);
      }
    }, { passive: true });
  }

  // ─── GAME FLOW ────────────────────────────────────────────────────────────

  _startGame() {
    this.level  = 1;
    this.lives  = CONFIG.LIVES_START;
    this.score  = 0;
    this._beginLevel();
  }

  _beginLevel() {
    this.grid.reset();
    this.player     = new Player(this.grid);
    this.enemies    = this._spawnEnemies();
    this.levelScore = 0;
    this.renderer.setLevel(this.level - 1);
    this.state      = STATE.PLAYING;
    this.ui.hide();
  }

  _spawnEnemies() {
    const count = this.level;
    const speed = CONFIG.ENEMY_BASE_SPEED + CONFIG.ENEMY_SPEED_INC * (this.level - 1);
    return Array.from({ length: count }, (_, i) => new Enemy(this.grid, speed, i));
  }

  _killPlayer() {
    this.grid.clearTrail();
    this.player.trail = [];
    if (!this._godMode) this.lives--;

    if (this.lives <= 0) {
      this.state = STATE.GAME_OVER;
      this.ui.showGameOver(this.score, this.level);
    } else {
      this.player.reset();
    }
  }

  _onCapture(cellsCaptured) {
    const pts = cellsCaptured * CONFIG.SCORE_PER_CELL * this.level;
    this.levelScore += pts;
    this.score      += pts;

    const pct = this.grid.capturePercent();
    if (pct >= CONFIG.CAPTURE_THRESHOLD) {
      // Level complete bonus
      const bonus = this.lives * CONFIG.SCORE_LIFE_BONUS;
      this.levelScore += bonus;
      this.score      += bonus;

      this.state = STATE.LEVEL_COMPLETE;
      this.ui.showLevelComplete(
        this.level,
        this.levelScore,
        this.score,
        pct,
        () => this._nextLevel()
      );
    }
  }

  _nextLevel() {
    if (this.level >= CONFIG.LEVELS_TOTAL) {
      this.state = STATE.WIN;
      this.ui.showWin(this.score);
    } else {
      this.level++;
      this._beginLevel();
    }
  }

  // ─── GAME LOOP ────────────────────────────────────────────────────────────

  _loop(timestamp) {
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
    this.lastTime = timestamp;

    if (this.state === STATE.PLAYING) {
      this._update(dt);
      this._draw();
    } else {
      // Still draw last game state behind overlay
      if (this.player) this._draw();
    }

    this._raf = requestAnimationFrame((t) => this._loop(t));
  }

  _update(dt) {
    const signal = this.player.update(dt);

    if (signal === 'DEATH') {
      this._killPlayer();
      return;
    }

    if (signal === 'CAPTURE') {
      const captured = performCapture(this.grid, this.enemies);
      this.player.trail = [];
      this._onCapture(captured);
      return;
    }

    // Update enemies
    for (const e of this.enemies) e.update();

    // Collision checks (only while player is drawing trail)
    if (!this.player.onSolid) {
      if (enemyHitsTrail(this.grid, this.enemies) ||
          enemyHitsPlayer(this.player, this.enemies)) {
        this._killPlayer();
      }
    } else {
      // Player on solid — still check direct contact
      if (enemyHitsPlayer(this.player, this.enemies)) {
        this._killPlayer();
      }
    }
  }

  _draw() {
    this.renderer.clear();
    this.renderer.drawGrid(this.grid);
    for (const e of this.enemies) this.renderer.drawEnemy(e);
    this.renderer.drawPlayer(this.player);
    this.renderer.drawHUD(this.lives, this.score, this.level, this.grid.capturePercent());
  }
}

// Bootstrap
window.addEventListener('load', () => {
  const game = new Game();
  game.start();
});
