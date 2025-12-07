import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';

// Configurações do jogo
const BLOCK_SIZE = 45;
const GRID_SIZE = 8;
const GAME_WIDTH = BLOCK_SIZE * GRID_SIZE;
const GAME_HEIGHT = BLOCK_SIZE * GRID_SIZE;
const CANVAS_WIDTH = GAME_WIDTH + 300;
const CANVAS_HEIGHT = GAME_HEIGHT + 280;
const GRID_OFFSET_X = 30;
const GRID_OFFSET_Y = 30;

// Cores dos cristais preciosos
const CRYSTAL_COLORS = [
  { main: 0x50C878, shine: 0x90EE90, name: 'Esmeralda' },     // Esmeralda
  { main: 0xB9F2FF, shine: 0xFFFFFF, name: 'Diamante' },      // Diamante
  { main: 0xFFD700, shine: 0xFFFACD, name: 'Ouro' },          // Ouro
  { main: 0x0F52BA, shine: 0x6495ED, name: 'Safira' },        // Safira
  { main: 0xE0115F, shine: 0xFF69B4, name: 'Rubi' },          // Rubi
  { main: 0x9966CC, shine: 0xDA70D6, name: 'Ametista' },      // Ametista
  { main: 0x00CED1, shine: 0xAFEEEE, name: 'Turmalina' },     // Turmalina
  { main: 0xFF6347, shine: 0xFFA07A, name: 'Topázio' },       // Topázio
  { main: 0x32CD32, shine: 0x98FB98, name: 'Peridoto' },      // Peridoto
];

// Formas menores para o jogo de puzzle
const SHAPES = [
  [[1]], // 1x1
  [[1, 1]], // 1x2
  [[1], [1]], // 2x1
  [[1, 1, 1]], // 1x3
  [[1], [1], [1]], // 3x1
  [[1, 1], [1, 1]], // 2x2 quadrado
  [[1, 1, 0], [0, 1, 1]], // Z
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 0], [1, 1]], // L pequeno
  [[0, 1], [1, 1]], // L invertido
  [[1, 1, 1], [0, 1, 0]], // T
  [[1, 1, 1], [1, 0, 0]], // L grande
  [[1, 1, 1], [0, 0, 1]], // L invertido grande
  [[1, 0, 0], [1, 1, 1]], // T lateral
  [[1, 1], [1, 0], [1, 0]], // L vertical
];

class PuzzleTetrisScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PuzzleTetrisScene' });
  }

  init(data) {
    this.onScoreUpdate = data.onScoreUpdate;
    this.onGameOver = data.onGameOver;
  }

  create() {
    // Grid principal 8x8
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(0));
    this.gridBlocks = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null));
    
    // Estado do jogo
    this.score = 0;
    this.totalLinesCleared = 0;
    this.gameOver = false;
    
    // Peças disponíveis
    this.availablePieces = [];
    this.draggedPiece = null;
    this.previewBlocks = [];
    
    // Desenha o grid
    this.drawGrid();
    
    // Gera 3 peças iniciais
    this.generateNewPieces();
    
    // UI
    this.scoreText = this.add.text(GAME_WIDTH + GRID_OFFSET_X + 40, 50, 'Score: 0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    
    this.linesText = this.add.text(GAME_WIDTH + GRID_OFFSET_X + 40, 90, 'Lines: 0', {
      fontSize: '20px',
      fill: '#ffffff'
    });
    
    this.add.text(GAME_WIDTH + GRID_OFFSET_X + 40, 150, 'Drag pieces\nto the grid!', {
      fontSize: '18px',
      fill: '#ffff00',
      align: 'center'
    });
    
    // Input
    this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
      gameObject.input.cursor = 'grabbing';
      this.updatePreview(gameObject, pointer);
    });
    
    this.input.on('dragstart', (pointer, gameObject) => {
      this.draggedPiece = gameObject;
      gameObject.setDepth(100);
      gameObject.input.cursor = 'grabbing';
      
      this.tweens.add({
        targets: gameObject,
        scale: 0.9,
        alpha: 0.85,
        duration: 150
      });
    });
    
    this.input.on('dragend', (pointer, gameObject) => {
      this.clearPreview();
      gameObject.input.cursor = 'grab';
      
      this.tweens.add({
        targets: gameObject,
        scale: 1,
        alpha: 1,
        duration: 150
      });
      
      const pieceData = gameObject.pieceData;
      const shape = pieceData.shape;
      const gridPos = this.getGridPositionCentered(pointer.x, pointer.y, shape);
      
      if (gridPos && this.canPlacePiece(gameObject.pieceData, gridPos.x, gridPos.y)) {
        this.placePiece(gameObject.pieceData, gridPos.x, gridPos.y);
        
        // Remove a peça
        gameObject.destroy();
        
        // Remove da lista de peças disponíveis
        const index = this.availablePieces.indexOf(gameObject);
        if (index > -1) {
          this.availablePieces.splice(index, 1);
        }
        
        // Verifica linhas completas
        this.checkLines();
        
        // Se não há mais peças, gera novas
        if (this.availablePieces.length === 0) {
          this.time.delayedCall(500, () => {
            this.generateNewPieces();
            this.time.delayedCall(100, () => {
              this.checkGameOver();
            });
          });
        } else {
          this.checkGameOver();
        }
      } else {
        // Retorna à posição original com animação
        this.tweens.add({
          targets: gameObject,
          x: gameObject.originalX,
          y: gameObject.originalY,
          duration: 300,
          ease: 'Back.easeOut'
        });
      }
      
      this.draggedPiece = null;
    });
  }

  drawGrid() {
    // Fundo do grid
    const gridBg = this.add.rectangle(
      GAME_WIDTH / 2 + GRID_OFFSET_X, 
      GAME_HEIGHT / 2 + GRID_OFFSET_Y, 
      GAME_WIDTH, 
      GAME_HEIGHT, 
      0x1a1a1a
    );
    
    // Linhas do grid
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0x444444, 1);
    
    for (let y = 0; y <= GRID_SIZE; y++) {
      graphics.lineBetween(
        GRID_OFFSET_X, 
        y * BLOCK_SIZE + GRID_OFFSET_Y, 
        GAME_WIDTH + GRID_OFFSET_X, 
        y * BLOCK_SIZE + GRID_OFFSET_Y
      );
    }
    
    for (let x = 0; x <= GRID_SIZE; x++) {
      graphics.lineBetween(
        x * BLOCK_SIZE + GRID_OFFSET_X, 
        GRID_OFFSET_Y, 
        x * BLOCK_SIZE + GRID_OFFSET_X, 
        GAME_HEIGHT + GRID_OFFSET_Y
      );
    }
  }

  generateNewPieces() {
    const startY = GAME_HEIGHT + GRID_OFFSET_Y + 120;
    const spacing = 140;
    const centerX = CANVAS_WIDTH / 2;
    
    for (let i = 0; i < 3; i++) {
      const shapeIndex = Phaser.Math.Between(0, SHAPES.length - 1);
      const shape = SHAPES[shapeIndex];
      const crystalIndex = Phaser.Math.Between(0, CRYSTAL_COLORS.length - 1);
      const crystal = CRYSTAL_COLORS[crystalIndex];
      
      // Calcula dimensões da peça
      const pieceWidth = shape[0].length;
      const pieceHeight = shape.length;
      
      // Cria um container para a peça
      const pieceContainer = this.add.container(
        centerX - spacing + i * spacing,
        startY
      );
      
      // Cria um retângulo invisível para capturar cliques em toda a área
      const hitAreaWidth = pieceWidth * BLOCK_SIZE;
      const hitAreaHeight = pieceHeight * BLOCK_SIZE;
      const invisibleHitArea = this.add.rectangle(0, 0, hitAreaWidth, hitAreaHeight, 0x000000, 0);
      pieceContainer.add(invisibleHitArea);
      
      // Desenha os cristais
      shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell) {
            const blockX = (x - pieceWidth / 2) * BLOCK_SIZE + BLOCK_SIZE / 2;
            const blockY = (y - pieceHeight / 2) * BLOCK_SIZE + BLOCK_SIZE / 2;
            
            // Sombra do cristal
            const shadow = this.add.rectangle(
              blockX + 2,
              blockY + 2,
              BLOCK_SIZE - 6,
              BLOCK_SIZE - 6,
              0x000000,
              0.3
            );
            pieceContainer.add(shadow);
            
            // Corpo do cristal
            const block = this.add.rectangle(
              blockX,
              blockY,
              BLOCK_SIZE - 6,
              BLOCK_SIZE - 6,
              crystal.main
            );
            block.setStrokeStyle(3, crystal.shine, 1);
            pieceContainer.add(block);
            
            // Brilho do cristal (highlight)
            const shine = this.add.rectangle(
              blockX - 6,
              blockY - 6,
              12,
              12,
              crystal.shine,
              0.8
            );
            pieceContainer.add(shine);
            
            // Animação de brilho pulsante
            this.tweens.add({
              targets: shine,
              alpha: 0.3,
              duration: 1000,
              yoyo: true,
              repeat: -1,
              ease: 'Sine.easeInOut'
            });
          }
        });
      });
      
      // Configura interatividade com a área invisível
      pieceContainer.setSize(hitAreaWidth, hitAreaHeight);
      pieceContainer.setInteractive({ 
        cursor: 'grab',
        draggable: true,
        useHandCursor: true
      });
      this.input.setDraggable(pieceContainer);
      
      pieceContainer.pieceData = {
        shape: shape,
        crystal: crystal
      };
      
      pieceContainer.originalX = pieceContainer.x;
      pieceContainer.originalY = pieceContainer.y;
      
      this.availablePieces.push(pieceContainer);
      
      // Animação de entrada
      pieceContainer.setScale(0);
      this.tweens.add({
        targets: pieceContainer,
        scale: 1,
        duration: 300,
        delay: i * 100,
        ease: 'Back.easeOut'
      });
      
      // Adiciona efeito hover
      pieceContainer.on('pointerover', () => {
        if (!this.draggedPiece) {
          this.tweens.add({
            targets: pieceContainer,
            scale: 1.08,
            duration: 150,
            ease: 'Power2'
          });
        }
      });
      
      pieceContainer.on('pointerout', () => {
        if (!this.draggedPiece) {
          this.tweens.add({
            targets: pieceContainer,
            scale: 1,
            duration: 150,
            ease: 'Power2'
          });
        }
      });
    }
  }

  getGridPosition(x, y) {
    const adjustedX = x - GRID_OFFSET_X;
    const adjustedY = y - GRID_OFFSET_Y;
    
    if (adjustedX < 0 || adjustedX >= GAME_WIDTH || adjustedY < 0 || adjustedY >= GAME_HEIGHT) {
      return null;
    }
    
    return {
      x: Math.floor(adjustedX / BLOCK_SIZE),
      y: Math.floor(adjustedY / BLOCK_SIZE)
    };
  }

  getGridPositionCentered(x, y, shape) {
    // Calcula a posição do grid considerando o centro da peça
    const pieceWidth = shape[0].length;
    const pieceHeight = shape.length;
    
    // Ajusta para o centro da peça e os offsets do grid
    const adjustedX = x - GRID_OFFSET_X - (pieceWidth * BLOCK_SIZE) / 2;
    const adjustedY = y - GRID_OFFSET_Y - (pieceHeight * BLOCK_SIZE) / 2;
    
    if (adjustedX < -BLOCK_SIZE && adjustedX >= GAME_WIDTH - BLOCK_SIZE && 
        adjustedY < -BLOCK_SIZE && adjustedY >= GAME_HEIGHT - BLOCK_SIZE) {
      return null;
    }
    
    // Calcula posição com clamp para manter dentro do grid
    const gridX = Math.max(0, Math.min(GRID_SIZE - pieceWidth, Math.round(adjustedX / BLOCK_SIZE)));
    const gridY = Math.max(0, Math.min(GRID_SIZE - pieceHeight, Math.round(adjustedY / BLOCK_SIZE)));
    
    return { x: gridX, y: gridY };
  }

  canPlacePiece(pieceData, gridX, gridY) {
    const shape = pieceData.shape;
    
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = gridX + x;
          const newY = gridY + y;
          
          // Verifica limites
          if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
            return false;
          }
          
          // Verifica ocupação
          if (this.grid[newY][newX] !== 0) {
            return false;
          }
        }
      }
    }
    
    return true;
  }

  updatePreview(gameObject, pointer) {
    this.clearPreview();
    
    const pieceData = gameObject.pieceData;
    const shape = pieceData.shape;
    
    // Usa posição centralizada baseada no mouse
    const gridPos = this.getGridPositionCentered(pointer.x, pointer.y, shape);
    
    if (!gridPos) return;
    
    const canPlace = this.canPlacePiece(pieceData, gridPos.x, gridPos.y);
    const crystal = pieceData.crystal;
    
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const newX = gridPos.x + x;
          const newY = gridPos.y + y;
          
          if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
            const preview = this.add.rectangle(
              newX * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_X,
              newY * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_Y,
              BLOCK_SIZE - 4,
              BLOCK_SIZE - 4,
              canPlace ? crystal.main : 0xff0000,
              canPlace ? 0.5 : 0.6
            );
            preview.setDepth(50);
            preview.setStrokeStyle(2, canPlace ? crystal.shine : 0xffffff, 0.8);
            this.previewBlocks.push(preview);
          }
        }
      });
    });
  }

  clearPreview() {
    this.previewBlocks.forEach(block => block.destroy());
    this.previewBlocks = [];
  }

  placePiece(pieceData, gridX, gridY) {
    const shape = pieceData.shape;
    const crystal = pieceData.crystal;
    
    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const newX = gridX + x;
          const newY = gridY + y;
          
          this.grid[newY][newX] = 1;
          
          // Sombra do cristal
          const shadow = this.add.rectangle(
            newX * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_X + 2,
            newY * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_Y + 2,
            BLOCK_SIZE - 6,
            BLOCK_SIZE - 6,
            0x000000,
            0.3
          );
          shadow.setDepth(1);
          
          // Corpo do cristal
          const block = this.add.rectangle(
            newX * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_X,
            newY * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_Y,
            BLOCK_SIZE - 6,
            BLOCK_SIZE - 6,
            crystal.main
          );
          block.setStrokeStyle(3, crystal.shine, 1);
          block.setDepth(2);
          
          // Brilho do cristal
          const shine = this.add.rectangle(
            newX * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_X - 8,
            newY * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_Y - 8,
            14,
            14,
            crystal.shine,
            0.7
          );
          shine.setDepth(3);
          
          // Animação de brilho
          this.tweens.add({
            targets: shine,
            alpha: 0.3,
            duration: 1500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
          });
          
          // Armazena o bloco e seus efeitos
          this.gridBlocks[newY][newX] = { block, shadow, shine, crystal };
          
          // Animação de colocação
          block.setScale(0);
          block.setAlpha(0);
          shadow.setScale(0);
          shine.setScale(0);
          
          this.tweens.add({
            targets: [block, shadow, shine],
            scale: 1,
            alpha: 1,
            duration: 200,
            ease: 'Back.easeOut'
          });
        }
      });
    });
    
    // Feedback visual suave com a cor do cristal
    const flash = this.add.rectangle(
      GAME_WIDTH / 2 + GRID_OFFSET_X,
      GAME_HEIGHT / 2 + GRID_OFFSET_Y,
      GAME_WIDTH,
      GAME_HEIGHT,
      crystal.shine,
      0.3
    );
    flash.setDepth(4);
    this.tweens.add({
      targets: flash,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy()
    });
  }

  checkLines() {
    let rowsToRemove = [];
    let colsToRemove = [];
    
    // Verifica linhas horizontais
    for (let y = 0; y < GRID_SIZE; y++) {
      if (this.grid[y].every(cell => cell === 1)) {
        rowsToRemove.push(y);
      }
    }
    
    // Verifica linhas verticais
    for (let x = 0; x < GRID_SIZE; x++) {
      let full = true;
      for (let y = 0; y < GRID_SIZE; y++) {
        if (this.grid[y][x] === 0) {
          full = false;
          break;
        }
      }
      if (full) {
        colsToRemove.push(x);
      }
    }
    
    const totalLines = rowsToRemove.length + colsToRemove.length;
    
    if (totalLines > 0) {
      // Animação de remoção com partículas
      rowsToRemove.forEach(y => {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (this.gridBlocks[y][x]) {
            const blockData = this.gridBlocks[y][x];
            const posX = x * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_X;
            const posY = y * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_Y;
            
            // Cria partículas de cristal
            this.createCrystalParticles(posX, posY, blockData.crystal);
            
            // Animação de explosão
            this.tweens.add({
              targets: [blockData.block, blockData.shadow, blockData.shine],
              alpha: 0,
              scale: 1.5,
              rotation: Phaser.Math.Between(-180, 180) * Math.PI / 180,
              duration: 400,
              ease: 'Power2.easeOut',
              onComplete: () => {
                blockData.block.destroy();
                blockData.shadow.destroy();
                blockData.shine.destroy();
              }
            });
            
            this.gridBlocks[y][x] = null;
          }
          this.grid[y][x] = 0;
        }
      });
      
      colsToRemove.forEach(x => {
        for (let y = 0; y < GRID_SIZE; y++) {
          if (this.gridBlocks[y][x]) {
            const blockData = this.gridBlocks[y][x];
            const posX = x * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_X;
            const posY = y * BLOCK_SIZE + BLOCK_SIZE / 2 + GRID_OFFSET_Y;
            
            // Cria partículas de cristal
            this.createCrystalParticles(posX, posY, blockData.crystal);
            
            // Animação de explosão
            this.tweens.add({
              targets: [blockData.block, blockData.shadow, blockData.shine],
              alpha: 0,
              scale: 1.5,
              rotation: Phaser.Math.Between(-180, 180) * Math.PI / 180,
              duration: 400,
              ease: 'Power2.easeOut',
              onComplete: () => {
                blockData.block.destroy();
                blockData.shadow.destroy();
                blockData.shine.destroy();
              }
            });
            
            this.gridBlocks[y][x] = null;
          }
          this.grid[y][x] = 0;
        }
      });
      
      // Pontuação
      this.score += totalLines * 100 * (totalLines > 1 ? 2 : 1);
      this.totalLinesCleared += totalLines;
      
      this.updateUI();
      
      // Efeito visual
      this.tweens.add({
        targets: this.cameras.main,
        zoom: 1.03,
        duration: 150,
        yoyo: true,
        ease: 'Sine.easeInOut'
      });
      
      // Flash de luz
      const flash = this.add.rectangle(
        GAME_WIDTH / 2 + GRID_OFFSET_X,
        GAME_HEIGHT / 2 + GRID_OFFSET_Y,
        GAME_WIDTH,
        GAME_HEIGHT,
        0xFFFFFF,
        0.5
      );
      flash.setDepth(100);
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy()
      });
    }
  }

  createCrystalParticles(x, y, crystal) {
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const speed = Phaser.Math.Between(50, 150);
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;
      
      const particle = this.add.rectangle(
        x, y, 
        Phaser.Math.Between(4, 8), 
        Phaser.Math.Between(4, 8), 
        i % 2 === 0 ? crystal.main : crystal.shine,
        1
      );
      particle.setDepth(99);
      particle.setRotation(Phaser.Math.Between(0, 360) * Math.PI / 180);
      
      // Animação da partícula
      this.tweens.add({
        targets: particle,
        x: x + velocityX,
        y: y + velocityY,
        alpha: 0,
        scale: 0,
        rotation: particle.rotation + Phaser.Math.Between(-720, 720) * Math.PI / 180,
        duration: Phaser.Math.Between(400, 800),
        ease: 'Power2.easeOut',
        onComplete: () => particle.destroy()
      });
    }
  }

  updateUI() {
    this.scoreText.setText('Score: ' + this.score);
    this.linesText.setText('Lines: ' + this.totalLinesCleared);
    
    if (this.onScoreUpdate) {
      this.onScoreUpdate({ score: this.score, lines: this.totalLinesCleared });
    }
  }

  checkGameOver() {
    // Verifica se alguma das peças disponíveis pode ser colocada
    let canPlaceAny = false;
    
    for (let piece of this.availablePieces) {
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (this.canPlacePiece(piece.pieceData, x, y)) {
            canPlaceAny = true;
            break;
          }
        }
        if (canPlaceAny) break;
      }
      if (canPlaceAny) break;
    }
    
    if (!canPlaceAny && this.availablePieces.length > 0) {
      this.gameOver = true;

      // Overlay escuro com depth alto para sobrepor tudo
      const overlay = this.add.rectangle(
        GAME_WIDTH / 2 + GRID_OFFSET_X,
        GAME_HEIGHT / 2 + GRID_OFFSET_Y,
        GAME_WIDTH,
        GAME_HEIGHT,
        0x000000,
        0.8
      );
      overlay.setDepth(200);

      // Texto Game Over
      const gameOverText = this.add.text(
        GAME_WIDTH / 2 + GRID_OFFSET_X,
        GAME_HEIGHT / 2 + GRID_OFFSET_Y - 50,
        'GAME OVER',
        {
          fontSize: '48px',
          fill: '#ff0000',
          fontStyle: 'bold'
        }
      );
      gameOverText.setOrigin(0.5);
      gameOverText.setDepth(201);

      // Texto Score
      const scoreText = this.add.text(
        GAME_WIDTH / 2 + GRID_OFFSET_X,
        GAME_HEIGHT / 2 + GRID_OFFSET_Y + 20,
        'Score: ' + this.score,
        {
          fontSize: '32px',
          fill: '#ffffff'
        }
      );
      scoreText.setOrigin(0.5);
      scoreText.setDepth(201);

      if (this.onGameOver) {
        this.onGameOver(this.score);
      }
    }
  }

  update() {
    // Lógica de atualização se necessário
  }
}

