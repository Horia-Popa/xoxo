# Tech Stack

## Core

- **Language:** TypeScript (strict mode)
- **UI Framework:** React 18+
- **3D Rendering:** Three.js via React Three Fiber (R3F)
- **3D Helpers:** @react-three/drei (OrbitControls, Text, etc.)
- **Build Tool:** Vite
- **Test Framework:** Vitest

## Conventions

- Use functional components only — no class components
- Use named exports, not default exports
- File naming: PascalCase for components (`Board.tsx`), camelCase for utilities (`gameLogic.ts`)
- Keep game logic as pure functions with no React/Three.js dependencies
- R3F components go in `src/components/` — each component = one file
- Prefer `useReducer` or simple `useState` for game state — no external state library unless complexity demands it
- CSS: plain CSS modules for any 2D UI overlays (HUD, status text). 3D visuals use R3F materials, not CSS.

## Code Style

- Use `const` by default, `let` only when reassignment is needed
- Prefer early returns over nested conditionals
- Type everything explicitly — avoid `any`
- Keep components small and focused (< 100 lines ideally)

## Common Commands

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npx vitest --run

# Build for production
npm run build

# Preview production build
npm run preview
```
