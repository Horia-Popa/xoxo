# Project Structure

```
├── src/
│   ├── components/       # React + R3F components
│   │   ├── Board.tsx     # 3D board (grid lines, surface)
│   │   ├── Cell.tsx      # Individual clickable cell with piece rendering
│   │   ├── Piece.tsx     # X or O 3D mesh with drop animation
│   │   ├── WinLine.tsx   # Animated line through winning cells
│   │   ├── Scene.tsx     # Main 3D scene (lighting, camera, controls)
│   │   └── HUD.tsx       # 2D overlay (turn indicator, winner, reset button)
│   ├── game/             # Pure game logic (no React/Three.js imports)
│   │   ├── gameLogic.ts  # Board state, move validation, win/draw detection
│   │   └── types.ts      # Shared types (Player, BoardState, GameStatus, etc.)
│   ├── App.tsx           # Root component — composes Scene + HUD
│   └── main.tsx          # Vite entry point — renders App into DOM
├── public/               # Static assets (favicon, etc.)
├── index.html            # HTML shell
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Architecture Rules

- `src/game/` must have zero imports from React, Three.js, or R3F. It is pure TypeScript logic only.
- `src/components/` contains all visual/interactive code. Components may import from `src/game/`.
- One component per file. File name matches the exported component name.
- `App.tsx` is the composition root — it wires game state to the 3D scene and HUD.
- No business logic in components — delegate to functions in `src/game/`.

## Code Size Rules

- No single file should exceed 300 lines of code.
- If a file approaches the limit, split it into smaller, focused modules.
- Follow best practices for code organization: single responsibility, clear separation of concerns, and meaningful module boundaries.
