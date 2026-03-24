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
}

export const CHARACTERS: Character[] = [
  { id: 'master_lin', name: 'Master Lin', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=MasterLin', bio: 'A legendary Gomoku master from the East.', defaultSkin: 'classic' },
  { id: 'cyber_x', name: 'Cyber-X', avatar: 'https://api.dicebear.com/9.x/bottts/svg?seed=Cyber-X', bio: 'An AI entity specialized in pattern recognition.', defaultSkin: 'neon' },
  { id: 'nature_spirit', name: 'Nature Spirit', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=NatureSpirit', bio: 'Plays with the harmony of the forest.', defaultSkin: 'wooden' },
  // 25 Male Characters
  { id: 'm_guerrier', name: 'Guerrier', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Guerrier', bio: 'Un combattant redoutable sur le champ de bataille.', defaultSkin: 'classic' },
  { id: 'm_aventurier', name: 'Aventurier', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aventurier', bio: 'Toujours à la recherche de nouveaux défis.', defaultSkin: 'wooden' },
  { id: 'm_philosophe', name: 'Philosophe', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Philosophe', bio: 'Réfléchit à chaque coup avec une profonde sagesse.', defaultSkin: 'minimal' },
  { id: 'm_scientifique', name: 'Scientifique', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Scientifique', bio: 'Calcule les probabilités de chaque mouvement.', defaultSkin: 'glass' },
  { id: 'm_businessman', name: 'Homme d\'affaires', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=HommeDaffaires', bio: 'Négocie sa victoire coup par coup.', defaultSkin: 'classic' },
  { id: 'm_star', name: 'Célébrité', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Celebrite', bio: 'Joue pour le spectacle et ses fans.', defaultSkin: 'neon' },
  { id: 'm_footballeur', name: 'Footballeur', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Footballeur', bio: 'A l\'habitude des terrains et de la stratégie.', defaultSkin: 'classic' },
  { id: 'm_basketteur', name: 'Basketteur', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Basketteur', bio: 'Vise toujours dans le mille.', defaultSkin: 'classic' },
  { id: 'm_sportif', name: 'Sportif', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Sportif', bio: 'L\'endurance est la clé de sa victoire.', defaultSkin: 'wooden' },
  { id: 'm_chevalier', name: 'Chevalier', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Chevalier', bio: 'Protège son roi et ses pions avec honneur.', defaultSkin: 'classic' },
  { id: 'm_ninja', name: 'Ninja', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Ninja', bio: 'Frappe là où on s\'y attend le moins.', defaultSkin: 'neon' },
  { id: 'm_samourai', name: 'Samouraï', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Samourai', bio: 'La voie du guerrier guide ses pierres.', defaultSkin: 'wooden' },
  { id: 'm_pirate', name: 'Pirate', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Pirate', bio: 'Prêt à tout pour le trésor de la victoire.', defaultSkin: 'wooden' },
  { id: 'm_astronaute', name: 'Astronaute', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Astronaute', bio: 'A une vision globale du plateau.', defaultSkin: 'glass' },
  { id: 'm_detective', name: 'Détective', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Detective', bio: 'Anticipe les plans de son adversaire.', defaultSkin: 'minimal' },
  { id: 'm_chef', name: 'Chef Cuisinier', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ChefCuisinier', bio: 'Prépare une stratégie aux petits oignons.', defaultSkin: 'classic' },
  { id: 'm_docteur', name: 'Docteur', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Docteur', bio: 'Opère sur le plateau avec précision.', defaultSkin: 'glass' },
  { id: 'm_pilote', name: 'Pilote', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Pilote', bio: 'Garde le cap même dans la tempête.', defaultSkin: 'neon' },
  { id: 'm_artiste', name: 'Artiste', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Artiste', bio: 'Dessine des motifs complexes avec ses pierres.', defaultSkin: 'minimal' },
  { id: 'm_musicien', name: 'Musicien', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Musicien', bio: 'Joue au rythme de son intuition.', defaultSkin: 'classic' },
  { id: 'm_magicien', name: 'Magicien', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Magicien', bio: 'Fait disparaître les espoirs de l\'adversaire.', defaultSkin: 'neon' },
  { id: 'm_roi', name: 'Roi', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Roi', bio: 'Règne en maître sur le plateau.', defaultSkin: 'classic' },
  { id: 'm_hacker', name: 'Hacker', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Hacker', bio: 'Trouve toujours la faille dans le système.', defaultSkin: 'neon' },
  { id: 'm_moine', name: 'Moine', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Moine', bio: 'La patience est sa plus grande arme.', defaultSkin: 'wooden' },
  { id: 'm_chasseur', name: 'Chasseur', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Chasseur', bio: 'Traque la moindre erreur de l\'adversaire.', defaultSkin: 'wooden' },
  // 25 Female Characters
  { id: 'f_guerriere', name: 'Guerrière', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Guerriere', bio: 'Une combattante redoutable sur le champ de bataille.', defaultSkin: 'classic' },
  { id: 'f_aventuriere', name: 'Aventurière', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aventuriere', bio: 'Toujours à la recherche de nouveaux défis.', defaultSkin: 'wooden' },
  { id: 'f_philosophe', name: 'Philosophe', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=PhilosopheF', bio: 'Réfléchit à chaque coup avec une profonde sagesse.', defaultSkin: 'minimal' },
  { id: 'f_scientifique', name: 'Scientifique', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ScientifiqueF', bio: 'Calcule les probabilités de chaque mouvement.', defaultSkin: 'glass' },
  { id: 'f_businesswoman', name: 'Femme d\'affaires', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=FemmeDaffaires', bio: 'Négocie sa victoire coup par coup.', defaultSkin: 'classic' },
  { id: 'f_star', name: 'Célébrité', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=CelebriteF', bio: 'Joue pour le spectacle et ses fans.', defaultSkin: 'neon' },
  { id: 'f_footballeuse', name: 'Footballeuse', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Footballeuse', bio: 'A l\'habitude des terrains et de la stratégie.', defaultSkin: 'classic' },
  { id: 'f_basketteuse', name: 'Basketteuse', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Basketteuse', bio: 'Vise toujours dans le mille.', defaultSkin: 'classic' },
  { id: 'f_sportive', name: 'Sportive', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Sportive', bio: 'L\'endurance est la clé de sa victoire.', defaultSkin: 'wooden' },
  { id: 'f_chevaliere', name: 'Chevalière', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Chevaliere', bio: 'Protège son roi et ses pions avec honneur.', defaultSkin: 'classic' },
  { id: 'f_ninja', name: 'Ninja', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=NinjaF', bio: 'Frappe là où on s\'y attend le moins.', defaultSkin: 'neon' },
  { id: 'f_samourai', name: 'Samouraï', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=SamouraiF', bio: 'La voie du guerrier guide ses pierres.', defaultSkin: 'wooden' },
  { id: 'f_pirate', name: 'Pirate', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=PirateF', bio: 'Prête à tout pour le trésor de la victoire.', defaultSkin: 'wooden' },
  { id: 'f_astronaute', name: 'Astronaute', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=AstronauteF', bio: 'A une vision globale du plateau.', defaultSkin: 'glass' },
  { id: 'f_detective', name: 'Détective', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=DetectiveF', bio: 'Anticipe les plans de son adversaire.', defaultSkin: 'minimal' },
  { id: 'f_cheffe', name: 'Cheffe Cuisinière', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=CheffeCuisiniere', bio: 'Prépare une stratégie aux petits oignons.', defaultSkin: 'classic' },
  { id: 'f_docteur', name: 'Docteur', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=DocteurF', bio: 'Opère sur le plateau avec précision.', defaultSkin: 'glass' },
  { id: 'f_pilote', name: 'Pilote', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=PiloteF', bio: 'Garde le cap même dans la tempête.', defaultSkin: 'neon' },
  { id: 'f_artiste', name: 'Artiste', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=ArtisteF', bio: 'Dessine des motifs complexes avec ses pierres.', defaultSkin: 'minimal' },
  { id: 'f_musicienne', name: 'Musicienne', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Musicienne', bio: 'Joue au rythme de son intuition.', defaultSkin: 'classic' },
  { id: 'f_magicienne', name: 'Magicienne', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Magicienne', bio: 'Fait disparaître les espoirs de l\'adversaire.', defaultSkin: 'neon' },
  { id: 'f_reine', name: 'Reine', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Reine', bio: 'Règne en maître sur le plateau.', defaultSkin: 'classic' },
  { id: 'f_hacker', name: 'Hacker', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=HackerF', bio: 'Trouve toujours la faille dans le système.', defaultSkin: 'neon' },
  { id: 'f_moniale', name: 'Moniale', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Moniale', bio: 'La patience est sa plus grande arme.', defaultSkin: 'wooden' },
  { id: 'f_chasseuse', name: 'Chasseuse', avatar: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Chasseuse', bio: 'Traque la moindre erreur de l\'adversaire.', defaultSkin: 'wooden' }
];
