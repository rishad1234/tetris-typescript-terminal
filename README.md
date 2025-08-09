# Tetris (Terminal, TypeScript)

A Tetris game that runs in your terminal, written in TypeScript.

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

## Project structure

- `src/`
  - `core/` — types, constants
  - `engine/` — renderer, input, loop
  - `game/` — Game, Board, Piece, Randomizer
  - `ui/` — HUD, score, next/hold
  - `index.ts` — entry point
