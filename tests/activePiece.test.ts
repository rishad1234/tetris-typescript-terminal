import { describe, it, expect } from 'vitest';
import { Board } from '../src/game/board';
import { ActivePiece } from '../src/game/activePiece';
import { PIECES } from '../src/game/pieces';

describe('ActivePiece', () => {
  it('moves without collision', () => {
    const b = new Board();
    const ap = new ActivePiece(PIECES.T, 3, 0, 0);
    expect(ap.move(b, 1, 0)).toBe(true);
    expect(ap.x).toBe(4);
  });

  it('detects collision with walls', () => {
    const b = new Board();
    const ap = new ActivePiece(PIECES.I, b.width - 1, 0, 0);
    expect(ap.move(b, 1, 0)).toBe(false);
  });

  it('hardDropDistance computes drop without changing state', () => {
    const b = new Board();
    const ap = new ActivePiece(PIECES.O, 3, 0, 0);
    const d = ap.hardDropDistance(b);
    expect(d).toBeGreaterThan(0);
    expect(ap.y).toBe(0);
  });

  it('rotates near wall using simple kicks', () => {
    const b = new Board();
    const ap = new ActivePiece(PIECES.T, 0, 5, 0); // at left wall
    const ok = ap.rotate(b, +1);
    expect(ok).toBe(true);
    // after kick, x should be >= 0
    expect(ap.x).toBeGreaterThanOrEqual(0);
  });

  it('stops on stacked blocks below', () => {
    const b = new Board();
    // stack a row near the bottom
    const stackY = b.height - 3;
    for (let x = 0; x < b.width; x++) b.set(x, stackY, 1);
    const ap = new ActivePiece(PIECES.I, 3, 0, 1); // vertical I
    let moved = true;
    while (moved) moved = ap.move(b, 0, 1);
    // last move failed; piece's lowest y should be just above stackY
    const maxY = Math.max(...ap.cells().map(c => c.y));
    expect(maxY).toBe(stackY - 1);
  });
});
