import Phaser from 'phaser';
import { SHAPES, COLOR_PALETTE, GAME_CONFIG, GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';

/**
 * Classe responsável por gerenciar as peças do jogo
 */
export class PieceManager {
  constructor(scene, gameBoard) {
    this.scene = scene;
    this.gameBoard = gameBoard;
    this.blockSize = GAME_CONFIG.BLOCK_SIZE;
    this.availablePieces = [];
    this.previewBlocks = [];
    this.draggedPiece = null;
  }

  /**
   * Gera um novo conjunto de peças
   */
  generatePieceSet() {
    const startY = GAME_HEIGHT + 80;
    const spacing = 150;

    for (let i = 0; i < GAME_CONFIG.PIECES_PER_SET; i++) {
      const piece = this.createRandomPiece(
        GAME_WIDTH / 2 - spacing + i * spacing,
        startY,
        i
      );
      this.availablePieces.push(piece);
    }
  }

  /**
   * Cria uma peça aleatória
   */
  createRandomPiece(x, y, index) {
    const shapeData = Phaser.Utils.Array.GetRandom(SHAPES);
    const color = Phaser.Utils.Array.GetRandom(COLOR_PALETTE);

    const pieceContainer = this.scene.add.container(x, y);

    // Desenha os blocos da peça
    const blocks = [];
    shapeData.pattern.forEach((row, rowIndex) => {
      row.forEach((cell, colIndex) => {
        if (cell) {
          const block = this.scene.add.rectangle(
            colIndex * this.blockSize,
            rowIndex * this.blockSize,
            this.blockSize - 4,
            this.blockSize - 4,
            color
          );
          block.setStrokeStyle(2, 0xffffff, 0.8);
          pieceContainer.add(block);
          blocks.push(block);
        }
      });
    });

    // Centraliza a peça no container
    const bounds = pieceContainer.getBounds();
    pieceContainer.list.forEach((block) => {
      block.x -= bounds.width / 2;
      block.y -= bounds.height / 2;
    });

    // Adiciona fundo
    const bg = this.scene.add.rectangle(
      0,
      0,
      bounds.width + 20,
      bounds.height + 20,
      0x333333,
      0.7
    );
    bg.setStrokeStyle(2, 0x666666);
    pieceContainer.addAt(bg, 0);

    // Configura interatividade
    pieceContainer.setSize(bounds.width + 20, bounds.height + 20);
    pieceContainer.setInteractive({ draggable: true });
    this.scene.input.setDraggable(pieceContainer);

    // Dados da peça
    pieceContainer.pieceData = {
      shape: shapeData.pattern,
      color: color,
      blocks: blocks,
      id: shapeData.id,
    };

    pieceContainer.originalX = x;
    pieceContainer.originalY = y;

    // Animação de entrada
    pieceContainer.setScale(0);
    this.scene.tweens.add({
      targets: pieceContainer,
      scale: 1,
      duration: GAME_CONFIG.ANIMATION_DURATION,
      delay: index * 100,
      ease: 'Back.easeOut',
    });

    return pieceContainer;
  }

  /**
   * Inicia o arrasto de uma peça
   */
  onDragStart(gameObject) {
    this.draggedPiece = gameObject;
    gameObject.setDepth(100);
    gameObject.setScale(1.1);
    gameObject.setTint(0xaaaaaa);
  }

  /**
   * Atualiza durante o arrasto
   */
  onDrag(gameObject, dragX, dragY) {
    gameObject.x = dragX;
    gameObject.y = dragY;
    this.updatePreview(gameObject);
  }

  /**
   * Finaliza o arrasto
   */
  onDragEnd(gameObject, pointer) {
    this.clearPreview();
    gameObject.setScale(1);
    gameObject.clearTint();

    const gridPos = this.gameBoard.getGridPosition(pointer.x, pointer.y);

    if (gridPos && this.gameBoard.canPlacePiece(gameObject.pieceData.shape, gridPos.x, gridPos.y)) {
      // Coloca a peça no tabuleiro
      this.gameBoard.placePiece(
        gameObject.pieceData.shape,
        gameObject.pieceData.color,
        gridPos.x,
        gridPos.y
      );

      // Remove a peça
      gameObject.destroy();
      const index = this.availablePieces.indexOf(gameObject);
      if (index > -1) {
        this.availablePieces.splice(index, 1);
      }

      // Feedback visual
      this.scene.cameras.main.flash(100, 255, 255, 255, false, 0.1);

      return true; // Peça colocada com sucesso
    } else {
      // Retorna à posição original
      gameObject.x = gameObject.originalX;
      gameObject.y = gameObject.originalY;
      return false; // Peça não colocada
    }
  }

  /**
   * Atualiza o preview da peça no tabuleiro
   */
  updatePreview(gameObject) {
    this.clearPreview();

    const pointer = this.scene.input.activePointer;
    const gridPos = this.gameBoard.getGridPosition(pointer.x, pointer.y);

    if (!gridPos) return;

    const pieceData = gameObject.pieceData;
    const shape = pieceData.shape;
    const canPlace = this.gameBoard.canPlacePiece(shape, gridPos.x, gridPos.y);

    shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell) {
          const newX = gridPos.x + x;
          const newY = gridPos.y + y;

          if (
            newX >= 0 &&
            newX < this.gameBoard.gridSize &&
            newY >= 0 &&
            newY < this.gameBoard.gridSize
          ) {
            const preview = this.scene.add.rectangle(
              newX * this.blockSize + this.blockSize / 2,
              newY * this.blockSize + this.blockSize / 2,
              this.blockSize - 4,
              this.blockSize - 4,
              canPlace ? 0x00ff00 : 0xff0000,
              GAME_CONFIG.PREVIEW_ALPHA
            );
            this.previewBlocks.push(preview);
          }
        }
      });
    });
  }

  /**
   * Limpa o preview
   */
  clearPreview() {
    this.previewBlocks.forEach((block) => block.destroy());
    this.previewBlocks = [];
  }

  /**
   * Verifica se alguma peça disponível pode ser colocada
   */
  canPlaceAnyPiece() {
    for (const piece of this.availablePieces) {
      for (let y = 0; y < this.gameBoard.gridSize; y++) {
        for (let x = 0; x < this.gameBoard.gridSize; x++) {
          if (this.gameBoard.canPlacePiece(piece.pieceData.shape, x, y)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * Remove todas as peças disponíveis
   */
  clearAllPieces() {
    this.availablePieces.forEach((piece) => piece.destroy());
    this.availablePieces = [];
    this.clearPreview();
  }

  /**
   * Retorna o número de peças disponíveis
   */
  getPieceCount() {
    return this.availablePieces.length;
  }
}
