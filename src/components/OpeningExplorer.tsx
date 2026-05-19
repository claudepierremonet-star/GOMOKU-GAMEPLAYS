import React, { useState } from "react";
import { ChevronRight, ChevronLeft, Search } from "lucide-react";
import { GomokuBoard } from "./GomokuBoard";
import { GomokuBoard3D } from "./GomokuBoard3D";
import { BoardState, createEmptyBoard, checkWin } from "../game/engine";

import { SKINS } from '../types';

interface Opening {
  id: string;
  name: string;
  description: string;
  type: "direct" | "indirect";
  moves: { row: number; col: number; player: "black" | "white" }[];
}

const OPENINGS: Opening[] = [
  {
    id: "D1",
    name: "Direct: Star",
    type: "direct",
    description: "Central start, white next to black, black next to white.",
    moves: [
      { row: 7, col: 7, player: "black" },
      { row: 7, col: 8, player: "white" },
      { row: 6, col: 8, player: "black" },
    ],
  },
  {
    id: "D2",
    name: "Direct: Canyon",
    type: "direct",
    description:
      "Black starts in the center, white plays vertically adjacent, black plays diagonally opposite.",
    moves: [
      { row: 7, col: 7, player: "black" },
      { row: 6, col: 7, player: "white" },
      { row: 8, col: 8, player: "black" },
    ],
  },
  {
    id: "I1",
    name: "Indirect: Zenith",
    type: "indirect",
    description: "Central start, white plays diagonal, black plays diagonal.",
    moves: [
      { row: 7, col: 7, player: "black" },
      { row: 6, col: 6, player: "white" },
      { row: 8, col: 8, player: "black" },
    ],
  },
  {
    id: "I2",
    name: "Indirect: Meteor",
    type: "indirect",
    description:
      "Central start, white plays diagonal, black plays far horse-jump.",
    moves: [
      { row: 7, col: 7, player: "black" },
      { row: 8, col: 8, player: "white" },
      { row: 6, col: 9, player: "black" },
    ],
  },
  {
    id: "D3",
    name: "Direct: Comet",
    type: "direct",
    description: "Black centers, white adjacent, black creates an L shape.",
    moves: [
      { row: 7, col: 7, player: "black" },
      { row: 7, col: 6, player: "white" },
      { row: 8, col: 7, player: "black" },
    ],
  },
];

export function OpeningExplorer({ onBack, is3D = false }: { onBack: () => void, is3D?: boolean }) {
  const [selectedOpening, setSelectedOpening] = useState<Opening | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOpenings = OPENINGS.filter((o) =>
    o.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const renderBoard = (opening: Opening) => {
    const board = createEmptyBoard(15);
    for (const move of opening.moves) {
      board[move.row][move.col] = move.player;
    }
    return (
      <div className="w-full aspect-square pointer-events-none">
        <div
          className="w-full h-full max-h-full max-w-full flex items-center justify-center transform scale-75 origin-top-left"
          style={{ containerType: "size" }}
        >
          {is3D ? (
            <GomokuBoard3D 
              board={board} 
              onCellClick={() => {}} 
              winningLine={null}
              lastMove={null}
              skin={SKINS[0]} 
            />
          ) : (
            <GomokuBoard 
              board={board} 
              onCellClick={() => {}} 
              skin={SKINS[0]} 
              winningLine={null}
              lastMove={null}
            />
          )}
        </div>
      </div>
    );
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
            Opening Explorer
          </h2>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-8 overflow-hidden h-full">
        <div className="w-full md:w-1/3 flex flex-col gap-4 min-h-0 bg-white p-4 rounded-3xl shadow-xl border border-zinc-100 h-full">
          <div className="relative shrink-0">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Search openings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-zinc-50 border border-zinc-200 text-sm font-semibold rounded-2xl focus:border-zinc-400 outline-none transition-colors"
            />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-2 mb-1 px-2">
              Direct Openings
            </h3>
            {filteredOpenings
              .filter((o) => o.type === "direct")
              .map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOpening(o)}
                  className={`p-3 rounded-2xl flex items-center justify-between text-left transition-colors ${selectedOpening?.id === o.id ? "bg-zinc-900 justify-between text-white shadow-lg" : "hover:bg-zinc-50 text-zinc-700"}`}
                >
                  <span className="font-semibold">{o.name}</span>
                  <ChevronRight
                    size={16}
                    className={
                      selectedOpening?.id === o.id
                        ? "text-zinc-500"
                        : "text-zinc-300"
                    }
                  />
                </button>
              ))}

            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-4 mb-1 px-2">
              Indirect Openings
            </h3>
            {filteredOpenings
              .filter((o) => o.type === "indirect")
              .map((o) => (
                <button
                  key={o.id}
                  onClick={() => setSelectedOpening(o)}
                  className={`p-3 rounded-2xl flex items-center justify-between text-left transition-colors ${selectedOpening?.id === o.id ? "bg-zinc-900 justify-between text-white shadow-lg" : "hover:bg-zinc-50 text-zinc-700"}`}
                >
                  <span className="font-semibold">{o.name}</span>
                  <ChevronRight
                    size={16}
                    className={
                      selectedOpening?.id === o.id
                        ? "text-zinc-500"
                        : "text-zinc-300"
                    }
                  />
                </button>
              ))}
          </div>
        </div>

        <div className="flex-1 bg-white p-4 md:p-8 rounded-3xl shadow-xl flex items-center justify-center border border-zinc-100 flex-col">
          {selectedOpening ? (
            <div className="w-full h-full flex flex-col items-center">
              <div className="text-center mb-6 shrink-0">
                <span className="px-3 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-bold uppercase tracking-widest mb-2 inline-block">
                  {selectedOpening.type} OPENING
                </span>
                <h3 className="text-3xl font-black">{selectedOpening.name}</h3>
                <p className="text-zinc-500 mt-2 max-w-md mx-auto">
                  {selectedOpening.description}
                </p>
              </div>

              <div className="flex-1 w-full max-w-md aspect-square relative flex items-center justify-center">
                <div
                  className="w-full h-full max-h-full max-w-full flex items-center justify-center pointer-events-none"
                  style={{ containerType: "size" }}
                >
                  {(() => {
                    const board = createEmptyBoard(15);
                    for (const move of selectedOpening.moves) {
                      board[move.row][move.col] = move.player;
                    }
                    return (
                      <GomokuBoard
                        board={board}
                        onCellClick={() => {}}
                        winningLine={null}
                        lastMove={
                          selectedOpening.moves[
                            selectedOpening.moves.length - 1
                          ]
                        }
                        skin={SKINS[0]}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-zinc-400 font-semibold flex flex-col items-center gap-4">
              <Search size={48} className="opacity-20" />
              Select an opening to view details
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
