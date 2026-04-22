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
    id: 'neon',
    name: 'Cyberpunk',
    boardColor: '#0f172a',
    lineColor: 'rgba(56,189,248,0.3)',
    blackStone: 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    whiteStone: 'bg-gradient-to-br from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(34,211,238,0.5)]',
    description: 'Futuristic neon glow.'
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
  { id: 'f_chasseuse', name: 'Artemis', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Artemis&backgroundColor=ffd5dc', bio: 'Draws her bow and secures the win from afar.', defaultSkin: 'wooden', color: 'green' }
];
