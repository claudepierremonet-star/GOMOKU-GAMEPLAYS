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
  const [newSkinLineColor, setNewSkinLineColor] = useState('#000000');
  const [newSkinBlackStone, setNewSkinBlackStone] = useState('#000000');
  const [newSkinWhiteStone, setNewSkinWhiteStone] = useState('#ffffff');

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
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Black Stone Color</label>
              <input 
                type="color" 
                value={newSkinBlackStone}
                onChange={(e) => setNewSkinBlackStone(e.target.value)}
                className="w-full h-12 bg-zinc-100 border-none rounded-xl cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">White Stone Color</label>
              <input 
                type="color" 
                value={newSkinWhiteStone}
                onChange={(e) => setNewSkinWhiteStone(e.target.value)}
                className="w-full h-12 bg-zinc-100 border-none rounded-xl cursor-pointer"
              />
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
                  <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: newSkinBlackStone }} />
                  <div className="w-8 h-8 rounded-full shadow-lg" style={{ backgroundColor: newSkinWhiteStone }} />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={!newSkinName.trim()}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Theme Design
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
