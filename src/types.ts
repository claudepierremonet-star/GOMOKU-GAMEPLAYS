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
  { id: 'master_lin', name: 'Wei Lin', avatar: 'https://i.pravatar.cc/1080?u=master_lin', bio: 'A legendary Gomoku master from the East.', defaultSkin: 'classic', color: 'emerald' },
  { id: 'cyber_x', name: 'Unit-734', avatar: 'https://i.pravatar.cc/1080?u=cyber_x', bio: 'An AI entity specialized in pattern recognition.', defaultSkin: 'neon', color: 'cyan' },
  { id: 'nature_spirit', name: 'Elara', avatar: 'https://i.pravatar.cc/1080?u=nature_spirit', bio: 'Plays with the harmony of the forest.', defaultSkin: 'wooden', color: 'green' },
  // 25 Male Characters
  { id: 'm_guerrier', name: 'Gunnar', avatar: 'https://i.pravatar.cc/1080?u=m_guerrier', bio: 'Un combattant redoutable sur le champ de bataille.', defaultSkin: 'classic', color: 'red' },
  { id: 'm_aventurier', name: 'Finn', avatar: 'https://i.pravatar.cc/1080?u=m_aventurier', bio: 'Toujours à la recherche de nouveaux défis.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'm_philosophe', name: 'Théo', avatar: 'https://i.pravatar.cc/1080?u=m_philosophe', bio: 'Réfléchit à chaque coup avec une profonde sagesse.', defaultSkin: 'minimal', color: 'blue' },
  { id: 'm_scientifique', name: 'Albert', avatar: 'https://i.pravatar.cc/1080?u=m_scientifique', bio: 'Calcule les probabilités de chaque mouvement.', defaultSkin: 'glass', color: 'teal' },
  { id: 'm_businessman', name: 'Richard', avatar: 'https://i.pravatar.cc/1080?u=m_businessman', bio: 'Négocie sa victoire coup par coup.', defaultSkin: 'classic', color: 'gray' },
  { id: 'm_star', name: 'Leonardo', avatar: 'https://i.pravatar.cc/1080?u=m_star', bio: 'Joue pour le spectacle et ses fans.', defaultSkin: 'neon', color: 'gold' },
  { id: 'm_footballeur', name: 'Cristiano', avatar: 'https://i.pravatar.cc/1080?u=m_footballeur', bio: 'A l\'habitude des terrains et de la stratégie.', defaultSkin: 'classic', color: 'green' },
  { id: 'm_basketteur', name: 'Michael', avatar: 'https://i.pravatar.cc/1080?u=m_basketteur', bio: 'Vise toujours dans le mille.', defaultSkin: 'classic', color: 'orange' },
  { id: 'm_sportif', name: 'Usain', avatar: 'https://i.pravatar.cc/1080?u=m_sportif', bio: 'L\'endurance est la clé de sa victoire.', defaultSkin: 'wooden', color: 'yellow' },
  { id: 'm_chevalier', name: 'Arthur', avatar: 'https://i.pravatar.cc/1080?u=m_chevalier', bio: 'Protège son roi et ses pions avec honneur.', defaultSkin: 'classic', color: 'silver' },
  { id: 'm_ninja', name: 'Hanzo', avatar: 'https://i.pravatar.cc/1080?u=m_ninja', bio: 'Frappe là où on s\'y attend le moins.', defaultSkin: 'neon', color: 'purple' },
  { id: 'm_samourai', name: 'Kenji', avatar: 'https://i.pravatar.cc/1080?u=m_samourai', bio: 'La voie du guerrier guide ses pierres.', defaultSkin: 'wooden', color: 'crimson' },
  { id: 'm_pirate', name: 'Jack', avatar: 'https://i.pravatar.cc/1080?u=m_pirate', bio: 'Prêt à tout pour le trésor de la victoire.', defaultSkin: 'wooden', color: 'brown' },
  { id: 'm_astronaute', name: 'Neil', avatar: 'https://i.pravatar.cc/1080?u=m_astronaute', bio: 'A une vision globale du plateau.', defaultSkin: 'glass', color: 'blue' },
  { id: 'm_detective', name: 'Sherlock', avatar: 'https://i.pravatar.cc/1080?u=m_detective', bio: 'Anticipe les plans de son adversaire.', defaultSkin: 'minimal', color: 'brown' },
  { id: 'm_chef', name: 'Gordon', avatar: 'https://i.pravatar.cc/1080?u=m_chef', bio: 'Prépare une stratégie aux petits oignons.', defaultSkin: 'classic', color: 'white' },
  { id: 'm_docteur', name: 'Gregory', avatar: 'https://i.pravatar.cc/1080?u=m_docteur', bio: 'Opère sur le plateau avec précision.', defaultSkin: 'glass', color: 'blue' },
  { id: 'm_pilote', name: 'Maverick', avatar: 'https://i.pravatar.cc/1080?u=m_pilote', bio: 'Garde le cap même dans la tempête.', defaultSkin: 'neon', color: 'sky' },
  { id: 'm_artiste', name: 'Vincent', avatar: 'https://i.pravatar.cc/1080?u=m_artiste', bio: 'Dessine des motifs complexes avec ses pierres.', defaultSkin: 'minimal', color: 'yellow' },
  { id: 'm_musicien', name: 'Wolfgang', avatar: 'https://i.pravatar.cc/1080?u=m_musicien', bio: 'Joue au rythme de son intuition.', defaultSkin: 'classic', color: 'purple' },
  { id: 'm_magicien', name: 'Merlin', avatar: 'https://i.pravatar.cc/1080?u=m_magicien', bio: 'Fait disparaître les espoirs de l\'adversaire.', defaultSkin: 'neon', color: 'indigo' },
  { id: 'm_roi', name: 'Louis', avatar: 'https://i.pravatar.cc/1080?u=m_roi', bio: 'Règne en maître sur le plateau.', defaultSkin: 'classic', color: 'gold' },
  { id: 'm_hacker', name: 'Neo', avatar: 'https://i.pravatar.cc/1080?u=m_hacker', bio: 'Trouve toujours la faille dans le système.', defaultSkin: 'neon', color: 'lime' },
  { id: 'm_moine', name: 'Tenzin', avatar: 'https://i.pravatar.cc/1080?u=m_moine', bio: 'La patience est sa plus grande arme.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'm_chasseur', name: 'Orion', avatar: 'https://i.pravatar.cc/1080?u=m_chasseur', bio: 'Traque la moindre erreur de l\'adversaire.', defaultSkin: 'wooden', color: 'green' },
  // 25 Female Characters
  { id: 'f_guerriere', name: 'Lagertha', avatar: 'https://i.pravatar.cc/1080?u=f_guerriere', bio: 'Une combattante redoutable sur le champ de bataille.', defaultSkin: 'classic', color: 'red' },
  { id: 'f_aventuriere', name: 'Lara', avatar: 'https://i.pravatar.cc/1080?u=f_aventuriere', bio: 'Toujours à la recherche de nouveaux défis.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'f_philosophe', name: 'Hypatie', avatar: 'https://i.pravatar.cc/1080?u=f_philosophe', bio: 'Réfléchit à chaque coup avec une profonde sagesse.', defaultSkin: 'minimal', color: 'blue' },
  { id: 'f_scientifique', name: 'Marie', avatar: 'https://i.pravatar.cc/1080?u=f_scientifique', bio: 'Calcule les probabilités de chaque mouvement.', defaultSkin: 'glass', color: 'teal' },
  { id: 'f_businesswoman', name: 'Miranda', avatar: 'https://i.pravatar.cc/1080?u=f_businesswoman', bio: 'Négocie sa victoire coup par coup.', defaultSkin: 'classic', color: 'gray' },
  { id: 'f_star', name: 'Marilyn', avatar: 'https://i.pravatar.cc/1080?u=f_star', bio: 'Joue pour le spectacle et ses fans.', defaultSkin: 'neon', color: 'gold' },
  { id: 'f_footballeuse', name: 'Megan', avatar: 'https://i.pravatar.cc/1080?u=f_footballeuse', bio: 'A l\'habitude des terrains et de la stratégie.', defaultSkin: 'classic', color: 'green' },
  { id: 'f_basketteuse', name: 'Diana', avatar: 'https://i.pravatar.cc/1080?u=f_basketteuse', bio: 'Vise toujours dans le mille.', defaultSkin: 'classic', color: 'orange' },
  { id: 'f_sportive', name: 'Serena', avatar: 'https://i.pravatar.cc/1080?u=f_sportive', bio: 'L\'endurance est la clé de sa victoire.', defaultSkin: 'wooden', color: 'yellow' },
  { id: 'f_chevaliere', name: 'Jeanne', avatar: 'https://i.pravatar.cc/1080?u=f_chevaliere', bio: 'Protège son roi et ses pions avec honneur.', defaultSkin: 'classic', color: 'silver' },
  { id: 'f_ninja', name: 'Ayane', avatar: 'https://i.pravatar.cc/1080?u=f_ninja', bio: 'Frappe là où on s\'y attend le moins.', defaultSkin: 'neon', color: 'purple' },
  { id: 'f_samourai', name: 'Tomoe', avatar: 'https://i.pravatar.cc/1080?u=f_samourai', bio: 'La voie du guerrier guide ses pierres.', defaultSkin: 'wooden', color: 'crimson' },
  { id: 'f_pirate', name: 'Anne', avatar: 'https://i.pravatar.cc/1080?u=f_pirate', bio: 'Prête à tout pour le trésor de la victoire.', defaultSkin: 'wooden', color: 'brown' },
  { id: 'f_astronaute', name: 'Valentina', avatar: 'https://i.pravatar.cc/1080?u=f_astronaute', bio: 'A une vision globale du plateau.', defaultSkin: 'glass', color: 'blue' },
  { id: 'f_detective', name: 'Nancy', avatar: 'https://i.pravatar.cc/1080?u=f_detective', bio: 'Anticipe les plans de son adversaire.', defaultSkin: 'minimal', color: 'brown' },
  { id: 'f_cheffe', name: 'Julia', avatar: 'https://i.pravatar.cc/1080?u=f_cheffe', bio: 'Prépare une stratégie aux petits oignons.', defaultSkin: 'classic', color: 'white' },
  { id: 'f_docteur', name: 'Meredith', avatar: 'https://i.pravatar.cc/1080?u=f_docteur', bio: 'Opère sur le plateau avec précision.', defaultSkin: 'glass', color: 'blue' },
  { id: 'f_pilote', name: 'Amelia', avatar: 'https://i.pravatar.cc/1080?u=f_pilote', bio: 'Garde le cap même dans la tempête.', defaultSkin: 'neon', color: 'sky' },
  { id: 'f_artiste', name: 'Frida', avatar: 'https://i.pravatar.cc/1080?u=f_artiste', bio: 'Dessine des motifs complexes avec ses pierres.', defaultSkin: 'minimal', color: 'yellow' },
  { id: 'f_musicienne', name: 'Clara', avatar: 'https://i.pravatar.cc/1080?u=f_musicienne', bio: 'Joue au rythme de son intuition.', defaultSkin: 'classic', color: 'purple' },
  { id: 'f_magicienne', name: 'Morgane', avatar: 'https://i.pravatar.cc/1080?u=f_magicienne', bio: 'Fait disparaître les espoirs de l\'adversaire.', defaultSkin: 'neon', color: 'indigo' },
  { id: 'f_reine', name: 'Victoria', avatar: 'https://i.pravatar.cc/1080?u=f_reine', bio: 'Règne en maître sur le plateau.', defaultSkin: 'classic', color: 'gold' },
  { id: 'f_hacker', name: 'Trinity', avatar: 'https://i.pravatar.cc/1080?u=f_hacker', bio: 'Trouve toujours la faille dans le système.', defaultSkin: 'neon', color: 'lime' },
  { id: 'f_moniale', name: 'Teresa', avatar: 'https://i.pravatar.cc/1080?u=f_moniale', bio: 'La patience est sa plus grande arme.', defaultSkin: 'wooden', color: 'orange' },
  { id: 'f_chasseuse', name: 'Artemis', avatar: 'https://i.pravatar.cc/1080?u=f_chasseuse', bio: 'Traque la moindre erreur de l\'adversaire.', defaultSkin: 'wooden', color: 'green' }
];
