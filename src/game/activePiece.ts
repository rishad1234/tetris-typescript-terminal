import { PieceDef, getRotation } from './pieces';
import { ColorCode } from '../core/constants';
import { Board } from './board';

export class ActivePiece {
  x: number = 0; // top-left of piece-local bounding box (we assume 4x4 region is enough)
  y: number = 0;
  rot: number = 0; // 0..3
  def: PieceDef;

  constructor(def: PieceDef, spawnX: number, spawnY: number, rot: number = 0) {
    this.def = def;
    this.x = spawnX;
    this.y = spawnY;
    this.rot = rot & 3;
  }

  get color(): ColorCode { return this.def.color; }

  // iterate over global cells occupied by this piece in current state
  cells(): Array<{ x: number; y: number }> {
    const res: Array<{ x: number; y: number }> = [];
    const shape = getRotation(this.def, this.rot);
    for (const [ox, oy] of shape) res.push({ x: this.x + ox, y: this.y + oy });
    return res;
  }

  collides(board: Board): boolean {
    for (const { x, y } of this.cells()) {
      if (x < 0 || x >= board.width || y >= board.height) return true;
      if (y >= 0 && board.get(x, y)) return true;
    }
    return false;
  }

  move(board: Board, dx: number, dy: number): boolean {
    this.x += dx; this.y += dy;
    if (this.collides(board)) {
      this.x -= dx; this.y -= dy;
      return false;
    }
    return true;
  }

  rotate(board: Board, dir: 1 | -1): boolean {
    const old = this.rot;
    this.rot = (this.rot + (dir === 1 ? 1 : 3)) & 3;
    if (this.collides(board)) {
      // simple wall kicks: try left, right, up
      const kicks: Array<[number, number]> = [[-1,0],[1,0],[0,-1]];
      for (const [dx, dy] of kicks) {
        this.x += dx; this.y += dy;
        if (!this.collides(board)) return true;
        this.x -= dx; this.y -= dy;
      }
      this.rot = old;
      return false;
    }
    return true;
  }

  hardDropDistance(board: Board): number {
    let d = 0;
    const oldY = this.y;
    while (true) {
      this.y++;
      if (this.collides(board)) { this.y--; break; }
      d++;
    }
    // restore to original position; caller will move by d if desired
    this.y = oldY;
    return d;
  }
}
