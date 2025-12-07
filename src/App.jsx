import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import TetrisGame from './tetris-react-phaser';
import PuzzleTetris from './PuzzleTetris';


function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <TetrisGame></TetrisGame> */}
      <PuzzleTetris></PuzzleTetris>
    </>
  )
}

export default App
