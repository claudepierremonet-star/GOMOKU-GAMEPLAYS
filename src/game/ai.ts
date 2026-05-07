import { BoardState, Player, checkWin, getForbiddenMoveReason, findThreats, RenjuRules } from './engine';

export type Difficulty = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master' | 'Grandmaster';

function getAdjacentMoves(board: BoardState, distance: number = 1): {r: number, c: number}[] {
  const size = board.length;
  const moves: {r: number, c: number}[] = [];
  const hasStone = (r: number, c: number) => {
    for (let dr = -distance; dr <= distance; dr++) {
      for (let dc = -distance; dc <= distance; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] !== null) {
          return true;
        }
      }
    }
    return false;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === null && hasStone(r, c)) {
        moves.push({r, c});
      }
    }
  }
  return moves;
}

export function evaluateBoard(board: BoardState, aiPlayer: Player, humanPlayer: Player): number {
  const size = board.length;
  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const player = board[r][c];
      if (player === null) continue;
      
      const multiplier = player === aiPlayer ? 1 : -1;
      
      for (const [dr, dc] of directions) {
        const prevR = r - dr;
        const prevC = c - dc;
        if (prevR >= 0 && prevR < size && prevC >= 0 && prevC < size && board[prevR][prevC] === player) {
          continue; 
        }
        
        let consecutive = 1;
        let openEnds = 0;
        
        if (prevR >= 0 && prevR < size && prevC >= 0 && prevC < size && board[prevR][prevC] === null) {
          openEnds++;
        }
        
        let i = 1;
        while (true) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
          if (board[nr][nc] === player) {
            consecutive++;
          } else if (board[nr][nc] === null) {
            openEnds++;
            break;
          } else {
            break;
          }
          i++;
        }
        
        if (consecutive >= 5) score += multiplier * 100000;
        else if (consecutive === 4) score += multiplier * (openEnds === 2 ? 10000 : (openEnds === 1 ? 1000 : 0));
        else if (consecutive === 3) score += multiplier * (openEnds === 2 ? 1000 : (openEnds === 1 ? 100 : 0));
        else if (consecutive === 2) score += multiplier * (openEnds === 2 ? 100 : (openEnds === 1 ? 10 : 0));
      }
    }
  }
  return score;
}

function getGreedyScore(board: BoardState, r: number, c: number, aiPlayer: Player, humanPlayer: Player): number {
  const size = board.length;
  let score = 0;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  const evaluateLine = (player: Player) => {
    let lineScore = 0;
    for (const [dr, dc] of directions) {
      let consecutive = 1;
      let openEnds = 0;
      
      let i = 1;
      while (true) {
        const nr = r + dr * i;
        const nc = c + dc * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
        if (board[nr][nc] === player) consecutive++;
        else if (board[nr][nc] === null) { openEnds++; break; }
        else break;
        i++;
      }
      
      i = 1;
      while (true) {
        const nr = r - dr * i;
        const nc = c - dc * i;
        if (nr < 0 || nr >= size || nc < 0 || nc >= size) break;
        if (board[nr][nc] === player) consecutive++;
        else if (board[nr][nc] === null) { openEnds++; break; }
        else break;
        i++;
      }
      
      if (consecutive >= 5) lineScore += 100000;
      else if (consecutive === 4) lineScore += openEnds === 2 ? 10000 : (openEnds === 1 ? 1000 : 0);
      else if (consecutive === 3) lineScore += openEnds === 2 ? 1000 : (openEnds === 1 ? 100 : 0);
      else if (consecutive === 2) lineScore += openEnds === 2 ? 100 : (openEnds === 1 ? 10 : 0);
    }
    return lineScore;
  };

  const attackScore = evaluateLine(aiPlayer);
  const defenseScore = evaluateLine(humanPlayer);
  
  return attackScore + defenseScore * 0.9;
}

