export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 24; // was 20, taller for better visibility

// Basic terminal colors (0-7 => black, red, green, yellow, blue, magenta, cyan, white)
export type ColorCode = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

// Suggested colors for tetrominoes (may change later)
export const COLORS = {
  empty: null as null | ColorCode,
  I: 6 as ColorCode, // cyan
  O: 3 as ColorCode, // yellow
  T: 5 as ColorCode, // magenta
  S: 2 as ColorCode, // green
  Z: 1 as ColorCode, // red
  J: 4 as ColorCode, // blue
  L: 3 as ColorCode, // yellow (can change to a different scheme)
};

// Render each cell as three spaces to widen cells
export const CELL_PIXELS = '   ';
