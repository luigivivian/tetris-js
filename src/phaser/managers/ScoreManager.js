import { SCORE_CONFIG, GAME_WIDTH } from '../config/GameConfig';

/**
 * Classe responsável por gerenciar pontuação e UI
 */
export class ScoreManager {
  constructor(scene, onScoreUpdate) {
    this.scene = scene;
    this.onScoreUpdate = onScoreUpdate;

    this.score = 0;
    this.totalLinesCleared = 0;
    this.combo = 0;

    this.createUI();
  }

  /**
   * Cria os elementos de UI
   */
  createUI() {
    this.scoreText = this.scene.add.text(GAME_WIDTH + 30, 50, 'Score: 0', {
      fontSize: '24px',
      fill: '#ffffff',
      fontStyle: 'bold',
    });

    this.linesText = this.scene.add.text(GAME_WIDTH + 30, 90, 'Lines: 0', {
      fontSize: '20px',
      fill: '#ffffff',
    });

    this.comboText = this.scene.add.text(GAME_WIDTH + 30, 130, '', {
      fontSize: '18px',
      fill: '#ffff00',
      fontStyle: 'bold',
    });

    this.scene.add.text(GAME_WIDTH + 30, 180, 'Drag pieces\nto the grid!', {
      fontSize: '18px',
      fill: '#ffff00',
      align: 'center',
    });
  }

  /**
   * Adiciona pontos baseado no número de linhas limpas
   */
  addScore(linesCleared) {
    if (linesCleared === 0) {
      this.combo = 0;
      this.updateUI();
      return;
    }

    this.combo++;
    const basePoints = SCORE_CONFIG.BASE_POINTS * linesCleared;
    const comboBonus =
      linesCleared > 1 ? basePoints * SCORE_CONFIG.COMBO_MULTIPLIER : basePoints;
    const totalPoints = comboBonus * Math.max(1, this.combo);

    this.score += totalPoints;
    this.totalLinesCleared += linesCleared;

    this.updateUI();

    // Mostra feedback visual de combo
    if (this.combo > 1) {
      this.showComboFeedback(this.combo);
    }
  }

  /**
   * Atualiza a UI de pontuação
   */
  updateUI() {
    this.scoreText.setText(`Score: ${this.score}`);
    this.linesText.setText(`Lines: ${this.totalLinesCleared}`);

    if (this.combo > 1) {
      this.comboText.setText(`Combo x${this.combo}!`);
    } else {
      this.comboText.setText('');
    }

    // Callback para atualizar React
    if (this.onScoreUpdate) {
      this.onScoreUpdate({
        score: this.score,
        lines: this.totalLinesCleared,
        combo: this.combo,
      });
    }
  }

  /**
   * Mostra feedback visual de combo
   */
  showComboFeedback(comboCount) {
    const comboFeedback = this.scene.add.text(
      GAME_WIDTH / 2,
      50,
      `COMBO x${comboCount}!`,
      {
        fontSize: '32px',
        fill: '#ffff00',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    comboFeedback.setOrigin(0.5);
    comboFeedback.setAlpha(0);

    this.scene.tweens.add({
      targets: comboFeedback,
      alpha: 1,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      onComplete: () => {
        comboFeedback.destroy();
      },
    });
  }

  /**
   * Reseta a pontuação
   */
  reset() {
    this.score = 0;
    this.totalLinesCleared = 0;
    this.combo = 0;
    this.updateUI();
  }

  /**
   * Retorna a pontuação atual
   */
  getScore() {
    return this.score;
  }

  /**
   * Retorna o total de linhas limpas
   */
  getTotalLines() {
    return this.totalLinesCleared;
  }
}
