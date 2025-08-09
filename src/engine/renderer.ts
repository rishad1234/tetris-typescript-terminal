import { color, cursor } from './ansi';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_PIXELS, ColorCode } from '../core/constants';

export type Cell = {
  bg: ColorCode | null;
};

export class FrameBuffer {
  width: number;
  height: number;
  cells: Cell[][];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.cells = Array.from({ length: height }, () =>
      Array.from({ length: width }, () => ({ bg: null as ColorCode | null }))
    );
  }

  fill(bg: ColorCode | null) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        this.cells[y][x].bg = bg;
      }
    }
  }

  clone(): FrameBuffer {
    const fb = new FrameBuffer(this.width, this.height);
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        fb.cells[y][x].bg = this.cells[y][x].bg;
      }
    }
    return fb;
  }
}

export class Renderer {
  constructor(private originRow: number, private originCol: number) {}

  setOrigin(row: number, col: number) {
    this.originRow = row;
    this.originCol = col;
  }

  // Draw framebuffer to terminal with minimal updates using a previous frame
  draw(current: FrameBuffer, previous?: FrameBuffer) {
    const cellW = CELL_PIXELS.length; // characters per cell
    let out = '';

    out += color.reset();

    if (!previous) {
      // Full-frame render
      for (let y = 0; y < current.height; y++) {
        let lastBg: ColorCode | null = null;
        let rowStr = '';
        for (let x = 0; x < current.width; x++) {
          const curBg = current.cells[y][x].bg;
          if (curBg !== lastBg) {
            rowStr += color.bg(curBg == null ? null : curBg);
            lastBg = curBg;
          }
          rowStr += CELL_PIXELS;
        }
        rowStr += color.reset();
        out += cursor.moveTo(this.originRow + y, this.originCol) + rowStr;
      }
      process.stdout.write(out);
      return;
    }

    // Diff render: update only changed segments per row
    for (let y = 0; y < current.height; y++) {
      let x = 0;
      while (x < current.width) {
        const prevBg = previous.cells[y][x].bg;
        const curBg = current.cells[y][x].bg;
        if (prevBg === curBg) {
          x++;
          continue;
        }
        // Start of a changed segment
        const start = x;
        while (x < current.width && previous.cells[y][x].bg !== current.cells[y][x].bg) {
          x++;
        }
        const colPos = this.originCol + start * cellW;
        out += cursor.moveTo(this.originRow + y, colPos);
        let lastBg: ColorCode | null = null;
        for (let xi = start; xi < x; xi++) {
          const bg = current.cells[y][xi].bg;
          if (bg !== lastBg) {
            out += color.bg(bg == null ? null : bg);
            lastBg = bg;
          }
          out += CELL_PIXELS;
        }
        out += color.reset();
      }
    }

    // Explicitly write the last row to avoid missing the bottom line
    {
      let y = current.height - 1;
      let x = 0;
      let rowStr = '';
      let lastBg: ColorCode | null = null;
      while (x < current.width) {
        const curBg = current.cells[y][x].bg;
        if (curBg !== lastBg) {
          rowStr += color.bg(curBg == null ? null : curBg);
          lastBg = curBg;
        }
        rowStr += CELL_PIXELS;
        x++;
      }
      rowStr += color.reset();
      out += cursor.moveTo(this.originRow + y, this.originCol) + rowStr;
    }

    if (out) process.stdout.write(out);
  }
}

// Utility to make a playfield-sized frame buffer
export function createPlayfieldBuffer() {
  return new FrameBuffer(BOARD_WIDTH, BOARD_HEIGHT);
}
