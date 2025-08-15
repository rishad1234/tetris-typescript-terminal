import { describe, it, expect } from 'vitest';
import { Board } from '../src/game/board';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../src/core/constants';

describe('Board', () => {
  it('initializes empty', () => {
    const b = new Board();
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      for (let x = 0; x < BOARD_WIDTH; x++) {
        expect(b.get(x, y)).toBeNull();
      }
    }
  });

  it('sets and gets cells', () => {
    const b = new Board();
    b.set(0, 0, 1);
    b.set(1, 0, 2);
    expect(b.get(0, 0)).toBe(1);
    expect(b.get(1, 0)).toBe(2);
  });

  it('clears full lines', () => {
    const b = new Board();
    // Fill bottom row
    for (let x = 0; x < b.width; x++) b.set(x, b.height - 1, 4);
    const cleared = b.clearLines();
    expect(cleared).toBe(1);
    // New top row should be empty, bottom should be empty after clear
    for (let x = 0; x < b.width; x++) {
      expect(b.get(x, 0)).toBeNull();
      expect(b.get(x, b.height - 1)).toBeNull();
    }
  });

  it('clears multiple lines at once', () => {
    const b = new Board();
    for (let x = 0; x < b.width; x++) {
      b.set(x, b.height - 1, 3);
      b.set(x, b.height - 2, 3);
    }
    const cleared = b.clearLines();
    expect(cleared).toBe(2);
    // bottom two rows are cleared
    for (let x = 0; x < b.width; x++) {
      expect(b.get(x, b.height - 1)).toBeNull();
      expect(b.get(x, b.height - 2)).toBeNull();
    }
  });

  it('detects blocks in hidden rows', () => {
    const b = new Board();
    expect(b.hasBlocksInHidden()).toBe(false);
    b.set(0, 0, 2); // top-most hidden row cell
    expect(b.hasBlocksInHidden()).toBe(true);
    // clearing that cell returns false again
    b.set(0, 0, null);
    expect(b.hasBlocksInHidden()).toBe(false);
  });
});
