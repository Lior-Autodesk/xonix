'use strict';

const HUD_H  = 48; // px — top bar height
const GRID_Y = HUD_H; // grid starts below HUD

// Color palette per capture generation (outer fill, inner fill)
// Gen 0 = initial border; Gen 1+ cycle through palette
const BORDER_PALETTE = [
  ['#1a2e47', '#2557a0'],  // 0 – navy (initial border)
  ['#1a3d22', '#2d8a47'],  // 1 – emerald
  ['#3d1a24', '#8a2d44'],  // 2 – crimson
  ['#3d2e12', '#8a6a28'],  // 3 – amber
  ['#143d3a', '#228a84'],  // 4 – teal
  ['#2c1a3d', '#6228a0'],  // 5 – purple
  ['#3d2010', '#9a4a22'],  // 6 – terra cotta
  ['#143d28', '#2a8a5a'],  // 7 – jade
];

class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx    = canvas.getContext('2d');

    this.bgImages     = new Array(CONFIG.LEVELS_TOTAL).fill(null);
    this.currentLevel = 0;

    this._initCanvas();
    window.addEventListener('resize', () => this._applyScale());
  }

  _initCanvas() {
    const dpr = window.devicePixelRatio || 1;
    this._logW = CONFIG.COLS * CONFIG.CELL_SIZE;
    this._logH = HUD_H + CONFIG.ROWS * CONFIG.CELL_SIZE;
    this.canvas.width  = Math.round(this._logW * dpr);
    this.canvas.height = Math.round(this._logH * dpr);
    // Fix CSS size so transform-based scaling works from logical dimensions
    this.canvas.style.width  = this._logW + 'px';
    this.canvas.style.height = this._logH + 'px';
    this.ctx.scale(dpr, dpr);
    this._applyScale();
  }

  _applyScale() {
    // Reserve space at bottom for D-pad bar on touch devices
    const isDesktop = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    const dpadH  = isDesktop ? 0 : 76;
    const availH = window.innerHeight - dpadH;

    // 20% black margins on desktop only → game uses central 60% of screen width
    const availW = isDesktop ? window.innerWidth * 0.6 : window.innerWidth;

    // Scale from logical (CSS) size
    const scaleX = availW / this._logW;
    const scaleY = availH / this._logH;
    const scale  = Math.min(scaleX, scaleY);
    const ox     = Math.round((window.innerWidth - this._logW * scale) / 2);
    const oy     = Math.round((availH            - this._logH * scale) / 2);

    this.canvas.style.position        = 'absolute';
    this.canvas.style.transformOrigin = 'top left';
    this.canvas.style.transform       = `scale(${scale})`;
    this.canvas.style.left            = `${ox}px`;
    this.canvas.style.top             = `${oy}px`;
  }

  loadImages(onDone) {
    let pending = CONFIG.LEVELS_TOTAL;
    const done  = () => { if (--pending === 0) onDone(); };
    for (let i = 0; i < CONFIG.LEVELS_TOTAL; i++) {
      const lvl  = i;
      const base = `assets/images/level${i + 1}`;
      const tryLoad = (ext, fallback) => {
        const img = new Image();
        img.onload  = () => { this.bgImages[lvl] = img; done(); };
        img.onerror = () => fallback ? tryLoad(fallback, null) : done();
        img.src = base + ext;
      };
      tryLoad('.jpg', '.png');
    }
  }

  setLevel(i) {
    // Pick a random loaded image (ignoring level index)
    const loaded = this.bgImages.map((img, idx) => img ? idx : -1).filter(idx => idx >= 0);
    this.currentLevel = loaded.length
      ? loaded[Math.floor(Math.random() * loaded.length)]
      : i;
  }

  clear() {
    this.ctx.fillStyle = '#0d1117';
    this.ctx.fillRect(0, 0, this._logW, this._logH);
  }

  // ── HUD bar at top ────────────────────────────────────────────────────────
  // Layout: שלב | אחוזים | ניקוד | לבבות
  drawHUD(lives, score, level, pct) {
    const ctx  = this.ctx;
    const w    = this._logW;
    const midY = HUD_H / 2;
    const col  = w / 4; // 4 equal columns

    // Background
    ctx.fillStyle = '#161b22';
    ctx.fillRect(0, 0, w, HUD_H);

    // Bottom border line
    ctx.strokeStyle = '#30363d';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(0, HUD_H - 0.5);
    ctx.lineTo(w, HUD_H - 0.5);
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign    = 'center';
    ctx.font         = "bold 15px 'Open Sans', system-ui, sans-serif";

    // ── Col 1: לבבות ──
    ctx.font      = '15px serif';
    ctx.fillStyle = '#e6edf3';
    ctx.fillText('❤️'.repeat(Math.max(0, lives)), col * 0.5, midY);

    // ── Col 2: ניקוד ──
    ctx.font      = "bold 15px 'Open Sans', system-ui, sans-serif";
    ctx.fillStyle = '#e6edf3';
    ctx.fillText(score.toLocaleString(), col * 1.5, midY);

    // ── Col 3: אחוזים ──
    const pctColor = pct >= CONFIG.CAPTURE_THRESHOLD ? '#3fb950'
                   : pct > 0.5                       ? '#d29922'
                                                      : '#e6edf3';
    ctx.fillStyle = pctColor;
    ctx.fillText(Math.floor(pct * 100) + '%', col * 2.5, midY);

    // ── Col 4: שלב ──
    ctx.fillStyle = '#8b949e';
    ctx.fillText(`שלב ${level}`, col * 3.5, midY);
  }

  // ── Game grid (offset by GRID_Y) ──────────────────────────────────────────
  drawGrid(grid) {
    const ctx = this.ctx;
    const cs  = CONFIG.CELL_SIZE;
    const img = this.bgImages[this.currentLevel];
    const gw  = grid.cols * cs;
    const gh  = grid.rows * cs;

    // Background: dark fill + centred image (contain)
    ctx.fillStyle = '#0d1117';
    ctx.fillRect(0, GRID_Y, gw, gh);

    if (img) {
      // Contain: fit entire image, letterbox with dark bg
      const s  = Math.min(gw / img.width, gh / img.height);
      const dw = img.width  * s;
      const dh = img.height * s;
      const dx = (gw - dw) / 2;
      const dy = (gh - dh) / 2;
      ctx.drawImage(img, dx, GRID_Y + dy, dw, dh);
    }

    // Draw non-OPEN cells
    for (let r = 0; r < grid.rows; r++) {
      for (let c = 0; c < grid.cols; c++) {
        const cell = grid.get(c, r);
        if (cell === CELL.OPEN) continue;

        const x = c * cs;
        const y = GRID_Y + r * cs;

        if (cell === CELL.BORDER || cell === CELL.CAPTURED) {
          const palIdx = grid.gen[grid.index(c, r)] % BORDER_PALETTE.length;
          const [outer, inner] = BORDER_PALETTE[palIdx];
          ctx.fillStyle = outer;
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = inner;
          ctx.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        } else if (cell === CELL.TRAIL) {
          ctx.fillStyle = '#7d2d00';
          ctx.fillRect(x, y, cs, cs);
          ctx.fillStyle = '#d45f00';
          ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
        }
      }
    }
  }

  drawPlayer(player) {
    const ctx  = this.ctx;
    const cs   = CONFIG.CELL_SIZE;
    const size = 28;
    const cx   = player.px + cs / 2;
    const cy   = Math.max(GRID_Y + size / 2 + 1,
                   Math.min(this._logH - size / 2 - 1,
                     GRID_Y + player.py + cs / 2));

    ctx.font         = `${size}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(CONFIG.PLAYER_EMOJI, cx, cy);
  }

  drawEnemy(enemy) {
    const ctx   = this.ctx;
    const size  = CONFIG.EMOJI_SIZE;
    const emoji = CONFIG.ENEMY_EMOJIS[enemy.emojiIndex];
    const cx    = Math.max(size / 2, Math.min(this._logW - size / 2, enemy.px));
    const cy    = Math.max(GRID_Y + size / 2,
                    Math.min(this._logH - size / 2, GRID_Y + enemy.py));

    ctx.font         = `${size}px serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, cx, cy);
  }
}
