'use strict';

class Enemy {
  constructor(grid, speed, emojiIndex) {
    this.grid = grid;
    this.speed = speed;
    this.emojiIndex = emojiIndex % 3; // 0=👨‍💼 1=👩‍💼 2=🧑‍💼
    this._spawn();

    // Always diagonal — pick random quadrant
    const sx = Math.random() < 0.5 ? 1 : -1;
    const sy = Math.random() < 0.5 ? 1 : -1;
    this.vx = sx * this.speed;
    this.vy = sy * this.speed;

    this.animFrame = 0;
    this.animTimer = 0;
  }

  _spawn() {
    const cs = CONFIG.CELL_SIZE;
    const margin = 6;
    let tries = 0;
    while (tries < 200) {
      const c = margin + Math.floor(Math.random() * (this.grid.cols - margin * 2));
      const r = margin + Math.floor(Math.random() * (this.grid.rows - margin * 2));
      if (this.grid.get(c, r) === CELL.OPEN) {
        this.px = c * cs + cs / 2;
        this.py = r * cs + cs / 2;
        return;
      }
      tries++;
    }
    // Fallback to center
    this.px = (this.grid.cols / 2) * cs;
    this.py = (this.grid.rows / 2) * cs;
  }

  update() {
    const cs = CONFIG.CELL_SIZE;
    const r = CONFIG.EMOJI_SIZE * 0.4; // collision radius

    let nx = this.px + this.vx;
    let ny = this.py + this.vy;

    const maxX = (this.grid.cols - 1) * cs;
    const maxY = (this.grid.rows - 1) * cs;

    // Check bounce against solid cells and canvas edges
    const checkC_x = Math.floor((nx + (this.vx > 0 ? r : -r)) / cs);
    const checkR_x = Math.floor(this.py / cs);
    const checkC_y = Math.floor(this.px / cs);
    const checkR_y = Math.floor((ny + (this.vy > 0 ? r : -r)) / cs);

    const bounceX = nx - r < 0 || nx + r > maxX ||
      (checkC_x >= 0 && checkC_x < this.grid.cols &&
       checkR_x >= 0 && checkR_x < this.grid.rows &&
       this.grid.isSolid(checkC_x, checkR_x));

    const bounceY = ny - r < 0 || ny + r > maxY ||
      (checkC_y >= 0 && checkC_y < this.grid.cols &&
       checkR_y >= 0 && checkR_y < this.grid.rows &&
       this.grid.isSolid(checkC_y, checkR_y));

    if (bounceX) {
      this.vx = -this.vx;
      nx = this.px + this.vx;
    }
    if (bounceY) {
      this.vy = -this.vy;
      ny = this.py + this.vy;
    }

    this.px = Math.max(r, Math.min(maxX - r, nx));
    this.py = Math.max(r, Math.min(maxY - r, ny));

    this.animTimer += 1 / 60;
    if (this.animTimer > 0.15) {
      this.animTimer = 0;
      this.animFrame = (this.animFrame + 1) % 2;
    }
  }

  get cellX() { return Math.floor(this.px / CONFIG.CELL_SIZE); }
  get cellY() { return Math.floor(this.py / CONFIG.CELL_SIZE); }
}
