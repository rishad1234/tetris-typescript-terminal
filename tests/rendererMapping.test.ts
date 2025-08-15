import { describe, it, expect } from 'vitest';
import { createPlayfieldBuffer, blitBoardToBuffer } from '../src/engine/renderer';
import { Board } from '../src/game/board';
import { HIDDEN_ROWS } from '../src/core/constants';

describe('Renderer mapping', () => {
  it('maps board rows skipping hidden rows', () => {
    const b = new Board();
    // Set a visible cell at (x=0, y=HIDDEN_ROWS)
    b.set(0, HIDDEN_ROWS, 2);
    const fb = createPlayfieldBuffer();
    blitBoardToBuffer(fb, b);
    expect(fb.cells[0][0].bg).toBe(2);
  });
});
