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

// Phase 4: basic core model wired to renderer
import { Renderer, createPlayfieldBuffer, blitBoardToBuffer } from './engine/renderer';
import { Input } from './engine/input';
import { BOARD_WIDTH, CELL_PIXELS, VISIBLE_HEIGHT, HIDDEN_ROWS } from './core/constants';
import { Board } from './game/board';
import { PIECES, PieceDef } from './game/pieces';
import { ActivePiece } from './game/activePiece';
import { Bag7 } from './game/randomizer';

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

function spawnPiece(board: Board, bag: Bag7): ActivePiece {
  const kind = bag.next();
  const def: PieceDef = PIECES[kind];
  const spawnX = def.spawnOffset?.x ?? 3;
  const spawnY = (def.spawnOffset?.y ?? 0) - HIDDEN_ROWS; // start in hidden
  return new ActivePiece(def, spawnX, spawnY, 0);
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
  const heightCells = VISIBLE_HEIGHT;
  const { row, col } = centerOrigin(widthCells, heightCells);
  const renderer = new Renderer(row + 1, col + 1); // +1 to leave border space
  let prev: ReturnType<typeof createPlayfieldBuffer> | undefined = undefined;
  let cur = createPlayfieldBuffer();

  const board = new Board();
  const bag = new Bag7();
  let active = spawnPiece(board, bag);

  // Input and controls
  let paused = false;
  let softDrop = false;
  let gameOver = false;
  let interval: ReturnType<typeof setInterval>;

  const printGameOver = () => {
    const cellW = CELL_PIXELS.length;
    const innerW = widthCells * cellW;
    const bottom = row + heightCells + 1;
    const left = col;
    const message = ' GAME OVER — press q to quit ';
    const pad = Math.max(0, Math.floor((innerW - message.length) / 2));
    process.stdout.write(ESC(`${bottom + 1};${left + 1}H`) + ' '.repeat(innerW));
    process.stdout.write(ESC(`${bottom + 1};${left + 1}H`) + ' '.repeat(pad) + message);
  };

  const input = new Input(process.stdin);
  input.onKey((k) => {
    if (k === 'q' || k === 'ctrl-c') {
      clearInterval(interval);
      cleanup();
      process.exit(0);
    }
    if (gameOver) return; // ignore all inputs except quit
    if (k === 'p') { paused = !paused; return; }
    if (paused) return;

    if (k === 'left') active.move(board, -1, 0);
    if (k === 'right') active.move(board, +1, 0);
    if (k === 'down') softDrop = true;
    if (k === 'up') {
      // hard drop
      const d = active.hardDropDistance(board);
      if (d > 0) active.move(board, 0, d);
      // lock immediately
      for (const { x, y } of active.cells()) if (y >= 0) board.set(x, y, active.color);
      board.clearLines();
      active = spawnPiece(board, bag);
      if (active.collides(board)) {
        gameOver = true;
        printGameOver();
        clearInterval(interval);
      }
    }
    if (k === 'z') active.rotate(board, -1);
    if (k === 'x') active.rotate(board, +1);
  });
  input.start();

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

  // Gravity
  const GRAVITY_TICKS = 20; // 20 ticks per cell at 30 FPS => ~1.5 cells/sec
  let fallCounter = 0;

  const tick = () => {
    if (paused || gameOver) return; // freeze frame when paused or over

    // gravity
    const speed = softDrop ? 1 : GRAVITY_TICKS;
    fallCounter++;
    if (fallCounter >= speed) {
      fallCounter = 0;
      const moved = active.move(board, 0, 1);
      if (!moved) {
        // lock
        for (const { x, y } of active.cells()) if (y >= 0) board.set(x, y, active.color);
        board.clearLines();
        active = spawnPiece(board, bag);
        if (active.collides(board)) {
          gameOver = true;
          printGameOver();
          clearInterval(interval);
          return;
        }
      }
      softDrop = false; // consume soft drop
    }

    const next = cur.clone();
    blitBoardToBuffer(next, board, active);
    renderer.draw(next, prev);
    prev = next;
    cur = next;
  };

  interval = setInterval(tick, 1000 / 30);

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
