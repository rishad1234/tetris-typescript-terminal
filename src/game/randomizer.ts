import { PieceKind } from './pieces';

export class Bag7 {
  private bag: PieceKind[] = [];

  constructor(private rng: () => number = Math.random) {}

  next(): PieceKind {
    if (this.bag.length === 0) this.refill();
    return this.bag.pop()!;
  }

  peekQueue(n: number): PieceKind[] {
    while (this.bag.length < n) this.refill();
    return this.bag.slice(-n).reverse();
  }

  private refill() {
    const kinds: PieceKind[] = ['I','O','T','S','Z','J','L'];
    // Fisher-Yates
    for (let i = kinds.length - 1; i > 0; i--) {
      const j = Math.floor(this.rng() * (i + 1));
      [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
    }
    // push to bag stack
    for (const k of kinds) this.bag.push(k);
  }
}
