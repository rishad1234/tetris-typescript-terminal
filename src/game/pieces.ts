import { ColorCode, COLORS } from '../core/constants';

export type Shape = Array<[number, number]>; // offsets from (0,0)
export type Rotation = Readonly<Shape>;
export type Rotations = ReadonlyArray<Rotation>; // 4 rotations

export type PieceKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface PieceDef {
  kind: PieceKind;
  color: ColorCode;
  rots: Rotations;
  spawnOffset?: { x: number; y: number }; // adjust spawn position if needed
}

// Precomputed rotations using 4-orientation (0,1,2,3)
export const PIECES: Record<PieceKind, PieceDef> = {
  I: {
    kind: 'I',
    color: COLORS.I!,
    rots: [
      [ [0,1],[1,1],[2,1],[3,1] ], // ---- horizontal
      [ [2,0],[2,1],[2,2],[2,3] ], // vertical
      [ [0,2],[1,2],[2,2],[3,2] ],
      [ [1,0],[1,1],[1,2],[1,3] ],
    ],
    spawnOffset: { x: 3, y: -1 },
  },
  O: {
    kind: 'O',
    color: COLORS.O!,
    rots: [
      [ [1,0],[2,0],[1,1],[2,1] ],
      [ [1,0],[2,0],[1,1],[2,1] ],
      [ [1,0],[2,0],[1,1],[2,1] ],
      [ [1,0],[2,0],[1,1],[2,1] ],
    ],
    spawnOffset: { x: 3, y: 0 },
  },
  T: {
    kind: 'T',
    color: COLORS.T!,
    rots: [
      [ [1,0],[0,1],[1,1],[2,1] ],
      [ [1,0],[1,1],[1,2],[2,1] ],
      [ [0,1],[1,1],[2,1],[1,2] ],
      [ [1,0],[0,1],[1,1],[1,2] ],
    ],
    spawnOffset: { x: 3, y: 0 },
  },
  S: {
    kind: 'S',
    color: COLORS.S!,
    rots: [
      [ [1,0],[2,0],[0,1],[1,1] ],
      [ [1,0],[1,1],[2,1],[2,2] ],
      [ [1,1],[2,1],[0,2],[1,2] ],
      [ [0,0],[0,1],[1,1],[1,2] ],
    ],
    spawnOffset: { x: 3, y: 0 },
  },
  Z: {
    kind: 'Z',
    color: COLORS.Z!,
    rots: [
      [ [0,0],[1,0],[1,1],[2,1] ],
      [ [2,0],[1,1],[2,1],[1,2] ],
      [ [0,1],[1,1],[1,2],[2,2] ],
      [ [1,0],[0,1],[1,1],[0,2] ],
    ],
    spawnOffset: { x: 3, y: 0 },
  },
  J: {
    kind: 'J',
    color: COLORS.J!,
    rots: [
      [ [0,0],[0,1],[1,1],[2,1] ],
      [ [1,0],[2,0],[1,1],[1,2] ],
      [ [0,1],[1,1],[2,1],[2,2] ],
      [ [1,0],[1,1],[0,2],[1,2] ],
    ],
    spawnOffset: { x: 3, y: 0 },
  },
  L: {
    kind: 'L',
    color: COLORS.L!,
    rots: [
      [ [2,0],[0,1],[1,1],[2,1] ],
      [ [1,0],[1,1],[1,2],[2,2] ],
      [ [0,1],[1,1],[2,1],[0,2] ],
      [ [0,0],[1,0],[1,1],[1,2] ],
    ],
    spawnOffset: { x: 3, y: 0 },
  },
};

export function getRotation(def: PieceDef, rot: number): Rotation {
  return def.rots[rot & 3];
}
