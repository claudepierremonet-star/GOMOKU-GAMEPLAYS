import React, { useState } from 'react';
import { ChevronLeft, Coins, ShoppingCart, Music, Check, Lock } from 'lucide-react';
import { UserProfile, SKINS, Skin } from '../types';
import { toast } from 'sonner';

interface ZenShopProps {
  userProfile: UserProfile | null;
  onBack: () => void;
  onBuyItem: (type: 'skin' | 'sound', itemId: string, price: number) => void;
  onEquipItem: (type: 'skin' | 'sound', itemId: string) => void;
}

const SHOP_SOUNDS = [
  { id: 'laser', name: 'Laser Beam', price: 50, description: 'Futuristic zap sound.' },
  { id: 'heavy', name: 'Heavy Stone', price: 50, description: 'A solid thud when placed.' }
];

export function ZenShop({ userProfile, onBack, onBuyItem, onEquipItem }: ZenShopProps) {
  const [activeTab, setActiveTab] = useState<'skins' | 'sounds'>('skins');

  if (!userProfile) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-50">
        <p className="text-zinc-500 font-semibold">Please log in to access the Zen Shop.</p>
        <button onClick={onBack} className="absolute top-8 left-8 p-2 hover:bg-zinc-200 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
      </div>
    );
  }

  const { zenCoins, unlockedSkins, unlockedSounds, selectedSkinId, selectedSound } = userProfile;

  return (
    <div className="absolute inset-0 flex flex-col bg-zinc-50 p-4 md:p-8">
      <header className="flex items-center justify-between mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-zinc-200 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart size={24} /> Zen Shop</h2>
        </div>
        <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-black shadow-sm">
          <Coins size={18} />
          {zenCoins} Coins
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-6 overflow-hidden">
        <div className="flex gap-4 p-1 bg-zinc-200/50 rounded-2xl w-full max-w-sm mx-auto shrink-0">
          <button
            onClick={() => setActiveTab('skins')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${activeTab === 'skins' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Skins
          </button>
          <button
            onClick={() => setActiveTab('sounds')}
            className={`flex-1 py-2 font-bold rounded-xl transition-all ${activeTab === 'sounds' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Sound Effects
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          {activeTab === 'skins' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {SKINS.map(skin => {
                const isUnlocked = unlockedSkins.includes(skin.id);
                const isEquipped = selectedSkinId === skin.id;
                const price = 100;
                
                return (
                  <div key={skin.id} className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 flex flex-col">
                    <div className="w-full aspect-video rounded-2xl mb-4 relative overflow-hidden" style={{ backgroundColor: skin.boardColor }}>
                      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `linear-gradient(${skin.lineColor} 1px, transparent 1px), linear-gradient(90deg, ${skin.lineColor} 1px, transparent 1px)`, backgroundSize: '20px 20px' }}></div>
                      <div className="absolute inset-0 flex items-center justify-center gap-2">
                        <div className={`w-6 h-6 rounded-full shadow-lg ${skin.blackStone}`}></div>
                        <div className={`w-6 h-6 rounded-full shadow-lg ${skin.whiteStone}`}></div>
                      </div>
                    </div>
                    <h3 className="font-bold text-lg">{skin.name}</h3>
                    <p className="text-zinc-500 text-sm mb-4 line-clamp-2">{skin.description}</p>
                    <div className="mt-auto">
                      {isEquipped ? (
                        <button disabled className="w-full py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center justify-center gap-2">
                          <Check size={18} /> Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button onClick={() => onEquipItem('skin', skin.id)} className="w-full py-2 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                          Equip
                        </button>
                      ) : (
                        <button onClick={() => onBuyItem('skin', skin.id, price)} disabled={zenCoins < price} className={`w-full py-2 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${zenCoins >= price ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                          <Lock size={16} /> {price} Coins
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'sounds' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SHOP_SOUNDS.map(sound => {
                const isUnlocked = unlockedSounds.includes(sound.id);
                const isEquipped = selectedSound === sound.id;
                
                return (
                  <div key={sound.id} className="bg-white rounded-3xl p-6 shadow-sm border border-zinc-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                      <Music size={24} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{sound.name}</h3>
                      <p className="text-zinc-500 text-sm">{sound.description}</p>
                    </div>
                    <div className="shrink-0">
                      {isEquipped ? (
                        <button disabled className="px-4 py-2 bg-emerald-100 text-emerald-700 font-bold rounded-xl flex items-center gap-2">
                          <Check size={18} /> Equipped
                        </button>
                      ) : isUnlocked ? (
                        <button onClick={() => onEquipItem('sound', sound.id)} className="px-4 py-2 bg-zinc-100 text-zinc-900 font-bold rounded-xl hover:bg-zinc-200 transition-colors">
                          Equip
                        </button>
                      ) : (
                        <button onClick={() => onBuyItem('sound', sound.id, sound.price)} disabled={zenCoins < sound.price} className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 transition-colors ${zenCoins >= sound.price ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                          <Lock size={16} /> {sound.price}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
