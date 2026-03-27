import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Skin } from '../types';

interface CustomSkinDesignerProps {
  onClose: () => void;
  onSave: (skin: Skin) => void;
}

export function CustomSkinDesigner({ onClose, onSave }: CustomSkinDesignerProps) {
  const [newSkinName, setNewSkinName] = useState('');
  const [newSkinBoardColor, setNewSkinBoardColor] = useState('#e6c280');
  const [newSkinLineColor, setNewSkinLineColor] = useState('rgba(0,0,0,0.4)');
  const [newSkinBlackStone, setNewSkinBlackStone] = useState('bg-zinc-900');
  const [newSkinWhiteStone, setNewSkinWhiteStone] = useState('bg-white border-2 border-zinc-200');

  const handleSave = () => {
    if (!newSkinName.trim()) return;

    const newSkin: Skin = {
      id: `custom_${Date.now()}`,
      name: newSkinName.trim(),
      boardColor: newSkinBoardColor,
      lineColor: newSkinLineColor,
      blackStone: newSkinBlackStone,
      whiteStone: newSkinWhiteStone,
      description: 'Custom created skin',
      isCustom: true
    };

    onSave(newSkin);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black tracking-tighter uppercase">Design Skin</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Skin Name</label>
            <input 
              type="text" 
              value={newSkinName}
              onChange={(e) => setNewSkinName(e.target.value)}
              placeholder="e.g. Midnight Forest"
              className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Board Color</label>
              <input 
                type="color" 
                value={newSkinBoardColor}
                onChange={(e) => setNewSkinBoardColor(e.target.value)}
                className="w-full h-12 bg-zinc-100 border-none rounded-xl cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Line Color</label>
              <input 
                type="color" 
                value={newSkinLineColor}
                onChange={(e) => setNewSkinLineColor(e.target.value)}
                className="w-full h-12 bg-zinc-100 border-none rounded-xl cursor-pointer"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Black Stone Style</label>
              <select 
                value={newSkinBlackStone}
                onChange={(e) => setNewSkinBlackStone(e.target.value)}
                className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="bg-zinc-900">Classic Black</option>
                <option value="bg-gradient-to-br from-gray-700 to-black">Obsidian</option>
                <option value="bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]">Neon Purple</option>
                <option value="bg-gradient-to-br from-stone-800 to-stone-950">Dark Wood</option>
                <option value="bg-black/80 backdrop-blur-sm border border-white/20">Dark Glass</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">White Stone Style</label>
              <select 
                value={newSkinWhiteStone}
                onChange={(e) => setNewSkinWhiteStone(e.target.value)}
                className="w-full bg-zinc-100 border-none rounded-xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <option value="bg-white border-2 border-zinc-200">Classic White</option>
                <option value="bg-gradient-to-br from-gray-100 to-gray-300 border border-gray-400">Marble</option>
                <option value="bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]">Neon Cyan</option>
                <option value="bg-gradient-to-br from-stone-200 to-stone-400">Light Wood</option>
                <option value="bg-white/80 backdrop-blur-sm border border-white/40">Light Glass</option>
              </select>
            </div>
          </div>
          
          {/* Live Preview */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Live Preview</label>
            <div className="p-6 bg-zinc-50 rounded-3xl border border-zinc-100 flex items-center justify-center">
              <div 
                className="w-48 h-48 rounded-xl relative shadow-inner overflow-hidden"
                style={{ backgroundColor: newSkinBoardColor }}
              >
                {/* Grid lines */}
                <div className="absolute inset-0 flex flex-col justify-evenly px-4">
                  {[1,2,3,4,5].map(i => <div key={`h-${i}`} className="w-full h-[2px] rounded-full" style={{ backgroundColor: newSkinLineColor }} />)}
                </div>
                <div className="absolute inset-0 flex justify-evenly py-4">
                  {[1,2,3,4,5].map(i => <div key={`v-${i}`} className="h-full w-[2px] rounded-full" style={{ backgroundColor: newSkinLineColor }} />)}
                </div>
                
                {/* Stones */}
                <div className="absolute inset-0 flex items-center justify-center gap-4">
                  <div className={`w-8 h-8 rounded-full shadow-lg ${newSkinBlackStone}`} />
                  <div className={`w-8 h-8 rounded-full shadow-lg ${newSkinWhiteStone}`} />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!newSkinName.trim()}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Skin Design
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
