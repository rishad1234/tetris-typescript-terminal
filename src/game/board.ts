import { BOARD_WIDTH, BOARD_HEIGHT, ColorCode, HIDDEN_ROWS } from '../core/constants';

export type Cell = ColorCode | null;

export class Board {
  readonly width = BOARD_WIDTH;
  readonly height = BOARD_HEIGHT; // includes hidden rows at the top
  grid: Cell[][]; // [y][x]

  constructor() {
    this.grid = Array.from({ length: this.height }, () => Array.from({ length: this.width }, () => null));
  }

  reset() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) this.grid[y][x] = null;
    }
  }

  get(x: number, y: number): Cell {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return 1; // treat out of bounds as solid
    return this.grid[y][x];
  }

  set(x: number, y: number, c: Cell) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    this.grid[y][x] = c;
  }

  // Clear full lines; return number of cleared lines
  clearLines(): number {
    let cleared = 0;
    for (let y = 0; y < this.height; y++) {
      if (this.grid[y].every((c) => c != null)) {
        // remove row y, add empty row at top
        this.grid.splice(y, 1);
        this.grid.unshift(Array.from({ length: this.width }, () => null));
        cleared++;
      }
    }
    return cleared;
  }

  // Check if any block occupies visible area start; for game over detection later
  hasBlocksInHidden(): boolean {
    for (let y = 0; y < HIDDEN_ROWS; y++) {
      if (this.grid[y].some((c) => c != null)) return true;
    }
    return false;
  }
}
