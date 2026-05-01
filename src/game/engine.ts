export type Player = 'black' | 'white' | null;
export type BoardState = Player[][];

export interface GameState {
  board: BoardState;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winningLine: [number, number][] | null;
  moveHistory: { row: number; col: number; player: Player }[];
}

export function createEmptyBoard(size: number = 15): BoardState {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

export function checkWin(board: BoardState, row: number, col: number, player: Player, isRenju: boolean = false, overlineForbidden: boolean = true): [number, number][] | null {
  const size = board.length;
  const directions = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal /
    [1, -1]  // Diagonal \
  ];

  for (const [dr, dc] of directions) {
    let count = 1;
    const line: [number, number][] = [[row, col]];

    // Check one direction
    for (let i = 1; i < size; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        count++;
        line.push([r, c]);
      } else {
        break;
      }
    }

    // Check opposite direction
    for (let i = 1; i < size; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        count++;
        line.push([r, c]);
      } else {
        break;
      }
    }

    if (isRenju && player === 'black' && count > 5 && overlineForbidden) {
      // Overline is a foul for black in Renju, so it doesn't count as a win
      continue;
    }

    if (count >= 5) {
      return line.slice(0, 5); // Return exactly 5 stones for the winning line
    }
  }

  return null;
}

export function isBoardFull(board: BoardState): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

export interface RenjuRules {
  doubleThree: boolean;
  doubleFour: boolean;
  overline: boolean;
}

/**
 * Checks if a move is forbidden under Renju rules (only for black).
 * Renju forbidden moves for Black:
 * 1. Double three: Creating two or more simultaneous open threes.
 * 2. Double four: Creating two or more simultaneous fours (including broken fours).
 * 3. Overline: Creating a line of 6 or more stones.
 */
export function getForbiddenMoveReason(
  board: BoardState, 
  row: number, 
  col: number, 
  player: Player,
  rules: RenjuRules = { doubleThree: true, doubleFour: true, overline: true }
): 'double-three' | 'double-four' | 'overline' | null {
  if (player !== 'black') return null;

  const size = board.length;
  const tempBoard = board.map(r => [...r]);
  tempBoard[row][col] = player;

  const directions = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal /
    [1, -1]  // Diagonal \
  ];

  // 1. Check Overline
  if (rules.overline) {
    for (const [dr, dc] of directions) {
      let count = 1;
      // Check one direction
      for (let i = 1; i < size; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (r >= 0 && r < size && c >= 0 && c < size && tempBoard[r][c] === 'black') count++;
        else break;
      }
      // Check opposite direction
      for (let i = 1; i < size; i++) {
        const r = row - dr * i;
        const c = col - dc * i;
        if (r >= 0 && r < size && c >= 0 && c < size && tempBoard[r][c] === 'black') count++;
        else break;
      }
      if (count > 5) return 'overline';
    }
  }

  // 2. Check Double Four
  if (rules.doubleFour) {
    let fourCount = 0;
    for (const [dr, dc] of directions) {
      // To detect multiple fours in the same direction, we look at windows of size 5 containing the new move
      // A "four" is a set of 5 points where 4 are black and 1 is empty, and placing black at that empty would make 5 in a row.
      
      // We check all possible lines of length 5 that pass through (row, col)
      // If placing a stone at an empty spot in that line would create exactly 5 (or more, but overline is forbidden...)
      
      let hasFourInDirection = false;
      for (let offset = -4; offset <= 0; offset++) {
        const window = [];
        let blackInWindow = 0;
        let nullInWindow = 0;
        let nullPos = null;
        let includesNewMove = false;

        for (let i = 0; i < 5; i++) {
          const r = row + dr * (offset + i);
          const c = col + dc * (offset + i);
          if (r >= 0 && r < size && c >= 0 && c < size) {
            if (r === row && c === col) includesNewMove = true;
            if (tempBoard[r][c] === 'black') blackInWindow++;
            else if (tempBoard[r][c] === null) {
              nullInWindow++;
              nullPos = {r, c};
            }
          } else {
            blackInWindow = -100; // invalid window
            break;
          }
        }

        if (includesNewMove && blackInWindow === 4 && nullInWindow === 1 && nullPos) {
          // This is a four IF placing a stone at nullPos creates EXACTLY 5 in a row (win)
          const checkBoard = tempBoard.map(r => [...r]);
          checkBoard[nullPos.r][nullPos.c] = 'black';
          
          // Find length of line through nullPos
          let winCount = 1;
          for (let i = 1; i < 6; i++) {
            const r = nullPos.r + dr * i;
            const c = nullPos.c + dc * i;
            if (r >= 0 && r < size && c >= 0 && c < size && checkBoard[r][c] === 'black') winCount++;
            else break;
          }
          for (let i = 1; i < 6; i++) {
            const r = nullPos.r - dr * i;
            const c = nullPos.c - dc * i;
            if (r >= 0 && r < size && c >= 0 && c < size && checkBoard[r][c] === 'black') winCount++;
            else break;
          }
          
          if (winCount === 5) {
            hasFourInDirection = true;
            break; 
          }
        }
      }
      if (hasFourInDirection) fourCount++;
    }
    if (fourCount >= 2) return 'double-four';
  }

  // 3. Check Double Three
  if (rules.doubleThree) {
    let threeCount = 0;
    for (const [dr, dc] of directions) {
      let isOpenThree = false;
      
      for (let offset = -5; offset <= 0; offset++) {
        const window = [];
        let blackInWindow = 0;
        let nullInWindow = 0;
        let includesNewMove = false;

        for (let i = 0; i < 6; i++) {
          const r = row + dr * (offset + i);
          const c = col + dc * (offset + i);
          if (r >= 0 && r < size && c >= 0 && c < size) {
            if (r === row && c === col) includesNewMove = true;
            window.push({r, c, p: tempBoard[r][c]});
            if (tempBoard[r][c] === 'black') blackInWindow++;
            else if (tempBoard[r][c] === null) nullInWindow++;
          } else {
            window.push({r, c, p: undefined});
          }
        }

        if (includesNewMove && blackInWindow === 3 && nullInWindow === 3) {
          if (window[0].p === null && window[5].p === null) {
            let middleB = 0;
            for(let i=1; i<5; i++) if (window[i].p === 'black') middleB++;
            
            if (middleB === 3) {
               let targetNull = null;
               for(let i=1; i<5; i++) if (window[i].p === null) targetNull = window[i];
               
               if (targetNull) {
                  const boardWithFour = tempBoard.map(r => [...r]);
                  boardWithFour[targetNull.r][targetNull.c] = 'black';
                  
                  if (window[0].p === null && window[5].p === null) {
                    isOpenThree = true;
                    break;
                  }
               }
            }
          }
        }
      }
      if (isOpenThree) threeCount++;
    }
    
    if (threeCount >= 2) return 'double-three';
  }

  return null;
}

