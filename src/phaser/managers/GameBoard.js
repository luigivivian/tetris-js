import { GAME_CONFIG, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

/**
 * Classe responsável por gerenciar o tabuleiro do jogo
 */
export class GameBoard {
  constructor(scene) {
    this.scene = scene;
    this.gridSize = GAME_CONFIG.GRID_SIZE;
    this.blockSize = GAME_CONFIG.BLOCK_SIZE;

    // Matriz lógica do grid (0 = vazio, 1 = ocupado)
    this.grid = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(0));

    // Matriz de blocos visuais
    this.gridBlocks = Array(this.gridSize)
      .fill(null)
      .map(() => Array(this.gridSize).fill(null));

    this.drawGrid();
  }

  /**
   * Desenha o grid visual
   */
  drawGrid() {
    // Fundo do grid
    this.background = this.scene.add.rectangle(
      GAME_WIDTH / 2,
      GAME_HEIGHT / 2,
      GAME_WIDTH,
      GAME_HEIGHT,
      0x1a1a1a
    );

    // Linhas do grid
    this.gridLines = this.scene.add.graphics();
    this.gridLines.lineStyle(2, 0x444444, 1);

    // Linhas horizontais
    for (let y = 0; y <= this.gridSize; y++) {
      this.gridLines.lineBetween(
        0,
        y * this.blockSize,
        GAME_WIDTH,
        y * this.blockSize
      );
    }

    // Linhas verticais
    for (let x = 0; x <= this.gridSize; x++) {
      this.gridLines.lineBetween(
        x * this.blockSize,
        0,
        x * this.blockSize,
        GAME_HEIGHT
      );
    }
  }

  /**
   * Converte coordenadas de pixel para posição do grid
   */
  getGridPosition(x, y) {
    if (x < 0 || x >= GAME_WIDTH || y < 0 || y >= GAME_HEIGHT) {
      return null;
    }

    return {
      x: Math.floor(x / this.blockSize),
      y: Math.floor(y / this.blockSize),
    };
  }

  /**
   * Verifica se uma peça pode ser colocada na posição especificada
   */
  canPlacePiece(shape, gridX, gridY) {
    for (let y = 0; y < shape.length; y++) {
      for (let x = 0; x < shape[y].length; x++) {
        if (shape[y][x]) {
          const newX = gridX + x;
          const newY = gridY + y;

          // Verifica limites
          if (newX < 0 || newX >= this.gridSize || newY < 0 || newY >= this.gridSize) {
            return false;
          }

          // Verifica se a célula já está ocupada
          if (this.grid[newY][newX] !== 0) {
            return false;
          }
        }
      }
    }

    return true;
  }

  /**
   * Coloca uma peça no tabuleiro
   */
  placePiece(shape, color, gridX, gridY) {
    const placedBlocks = [];

    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const newX = gridX + x;
          const newY = gridY + y;

          // Atualiza a matriz lógica
          this.grid[newY][newX] = 1;

          // Cria o bloco visual
          const block = this.scene.add.rectangle(
            newX * this.blockSize + this.blockSize / 2,
            newY * this.blockSize + this.blockSize / 2,
            this.blockSize - 4,
            this.blockSize - 4,
            color
          );
          block.setStrokeStyle(2, 0xffffff, 0.5);

          // Armazena na matriz visual
          this.gridBlocks[newY][newX] = block;
          placedBlocks.push(block);

          // Animação de colocação
          block.setScale(0);
          this.scene.tweens.add({
            targets: block,
            scale: 1,
            duration: GAME_CONFIG.ANIMATION_DURATION * 0.67,
            ease: 'Back.easeOut',
          });
        }
      });
    });

    return placedBlocks;
  }

  /**
   * Verifica e remove linhas completas
   */
  checkAndClearLines() {
    const rowsToRemove = [];
    const colsToRemove = [];

    // Verifica linhas horizontais
    for (let y = 0; y < this.gridSize; y++) {
      if (this.grid[y].every((cell) => cell === 1)) {
        rowsToRemove.push(y);
      }
    }

    // Verifica linhas verticais
    for (let x = 0; x < this.gridSize; x++) {
      let full = true;
      for (let y = 0; y < this.gridSize; y++) {
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
      this.clearLines(rowsToRemove, colsToRemove);
    }

    return totalLines;
  }

  /**
   * Remove as linhas especificadas com animação
   */
  clearLines(rowsToRemove, colsToRemove) {
    // Remove linhas horizontais
    rowsToRemove.forEach((y) => {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.gridBlocks[y][x]) {
          this.animateBlockRemoval(this.gridBlocks[y][x]);
          this.gridBlocks[y][x] = null;
        }
        this.grid[y][x] = 0;
      }
    });

    // Remove linhas verticais
    colsToRemove.forEach((x) => {
      for (let y = 0; y < this.gridSize; y++) {
        if (this.gridBlocks[y][x]) {
          this.animateBlockRemoval(this.gridBlocks[y][x]);
          this.gridBlocks[y][x] = null;
        }
        this.grid[y][x] = 0;
      }
    });

    // Efeito visual
    this.scene.cameras.main.shake(200, 0.005);
  }

  /**
   * Anima a remoção de um bloco
   */
  animateBlockRemoval(block) {
    this.scene.tweens.add({
      targets: block,
      alpha: 0,
      scale: 0,
      duration: GAME_CONFIG.ANIMATION_DURATION,
      onComplete: () => {
        if (block) {
          block.destroy();
        }
      },
    });
  }

  /**
   * Limpa todo o tabuleiro
   */
  clear() {
    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.gridBlocks[y][x]) {
          this.gridBlocks[y][x].destroy();
          this.gridBlocks[y][x] = null;
        }
        this.grid[y][x] = 0;
      }
    }
  }

  /**
   * Retorna uma cópia do estado atual do grid
   */
  getGridState() {
    return this.grid.map((row) => [...row]);
  }
}
