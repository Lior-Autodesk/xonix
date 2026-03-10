'use strict';

const CELL = Object.freeze({
  OPEN:     0,
  BORDER:   1,
  TRAIL:    2,
  CAPTURED: 3
});

// Portrait on mobile (36×64), landscape on desktop (64×36)
const _IS_MOBILE = !window.matchMedia('(pointer: fine) and (hover: hover)').matches;

const CONFIG = Object.freeze({
  COLS: _IS_MOBILE ? 36 : 64,
  ROWS: _IS_MOBILE ? 64 : 36,
  CELL_SIZE: 12,

  PLAYER_SPEED: 170,       // pixels per second
  ENEMY_BASE_SPEED: 0.5,   // pixels per frame (at 60fps)
  ENEMY_SPEED_INC: 0.25,   // per level

  LIVES_START: 3,
  LEVELS_TOTAL: 5,
  CAPTURE_THRESHOLD: 0.75,

  PLAYER_EMOJI: '👨‍🎨',
  ENEMY_EMOJIS: ['🚀', '🚀', '🚀'],
  EMOJI_SIZE: 22,           // px — larger than cell so they stand out

  SCORE_PER_CELL: 10,       // × level multiplier
  SCORE_LIFE_BONUS: 500,

  COLORS: {
    OPEN_FALLBACK: '#001133',
    BORDER:        '#0044aa',
    BORDER_SHINE:  'rgba(80,160,255,0.35)',
    TRAIL:         '#ff5500',
    TRAIL_CENTER:  '#ffaa00',
    HUD_BG:        'rgba(0,0,16,0.82)',
    HUD_TEXT:      '#ffffff',
    PROGRESS_BG:   '#112233',
    PROGRESS_FG:   '#00ffcc',
    PROGRESS_WARN: '#ffcc00'  // when > 60%
  }
});
