import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { BoardState, Player } from '../game/engine';
import { Skin } from '../types';

interface StoneProps {
  position: [number, number, number];
  player: Player;
  isWinningCell: boolean;
  isLastMove: boolean;
  skin: Skin;
}

function Stone({ position, player, isWinningCell, isLastMove, skin }: StoneProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [dropped, setDropped] = useState(false);
  
  const stoneColor = player === 'black' ? '#1a1a1a' : '#fefefe';
  const stoneEmissive = isWinningCell ? '#fbbf24' : '#000000';

  useFrame((state) => {
    if (!dropped && meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, position[1], 0.15);
      if (Math.abs(meshRef.current.position.y - position[1]) < 0.01) setDropped(true);
    }
  });

  const isBlackHex = /^#([0-9A-F]{3}){1,2}$/i.test(skin.blackStone);
  const isWhiteHex = /^#([0-9A-F]{3}){1,2}$/i.test(skin.whiteStone);
  
  const actualStoneColor = player === 'black' 
    ? (isBlackHex ? skin.blackStone : '#1a1a1a')
    : (isWhiteHex ? skin.whiteStone : '#fefefe');

  return (
    <Float speed={isLastMove ? 4 : 0} rotationIntensity={isLastMove ? 0.3 : 0} floatIntensity={isLastMove ? 0.3 : 0}>
      <mesh 
        position={[position[0], dropped ? position[1] : position[1] + 5, position[2]]} 
        ref={meshRef} 
        castShadow 
        receiveShadow
      >
        {/* Spheroid geometry for a more authentic Go/Gomoku stone feel */}
        <sphereGeometry args={[0.45, 32, 16]} />
        <meshStandardMaterial 
          color={actualStoneColor} 
          roughness={player === 'black' ? 0.15 : 0.05} 
          metalness={player === 'black' ? 0.1 : 0.4}
          emissive={stoneEmissive}
          emissiveIntensity={isWinningCell ? 1.5 : 0}
          envMapIntensity={1}
        />
        {isLastMove && (
          <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.3, 0.35, 32]} />
            <meshBasicMaterial color={player === 'black' ? '#ffffff' : '#000000'} transparent opacity={0.6} />
          </mesh>
        )}
      </mesh>
    </Float>
  );
}

function HoverIndicator({ position, cols, rows, onCellClick }: { position: [number, number], cols: number, rows: number, onCellClick: (r: number, c: number) => void }) {
  const [hovered, setHovered] = useState<[number, number] | null>(null);

  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, 0.005, 0]}
      onPointerMove={(e) => {
        e.stopPropagation();
        const { x, z } = e.point;
        const col = Math.round(x + (cols - 1) / 2);
        const row = Math.round(z + (rows - 1) / 2);
        if (row >= 0 && row < rows && col >= 0 && col < cols) {
          setHovered([row, col]);
        } else {
          setHovered(null);
        }
      }}
      onPointerOut={() => setHovered(null)}
      onPointerDown={(e) => {
        e.stopPropagation();
        if (hovered) onCellClick(hovered[0], hovered[1]);
      }}
      visible={false} // Only for hit testing
    >
      <planeGeometry args={[cols + 1, rows + 1]} />
      {hovered && (
        <mesh position={[hovered[1] - (cols - 1) / 2, hovered[0] - (rows - 1) / 2, 0.01]} rotation={[0, 0, 0]}>
          <ringGeometry args={[0.4, 0.45, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      )}
    </mesh>
  );
}

interface Board3DProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  winningLine: [number, number][] | null;
  lastMove: { row: number; col: number } | null;
  skin: Skin;
}

