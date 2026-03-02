# React Tetris Game

A fully functional, feature-complete Tetris game built with React and TypeScript.

## Features

- **Classic 10x20 Grid**: Standard Tetris board dimensions
- **7 Unique Tetromino Types**: I, O, T, S, Z, J, L pieces with distinct colors
- **Next Piece Preview**: See which piece is coming next
- **Score Tracking**: Complete scoring system with bonuses
- **Level System**: Speed increases as you clear more lines
- **Line Counter**: Track total lines cleared
- **Ghost Piece**: See where your piece will land
- **Wall Kicks**: Smooth rotation near walls
- **Pause Functionality**: Pause/resume game with P or ESC
- **Game Over Detection**: Proper game over handling with restart option

## Controls

| Key | Action |
|-----|--------|
| ← Arrow / A | Move left |
| → Arrow / D | Move right |
| ↓ Arrow / S | Soft drop (1 point per cell) |
| ↑ Arrow / W | Rotate piece |
| Spacebar | Hard drop (2x points per cell dropped) |
| P / Escape | Pause/Resume |

## Scoring

| Lines Cleared | Points (× Level) |
|--------------|-----------------|
| 1 line | 40 × Level |
| 2 lines | 100 × Level |
| 3 lines | 300 × Level |
| 4 lines (Tetris) | 1200 × Level |

Additional points:
- Soft drop: 1 point per cell
- Hard drop: 2 points per cell

## Speed Progression

| Level | Drop Speed |
|-------|-----------|
| 1 | 1000ms |
| 2 | 920ms |
| 3 | 840ms |
| ... | Decreases by 80ms per level |
| 12+ | 100ms (min speed) |

## Installation & Running

```bash
# Navigate to the tetris-game directory
cd tetris-game

# Install dependencies
npm install

# Start development server
npm run dev

# Or build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
tetris-game/
├── index.html              # Entry HTML file
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite build configuration
└── src/
    ├── main.tsx            # React entry point
    └── TetrisGame.tsx      # Main game component (all logic)
```

## Technical Details

### Single File Architecture
The entire game logic is contained in `TetrisGame.tsx`, including:
- Game state management with React hooks
- Board collision detection
- Piece rotation with wall kicks
- Line clearing and scoring
- Level progression
- Input handling
- Render logic

### State Management
Uses React `useState` and `useCallback` for:
- Board state (10×20 grid)
- Current piece position and rotation
- Next piece queue
- Score/level/lines
- Game over and pause states

### Performance
- Efficient re-renders with React.memo patterns
- Controlled update loops with `useEffect` and `setInterval`
- Keyboard event optimization with `useCallback`

## Game Logic

### Rotation System
Uses Super Rotation System (SRS)-like behavior:
- Four rotation states (0°, 90°, 180°, 270°)
- Wall kicks when rotation near edges
- Smooth transitions between states

### Collision Detection
- Pre-move validation before updating state
- Boundary checking for all pieces
- Locked piece collision detection

### Line Clearing
- Checks complete rows after each lock
- Cascading line clear animation
- Shift rows down and add empty rows at top

## Future Enhancements

Potential features to add:
- [ ] Hold piece functionality
- [ ] Combo multipliers
- [ ] Back-to-back bonuses
- [ ] Time attack mode
- [ ] Marathon mode
- [ ] Multiplayer support
- [ ] Sound effects
- [ ] Better animations
- [ ] Mobile touch controls
- [ ] High score persistence

## License

MIT
