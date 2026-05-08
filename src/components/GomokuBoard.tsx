import React, { memo, useMemo, useRef, useEffect, useCallback } from 'react';
import { BoardState, Player, Threat } from '../game/engine';
import { motion } from 'motion/react';
import { Skin } from '../types';

interface GomokuCellProps {
  row: number;
  col: number;
  cell: Player | null;
  isWinningCell: boolean;
  isLastMove: boolean;
  isCoachMove: boolean;
  isThreatTarget: boolean;
  isThreatStone: boolean;
  isKeyboardCursor: boolean;
  skin: Skin;
  onCellClick: (row: number, col: number) => void;
}

const isHexColor = (str: string) => /^#([0-9A-F]{3}){1,2}$/i.test(str);

const GomokuCell = memo(({
  row,
  col,
  cell,
  isWinningCell,
  isLastMove,
  isCoachMove,
  isThreatTarget,
  isThreatStone,
  isKeyboardCursor,
  skin,
  onCellClick
}: GomokuCellProps) => {
  const stoneStyle = cell === 'black' ? skin.blackStone : skin.whiteStone;
  const isHex = stoneStyle ? isHexColor(stoneStyle) : false;

  return (
    <div
      className="relative flex items-center justify-center cursor-pointer hover:bg-black/5 rounded-full group"
      onClick={() => onCellClick(row, col)}
    >
      {/* Keyboard cursor indicator */}
      {isKeyboardCursor && (
        <div className="absolute w-full h-full rounded-full border-[3px] border-indigo-500/80 shadow-[0_0_8px_rgba(99,102,241,0.6)] z-20" />
      )}

      {/* Hover indicator */}
      {!cell && !isCoachMove && !isThreatTarget && (
        <div className="absolute w-3/4 h-3/4 rounded-full opacity-0 group-hover:opacity-30 bg-black/20 transition-opacity" />
      )}

      {/* Threat Target Indicator */}
      {!cell && isThreatTarget && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute w-[85%] h-[85%] rounded-full border-4 border-red-500/50 flex items-center justify-center bg-red-500/10 z-10"
        >
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
        </motion.div>
      )}

      {/* Coach Move Indicator */}
      {!cell && isCoachMove && !isThreatTarget && (
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
        <div
          className={`absolute w-[85%] h-[85%] rounded-full shadow-md transition-all duration-500 ${!isHex ? stoneStyle : ''} ${isLastMove ? 'animate-[stone-drop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]' : ''}`}
          style={isHex ? { backgroundColor: stoneStyle } : {}}
        >
          {/* Highlight for last move */}
          {isLastMove && (
            <div className={`absolute inset-0 rounded-full border-2 ${cell === 'black' ? 'border-white/50' : 'border-black/50'} scale-75 opacity-50`} />
          )}

          {/* Highlight for winning line */}
          {isWinningCell && (
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full bg-yellow-400 border-2 border-yellow-200 z-10 mix-blend-screen" 
            />
          )}
          {/* Highlight for threat stone */}
          {isThreatStone && !isWinningCell && (
            <div className="absolute inset-0 rounded-full bg-red-500/30 animate-pulse" />
          )}
        </div>
      )}
    </div>
  );
});

interface GomokuBoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number, isAiMove?: boolean) => void;
  winningLine: [number, number][] | null;
  lastMove: { row: number; col: number } | null;
  coachMove?: { row: number; col: number } | null;
  keyboardCursor?: { row: number; col: number } | null;
  skin: Skin;
  threats?: Threat[];
}

