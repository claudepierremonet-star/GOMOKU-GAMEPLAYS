import React from 'react';
import { BoardState, Player } from '../game/engine';
import { motion } from 'motion/react';
import { Skin } from '../types';

interface GomokuBoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number, isAiMove?: boolean) => void;
  winningLine: [number, number][] | null;
  lastMove: { row: number; col: number } | null;
  coachMove?: { row: number; col: number } | null;
  skin: Skin;
}

export function GomokuBoard({ board, onCellClick, winningLine, lastMove, coachMove, skin }: GomokuBoardProps) {
  const size = board.length;

  return (
    <div 
      className="relative aspect-square w-full max-w-[600px] mx-auto rounded-sm shadow-xl p-2 md:p-4 transition-colors duration-500"
      style={{ backgroundColor: skin.boardColor }}
    >
      {/* Grid Lines */}
      <div className="absolute inset-0 p-4 md:p-6 pointer-events-none">
        <div className="w-full h-full relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${size - 1}, 1fr)`, gridTemplateRows: `repeat(${size - 1}, 1fr)` }}>
          {Array.from({ length: size - 1 }).map((_, r) =>
            Array.from({ length: size - 1 }).map((_, c) => (
              <div key={`${r}-${c}`} className="border-t border-l" style={{
                borderColor: skin.lineColor,
                borderRight: c === size - 2 ? `1px solid ${skin.lineColor}` : 'none',
                borderBottom: r === size - 2 ? `1px solid ${skin.lineColor}` : 'none',
              }} />
            ))
          )}
        </div>
      </div>

      {/* Star Points (Hoshi) */}
      {(size === 15 || size === 19) && (
        <div className="absolute inset-0 p-4 md:p-6 pointer-events-none">
          <div className="w-full h-full relative">
            {(size === 15 ? [
              [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
            ] : [
              [3, 3], [3, 9], [3, 15],
              [9, 3], [9, 9], [9, 15],
              [15, 3], [15, 9], [15, 15]
            ]).map(([r, c], i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-black/60 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: `${(r / (size - 1)) * 100}%`,
                  left: `${(c / (size - 1)) * 100}%`
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Interactive Cells */}
      <div className="absolute inset-0 p-2 md:p-4">
        <div className="w-full h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, 1fr)`, gridTemplateRows: `repeat(${size}, 1fr)` }}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isWinningCell = winningLine?.some(([wr, wc]) => wr === r && wc === c);
              const isLastMove = lastMove?.row === r && lastMove?.col === c;
              const isCoachMove = coachMove?.row === r && coachMove?.col === c;

              return (
                <div
                  key={`${r}-${c}`}
                  className="relative flex items-center justify-center cursor-pointer hover:bg-black/5 rounded-full group"
                  onClick={() => onCellClick(r, c)}
                >
                  {/* Hover indicator */}
                  {!cell && !isCoachMove && (
                    <div className="absolute w-3/4 h-3/4 rounded-full opacity-0 group-hover:opacity-30 bg-black/20 transition-opacity" />
                  )}

                  {/* Coach Move Indicator */}
                  {!cell && isCoachMove && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="absolute w-[85%] h-[85%] rounded-full border-4 border-emerald-500/50 flex items-center justify-center bg-emerald-500/10"
                    >
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    </motion.div>
                  )}

                  {/* Stone */}
                  {cell && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`absolute w-[85%] h-[85%] rounded-full shadow-md transition-all duration-500 ${
                        cell === 'black' ? skin.blackStone : skin.whiteStone
                      }`}
                    >
                      {/* Highlight for last move */}
                      {isLastMove && (
                        <div className={`absolute inset-0 rounded-full border-2 ${cell === 'black' ? 'border-white/50' : 'border-black/50'} scale-75 opacity-50`} />
                      )}
                      {/* Highlight for winning line */}
                      {isWinningCell && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ repeat: Infinity, duration: 1.5 }}
                          className="absolute inset-0 rounded-full bg-yellow-400/40"
                        />
                      )}
                    </motion.div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