export function GomokuBoard3D({ board, onCellClick, winningLine, lastMove, skin }: Board3DProps) {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  
  const winningCells = useMemo(() => {
    const set = new Set<string>();
    winningLine?.forEach(([r, c]) => set.add(`${r}-${c}`));
    return set;
  }, [winningLine]);

  return (
    <div className="w-full h-full min-h-[500px] bg-zinc-950 rounded-[2.5rem] overflow-hidden shadow-2xl relative border-4 border-zinc-900">
      <Canvas shadows dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 12, 14]} fov={40} />
        <OrbitControls 
          enablePan={true} 
          maxPolarAngle={Math.PI / 2.1} 
          minDistance={8} 
          maxDistance={30}
          makeDefault
        />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[15, 25, 15]} angle={0.2} penumbra={1} intensity={2} castShadow />
        <pointLight position={[-15, 10, -15]} intensity={1} color="#4f46e5" />
        <pointLight position={[0, -5, 0]} intensity={0.5} />

        <group>
          {/* Board Pedestal */}
          <mesh position={[0, -1, 0]} receiveShadow>
            <boxGeometry args={[cols + 2, 1.5, rows + 2]} />
            <meshStandardMaterial color="#090909" metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Main Board Body */}
          <mesh rotation={[0, 0, 0]} position={[0, -0.15, 0]} receiveShadow>
            <boxGeometry args={[cols + 0.6, 0.3, rows + 0.6]} />
            <meshStandardMaterial 
              color={skin.boardColor || "#dcb35c"} 
              roughness={0.3} 
              metalness={0.05}
              envMapIntensity={0.5}
            />
          </mesh>

          <HoverIndicator position={[0, 0]} cols={cols} rows={rows} onCellClick={onCellClick} />

          {/* Grid Lines */}
          <group position={[0, 0.01, 0]}>
            {Array.from({ length: rows }).map((_, r) => (
              <mesh key={`h-${r}`} position={[0, 0, r - (rows - 1) / 2]}>
                <boxGeometry args={[cols - 1, 0.015, 0.03]} />
                <meshBasicMaterial color={skin.lineColor || "#000000"} transparent opacity={0.4} />
              </mesh>
            ))}
            {Array.from({ length: cols }).map((_, c) => (
              <mesh key={`v-${c}`} position={[c - (cols - 1) / 2, 0, 0]}>
                <boxGeometry args={[0.03, 0.015, rows - 1]} />
                <meshBasicMaterial color={skin.lineColor || "#000000"} transparent opacity={0.4} />
              </mesh>
            ))}
          </group>

          {/* Star Points (Hoshi) */}
          {(rows === 15 && cols === 15) && [
            [3, 3], [3, 11], [11, 3], [11, 11], [7, 7]
          ].map(([r, c], i) => (
            <mesh key={`hoshi-${i}`} position={[c - (cols - 1) / 2, 0.02, r - (rows - 1) / 2]}>
              <cylinderGeometry args={[0.1, 0.1, 0.01, 16]} />
              <meshBasicMaterial color={skin.lineColor || "#000000"} />
            </mesh>
          ))}

          {/* Stones */}
          {board.map((row, r) => 
            row.map((cell, c) => cell && (
              <Stone 
                key={`${r}-${c}_${cell}`}
                position={[c - (cols - 1) / 2, 0.15, r - (rows - 1) / 2]}
                player={cell}
                isWinningCell={winningCells.has(`${r}-${c}`)}
                isLastMove={lastMove?.row === r && lastMove?.col === c}
                skin={skin}
              />
            ))
          )}
        </group>

        <Environment preset="studio" />
        <ContactShadows resolution={1024} scale={30} blur={2.5} opacity={0.65} far={15} color="#000000" />
      </Canvas>

      <div className="absolute top-6 right-6 flex flex-col gap-2">
        <div className="bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
             <span className="text-white text-[10px] font-black uppercase tracking-widest">Immersive Mode</span>
           </div>
           <p className="text-white/40 text-[9px] font-bold uppercase">Dynamic 3D Environment</p>
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-black/60 backdrop-blur-md px-6 py-3 rounded-full pointer-events-none border border-white/10 shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="text-white/70 text-[9px] font-black uppercase tracking-widest">Rotate</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="text-white/70 text-[9px] font-black uppercase tracking-widest">Zoom</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          <span className="text-white/70 text-[9px] font-black uppercase tracking-widest">Pan</span>
        </div>
      </div>
    </div>
  );
}
