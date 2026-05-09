export interface MoveAnalysis {
  moveIndex: number;
  player: "black" | "white";
  scoreDifference: number;
  classification:
    | "best"
    | "good"
    | "inaccuracy"
    | "blunder"
    | "brilliant"
    | "normal";
}

import { BoardState, Player } from "./engine";
import { evaluateBoard } from "./ai";

export function analyzeGame(
  boardSize: number,
  moves: { row: number; col: number; player: Player }[],
): { analysis: MoveAnalysis[]; dataPoints: number[] } {
  const board: BoardState = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(null));

  const analysis: MoveAnalysis[] = [];
  const dataPoints: number[] = [0]; // starting eval is 0
  let previousEval = 0;

  for (let i = 0; i < moves.length; i++) {
    const move = moves[i];
    board[move.row][move.col] = move.player;

    // Evaluate from black's perspective
    const currentEval = evaluateBoard(board, "black", "white");

    let scoreDifference;
    if (move.player === "black") {
      scoreDifference = currentEval - previousEval;
    } else {
      scoreDifference = previousEval - currentEval; // white wants currentEval to be smaller than previousEval
    }

    let classification:
      | "best"
      | "good"
      | "inaccuracy"
      | "blunder"
      | "brilliant"
      | "normal" = "normal";

    if (scoreDifference > 5000) {
      classification = "brilliant";
    } else if (scoreDifference > 500) {
      classification = "good";
    } else if (scoreDifference < -5000) {
      classification = "blunder";
    } else if (scoreDifference < -500) {
      classification = "inaccuracy";
    } else {
      classification = "normal";
    }

    if (Math.abs(currentEval) > 50000) {
      if (scoreDifference > 50000) classification = "brilliant";
      else if (scoreDifference < -50000) classification = "blunder";
    }

    analysis.push({
      moveIndex: i,
      player: move.player,
      scoreDifference,
      classification,
    });

    // Smooth the points to a max range for graphing e.g. -100 to 100
    let normalizedTarget = Math.max(-100, Math.min(100, currentEval / 100));
    dataPoints.push(normalizedTarget);
    previousEval = currentEval;
  }

  return { analysis, dataPoints };
}
