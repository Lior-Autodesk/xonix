'use strict';

class Grid {
  constructor() {
    this.cols = CONFIG.COLS;
    this.rows = CONFIG.ROWS;
    this.cells = new Uint8Array(this.cols * this.rows);
    this.gen   = new Uint8Array(this.cols * this.rows);
    this.captureGen = 0;
    this._initBorder();
  }

  index(c, r) {
    return r * this.cols + c;
  }

  get(c, r) {
    return this.cells[this.index(c, r)];
  }

  set(c, r, v) {
    this.cells[this.index(c, r)] = v;
  }

  isSolid(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return true;
    const v = this.cells[this.index(c, r)];
    return v === CELL.BORDER || v === CELL.CAPTURED;
  }

  _initBorder() {
    this.cells.fill(CELL.OPEN);
    this.gen.fill(0);
    for (let c = 0; c < this.cols; c++) {
      this.set(c, 0, CELL.BORDER);
      this.set(c, this.rows - 1, CELL.BORDER);
    }
    for (let r = 0; r < this.rows; r++) {
      this.set(0, r, CELL.BORDER);
      this.set(this.cols - 1, r, CELL.BORDER);
    }
  }

  reset() {
    this.captureGen = 0;
    this._initBorder();
  }

  clearTrail() {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === CELL.TRAIL) this.cells[i] = CELL.OPEN;
    }
  }

  convertTrailToBorder() {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === CELL.TRAIL) this.cells[i] = CELL.BORDER;
    }
  }

  normalizeCaptured() {
    for (let i = 0; i < this.cells.length; i++) {
      if (this.cells[i] === CELL.CAPTURED) this.cells[i] = CELL.BORDER;
    }
  }

  capturePercent() {
    let solid = 0;
    const total = this.cols * this.rows;
    for (let i = 0; i < total; i++) {
      if (this.cells[i] === CELL.BORDER || this.cells[i] === CELL.CAPTURED) solid++;
    }
    // Normalize: start from 0 by excluding the fixed border perimeter
    const borderCount = 2 * (this.cols + this.rows - 2);
    const interior    = total - borderCount;
    return Math.max(0, (solid - borderCount) / interior);
  }
}
