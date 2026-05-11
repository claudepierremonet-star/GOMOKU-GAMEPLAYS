import React, { useState, useMemo } from 'react';
import { ChevronLeft, Coins, ShoppingCart, Music, Check, Lock, Info, Plus, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { UserProfile, ALL_SKINS, Skin, CHARACTERS } from '../types';
import { toast } from 'sonner';
import { SHOP_SOUNDS } from '../soundsDB';

interface ZenShopProps {
  userProfile: UserProfile | null;
  onBack: () => void;
  onBuyItem: (type: 'skin' | 'sound' | 'character', itemId: string, price: number) => void;
  onEquipItem: (type: 'skin' | 'sound' | 'character', itemId: string) => void;
  onOpenSkinDesigner: () => void;
  onOpenCharDesigner: () => void;
}

export function ZenShop({ userProfile, onBack, onBuyItem, onEquipItem, onOpenSkinDesigner, onOpenCharDesigner }: ZenShopProps) {
  const [activeTab, setActiveTab] = useState<'skins' | 'sounds' | 'characters' | 'info' | 'custom'>('info');
  const [activeSkinTier, setActiveSkinTier] = useState<string>('All');
  const [activeSoundTier, setActiveSoundTier] = useState<string>('All');
  const [activeCharTier, setActiveCharTier] = useState<string>('All');
  const [pendingPurchase, setPendingPurchase] = useState<{ type: 'skin' | 'sound' | 'character', item: any, price: number } | null>(null);

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

  const { zenCoins, unlockedSkins, unlockedSounds, unlockedCharacters, selectedSkinId, selectedSound, selectedCharacterId } = userProfile;

  const skinTiers = ['All', 'Classic', 'Silver', 'Gold', 'Diamond', 'Platinum'];
  const soundTiers = ['All', 'Classic', 'Silver', 'Gold', 'Diamond', 'Platinum'];
  const charTiers = ['All', 'Classic', 'Silver', 'Gold', 'Diamond', 'Platinum'];
  
  const filteredSkins = useMemo(() => {
    if (activeSkinTier === 'All') return ALL_SKINS;
    return ALL_SKINS.filter(s => (s.tier || 'Classic') === activeSkinTier);
  }, [activeSkinTier]);

  const filteredSounds = useMemo(() => {
    if (activeSoundTier === 'All') return SHOP_SOUNDS;
    return SHOP_SOUNDS.filter(s => (s.tier || 'Classic') === activeSoundTier);
  }, [activeSoundTier]);

  const filteredCharacters = useMemo(() => {
    if (activeCharTier === 'All') return CHARACTERS;
    return CHARACTERS.filter(c => (c.tier || 'Classic') === activeCharTier);
  }, [activeCharTier]);

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
          {zenCoins} Zen Coins
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto flex flex-col gap-6 overflow-hidden">
        <div className="flex gap-4 p-1 bg-zinc-200/50 rounded-2xl w-full max-w-2xl mx-auto shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-2 px-4 font-bold rounded-xl transition-all flex justify-center items-center gap-2 whitespace-nowrap ${activeTab === 'info' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            <Info size={16}/> How to Earn
          </button>
          <button
            onClick={() => setActiveTab('skins')}
            className={`flex-1 py-2 px-4 font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'skins' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Themes
          </button>
          <button
            onClick={() => setActiveTab('sounds')}
            className={`flex-1 py-2 px-4 font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'sounds' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Sounds
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 py-2 px-4 font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'characters' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Avatars
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 px-4 font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'custom' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-500 hover:text-zinc-700'}`}
          >
            Custom Creations
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
          {activeTab === 'info' && (
            <div className="max-w-2xl mx-auto mt-8">
               <h3 className="text-2xl font-black mb-4">Zen Coins Guide</h3>
               <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 mb-6">
                 <h4 className="font-bold text-lg text-amber-600 mb-2">How to obtain Zen Coins?</h4>
                 <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                   <li><strong className="text-zinc-900">Win Matches:</strong> You earn 20 Zen Coins for every victory against the AI or in online ranked.</li>
                   <li><strong className="text-zinc-900">Draws:</strong> A hard-fought draw still nets you 10 Zen Coins.</li>
                   <li><strong className="text-zinc-900">Participate:</strong> Even if you lose, you get 5 Zen Coins just for trying.</li>
                   <li><strong className="text-zinc-900">Starting Bonus:</strong> All users start their journey with a gift of 100 Zen Coins!</li>
                 </ul>
               </div>

               <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                 <h4 className="font-bold text-lg text-indigo-600 mb-2">How to use Zen Coins?</h4>
                 <ul className="list-disc pl-5 space-y-2 text-zinc-600 font-medium">
                   <li><strong className="text-zinc-900">Purchase Themes:</strong> Access the "Themes" tab to buy themes across different tiers (Silver, Gold, Diamond, Platinum) inspired by various universes!</li>
                   <li><strong className="text-zinc-900">Custom Sounds:</strong> Go to the "Sounds" tab to buy unique placement sounds like 'Laser Beam' or 'Heavy Stone'.</li>
                 </ul>
               </div>
            </div>
          )}

          {activeTab === 'skins' && (
            <div className="flex flex-col gap-8 pb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                {skinTiers.map(tier => (
                   <button 
                     key={tier}
                     onClick={() => setActiveSkinTier(tier)}
                     className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeSkinTier === tier ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'}`}
                   >
                     {tier}
                   </button>
                ))}
              </div>

              {skinTiers.filter(t => t !== 'All').map(tier => {
                const tierSkins = filteredSkins.filter(s => (s.tier || 'Classic') === tier);
                if (tierSkins.length === 0) return null;
                
                return (
                  <section key={tier} className="bg-white/50 p-6 rounded-[2.5rem] border border-zinc-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black tracking-tighter uppercase">
                        {tier} Tier
                      </h3>
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-zinc-200 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tierSkins.map(skin => {
                        const isUnlocked = unlockedSkins.includes(skin.id);
                        const isEquipped = selectedSkinId === skin.id;
                        const price = skin.price || Number((skin.tier === 'Platinum' ? 10000 : skin.tier === 'Diamond' ? 2500 : skin.tier === 'Gold' ? 1000 : skin.tier === 'Silver' ? 500 : 100));
                        
                        return (
                          <div key={skin.id} className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 flex flex-col hover:border-zinc-300 transition-colors">
                            <div className="w-full aspect-video rounded-2xl mb-4 relative overflow-hidden flex-shrink-0" style={{ backgroundColor: skin.boardColor }}>
                              <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `linear-gradient(${skin.lineColor} 1px, transparent 1px), linear-gradient(90deg, ${skin.lineColor} 1px, transparent 1px)`, backgroundSize: '15px 15px' }}></div>
                              <div className="absolute inset-0 flex items-center justify-center gap-2">
                                <div className={`w-5 h-5 rounded-full shadow-lg ${skin.blackStone}`}></div>
                                <div className={`w-5 h-5 rounded-full shadow-lg ${skin.whiteStone}`}></div>
                              </div>
                              {skin.tier && skin.tier !== 'Classic' && (
                                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-black text-white uppercase tracking-widest leading-none flex items-center">
                                  {skin.tier}
                                </div>
                              )}
                            </div>
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="font-bold text-base truncate pr-2">{skin.name}</h3>
                                {skin.serialNumber && (
                                  <div className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
                                    <span>id: {skin.serialNumber}</span>
                                  </div>
                                )}
                              </div>
                              {skin.serialNumber && (
                                <div className="p-1 bg-white rounded border border-zinc-200 shrink-0 shadow-sm" title={`Theme Serial: ${skin.serialNumber}`}>
                                  <QRCodeSVG value={`https://gomoku.example.com/theme/${skin.id}/${skin.serialNumber}`} size={32} level="L" includeMargin={false} />
                                </div>
                              )}
                            </div>
                            <p className="text-zinc-500 text-xs mb-4 line-clamp-2 h-8">{skin.description}</p>
                            <div className="mt-auto">
                              {isEquipped ? (
                                <button disabled className="w-full py-2 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                                  <Check size={16} /> Equipped
                                </button>
                              ) : isUnlocked ? (
                                <button onClick={() => onEquipItem('skin', skin.id)} className="w-full py-2 bg-zinc-100 text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-200 transition-colors">
                                  Equip
                                </button>
                              ) : (
                                <button onClick={() => setPendingPurchase({ type: 'skin', item: skin, price })} disabled={zenCoins < price} className={`w-full py-2 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all ${zenCoins >= price ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md translate-y-0 active:translate-y-0.5' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                                  <Lock size={14} /> {price}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}

          {activeTab === 'sounds' && (
            <div className="flex flex-col gap-8 pb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                {soundTiers.map(tier => (
                   <button 
                     key={tier}
                     onClick={() => setActiveSoundTier(tier)}
                     className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeSoundTier === tier ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'}`}
                   >
                     {tier}
                   </button>
                ))}
              </div>

              {soundTiers.filter(t => t !== 'All').map(tier => {
                const tierSounds = filteredSounds.filter(s => (s.tier || 'Classic') === tier);
                if (tierSounds.length === 0) return null;
                
                return (
                  <section key={tier} className="bg-white/50 p-6 rounded-[2.5rem] border border-zinc-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black tracking-tighter uppercase">
                        {tier} Tier
                      </h3>
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-zinc-200 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tierSounds.map(sound => {
                        const isUnlocked = unlockedSounds.includes(sound.id);
                        const isEquipped = selectedSound === sound.id;
                        
                        return (
                          <div key={sound.id} className="bg-white rounded-3xl p-5 shadow-sm border border-zinc-100 flex items-center gap-4 hover:border-zinc-300 transition-colors">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center shrink-0">
                              <Music size={24} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-bold text-base">{sound.name}</h3>
                                  {sound.serialNumber && (
                                    <div className="flex items-center gap-1 text-[10px] uppercase font-mono font-bold tracking-widest text-zinc-400">
                                      <span>id: {sound.serialNumber}</span>
                                    </div>
                                  )}
                                </div>
                                {sound.serialNumber && (
                                  <div className="p-1 bg-white rounded border border-zinc-200 shrink-0 shadow-sm" title={`Sound Serial: ${sound.serialNumber}`}>
                                    <QRCodeSVG value={`https://gomoku.example.com/sound/${sound.id}/${sound.serialNumber}`} size={24} level="L" includeMargin={false} />
                                  </div>
                                )}
                              </div>
                              <p className="text-zinc-500 text-xs mt-1">{sound.description}</p>
                            </div>
                            <div className="shrink-0">
                              {isEquipped ? (
                                <button disabled className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center gap-1">
                                  <Check size={14} /> On
                                </button>
                              ) : isUnlocked ? (
                                <button onClick={() => onEquipItem('sound', sound.id)} className="px-3 py-1.5 bg-zinc-100 text-zinc-900 font-bold text-xs rounded-xl hover:bg-zinc-200 transition-colors">
                                  Equip
                                </button>
                              ) : (
                                <button onClick={() => setPendingPurchase({ type: 'sound', item: sound, price: sound.price })} disabled={zenCoins < sound.price} className={`px-3 py-1.5 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors ${zenCoins >= sound.price ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                                  <Lock size={12} /> {sound.price}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
          {activeTab === 'characters' && (
            <div className="flex flex-col gap-8 pb-12">
              <div className="flex flex-wrap gap-2 justify-center">
                {charTiers.map(tier => (
                   <button 
                     key={tier}
                     onClick={() => setActiveCharTier(tier)}
                     className={`px-4 py-1.5 rounded-full text-sm font-bold transition-colors ${activeCharTier === tier ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-zinc-600 hover:bg-zinc-300'}`}
                   >
                     {tier}
                   </button>
                ))}
              </div>

              {charTiers.filter(t => t !== 'All').map(tier => {
                const tierChars = filteredCharacters.filter(c => (c.tier || 'Classic') === tier);
                if (tierChars.length === 0) return null;
                
                return (
                  <section key={tier} className="bg-white/50 p-6 rounded-[2.5rem] border border-zinc-100 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-black tracking-tighter uppercase">
                        {tier} Tier
                      </h3>
                      <div className="h-0.5 flex-1 bg-gradient-to-r from-zinc-200 to-transparent"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {tierChars.map(char => {
                        // Users start with a few default characters, right? Let's check unlocking logic. 
                        // Wait, some characters are default. But let's say all these characters need to be unlocked if they cost coins.
                        // I will add a check if they are one of the default characters or not. Since the prompt states to set ALL characters price and they can buy.
                        // We will allow users to just buy.
                        const isUnlocked = unlockedCharacters.includes(char.id) || ['master_lin'].includes(char.id); // Assuming master_lin is default
                        const isEquipped = selectedCharacterId === char.id;
                        const price = char.price || 100;
                        const bgColor = char.color ? `bg-${char.color}-100 text-${char.color}-700` : 'bg-zinc-100 text-zinc-700';
                        
                        return (
                          <div key={char.id} className="bg-white rounded-3xl p-4 shadow-sm border border-zinc-100 flex flex-col hover:border-zinc-300 transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                              <img src={char.avatar} alt={char.name} className="w-16 h-16 rounded-2xl bg-zinc-100" />
                              <div>
                                <h3 className="font-bold text-base line-clamp-1">{char.name}</h3>
                                {char.color && (
                                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${bgColor}`}>
                                    {char.color}
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-zinc-500 text-xs mb-4 line-clamp-2 h-8 leading-snug">{char.bio}</p>
                            <div className="mt-auto">
                              {isEquipped ? (
                                <button disabled className="w-full py-2 bg-emerald-100 text-emerald-700 font-bold text-sm rounded-xl flex items-center justify-center gap-2">
                                  <Check size={16} /> Equipped
                                </button>
                              ) : isUnlocked ? (
                                <button onClick={() => onEquipItem('character', char.id)} className="w-full py-2 bg-zinc-100 text-zinc-900 font-bold text-sm rounded-xl hover:bg-zinc-200 transition-colors">
                                  Equip
                                </button>
                              ) : (
                                <button onClick={() => setPendingPurchase({ type: 'character', item: char, price })} disabled={zenCoins < price} className={`w-full py-2 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all ${zenCoins >= price ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-md translate-y-0 active:translate-y-0.5' : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'}`}>
                                  <Lock size={14} /> {price}
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          )}
          {activeTab === 'custom' && (
            <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tighter uppercase">
                    Custom Characters
                  </h3>
                  <button
                    onClick={() => {
                        if (zenCoins < 500) {
                            toast.error("Not enough Zen Coins!");
                            return;
                        }
                        onOpenCharDesigner();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md ${zenCoins >= 500 ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg' : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'}`}
                  >
                    <Plus size={14} />
                    Create (500 <Coins size={12} className="inline ml-0.5" />)
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userProfile.customCharacters?.map((char) => (
                    <div
                      key={char.id}
                      className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4"
                    >
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-16 h-16 rounded-2xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <h4 className="font-bold text-zinc-900">{char.name}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1">
                          {char.bio}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!userProfile.customCharacters || userProfile.customCharacters.length === 0) && (
                    <div className="col-span-full py-12 text-center bg-zinc-100/50 rounded-3xl border-2 border-dashed border-zinc-200">
                      <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest">
                        No custom characters yet
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tighter uppercase">
                    Custom Themes
                  </h3>
                  <button
                    onClick={() => {
                        if (zenCoins < 500) {
                            toast.error("Not enough Zen Coins!");
                            return;
                        }
                        onOpenSkinDesigner();
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-md ${zenCoins >= 500 ? 'bg-zinc-900 text-white hover:bg-zinc-800 hover:shadow-lg' : 'bg-zinc-200 text-zinc-500 cursor-not-allowed'}`}
                  >
                    <Plus size={14} />
                    Design Theme (500 <Coins size={12} className="inline ml-0.5" />)
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userProfile.customSkins?.map((skin, idx) => {
                    const isBlackHex = /^#([0-9A-F]{3}){1,2}$/i.test(
                      skin.blackStone,
                    );
                    const isWhiteHex = /^#([0-9A-F]{3}){1,2}$/i.test(
                      skin.whiteStone,
                    );
                    return (
                      <div
                        key={idx}
                        className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between gap-4 group hover:border-zinc-300 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center gap-1 shrink-0 bg-zinc-100 relative overflow-hidden"
                            style={{ backgroundColor: skin.boardColor }}
                          >
                            <div className="absolute inset-0 opacity-50" style={{ backgroundImage: `linear-gradient(${skin.lineColor} 1px, transparent 1px), linear-gradient(90deg, ${skin.lineColor} 1px, transparent 1px)`, backgroundSize: '10px 10px' }}></div>
                            <div
                              className={`w-5 h-5 rounded-full shadow-md z-10 ${!isBlackHex ? skin.blackStone : ""}`}
                              style={isBlackHex ? { backgroundColor: skin.blackStone } : {}}
                            />
                            <div
                              className={`w-5 h-5 rounded-full shadow-md z-10 ${!isWhiteHex ? skin.whiteStone : ""}`}
                              style={isWhiteHex ? { backgroundColor: skin.whiteStone } : {}}
                            />
                          </div>
                          <div>
                            <h4 className="font-bold text-zinc-900 tracking-tight">
                              {skin.name}
                            </h4>
                            <p className="text-xs text-zinc-500 line-clamp-1 max-w-[150px]">
                              {skin.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                           {selectedSkinId === skin.id ? (
                               <button disabled className="px-3 py-1.5 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-lg">
                                  Equipped
                               </button>
                           ) : (
                               <button onClick={() => onEquipItem('skin', skin.id)} className="px-3 py-1.5 bg-zinc-100 text-zinc-900 font-bold text-[10px] hover:bg-zinc-200 rounded-lg transition-colors">
                                  Equip
                               </button>
                           )}
                        </div>
                      </div>
                    );
                  })}
                  {(!userProfile.customSkins || userProfile.customSkins.length === 0) && (
                    <div className="col-span-full py-12 text-center bg-zinc-100/50 rounded-3xl border-2 border-dashed border-zinc-200">
                      <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest">
                        No custom themes yet
                      </p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {pendingPurchase && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black mb-2">Confirm Purchase</h3>
            <p className="text-zinc-600 mb-6">Are you sure you want to buy <strong>{pendingPurchase.item.name}</strong> for <span className="font-bold text-amber-600">{pendingPurchase.price} Zen Coins</span>?</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setPendingPurchase(null)}
                className="flex-1 py-3 px-4 font-bold rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  onBuyItem(pendingPurchase.type, pendingPurchase.item.id, pendingPurchase.price);
                  setPendingPurchase(null);
                }}
                className="flex-1 py-3 px-4 font-bold rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 transition-colors shadow-md flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