export const GomokuBoard = memo(function GomokuBoard({ board, onCellClick, winningLine, lastMove, coachMove, keyboardCursor, skin, threats = [] }: GomokuBoardProps) {
  const rows = board.length;
  const cols = board[0]?.length || 0;

  // Stable callback for cell clicks to prevent re-renders of memoized cells
  const onCellClickRef = useRef(onCellClick);
  useEffect(() => {
    onCellClickRef.current = onCellClick;
  }, [onCellClick]);

  const handleCellClick = useCallback((row: number, col: number) => {
    onCellClickRef.current(row, col);
  }, []);

  // Pre-calculate sets for O(1) lookups during render
  const { threatTargets, threatStones, winningCells } = useMemo(() => {
    const targets = new Set<string>();
    const stones = new Set<string>();
    const winning = new Set<string>();

    threats.forEach(t => {
      t.targets.forEach(([tr, tc]) => targets.add(`${tr}-${tc}`));
      t.stones.forEach(([sr, sc]) => stones.add(`${sr}-${sc}`));
    });

    winningLine?.forEach(([wr, wc]) => winning.add(`${wr}-${wc}`));

    return { threatTargets: targets, threatStones: stones, winningCells: winning };
  }, [threats, winningLine]);

  return (
    <div 
      className={`relative mx-auto rounded-sm shadow-xl p-1 sm:p-2 md:p-4 transition-colors duration-500`}
      style={{ 
        backgroundColor: skin.boardColor, 
        aspectRatio: `${cols}/${rows}`,
        width: `min(100cqw, 100cqh * ${cols / rows})`,
        height: `min(100cqh, 100cqw * ${rows / cols})`,
        maxHeight: '100%',
        maxWidth: '100%',
      }}
    >
      {/* Grid Lines */}
      <div className="absolute inset-0 p-2 sm:p-4 md:p-6 pointer-events-none">
        <div className="w-full h-full relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols - 1}, 1fr)`, gridTemplateRows: `repeat(${rows - 1}, 1fr)` }}>
          {Array.from({ length: rows - 1 }).map((_, r) =>
            Array.from({ length: cols - 1 }).map((_, c) => (
              <div key={`${r}-${c}`} className="border-t border-l" style={{
                borderTopColor: skin.lineColor,
                borderLeftColor: skin.lineColor,
                borderRightColor: skin.lineColor,
                borderBottomColor: skin.lineColor,
                borderRightWidth: c === cols - 2 ? '1px' : '0px',
                borderBottomWidth: r === rows - 2 ? '1px' : '0px',
                borderRightStyle: 'solid',
                borderBottomStyle: 'solid',
              }} />
            ))
          )}
        </div>
      </div>

      {/* Star Points (Hoshi) */}
      {(rows === 15 && cols === 15 || rows === 19 && cols === 19 || rows === 13 && cols === 13) && (
        <div className="absolute inset-0 p-2 sm:p-4 md:p-6 pointer-events-none">
          <div className="w-full h-full relative">
            {(rows === 15 ? [
              [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
            ] : rows === 19 ? [
              [3, 3], [3, 9], [3, 15],
              [9, 3], [9, 9], [9, 15],
              [15, 3], [15, 9], [15, 15]
            ] : [
              [3, 3], [3, 9], [9, 3], [9, 9], [6, 6]
            ]).map(([r, c], i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  top: `${(r / (rows - 1)) * 100}%`,
                  left: `${(c / (cols - 1)) * 100}%`,
                  backgroundColor: skin.lineColor,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Interactive Cells */}
      <div className="absolute inset-0 p-0 sm:p-2 md:p-4">
        <div className="w-full h-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const cellKey = `${r}-${c}`;
              const isWinningCell = winningCells.has(cellKey);
              const isLastMove = lastMove?.row === r && lastMove?.col === c;
              const isCoachMove = coachMove?.row === r && coachMove?.col === c;
              const isThreatTarget = threatTargets.has(cellKey);
              const isThreatStone = threatStones.has(cellKey);

              return (
                <GomokuCell
                  key={cellKey}
                  row={r}
                  col={c}
                  cell={cell}
                  isWinningCell={isWinningCell}
                  isLastMove={isLastMove}
                  isCoachMove={isCoachMove}
                  isThreatTarget={isThreatTarget}
                  isThreatStone={isThreatStone}
                  isKeyboardCursor={keyboardCursor?.row === r && keyboardCursor?.col === c}
                  skin={skin}
                  onCellClick={handleCellClick}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
});
