import React, { useState, useEffect, useMemo } from "react";
import { 
  ChevronLeft, 
  RefreshCcw, 
  Lightbulb, 
  Trophy, 
  ChevronRight, 
  MessageCircle,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { GomokuBoard } from "./GomokuBoard";
import { GomokuBoard3D } from "./GomokuBoard3D";
import { BoardState, createEmptyBoard, checkWin, Player } from "../game/engine";
import { SKINS, UserProfile, Puzzle } from '../types';
import { REAL_PUZZLES } from '../puzzlesDB';
import { toast } from "sonner";
import confetti from "canvas-confetti";

interface DailyPuzzleProps {
  onBack: () => void;
  userProfile: UserProfile | null;
  onUpdateProfile: (updates: Partial<UserProfile>) => void;
  is3D?: boolean;
}

export function DailyPuzzle({ onBack, userProfile, onUpdateProfile, is3D = false }: DailyPuzzleProps) {
  const [puzzleIndex, setPuzzleIndex] = useState(() => {
    // Pick a puzzle based on the current date
    const day = new Date().getUTCDate();
    const month = new Date().getUTCMonth();
    const year = new Date().getUTCFullYear();
    const seed = day + month * 31 + year * 366;
    return seed % REAL_PUZZLES.length;
  });
  const [board, setBoard] = useState<BoardState>(createEmptyBoard(15));
  const [status, setStatus] = useState<"playing" | "won" | "failed">("playing");
  const [showHint, setShowHint] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [history, setHistory] = useState<{row: number, col: number}[]>([]);

  const puzzle = REAL_PUZZLES[puzzleIndex];

  const isCompleted = useMemo(() => {
    return userProfile?.completedPuzzles?.some(p => p.puzzleId === puzzle.id);
  }, [userProfile, puzzle.id]);

  useEffect(() => {
    resetPuzzle();
  }, [puzzleIndex]);

  const resetPuzzle = () => {
    const newBoard = createEmptyBoard(15);
    for (const move of puzzle.startingBoard) {
      newBoard[move.row][move.col] = move.player;
    }
    setBoard(newBoard);
    setStatus("playing");
    setShowHint(false);
    setHintLevel(0);
    setHistory([]);
  };

  const handleCellClick = (row: number, col: number) => {
    if (status !== "playing" || board[row][col] !== null) return;

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = puzzle.playerSide;
    setBoard(newBoard);
    setHistory([...history, { row, col }]);

    // Check if it matches the current move in solution
    const currentMoveIndex = history.length;
    const expectedMove = puzzle.solution[currentMoveIndex];

    if (row === expectedMove.row && col === expectedMove.col) {
      if (currentMoveIndex === puzzle.solution.length - 1) {
        // Solved!
        handleWin();
      } else {
        // Correct so far, but need more moves (if we implement multi-move)
        // For now PUZZLES are mostly 1 move
        handleWin(); 
      }
    } else {
      // Check if they won anyway (alternative solution)
      const isWin = checkWin(newBoard, row, col, puzzle.playerSide, false, false);
      if (isWin) {
        handleWin();
      } else {
        setStatus("failed");
        toast.error("Not exactly what we were looking for. Try again!");
      }
    }
  };

  const handleWin = () => {
    setStatus("won");
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#4f46e5', '#10b981', '#f59e0b', '#ef4444']
    });

    if (!isCompleted) {
      const reward = puzzle.reward;
      const completedPuzzleEntry = {
        puzzleId: puzzle.id,
        completedAt: Date.now(),
        rewardClaimed: true
      };

      onUpdateProfile({
        zenCoins: (userProfile?.zenCoins || 0) + reward,
        completedPuzzles: [...(userProfile?.completedPuzzles || []), completedPuzzleEntry]
      });

      toast.success(`Puzzle Solved! You earned ${reward} Zen Coins!`, {
        icon: <Zap className="text-amber-500" />
      });
    }
  };

  const handleNext = () => {
    setPuzzleIndex((pid) => (pid + 1) % REAL_PUZZLES.length);
  };

  const handleHint = () => {
    if (hintLevel < puzzle.hints.length) {
      setHintLevel(prev => prev + 1);
      setShowHint(true);
    } else {
      toast.info("No more hints available!");
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50 overflow-y-auto custom-scrollbar">
      <header className="flex items-center justify-between p-6 shrink-0 bg-white/80 backdrop-blur-md border-b border-zinc-100 sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-3 bg-zinc-100 hover:bg-zinc-200 rounded-2xl transition-colors text-zinc-600"
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h2 className="text-2xl font-black tracking-tighter text-zinc-900">Daily Challenge</h2>
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest">Master the Board</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-2xl border border-amber-100 font-bold text-sm shadow-sm">
            <Zap size={16} fill="currentColor" />
            {(userProfile?.zenCoins || 0).toLocaleString()}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center w-full max-w-5xl mx-auto p-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full items-center">
          {/* Left Side: Puzzle Info */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  puzzle.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-700' :
                  puzzle.difficulty === 'Medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {puzzle.difficulty}
                </span>
                {isCompleted && (
                  <span className="flex items-center gap-1 bg-zinc-900 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={10} /> Completed
                  </span>
                )}
              </div>
              <h1 className="text-5xl font-black tracking-tighter text-zinc-900 leading-none">
                {puzzle.title}
              </h1>
              <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                {puzzle.description}
              </p>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-xl shadow-zinc-200/50 space-y-4">
              <div className="flex items-center justify-between text-sm font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-50 pb-4">
                <span>Objective</span>
                <span className="text-zinc-900">Solve in {puzzle.movesToWin} moves</span>
              </div>

              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${
                  puzzle.playerSide === 'black' ? 'bg-zinc-900' : 'bg-zinc-100 border border-zinc-200'
                }`}>
                  <div className={`w-8 h-8 rounded-full shadow-lg ${
                    puzzle.playerSide === 'black' 
                    ? 'bg-gradient-to-br from-zinc-700 to-black' 
                    : 'bg-gradient-to-br from-white to-zinc-200'
                  }`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Playing As</p>
                  <p className="text-lg font-black text-zinc-900 capitalize">{puzzle.playerSide}</p>
                </div>
              </div>

              <AnimatePresence>
                {showHint && hintLevel > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-700 text-sm font-medium flex items-start gap-3"
                  >
                    <Lightbulb size={18} className="shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-xs uppercase tracking-widest mb-1 opacity-70">Hint Level {hintLevel}</p>
                      {puzzle.hints[hintLevel - 1]}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="pt-2 flex gap-3">
                <button
                  onClick={handleHint}
                  disabled={hintLevel >= puzzle.hints.length || status !== 'playing'}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl font-black text-zinc-900 transition-all active:scale-95"
                >
                  <Lightbulb size={20} />
                  Get Hint
                </button>
                <button
                  onClick={resetPuzzle}
                  className="p-4 bg-zinc-100 hover:bg-zinc-200 rounded-2xl text-zinc-900 transition-all active:scale-95"
                >
                  <RefreshCcw size={20} />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                    <Zap size={20} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Reward</p>
                    <p className="text-xl font-black text-emerald-700">+{puzzle.reward} <span className="text-sm font-bold">Zen Coins</span></p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Side: Game Board */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="relative w-full max-w-[500px] aspect-square p-2 sm:p-4 bg-zinc-900 rounded-[2.5rem] shadow-2xl shadow-zinc-900/40">
              {/* Status Overlay */}
              <AnimatePresence>
                {status !== "playing" && (
                  <motion.div
                    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    animate={{ opacity: 1, backdropFilter: 'blur(4px)' }}
                    exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                    className="absolute inset-4 z-10 rounded-[2rem] flex items-center justify-center overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-black/40" />
                    <motion.div
                      initial={{ scale: 0.8, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className={`relative z-20 text-center p-8 rounded-[2rem] shadow-2xl ${
                        status === 'won' ? 'bg-emerald-500' : 'bg-rose-500'
                      } text-white`}
                    >
                      {status === 'won' ? (
                        <>
                          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                            <Trophy size={40} />
                          </div>
                          <h2 className="text-4xl font-black tracking-tighter mb-2">Victory!</h2>
                          <p className="font-bold text-white/80 mb-6">You masterfully solved the challenge.</p>
                          <button
                            onClick={handleNext}
                            className="bg-white text-emerald-600 px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-zinc-50 transition-colors active:scale-95 flex items-center justify-center gap-2 mx-auto"
                          >
                            Next Challenge <ChevronRight size={20} />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white/30">
                            <AlertCircle size={40} />
                          </div>
                          <h2 className="text-4xl font-black tracking-tighter mb-2">Failed</h2>
                          <p className="font-bold text-white/80 mb-6">That wasn't the winning line. Try again!</p>
                          <button
                            onClick={resetPuzzle}
                            className="bg-white text-rose-600 px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-zinc-50 transition-colors active:scale-95 flex items-center justify-center gap-2 mx-auto"
                          >
                            <RefreshCcw size={20} /> Try Again
                          </button>
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-full h-full" style={{ containerType: "size" }}>
                {is3D ? (
                  <GomokuBoard3D
                    board={board}
                    onCellClick={handleCellClick}
                    winningLine={null}
                    lastMove={history.length > 0 ? history[history.length - 1] : null}
                    skin={SKINS[0]}
                  />
                ) : (
                  <GomokuBoard 
                    board={board} 
                    onCellClick={handleCellClick} 
                    skin={SKINS[0]} 
                    winningLine={null}
                    lastMove={status !== 'playing' ? (history.length > 0 ? history[history.length - 1] : null) : null}
                  />
                )}
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => setPuzzleIndex(prev => (prev - 1 + REAL_PUZZLES.length) % REAL_PUZZLES.length)}
                className="w-12 h-12 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                title="Previous Puzzle"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="px-6 py-3 bg-white rounded-2xl border border-zinc-200 font-black text-zinc-900 min-w-[120px] text-center shadow-sm">
                Puzzle {puzzleIndex + 1} / {REAL_PUZZLES.length}
              </div>
              <button
                onClick={handleNext}
                className="w-12 h-12 bg-white rounded-2xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 transition-colors"
                title="Next Puzzle"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Footer / Stats */}
      <footer className="p-8 bg-zinc-900 text-white mt-auto">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
              <Trophy size={24} className="text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Monthly Rank</p>
              <h4 className="text-xl font-black text-white">Tactical Grandmaster</h4>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Puzzles Solved</p>
              <p className="text-2xl font-black">{userProfile?.completedPuzzles?.length || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Rewards</p>
              <p className="text-2xl font-black text-amber-400">
                {(userProfile?.completedPuzzles?.reduce((acc, p) => acc + (REAL_PUZZLES.find(pz => pz.id === p.puzzleId)?.reward || 0), 0) || 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
