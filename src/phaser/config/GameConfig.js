/**
 * Configurações centralizadas do jogo
 */

export const GAME_CONFIG = {
  BLOCK_SIZE: 45,
  GRID_SIZE: 8,
  PIECES_PER_SET: 3,
  ANIMATION_DURATION: 300,
  PREVIEW_ALPHA: 0.5,
};

export const COLORS = {
  CYAN: 0x00FFFF,
  YELLOW: 0xFFFF00,
  PURPLE: 0x800080,
  GREEN: 0x00FF00,
  RED: 0xFF0000,
  BLUE: 0x0000FF,
  ORANGE: 0xFFA500,
  PINK: 0xFF1493,
  TURQUOISE: 0x00CED1,
};

export const COLOR_PALETTE = Object.values(COLORS);

export const SHAPES = [
  { id: 'single', pattern: [[1]], name: '1x1' },
  { id: 'horizontal2', pattern: [[1, 1]], name: '1x2' },
  { id: 'vertical2', pattern: [[1], [1]], name: '2x1' },
  { id: 'horizontal3', pattern: [[1, 1, 1]], name: '1x3' },
  { id: 'vertical3', pattern: [[1], [1], [1]], name: '3x1' },
  { id: 'square', pattern: [[1, 1], [1, 1]], name: 'Square' },
  { id: 'z', pattern: [[1, 1, 0], [0, 1, 1]], name: 'Z' },
  { id: 's', pattern: [[0, 1, 1], [1, 1, 0]], name: 'S' },
  { id: 'l_small', pattern: [[1, 0], [1, 1]], name: 'L Small' },
  { id: 'l_small_inv', pattern: [[0, 1], [1, 1]], name: 'L Small Inv' },
  { id: 't', pattern: [[1, 1, 1], [0, 1, 0]], name: 'T' },
  { id: 'l_large', pattern: [[1, 1, 1], [1, 0, 0]], name: 'L Large' },
  { id: 'l_large_inv', pattern: [[1, 1, 1], [0, 0, 1]], name: 'L Large Inv' },
  { id: 't_side', pattern: [[1, 0, 0], [1, 1, 1]], name: 'T Side' },
  { id: 'l_vertical', pattern: [[1, 1], [1, 0], [1, 0]], name: 'L Vertical' },
];

export const SCORE_CONFIG = {
  BASE_POINTS: 100,
  COMBO_MULTIPLIER: 2,
  STORAGE_KEY: 'puzzleTetrisHighScore',
};

export const UI_CONFIG = {
  FONT_FAMILY: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
  PRIMARY_COLOR: '#00ff00',
  SECONDARY_COLOR: '#00ffff',
  ACCENT_COLOR: '#ffd700',
};

// Dimensões calculadas
export const GAME_WIDTH = GAME_CONFIG.BLOCK_SIZE * GAME_CONFIG.GRID_SIZE;
export const GAME_HEIGHT = GAME_CONFIG.BLOCK_SIZE * GAME_CONFIG.GRID_SIZE;
