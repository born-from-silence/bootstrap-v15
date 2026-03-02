import React, { useState, useEffect, useCallback, useRef } from 'react';

// Tetris Game Component - Single File Implementation
// Features: 10x20 grid, 7 tetromino types, next piece preview, score/level/lines, pause, game over

// Types
interface Position {
  x: number;
  y: number;
}

interface Tetromino {
  shape: number[][];
  color: string;
  borderColor: string;
}

interface GameState {
  board: number[][];
  currentPiece: {
    tetromino: Tetromino;
    position: Position;
    rotation: number;
  } | null;
  nextPiece: Tetromino;
  score: number;
  level: number;
  lines: number;
  gameOver: boolean;
  paused: boolean;
}

// Tetromino definitions with colors
const TETROMINOES: { [key: string]: Tetromino } = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00f5ff',
    borderColor: '#00a8b5',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#ffeb3b',
    borderColor: '#c4b000',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#9c27b0',
    borderColor: '#6a1b9a',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#4caf50',
    borderColor: '#388e3c',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#f44336',
    borderColor: '#d32f2f',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#2196f3',
    borderColor: '#1976d2',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#ff9800',
    borderColor: '#f57c00',
  },
};

const TETROMINO_KEYS = Object.keys(TETROMINOES);
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const INITIAL_SPEED = 1000;

// Utility functions
const rotatePiece = (piece: number[][]): number[][] => {
  const rows = piece.length;
  const cols = piece[0].length;
  const rotated: number[][] = Array(cols).fill(null).map(() => Array(rows).fill(0));
  
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      rotated[col][rows - 1 - row] = piece[row][col];
    }
  }
  return rotated;
};

const getRotatedShape = (tetromino: Tetromino, rotation: number): number[][] => {
  let shape = tetromino.shape;
  for (let i = 0; i < rotation % 4; i++) {
    shape = rotatePiece(shape);
  }
  return shape;
};

const getRandomPiece = (): Tetromino => {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  return {
    shape: TETROMINOES[key].shape.map(row => [...row]),
    color: TETROMINOES[key].color,
    borderColor: TETROMINOES[key].borderColor,
  };
};

const getDropSpeed = (level: number): number => {
  return Math.max(100, INITIAL_SPEED - (level - 1) * 80);
};

const calculateScore = (lines: number, level: number): number => {
  const points = [0, 40, 100, 300, 1200];
  return (points[lines] || 0) * level;
};

