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

export function checkWin(board: BoardState, row: number, col: number, player: Player, isRenju: boolean = false): [number, number][] | null {
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

    if (isRenju && player === 'black' && count > 5) {
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
