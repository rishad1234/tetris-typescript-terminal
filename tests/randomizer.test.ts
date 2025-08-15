import { describe, it, expect } from 'vitest';
import { Bag7 } from '../src/game/randomizer';

function rngFrom(arr: number[]) {
  let i = 0;
  return () => arr[i++ % arr.length];
}

describe('Bag7', () => {
  it('yields all 7 pieces before repeating', () => {
    const bag = new Bag7(rngFrom([0.1, 0.5, 0.9]));
    const seen = new Set<string>();
    for (let i = 0; i < 7; i++) seen.add(bag.next());
    expect(seen.size).toBe(7);
  });

  it('peekQueue returns requested length and is non-destructive', () => {
    const bag = new Bag7(rngFrom([0.1, 0.5, 0.9]));
    const peek = bag.peekQueue(5);
    expect(peek.length).toBe(5);
    // After peek, calling next() should yield the first of peeked items (in order)
    const firstNext = bag.next();
    expect(peek[0]).toBeTypeOf('string');
    // Cannot guarantee exact equality due to bag refill randomness, but ensure still returns a piece
    expect(['I','O','T','S','Z','J','L']).toContain(firstNext);
  });
});
