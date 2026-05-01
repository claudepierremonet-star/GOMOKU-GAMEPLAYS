import { Player } from './game/engine';

export type RankTier = 'Beginner' | 'Bronze' | 'Silver' | 'Gold' | 'Master';

export interface MatchRecord {
  id: string;
  date: number;
  opponent: string;
  opponentElo: number;
  playerEloBefore: number;
  playerEloAfter: number;
  result: 'win' | 'loss' | 'draw';
  moves: { row: number; col: number; player: Player }[];
  boardSize: number;
  gameMode: 'online' | 'pve' | 'pvp';
  winner: Player | 'draw';
  selectedSkin?: SkinId;
  selectedCharacter?: string;
}

export const RANK_TIERS: { name: RankTier; minElo: number; color: string }[] = [
  { name: 'Beginner', minElo: 0, color: '#a1a1aa' },
  { name: 'Bronze', minElo: 800, color: '#d97706' },
  { name: 'Silver', minElo: 1200, color: '#94a3b8' },
  { name: 'Gold', minElo: 1600, color: '#fbbf24' },
  { name: 'Master', minElo: 2000, color: '#8b5cf6' },
];

export const getRankTier = (elo: number) => {
  for (let i = RANK_TIERS.length - 1; i >= 0; i--) {
    if (elo >= RANK_TIERS[i].minElo) return RANK_TIERS[i];
  }
  return RANK_TIERS[0];
};

export const getNextRank = (elo: number) => {
  for (let i = 0; i < RANK_TIERS.length; i++) {
    if (elo < RANK_TIERS[i].minElo) return RANK_TIERS[i];
  }
  return null;
};

export type SkinId = string;

export type UiStyle = 'modern' | 'pixel' | 'zen' | 'cyberpunk' | 'monochrome' | 'retro' | 'midnight' | 'nature' | 'terminal' | 'bubblegum';

export interface Skin {
  id: SkinId;
  name: string;
  boardColor: string;
  lineColor: string;
  blackStone: string; 
  whiteStone: string; 
  description: string;
  isCustom?: boolean;
}

export const SKINS: Skin[] = [
  {
    id: 'classic',
    name: 'Classic',
    boardColor: '#e6c280',
    lineColor: 'rgba(0,0,0,0.4)',
    blackStone: 'bg-gradient-to-br from-gray-700 to-black',
    whiteStone: 'bg-gradient-to-br from-white to-gray-200',
    description: 'Traditional Go board feel.'
  },
  {
    id: 'midnight',
    name: 'Midnight Gold',
    boardColor: '#1e293b',
    lineColor: 'rgba(255,255,255,0.1)',
    blackStone: 'bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-[0_4px_10px_rgba(245,158,11,0.3)]',
    whiteStone: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 shadow-[0_4px_10px_rgba(148,163,184,0.3)]',
    description: 'Gold and silver on dark navy.'
  },
  {
    id: 'neon',
    name: 'Cyberpunk',
    boardColor: '#0f172a',
    lineColor: 'rgba(56,189,248,0.3)',
    blackStone: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_15px_rgba(168,85,247,0.6)]',
    whiteStone: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_15px_rgba(34,211,238,0.6)]',
    description: 'Futuristic neon glow.'
  },
  {
    id: 'forest',
    name: 'Jade Garden',
    boardColor: '#064e3b',
    lineColor: 'rgba(255,255,255,0.15)',
    blackStone: 'bg-gradient-to-br from-emerald-700 to-emerald-950 border border-emerald-400/30',
    whiteStone: 'bg-gradient-to-br from-emerald-50 to-emerald-200 border border-emerald-600/20',
    description: 'Serene emerald and jade.'
  },
  {
    id: 'wooden',
    name: 'Natural Wood',
    boardColor: '#92400e',
    lineColor: 'rgba(255,255,255,0.2)',
    blackStone: 'bg-gradient-to-br from-stone-800 to-stone-950',
    whiteStone: 'bg-gradient-to-br from-stone-100 to-stone-300',
    description: 'Deep mahogany wood texture.'
  },
  {
    id: 'ruby',
    name: 'Imperial Red',
    boardColor: '#7f1d1d',
    lineColor: 'rgba(254,240,138,0.2)',
    blackStone: 'bg-gradient-to-br from-zinc-800 to-black border border-zinc-700',
    whiteStone: 'bg-gradient-to-br from-rose-400 to-rose-600 shadow-[0_4px_10px_rgba(225,29,72,0.3)]',
    description: 'Crimson board with obsidian and ruby.'
  },
  {
    id: 'glass',
    name: 'Frosted Glass',
    boardColor: '#f1f5f9',
    lineColor: 'rgba(0,0,0,0.1)',
    blackStone: 'bg-black/80 backdrop-blur-sm border border-white/20',
    whiteStone: 'bg-white/60 backdrop-blur-sm border border-black/10',
    description: 'Elegant translucent pieces.'
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    boardColor: '#ffffff',
    lineColor: '#e5e7eb',
    blackStone: 'bg-zinc-900',
    whiteStone: 'bg-white border-2 border-zinc-200',
    description: 'Clean and modern high-contrast.'
  },
  {
    id: 'pixel',
    name: 'Retro Arcade',
    boardColor: '#000000',
    lineColor: '#333333',
    blackStone: 'bg-pink-500 border-b-4 border-r-4 border-pink-700',
    whiteStone: 'bg-yellow-400 border-b-4 border-r-4 border-yellow-600',
    description: '8-bit aesthetic with bold colors.'
  }
];

