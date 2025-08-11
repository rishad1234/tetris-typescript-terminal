export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 21; // total internal height (visible + hidden)
export const VISIBLE_HEIGHT = 20; // visible rows
export const HIDDEN_ROWS = BOARD_HEIGHT - VISIBLE_HEIGHT; // rows hidden at the top

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