const TetrisGame: React.FC = () => {
  // Game state
  const [board, setBoard] = useState<number[][]>(() =>
    Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0))
  );
  const [currentPiece, setCurrentPiece] = useState<GameState['currentPiece']>(null);
  const [nextPiece, setNextPiece] = useState<Tetromino>(() => getRandomPiece());
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [ghostPosition, setGhostPosition] = useState<Position | null>(null);
  
  const dropIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropSpeedRef = useRef<number>(INITIAL_SPEED);

  // Check collision
  const isValidMove = useCallback((piece: Tetromino, position: Position, rotation: number): boolean => {
    const shape = getRotatedShape(piece, rotation);
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const newX = position.x + col;
          const newY = position.y + row;
          
          // Check boundaries
          if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
            return false;
          }
          
          // Check collision with locked pieces (ignore if above board)
          if (newY >= 0 && board[newY][newX] !== 0) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Calculate ghost piece position
  const calculateGhostPosition = useCallback((piece: Tetromino, position: Position, rotation: number): Position => {
    let ghostY = position.y;
    const shape = getRotatedShape(piece, rotation);
    
    // Find the lowest valid position
    while (ghostY < BOARD_HEIGHT) {
      const testY = ghostY + 1;
      let valid = true;
      
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col] !== 0) {
            const newX = position.x + col;
            const newY = testY + row;
            
            if (newY >= BOARD_HEIGHT || (newY >= 0 && board[newY][newX] !== 0)) {
              valid = false;
              break;
            }
          }
        }
        if (!valid) break;
      }
      
      if (!valid) break;
      ghostY = testY;
    }
    
    return { x: position.x, y: ghostY };
  }, [board]);

  // Update ghost position
  useEffect(() => {
    if (currentPiece) {
      const ghost = calculateGhostPosition(currentPiece.tetromino, currentPiece.position, currentPiece.rotation);
      setGhostPosition(ghost);
    } else {
      setGhostPosition(null);
    }
  }, [currentPiece, calculateGhostPosition]);

  // Spawn new piece
  const spawnPiece = useCallback(() => {
    const newPiece = {
      tetromino: nextPiece,
      position: { x: Math.floor(BOARD_WIDTH / 2) - Math.floor(nextPiece.shape[0].length / 2), y: 0 },
      rotation: 0,
    };
    
    if (!isValidMove(newPiece.tetromino, newPiece.position, newPiece.rotation)) {
      setGameOver(true);
      return;
    }
    
    setCurrentPiece(newPiece);
    setNextPiece(getRandomPiece());
  }, [nextPiece, isValidMove]);

  // Lock piece to board
  const lockPiece = useCallback(() => {
    if (!currentPiece) return;
    
    const shape = getRotatedShape(currentPiece.tetromino, currentPiece.rotation);
    const newBoard = board.map((row: number[]) => [...row]);
    
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col] !== 0) {
          const y = currentPiece.position.y + row;
          const x = currentPiece.position.x + col;
          if (y >= 0) {
            newBoard[y][x] = TETROMINO_KEYS.findIndex(
              key => TETROMINOES[key].color === currentPiece.tetromino.color
            ) + 1;
          }
        }
      }
    }
    
    setBoard(newBoard);
    setCurrentPiece(null);
  }, [currentPiece, board]);

  // Clear completed lines
  const clearLines = useCallback(() => {
    const newBoard: number[][] = [];
    let linesCleared = 0;
    
    for (let row = 0; row < BOARD_HEIGHT; row++) {
      if (board[row].every(cell => cell !== 0)) {
        linesCleared++;
      } else {
        newBoard.push([...board[row]]);
      }
    }
    
    // Add empty rows at top
    while (newBoard.length < BOARD_HEIGHT) {
      newBoard.unshift(Array(BOARD_WIDTH).fill(0));
    }
    
    if (linesCleared > 0) {
      setLines(prev => prev + linesCleared);
      setScore(prev => prev + calculateScore(linesCleared, level));
      setLevel(Math.floor((lines + linesCleared) / 10) + 1);
      setBoard(newBoard);
    }
  }, [board, level, lines]);

  // Move piece
  const movePiece = useCallback((direction: 'left' | 'right' | 'down'): boolean => {
    if (!currentPiece || gameOver || paused) return false;
    
    const newPosition = { ...currentPiece.position };
    
    switch (direction) {
      case 'left':
        newPosition.x -= 1;
        break;
      case 'right':
        newPosition.x += 1;
        break;
      case 'down':
        newPosition.y += 1;
        break;
    }
    
    if (isValidMove(currentPiece.tetromino, newPosition, currentPiece.rotation)) {
      setCurrentPiece(prev => prev ? { ...prev, position: newPosition } : null);
      return true;
    }
    
    // If can't move down, lock piece
    if (direction === 'down') {
      lockPiece();
      return false;
    }
    
    return false;
  }, [currentPiece, gameOver, paused, isValidMove, lockPiece]);

  // Rotate piece
  const rotatePieceFn = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;
    
    const newRotation = (currentPiece.rotation + 1) % 4;
    
    // Try normal rotation
    if (isValidMove(currentPiece.tetromino, currentPiece.position, newRotation)) {
      setCurrentPiece(prev => prev ? { ...prev, rotation: newRotation } : null);
      return;
    }
    
    // Wall kick - try moving left or right
    const kicks = [-1, 1, -2, 2];
    for (const kick of kicks) {
      const newPosition = { ...currentPiece.position, x: currentPiece.position.x + kick };
      if (isValidMove(currentPiece.tetromino, newPosition, newRotation)) {
        setCurrentPiece(prev => prev ? { ...prev, rotation: newRotation, position: newPosition } : null);
        return;
      }
    }
  }, [currentPiece, gameOver, paused, isValidMove]);

  // Hard drop
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || paused) return;
    
    const ghost = calculateGhostPosition(currentPiece.tetromino, currentPiece.position, currentPiece.rotation);
    setCurrentPiece(prev => prev ? { ...prev, position: ghost } : null);
    
    // Score bonus for hard drop (distance dropped)
    const distance = ghost.y - currentPiece.position.y;
    setScore(prev => prev + distance * 2);
    
    setTimeout(lockPiece, 50);
  }, [currentPiece, gameOver, paused, lockPiece, calculateGhostPosition]);

  // Handle game loop
  useEffect(() => {
    if (gameOver || paused) {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
        dropIntervalRef.current = null;
      }
      return;
    }

    dropSpeedRef.current = getDropSpeed(level);
    
    dropIntervalRef.current = setInterval(() => {
      movePiece('down');
    }, dropSpeedRef.current);
    
    return () => {
      if (dropIntervalRef.current) {
        clearInterval(dropIntervalRef.current);
      }
    };
  }, [gameOver, paused, level, movePiece]);

  // Spawn piece when current is null
  useEffect(() => {
    if (!currentPiece && !gameOver) {
      spawnPiece();
    }
  }, [currentPiece, gameOver, spawnPiece]);

  // Clear lines after locking
  useEffect(() => {
    if (!currentPiece) {
      clearLines();
    }
  }, [currentPiece, clearLines]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          movePiece('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          movePiece('right');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          movePiece('down');
          setScore(prev => prev + 1); // Soft drop bonus
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          rotatePieceFn();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          if (!gameOver) {
            setPaused(prev => !prev);
          }
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [movePiece, rotatePieceFn, hardDrop, gameOver]);

  // Reset game
  const resetGame = useCallback(() => {
    setBoard(Array(BOARD_HEIGHT).fill(null).map(() => Array(BOARD_WIDTH).fill(0)));
    setCurrentPiece(null);
    setNextPiece(getRandomPiece());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameOver(false);
    setPaused(false);
  }, []);

  // Get cell color
  const getCellColor = (value: number): string => {
    if (value === 0) return 'transparent';
    const key = TETROMINO_KEYS[value - 1];
    return TETROMINOES[key]?.color || '#fff';
  };

  const getCellBorderColor = (value: number): string => {
    if (value === 0) return 'transparent';
    const key = TETROMINO_KEYS[value - 1];
    return TETROMINOES[key]?.borderColor || '#fff';
  };

  // Render board with current piece
  const renderBoard = (): (number | { type: 'current' | 'ghost'; color: string; borderColor: string })[][] => {
    const displayBoard = board.map(row => 
      row.map(cell => cell as any)
    );
    
    // Add ghost piece
    if (ghostPosition && currentPiece && !gameOver) {
      const shape = getRotatedShape(currentPiece.tetromino, currentPiece.rotation);
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col] !== 0) {
            const y = ghostPosition.y + row;
            const x = ghostPosition.x + col;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH && displayBoard[y][x] === 0) {
              displayBoard[y][x] = {
                type: 'ghost',
                color: currentPiece.tetromino.color + '40',
                borderColor: currentPiece.tetromino.borderColor + '60',
              };
            }
          }
        }
      }
    }
    
    // Add current piece
    if (currentPiece && !gameOver) {
      const shape = getRotatedShape(currentPiece.tetromino, currentPiece.rotation);
      for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
          if (shape[row][col] !== 0) {
            const y = currentPiece.position.y + row;
            const x = currentPiece.position.x + col;
            if (y >= 0 && y < BOARD_HEIGHT && x >= 0 && x < BOARD_WIDTH) {
              displayBoard[y][x] = {
                type: 'current',
                color: currentPiece.tetromino.color,
                borderColor: currentPiece.tetromino.borderColor,
              };
            }
          }
        }
      }
    }
    
    return displayBoard;
  };

  const displayBoard = renderBoard();

  // Styles
  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      display: 'flex',
      gap: '30px',
      justifyContent: 'center',
      alignItems: 'flex-start',
      flexWrap: 'wrap',
    },
    gameArea: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    },
    board: {
      display: 'grid',
      gridTemplateColumns: `repeat(${BOARD_WIDTH}, 30px)`,
      gridTemplateRows: `repeat(${BOARD_HEIGHT}, 30px)`,
      gap: '1px',
      background: '#000',
      border: '3px solid #333',
      borderRadius: '4px',
      boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    },
    cell: {
      width: '30px',
      height: '30px',
      borderRadius: '2px',
      boxSizing: 'border-box',
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      minWidth: '200px',
    },
    panel: {
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '8px',
      padding: '15px',
      backdropFilter: 'blur(10px)',
    },
    panelTitle: {
      fontSize: '14px',
      textTransform: 'uppercase',
      letterSpacing: '1px',
      marginBottom: '10px',
      opacity: 0.7,
    },
    panelValue: {
      fontSize: '24px',
      fontWeight: 'bold',
      fontFamily: 'monospace',
    },
    nextPieceBoard: {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 30px)',
      gridTemplateRows: 'repeat(4, 30px)',
      gap: '2px',
      background: '#000',
      borderRadius: '4px',
      padding: '10px',
    },
    nextPieceCell: {
      width: '30px',
      height: '30px',
      borderRadius: '2px',
    },
    controls: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
    },
    button: {
      padding: '12px 24px',
      fontSize: '16px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      border: 'none',
      borderRadius: '8px',
      cursor: 'pointer',
      transition: 'transform 0.1s, box-shadow 0.1s',
      fontWeight: 'bold',
    },
    buttonHover: {
      transform: 'scale(1.05)',
      boxShadow: '0 5px 20px rgba(102, 126, 234, 0.4)',
    },
    pausedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
    },
    pausedText: {
      fontSize: '36px',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '4px',
    },
    gameOverOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '4px',
      gap: '20px',
    },
    gameOverText: {
      fontSize: '42px',
      fontWeight: 'bold',
      color: '#f44336',
      textTransform: 'uppercase',
      letterSpacing: '4px',
    },
    finalScore: {
      fontSize: '24px',
      color: '#fff',
    },
    controlsInfo: {
      fontSize: '14px',
      lineHeight: '1.8',
      opacity: 0.8,
    },
    header: {
      textAlign: 'center',
      marginBottom: '20px',
    },
    title: {
      fontSize: '48px',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      textTransform: 'uppercase',
      letterSpacing: '4px',
    },
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={styles.header}>
        <h1 style={styles.title}>Tetris</h1>
      </div>
      
      <div style={styles.container}>
        <div style={styles.gameArea}>
          <div style={{ position: 'relative' }}>
            <div style={styles.board}>
              {displayBoard.map((row, y) =>
                row.map((cell, x) => {
                  const isObject = typeof cell === 'object' && cell !== null;
                  return (
                    <div
                      key={`${y}-${x}`}
                      style={{
                        ...styles.cell,
                        background: isObject ? cell.color : getCellColor(cell as number),
                        border: `2px solid ${isObject ? cell.borderColor : getCellBorderColor(cell as number)}`,
                        boxShadow: isObject && cell.type === 'current'
                          ? `inset 0 2px 4px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`
                          : 'none',
                      }}
                    />
                  );
                })
              )}
            </div>
            
            {paused && !gameOver && (
              <div style={styles.pausedOverlay}>
                <div style={styles.pausedText}>Paused</div>
              </div>
            )}
            
            {gameOver && (
              <div style={styles.gameOverOverlay}>
                <div style={styles.gameOverText}>Game Over</div>
                <div style={styles.finalScore}>Final Score: {score.toLocaleString()}</div>
                <button
                  style={styles.button}
                  onClick={resetGame}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 5px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div style={styles.sidebar}>
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Next Piece</div>
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '150px',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${Math.max(nextPiece.shape[0].length, 4)}, 25px)`,
                gridTemplateRows: `repeat(${Math.max(nextPiece.shape.length, 4)}, 25px)`,
                gap: '2px',
              }}>
                {Array(Math.max(nextPiece.shape.length, 4)).fill(null).map((_, row) =>
                  Array(Math.max(nextPiece.shape[0].length, 4)).fill(null).map((_, col) => {
                    const pieceRow = row;
                    const pieceCol = col;
                    const hasBlock = 
                      pieceRow < nextPiece.shape.length && 
                      pieceCol < nextPiece.shape[0].length &&
                      nextPiece.shape[pieceRow][pieceCol] !== 0;
                    
                    return (
                      <div
                        key={`${row}-${col}`}
                        style={{
                          width: '25px',
                          height: '25px',
                          background: hasBlock ? nextPiece.color : 'transparent',
                          borderRadius: '2px',
                          border: hasBlock ? `2px solid ${nextPiece.borderColor}` : '2px solid transparent',
                        }}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
          
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Score</div>
            <div style={styles.panelValue}>{score.toLocaleString()}</div>
          </div>
          
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Level</div>
            <div style={styles.panelValue}>{level}</div>
          </div>
          
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Lines</div>
            <div style={styles.panelValue}>{lines}</div>
          </div>
          
          <div style={styles.panel}>
            <div style={styles.panelTitle}>Speed</div>
            <div style={styles.panelValue}>{getDropSpeed(level)}ms</div>
          </div>
          
          <div style={styles.controls}>
            <button
              style={styles.button}
              onClick={() => setPaused(!paused)}
              disabled={gameOver}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
            
            <button
              style={styles.button}
              onClick={resetGame}
            >
              New Game
            </button>
          </div>
          
          <div style={{ ...styles.panel, fontSize: '13px' }}>
            <div style={styles.panelTitle}>Controls</div>
            <div style={styles.controlsInfo}>
              <div>← → : Move</div>
              <div>↑ : Rotate</div>
              <div>↓ : Soft Drop</div>
              <div>Space : Hard Drop</div>
              <div>P/ESC : Pause</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TetrisGame;