export interface Character {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  defaultSkin: SkinId;
  isCustom?: boolean;
  color?: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  elo: number;
  customCharacters: Character[];
  customSkins: Skin[];
  selectedCharacterId: string;
  selectedSkinId: SkinId;
  stats?: {
    wins: number;
    losses: number;
    draws: number;
    winStreak: number;
    maxWinStreak: number;
    totalMoves: number;
    totalGames: number;
  };
}

export const CHARACTERS: Character[] = [
  { id: 'master_lin', name: 'Wei Lin', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=MasterLin&backgroundColor=b6e3f4', bio: 'A legendary master who listens to the stones.', defaultSkin: 'classic', color: 'emerald' },
  { id: 'cyber_x', name: 'Unit-734', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=CyberX&backgroundColor=c0aede', bio: 'Calculates 14 million outcomes per microsecond.', defaultSkin: 'neon', color: 'cyan' },
  { id: 'sage_elara', name: 'Sage Elara', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=SageElara&backgroundColor=1e293b', bio: 'Harnesses the celestial energy of the Midnight Gold board.', defaultSkin: 'midnight', color: 'amber' },
  { id: 'jade_weaver', name: 'Jade Weaver', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=JadeWeaver&backgroundColor=064e3b', bio: 'Patterns her moves after the growth of the deep forest.', defaultSkin: 'forest', color: 'emerald' },
  { id: 'crimson_king', name: 'Crimson King', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=CrimsonKing&backgroundColor=7f1d1d', bio: 'Dominates with a bold, aggressive style on the Imperial board.', defaultSkin: 'ruby', color: 'rose' },
  { id: 'retro_rex', name: 'Retro Rex', avatar: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=RetroRex&backgroundColor=000000', bio: 'A hero from an 8-bit era. High score is his only goal.', defaultSkin: 'pixel', color: 'yellow' },
  { id: 'nature_spirit', name: 'Elara', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=NatureSpirit&backgroundColor=ffdfbf', bio: 'Plays entirely based on the energy of the wind.', defaultSkin: 'wooden', color: 'green' },
  // 25 Male Characters (using micah)
  { id: 'm_guerrier', name: 'Gunnar', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Gunnar&backgroundColor=ffdfbf', bio: 'Strikes the board like thunder. Fear his offensive sweeps.', defaultSkin: 'classic', color: 'red' },
  { id: 'm_aventurier', name: 'Finn', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Finn&backgroundColor=b6e3f4', bio: 'A drifter who picks up new tactics in every tavern.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'm_philosophe', name: 'Théo', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Théo&backgroundColor=c0aede', bio: 'Believes that every stone placed is a question asked.', defaultSkin: 'minimal', color: 'blue' },
  { id: 'm_scientifique', name: 'Albert', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Albert&backgroundColor=d1d4f9', bio: 'The board is just a matrix of probabilities to him.', defaultSkin: 'glass', color: 'teal' },
  { id: 'm_businessman', name: 'Richard', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Richard&backgroundColor=ffd5dc', bio: 'Always seals the deal. Treats every game like an acquisition.', defaultSkin: 'classic', color: 'gray' },
  { id: 'm_star', name: 'Leonardo', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Leonardo&backgroundColor=ffdfbf', bio: 'Needs to win with style to keep the paparazzi happy.', defaultSkin: 'neon', color: 'gold' },
  { id: 'm_footballeur', name: 'Cristiano', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Cristiano&backgroundColor=b6e3f4', bio: 'Treats the Gomoku board like a championship final.', defaultSkin: 'classic', color: 'green' },
  { id: 'm_basketteur', name: 'Michael', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Michael&backgroundColor=c0aede', bio: 'Never misses the final shot. Known for late-game comebacks.', defaultSkin: 'classic', color: 'orange' },
  { id: 'm_sportif', name: 'Usain', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Usain&backgroundColor=d1d4f9', bio: 'Plays so fast you won\'t even see the trap forming.', defaultSkin: 'wooden', color: 'yellow' },
  { id: 'm_chevalier', name: 'Arthur', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Arthur&backgroundColor=ffd5dc', bio: 'A noble player who never uses deceptive tricks.', defaultSkin: 'classic', color: 'silver' },
  { id: 'm_ninja', name: 'Hanzo', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Hanzo&backgroundColor=ffdfbf', bio: 'You\'ll only realize you lost when it\'s already over.', defaultSkin: 'neon', color: 'purple' },
  { id: 'm_samourai', name: 'Kenji', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Kenji&backgroundColor=b6e3f4', bio: 'Absolute focus. His cuts are clean and final.', defaultSkin: 'wooden', color: 'crimson' },
  { id: 'm_pirate', name: 'Jack', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Jack&backgroundColor=c0aede', bio: 'Rules? Those are more like guidelines to him.', defaultSkin: 'wooden', color: 'brown' },
  { id: 'm_astronaute', name: 'Neil', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Neil&backgroundColor=d1d4f9', bio: 'Used to playing in zero gravity. Thinks in 3D.', defaultSkin: 'glass', color: 'blue' },
  { id: 'm_detective', name: 'Sherlock', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Sherlock&backgroundColor=ffd5dc', bio: 'He has already deduced your next seven moves.', defaultSkin: 'minimal', color: 'brown' },
  { id: 'm_chef', name: 'Gordon', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Gordon&backgroundColor=ffdfbf', bio: 'If your strategy is raw, he will absolutely roast you.', defaultSkin: 'classic', color: 'white' },
  { id: 'm_docteur', name: 'Gregory', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Gregory&backgroundColor=b6e3f4', bio: 'Diagnoses the weaknesses in your formation instantly.', defaultSkin: 'glass', color: 'blue' },
  { id: 'm_pilote', name: 'Maverick', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Maverick&backgroundColor=c0aede', bio: 'Loves entering the danger zone. Extremely aggressive.', defaultSkin: 'neon', color: 'sky' },
  { id: 'm_artiste', name: 'Vincent', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Vincent&backgroundColor=d1d4f9', bio: 'Paints a masterpiece with his stones. Rarely plays conventionally.', defaultSkin: 'minimal', color: 'yellow' },
  { id: 'm_musicien', name: 'Wolfgang', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Wolfgang&backgroundColor=ffd5dc', bio: 'Finds the musical rhythm in the clack of the stones.', defaultSkin: 'classic', color: 'purple' },
  { id: 'm_magicien', name: 'Merlin', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Merlin&backgroundColor=ffdfbf', bio: 'Seems to magically summon intersecting lines out of nowhere.', defaultSkin: 'neon', color: 'indigo' },
  { id: 'm_roi', name: 'Louis', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Louis&backgroundColor=b6e3f4', bio: 'Expects you to let him win, but plays flawlessly anyway.', defaultSkin: 'classic', color: 'gold' },
  { id: 'm_hacker', name: 'Neo', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Neo&backgroundColor=c0aede', bio: 'He sees the code behind the Gomoku matrix.', defaultSkin: 'neon', color: 'lime' },
  { id: 'm_moine', name: 'Tenzin', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Tenzin&backgroundColor=d1d4f9', bio: 'Unbothered by threats. He plays with inner peace.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'm_chasseur', name: 'Orion', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Orion&backgroundColor=ffd5dc', bio: 'Patiently waits in the shadows for you to make a mistake.', defaultSkin: 'wooden', color: 'green' },
  // 25 Female Characters (using lorelei)
  { id: 'f_guerriere', name: 'Lagertha', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Lagertha&backgroundColor=ffdfbf', bio: 'Shieldmaiden who forms unbreakable defensive walls.', defaultSkin: 'classic', color: 'red' },
  { id: 'f_aventuriere', name: 'Lara', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Lara&backgroundColor=b6e3f4', bio: 'Explores the corners of the board pushing boundaries.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'f_philosophe', name: 'Hypatie', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Hypatie&backgroundColor=c0aede', bio: 'Studies the ancient scrolls of opening patterns.', defaultSkin: 'minimal', color: 'blue' },
  { id: 'f_scientifique', name: 'Marie', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Marie&backgroundColor=d1d4f9', bio: 'Discovered a radioactive guaranteed win tactic.', defaultSkin: 'glass', color: 'teal' },
  { id: 'f_businesswoman', name: 'Miranda', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Miranda&backgroundColor=ffd5dc', bio: 'Intimidating presence. She thrives under high pressure.', defaultSkin: 'classic', color: 'gray' },
  { id: 'f_star', name: 'Marilyn', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Marilyn&backgroundColor=ffdfbf', bio: 'Distracts opponents with her dazzling charm.', defaultSkin: 'neon', color: 'gold' },
  { id: 'f_footballeuse', name: 'Megan', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Megan&backgroundColor=b6e3f4', bio: 'Loves setting up the perfect assist for herself.', defaultSkin: 'classic', color: 'green' },
  { id: 'f_basketteuse', name: 'Diana', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Diana&backgroundColor=c0aede', bio: 'Bounces around the board to confuse her foes.', defaultSkin: 'classic', color: 'orange' },
  { id: 'f_sportive', name: 'Serena', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Serena&backgroundColor=d1d4f9', bio: 'Her opening serve is legendary and hard to return.', defaultSkin: 'wooden', color: 'yellow' },
  { id: 'f_chevaliere', name: 'Jeanne', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Jeanne&backgroundColor=ffd5dc', bio: 'Fiercely loyal to her strategy, even when losing.', defaultSkin: 'classic', color: 'silver' },
  { id: 'f_ninja', name: 'Ayane', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Ayane&backgroundColor=ffdfbf', bio: 'A master of stealth placements and sudden attacks.', defaultSkin: 'neon', color: 'purple' },
  { id: 'f_samourai', name: 'Tomoe', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Tomoe&backgroundColor=b6e3f4', bio: 'Graceful yet lethal. Every stone is perfectly placed.', defaultSkin: 'wooden', color: 'crimson' },
  { id: 'f_pirate', name: 'Anne', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Anne&backgroundColor=c0aede', bio: 'Loves stealing the initiative from the starting player.', defaultSkin: 'wooden', color: 'brown' },
  { id: 'f_astronaute', name: 'Valentina', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Valentina&backgroundColor=d1d4f9', bio: 'Her tactics are truly out of this world.', defaultSkin: 'glass', color: 'blue' },
  { id: 'f_detective', name: 'Nancy', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Nancy&backgroundColor=ffd5dc', bio: 'Investigates your bluffs and finds the truth.', defaultSkin: 'minimal', color: 'brown' },
  { id: 'f_cheffe', name: 'Julia', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Julia&backgroundColor=ffdfbf', bio: 'Bakes up a sweet victory slowly and surely.', defaultSkin: 'classic', color: 'white' },
  { id: 'f_docteur', name: 'Meredith', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Meredith&backgroundColor=b6e3f4', bio: 'Her surgical strikes to block threats are unmatched.', defaultSkin: 'glass', color: 'blue' },
  { id: 'f_pilote', name: 'Amelia', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Amelia&backgroundColor=c0aede', bio: 'Flies high above the board to see entirely new lines.', defaultSkin: 'neon', color: 'sky' },
  { id: 'f_artiste', name: 'Frida', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Frida&backgroundColor=d1d4f9', bio: 'Expresses her emotions through chaotic formations.', defaultSkin: 'minimal', color: 'yellow' },
  { id: 'f_musicienne', name: 'Clara', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Clara&backgroundColor=ffd5dc', bio: 'Plays a symphony of consecutive uninterrupted threats.', defaultSkin: 'classic', color: 'purple' },
  { id: 'f_magicienne', name: 'Morgane', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Morgane&backgroundColor=ffdfbf', bio: 'Casts illusions to make you block the wrong path.', defaultSkin: 'neon', color: 'indigo' },
  { id: 'f_reine', name: 'Victoria', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Victoria&backgroundColor=b6e3f4', bio: 'Has an aura that commands respect on the board.', defaultSkin: 'classic', color: 'gold' },
  { id: 'f_hacker', name: 'Trinity', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Trinity&backgroundColor=c0aede', bio: 'Bypasses standard defenses with ease.', defaultSkin: 'neon', color: 'lime' },
  { id: 'f_moniale', name: 'Teresa', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Teresa&backgroundColor=d1d4f9', bio: 'Never gets frustrated, even when cornered.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'f_chasseuse', name: 'Artemis', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Artemis&backgroundColor=ffd5dc', bio: 'Draws her bow and secures the win from afar.', defaultSkin: 'wooden', color: 'green' },
  // Bob Cut Collection
  { id: 'bob_1', name: 'Bobbie', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Bob1&baseColor=f87171&hair=bob', bio: 'Precision-cut moves for a precision-cut look.', defaultSkin: 'minimal', color: 'rose' },
  { id: 'bob_2', name: 'Sleek Sarah', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Bob2&baseColor=60a5fa&hair=bob', bio: 'Aerodynamic hair for lightning-fast strategy.', defaultSkin: 'glass', color: 'blue' },
  { id: 'bob_3', name: 'Autumn Bob', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Bob3&baseColor=fbbf24&hair=bob', bio: 'The colors of the falls, the strategy of the mountain.', defaultSkin: 'wooden', color: 'amber' },
  { id: 'bob_4', name: 'Indigo', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Bob4&baseColor=818cf8&hair=bob', bio: 'Deeply thoughtful, deeply stylish.', defaultSkin: 'neon', color: 'indigo' },
  { id: 'bob_5', name: 'Jade', avatar: 'https://api.dicebear.com/9.x/micah/svg?seed=Bob5&baseColor=34d399&hair=bob', bio: 'Green is the color of growth and victory.', defaultSkin: 'forest', color: 'emerald' },

  // Monster Horde (40 characters)
  { id: 'mon_1', name: 'Blobbo', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Blobbo&backgroundColor=f43f5e', bio: 'A gelatinous genius from the red nebula.', defaultSkin: 'ruby', color: 'rose' },
  { id: 'mon_2', name: 'Grumpus', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Grumpus&backgroundColor=1e293b', bio: 'Only happy when he is making your lives difficult.', defaultSkin: 'midnight', color: 'slate' },
  { id: 'mon_3', name: 'Zorg', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Zorg&backgroundColor=9333ea', bio: 'Does not compute "loss". Only "total dominance".', defaultSkin: 'neon', color: 'purple' },
  { id: 'mon_4', name: 'Eyeball', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Eyeball&backgroundColor=fbbf24', bio: 'Sees every potential line 50 moves ahead.', defaultSkin: 'minimal', color: 'amber' },
  { id: 'mon_5', name: 'Spike', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Spike&backgroundColor=10b981', bio: 'Sharp moves and even sharper hardware.', defaultSkin: 'forest', color: 'emerald' },
  { id: 'mon_6', name: 'Gloop', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Gloop&backgroundColor=0ea5e9', bio: 'Leaves a sticky trail of stones you can\'t ignore.', defaultSkin: 'glass', color: 'sky' },
  { id: 'mon_7', name: 'Rusty', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Rusty&backgroundColor=ea580c', bio: 'An old machine with timeless tactical wisdom.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'mon_8', name: 'Pinky', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Pinky&backgroundColor=db2777', bio: 'Looks cute, plays like a devouring beast.', defaultSkin: 'pixel', color: 'pink' },
  { id: 'mon_9', name: 'Shadow', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Shadow&backgroundColor=000000', bio: 'Emerges from the darkness to steal your win.', defaultSkin: 'midnight', color: 'black' },
  { id: 'mon_10', name: 'Sparky', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Sparky&backgroundColor=eab308', bio: 'Highly energetic and unpredictable patterns.', defaultSkin: 'neon', color: 'yellow' },
  { id: 'mon_11', name: 'Munch', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Munch&backgroundColor=4f46e5', bio: 'Hungers for your stones. Don\'t leave gaps.', defaultSkin: 'classic', color: 'indigo' },
  { id: 'mon_12', name: 'Blink', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Blink&backgroundColor=ef4444', bio: 'He is in three places on the board at once.', defaultSkin: 'neon', color: 'red' },
  { id: 'mon_13', name: 'Goop', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Goop&backgroundColor=166534', bio: 'Slow, steady, and inevitable.', defaultSkin: 'forest', color: 'green' },
  { id: 'mon_14', name: 'Clicker', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Clicker&backgroundColor=71717a', bio: 'Every move sounds like a mechanical clock.', defaultSkin: 'minimal', color: 'zinc' },
  { id: 'mon_15', name: 'Beast', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Beast&backgroundColor=7c2d12', bio: 'Pure aggression. No defense, only attack.', defaultSkin: 'ruby', color: 'orange' },
  { id: 'mon_16', name: 'Volt', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Volt&backgroundColor=2563eb', bio: 'Electrifying speed and shocking accuracy.', defaultSkin: 'neon', color: 'blue' },
  { id: 'mon_17', name: 'Squelch', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Squelch&backgroundColor=a21caf', bio: 'Don\'t slip on his unusual formations.', defaultSkin: 'glass', color: 'fuchsia' },
  { id: 'mon_18', name: 'Tank', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Tank&backgroundColor=3f6212', bio: 'Immovable objects are its specialty.', defaultSkin: 'wooden', color: 'lime' },
  { id: 'mon_19', name: 'Nibble', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Nibble&backgroundColor=be185d', bio: 'Eats away at your defense one stone at a time.', defaultSkin: 'pixel', color: 'pink' },
  { id: 'mon_20', name: 'Turbo', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Turbo&backgroundColor=1d4ed8', bio: 'Optimized for 1,000 moves per second.', defaultSkin: 'neon', color: 'blue' },
  { id: 'mon_21', name: 'Glitch', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Glitch&backgroundColor=4338ca', bio: 'His moves shouldn\'t work, but they do.', defaultSkin: 'glass', color: 'indigo' },
  { id: 'mon_22', name: 'Gear', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Gear&backgroundColor=374151', bio: 'A master of interlocking systems.', defaultSkin: 'classic', color: 'gray' },
  { id: 'mon_23', name: 'Slime', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Slime&backgroundColor=15803d', bio: 'Adapts to any board shape instantly.', defaultSkin: 'forest', color: 'green' },
  { id: 'mon_24', name: 'Circuit', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Circuit&backgroundColor=b91c1c', bio: 'Connected in ways you won\'t see coming.', defaultSkin: 'neon', color: 'red' },
  { id: 'mon_25', name: 'Wiggler', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Wiggler&backgroundColor=7e22ce', bio: 'Slithers through your lines with ease.', defaultSkin: 'neon', color: 'purple' },
  { id: 'mon_26', name: 'Bolt', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Bolt&backgroundColor=0369a1', bio: 'Strikes once and ends the game.', defaultSkin: 'glass', color: 'sky' },
  { id: 'mon_27', name: 'Ooze', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Ooze&backgroundColor=4d7c0f', bio: 'Slowly suffocates your board presence.', defaultSkin: 'forest', color: 'lime' },
  { id: 'mon_28', name: 'Chip', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Chip&backgroundColor=b45309', bio: 'Small size, massive processing power.', defaultSkin: 'pixel', color: 'amber' },
  { id: 'mon_29', name: 'Chomp', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Chomp&backgroundColor=9f1239', bio: 'Takes what he wants, especially win lines.', defaultSkin: 'ruby', color: 'rose' },
  { id: 'mon_30', name: 'Signal', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Signal&backgroundColor=0e7490', bio: 'Transmits winning vibes only.', defaultSkin: 'minimal', color: 'cyan' },
  { id: 'mon_31', name: 'Troll', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Troll&backgroundColor=431407', bio: 'Loves blocking you just for the fun of it.', defaultSkin: 'wooden', color: 'brown' },
  { id: 'mon_32', name: 'Servo', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Servo&backgroundColor=065f46', bio: 'Smooth and consistent performance.', defaultSkin: 'minimal', color: 'emerald' },
  { id: 'mon_33', name: 'Gargoyle', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Gargoyle&backgroundColor=334155', bio: 'Stony silence and cold, hard calculations.', defaultSkin: 'midnight', color: 'slate' },
  { id: 'mon_34', name: 'Logic', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Logic&backgroundColor=1e1b4b', bio: 'Pure mathematical reasoning.', defaultSkin: 'minimal', color: 'indigo' },
  { id: 'mon_35', name: 'Crusher', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Crusher&backgroundColor=991b1b', bio: 'He doesn\'t just win; he dominates.', defaultSkin: 'ruby', color: 'red' },
  { id: 'mon_36', name: 'Kernel', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Kernel&backgroundColor=374151', bio: 'At the heart of every machine.', defaultSkin: 'minimal', color: 'gray' },
  { id: 'mon_37', name: 'Spook', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Spook&backgroundColor=525252', bio: 'Now you see his win line, now you don\'t.', defaultSkin: 'midnight', color: 'zinc' },
  { id: 'mon_38', name: 'Crank', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Crank&backgroundColor=78350f', bio: 'Always turning the gears of destiny.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'mon_39', name: 'Puff', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Puff&backgroundColor=be123c', bio: 'Soft outside, titanium logic inside.', defaultSkin: 'pixel', color: 'rose' },
  { id: 'mon_40', name: 'Omega', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Omega&backgroundColor=000000', bio: 'The binary beginning and end.', defaultSkin: 'neon', color: 'white' },

  // Mixed Bob Monsters
  { id: 'mon_bob_1', name: 'B-Monster', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=BobMonster1&backgroundColor=f43f5e&hair=bob', bio: 'A monster with a permit for style.', defaultSkin: 'ruby', color: 'rose' },
  { id: 'mon_bob_2', name: 'Cuty-Scary', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=BobMonster2&backgroundColor=10b981&hair=bob', bio: 'The bob cut makes the horns look fashionable.', defaultSkin: 'forest', color: 'emerald' },
  { id: 'mon_bob_3', name: 'Void Bob', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=BobMonster3&backgroundColor=1e293b&hair=bob', bio: 'The stylish end of the universe.', defaultSkin: 'midnight', color: 'slate' },
  { id: 'mon_bob_4', name: 'Cyber Bob', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=BobMonster4&backgroundColor=9333ea&hair=bob', bio: 'Bob cuts on robots: The next frontier.', defaultSkin: 'neon', color: 'purple' },
  { id: 'mon_bob_5', name: 'Glam-Ghou', avatar: 'https://api.dicebear.com/9.x/big-ears/svg?seed=BobMonster5&backgroundColor=db2777&hair=bob', bio: 'Terror has never looked this chic.', defaultSkin: 'pixel', color: 'pink' }
];