export function getBestMove(
  board: BoardState, 
  aiPlayer: Player, 
  difficulty: Difficulty, 
  isRenju: boolean = false,
  rules: RenjuRules = { doubleThree: true, doubleFour: true, overline: true }
): { row: number; col: number } {
  const size = board.length;
  const humanPlayer = aiPlayer === 'black' ? 'white' : 'black';
  
  let isEmpty = true;
  for(let r=0; r<size; r++) {
    for(let c=0; c<size; c++) {
      if(board[r][c] !== null) { isEmpty = false; break; }
    }
    if(!isEmpty) break;
  }
  if (isEmpty) return { row: Math.floor(size/2), col: Math.floor(size/2) };

  const candidateMoves = getAdjacentMoves(board, 2).filter(move => {
    if (isRenju && aiPlayer === 'black') {
       return !getForbiddenMoveReason(board, move.r, move.c, aiPlayer, rules);
    }
    return true;
  });
  
  if (candidateMoves.length === 0) {
    // If all adjacent moves are forbidden, pick any valid move
    for(let r=0; r<size; r++) {
      for(let c=0; c<size; c++) {
        if(board[r][c] === null) {
          if (isRenju && aiPlayer === 'black') {
            if (!getForbiddenMoveReason(board, r, c, aiPlayer, rules)) return {row: r, col: c};
          } else {
            return {row: r, col: c};
          }
        }
      }
    }
    // Final fallback
    for(let r=0; r<size; r++) {
      for(let c=0; c<size; c++) {
        if(board[r][c] === null) return {row: r, col: c};
      }
    }
  }

  const scoredMoves = candidateMoves.map(move => ({
    ...move,
    score: getGreedyScore(board, move.r, move.c, aiPlayer, humanPlayer)
  }));

  scoredMoves.sort((a, b) => b.score - a.score);

  if (difficulty === 'Beginner') {
    const pool = scoredMoves.slice(0, Math.min(10, scoredMoves.length));
    const move = pool[Math.floor(Math.random() * pool.length)];
    return { row: move.r, col: move.c };
  }

  if (difficulty === 'Intermediate') {
    const pool = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
    const move = pool[Math.floor(Math.random() * pool.length)];
    return { row: move.r, col: move.c };
  }

  if (difficulty === 'Advanced') {
    const bestScore = scoredMoves[0].score;
    const bestMoves = scoredMoves.filter(m => m.score === bestScore);
    const move = bestMoves[Math.floor(Math.random() * bestMoves.length)];
    return { row: move.r, col: move.c };
  }

  const depth = difficulty === 'Expert' ? 2 : (difficulty === 'Master' ? 3 : 5);
  
  function minimax(boardState: BoardState, depth: number, alpha: number, beta: number, isMaximizing: boolean): number {
    if (depth === 0) {
      return evaluateBoard(boardState, aiPlayer, humanPlayer);
    }

    const moves = getAdjacentMoves(boardState, 1);
    const currentPlayer = isMaximizing ? aiPlayer : humanPlayer;
    const otherPlayer = isMaximizing ? humanPlayer : aiPlayer;
    
    const orderedMoves = moves.map(m => ({
      ...m,
      score: getGreedyScore(boardState, m.r, m.c, currentPlayer, otherPlayer) + (Math.random() * 2) // Add small noise to avoid deterministic loops
    })).filter(m => {
       if (isRenju && currentPlayer === 'black') {
         return !getForbiddenMoveReason(boardState, m.r, m.c, currentPlayer, rules);
       }
       return true;
    }).sort((a, b) => b.score - a.score).slice(0, difficulty === 'Grandmaster' ? 12 : 8);

    if (orderedMoves.length === 0) return 0;

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of orderedMoves) {
        boardState[move.r][move.c] = aiPlayer;
        if (checkWin(boardState, move.r, move.c, aiPlayer, isRenju, rules.overline)) {
          boardState[move.r][move.c] = null;
          return 1000000 + depth;
        }
        const ev = minimax(boardState, depth - 1, alpha, beta, false);
        boardState[move.r][move.c] = null;
        maxEval = Math.max(maxEval, ev);
        alpha = Math.max(alpha, ev);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of orderedMoves) {
        boardState[move.r][move.c] = humanPlayer;
        if (checkWin(boardState, move.r, move.c, humanPlayer, isRenju, rules.overline)) {
          boardState[move.r][move.c] = null;
          return -1000000 - depth;
        }
        const ev = minimax(boardState, depth - 1, alpha, beta, true);
        boardState[move.r][move.c] = null;
        minEval = Math.min(minEval, ev);
        beta = Math.min(beta, ev);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  let bestVal = -Infinity;
  let bestMove = scoredMoves[0]; 
  
  const topMoves = scoredMoves.slice(0, 8);
  
  for (const move of topMoves) {
    board[move.r][move.c] = aiPlayer;
    if (checkWin(board, move.r, move.c, aiPlayer, isRenju, rules.overline)) {
      board[move.r][move.c] = null;
      return { row: move.r, col: move.c };
    }
    const moveVal = minimax(board, depth - 1, -Infinity, Infinity, false);
    board[move.r][move.c] = null;
    
    const randomizedMoveVal = moveVal + Math.random() * 0.1;
    
    if (randomizedMoveVal > bestVal) {
      bestVal = randomizedMoveVal;
      bestMove = move;
    }
  }

  return { row: bestMove.r, col: bestMove.c };
}

export function getCoachAdvice(
  board: BoardState, 
  player: Player, 
  isRenju: boolean = false,
  rules: RenjuRules = { doubleThree: true, doubleFour: true, overline: true }
): { row: number; col: number; explanation: string } {
  const size = board.length;
  const opponent = player === 'black' ? 'white' : 'black';
  
  // 1. Check if player can win immediately
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c]) {
        if (isRenju && player === 'black' && getForbiddenMoveReason(board, r, c, player, rules)) continue;
        const testBoard = board.map(row => [...row]);
        testBoard[r][c] = player;
        if (checkWin(testBoard, r, c, player, isRenju, rules.overline)) {
          return { 
            row: r, col: c, 
            explanation: "This move completes a line of 5 and wins the game instantly! Always look for these." 
          };
        }
      }
    }
  }

  // 2. Check if opponent can win immediately and block
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!board[r][c]) {
        // Opponent (white) usually doesn't have forbidden moves in Renju, but let's be careful
        const testBoard = board.map(row => [...row]);
        testBoard[r][c] = opponent;
        if (checkWin(testBoard, r, c, opponent, isRenju, rules.overline)) {
          return { 
            row: r, col: c, 
            explanation: "🚨 Danger! Your opponent has a line of four and will win on their next move. You must play here to block them." 
          };
        }
      }
    }
  }

  // 3. Use findThreats for more complex defensive/offensive advice
  const myThreatsBefore = findThreats(board, player);
  const opponentThreats = findThreats(board, opponent);
  
  // If opponent has an open three, we must block it
  const openThreeToBlock = opponentThreats.find(t => t.type === 'open-three');
  if (openThreeToBlock) {
    return {
      row: openThreeToBlock.targets[0][0],
      col: openThreeToBlock.targets[0][1],
      explanation: "🛡️ Defend! Your opponent has an 'Open Three' (three stones with empty ends). If you don't block one end now, they'll create an unstoppable line of four."
    };
  }

  // 4. Otherwise, use the Expert AI to find a strong move
  const move = getBestMove(board, player, 'Expert', isRenju, rules);
  
  // Let's do a quick evaluation of the move to give a contextual explanation
  const testBoard = board.map(row => [...row]);
  testBoard[move.row][move.col] = player;
  
  const myThreatsAfter = findThreats(testBoard, player);
  const newThreats = myThreatsAfter.filter(tAfter => 
    !myThreatsBefore.some(tBefore => 
      tBefore.type === tAfter.type && 
      tAfter.stones.every(sAfter => tBefore.stones.some(sBefore => sBefore[0] === sAfter[0] && sBefore[1] === sAfter[1]))
    )
  );

  if (newThreats.some(t => t.type === 'four')) {
    return {
      row: move.row, col: move.col,
      explanation: "⚔️ Attack! This move creates a 'Four'—a line of four stones. Your opponent will be forced to spend their next turn blocking you."
    };
  }

  if (newThreats.some(t => t.type === 'open-three')) {
    return {
      row: move.row, col: move.col,
      explanation: "✨ Brilliant! This move creates an 'Open Three'. Because it's open at both ends, it's very difficult for your opponent to stop the eventual line of five."
    };
  }

  return {
    row: move.row, col: move.col,
    explanation: "💡 Strategy: This move builds toward a strong formation. It occupies a valuable central spot that balances both your offensive growth and defensive security."
  };
}
