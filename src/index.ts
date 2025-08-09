// Simple terminal helpers
const ESC = (s: string) => `\u001b[${s}`;
const clear = () => process.stdout.write(ESC('2J') + ESC('1;1H'));
const hideCursor = () => process.stdout.write(ESC('?25l'));
const showCursor = () => process.stdout.write(ESC('?25h'));

// Toggles (VS Code terminal sometimes hides alt-screen output)
const USE_ALT_SCREEN = true;
const DISABLE_WRAP = true;

function cleanup() {
  // restore modes
  if (DISABLE_WRAP) process.stdout.write(ESC('?7h')); // enable wrap
  if (USE_ALT_SCREEN) process.stdout.write(ESC('?1049l')); // leave alt screen
  showCursor();
  process.stdin.setRawMode?.(false);
  process.stdin.pause();
}

process.on('exit', cleanup);
process.on('SIGINT', () => {
  cleanup();
  process.exit(0);
});

// Phase 2: basic renderer demo
import { Renderer, createPlayfieldBuffer } from './engine/renderer';
import { BOARD_HEIGHT, BOARD_WIDTH, CELL_PIXELS } from './core/constants';

function centerOrigin(widthCells: number, heightCells: number) {
  const cellW = CELL_PIXELS.length;
  const termCols = process.stdout.columns ?? 80;
  const termRows = process.stdout.rows ?? 24;
  const usedRows = heightCells + 2; // include top+bottom border

  const col = Math.max(1, Math.floor((termCols - widthCells * cellW) / 2) + 1);

  // Center vertically
  const row = Math.max(1, Math.floor((termRows - usedRows) / 2) + 1);

  return { row, col };
}

async function main() {
  // enter alt screen and disable wrap (conditionally)
  if (USE_ALT_SCREEN) process.stdout.write(ESC('?1049h'));
  if (DISABLE_WRAP) process.stdout.write(ESC('?7l'));

  clear();
  hideCursor();
  process.stdin.setRawMode?.(true);
  process.stdin.resume();

  const widthCells = BOARD_WIDTH;
  const heightCells = BOARD_HEIGHT;
  const { row, col } = centerOrigin(widthCells, heightCells);
  const renderer = new Renderer(row + 1, col + 1); // +1 to leave border space
  let prev: ReturnType<typeof createPlayfieldBuffer> | undefined = undefined;
  let cur = createPlayfieldBuffer();

  // draw border once (simple single-line box)
  const cellW = CELL_PIXELS.length;
  const innerW = widthCells * cellW;
  const left = col;
  const top = row;
  const right = left + innerW + 1;
  const bottom = top + heightCells + 1; // bottom border exactly below last playfield row
  // draw top border
  process.stdout.write(ESC(`${top};${left}H`) + `┌${'─'.repeat(innerW)}┐`);
  for (let r = 0; r < heightCells; r++) {
    process.stdout.write(ESC(`${top + 1 + r};${left}H`) + '│');
    process.stdout.write(ESC(`${top + 1 + r};${right}H`) + '│');
  }
  process.stdout.write(ESC(`${bottom};${left}H`) + `└${'─'.repeat(innerW)}┘`);

  let t = 0;
  let bandPos = 0;
  let bandDir = 1; // 1=down, -1=up
  const tick = () => {
    const next = cur.clone();

    // fill whole playfield with black for contrast
    for (let y = 0; y < next.height; y++) {
      for (let x = 0; x < next.width; x++) {
        next.cells[y][x].bg = 0; // black
      }
    }

    // update band position (bounce between 0 and height-3)
    if (t % 2 === 0) {
      bandPos += bandDir;
      if (bandPos <= 0) {
        bandPos = 0;
        bandDir = 1;
      } else if (bandPos >= next.height - 3) {
        bandPos = next.height - 3;
        bandDir = -1;
      }
    }

    // draw a 3-row band cycling colors (avoid white)
    for (let y = bandPos; y < bandPos + 3; y++) {
      for (let x = 0; x < next.width; x++) {
        const idx = ((x + t) % 6) + 1; // 1..6 (no white)
        next.cells[y][x].bg = idx as 1 | 2 | 3 | 4 | 5 | 6;
      }
    }

    // Force full redraw when touching bottom to ensure last line updates
    if (bandPos === next.height - 3) {
      renderer.draw(next, undefined);
    } else {
      renderer.draw(next, prev);
    }
    prev = next;
    cur = next;
    t++;
  };

  const interval = setInterval(tick, 1000 / 30);

  process.stdout.on('resize', () => {
    clear();
    const { row: r, col: c } = centerOrigin(widthCells, heightCells);
    // redraw border at new location
    const left2 = c;
    const top2 = r;
    const right2 = left2 + innerW + 1;
    const bottom2 = top2 + heightCells + 1; // bottom border exactly below last playfield row
    process.stdout.write(ESC(`${top2};${left2}H`) + `┌${'─'.repeat(innerW)}┐`);
    for (let rr = 0; rr < heightCells; rr++) {
      process.stdout.write(ESC(`${top2 + 1 + rr};${left2}H`) + '│');
      process.stdout.write(ESC(`${top2 + 1 + rr};${right2}H`) + '│');
    }
    process.stdout.write(ESC(`${bottom2};${left2}H`) + `└${'─'.repeat(innerW)}┘`);

    renderer.setOrigin(r + 1, c + 1);
    prev = undefined; // force full redraw
  });

  process.stdin.on('data', (buf: Buffer) => {
    const bytes = [...buf.values()];
    if (bytes.length === 1 && bytes[0] === 113 /* q */) {
      clearInterval(interval);
      cleanup();
      process.exit(0);
    }
  });
}

main().catch((e) => {
  showCursor();
  console.error(e);
  process.exit(1);
});
