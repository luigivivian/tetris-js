import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

// Configurações do jogo
const BLOCK_SIZE = 30;
const GRID_WIDTH = 10;
const GRID_HEIGHT = 20;
const GAME_WIDTH = BLOCK_SIZE * GRID_WIDTH;
const GAME_HEIGHT = BLOCK_SIZE * GRID_HEIGHT;

// Cores das peças
const COLORS = [
  0x00FFFF, // Ciano - I
  0xFFFF00, // Amarelo - O
  0x800080, // Roxo - T
  0x00FF00, // Verde - S
  0xFF0000, // Vermelho - Z
  0x0000FF, // Azul - J
  0xFFA500, // Laranja - L
];

// Formas dos tetrominos
const SHAPES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
];

class TetrisScene extends Phaser.Scene {
  constructor() {
    super({ key: 'TetrisScene' });
  }

  init(data) {
    this.onScoreUpdate = data.onScoreUpdate;
    this.onGameOver = data.onGameOver;
  }

  create() {
    // Grid de blocos
    this.grid = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(0));
    this.blocks = Array(GRID_HEIGHT).fill(null).map(() => Array(GRID_WIDTH).fill(null));
    
    // Estado do jogo
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    
    // Peça atual
    this.currentPiece = null;
    this.currentX = 0;
    this.currentY = 0;
    this.currentShape = null;
    this.currentColor = null;
    this.currentBlocks = [];
    
    // Próxima peça
    this.nextPiece = this.getRandomPiece();
    
    // Configurações de queda
    this.fallSpeed = 1000;
    this.lastFallTime = 0;
    this.fastFall = false;
    
    // Desenha o grid
    this.drawGrid();
    
    // Spawn primeira peça
    this.spawnPiece();
    
    // Controles
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.on('keydown-SPACE', () => this.rotatePiece());
    this.input.keyboard.on('keydown-P', () => this.togglePause());
    this.input.keyboard.on('keydown-DOWN', () => { this.fastFall = true; });
    this.input.keyboard.on('keyup-DOWN', () => { this.fastFall = false; });
    
    // Texto de pontuação
    this.scoreText = this.add.text(GAME_WIDTH + 20, 50, 'Score: 0', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    
    this.linesText = this.add.text(GAME_WIDTH + 20, 90, 'Lines: 0', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    
    this.levelText = this.add.text(GAME_WIDTH + 20, 130, 'Level: 1', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    
    // Instruções
    this.add.text(GAME_WIDTH + 20, 200, 'Controls:', {
      fontSize: '18px',
      fill: '#ffff00'
    });
    this.add.text(GAME_WIDTH + 20, 230, '← → Move', {
      fontSize: '14px',
      fill: '#ffffff'
    });
    this.add.text(GAME_WIDTH + 20, 255, '↓ Fast Fall', {
      fontSize: '14px',
      fill: '#ffffff'
    });
    this.add.text(GAME_WIDTH + 20, 280, 'SPACE Rotate', {
      fontSize: '14px',
      fill: '#ffffff'
    });
    this.add.text(GAME_WIDTH + 20, 305, 'P Pause', {
      fontSize: '14px',
      fill: '#ffffff'
    });
  }

  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 1);
    
    for (let y = 0; y <= GRID_HEIGHT; y++) {
      graphics.lineBetween(0, y * BLOCK_SIZE, GAME_WIDTH, y * BLOCK_SIZE);
    }
    
    for (let x = 0; x <= GRID_WIDTH; x++) {
      graphics.lineBetween(x * BLOCK_SIZE, 0, x * BLOCK_SIZE, GAME_HEIGHT);
    }
  }

  getRandomPiece() {
    const index = Phaser.Math.Between(0, SHAPES.length - 1);
    return {
      shape: SHAPES[index],
      color: COLORS[index]
    };
  }

  spawnPiece() {
    const piece = this.nextPiece;
    this.currentShape = piece.shape.map(row => [...row]);
    this.currentColor = piece.color;
    this.currentX = Math.floor(GRID_WIDTH / 2) - Math.floor(this.currentShape[0].length / 2);
    this.currentY = 0;
    this.nextPiece = this.getRandomPiece();
    
    if (this.checkCollision(this.currentShape, this.currentX, this.currentY)) {
      this.endGame();
      return;
    }
    
    this.drawCurrentPiece();
  }

