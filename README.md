# Tetris (Terminal, TypeScript)

A Tetris game for your terminal, written in TypeScript. Renders with ANSI escapes, runs at ~30 FPS, and includes a minimal HUD.

## Features

- Double-buffered terminal renderer with diffing and proper bottom-row handling
- Bordered, centered playfield (10x20 visible, 4 hidden rows)
- 7-bag randomizer for fair piece distribution
- Movement, rotation (Z/X), soft drop, hard drop
- Line clear, scoring, levels (level increases every 10 lines)
- Game over detection, restart (r), pause banner (p)
- Minimal HUD: score, lines, level, next piece preview

## Controls

- Left/Right arrows: move
- Down arrow: soft drop (one step)
- Up arrow: hard drop
- Z / X: rotate counter/clockwise
- P: pause/resume
- Q or Ctrl+C: quit
- R: restart (after game over)

## Scoring and levels

- Line clears: 1→100, 2→300, 3→500, 4→800 points, multiplied by current level
- Level increases by 1 every 10 lines cleared
- Note: soft/hard drop bonus and T-spins are not implemented yet

## Prerequisites

- Node.js 18+

## Setup

```bash
npm install
```

## Development

Run the live TypeScript entry:

```bash
npm run dev
```

Press `q` to quit.

## Build

```bash
npm run build
```

## Run built app

```bash
npm start
```

## Tests

Unit tests use Vitest:

```bash
npm test
```

## Terminal notes

- Uses alt-screen mode and disables line wrapping while running
- Playfield is centered, HUD renders to the right; resize the terminal if the HUD overlaps
- Tested in VS Code integrated terminal, macOS Terminal, and iTerm2

## Project structure

- `src/`
  - `core/` — constants, colors
  - `engine/` — ANSI helpers, renderer, input
  - `game/` — board, pieces, active piece, randomizer
  - `index.ts` — entry point (loop, HUD)
- `tests/` — unit tests (Vitest)
