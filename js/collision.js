'use strict';

function enemyHitsTrail(grid, enemies) {
  for (const e of enemies) {
    if (grid.get(e.cellX, e.cellY) === CELL.TRAIL) return true;
  }
  return false;
}

function enemyHitsPlayer(player, enemies) {
  const threshold = CONFIG.CELL_SIZE * 0.9;
  for (const e of enemies) {
    const dx = player.px - e.px;
    const dy = player.py - e.py;
    if (dx * dx + dy * dy < threshold * threshold) return true;
  }
  return false;
}