  drawCurrentPiece() {
    // Remove blocos anteriores
    this.currentBlocks.forEach(block => block.destroy());
    this.currentBlocks = [];
    
    // Desenha nova posição
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const block = this.add.rectangle(
            (this.currentX + x) * BLOCK_SIZE + BLOCK_SIZE / 2,
            (this.currentY + y) * BLOCK_SIZE + BLOCK_SIZE / 2,
            BLOCK_SIZE - 2,
            BLOCK_SIZE - 2,
            this.currentColor
          );
          this.currentBlocks.push(block);
        }
      });
    });
  }

  checkCollision(shape, x, y) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          
          if (newX < 0 || newX >= GRID_WIDTH || newY >= GRID_HEIGHT) {
            return true;
          }
          
          if (newY >= 0 && this.grid[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  lockPiece() {
    this.currentShape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const gridY = this.currentY + y;
          const gridX = this.currentX + x;
          
          if (gridY >= 0) {
            this.grid[gridY][gridX] = 1;
            this.blocks[gridY][gridX] = this.add.rectangle(
              gridX * BLOCK_SIZE + BLOCK_SIZE / 2,
              gridY * BLOCK_SIZE + BLOCK_SIZE / 2,
              BLOCK_SIZE - 2,
              BLOCK_SIZE - 2,
              this.currentColor
            );
          }
        }
      });
    });
    
    this.clearLines();
    this.spawnPiece();
  }

  clearLines() {
    let linesCleared = 0;
    
    for (let y = GRID_HEIGHT - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell === 1)) {
        linesCleared++;
        
        // Remove blocos visuais
        this.blocks[y].forEach(block => {
          if (block) block.destroy();
        });
        
        // Move linhas acima para baixo
        for (let row = y; row > 0; row--) {
          this.grid[row] = [...this.grid[row - 1]];
          this.blocks[row] = [...this.blocks[row - 1]];
          
          this.blocks[row].forEach((block, x) => {
            if (block) {
              block.y += BLOCK_SIZE;
            }
          });
        }
        
        this.grid[0] = Array(GRID_WIDTH).fill(0);
        this.blocks[0] = Array(GRID_WIDTH).fill(null);
        
        y++;
      }
    }
    
    if (linesCleared > 0) {
      this.lines += linesCleared;
      this.score += [0, 100, 300, 500, 800][linesCleared] * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.fallSpeed = Math.max(100, 1000 - (this.level - 1) * 100);
      
      this.updateUI();
    }
  }

  updateUI() {
    this.scoreText.setText('Score: ' + this.score);
    this.linesText.setText('Lines: ' + this.lines);
    this.levelText.setText('Level: ' + this.level);
    
    if (this.onScoreUpdate) {
      this.onScoreUpdate({ score: this.score, lines: this.lines, level: this.level });
    }
  }

  rotatePiece() {
    if (this.gameOver || this.isPaused) return;
    
    const rotated = this.currentShape[0].map((_, i) =>
      this.currentShape.map(row => row[i]).reverse()
    );
    
    if (!this.checkCollision(rotated, this.currentX, this.currentY)) {
      this.currentShape = rotated;
      this.drawCurrentPiece();
    }
  }

  togglePause() {
    if (this.gameOver) return;
    this.isPaused = !this.isPaused;
    
    if (this.isPaused) {
      this.pauseText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'PAUSED', {
        fontSize: '48px',
        fill: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 20, y: 10 }
      }).setOrigin(0.5);
    } else if (this.pauseText) {
      this.pauseText.destroy();
    }
  }

  endGame() {
    this.gameOver = true;
    
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'GAME OVER', {
      fontSize: '48px',
      fill: '#ff0000',
      backgroundColor: '#000000',
      padding: { x: 20, y: 10 }
    }).setOrigin(0.5);
    
    if (this.onGameOver) {
      this.onGameOver(this.score);
    }
  }

  update(time) {
    if (this.gameOver || this.isPaused) return;
    
    // Movimento horizontal
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) {
      if (!this.checkCollision(this.currentShape, this.currentX - 1, this.currentY)) {
        this.currentX--;
        this.drawCurrentPiece();
      }
    }
    
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) {
      if (!this.checkCollision(this.currentShape, this.currentX + 1, this.currentY)) {
        this.currentX++;
        this.drawCurrentPiece();
      }
    }
    
    // Queda automática
    const currentSpeed = this.fastFall ? 50 : this.fallSpeed;
    
    if (time - this.lastFallTime > currentSpeed) {
      if (!this.checkCollision(this.currentShape, this.currentX, this.currentY + 1)) {
        this.currentY++;
        this.drawCurrentPiece();
      } else {
        this.lockPiece();
      }
      this.lastFallTime = time;
    }
  }
}

const TetrisGame = () => {
  const gameRef = useRef(null);
  const [gameInstance, setGameInstance] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: GAME_WIDTH + 200,
      height: GAME_HEIGHT,
      parent: gameRef.current,
      backgroundColor: '#000000',
      scene: TetrisScene,
    };

    const game = new Phaser.Game(config);
    
    game.scene.start('TetrisScene', {
      onScoreUpdate: (data) => {
        setScore(data.score);
        setLines(data.lines);
        setLevel(data.level);
      },
      onGameOver: (finalScore) => {
        if (finalScore > highScore) {
          setHighScore(finalScore);
        }
      }
    });

    setGameInstance(game);

    return () => {
      game.destroy(true);
    };
  }, []);

  const restartGame = () => {
    if (gameInstance) {
      gameInstance.scene.stop('TetrisScene');
      gameInstance.scene.start('TetrisScene', {
        onScoreUpdate: (data) => {
          setScore(data.score);
          setLines(data.lines);
          setLevel(data.level);
        },
        onGameOver: (finalScore) => {
          if (finalScore > highScore) {
            setHighScore(finalScore);
          }
        }
      });
    }
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      padding: '20px',
      backgroundColor: '#1a1a1a',
      minHeight: '100vh',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ color: '#fff', marginBottom: '20px' }}>
        🎮 Tetris - React + Phaser
      </h1>
      
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px',
        color: '#fff',
        fontSize: '18px'
      }}>
        <div>High Score: <span style={{ color: '#ffd700' }}>{highScore}</span></div>
      </div>
      
      <div ref={gameRef} style={{ 
        border: '3px solid #333',
        borderRadius: '8px',
        overflow: 'hidden'
      }} />
      
      <button
        onClick={restartGame}
        style={{
          marginTop: '20px',
          padding: '12px 30px',
          fontSize: '18px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#4CAF50'}
      >
        🔄 Restart Game
      </button>
      
      <div style={{ 
        marginTop: '30px', 
        color: '#aaa',
        textAlign: 'center',
        maxWidth: '500px'
      }}>
        <p><strong style={{ color: '#fff' }}>Como Jogar:</strong></p>
        <p>Use as setas ← → para mover, ↓ para cair rápido</p>
        <p>ESPAÇO para rotacionar, P para pausar</p>
      </div>
    </div>
  );
};

export default TetrisGame;