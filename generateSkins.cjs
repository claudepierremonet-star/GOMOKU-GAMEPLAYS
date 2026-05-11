const fs = require('fs');

const generateMarvelSkins = () => {
    const list = [];
    for (let i=0; i<30; i++) {
        const h1 = (i * 12) % 360;
        const h2 = (i * 12 + 150) % 360;
        const serial = `SLV-MRV-${(1000 + i).toString().padStart(4, '0')}`;
        list.push(`  {
    id: 'marvel_silver_${i+1}',
    name: 'Hero Variant ${i+1}',
    boardColor: 'hsl(${h1}, 60%, 25%)',
    lineColor: 'rgba(255,255,255,0.15)',
    blackStone: 'bg-gradient-to-br from-[hsl(${h2},80%,40%)] to-[hsl(${h2},80%,20%)] border-2 border-[hsl(${h2},80%,60%)] shadow-md',
    whiteStone: 'bg-gradient-to-br from-[hsl(${(h2+120)%360},80%,60%)] to-[hsl(${(h2+120)%360},80%,40%)] border-2 border-white shadow-md',
    description: 'Silver Tier - Comic universe inspired style.',
    tier: 'Silver',
    price: 500,
    serialNumber: '${serial}'
  }`);
    }
    return list.join(',\n');
}

const generateLaboSkins = () => {
    const list = [];
    for (let i=0; i<30; i++) {
        const h = (i * 12) % 360;
        const serial = `GLD-LAB-${(1000 + i).toString().padStart(4, '0')}`;
        list.push(`  {
    id: 'labo_gold_${i+1}',
    name: 'Crafted Model ${i+1}',
    boardColor: 'hsl(35, ${30 + i}%, ${40 + (i%10)}%)',
    lineColor: 'rgba(0,0,0,0.2)',
    blackStone: 'bg-gradient-to-br from-stone-600 to-stone-800 border-[hsl(${h},70%,50%)] border-2 border-dashed',
    whiteStone: 'bg-gradient-to-br from-[#dfd0b8] to-[#cba37b] border-[hsl(${(h+180)%360},70%,50%)] border-2 border-dashed',
    description: 'Gold Tier - Cardboard and craft inspired.',
    tier: 'Gold',
    price: 1000,
    serialNumber: '${serial}'
  }`);
    }
    return list.join(',\n');
}

const generateMKSkins = () => {
    const list = [];
    for (let i=0; i<30; i++) {
        const h1 = (i * 12) % 360;
        const h2 = (i * 12 + 180) % 360;
        const serial = `DMD-KMB-${(1000 + i).toString().padStart(4, '0')}`;
        list.push(`  {
    id: 'mk_diamond_${i+1}',
    name: 'Kombat Realm ${i+1}',
    boardColor: 'hsl(${h1}, 50%, 8%)',
    lineColor: 'rgba(255,255,255,0.25)',
    blackStone: 'bg-gradient-to-br from-[hsl(${h1},100%,20%)] to-black shadow-[0_0_12px_hsl(${h1},100%,50%)] border-2 border-[hsl(${h1},100%,50%)] !rounded-none rotate-45 scale-90',
    whiteStone: 'bg-gradient-to-br from-[hsl(${h2},100%,80%)] to-[hsl(${h2},100%,30%)] shadow-[0_0_12px_hsl(${h2},100%,50%)] border-2 border-[hsl(${h2},100%,50%)] !rounded-full',
    description: 'Diamond Tier - Dark fantasy fighter inspired.',
    tier: 'Diamond',
    price: 2500,
    serialNumber: '${serial}'
  }`);
    }
    return list.join(',\n');
}

const generatePokemonSkins = () => {
    const list = [];
    for (let i=0; i<30; i++) {
        const h1 = (i * 12) % 360;
        const h2 = (i * 12 + 60) % 360;
        const serial = `PLT-MNX-${(1000 + i).toString().padStart(4, '0')}`;
        list.push(`  {
    id: 'poke_platinum_${i+1}',
    name: 'Monsters Elite ${i+1}',
    boardColor: 'hsl(${h1}, 30%, 85%)',
    lineColor: 'rgba(0,0,0,0.1)',
    blackStone: 'bg-gradient-to-b from-[hsl(${h1},80%,50%)] from-50% to-white to-50% rounded-full border-4 border-black relative after:content-[""] after:absolute after:w-2.5 after:h-2.5 after:bg-white after:rounded-full after:border-2 after:border-black after:top-1/2 after:left-1/2 after:-translate-x-1/2 after:-translate-y-1/2 shadow-lg',
    whiteStone: 'bg-gradient-to-br from-[hsl(${h2},80%,50%)] to-[hsl(${(h2+30)%360},80%,40%)] rounded-lg border-2 border-white relative after:content-[""] after:absolute after:inset-1 after:border after:border-white/40 after:rounded-sm shadow-[0_0_15px_hsl(${h2},80%,50%,0.5)]',
    description: 'Platinum Tier - Pocket monster inspired.',
    tier: 'Platinum',
    price: 10000,
    serialNumber: '${serial}'
  }`);
    }
    return list.join(',\n');
}

const output = `export type SkinTier = 'Classic' | 'Silver' | 'Gold' | 'Diamond' | 'Platinum';

export interface ShopSkin {
  id: string;
  name: string;
  boardColor: string;
  lineColor: string;
  blackStone: string;
  whiteStone: string;
  description: string;
  tier: SkinTier;
  price: number;
  serialNumber: string;
}

export const THEMED_SKINS: ShopSkin[] = [
${generateMarvelSkins()},
${generateLaboSkins()},
${generateMKSkins()},
${generatePokemonSkins()}
];
`;

fs.writeFileSync('src/skinsDB.ts', output);

