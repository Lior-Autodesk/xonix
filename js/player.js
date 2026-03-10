'use strict';

class Player {
  constructor(grid) {
    this.grid = grid;
    this.reset();
  }

  reset() {
    const cs = CONFIG.CELL_SIZE;
    this.cellX = Math.floor(this.grid.cols / 2);
    this.cellY = 0;
    this.px = this.cellX * cs;
    this.py = this.cellY * cs;

    this.dx = 0;
    this.dy = 0;
    this.pendingDx = 0;
    this.pendingDy = 0;

    this.onSolid = true;
    this.trail   = [];

    this.animFrame = 0;
    this.animTimer = 0;
  }

  setDir(dx, dy) {
    this.pendingDx = dx;
    this.pendingDy = dy;
  }

  update(dt) {
    const cs    = CONFIG.CELL_SIZE;
    const speed = CONFIG.PLAYER_SPEED;

    // ── 1. Direction change: apply when near a cell center ────────────────
    //    Threshold < 1 frame's movement so we don't oscillate
    const snapX    = Math.round(this.px / cs) * cs;
    const snapY    = Math.round(this.py / cs) * cs;
    const snapDist = Math.abs(this.px - snapX) + Math.abs(this.py - snapY);
    const frameMov = speed * dt;  // pixels moved per frame

    if (snapDist < frameMov && (this.pendingDx !== 0 || this.pendingDy !== 0)) {
      const nc = Math.round(snapX / cs) + this.pendingDx;
      const nr = Math.round(snapY / cs) + this.pendingDy;
      if (nc >= 0 && nc < this.grid.cols && nr >= 0 && nr < this.grid.rows) {
        // Snap to cell centre, then change direction
        this.px = snapX;
        this.py = snapY;
        this.dx = this.pendingDx;
        this.dy = this.pendingDy;
        this.pendingDx = 0;
        this.pendingDy = 0;
      }
    }

    // ── 2. Track which cell we're leaving ─────────────────────────────────
    const prevC = Math.floor(this.px / cs);
    const prevR = Math.floor(this.py / cs);

    // ── 3. Move ───────────────────────────────────────────────────────────
    if (this.dx !== 0 || this.dy !== 0) {
      this.px = Math.max(0, Math.min((this.grid.cols - 1) * cs,
                                      this.px + this.dx * speed * dt));
      this.py = Math.max(0, Math.min((this.grid.rows - 1) * cs,
                                      this.py + this.dy * speed * dt));
    }

    // ── 4. Cell crossing: fire logic only when entering a new cell ────────
    const newC = Math.floor(this.px / cs);
    const newR = Math.floor(this.py / cs);

    if (newC !== prevC || newR !== prevR) {
      this.cellX = newC;
      this.cellY = newR;
      const result = this._onEnterCell();
      if (result) return result;
    }

    // ── 5. Animation ──────────────────────────────────────────────────────
    this.animTimer += dt;
    if (this.animTimer > 0.12) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }

    return null;
  }

  _onEnterCell() {
    const cell = this.grid.get(this.cellX, this.cellY);

    if (cell === CELL.TRAIL) {
      // Backtracking: player stepped onto the previous trail cell — erase that step
      if (this.trail.length > 1) {
        const prev = this.trail[this.trail.length - 2];
        if (prev.c === this.cellX && prev.r === this.cellY) {
          const last = this.trail.pop();
          this.grid.set(last.c, last.r, CELL.OPEN);
          return null;
        }
      }
      // Self-intersection (not backtracking)
      if (this.trail.length > 2) return 'DEATH';
    }

    if (this.grid.isSolid(this.cellX, this.cellY)) {
      this.onSolid = true;
      if (this.trail.length > 0) {
        return 'CAPTURE';   // Closed a path — capture territory
      }
    } else if (cell === CELL.OPEN) {
      this.onSolid = false;
      this.grid.set(this.cellX, this.cellY, CELL.TRAIL);
      this.trail.push({ c: this.cellX, r: this.cellY });
    }

    return null;
  }
}
