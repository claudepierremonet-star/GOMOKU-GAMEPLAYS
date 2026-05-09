import React, { useState, useEffect } from "react";
import { ChevronLeft, RefreshCcw } from "lucide-react";
import { GomokuBoard } from "./GomokuBoard";
import { BoardState, createEmptyBoard, checkWin, Player } from "../game/engine";
import { SKINS } from '../types';

interface Puzzle {
  id: string;
  movesToWin: number;
  playerSide: Player;
  startingBoard: { row: number; col: number; player: Player }[];
  solution: { row: number; col: number }[]; // The series of moves to win
}

const PUZZLES: Puzzle[] = [
  {
    id: "1",
    movesToWin: 1,
    playerSide: "black",
    startingBoard: [
      { row: 7, col: 7, player: "black" },
      { row: 7, col: 8, player: "white" },
      { row: 8, col: 7, player: "black" },
      { row: 8, col: 8, player: "white" },
      { row: 9, col: 7, player: "black" },
      { row: 9, col: 8, player: "white" },
      { row: 10, col: 7, player: "black" },
    ],
    solution: [{ row: 6, col: 7 }], // or {row: 11, col: 7}
  },
  {
    id: "2",
    movesToWin: 1,
    playerSide: "white",
    startingBoard: [
      { row: 7, col: 7, player: "black" },
      { row: 6, col: 6, player: "white" },
      { row: 8, col: 7, player: "black" },
      { row: 5, col: 5, player: "white" },
      { row: 7, col: 8, player: "black" },
      { row: 4, col: 4, player: "white" },
      { row: 8, col: 8, player: "black" },
    ],
    solution: [{ row: 3, col: 3 }],
  },
];

export function DailyPuzzle({ onBack }: { onBack: () => void }) {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [board, setBoard] = useState<BoardState>(createEmptyBoard(15));
  const [status, setStatus] = useState<"playing" | "won" | "failed">("playing");

  const puzzle = PUZZLES[puzzleIndex];

  useEffect(() => {
    resetPuzzle();
  }, [puzzleIndex]);

  const resetPuzzle = () => {
    const newBoard = createEmptyBoard(15);
    for (const move of PUZZLES[puzzleIndex].startingBoard) {
      newBoard[move.row][move.col] = move.player;
    }
    setBoard(newBoard);
    setStatus("playing");
  };

  const handleCellClick = (row: number, col: number) => {
    if (status !== "playing" || board[row][col] !== null) return;

    // Check if it matches solution
    const sol = puzzle.solution[0]; // simplistic single move check

    const newBoard = [...board];
    newBoard[row] = [...board[row]];
    newBoard[row][col] = puzzle.playerSide;
    setBoard(newBoard);

    // Check win condition
    const isWin = checkWin(newBoard, row, col, puzzle.playerSide, false, false);
    if (isWin || (row === sol.row && col === sol.col)) {
      setStatus("won");
    } else {
      setStatus("failed");
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50 p-4 md:p-8">
      <header className="flex items-center mb-8 shrink-0 relative">
        <button
          onClick={onBack}
          className="p-2 hover:bg-zinc-200 rounded-full transition-colors z-10"
        >
          <ChevronLeft size={24} />
        </button>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h2 className="text-xl font-bold bg-white px-4 py-1 rounded-full shadow-sm">
            Daily Puzzles
          </h2>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-4xl mx-auto">
        <div className="mb-6 text-center">
          <h3 className="text-2xl font-black mb-2">
            Puzzle #{puzzleIndex + 1}
          </h3>
          <p className="text-zinc-500 font-semibold">
            Play as <span className="capitalize">{puzzle.playerSide}</span>.
            Find the winning move!
          </p>

          {status === "won" && (
            <div className="mt-4 px-6 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-full inline-flex items-center gap-2">
              🎉 Correct! You found the winning sequence.
            </div>
          )}
          {status === "failed" && (
            <div className="mt-4 px-6 py-2 bg-rose-100 text-rose-700 font-bold rounded-full inline-flex items-center gap-2">
              ❌ Not quite.{" "}
              <button
                onClick={resetPuzzle}
                className="underline hover:text-rose-900"
              >
                Try again
              </button>
            </div>
          )}
        </div>

        <div className="w-full flex-1 sm:flex-none h-full sm:h-auto sm:max-w-[min(80vw,60vh)] sm:aspect-square relative flex items-center justify-center bg-white p-4 rounded-3xl shadow-xl border border-zinc-100">
          <div
            className="w-full h-full max-h-full max-w-full flex items-center justify-center"
            style={{ containerType: "size" }}
          >
            <GomokuBoard board={board} onCellClick={handleCellClick} skin={SKINS[0]} />
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          {status !== "playing" && (
            <button
              onClick={resetPuzzle}
              className="px-6 py-3 bg-zinc-200 text-zinc-900 font-bold rounded-xl hover:bg-zinc-300 transition-colors flex items-center gap-2"
            >
              <RefreshCcw size={18} /> Retry
            </button>
          )}
          <button
            onClick={() => setPuzzleIndex((pid) => (pid + 1) % PUZZLES.length)}
            className="px-6 py-3 bg-zinc-900 text-white font-bold rounded-xl hover:bg-zinc-800 transition-colors"
          >
            Next Puzzle
          </button>
        </div>
      </main>
    </div>
  );
}
