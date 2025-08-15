import { describe, it, expect } from 'vitest';
import { PIECES } from '../src/game/pieces';

describe('Pieces', () => {
  it('every rotation has exactly 4 blocks', () => {
    for (const def of Object.values(PIECES)) {
      for (const rot of def.rots) {
        expect(rot.length).toBe(4);
      }
    }
  });

  it('O piece rotations are identical', () => {
    const o = PIECES.O.rots as readonly (readonly [number, number][])[];
    const s = (r: readonly (readonly [number, number])[]) => r.map(([x,y]) => `${x},${y}`).slice().sort().join('|');
    expect(s(o[0])).toBe(s(o[1]));
    expect(s(o[1])).toBe(s(o[2]));
    expect(s(o[2])).toBe(s(o[3]));
  });
});
