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
import { PIECES, PieceDef, PieceKind, getRotation } from './game/pieces';
import { ActivePiece } from './game/activePiece';
import { Bag7 } from './game/randomizer';
import { color } from './engine/ansi';

function centerOrigin(widthCells: number, heightCells: number) {
  const cellW = CELL_PIXELS.length;
  const termCols = process.stdout.columns ?? 80;
  const termRows = process.stdout.rows ?? 24;
  const usedRows = heightCells + 2; // include top+bottom border

  // Center the entire bordered playfield (inner width + 2 border columns)
  const totalW = widthCells * cellW + 2;
  const col = Math.max(1, Math.floor((termCols - totalW) / 2) + 1);

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

// Create active piece from a known kind (used when managing next queue)
function spawnPieceFromKind(kind: PieceKind): ActivePiece {
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
  // Track current origin (top-left of border) so HUD/messages stay aligned across resizes
  let originTop = row;
  let originLeft = col;
  let prev: ReturnType<typeof createPlayfieldBuffer> | undefined = undefined;
  let cur = createPlayfieldBuffer();

  const board = new Board();
  const bag = new Bag7();

  // HUD + game stats
  let score = 0;
  let lines = 0;
  let level = 1;
  const baseScores: Record<number, number> = { 1: 100, 2: 300, 3: 500, 4: 800 };
  const updateLevel = () => { level = Math.floor(lines / 10) + 1; };

  // Next piece queue
  let nextKind: PieceKind = bag.next();
  let active = spawnPieceFromKind(nextKind);
  nextKind = bag.next();

  // Input and controls
  let paused = false;
  let softDrop = false;
  let gameOver = false;
  let interval: ReturnType<typeof setInterval>;

  // HUD helpers (compute positions per call so resize can redraw with new row/col)
  const HUD_GAP = 4; // gap between playfield border and HUD
  const hudPad = 36; // HUD content width (clearing/padding)
  const writeHudLine = (rowPos: number, colPos: number, text: string) => {
    const s = text.padEnd(hudPad, ' ');
    process.stdout.write(ESC(`${rowPos};${colPos}H`) + s);
  };
  const drawNextPreview = (kind: PieceKind, r: number, c: number) => {
    const def = PIECES[kind];
    const rot = getRotation(def, 0);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [ox, oy] of rot) { if (ox < minX) minX = ox; if (ox > maxX) maxX = ox; if (oy < minY) minY = oy; if (oy > maxY) maxY = oy; }
    const w = maxX - minX + 1; const h = maxY - minY + 1;
    const offX = Math.floor((4 - w) / 2) - minX; const offY = Math.floor((4 - h) / 2) - minY;
  const hudCol = (c + (widthCells * CELL_PIXELS.length) + 1) + HUD_GAP;
    // clear preview area (4 rows)
    for (let i = 0; i < 4; i++) process.stdout.write(ESC(`${r + 2 + i};${hudCol}H`) + ' '.repeat(hudPad));
    const cell = CELL_PIXELS; const bg = def.color;
    const makeRow = (y: number) => {
      let out = '';
      out += color.reset();
      for (let x = 0; x < 4; x++) {
        let filled = false; for (const [ox, oy] of rot) { if (x === ox + offX && y === oy + offY) { filled = true; break; } }
        out += color.bg(filled ? bg : 0) + cell;
      }
      out += color.reset();
      return out;
    };
    for (let y = 0; y < 4; y++) process.stdout.write(ESC(`${r + 2 + y};${hudCol}H`) + makeRow(y));
  };
  let lastHud: { score: number; lines: number; level: number; next: PieceKind } | null = null;
  const drawHUD = (force = false, r = originTop, c = originLeft) => {
    const curHud = { score, lines, level, next: nextKind };
    if (!force && lastHud && lastHud.score === score && lastHud.lines === lines && lastHud.level === level && lastHud.next === nextKind) return;
  const hudCol = (c + (widthCells * CELL_PIXELS.length) + 1) + HUD_GAP;
    writeHudLine(r, hudCol, 'Score: ' + score);
    writeHudLine(r + 1, hudCol, 'Lines: ' + lines);
    writeHudLine(r + 2 + 4, hudCol, 'Next:');
    drawNextPreview(nextKind, r, c);
    writeHudLine(r + 2 + 5, hudCol, 'Level: ' + level);
    lastHud = curHud;
  };

  const printGameOver = () => {
    const cellW = CELL_PIXELS.length;
    const innerW = widthCells * cellW;
    const bottom = originTop + heightCells + 1;
    const left = originLeft;
    const raw = ' GAME OVER: r=restart, q=quit ';
    const msg = raw.slice(0, innerW); // avoid overflow beyond inner area
    const pad = Math.max(0, Math.floor((innerW - msg.length) / 2));
    // clear full status line to avoid leftovers
    process.stdout.write(ESC(`${bottom + 1};1H`) + ESC('2K'));
    // write centered within inner area
    process.stdout.write(ESC(`${bottom + 1};${left + 1}H`) + ' '.repeat(pad) + msg);
  };

  const printPaused = () => {
    const cellW = CELL_PIXELS.length;
    const innerW = widthCells * cellW;
    const bottom = originTop + heightCells + 1;
    const left = originLeft;
    const raw = ' PAUSED: press p to resume ';
    const msg = raw.slice(0, innerW);
    const pad = Math.max(0, Math.floor((innerW - msg.length) / 2));
    process.stdout.write(ESC(`${bottom + 1};1H`) + ESC('2K'));
    process.stdout.write(ESC(`${bottom + 1};${left + 1}H`) + ' '.repeat(pad) + msg);
  };

  const clearStatusLine = () => {
    const bottom = originTop + heightCells + 1;
    // clear entire terminal line to avoid any leftover text
    process.stdout.write(ESC(`${bottom + 1};1H`) + ESC('2K'));
  };

  const input = new Input(process.stdin);
  input.onKey((k) => {
    if (k === 'q' || k === 'ctrl-c') {
      clearInterval(interval);
      clearStatusLine();
      cleanup();
      process.exit(0);
    }
    if (gameOver) {
      if (k === 'r') {
        // restart
        board.reset();
        active = spawnPiece(board, bag);
        paused = false;
        softDrop = false;
        gameOver = false;
        clearStatusLine();
        // resume loop if it was stopped
        interval = setInterval(tick, 1000 / 30);
      }
      return; // ignore other inputs when over
    }
    if (k === 'p') {
      paused = !paused;
      if (paused) printPaused(); else clearStatusLine();
      return;
    }
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
      const cleared = board.clearLines();
      if (cleared > 0) { lines += cleared; score += (baseScores[cleared] || 0) * level; updateLevel(); }
      // spawn from queue
      active = spawnPieceFromKind(nextKind);
      nextKind = bag.next();
      drawHUD(true);
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
        const cleared = board.clearLines();
        if (cleared > 0) { lines += cleared; score += (baseScores[cleared] || 0) * level; updateLevel(); }
        active = spawnPieceFromKind(nextKind);
        nextKind = bag.next();
        drawHUD(true);
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
    // cheap HUD update; will skip if unchanged
    drawHUD();
  };

  interval = setInterval(tick, 1000 / 30);

  process.stdout.on('resize', () => {
    clear();
    const { row: r, col: c } = centerOrigin(widthCells, heightCells);
  originTop = r;
  originLeft = c;
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
    // redraw HUD aligned to new position
  drawHUD(true);
  });

  process.stdin.on('data', (buf: Buffer) => {
    const bytes = [...buf.values()];
    if (bytes.length === 1 && bytes[0] === 113 /* q */) {
      clearInterval(interval);
      clearStatusLine();
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