const PuzzleTetris = () => {
  const gameRef = useRef(null);
  const [gameInstance, setGameInstance] = useState(null);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const config = {
      type: Phaser.AUTO,
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      parent: gameRef.current,
      backgroundColor: '#0a0a0a',
      scene: PuzzleTetrisScene,
    };

    const game = new Phaser.Game(config);
    
    game.scene.start('PuzzleTetrisScene', {
      onScoreUpdate: (data) => {
        setScore(data.score);
        setLines(data.lines);
      },
      onGameOver: (finalScore) => {
        if (finalScore > highScore) {
          setHighScore(finalScore);
          localStorage.setItem('puzzleTetrisHighScore', finalScore.toString());
        }
      }
    });

    setGameInstance(game);

    // Carrega high score
    const savedHighScore = localStorage.getItem('puzzleTetrisHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    return () => {
      game.destroy(true);
    };
  }, []);

  const restartGame = () => {
    if (gameInstance) {
      setScore(0);
      setLines(0);
      gameInstance.scene.stop('PuzzleTetrisScene');
      gameInstance.scene.start('PuzzleTetrisScene', {
        onScoreUpdate: (data) => {
          setScore(data.score);
          setLines(data.lines);
        },
        onGameOver: (finalScore) => {
          if (finalScore > highScore) {
            setHighScore(finalScore);
            localStorage.setItem('puzzleTetrisHighScore', finalScore.toString());
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
      padding: '30px',
      backgroundColor: '#0a0a0a',
      minHeight: '100vh',
      fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
    }}>
      <h1 style={{ 
        color: '#fff', 
        marginBottom: '10px',
        fontSize: '36px',
        textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
      }}>
        Simple Puzzle Tetris
      </h1>
      
      <p style={{ 
        color: '#aaa', 
        marginBottom: '20px',
        fontSize: '16px'
      }}>
        Arraste as 3 peças para a matriz 8x8 e complete linhas!
      </p>
      
      <div style={{ 
        display: 'flex', 
        gap: '40px', 
        marginBottom: '20px',
        color: '#fff',
        fontSize: '20px',
        fontWeight: 'bold'
      }}>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          border: '2px solid #333'
        }}>
          Score: <span style={{ color: '#00ff00' }}>{score}</span>
        </div>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          border: '2px solid #333'
        }}>
          Lines: <span style={{ color: '#00ffff' }}>{lines}</span>
        </div>
        <div style={{ 
          padding: '10px 20px', 
          backgroundColor: '#1a1a1a', 
          borderRadius: '8px',
          border: '2px solid #333'
        }}>
          Best: <span style={{ color: '#ffd700' }}>{highScore}</span>
        </div>
      </div>
      
      <div ref={gameRef} style={{ 
        border: '4px solid #333',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(0,255,255,0.3)'
      }} />
      
      <button
        onClick={restartGame}
        style={{
          marginTop: '25px',
          padding: '15px 40px',
          fontSize: '20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontWeight: 'bold',
          transition: 'all 0.3s',
          boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#45a049';
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 8px rgba(0,0,0,0.4)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#4CAF50';
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.3)';
        }}
      >
        🔄 New Game
      </button>
      
      <div style={{ 
        marginTop: '30px', 
        color: '#888',
        textAlign: 'center',
        maxWidth: '600px',
        lineHeight: '1.6'
      }}>
        <p style={{ fontSize: '18px', color: '#aaa', marginBottom: '10px' }}>
          <strong>📋 Como Jogar:</strong>
        </p>
        <p>🖱️ Arraste as peças para a matriz 8x8</p>
        <p>✨ Complete linhas horizontais ou verticais para remover</p>
        <p>🎯 Quanto mais linhas limpar de uma vez, mais pontos!</p>
        <p>⚠️ O jogo acaba quando não houver mais espaço para as peças</p>
      </div>
    </div>
  );
};

export default PuzzleTetris;