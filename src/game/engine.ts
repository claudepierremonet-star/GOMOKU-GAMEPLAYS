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