export interface Threat {
  type: 'four' | 'open-three';
  stones: [number, number][];
  targets: [number, number][];
}

export function findThreats(board: BoardState, currentPlayer: Player): Threat[] {
  if (!currentPlayer) return [];
  
  const size = board.length;
  const opponent = currentPlayer === 'black' ? 'white' : 'black';
  const threats: Threat[] = [];

  const directions = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal /
    [1, -1]  // Diagonal \
  ];

  const getCell = (r: number, c: number) => {
    if (r >= 0 && r < size && c >= 0 && c < size) return board[r][c];
    return undefined;
  };

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      for (const [dr, dc] of directions) {
        // Find Fours (5-cell windows with 4 opponent stones and 1 null)
        const window5 = [];
        for (let i = 0; i < 5; i++) {
          window5.push({ player: getCell(r + dr * i, c + dc * i), r: r + dr * i, c: c + dc * i });
        }
        
        if (window5.every(cell => cell.player !== undefined)) {
          const opponentCount = window5.filter(cell => cell.player === opponent).length;
          const nullCount = window5.filter(cell => cell.player === null).length;
          if (opponentCount === 4 && nullCount === 1) {
            threats.push({
              type: 'four',
              stones: window5.filter(cell => cell.player === opponent).map(cell => [cell.r, cell.c] as [number, number]),
              targets: window5.filter(cell => cell.player === null).map(cell => [cell.r, cell.c] as [number, number])
            });
          }
        }

        // Find Open Threes (6-cell windows with null at ends, and 3 opponent + 1 null in middle)
        const window6 = [];
        for (let i = 0; i < 6; i++) {
          window6.push({ player: getCell(r + dr * i, c + dc * i), r: r + dr * i, c: c + dc * i });
        }

        if (window6.every(cell => cell.player !== undefined)) {
          if (window6[0].player === null && window6[5].player === null) {
            const middle4 = window6.slice(1, 5);
            const opponentCount = middle4.filter(cell => cell.player === opponent).length;
            const nullCount = middle4.filter(cell => cell.player === null).length;
            if (opponentCount === 3 && nullCount === 1) {
              threats.push({
                type: 'open-three',
                stones: middle4.filter(cell => cell.player === opponent).map(cell => [cell.r, cell.c] as [number, number]),
                targets: window6.filter(cell => cell.player === null).map(cell => [cell.r, cell.c] as [number, number])
              });
            }
          }
        }
      }
    }
  }

  return threats;
}
