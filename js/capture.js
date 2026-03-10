'use strict';

/**
 * BFS flood fill from each enemy.
 * All OPEN cells reachable from any enemy = unsafe.
 * Everything else (OPEN but unreachable) = captured.
 * Returns count of newly captured cells.
 */
function performCapture(grid, enemies) {
  const total = grid.cols * grid.rows;
  const visited = new Uint8Array(total);

  // BFS from each enemy — mark all reachable OPEN cells as unsafe
  for (const enemy of enemies) {
    const startC = enemy.cellX;
    const startR = enemy.cellY;
    const startIdx = grid.index(startC, startR);

    if (visited[startIdx]) continue;

    const queue = [startC + startR * grid.cols]; // packed index
    visited[startIdx] = 1;

    while (queue.length > 0) {
      const idx = queue.pop();
      const c = idx % grid.cols;
      const r = (idx / grid.cols) | 0;

      const neighbors = [
        [c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]
      ];

      for (const [nc, nr] of neighbors) {
        if (nc < 0 || nc >= grid.cols || nr < 0 || nr >= grid.rows) continue;
        const ni = grid.index(nc, nr);
        if (!visited[ni] && grid.cells[ni] === CELL.OPEN) {
          visited[ni] = 1;
          queue.push(nc + nr * grid.cols);
        }
      }
    }
  }

  // Stamp new generation for this capture event
  grid.captureGen++;
  const g = grid.captureGen;

  // All unvisited OPEN cells are safely enclosed — capture them
  let count = 0;
  for (let i = 0; i < total; i++) {
    if (grid.cells[i] === CELL.OPEN && !visited[i]) {
      grid.cells[i] = CELL.BORDER;
      grid.gen[i]   = g;
      count++;
    }
  }

  // Trail → border, same generation
  for (let i = 0; i < total; i++) {
    if (grid.cells[i] === CELL.TRAIL) {
      grid.cells[i] = CELL.BORDER;
      grid.gen[i]   = g;
    }
  }

  return count;
}
