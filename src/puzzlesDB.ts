import { Puzzle } from "./types";

export const PUZZLES: Puzzle[] = [
  {
    id: "1",
    title: "The Straight Four",
    description: "Complete a straight row of five to secure victory instantly.",
    difficulty: "Easy",
    movesToWin: 1,
    playerSide: "black",
    startingBoard: [
      { row: 7, col: 5, player: "black" },
      { row: 7, col: 6, player: "black" },
      { row: 7, col: 7, player: "black" },
      { row: 7, col: 8, player: "black" },
      { row: 6, col: 7, player: "white" },
      { row: 8, col: 7, player: "white" },
    ],
    solution: [{ row: 7, col: 4 }], // or {row: 7, col: 9}
    hints: ["Look for the horizontal line.", "You have four in a row!"],
    reward: 50,
  },
  {
    id: "2",
    title: "Double Three Trap",
    description: "Create two intersecting rows of three that your opponent cannot block.",
    difficulty: "Medium",
    movesToWin: 1,
    playerSide: "black",
    startingBoard: [
      { row: 5, col: 7, player: "black" },
      { row: 6, col: 7, player: "black" },
      { row: 7, col: 5, player: "black" },
      { row: 7, col: 6, player: "black" },
      { row: 5, col: 5, player: "white" },
      { row: 8, col: 8, player: "white" },
    ],
    solution: [{ row: 7, col: 7 }],
    hints: ["Find the intersection point.", "Think about future overlapping threats."],
    reward: 100,
  },
  {
    id: "3",
    title: "The Cross Kill",
    description: "Find the hidden winning move that blocks a potential threat while setting up your own.",
    difficulty: "Hard",
    movesToWin: 1,
    playerSide: "black",
    startingBoard: [
      { row: 7, col: 7, player: "black" },
      { row: 8, col: 8, player: "black" },
      { row: 9, col: 9, player: "black" },
      { row: 7, col: 9, player: "white" },
      { row: 8, col: 9, player: "white" },
      { row: 6, col: 9, player: "white" },
    ],
    solution: [{ row: 6, col: 6 }],
    hints: ["Check the diagonal.", "Don't let them complete their line."],
    reward: 200,
  }
];

// More realistic puzzles
export const REAL_PUZZLES: Puzzle[] = [
  ...PUZZLES,
  {
    id: "daily_1",
    title: "The Silent Five",
    description: "Your opponent is distracted. Can you spot the immediate win?",
    difficulty: "Easy",
    movesToWin: 1,
    playerSide: "black",
    startingBoard: [
      { row: 4, col: 4, player: "black" },
      { row: 5, col: 5, player: "black" },
      { row: 6, col: 6, player: "black" },
      { row: 7, col: 7, player: "black" },
      { row: 4, col: 5, player: "white" },
      { row: 5, col: 6, player: "white" },
      { row: 6, col: 7, player: "white" },
    ],
    solution: [{ row: 8, col: 8 }],
    hints: ["Check the main diagonal.", "Four stones are already aligned."],
    reward: 75,
  },
  {
    id: "daily_2",
    title: "Renju Opening",
    description: "In Renju, certain moves are restricted for black. Find the valid win.",
    difficulty: "Medium",
    movesToWin: 1,
    playerSide: "black",
    startingBoard: [
      { row: 7, col: 7, player: "black" },
      { row: 7, col: 8, player: "black" },
      { row: 7, col: 9, player: "black" },
      { row: 6, col: 7, player: "white" },
      { row: 8, col: 7, player: "white" },
    ],
    solution: [{ row: 7, col: 6 }],
    hints: ["Horizontal completion.", "Watch out for blocked ends."],
    reward: 125,
  }
];
