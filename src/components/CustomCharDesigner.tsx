import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { Character } from '../types';

interface CustomCharDesignerProps {
  onClose: () => void;
  onSave: (name: string, avatar: string, bio: string) => void;
  predefinedAvatars?: string[];
}

export function CustomCharDesigner({ onClose, onSave, predefinedAvatars = [] }: CustomCharDesignerProps) {
  const [newCharName, setNewCharName] = useState("");
  const [newCharAvatar, setNewCharAvatar] = useState("");
  const [newCharBio, setNewCharBio] = useState("");

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        alert("File too large (max 1MB).");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewCharAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!newCharName.trim() || !newCharAvatar) return;
    onSave(newCharName.trim(), newCharAvatar, newCharBio.trim());
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
        className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between mb-8 shrink-0">
          <h3 className="text-2xl font-black tracking-tighter uppercase">
            New Character
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-2">
          {/* Live Preview */}
          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center gap-4 shrink-0">
            <img
              src={
                newCharAvatar ||
                "https://picsum.photos/seed/placeholder/200/200"
              }
              alt="Preview"
              className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-zinc-200"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://picsum.photos/seed/placeholder/200/200";
              }}
            />
            <div className="flex-1">
              <h4 className="font-bold text-zinc-900 line-clamp-1">
                {newCharName || "Character Name"}
              </h4>
              <p className="text-xs text-zinc-500 line-clamp-2 mt-0.5">
                {newCharBio || "Character biography will appear here..."}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Character Name
            </label>
            <input
              type="text"
              value={newCharName}
              onChange={(e) => setNewCharName(e.target.value)}
              placeholder="e.g. Master Ryu"
              className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
              Biography
            </label>
            <textarea
              value={newCharBio}
              onChange={(e) => setNewCharBio(e.target.value)}
              placeholder="Optional backstory or style..."
              rows={3}
              className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
            />
          </div>

          {predefinedAvatars.length > 0 && (
            <div>
              <h4 className="font-bold text-zinc-900 mb-3">
                Predefined Avatars
              </h4>
              <div className="grid grid-cols-4 gap-4 mb-4">
                {predefinedAvatars.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setNewCharAvatar(url)}
                    className="relative group rounded-2xl overflow-hidden border-2 border-transparent hover:border-zinc-900 transition-colors"
                  >
                    <img
                      src={url}
                      alt="Predefined Avatar"
                      className="w-full aspect-square object-cover bg-zinc-100"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-bold text-zinc-900 mb-3">Upload Custom</h4>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <RefreshCw size={24} className="mb-2 text-zinc-400" />
                <p className="mb-1 text-sm text-zinc-500">
                  <span className="font-semibold">Click to upload</span>
                </p>
                <p className="text-xs text-zinc-400">
                  SVG, PNG, JPG (MAX. 1MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleAvatarUpload}
              />
            </label>
          </div>
        </div>

        <div className="pt-6 shrink-0 mt-2 border-t border-zinc-100">
          <motion.button
            whileHover={newCharName && newCharAvatar ? { scale: 1.02 } : {}}
            whileTap={newCharName && newCharAvatar ? { scale: 0.98 } : {}}
            onClick={handleSave}
            disabled={!newCharName || !newCharAvatar}
            className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
              newCharName && newCharAvatar
                ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/20"
                : "bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none"
            }`}
          >
            Create Character
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
