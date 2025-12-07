# Puzzle Tetris Game

Jogo de puzzle estilo Block Puzzle construído com React, Vite e Phaser.

## Descrição

Arraste e solte peças de tetris em uma grade 8x8. Complete linhas horizontais ou verticais para pontuar e limpar o tabuleiro. O jogo termina quando não há mais espaço para colocar as peças disponíveis.

## Requisitos

- Node.js >= 16.0.0
- npm ou yarn

## Instalação

1. Clone ou navegue até o diretório do projeto:
```bash
cd /tetris-game
```

2. Instale as dependências:
```bash
npm install
```

## Executar o Projeto

### Modo Desenvolvimento

```bash
npm run dev
```

O jogo será aberto em `http://localhost:5173` (ou outra porta disponível).

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `dist/`.

### Preview da Build de Produção

```bash
npm run preview
```

## Como Jogar

1. 🖱️ **Arraste** as peças da parte inferior para a grade 8x8
2. ✨ Complete **linhas horizontais ou verticais** para removê-las
3. 🎯 Quanto mais linhas limpar de uma vez, **mais pontos**!
4. ⚠️ O jogo acaba quando não houver espaço para as peças disponíveis

## Tecnologias Utilizadas

- **React** - Biblioteca UI
- **Vite** - Build tool e dev server
- **Phaser** - Game engine 2D
- **JavaScript/JSX** - Linguagem de programação

## Estrutura do Projeto

```
tetris-game/
├── src/
│   ├── PuzzleTetris.jsx      # Componente principal do jogo
│   ├── App.jsx                # App React
│   └── main.jsx               # Entry point
├── public/                    # Assets estáticos
├── index.html                 # HTML principal
└── package.json               # Dependências
```
