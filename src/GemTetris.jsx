import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Sparkles, RotateCcw, Trophy } from 'lucide-react';

const GemTetris = () => {
  const GRID_SIZE = 8;
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
  const [score, setScore] = useState(0);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [availablePieces, setAvailablePieces] = useState([]);
  const [clearedCells, setClearedCells] = useState([]);
  const [highScore, setHighScore] = useState(0);
  const [comboCount, setComboCount] = useState(0);
  const [hoverCell, setHoverCell] = useState(null);
  const [previewValid, setPreviewValid] = useState(false);

  // Memoizar objetos estáticos para evitar recriações
  const gemTypes = useMemo(() => ({
    diamond: {
      name: 'Diamante',
      colors: 'from-cyan-400/80 via-blue-400/70 to-cyan-500/80',
      border: 'border-cyan-300/40',
      innerGlow: 'bg-cyan-200/20',
      shadow: 'shadow-xl shadow-cyan-400/60',
      glow: 'drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]',
      shimmer: 'bg-gradient-to-br from-white/30 via-transparent to-transparent'
    },
    emerald: {
      name: 'Esmeralda',
      colors: 'from-emerald-400/80 via-green-500/70 to-emerald-600/80',
      border: 'border-emerald-300/40',
      innerGlow: 'bg-emerald-200/20',
      shadow: 'shadow-xl shadow-emerald-400/60',
      glow: 'drop-shadow-[0_0_12px_rgba(16,185,129,0.8)]',
      shimmer: 'bg-gradient-to-br from-white/30 via-transparent to-transparent'
    },
    ruby: {
      name: 'Rubi',
      colors: 'from-rose-400/80 via-pink-500/70 to-rose-600/80',
      border: 'border-rose-300/40',
      innerGlow: 'bg-rose-200/20',
      shadow: 'shadow-xl shadow-rose-400/60',
      glow: 'drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]',
      shimmer: 'bg-gradient-to-br from-white/30 via-transparent to-transparent'
    }
  }), []);

  const pieceShapes = useMemo(() => [
    { shape: [[1]], name: 'single' },
    { shape: [[1, 1]], name: 'horizontal2' },
    { shape: [[1], [1]], name: 'vertical2' },
    { shape: [[1, 1, 1]], name: 'horizontal3' },
    { shape: [[1], [1], [1]], name: 'vertical3' },
    { shape: [[1, 1], [1, 1]], name: 'square' },
    { shape: [[1, 1], [1, 0]], name: 'L1' },
    { shape: [[1, 0], [1, 1]], name: 'L2' },
    { shape: [[1, 1], [0, 1]], name: 'L3' },
    { shape: [[0, 1], [1, 1]], name: 'L4' },
    { shape: [[1, 1, 1], [0, 1, 0]], name: 'T' },
    { shape: [[1, 0], [1, 0], [1, 1]], name: 'L_long' }
  ], []);

  const generateRandomPiece = useCallback(() => {
    const shape = pieceShapes[Math.floor(Math.random() * pieceShapes.length)];
    const gemType = Object.keys(gemTypes)[Math.floor(Math.random() * 3)];

    return {
      id: Math.random(),
      shape: shape.shape,
      gemType,
      name: shape.name
    };
  }, [pieceShapes, gemTypes]);

  useEffect(() => {
    const pieces = [generateRandomPiece(), generateRandomPiece(), generateRandomPiece()];
    setAvailablePieces(pieces);
  }, [generateRandomPiece]);

  const canPlacePiece = useCallback((piece, startRow, startCol) => {
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          const gridRow = startRow + row;
          const gridCol = startCol + col;
          if (gridRow < 0 || gridRow >= GRID_SIZE || gridCol < 0 || gridCol >= GRID_SIZE) {
            return false;
          }
          if (grid[gridRow][gridCol]) {
            return false;
          }
        }
      }
    }
    return true;
  }, [grid, GRID_SIZE]);

  const placePiece = useCallback((piece, startRow, startCol) => {
    const newGrid = grid.map(row => [...row]);
    for (let row = 0; row < piece.shape.length; row++) {
      for (let col = 0; col < piece.shape[row].length; col++) {
        if (piece.shape[row][col]) {
          newGrid[startRow + row][startCol + col] = piece.gemType;
        }
      }
    }
    return newGrid;
  }, [grid]);

  const checkAndClearLines = (newGrid) => {
    const rowsToClear = [];
    const colsToClear = [];
    const cellsToAnimate = [];

    for (let row = 0; row < GRID_SIZE; row++) {
      if (newGrid[row].every(cell => cell !== null)) {
        rowsToClear.push(row);
        for (let col = 0; col < GRID_SIZE; col++) {
          cellsToAnimate.push({ row, col });
        }
      }
    }

    for (let col = 0; col < GRID_SIZE; col++) {
      if (newGrid.every(row => row[col] !== null)) {
        colsToClear.push(col);
        for (let row = 0; row < GRID_SIZE; row++) {
          if (!cellsToAnimate.find(c => c.row === row && c.col === col)) {
            cellsToAnimate.push({ row, col });
          }
        }
      }
    }

    if (cellsToAnimate.length > 0) {
      setClearedCells(cellsToAnimate);
      setTimeout(() => {
        const clearedGrid = newGrid.map(row => [...row]);
        rowsToClear.forEach(row => {
          for (let col = 0; col < GRID_SIZE; col++) {
            clearedGrid[row][col] = null;
          }
        });
        colsToClear.forEach(col => {
          for (let row = 0; row < GRID_SIZE; row++) {
            clearedGrid[row][col] = null;
          }
        });
        setGrid(clearedGrid);
        setClearedCells([]);
        
        const linesCleared = rowsToClear.length + colsToClear.length;
        const newCombo = comboCount + 1;
        setComboCount(newCombo);
        const points = linesCleared * 100 * newCombo;
        setScore(prev => {
          const newScore = prev + points;
          if (newScore > highScore) setHighScore(newScore);
          return newScore;
        });
      }, 500);
    } else {
      setComboCount(0);
    }

    return cellsToAnimate.length > 0;
  };

  const handleDrop = useCallback(() => {
    if (!draggedPiece || !hoverCell) return;

    // Usa a posição ajustada do hoverCell, que já considera o canto direito inferior
    const adjustedRow = hoverCell.row;
    const adjustedCol = hoverCell.col;

    if (canPlacePiece(draggedPiece.piece, adjustedRow, adjustedCol)) {
      const newGrid = placePiece(draggedPiece.piece, adjustedRow, adjustedCol);
      setGrid(newGrid);

      const newPieces = availablePieces.filter(p => p.id !== draggedPiece.piece.id);

      if (newPieces.length === 0) {
        setAvailablePieces([generateRandomPiece(), generateRandomPiece(), generateRandomPiece()]);
      } else {
        setAvailablePieces([...newPieces, generateRandomPiece()]);
      }

      checkAndClearLines(newGrid);
    }
    setDraggedPiece(null);
    setHoverCell(null);
    setPreviewValid(false);
  }, [draggedPiece, hoverCell, canPlacePiece, placePiece, availablePieces, generateRandomPiece]);

  const handleCellHover = useCallback((rowIndex, colIndex) => {
    if (!draggedPiece) return;

    const piece = draggedPiece.piece;

    // Encontra o canto direito inferior da peça (última célula preenchida)
    let lastRow = -1;
    let lastCol = -1;

    // Percorre de baixo para cima e da direita para esquerda
    for (let r = piece.shape.length - 1; r >= 0; r--) {
      for (let c = piece.shape[r].length - 1; c >= 0; c--) {
        if (piece.shape[r][c] === 1) {
          lastRow = r;
          lastCol = c;
          break;
        }
      }
      if (lastRow !== -1) break;
    }

    // Ajusta a posição base para que o canto direito inferior fique na célula do mouse
    const adjustedRow = rowIndex - lastRow;
    const adjustedCol = colIndex - lastCol;

    setHoverCell({ row: adjustedRow, col: adjustedCol });
    setPreviewValid(canPlacePiece(piece, adjustedRow, adjustedCol));
  }, [draggedPiece, canPlacePiece]);

  const resetGame = useCallback(() => {
    setGrid(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setScore(0);
    setComboCount(0);
    setAvailablePieces([generateRandomPiece(), generateRandomPiece(), generateRandomPiece()]);
  }, [GRID_SIZE, generateRandomPiece]);

  const isCleared = useCallback((row, col) => {
    return clearedCells.some(cell => cell.row === row && cell.col === col);
  }, [clearedCells]);

  const isPreviewCell = useCallback((row, col) => {
    if (!draggedPiece || !hoverCell) return false;

    const piece = draggedPiece.piece;
    const relRow = row - hoverCell.row;
    const relCol = col - hoverCell.col;

    // Verifica se está dentro dos limites da peça
    if (relRow >= 0 && relRow < piece.shape.length &&
        relCol >= 0 && relCol < piece.shape[0].length) {
      return piece.shape[relRow][relCol] === 1;
    }
    return false;
  }, [draggedPiece, hoverCell]);

  // Função auxiliar para encontrar a célula sob o cursor
  const getCellUnderCursor = (clientX, clientY) => {
    const gridElement = document.querySelector('[data-grid="tetris"]');
    if (!gridElement) return null;
    
    const cells = gridElement.querySelectorAll('[data-cell]');
    for (let cell of cells) {
      const rect = cell.getBoundingClientRect();
      if (clientX >= rect.left && clientX <= rect.right &&
          clientY >= rect.top && clientY <= rect.bottom) {
        const row = parseInt(cell.getAttribute('data-row'));
        const col = parseInt(cell.getAttribute('data-col'));
        return { row, col };
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8 flex items-center justify-center">

      <div className="max-w-6xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 mb-2 flex items-center justify-center gap-3">
            <Sparkles className="text-yellow-400" size={48} />
            Tetris Gems
            <Sparkles className="text-yellow-400" size={48} />
          </h1>
          <p className="text-purple-300 text-lg">Arraste as gemas e complete linhas!</p>
        </div>

        {/* Score Board */}
        <div className="flex justify-center gap-6 mb-6">
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm border border-purple-400/30 rounded-2xl px-8 py-4 shadow-xl">
            <div className="text-purple-300 text-sm mb-1">Pontuação</div>
            <div className="text-4xl font-bold text-white">{score}</div>
          </div>
          
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-yellow-400/30 rounded-2xl px-8 py-4 shadow-xl flex items-center gap-3">
            <Trophy className="text-yellow-400" size={32} />
            <div>
              <div className="text-yellow-300 text-sm">Recorde</div>
              <div className="text-3xl font-bold text-white">{highScore}</div>
            </div>
          </div>

          {comboCount > 1 && (
            <div className="bg-gradient-to-br from-red-500/30 to-orange-500/30 backdrop-blur-sm border border-red-400/50 rounded-2xl px-6 py-4 shadow-xl animate-pulse">
              <div className="text-orange-300 text-sm">Combo</div>
              <div className="text-3xl font-bold text-white">×{comboCount}</div>
            </div>
          )}
        </div>

        <div className="flex gap-8 items-start justify-center">
          {/* Game Grid */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border-2 border-purple-500/30 shadow-2xl">
            <div className="grid gap-1.5" data-grid="tetris" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}>
              {grid.map((row, rowIndex) =>
                row.map((cell, colIndex) => {
                  const showPreview = isPreviewCell(rowIndex, colIndex);
                  const previewGem = draggedPiece?.piece.gemType;
                  
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      data-cell="true"
                      data-row={rowIndex}
                      data-col={colIndex}
                      className={`w-14 h-14 rounded-xl transition-transform duration-150 ${
                        cell
                          ? `relative backdrop-blur-md bg-gradient-to-br ${gemTypes[cell].colors} ${gemTypes[cell].shadow} border-2 ${gemTypes[cell].border} ${gemTypes[cell].glow} hover:scale-105`
                          : showPreview && previewValid
                          ? `relative backdrop-blur-md bg-gradient-to-br ${gemTypes[previewGem].colors} opacity-70 border-2 border-white/70 ${gemTypes[previewGem].shadow} ${gemTypes[previewGem].glow} scale-95`
                          : showPreview && !previewValid
                          ? 'bg-red-500/40 backdrop-blur-sm border-2 border-red-400/80'
                          : 'bg-slate-800/40 border-2 border-slate-700/30 hover:border-purple-500/40 hover:bg-slate-700/40'
                      } ${
                        isCleared(rowIndex, colIndex) ? 'animate-ping' : ''
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        handleCellHover(rowIndex, colIndex);
                      }}
                      onDragLeave={() => {
                        // Limpa o preview quando sai da célula
                        if (draggedPiece) {
                          setHoverCell(null);
                          setPreviewValid(false);
                        }
                      }}
                      onDrop={handleDrop}
                      style={{
                        cursor: draggedPiece ? 'crosshair' : 'default',
                        willChange: draggedPiece ? 'transform, opacity' : 'auto'
                      }}
                    >
                      {cell && (
                        <>
                          {/* Brilho interno glassmorphism */}
                          <div className={`absolute inset-0 rounded-xl ${gemTypes[cell].shimmer}`}></div>
                          <div className={`absolute inset-2 rounded-lg ${gemTypes[cell].innerGlow} backdrop-blur-sm`}></div>
                          {/* Reflexo de vidro */}
                          <div className="absolute top-1 left-1 w-5 h-5 bg-white/50 rounded-full blur-sm"></div>
                          {/* Centro brilhante */}
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-6 h-6 bg-white/60 rounded-full shadow-inner animate-pulse"></div>
                          </div>
                        </>
                      )}
                      {showPreview && previewValid && !cell && (
                        <>
                          {/* Preview glassmorphism com efeitos completos */}
                          <div className={`absolute inset-0 rounded-xl ${gemTypes[previewGem].shimmer}`}></div>
                          <div className={`absolute inset-2 rounded-lg ${gemTypes[previewGem].innerGlow} backdrop-blur-sm`}></div>
                          {/* Reflexo de vidro */}
                          <div className="absolute top-1 left-1 w-4 h-4 bg-white/40 rounded-full blur-sm"></div>
                          {/* Centro brilhante com pulso suave */}
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-6 h-6 bg-white/60 rounded-full shadow-inner animate-pulse"></div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Pieces Panel */}
          <div className="flex flex-col gap-4">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm p-6 rounded-3xl border-2 border-purple-500/30 shadow-2xl">
              <h3 className="text-2xl font-bold text-purple-300 mb-4 text-center">
                Peças Disponíveis ({availablePieces.length})
              </h3>
              <div className="flex flex-col gap-4">
                {availablePieces.map((piece) => (
                  <div
                    key={piece.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedPiece({
                        piece,
                        x: e.clientX,
                        y: e.clientY
                      });
                      const ghost = document.createElement('div');
                      ghost.style.opacity = '0';
                      ghost.style.position = 'absolute';
                      ghost.style.top = '-1000px';
                      document.body.appendChild(ghost);
                      e.dataTransfer.setDragImage(ghost, 0, 0);
                      setTimeout(() => document.body.removeChild(ghost), 0);
                    }}
                    onDrag={(e) => {
                      if (e.clientX !== 0 && e.clientY !== 0) {
                        setDraggedPiece(prev => ({
                          ...prev,
                          x: e.clientX,
                          y: e.clientY
                        }));
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedPiece(null);
                      setHoverCell(null);
                      setPreviewValid(false);
                    }}
                    className={`cursor-grab active:cursor-grabbing bg-slate-800/60 p-4 rounded-2xl border-2 border-slate-700/50 hover:border-purple-400/50 transition-all hover:scale-105 hover:shadow-xl ${
                      draggedPiece?.piece.id === piece.id ? 'opacity-30 scale-95' : ''
                    }`}
                  >
                    <div className="flex justify-center">
                      <div className="grid gap-1" style={{ 
                        gridTemplateColumns: `repeat(${piece.shape[0].length}, 1fr)`,
                        gridTemplateRows: `repeat(${piece.shape.length}, 1fr)`
                      }}>
                        {piece.shape.map((row, rowIndex) =>
                          row.map((cell, colIndex) => (
                            <div
                              key={`${rowIndex}-${colIndex}`}
                              className={`w-10 h-10 rounded-xl transition-all ${
                                cell
                                  ? `relative backdrop-blur-md bg-gradient-to-br ${gemTypes[piece.gemType].colors} ${gemTypes[piece.gemType].shadow} border-2 ${gemTypes[piece.gemType].border} ${gemTypes[piece.gemType].glow}`
                                  : 'bg-transparent'
                              }`}
                            >
                              {cell === 1 && (
                                <>
                                  {/* Brilho interno glassmorphism */}
                                  <div className={`absolute inset-0 rounded-xl ${gemTypes[piece.gemType].shimmer}`}></div>
                                  <div className={`absolute inset-2 rounded-lg ${gemTypes[piece.gemType].innerGlow} backdrop-blur-sm`}></div>
                                  {/* Reflexo de vidro */}
                                  <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-white/50 rounded-full blur-sm"></div>
                                  {/* Centro brilhante */}
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div className="w-4 h-4 bg-white/60 rounded-full shadow-inner"></div>
                                  </div>
                                </>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                    <div className="text-center mt-2 text-sm text-purple-300 font-semibold">
                      {gemTypes[piece.gemType].name}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-4 px-6 rounded-2xl shadow-xl transition-all hover:scale-105 flex items-center justify-center gap-3 border-2 border-purple-400/50"
            >
              <RotateCcw size={24} />
              Reiniciar Jogo
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 text-center bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          <p className="text-purple-300 text-lg">
            🎮 <strong>Como Jogar:</strong> Arraste as gemas para o tabuleiro. Complete linhas horizontais ou verticais para ganhar pontos! 
            Combos aumentam sua pontuação! ✨
          </p>
        </div>
      </div>
    </div>
  );
};

export default GemTetris;