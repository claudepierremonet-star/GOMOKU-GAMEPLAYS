import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, Settings, Trophy, User, ChevronLeft, ChevronRight, SkipBack, SkipForward, Volume2, Moon, Sun, Monitor, RefreshCw, Cpu, Lightbulb, X, Check, Grid, BookOpen, UserCircle, Palette, Globe, Loader2, Users, LogOut, Music, MessageSquare, Send, Undo2, HelpCircle, ShieldCheck, Scale, Mail, Info, Trash2, MapPin, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GomokuBoard } from './GomokuBoard';
import { BoardState, Player, createEmptyBoard, checkWin, isBoardFull, Threat, findThreats } from '../game/engine';
import { getBestMove, getCoachAdvice, Difficulty } from '../game/ai';
import { connectSocket, disconnectSocket, getSocket } from '../game/socket';
import { MatchRecord, getRankTier, getNextRank, RANK_TIERS, SKINS, CHARACTERS, SkinId, UserProfile, Character, Skin } from '../types';
import { auth, db, loginWithGoogle, logout, onAuthStateChanged, User as FirebaseUser, OperationType, handleFirestoreError, doc, getDoc, setDoc, updateDoc, deleteDoc, getDocs, addDoc, collection, query, where, orderBy, limit, onSnapshot, serverTimestamp, Timestamp } from '../firebase';

import { MusicPlayer } from './MusicPlayer';
import { TutorialScreen } from './TutorialScreen';
import { CustomSkinDesigner } from './CustomSkinDesigner';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

import { toast } from 'sonner';

const AMBIENT_COLORS = [
  { name: 'Aucun', value: 'transparent' },
  { name: 'Noir Métallique', value: '#2a2a2a' },
  { name: 'Noir', value: '#090909' },
  { name: 'Or', value: '#FFD700' },
  { name: 'Jaune Fluo', value: '#eaff00' },
  { name: 'Vert Fluo', value: '#39ff14' },
  { name: 'Orange Fluo', value: '#ff6600' },
  { name: 'Bleu Fluo', value: '#0044ff' },
  { name: 'Bleu Ciel Fluo', value: '#00ffff' },
  { name: 'Bleu Électrique Fluo', value: '#0ff0fc' },
  { name: 'Rouge Fluo', value: '#ff003c' },
  { name: 'Beige Fluo', value: '#fffae6' },
  { name: 'Blanc Fluo', value: '#ffffff' },
];

type Screen = 'home' | 'game' | 'settings' | 'stats' | 'replay' | 'music' | 'profile' | 'tutorial' | 'support' | 'privacy' | 'online';
type GameMode = 'pvp' | 'pve' | 'online';
type BoardSize = 15 | 19;
type RuleSet = 'casual' | 'renju';
type StartingPlayer = 'human' | 'ai';
type TimeLimit = 0 | 15 | 30 | 60;

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isMe: boolean;
}

const COLOR_MAP: Record<string, string> = {
  emerald: '#10b981', cyan: '#06b6d4', green: '#22c55e', red: '#ef4444',
  orange: '#f97316', blue: '#3b82f6', teal: '#14b8a6', gray: '#6b7280',
  gold: '#eab308', yellow: '#eab308', silver: '#9ca3af', purple: '#a855f7',
  crimson: '#dc2626', brown: '#78350f', sky: '#0ea5e9', indigo: '#6366f1',
  lime: '#84cc16', white: '#ffffff', black: '#000000'
};

interface SavedGameState {
  board: BoardState;
  currentPlayer: Player;
  moveHistory: { row: number; col: number; player: Player }[];
  gameMode: GameMode;
  boardSize: BoardSize;
  aiDifficulty: Difficulty;
  startingPlayer: StartingPlayer;
  timeLimit: TimeLimit;
  selectedSkinId: SkinId;
  selectedCharacterId: string;
  lastMove: { row: number; col: number } | null;
  ruleSet: RuleSet;
}

export function AppScreens() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  
  // Custom Character Creation State
  const [newCharName, setNewCharName] = useState('');
  const [newCharAvatar, setNewCharAvatar] = useState('');
  const [newCharBio, setNewCharBio] = useState('');
  const [isCreatingChar, setIsCreatingChar] = useState(false);

  // Custom Skin Creation State
  const [isCreatingSkin, setIsCreatingSkin] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>('pve');
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem('gomoku_aiDifficulty');
    return (saved as Difficulty) || 'Intermediate';
  });
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [searchTimeElapsed, setSearchTimeElapsed] = useState(0);
  const [privateRoomCode, setPrivateRoomCode] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [onlinePlayerColor, setOnlinePlayerColorState] = useState<Player>(null);
  const onlinePlayerColorRef = useRef<Player>(null);
  
  const setOnlinePlayerColor = (color: Player) => {
    setOnlinePlayerColorState(color);
    onlinePlayerColorRef.current = color;
  };

  const [onlineOpponentLeft, setOnlineOpponentLeft] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('auto');
  const [locationName, setLocationName] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [playerElo, setPlayerEloState] = useState<number>(1200);
  const playerEloRef = useRef<number>(1200);
  const setPlayerElo = (elo: number) => {
    setPlayerEloState(elo);
    playerEloRef.current = elo;
  };

  const [opponentElo, setOpponentEloState] = useState<number | null>(null);
  const opponentEloRef = useRef<number | null>(null);
  const setOpponentElo = (elo: number | null) => {
    setOpponentEloState(elo);
    opponentEloRef.current = elo;
  };
  const [opponentUserId, setOpponentUserId] = useState<string | null>(null);
  const [opponentAvatarUrl, setOpponentAvatarUrl] = useState<string | null>(null);
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [moveHistory, setMoveHistory] = useState<{ row: number; col: number; player: Player }[]>([]);
  const [replayMatch, setReplayMatch] = useState<MatchRecord | null>(null);
  const [replayMoveIndex, setReplayMoveIndex] = useState<number>(0);
  const [replayBoard, setReplayBoard] = useState<BoardState>([]);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // Settings
  const [boardSize, setBoardSize] = useState<BoardSize>(() => {
    const saved = localStorage.getItem('gomoku_boardSize');
    return saved ? parseInt(saved) as BoardSize : 15;
  });
  const [ruleSet, setRuleSet] = useState<RuleSet>(() => {
    const saved = localStorage.getItem('gomoku_ruleSet');
    return (saved as RuleSet) || 'casual';
  });
  const [startingPlayer, setStartingPlayer] = useState<StartingPlayer>(() => {
    const saved = localStorage.getItem('gomoku_startingPlayer');
    return (saved as StartingPlayer) || 'human';
  });
  const [timeLimit, setTimeLimitSetting] = useState<TimeLimit>(() => {
    const saved = localStorage.getItem('gomoku_timeLimit');
    return saved ? (parseInt(saved) as TimeLimit) : 30;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('gomoku_soundEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('gomoku_musicEnabled');
    return saved === null ? true : saved === 'true';
  });
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId>(() => {
    const saved = localStorage.getItem('gomoku_selectedSkinId');
    return (saved as SkinId) || 'classic';
  });
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(() => {
    const saved = localStorage.getItem('gomoku_selectedCharacterId');
    return saved || 'master_lin';
  });

  const [localCustomSkins, setLocalCustomSkins] = useState<Skin[]>(() => {
    const saved = localStorage.getItem('gomoku_customSkins');
    return saved ? JSON.parse(saved) : [];
  });

  const allCustomSkins = userProfile?.customSkins || localCustomSkins;
  const allSkins = useMemo(() => [...SKINS, ...allCustomSkins], [allCustomSkins]);
  const currentSkin = useMemo(() => allSkins.find(s => s.id === selectedSkinId) || SKINS[0], [allSkins, selectedSkinId]);
  const currentCharacter = useMemo(() => CHARACTERS.find(c => c.id === selectedCharacterId) || CHARACTERS[0], [selectedCharacterId]);

  const soundEnabledRef = useRef<boolean>(true);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const playSound = (type: 'move' | 'win' | 'draw') => {
    if (!soundEnabledRef.current) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      if (type === 'move') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'win') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(500, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === 'draw') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(250, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(200, ctx.currentTime + 0.4);
        gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      }
    } catch (e) {
      console.error("Error playing sound:", e);
    }
  };

  const moveHistoryRef = useRef<{ row: number; col: number; player: Player }[]>([]);
  const boardSizeRef = useRef<BoardSize>(15);
  const opponentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    moveHistoryRef.current = moveHistory;
  }, [moveHistory]);

  useEffect(() => {
    boardSizeRef.current = boardSize;
  }, [boardSize]);

  useEffect(() => {
    opponentUserIdRef.current = opponentUserId;
    
    const fetchOpponentAvatar = async () => {
      if (opponentUserId) {
        try {
          const userDocRef = doc(db, 'users', opponentUserId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setOpponentAvatarUrl(userDoc.data().photoURL || null);
            setOpponentName(userDoc.data().displayName || null);
          } else {
            setOpponentAvatarUrl(null);
            setOpponentName(null);
          }
        } catch (error) {
          console.error('Error fetching opponent avatar:', error);
          setOpponentAvatarUrl(null);
          setOpponentName(null);
        }
      } else {
        setOpponentAvatarUrl(null);
        setOpponentName(null);
      }
    };
    
    fetchOpponentAvatar();
  }, [opponentUserId]);

  // Persistence effects
  useEffect(() => {
    localStorage.setItem('gomoku_boardSize', boardSize.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.boardSize': boardSize }).catch(err => console.error("Error saving boardSize:", err));
    }
  }, [boardSize, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_ruleSet', ruleSet);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.ruleSet': ruleSet }).catch(err => console.error("Error saving ruleSet:", err));
    }
  }, [ruleSet, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_startingPlayer', startingPlayer);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.startingPlayer': startingPlayer }).catch(err => console.error("Error saving startingPlayer:", err));
    }
  }, [startingPlayer, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_timeLimit', timeLimit.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.timeLimit': timeLimit }).catch(err => console.error("Error saving timeLimit:", err));
    }
  }, [timeLimit, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_aiDifficulty', aiDifficulty);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.aiDifficulty': aiDifficulty }).catch(err => console.error("Error saving aiDifficulty:", err));
    }
  }, [aiDifficulty, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_soundEnabled', soundEnabled.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.soundEnabled': soundEnabled }).catch(err => console.error("Error saving soundEnabled:", err));
    }
  }, [soundEnabled, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_musicEnabled', musicEnabled.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.musicEnabled': musicEnabled }).catch(err => console.error("Error saving musicEnabled:", err));
    }
  }, [musicEnabled, user, isAuthLoading]);

  useEffect(() => {
    const audio = document.getElementById('bg-music') as HTMLAudioElement;
    
    const handleInteraction = () => {
      if (audio && musicEnabled) {
        audio.volume = 0.3;
        audio.play().catch(e => console.log("Audio play failed:", e));
      }
      // Remove listeners after first interaction
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };

    if (audio) {
      if (musicEnabled) {
        audio.volume = 0.3; // Set a reasonable background volume
        audio.play().catch(e => {
          console.log("Audio play failed (autoplay blocked), waiting for interaction:", e);
          document.addEventListener('click', handleInteraction);
          document.addEventListener('keydown', handleInteraction);
        });
      } else {
        audio.pause();
      }
    }

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem('gomoku_selectedSkinId', selectedSkinId);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.selectedSkin': selectedSkinId }).catch(err => console.error("Error saving selectedSkin:", err));
    }
  }, [selectedSkinId, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem('gomoku_selectedCharacterId', selectedCharacterId);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, 'users', user.uid), { 'settings.selectedCharacter': selectedCharacterId }).catch(err => console.error("Error saving selectedCharacter:", err));
    }
  }, [selectedCharacterId, user, isAuthLoading]);

  const [board, setBoard] = useState<BoardState>(createEmptyBoard(boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [winner, setWinner] = useState<Player | 'draw' | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [keyboardCursor, setKeyboardCursor] = useState<{ row: number; col: number } | null>(null);
  const [coachAdvice, setCoachAdvice] = useState<{ row: number; col: number; explanation: string } | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  const [ambientColor, setAmbientColor] = useState<string>('#000000');
  const [isAmbientBtnCollapsed, setIsAmbientBtnCollapsed] = useState(false);
  const ambientBtnTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetAmbientBtnTimeout = useCallback(() => {
    setIsAmbientBtnCollapsed(false);
    if (ambientBtnTimeoutRef.current) {
      clearTimeout(ambientBtnTimeoutRef.current);
    }
    ambientBtnTimeoutRef.current = setTimeout(() => {
      setIsAmbientBtnCollapsed(true);
    }, 5000);
  }, []);

  useEffect(() => {
    resetAmbientBtnTimeout();
    return () => {
      if (ambientBtnTimeoutRef.current) clearTimeout(ambientBtnTimeoutRef.current);
    };
  }, [resetAmbientBtnTimeout]);

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [hasForfeited, setHasForfeited] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    const checkSavedGame = () => {
      setHasSavedGame(!!localStorage.getItem('gomoku_saved_game'));
    };
    checkSavedGame();
    // Also check when screen changes to home
    if (currentScreen === 'home') {
      checkSavedGame();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === 'game' && !winner && gameMode !== 'online') {
      const gameState: SavedGameState = {
        board,
        currentPlayer,
        moveHistory,
        gameMode,
        boardSize,
        aiDifficulty,
        startingPlayer,
        timeLimit,
        selectedSkinId,
        selectedCharacterId,
        lastMove,
        ruleSet
      };
      localStorage.setItem('gomoku_saved_game', JSON.stringify(gameState));
    } else if (winner || currentScreen === 'home') {
      // If game is won, clear saved state
      if (winner) {
        localStorage.removeItem('gomoku_saved_game');
      }
    }
  }, [board, currentPlayer, moveHistory, winner, gameMode, boardSize, aiDifficulty, startingPlayer, timeLimit, selectedSkinId, selectedCharacterId, lastMove, ruleSet, currentScreen]);

  const resumeGame = () => {
    const saved = localStorage.getItem('gomoku_saved_game');
    if (saved) {
      try {
        const state: SavedGameState = JSON.parse(saved);
        setBoard(state.board);
        setCurrentPlayer(state.currentPlayer);
        setMoveHistory(state.moveHistory);
        setGameMode(state.gameMode);
        setBoardSize(state.boardSize);
        setAiDifficulty(state.aiDifficulty);
        setStartingPlayer(state.startingPlayer);
        setTimeLimitSetting(state.timeLimit);
        setSelectedSkinId(state.selectedSkinId);
        setSelectedCharacterId(state.selectedCharacterId);
        setLastMove(state.lastMove);
        setRuleSet(state.ruleSet);
        
        setWinner(null);
        setWinningLine(null);
        setCoachAdvice(null);
        setThreats(findThreats(state.board, state.currentPlayer));
        setHasForfeited(false);
        setOnlineOpponentLeft(false);
        setEndReason(null);
        setEloChange(null);
        setTimeLeft(state.timeLimit || 30);
        
        setCurrentScreen('game');
      } catch (e) {
        console.error("Error parsing saved game:", e);
        localStorage.removeItem('gomoku_saved_game');
        setHasSavedGame(false);
      }
    }
  };

  const calculateEloChange = (pElo: number, oElo: number, result: 'win' | 'loss' | 'draw') => {
    const K = pElo > 2000 ? 16 : 32;
    const expectedScore = 1 / (1 + Math.pow(10, (oElo - pElo) / 400));
    let actualScore = 0.5;
    if (result === 'win') actualScore = 1;
    if (result === 'loss') actualScore = 0;
    
    const change = Math.round(K * (actualScore - expectedScore));
    return change;
  };

  const saveMatchToFirestore = async (record: MatchRecord) => {
    if (!user) return;
    
    try {
      const matchData = {
        id: record.id,
        date: serverTimestamp(),
        player1Uid: user.uid,
        player2Uid: record.gameMode === 'online' ? (opponentUserIdRef.current || 'Unknown') : 'AI',
        winnerUid: record.result === 'draw' ? 'draw' : (record.result === 'win' ? user.uid : (record.gameMode === 'online' ? (opponentUserIdRef.current || 'Opponent') : 'AI')),
        gameMode: record.gameMode,
        moves: record.moves,
        boardSize: record.boardSize,
        player1EloBefore: record.playerEloBefore,
        player1EloAfter: record.playerEloAfter,
        player2EloBefore: record.opponentElo,
        player2EloAfter: record.opponentElo,
        selectedSkin: record.selectedSkin,
        selectedCharacter: record.selectedCharacter
      };

      await addDoc(collection(db, 'matches'), matchData);
      
      // Update user profile with stats
      const userDocRef = doc(db, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      const currentData = userDoc.data() as UserProfile;
      
      const oldStats = currentData.stats || {
        wins: 0, losses: 0, draws: 0, winStreak: 0, maxWinStreak: 0, totalMoves: 0, totalGames: 0
      };

      const isWin = record.result === 'win';
      const isLoss = record.result === 'loss';
      const isDraw = record.result === 'draw';

      const newWinStreak = isWin ? oldStats.winStreak + 1 : 0;
      
      const newStats = {
        wins: oldStats.wins + (isWin ? 1 : 0),
        losses: oldStats.losses + (isLoss ? 1 : 0),
        draws: oldStats.draws + (isDraw ? 1 : 0),
        winStreak: newWinStreak,
        maxWinStreak: Math.max(oldStats.maxWinStreak, newWinStreak),
        totalMoves: oldStats.totalMoves + record.moves.length,
        totalGames: oldStats.totalGames + 1
      };

      await updateDoc(userDocRef, {
        elo: record.playerEloAfter,
        rank: getRankTier(record.playerEloAfter).name,
        lastPlayed: serverTimestamp(),
        stats: newStats
      });
      
      setPlayerElo(record.playerEloAfter);
      setUserProfile(prev => prev ? { ...prev, elo: record.playerEloAfter, stats: newStats } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'matches');
    }
  };

  // Firebase Auth & Data Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
      
      if (firebaseUser) {
        setUserId(firebaseUser.uid);
        
        // Sync User Profile (ELO, Rank)
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPlayerElo(data.elo || 1200);
          
          // Load settings from Firebase if they exist
          if (data.settings) {
            if (data.settings.boardSize) setBoardSize(data.settings.boardSize);
            if (data.settings.ruleSet) setRuleSet(data.settings.ruleSet);
            if (data.settings.startingPlayer) setStartingPlayer(data.settings.startingPlayer);
            if (data.settings.aiDifficulty) setAiDifficulty(data.settings.aiDifficulty);
            if (data.settings.soundEnabled !== undefined) setSoundEnabled(data.settings.soundEnabled);
            if (data.settings.musicEnabled !== undefined) setMusicEnabled(data.settings.musicEnabled);
            if (data.settings.selectedSkin) setSelectedSkinId(data.settings.selectedSkin as SkinId);
            if (data.settings.selectedCharacter) setSelectedCharacterId(data.settings.selectedCharacter);
            
            setUserProfile({
              uid: firebaseUser.uid,
              displayName: data.displayName || firebaseUser.displayName || 'Player',
              avatarUrl: data.photoURL || firebaseUser.photoURL || `https://api.dicebear.com/9.x/lorelei/svg?seed=${firebaseUser.uid}`,
              bio: data.bio || '',
              elo: data.elo || 1200,
              customCharacters: data.customCharacters || [],
              customSkins: data.customSkins || [],
              selectedCharacterId: data.settings.selectedCharacter || 'master_lin',
              selectedSkinId: (data.settings.selectedSkin as SkinId) || 'classic'
            });
          }
        } else {
          // Initialize new user
          const initialProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Player',
            avatarUrl: firebaseUser.photoURL || `https://api.dicebear.com/9.x/lorelei/svg?seed=${firebaseUser.uid}`,
            bio: '',
            elo: 1200,
            customCharacters: [],
            customSkins: [],
            selectedCharacterId: 'master_lin',
            selectedSkinId: 'classic'
          };
          
          await setDoc(userDocRef, {
            ...initialProfile,
            rank: 'Beginner',
            lastPlayed: serverTimestamp(),
            settings: {
              boardSize,
              ruleSet,
              startingPlayer,
              aiDifficulty,
              soundEnabled,
              musicEnabled,
              selectedSkin: selectedSkinId,
              selectedCharacter: selectedCharacterId
            }
          });
          setUserProfile(initialProfile);
          setPlayerElo(1200);
        }

        // Sync Match History
        const matchesQuery = query(
          collection(db, 'matches'),
          where('player1Uid', '==', firebaseUser.uid),
          orderBy('date', 'desc'),
          limit(50)
        );

        const unsubscribeMatches = onSnapshot(matchesQuery, (snapshot) => {
          const history: MatchRecord[] = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              ...data,
              date: (data.date as Timestamp).toMillis(),
              // Map Firestore fields back to MatchRecord interface if needed
              opponent: data.player2Uid === 'AI' ? 'AI' : (data.player2Uid === firebaseUser.uid ? data.player1Uid : data.player2Uid),
              result: data.winnerUid === 'draw' ? 'draw' : (data.winnerUid === firebaseUser.uid ? 'win' : 'loss'),
              winner: data.winnerUid === 'draw' ? 'draw' : (data.winnerUid === firebaseUser.uid ? (onlinePlayerColorRef.current || 'black') : (onlinePlayerColorRef.current === 'black' ? 'white' : 'black'))
            } as MatchRecord;
          });
          setMatchHistory(history);
        }, (error) => {
          handleFirestoreError(error, OperationType.LIST, 'matches');
        });

        return () => unsubscribeMatches();
      } else {
        // Reset to local defaults if logged out
        setUserId('');
        setPlayerElo(1200);
        setMatchHistory([]);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Firebase Auth handles ELO and history sync
  }, []);

  useEffect(() => {
    if (currentScreen === 'stats') {
      const q = query(collection(db, 'users'), orderBy('elo', 'desc'), limit(10));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const topPlayers = snapshot.docs.map(doc => doc.data() as UserProfile);
        setLeaderboard(topPlayers);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, 'users');
      });
      return () => unsubscribe();
    }
  }, [currentScreen]);

  const handleCreateCustomCharacter = async () => {
    if (!user) {
      toast.error('You must be logged in to create a character');
      return;
    }
    if (!newCharName || !newCharAvatar) {
      toast.error('Please enter a name and avatar URL');
      return;
    }
    
    const newChar: Character = {
      id: `custom_${Date.now()}`,
      name: newCharName,
      avatar: newCharAvatar,
      bio: newCharBio,
      defaultSkin: 'classic',
      isCustom: true
    };

    const updatedProfile = {
      ...userProfile!,
      customCharacters: [...(userProfile?.customCharacters || []), newChar]
    };

    try {
      await updateDoc(doc(db, 'users', user.uid), {
        customCharacters: updatedProfile.customCharacters
      });
      setUserProfile(updatedProfile);
      setNewCharName('');
      setNewCharAvatar('');
      setNewCharBio('');
      setIsCreatingChar(false);
      toast.success('Character created successfully!');
    } catch (error) {
      console.error("Error creating custom character:", error);
      toast.error('Failed to create character');
    }
  };

  const handleDeleteCustomSkin = async (skinId: string) => {
    if (user && userProfile) {
      const updatedSkins = (userProfile.customSkins || []).filter(s => s.id !== skinId);
      const updatedProfile = { ...userProfile, customSkins: updatedSkins };
      
      try {
        await updateDoc(doc(db, 'users', user.uid), { customSkins: updatedSkins });
        setUserProfile(updatedProfile);
        if (selectedSkinId === skinId) setSelectedSkinId(SKINS[0].id);
        toast.success('Skin deleted');
      } catch (error) {
        console.error("Error deleting skin:", error);
        toast.error('Failed to delete skin');
      }
    } else {
      const updatedSkins = localCustomSkins.filter(s => s.id !== skinId);
      setLocalCustomSkins(updatedSkins);
      localStorage.setItem('gomoku_customSkins', JSON.stringify(updatedSkins));
      if (selectedSkinId === skinId) setSelectedSkinId(SKINS[0].id);
      toast.success('Skin deleted');
    }
  };

  const handleCreateCustomSkin = async (newSkin: Skin) => {
    if (user && userProfile) {
      const updatedProfile = {
        ...userProfile,
        customSkins: [...(userProfile.customSkins || []), newSkin]
      };

      try {
        await updateDoc(doc(db, 'users', user.uid), {
          customSkins: updatedProfile.customSkins
        });
        setUserProfile(updatedProfile);
        setIsCreatingSkin(false);
        toast.success('Custom skin saved!');
      } catch (error) {
        console.error("Error creating custom skin:", error);
        toast.error('Failed to save skin');
      }
    } else {
      const updatedSkins = [...localCustomSkins, newSkin];
      setLocalCustomSkins(updatedSkins);
      localStorage.setItem('gomoku_customSkins', JSON.stringify(updatedSkins));
      setIsCreatingSkin(false);
      toast.success('Custom skin saved locally!');
    }
  };
  const nextAmbientColor = () => {
    const currentIndex = AMBIENT_COLORS.findIndex(c => c.value === ambientColor);
    const nextIndex = (currentIndex + 1) % AMBIENT_COLORS.length;
    setAmbientColor(AMBIENT_COLORS[nextIndex].value);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random color from AMBIENT_COLORS, excluding 'transparent' (the first element)
      // to ensure the border is always visible.
      const randomIndex = Math.floor(Math.random() * (AMBIENT_COLORS.length - 1)) + 1;
      setAmbientColor(AMBIENT_COLORS[randomIndex].value);
    }, 120000); // 2 minutes in milliseconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearchingMatch && searchStartTime) {
      interval = setInterval(() => {
        setSearchTimeElapsed(Math.floor((Date.now() - searchStartTime) / 1000));
      }, 1000);
    } else {
      setSearchTimeElapsed(0);
    }
    return () => clearInterval(interval);
  }, [isSearchingMatch, searchStartTime]);

  useEffect(() => {
    const socket = getSocket();

    const onMatchFound = (data: { roomId: string, players: { black: string, white: string }, playerData?: { black: { elo: number, userId?: string }, white: { elo: number, userId?: string } }, boardSize: number, timeLimit?: number }) => {
      setIsSearchingMatch(false);
      setSearchStartTime(null);
      setPrivateRoomCode('');
      setJoinRoomInput('');
      setChatMessages([]);
      setShowChat(false);
      setOnlineRoomId(data.roomId);
      const isBlack = data.players.black === socket.id;
      setOnlinePlayerColor(isBlack ? 'black' : 'white');
      setBoardSize(data.boardSize as BoardSize);
      if (data.timeLimit !== undefined) {
        setTimeLimitSetting(data.timeLimit as TimeLimit);
      }
      
      if (data.playerData) {
        setOpponentElo(isBlack ? data.playerData.white.elo : data.playerData.black.elo);
        setOpponentUserId(isBlack ? data.playerData.white.userId || null : data.playerData.black.userId || null);
      } else {
        setOpponentElo(null);
        setOpponentUserId(null);
      }
      
      setGameMode('online');
      resetGame();
      setCurrentScreen('game');
    };

    const onPrivateRoomCreated = (data: { roomId: string }) => {
      setPrivateRoomCode(data.roomId);
    };

    const onMoveMade = (data: { row: number, col: number, player: Player, nextPlayer: Player, winner: Player | 'draw' | null, winningLine?: [number, number][] | null, newElo?: { black: number, white: number } }) => {
      setBoard(prev => {
        const newBoard = prev.map(r => [...r]);
        newBoard[data.row][data.col] = data.player;
        if (!data.winner) {
          setThreats(findThreats(newBoard, data.nextPlayer));
        } else {
          setThreats([]);
        }
        return newBoard;
      });
      playSound('move');
      
      let updatedHistory: { row: number, col: number, player: Player }[] = [];
      setMoveHistory(prev => {
        updatedHistory = [...prev, { row: data.row, col: data.col, player: data.player }];
        moveHistoryRef.current = updatedHistory; // Manually update ref to avoid stale data
        return updatedHistory;
      });
      
      setLastMove({ row: data.row, col: data.col });
      setCurrentPlayer(data.nextPlayer);
      if (data.winner) {
        setWinner(data.winner);
        if (data.winner === 'draw') {
          playSound('draw');
        } else {
          playSound('win');
        }
        if (data.winningLine) setWinningLine(data.winningLine);
        
        if (data.newElo) {
          const isBlack = onlinePlayerColorRef.current === 'black';
          const newPlayerElo = isBlack ? data.newElo.black : data.newElo.white;
          const newOpponentElo = isBlack ? data.newElo.white : data.newElo.black;
          
          const oldPlayerElo = playerEloRef.current;
          const diff = newPlayerElo - oldPlayerElo;
          setEloChange(diff);
          setPlayerElo(newPlayerElo);
          setOpponentElo(newOpponentElo);
          
          // Save to history
          const record: MatchRecord = {
            id: Math.random().toString(36).substring(2, 9),
            date: Date.now(),
            opponent: opponentUserIdRef.current || 'Unknown',
            opponentElo: newOpponentElo,
            playerEloBefore: oldPlayerElo,
            playerEloAfter: newPlayerElo,
            result: data.winner === 'draw' ? 'draw' : (data.winner === onlinePlayerColorRef.current ? 'win' : 'loss'),
            moves: updatedHistory,
            boardSize: boardSizeRef.current,
            gameMode: 'online',
            winner: data.winner,
            selectedSkin: selectedSkinId,
            selectedCharacter: selectedCharacterId
          };
          
          saveMatchToFirestore(record);
        }
      }
    };

    const onOpponentLeft = (data: { winner: Player, reason?: string, newElo?: { black: number, white: number } }) => {
      setOnlineOpponentLeft(true);
      setEndReason(data.reason || null);
      setWinner(data.winner);
      setThreats([]);
      playSound('win');
      
      if (data.newElo) {
        const isBlack = onlinePlayerColorRef.current === 'black';
        const newPlayerElo = isBlack ? data.newElo.black : data.newElo.white;
        const newOpponentElo = isBlack ? data.newElo.white : data.newElo.black;
        
        const oldPlayerElo = playerEloRef.current;
        const diff = newPlayerElo - oldPlayerElo;
        setEloChange(diff);
        setPlayerElo(newPlayerElo);
        setOpponentElo(newOpponentElo);
        
        // Save to history
        const record: MatchRecord = {
          id: Math.random().toString(36).substring(2, 9),
          date: Date.now(),
          opponent: opponentUserIdRef.current || 'Unknown',
          opponentElo: newOpponentElo,
          playerEloBefore: oldPlayerElo,
          playerEloAfter: newPlayerElo,
          result: data.winner === onlinePlayerColorRef.current ? 'win' : 'loss',
          moves: [...moveHistoryRef.current],
          boardSize: boardSizeRef.current,
          gameMode: 'online',
          winner: data.winner,
          selectedSkin: selectedSkinId,
          selectedCharacter: selectedCharacterId
        };
        
        saveMatchToFirestore(record);
      }
    };

    const onMatchForfeited = (data: { winner: Player, forfeitedBy: string, newElo?: { black: number, white: number } }) => {
      setWinner(data.winner);
      setThreats([]);
      if (data.forfeitedBy === getSocket().id) {
        setHasForfeited(true);
      } else {
        setEndReason('opponent_forfeited');
      }
      playSound('win');
      
      if (data.newElo) {
        const isBlack = onlinePlayerColorRef.current === 'black';
        const newPlayerElo = isBlack ? data.newElo.black : data.newElo.white;
        const newOpponentElo = isBlack ? data.newElo.white : data.newElo.black;
        
        const oldPlayerElo = playerEloRef.current;
        const diff = newPlayerElo - oldPlayerElo;
        setEloChange(diff);
        setPlayerElo(newPlayerElo);
        setOpponentElo(newOpponentElo);
        
        // Save to history
        const record: MatchRecord = {
          id: Math.random().toString(36).substring(2, 9),
          date: Date.now(),
          opponent: opponentUserIdRef.current || 'Unknown',
          opponentElo: newOpponentElo,
          playerEloBefore: oldPlayerElo,
          playerEloAfter: newPlayerElo,
          result: data.winner === onlinePlayerColorRef.current ? 'win' : 'loss',
          moves: [...moveHistoryRef.current],
          boardSize: boardSizeRef.current,
          gameMode: 'online',
          winner: data.winner,
          selectedSkin: selectedSkinId,
          selectedCharacter: selectedCharacterId
        };
        
        saveMatchToFirestore(record);
      }
    };

    const onReceiveMessage = (data: { sender: string, text: string, timestamp: number }) => {
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        sender: data.sender,
        text: data.text,
        timestamp: data.timestamp,
        isMe: false
      }]);
    };

    const onError = (data: { message: string }) => {
      toast.error(data.message);
      setIsSearchingMatch(false);
      setSearchStartTime(null);
      setCurrentScreen('online');
    };

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('matchFound', onMatchFound);
    socket.on('privateRoomCreated', onPrivateRoomCreated);
    socket.on('moveMade', onMoveMade);
    socket.on('opponentLeft', onOpponentLeft);
    socket.on('matchForfeited', onMatchForfeited);
    socket.on('receiveMessage', onReceiveMessage);
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('matchFound', onMatchFound);
      socket.off('privateRoomCreated', onPrivateRoomCreated);
      socket.off('moveMade', onMoveMade);
      socket.off('opponentLeft', onOpponentLeft);
      socket.off('matchForfeited', onMatchForfeited);
      socket.off('receiveMessage', onReceiveMessage);
      socket.off('error', onError);
    };
  }, []);

  useEffect(() => {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer('black');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setCoachAdvice(null);
  }, [boardSize, ruleSet, startingPlayer]);

  useEffect(() => {
    const isAiTurn = gameMode === 'pve' && 
      ((startingPlayer === 'human' && currentPlayer === 'white') || 
       (startingPlayer === 'ai' && currentPlayer === 'black'));

    if (isAiTurn && !winner) {
      const timer = setTimeout(() => {
        const move = getBestMove(board, currentPlayer as Player, aiDifficulty);
        handleCellClick(move.row, move.col, true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, winner, board, aiDifficulty, startingPlayer]);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [currentPlayer, timeLimit]);

  useEffect(() => {
    if (timeLimit === 0 || winner || onlineOpponentLeft) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-lose on timeout
          if (gameMode === 'pve' || gameMode === 'pvp') {
            setWinner(currentPlayer === 'black' ? 'white' : 'black');
            setThreats([]);
            playSound('win'); // Or lose sound
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentPlayer, gameMode, winner, onlinePlayerColor, timeLimit, startingPlayer, onlineOpponentLeft]);

  useEffect(() => {
    if (winner && winner !== 'draw') {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const isBlack = winner === 'black';
      const colors = isBlack 
        ? ['#18181b', '#3f3f46', '#71717a', '#D4AF37', '#FFDF00'] 
        : ['#ffffff', '#f4f4f5', '#e4e4e7', '#D4AF37', '#FFDF00'];

      const defaults = { 
        startVelocity: 25, 
        spread: 360, 
        ticks: 150, 
        zIndex: 100,
        shapes: ['circle'] as confetti.Shape[],
        colors: colors,
        scalar: 0.8,
        gravity: 0.6,
        disableForReducedMotion: true
      };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      // Initial big burst
      confetti({
        ...defaults,
        particleCount: 120,
        spread: 120,
        origin: { y: 0.6, x: 0.5 }
      });

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 25 * (timeLeft / duration);
        confetti({
          ...defaults, 
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 }
        });
      }, 300);

      return () => {
        clearInterval(interval);
        confetti.reset();
      };
    }
  }, [winner]);

  // Set initial cursor position when entering game
  useEffect(() => {
    if (currentScreen === 'game') {
      setKeyboardCursor({ row: Math.floor(boardSize / 2), col: Math.floor(boardSize / 2) });
    }
  }, [currentScreen, boardSize]);

  // Handle keyboard navigation inside the game screen
  useEffect(() => {
    if (currentScreen !== 'game' || winner || onlineOpponentLeft || hasForfeited) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow default behavior for typical inputs if they have focus (like chat)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', ' '].includes(e.key)) return;
      e.preventDefault();

      setKeyboardCursor((prev) => {
        let { row, col } = prev || { row: Math.floor(boardSize / 2), col: Math.floor(boardSize / 2) };
        
        if (e.key === 'ArrowUp') row = Math.max(0, row - 1);
        else if (e.key === 'ArrowDown') row = Math.min(boardSize - 1, row + 1);
        else if (e.key === 'ArrowLeft') col = Math.max(0, col - 1);
        else if (e.key === 'ArrowRight') col = Math.min(boardSize - 1, col + 1);
        else if (e.key === 'Enter' || e.key === ' ') {
          // Trigger the move! Note: state updates in handleCellClick expect latest state, 
          // but we will call handleCellClick directly with row, col
          setTimeout(() => {
            if (handleCellClickRef.current) handleCellClickRef.current(row, col);
          }, 0);
        } else if (e.key === 'c' || e.key === 'C') {
          // Additional shortcut: jump to coach advice if it exists
          if (coachAdvice) {
            row = coachAdvice.row;
            col = coachAdvice.col;
          }
        }

        return { row, col };
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentScreen, winner, onlineOpponentLeft, hasForfeited, boardSize, coachAdvice]); // Depend on coachAdvice to allow jumping to it

  // Use a ref to access the latest handleCellClick safely from the effect
  const handleCellClickRef = useRef<(r: number, c: number, ai?: boolean) => void>();
  
  useEffect(() => {
    handleCellClickRef.current = handleCellClick;
  });

  const handleCellClick = (row: number, col: number, isAiMove: boolean = false) => {
    if (board[row][col] || winner || onlineOpponentLeft) return;
    
    if (gameMode === 'online') {
      if (currentPlayer !== onlinePlayerColor) return;
      const socket = getSocket();
      socket.emit('makeMove', { roomId: onlineRoomId, row, col });
      setKeyboardCursor({ row, col }); // Also snap cursor
      return;
    }

    const isAiTurn = gameMode === 'pve' && 
      ((startingPlayer === 'human' && currentPlayer === 'white') || 
       (startingPlayer === 'ai' && currentPlayer === 'black'));
       
    if (isAiTurn && !isAiMove) return; // Prevent human from playing for AI

    setCoachAdvice(null); // Clear coach advice on move

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    playSound('move');
    setMoveHistory(prev => [...prev, { row, col, player: currentPlayer }]);
    setLastMove({ row, col });
    
    // Snap keyboard cursor to the most recently played move
    setKeyboardCursor({ row, col });

    const winLine = checkWin(newBoard, row, col, currentPlayer, ruleSet === 'renju');
    if (winLine) {
      setWinner(currentPlayer);
      playSound('win');
      setWinningLine(winLine);
      setThreats([]);
      
      // Save local match to history
      const opponentElo = gameMode === 'pve' ? (aiDifficulty === 'hard' ? 1800 : aiDifficulty === 'medium' ? 1200 : 600) : 0;
      const result = currentPlayer === 'black' ? 'win' : 'loss';
      const eloChange = gameMode === 'pve' ? calculateEloChange(playerElo, opponentElo, result) : 0;
      const newElo = playerElo + eloChange;

      const record: MatchRecord = {
        id: Math.random().toString(36).substring(2, 9),
        date: Date.now(),
        opponent: gameMode === 'pve' ? `AI (${aiDifficulty})` : 'Local Player',
        opponentElo: opponentElo,
        playerEloBefore: playerElo,
        playerEloAfter: newElo,
        result: result,
        moves: [...moveHistory, { row, col, player: currentPlayer }],
        boardSize: boardSize,
        gameMode: gameMode,
        winner: currentPlayer,
        selectedSkin: selectedSkinId,
        selectedCharacter: selectedCharacterId
      };
      setEloChange(eloChange);
      saveMatchToFirestore(record);
    } else if (isBoardFull(newBoard)) {
      setWinner('draw');
      playSound('draw');
      setThreats([]);
      // Save draw to history
      const opponentElo = gameMode === 'pve' ? (aiDifficulty === 'hard' ? 1800 : aiDifficulty === 'medium' ? 1200 : 600) : 0;
      const eloChange = gameMode === 'pve' ? calculateEloChange(playerElo, opponentElo, 'draw') : 0;
      const newElo = playerElo + eloChange;

      const record: MatchRecord = {
        id: Math.random().toString(36).substring(2, 9),
        date: Date.now(),
        opponent: gameMode === 'pve' ? `AI (${aiDifficulty})` : 'Local Player',
        opponentElo: opponentElo,
        playerEloBefore: playerElo,
        playerEloAfter: newElo,
        result: 'draw',
        moves: [...moveHistory, { row, col, player: currentPlayer }],
        boardSize: boardSize,
        gameMode: gameMode,
        winner: 'draw',
        selectedSkin: selectedSkinId,
        selectedCharacter: selectedCharacterId
      };
      setEloChange(eloChange);
      saveMatchToFirestore(record);
    } else {
      const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
      setCurrentPlayer(nextPlayer);
      setThreats(findThreats(newBoard, nextPlayer));
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !onlineRoomId) return;

    const messageData = {
      roomId: onlineRoomId,
      text: chatInput.trim(),
      timestamp: Date.now()
    };

    getSocket().emit('sendMessage', messageData);

    setChatMessages(prev => [...prev, {
      id: Math.random().toString(36).substring(2, 9),
      sender: user?.displayName || 'Me',
      text: chatInput.trim(),
      timestamp: Date.now(),
      isMe: true
    }]);

    setChatInput('');
  };

  const resetGame = () => {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer('black');
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setCoachAdvice(null);
    setThreats([]);
    setMoveHistory([]);
    setHasForfeited(false);
    setOnlineOpponentLeft(false);
    setEndReason(null);
    setEloChange(null);
    setTimeLeft(30);
    setShowMusicModal(false);
  };

  const deleteAccount = async () => {
    if (!user) return;
    
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données (ELO, historique, skins personnalisés) seront définitivement supprimées.")) {
      return;
    }

    try {
      // 1. Delete user document from Firestore
      await deleteDoc(doc(db, 'users', user.uid));
      
      // 2. Delete match history (optional, but good for GDPR)
      const matchesQuery = query(collection(db, 'matches'), where('player1Uid', '==', user.uid));
      const matchesSnapshot = await getDocs(matchesQuery);
      const deletePromises = matchesSnapshot.docs.map(d => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 3. Sign out
      await logout();
      
      toast.success("Votre compte a été supprimé avec succès.");
      setCurrentScreen('home');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'users');
      toast.error("Une erreur est survenue lors de la suppression du compte.");
    }
  };

  const handleUndo = () => {
    if (gameMode === 'online' || winner || moveHistory.length === 0) return;

    setCoachAdvice(null);

    if (gameMode === 'pvp') {
      const lastMove = moveHistory[moveHistory.length - 1];
      const newBoard = board.map(r => [...r]);
      newBoard[lastMove.row][lastMove.col] = null;
      setBoard(newBoard);
      setCurrentPlayer(lastMove.player);
      setThreats(findThreats(newBoard, lastMove.player));
      setMoveHistory(prev => prev.slice(0, -1));
      
      const prevMove = moveHistory.length > 1 ? moveHistory[moveHistory.length - 2] : null;
      setLastMove(prevMove ? { row: prevMove.row, col: prevMove.col } : null);
      setTimeLeft(timeLimit);
    } else if (gameMode === 'pve') {
      const isLastMoveAi = (startingPlayer === 'human' && moveHistory[moveHistory.length - 1].player === 'white') ||
                           (startingPlayer === 'ai' && moveHistory[moveHistory.length - 1].player === 'black');
      
      const movesToUndo = isLastMoveAi && moveHistory.length >= 2 ? 2 : 1;
      
      const newBoard = board.map(r => [...r]);
      for (let i = 0; i < movesToUndo; i++) {
        const move = moveHistory[moveHistory.length - 1 - i];
        newBoard[move.row][move.col] = null;
      }
      setBoard(newBoard);
      
      const nextPlayer = moveHistory[moveHistory.length - movesToUndo].player;
      setCurrentPlayer(nextPlayer);
      setThreats(findThreats(newBoard, nextPlayer));
      setMoveHistory(prev => prev.slice(0, -movesToUndo));
      
      const prevMove = moveHistory.length > movesToUndo ? moveHistory[moveHistory.length - movesToUndo - 1] : null;
      setLastMove(prevMove ? { row: prevMove.row, col: prevMove.col } : null);
      setTimeLeft(timeLimit);
    }
  };

  const leaveOnlineMatch = () => {
    if (gameMode === 'online' && onlineRoomId) {
      getSocket().emit('leaveMatch', { roomId: onlineRoomId });
    }
    setOnlineRoomId(null);
    setOnlinePlayerColor(null);
    setOnlineOpponentLeft(false);
    setEndReason(null);
    setShowMusicModal(false);
    setCurrentScreen('home');
  };

  const forfeitMatch = () => {
    if (gameMode === 'online' && onlineRoomId) {
      getSocket().emit('forfeitMatch', { roomId: onlineRoomId });
    } else {
      setWinner(currentPlayer === 'black' ? 'white' : 'black');
      setThreats([]);
      setHasForfeited(true);
      playSound('win');
    }
    setShowForfeitConfirm(false);
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
    setCurrentScreen('game');
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`);
          const data = await response.json();
          
          if (data && data.address) {
            const city = data.address.city || data.address.town || data.address.village || data.address.county;
            const country = data.address.country;
            const locationStr = [city, country].filter(Boolean).join(', ');
            setLocationName(locationStr);
            toast.success(`Location found: ${locationStr}`);
            
            // Try to map location to a region or keep auto
            setSelectedRegion('auto');
          } else {
            toast.error('Could not determine location name');
          }
        } catch (error) {
          console.error('Error fetching location name:', error);
          toast.error('Failed to get location details');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Failed to get your location. Please check permissions.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const startReplay = (match: MatchRecord) => {
    setReplayMatch(match);
    setReplayMoveIndex(0);
    setReplayBoard(createEmptyBoard(match.boardSize));
    setIsPlayingReplay(false);
    setCurrentScreen('replay');
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlayingReplay && replayMatch && replayMoveIndex < replayMatch.moves.length) {
      timer = setTimeout(() => {
        nextReplayMove();
      }, 1000); // 1 second per move
    } else if (replayMatch && replayMoveIndex >= replayMatch.moves.length) {
      setIsPlayingReplay(false);
    }
    return () => clearTimeout(timer);
  }, [isPlayingReplay, replayMoveIndex, replayMatch]);

  const nextReplayMove = () => {
    if (!replayMatch || replayMoveIndex >= replayMatch.moves.length) return;
    const move = replayMatch.moves[replayMoveIndex];
    setReplayBoard(prev => {
      const newBoard = prev.map(r => [...r]);
      newBoard[move.row][move.col] = move.player;
      return newBoard;
    });
    setReplayMoveIndex(prev => prev + 1);
  };

  const prevReplayMove = () => {
    if (!replayMatch || replayMoveIndex <= 0) return;
    const newIndex = replayMoveIndex - 1;
    const newBoard = createEmptyBoard(replayMatch.boardSize);
    for (let i = 0; i < newIndex; i++) {
      const move = replayMatch.moves[i];
      newBoard[move.row][move.col] = move.player;
    }
    setReplayBoard(newBoard);
    setReplayMoveIndex(newIndex);
  };

  const askCoach = () => {
    const isAiTurn = gameMode === 'pve' && 
      ((startingPlayer === 'human' && currentPlayer === 'white') || 
       (startingPlayer === 'ai' && currentPlayer === 'black'));
       
    if (winner || isAiTurn) return;
    const advice = getCoachAdvice(board, currentPlayer);
    setCoachAdvice(advice);
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        // User cancelled or closed the popup, ignore
        console.log('Sign-in cancelled by user');
      } else {
        console.error('Login error:', error);
        toast.error('Échec de la connexion. Veuillez réessayer.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-zinc-900 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-black tracking-tighter mb-4">GOMOKU</h1>
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm">Connect to play and track your rank</p>
        </div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[3rem] shadow-2xl border border-zinc-100 max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
            <Globe size={40} />
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight">Welcome Back</h2>
          <p className="text-zinc-500 mb-8 font-medium">Sign in with Google to save your ELO, match history, and compete globally.</p>
          
          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95 ${isLoggingIn ? 'opacity-70 cursor-not-allowed' : 'hover:bg-zinc-800'}`}
          >
            {isLoggingIn ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Globe size={20} />
            )}
            {isLoggingIn ? 'Connecting...' : 'Sign in with Google'}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden relative"
      style={{
        boxShadow: ambientColor !== 'transparent' ? `inset 0 0 0 4px ${ambientColor}` : 'none',
        transition: 'box-shadow 0.3s ease'
      }}
    >
      <AnimatePresence mode="wait">
        {currentScreen === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center p-6 overflow-y-auto custom-scrollbar"
          >
            <div className="my-auto flex flex-col items-center w-full py-8">
              <div className="text-center mb-12 shrink-0">
              <h1 className="text-6xl font-black tracking-tighter mb-4">GOMOKU</h1>
              <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm mb-8">The Classic Strategy Game</p>
              
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={() => setCurrentScreen('stats')}
                className="inline-flex flex-col items-center gap-3 bg-white p-6 rounded-[2.5rem] shadow-xl border border-zinc-100 cursor-pointer group transition-all hover:shadow-2xl"
              >
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform"
                  style={{ backgroundColor: getRankTier(playerElo).color }}
                >
                  <Trophy size={32} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black tracking-tighter uppercase" style={{ color: getRankTier(playerElo).color }}>
                    {getRankTier(playerElo).name}
                  </h3>
                  <p className="text-zinc-400 font-bold text-sm tracking-widest uppercase">{playerElo} ELO</p>
                </div>
              </motion.div>
            </div>

            <div className="flex flex-col gap-4 w-full max-w-xs">
              {!showDifficultySelect ? (
                <>
                  <button
                    onClick={() => setCurrentScreen('music')}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all group"
                  >
                    <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                      <Music size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">Music Player</p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Spotify • Deezer • YT</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      connectSocket();
                      setCurrentScreen('online');
                    }}
                    className="flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Globe size={20} />
                    Play Online
                  </button>

                  {hasSavedGame && (
                    <button
                      onClick={resumeGame}
                      className="flex items-center justify-center gap-3 bg-amber-500 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 animate-pulse"
                    >
                      <Play size={20} />
                      Resume Game
                    </button>
                  )}

                  <button
                    onClick={() => setShowDifficultySelect(true)}
                    className="flex items-center justify-center gap-3 bg-zinc-900 text-white py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-900/20"
                  >
                    <Cpu size={20} />
                    Play vs AI
                  </button>
                  <button
                    onClick={() => startGame('pvp')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <User size={20} />
                    Pass & Play
                  </button>
                  <button
                    onClick={() => setCurrentScreen('tutorial')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <BookOpen size={20} />
                    How to Play
                  </button>
                  <button
                    onClick={() => setCurrentScreen('stats')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <Trophy size={20} />
                    Stats & Replays
                  </button>
                  <button
                    onClick={() => setCurrentScreen('profile')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <UserCircle size={20} />
                    Profile
                  </button>
                  <button
                    onClick={() => setCurrentScreen('settings')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <Settings size={20} />
                    Settings
                  </button>
                  <button
                    onClick={() => setCurrentScreen('support')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <HelpCircle size={20} />
                    Aide & Support
                  </button>
                  <button
                    onClick={() => setCurrentScreen('privacy')}
                    className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                  >
                    <ShieldCheck size={20} />
                    Confidentialité
                  </button>
                </>
              ) : showDifficultySelect ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col gap-3 bg-white p-4 rounded-3xl border border-zinc-200 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2 px-2">
                    <h3 className="font-bold text-zinc-900">Select Difficulty</h3>
                    <button onClick={() => setShowDifficultySelect(false)} className="p-1 hover:bg-zinc-100 rounded-full">
                      <ChevronLeft size={20} />
                    </button>
                  </div>
                  {(['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'] as Difficulty[]).map(diff => (
                    <button
                      key={diff}
                      onClick={() => {
                        setAiDifficulty(diff);
                        setShowDifficultySelect(false);
                        startGame('pve');
                      }}
                      className={`py-3 px-4 rounded-xl font-semibold text-left transition-colors ${
                        aiDifficulty === diff 
                          ? 'bg-zinc-900 text-white' 
                          : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </motion.div>
              ) : null}
            </div>
            </div>
          </motion.div>
        )}

        {currentScreen === 'game' && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar"
          >
            {gameMode === 'online' ? (
              <div className="flex flex-col h-full max-w-3xl mx-auto w-full justify-between pb-8 shrink-0">
                {/* Top: Opponent Info */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${currentPlayer !== onlinePlayerColor ? 'bg-white shadow-lg ring-2 ring-emerald-500/50 scale-105' : 'opacity-60 scale-100'}`}>
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full bg-zinc-200 flex items-center justify-center text-xl font-bold text-zinc-500 uppercase overflow-hidden ${currentPlayer === onlinePlayerColor ? 'animate-idle-float' : ''}`}>
                        {opponentAvatarUrl ? (
                          <img src={opponentAvatarUrl} alt="Opponent" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          opponentUserId ? opponentUserId.substring(0, 2) : 'O'
                        )}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-[#f5f5f5] rounded-full ${
                        onlineOpponentLeft ? 'bg-rose-500' : (isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')
                      }`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900">{opponentName || (opponentUserId ? `Player ${opponentUserId.substring(0, 4)}` : 'Opponent')}</h3>
                        {opponentElo !== null && (
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-md">
                            {opponentElo} ELO
                          </span>
                        )}
                        <div className="flex items-center gap-1.5 ml-1">
                          <div className={`w-2 h-2 rounded-full ${
                            onlineOpponentLeft ? 'bg-rose-500' : (isConnected ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse')
                          }`} />
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            onlineOpponentLeft ? 'text-rose-500' : (isConnected ? 'text-emerald-500' : 'text-amber-500')
                          }`}>
                            {onlineOpponentLeft ? 'Disconnected' : (isConnected ? 'Connected' : 'Reconnecting')}
                          </span>
                        </div>
                      </div>
                      <div className="text-sm text-zinc-500 flex items-center gap-2 mt-0.5 font-medium">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${onlinePlayerColor === 'black' ? 'bg-white border border-zinc-300' : 'bg-zinc-900'}`} />
                        <span className="flex-shrink-0">{onlinePlayerColor === 'black' ? 'White' : 'Black'}</span>
                        {currentPlayer !== onlinePlayerColor && !winner && timeLimit > 0 && (
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                              <motion.div 
                                className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                initial={{ width: "100%" }}
                                animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                                transition={{ duration: 1, ease: 'linear' }}
                              />
                            </div>
                            <span className={`font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`}>
                              00:{timeLeft.toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {!winner && (
                      <button 
                        onClick={() => setShowForfeitConfirm(true)} 
                        className="px-4 py-2 bg-rose-100 text-rose-600 rounded-full font-bold text-xs uppercase tracking-widest hover:bg-rose-200 transition-colors"
                      >
                        Forfeit
                      </button>
                    )}
                    <button 
                      onClick={() => setShowChat(!showChat)} 
                      className={`p-2 transition-all rounded-full shadow-sm relative ${showChat ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-400 hover:text-zinc-700'}`}
                    >
                      <MessageSquare size={24} />
                      {chatMessages.length > 0 && !showChat && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                    <button onClick={() => setShowMusicModal(true)} className="text-zinc-400 hover:text-zinc-700 p-2 transition-colors bg-white rounded-full shadow-sm">
                      <Music size={24} />
                    </button>
                    <button onClick={() => leaveOnlineMatch()} className="text-zinc-400 hover:text-zinc-700 p-2 transition-colors bg-white rounded-full shadow-sm">
                      <X size={24} />
                    </button>
                  </div>
                </div>

                {/* Center: Board */}
                <main className="flex-1 flex flex-col items-center justify-center relative my-8">
                  <AnimatePresence>
                    {showMusicModal && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
                      >
                        <div className="w-full max-w-md h-[500px] relative">
                          <button 
                            onClick={() => setShowMusicModal(false)}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center z-10 shadow-lg hover:scale-110 transition-transform"
                          >
                            <X size={16} />
                          </button>
                          <MusicPlayer />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <GomokuBoard
                    board={board}
                    onCellClick={handleCellClick}
                    winningLine={winningLine}
                    lastMove={lastMove}
                    keyboardCursor={keyboardCursor}
                    skin={currentSkin}
                    threats={threats}
                  />

                  <AnimatePresence>
                    {threats.length > 0 && !winner && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 bg-white p-4 md:p-6 rounded-3xl shadow-2xl border border-red-100 w-[90%] max-w-md z-10"
                      >
                        <div className="flex items-start gap-4">
                          <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                            <ShieldCheck size={24} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 text-red-600">Threat Detected!</h3>
                            <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                              Your opponent has {threats.length} potential winning {threats.length === 1 ? 'line' : 'lines'} (fours or open threes). Block them immediately!
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Chat Panel Overlay */}
                  <AnimatePresence>
                    {showChat && (
                      <motion.div
                        initial={{ opacity: 0, x: 20, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        className="absolute right-0 top-0 bottom-0 w-full max-w-[300px] bg-white/95 backdrop-blur-md shadow-2xl border-l border-zinc-100 z-40 flex flex-col rounded-l-3xl overflow-hidden"
                      >
                        <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                            <MessageSquare size={18} className="text-zinc-400" />
                            Game Chat
                          </h3>
                          <button onClick={() => setShowChat(false)} className="p-1 hover:bg-zinc-200 rounded-full transition-colors">
                            <X size={18} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                          {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center p-4">
                              <MessageSquare size={32} className="mb-2 opacity-20" />
                              <p className="text-xs font-medium uppercase tracking-widest">No messages yet</p>
                              <p className="text-[10px] mt-1">Be the first to say hello!</p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div key={msg.id} className={`flex gap-2 ${msg.isMe ? 'flex-row-reverse' : 'flex-row'} mb-4`}>
                                <div className="w-8 h-8 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                                  {msg.isMe ? (
                                    user?.photoURL ? (
                                      <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      <img src={currentCharacter.avatar} alt={currentCharacter.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    )
                                  ) : (
                                    opponentAvatarUrl ? (
                                      <img src={opponentAvatarUrl} alt="Opponent" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    ) : (
                                      msg.sender.substring(0, 2)
                                    )
                                  )}
                                </div>
                                <div className={`flex flex-col ${msg.isMe ? 'items-end' : 'items-start'}`}>
                                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                    msg.isMe 
                                      ? 'bg-zinc-900 text-white rounded-tr-none' 
                                      : 'bg-zinc-100 text-zinc-800 rounded-tl-none'
                                  }`}>
                                    <p className="leading-relaxed">{msg.text}</p>
                                  </div>
                                  <span className="text-[10px] text-zinc-400 mt-1 font-medium uppercase tracking-tighter">
                                    {msg.isMe ? 'You' : msg.sender} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSendMessage} className="p-4 bg-zinc-50/50 border-t border-zinc-100">
                          <div className="relative">
                            <input
                              type="text"
                              value={chatInput}
                              onChange={(e) => setChatInput(e.target.value)}
                              placeholder="Type a message..."
                              className="w-full bg-white border border-zinc-200 rounded-2xl py-3 pl-4 pr-12 text-sm outline-none focus:border-zinc-400 transition-colors"
                            />
                            <button
                              type="submit"
                              disabled={!chatInput.trim()}
                              className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-zinc-900 text-white rounded-xl flex items-center justify-center disabled:opacity-50 disabled:scale-95 transition-all hover:bg-zinc-800"
                            >
                              <Send size={16} />
                            </button>
                          </div>
                        </form>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </main>

                {/* Bottom: Player Info */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 ${currentPlayer === onlinePlayerColor ? 'bg-white shadow-lg ring-2 ring-emerald-500/50 scale-105' : 'opacity-60 scale-100'}`}>
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-xl font-bold text-white uppercase overflow-hidden ${currentPlayer !== onlinePlayerColor ? 'animate-idle-float' : ''}`}>
                        {user?.photoURL ? (
                          <img src={user.photoURL} alt="Me" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <img src={currentCharacter.avatar} alt={currentCharacter.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        )}
                      </div>
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: COLOR_MAP[currentCharacter.color?.toLowerCase() || ''] || currentCharacter.color || '#6b7280' }} />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-[#f5f5f5] rounded-full" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-zinc-900">{user?.displayName || currentCharacter.name}</h3>
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-md">
                          {playerElo} ELO
                        </span>
                      </div>
                      <div className="text-sm text-zinc-500 flex items-center gap-2 mt-0.5 font-medium">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${onlinePlayerColor === 'black' ? 'bg-zinc-900' : 'bg-white border border-zinc-300'}`} />
                        <span className="flex-shrink-0">{onlinePlayerColor === 'black' ? 'Black' : 'White'}</span>
                        {currentPlayer === onlinePlayerColor && !winner && timeLimit > 0 && (
                          <div className="flex items-center gap-2 ml-2">
                            <div className="w-16 h-1.5 bg-zinc-200 rounded-full overflow-hidden flex-shrink-0">
                              <motion.div 
                                className={`h-full ${timeLeft <= 10 ? 'bg-red-500' : 'bg-emerald-500'}`}
                                initial={{ width: "100%" }}
                                animate={{ width: `${(timeLeft / timeLimit) * 100}%` }}
                                transition={{ duration: 1, ease: 'linear' }}
                              />
                            </div>
                            <span className={`font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                              00:{timeLeft.toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full max-w-3xl mx-auto w-full shrink-0">
                <header className="flex items-center justify-between mb-8 shrink-0">
              <button
                onClick={() => gameMode === 'online' ? leaveOnlineMatch() : setCurrentScreen('home')}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-4">
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${currentPlayer === 'black' ? 'bg-zinc-900 text-white shadow-lg ring-2 ring-zinc-900/20 scale-105' : 'bg-zinc-200 text-zinc-900 opacity-60'}`}>
                  <div className="relative">
                    <img src={gameMode === 'pve' && startingPlayer === 'ai' ? CHARACTERS[1].avatar : currentCharacter.avatar} alt="Black Player" className={`w-5 h-5 rounded-full object-cover ${currentPlayer !== 'black' ? 'animate-idle-float' : ''}`} referrerPolicy="no-referrer" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: (gameMode === 'pve' && startingPlayer === 'ai' ? (COLOR_MAP[CHARACTERS[1].color?.toLowerCase() || ''] || CHARACTERS[1].color) : (COLOR_MAP[currentCharacter.color?.toLowerCase() || ''] || currentCharacter.color)) || '#6b7280' }} />
                  </div>
                  {gameMode === 'pve' && startingPlayer === 'ai' ? `${CHARACTERS[1].name} (AI)` : (gameMode === 'pvp' ? 'Player 1' : (user?.displayName || currentCharacter.name))}
                  {(gameMode === 'pve' || gameMode === 'pvp') && currentPlayer === 'black' && !winner && timeLimit > 0 && (
                    <span className={`ml-2 font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                      00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
                <div className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${currentPlayer === 'white' ? 'bg-zinc-900 text-white shadow-lg ring-2 ring-zinc-900/20 scale-105' : 'bg-zinc-200 text-zinc-900 opacity-60'}`}>
                  <div className="relative">
                    <img src={gameMode === 'pve' && startingPlayer === 'human' ? CHARACTERS[1].avatar : currentCharacter.avatar} alt="White Player" className={`w-5 h-5 rounded-full object-cover ${currentPlayer !== 'white' ? 'animate-idle-float' : ''}`} referrerPolicy="no-referrer" />
                    <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black/20" style={{ backgroundColor: (gameMode === 'pve' && startingPlayer === 'human' ? (COLOR_MAP[CHARACTERS[1].color?.toLowerCase() || ''] || CHARACTERS[1].color) : (COLOR_MAP[currentCharacter.color?.toLowerCase() || ''] || currentCharacter.color)) || '#6b7280' }} />
                  </div>
                  {gameMode === 'pve' && startingPlayer === 'human' ? `${CHARACTERS[1].name} (AI)` : (gameMode === 'pvp' ? 'Player 2' : (user?.displayName || currentCharacter.name))}
                  {(gameMode === 'pve' || gameMode === 'pvp') && currentPlayer === 'white' && !winner && timeLimit > 0 && (
                    <span className={`ml-2 font-mono ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>
                      00:{timeLeft.toString().padStart(2, '0')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowMusicModal(true)} 
                  className="p-2 hover:bg-zinc-100 text-zinc-600 rounded-full transition-colors"
                  title="Music Player"
                >
                  <Music size={20} />
                </button>
                {(!winner && gameMode !== 'online' && !(gameMode === 'pve' && ((startingPlayer === 'human' && currentPlayer === 'white') || (startingPlayer === 'ai' && currentPlayer === 'black')))) && (
                  <button 
                    onClick={askCoach} 
                    className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full font-semibold hover:bg-emerald-200 transition-colors text-sm flex items-center gap-2"
                    title="Ask Coach"
                  >
                    <Lightbulb size={16} />
                    Coach
                  </button>
                )}
                {(!winner && gameMode !== 'online' && moveHistory.length > 0 && !(gameMode === 'pve' && ((startingPlayer === 'human' && currentPlayer === 'white') || (startingPlayer === 'ai' && currentPlayer === 'black')))) && (
                  <button 
                    onClick={handleUndo} 
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-full font-semibold hover:bg-amber-200 transition-colors text-sm flex items-center gap-2"
                    title="Undo Move"
                  >
                    <Undo2 size={16} />
                    Undo
                  </button>
                )}
                {(!winner && gameMode !== 'online' && !(gameMode === 'pve' && ((startingPlayer === 'human' && currentPlayer === 'white') || (startingPlayer === 'ai' && currentPlayer === 'black')))) && (
                  <button 
                    onClick={() => setShowForfeitConfirm(true)} 
                    className="px-4 py-2 bg-rose-100 text-rose-600 rounded-full font-semibold hover:bg-rose-200 transition-colors text-sm flex items-center gap-2"
                    title="Forfeit Match"
                  >
                    Forfeit
                  </button>
                )}
                {gameMode !== 'online' && (
                  <button 
                    onClick={() => setShowNewGameModal(true)} 
                    className="px-4 py-2 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-800 transition-colors text-sm"
                  >
                    New Game
                  </button>
                )}
              </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative">
              <AnimatePresence>
                {showMusicModal && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm"
                  >
                    <div className="w-full max-w-md h-[500px] relative">
                      <button 
                        onClick={() => setShowMusicModal(false)}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center z-10 shadow-lg hover:scale-110 transition-transform"
                      >
                        <X size={16} />
                      </button>
                      <MusicPlayer />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <GomokuBoard
                board={board}
                onCellClick={handleCellClick}
                winningLine={winningLine}
                lastMove={lastMove}
                coachMove={coachAdvice ? { row: coachAdvice.row, col: coachAdvice.col } : null}
                keyboardCursor={keyboardCursor}
                skin={currentSkin}
                threats={threats}
              />

              <AnimatePresence>
                {threats.length > 0 && !winner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute top-4 md:top-8 left-1/2 -translate-x-1/2 bg-white p-4 md:p-6 rounded-3xl shadow-2xl border border-red-100 w-[90%] max-w-md z-10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
                        <ShieldCheck size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1 text-red-600">Threat Detected!</h3>
                        <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                          Your opponent has {threats.length} potential winning {threats.length === 1 ? 'line' : 'lines'} (fours or open threes). Block them immediately!
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {coachAdvice && !winner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 bg-white p-4 md:p-6 rounded-3xl shadow-2xl border border-emerald-100 w-[90%] max-w-md z-10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-100 p-3 rounded-full text-emerald-600 shrink-0">
                        <Lightbulb size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">Coach's Advice</h3>
                        <p className="text-zinc-600 text-sm mb-4 leading-relaxed">
                          {coachAdvice.explanation}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleCellClick(coachAdvice.row, coachAdvice.col)}
                            className="flex-1 bg-emerald-500 text-white py-2 px-4 rounded-xl font-semibold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <Check size={16} />
                            Apply Move
                          </button>
                          <button
                            onClick={() => setCoachAdvice(null)}
                            className="bg-zinc-100 text-zinc-600 py-2 px-4 rounded-xl font-semibold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 text-sm"
                          >
                            <X size={16} />
                            Close
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
              </div>
            )}

            <AnimatePresence>
              {winner && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white px-8 py-6 rounded-3xl shadow-2xl border border-zinc-100 text-center min-w-[300px] z-20"
                  >
                    <h2 className="text-3xl font-black mb-2">
                      {winner === 'draw' ? 'Draw!' : `${winner === 'black' ? 'Black' : 'White'} Wins!`}
                    </h2>
                    <p className="text-zinc-500 mb-2">
                      {hasForfeited ? 'You forfeited the match.' : (endReason === 'opponent_forfeited' ? 'Opponent forfeited the match.' : (endReason === 'timeout' ? (winner === onlinePlayerColor ? 'Opponent timed out.' : 'You timed out.') : (onlineOpponentLeft ? 'Opponent left the match.' : 'Great game played by both sides.')))}
                    </p>
                    {eloChange !== null && (
                      <div className="mb-6 flex items-center justify-center gap-2">
                        <span className="font-bold text-zinc-700">Rating: {playerElo}</span>
                        <span className={`font-bold ${eloChange > 0 ? 'text-emerald-500' : eloChange < 0 ? 'text-red-500' : 'text-zinc-500'}`}>
                          ({eloChange > 0 ? '+' : ''}{eloChange})
                        </span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const tempMatch: MatchRecord = {
                            id: 'temp_replay',
                            date: Date.now(),
                            opponent: gameMode === 'online' ? (opponentName || 'Unknown') : (gameMode === 'pve' ? `AI (${aiDifficulty})` : 'Local Player'),
                            opponentElo: playerElo,
                            playerEloBefore: playerElo - (eloChange || 0),
                            playerEloAfter: playerElo,
                            result: winner === 'draw' ? 'draw' : (winner === 'black' ? 'win' : 'loss'),
                            moves: moveHistory,
                            boardSize: boardSize,
                            gameMode: gameMode,
                            winner: winner || 'draw',
                            selectedSkin: selectedSkinId,
                            selectedCharacter: selectedCharacterId
                          };
                          startReplay(tempMatch);
                        }}
                        className="flex-1 bg-indigo-50 text-indigo-700 py-3 rounded-xl font-semibold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play size={16} />
                        Watch Replay
                      </button>
                    </div>
                    <div className="flex gap-3 mt-3">
                      {gameMode !== 'online' && (
                        <button
                          onClick={resetGame}
                          className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
                        >
                          Play Again
                        </button>
                      )}
                      <button
                        onClick={() => gameMode === 'online' ? leaveOnlineMatch() : setCurrentScreen('home')}
                        className="flex-1 bg-zinc-100 text-zinc-900 py-3 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                      >
                        Menu
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showNewGameModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
                    >
                      <h3 className="text-xl font-bold mb-2 text-center">New Game</h3>
                      <p className="text-zinc-500 text-center mb-6 text-sm">What would you like to do?</p>
                      
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            resetGame();
                            setShowNewGameModal(false);
                          }}
                          className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
                        >
                          Restart Current Game
                        </button>
                        <button
                          onClick={() => {
                            setShowNewGameModal(false);
                            setCurrentScreen('home');
                          }}
                          className="w-full py-3 bg-zinc-100 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                        >
                          Change Settings (Main Menu)
                        </button>
                        <button
                          onClick={() => setShowNewGameModal(false)}
                          className="w-full py-3 text-zinc-500 font-medium hover:text-zinc-900 transition-colors mt-2"
                        >
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {showForfeitConfirm && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4"
                  >
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full"
                    >
                      <h3 className="text-xl font-bold mb-2 text-center text-rose-600">Forfeit Match?</h3>
                      <p className="text-zinc-500 text-center mb-6 text-sm">Are you sure you want to concede? This will count as a loss.</p>
                      
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={forfeitMatch}
                          className="w-full py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-colors"
                        >
                          Yes, Forfeit
                        </button>
                        <button
                          onClick={() => setShowForfeitConfirm(false)}
                          className="w-full py-3 bg-zinc-100 text-zinc-900 rounded-xl font-semibold hover:bg-zinc-200 transition-colors"
                        >
                          Continue Playing
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
          </motion.div>
        )}

        {currentScreen === 'music' && (
          <motion.div
            key="music"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full h-full"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen('home')}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Music Player</h2>
            </header>

            <div className="flex-1 min-h-0">
              <MusicPlayer />
            </div>
          </motion.div>
        )}

        {currentScreen === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen('home')}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Statistics & Ranking</h2>
            </header>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 mb-8 flex flex-col items-center">
              <div className="flex flex-col items-center gap-2 mb-6">
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg mb-2"
                  style={{ backgroundColor: getRankTier(playerElo).color }}
                >
                  <Trophy size={40} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase" style={{ color: getRankTier(playerElo).color }}>
                  {getRankTier(playerElo).name}
                </h3>
                <p className="text-zinc-400 font-bold text-lg">{playerElo} ELO</p>
              </div>

              <div className="w-full">
                <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  <span>{getRankTier(playerElo).name}</span>
                  {getNextRank(playerElo) && (
                    <span>{getNextRank(playerElo)!.name} ({getNextRank(playerElo)!.minElo})</span>
                  )}
                </div>
                <div className="h-4 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 p-1">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ 
                      width: getNextRank(playerElo) 
                        ? `${((playerElo - getRankTier(playerElo).minElo) / (getNextRank(playerElo)!.minElo - getRankTier(playerElo).minElo)) * 100}%`
                        : '100%'
                    }}
                    className="h-full rounded-full shadow-sm"
                    style={{ backgroundColor: getRankTier(playerElo).color }}
                  />
                </div>
                {getNextRank(playerElo) && (
                  <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-3">
                    {getNextRank(playerElo)!.minElo - playerElo} ELO to next rank
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Matches</p>
                <p className="text-3xl font-black">{matchHistory.length}</p>
                <div className="flex gap-1 mt-2">
                  {matchHistory.slice(0, 5).map((m, i) => (
                    <div key={i} className={`w-2 h-2 rounded-full ${
                      m.result === 'win' ? 'bg-emerald-500' : 
                      m.result === 'loss' ? 'bg-rose-500' : 'bg-zinc-300'
                    }`} />
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Win Rate</p>
                <p className="text-3xl font-black">
                  {matchHistory.length > 0 
                    ? Math.round((matchHistory.filter(m => m.result === 'win').length / matchHistory.length) * 100)
                    : 0}%
                </p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                  Streak: {userProfile?.stats?.winStreak || 0} (Max: {userProfile?.stats?.maxWinStreak || 0})
                </p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 mb-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Grid size={20} className="text-indigo-500" />
                ELO Progression
              </h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={matchHistory.slice().reverse().map((m, i) => ({ elo: m.playerEloAfter, name: i + 1 }))}>
                    <defs>
                      <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={['dataMin - 50', 'dataMax + 50']} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ display: 'none' }}
                    />
                    <Area type="monotone" dataKey="elo" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorElo)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100">
                <h3 className="text-lg font-bold mb-6">Match Distribution</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Wins', value: matchHistory.filter(m => m.result === 'win').length },
                          { name: 'Losses', value: matchHistory.filter(m => m.result === 'loss').length },
                          { name: 'Draws', value: matchHistory.filter(m => m.result === 'draw').length },
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#10b981" />
                        <Cell fill="#ef4444" />
                        <Cell fill="#71717a" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 mt-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Wins</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Losses</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">Draws</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100">
                <h3 className="text-lg font-bold mb-6">Advanced Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Total Moves</span>
                    <span className="text-sm font-bold">{userProfile?.stats?.totalMoves || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Avg Moves/Game</span>
                    <span className="text-sm font-bold">
                      {matchHistory.length > 0 ? Math.round((userProfile?.stats?.totalMoves || 0) / matchHistory.length) : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Max Win Streak</span>
                    <span className="text-sm font-bold text-emerald-500">{userProfile?.stats?.maxWinStreak || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">Games Played</span>
                    <span className="text-sm font-bold">{userProfile?.stats?.totalGames || 0}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100 mb-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Trophy size={20} className="text-amber-500" />
                Global Leaderboard
              </h3>
              <div className="space-y-3">
                {leaderboard.length === 0 ? (
                  <p className="text-zinc-400 text-center py-4 text-sm">Loading leaderboard...</p>
                ) : (
                  leaderboard.map((player, i) => (
                    <div 
                      key={player.uid} 
                      className={`flex items-center justify-between p-3 rounded-2xl ${
                        player.uid === user?.uid ? 'bg-indigo-50 border border-indigo-100' : 'bg-zinc-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 text-center font-black text-xs ${
                          i === 0 ? 'text-amber-500' : i === 1 ? 'text-zinc-400' : i === 2 ? 'text-amber-700' : 'text-zinc-300'
                        }`}>
                          {i + 1}
                        </span>
                        <img 
                          src={player.avatarUrl || `https://i.pravatar.cc/150?u=${player.uid}`} 
                          alt={player.displayName}
                          className="w-8 h-8 rounded-full border border-zinc-200"
                        />
                        <span className={`font-bold text-sm ${player.uid === user?.uid ? 'text-indigo-600' : 'text-zinc-700'}`}>
                          {player.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900">{player.elo}</span>
                        <div 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: getRankTier(player.elo).color }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-zinc-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <RefreshCw size={20} className="text-indigo-400" />
                Match History
              </h3>
              <div className="space-y-4">
                {matchHistory.length === 0 ? (
                  <p className="text-zinc-500 text-center py-8 font-medium">No matches played yet.</p>
                ) : (
                  matchHistory.map((match, i) => (
                    <div 
                      key={match.id} 
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer group"
                      onClick={() => startReplay(match)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                          match.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' : 
                          match.result === 'loss' ? 'bg-rose-500/20 text-rose-400' : 
                          'bg-zinc-500/20 text-zinc-400'
                        }`}>
                          {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                        </div>
                        <div>
                          <p className="font-bold text-sm">vs {match.opponent}</p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {new Date(match.date).toLocaleDateString()} • {match.gameMode.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black">
                            {match.playerEloAfter}
                          </p>
                          <p className={`text-[10px] font-bold ${
                            match.playerEloAfter > match.playerEloBefore ? 'text-emerald-400' : 
                            match.playerEloAfter < match.playerEloBefore ? 'text-rose-400' : 
                            'text-zinc-500'
                          }`}>
                            {match.playerEloAfter > match.playerEloBefore ? '+' : ''}
                            {match.playerEloAfter - match.playerEloBefore}
                          </p>
                        </div>
                        <Play size={16} className="text-zinc-600 group-hover:text-white transition-colors" />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === 'replay' && replayMatch && (
          <motion.div
            key="replay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col p-4 md:p-8 bg-zinc-50"
          >
            <header className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentScreen('stats')}
                  className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Replay</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    vs {replayMatch.opponent} • Move {replayMoveIndex} / {replayMatch.moves.length}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setReplayMoveIndex(0);
                    setReplayBoard(createEmptyBoard(replayMatch.boardSize));
                    setIsPlayingReplay(false);
                  }}
                  disabled={replayMoveIndex === 0}
                  className="p-3 bg-white rounded-xl shadow-sm hover:bg-zinc-50 disabled:opacity-30 transition-all"
                  title="Go to start"
                >
                  <SkipBack size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsPlayingReplay(false);
                    prevReplayMove();
                  }}
                  disabled={replayMoveIndex === 0}
                  className="p-3 bg-white rounded-xl shadow-sm hover:bg-zinc-50 disabled:opacity-30 transition-all"
                  title="Previous move"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setIsPlayingReplay(!isPlayingReplay)}
                  disabled={replayMoveIndex === replayMatch.moves.length}
                  className="p-3 bg-zinc-900 text-white rounded-xl shadow-sm hover:bg-zinc-800 disabled:opacity-30 transition-all"
                  title={isPlayingReplay ? "Pause" : "Play"}
                >
                  {isPlayingReplay ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={() => {
                    setIsPlayingReplay(false);
                    nextReplayMove();
                  }}
                  disabled={replayMoveIndex === replayMatch.moves.length}
                  className="p-3 bg-white rounded-xl shadow-sm hover:bg-zinc-50 disabled:opacity-30 transition-all"
                  title="Next move"
                >
                  <ChevronRight size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsPlayingReplay(false);
                    const newBoard = createEmptyBoard(replayMatch.boardSize);
                    for (let i = 0; i < replayMatch.moves.length; i++) {
                      const move = replayMatch.moves[i];
                      newBoard[move.row][move.col] = move.player;
                    }
                    setReplayBoard(newBoard);
                    setReplayMoveIndex(replayMatch.moves.length);
                  }}
                  disabled={replayMoveIndex === replayMatch.moves.length}
                  className="p-3 bg-white rounded-xl shadow-sm hover:bg-zinc-50 disabled:opacity-30 transition-all"
                  title="Go to end"
                >
                  <SkipForward size={20} />
                </button>
              </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative">
              <GomokuBoard
                board={replayBoard}
                onCellClick={() => {}}
                winningLine={
                  replayMoveIndex === replayMatch.moves.length && replayMatch.winner !== 'draw' && replayMatch.moves.length > 0
                    ? checkWin(replayBoard, replayMatch.moves[replayMatch.moves.length - 1].row, replayMatch.moves[replayMatch.moves.length - 1].col, replayMatch.moves[replayMatch.moves.length - 1].player, false)
                    : null
                }
                lastMove={replayMoveIndex > 0 ? replayMatch.moves[replayMoveIndex - 1] : null}
                skin={allSkins.find(s => s.id === (replayMatch as any).selectedSkin) || SKINS[0]}
              />

              <div className="mt-8 w-full max-w-md bg-white p-6 rounded-3xl shadow-xl border border-zinc-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Timeline</span>
                  <span className="text-xs font-bold text-zinc-900">{Math.round((replayMoveIndex / replayMatch.moves.length) * 100)}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={replayMatch.moves.length} 
                  value={replayMoveIndex}
                  onChange={(e) => {
                    setIsPlayingReplay(false);
                    const newIndex = parseInt(e.target.value);
                    const newBoard = createEmptyBoard(replayMatch.boardSize);
                    for (let i = 0; i < newIndex; i++) {
                      const move = replayMatch.moves[i];
                      newBoard[move.row][move.col] = move.player;
                    }
                    setReplayBoard(newBoard);
                    setReplayMoveIndex(newIndex);
                  }}
                  className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                />
              </div>
            </main>
          </motion.div>
        )}

        {currentScreen === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen('home')}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Aide & Support</h2>
            </header>

            <div className="space-y-6">
              {/* FAQ Section */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <HelpCircle size={20} className="text-indigo-500" />
                  Foire Aux Questions (FAQ)
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">Comment jouer au Gomoku ?</h4>
                    <p className="text-sm text-zinc-500 mt-1">Le but est d'aligner 5 pierres de votre couleur horizontalement, verticalement ou en diagonale.</p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">Comment fonctionne le classement ELO ?</h4>
                    <p className="text-sm text-zinc-500 mt-1">Votre ELO augmente quand vous gagnez et diminue quand vous perdez. Le gain dépend du niveau de votre adversaire.</p>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-emerald-500" />
                  Contactez-nous
                </h3>
                <p className="text-sm text-zinc-500 mb-4">Besoin d'aide personnalisée ? Notre équipe est à votre écoute.</p>
                <a 
                  href="mailto:support@gomoku-app.fr" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
                >
                  Envoyer un email
                </a>
              </section>

              {/* Legal Mentions Section (French Law Compliance) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Scale size={20} className="text-amber-500" />
                  Mentions Légales
                </h3>
                <div className="text-xs text-zinc-500 space-y-2 leading-relaxed">
                  <p><strong>Éditeur :</strong> Gomoku App SAS, 123 Rue de la Stratégie, 75001 Paris, France.</p>
                  <p><strong>Directeur de la publication :</strong> Claude Pierre Monet.</p>
                  <p><strong>Hébergement :</strong> Google Cloud Platform (Europe-West2).</p>
                  <p>Conformément à la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN).</p>
                </div>
              </section>

              {/* GDPR Section (European Regulation Compliance) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-500" />
                  Protection des Données (RGPD)
                </h3>
                <div className="text-xs text-zinc-500 space-y-3 leading-relaxed">
                  <p>Nous accordons une importance capitale à la protection de vos données personnelles, conformément au Règlement Général sur la Protection des Données (RGPD).</p>
                  <div>
                    <p className="font-bold text-zinc-700">Vos Droits :</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>Droit d'accès à vos données.</li>
                      <li>Droit de rectification ou d'effacement.</li>
                      <li>Droit à la portabilité de vos données.</li>
                      <li>Droit d'opposition au traitement.</li>
                    </ul>
                  </div>
                  <p>Pour exercer vos droits, contactez notre Délégué à la Protection des Données (DPO) à l'adresse : <span className="font-bold">dpo@gomoku-app.fr</span>.</p>
                  <p>Les données collectées (Email Google, ELO, Historique) sont utilisées uniquement pour le fonctionnement du jeu et ne sont jamais revendues.</p>
                </div>
              </section>

              {/* Terms of Service (CGU) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info size={20} className="text-zinc-500" />
                  Conditions Générales d'Utilisation
                </h3>
                <div className="text-xs text-zinc-500 space-y-2 leading-relaxed">
                  <p>L'utilisation de l'application Gomoku implique l'acceptation pleine et entière des présentes CGU.</p>
                  <p>Tout comportement malveillant, triche ou harcèlement dans le chat en ligne pourra entraîner un bannissement définitif du compte.</p>
                  <button 
                    onClick={() => setCurrentScreen('privacy')}
                    className="text-indigo-600 font-bold hover:underline mt-2 block"
                  >
                    Consulter la Politique de Confidentialité complète →
                  </button>
                </div>
              </section>

              <footer className="text-center py-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Version 1.2.0 • Fait avec ❤️ en France • Conforme RGPD</p>
              </footer>
            </div>
          </motion.div>
        )}

        {currentScreen === 'privacy' && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen('support')}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Politique de Confidentialité</h2>
            </header>

            <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">1. Introduction</h3>
                <p>La présente Politique de Confidentialité a pour but d'informer les utilisateurs de l'application Gomoku sur la manière dont leurs données personnelles sont collectées, traitées et protégées, conformément au **Règlement Général sur la Protection des Données (RGPD)** et à la **Loi Informatique et Libertés**.</p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">2. Données Collectées</h3>
                <p className="mb-2">Nous collectons uniquement les données strictement nécessaires au bon fonctionnement du service :</p>
                <ul className="list-disc ml-5 space-y-2">
                  <li><span className="font-bold text-zinc-800">Identité :</span> Nom d'affichage, adresse email (via Google Auth), photo de profil.</li>
                  <li><span className="font-bold text-zinc-800">Données de jeu :</span> Score ELO, historique des matchs, statistiques de jeu, replays.</li>
                  <li><span className="font-bold text-zinc-800">Données techniques :</span> Adresse IP (pour la sécurité et le matchmaking), type d'appareil, fuseau horaire.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">3. Finalités du Traitement</h3>
                <p className="mb-2">Vos données sont traitées pour les finalités suivantes :</p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>Gestion de votre compte utilisateur et authentification.</li>
                  <li>Calcul et affichage du classement mondial (Leaderboard).</li>
                  <li>Mise en relation des joueurs pour les parties en ligne (Matchmaking).</li>
                  <li>Amélioration de l'expérience de jeu et support technique.</li>
                  <li>Prévention de la fraude et de la triche.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">4. Base Légale</h3>
                <p>Le traitement de vos données repose sur votre **consentement** (lors de la connexion via Google) et sur la **nécessité contractuelle** de fournir le service de jeu en ligne.</p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">5. Conservation des Données</h3>
                <p>Vos données sont conservées tant que votre compte est actif. En cas d'inactivité prolongée (plus de 2 ans) ou sur simple demande de votre part, vos données personnelles seront supprimées ou anonymisées, à l'exception de celles dont la conservation est requise par la loi.</p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">6. Destinataires des Données</h3>
                <p>Vos données sont exclusivement destinées à Gomoku App. Elles sont hébergées sur les serveurs sécurisés de **Google Cloud Platform (GCP)** situés au sein de l'Union Européenne. Aucune donnée n'est vendue ou louée à des tiers.</p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">7. Vos Droits (RGPD)</h3>
                <p className="mb-4">Conformément au RGPD, vous disposez des droits suivants :</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">Accès & Rectification</h4>
                    <p className="text-xs">Consulter et modifier vos informations à tout moment.</p>
                  </div>
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">Effacement (Droit à l'oubli)</h4>
                    <p className="text-xs">Demander la suppression définitive de votre compte.</p>
                  </div>
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">Portabilité</h4>
                    <p className="text-xs">Récupérer vos données dans un format structuré.</p>
                  </div>
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">Opposition</h4>
                    <p className="text-xs">Refuser certains traitements de vos données.</p>
                  </div>
                </div>
                <p className="mt-4">Pour exercer ces droits, contactez notre DPO : <span className="font-bold text-indigo-600">dpo@gomoku-app.fr</span>.</p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">8. Cookies</h3>
                <p>Nous utilisons uniquement des cookies techniques essentiels à l'authentification et au maintien de votre session. Aucun cookie publicitaire ou de traçage tiers n'est utilisé.</p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">9. Sécurité</h3>
                <p>Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles (chiffrement SSL/TLS, contrôle d'accès strict) pour protéger vos données contre tout accès non autorisé ou perte.</p>
              </section>

              <footer className="pt-8 border-t border-zinc-200 text-center">
                <p className="text-xs font-bold text-zinc-400">Dernière mise à jour : 26 Mars 2026</p>
                <button 
                  onClick={() => setCurrentScreen('home')}
                  className="mt-6 px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Retour à l'accueil
                </button>
              </footer>
            </div>
          </motion.div>
        )}

        {currentScreen === 'online' && (
          <motion.div
            key="online"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => {
                  setCurrentScreen('home');
                  setPrivateRoomCode('');
                  if (isSearchingMatch) {
                    setIsSearchingMatch(false);
                    setSearchStartTime(null);
                    getSocket().emit('cancelSearch');
                  }
                }}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Online Multiplayer</h2>
            </header>

            <div className="space-y-6">
              {isSearchingMatch ? (
                <div className="flex flex-col items-center justify-center gap-8 w-full py-12">
                  <div className="relative flex items-center justify-center w-24 h-24">
                    <div className="absolute inset-0 border-2 border-zinc-200 rounded-full animate-[spin_3s_linear_infinite]" />
                    <div className="absolute inset-2 border-2 border-t-zinc-800 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_ease-in-out_infinite]" />
                    <div className="absolute inset-4 border-2 border-b-zinc-400 border-t-transparent border-r-transparent border-l-transparent rounded-full animate-[spin_2s_ease-in-out_infinite_reverse]" />
                    <div className="w-3 h-3 bg-zinc-800 rounded-full animate-pulse" />
                  </div>

                  <div className="text-center space-y-2">
                    <h3 className="font-medium text-zinc-900 text-xl tracking-tight">Finding an opponent...</h3>
                    <p className="text-zinc-500 text-sm tracking-wide uppercase">Matching skill level</p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-mono text-zinc-400">
                      <span>{Math.floor(searchTimeElapsed / 60).toString().padStart(2, '0')}:{(searchTimeElapsed % 60).toString().padStart(2, '0')}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsSearchingMatch(false);
                      setSearchStartTime(null);
                      getSocket().emit('cancelSearch');
                    }}
                    className="px-6 py-2.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 font-medium text-sm transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              ) : privateRoomCode ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm mb-2">Share this code with your friend:</p>
                  <div className="text-4xl font-black tracking-widest bg-zinc-100 py-6 rounded-2xl mb-8">
                    {privateRoomCode}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-zinc-500 mb-8">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-base">Waiting for opponent...</span>
                  </div>
                  <button
                    onClick={() => {
                      setPrivateRoomCode('');
                      getSocket().emit('leaveMatch', { roomId: privateRoomCode });
                    }}
                    className="px-8 py-3 rounded-full border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 font-medium transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Matchmaking</h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setIsSearchingMatch(true);
                          setSearchStartTime(Date.now());
                          const region = selectedRegion === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : selectedRegion;
                          const effectiveTimeLimit = timeLimit === 0 ? 30 : timeLimit;
                          getSocket().emit('findMatch', { type: 'ranked', boardSize, ruleSet, elo: playerElo, userId: user?.uid, region, timeLimit: effectiveTimeLimit });
                        }}
                        className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold text-left transition-colors bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100"
                      >
                        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                          <Trophy size={24} />
                        </div>
                        <div>
                          <div className="text-lg">Ranked Match</div>
                          <div className="text-sm font-normal text-zinc-500">Play competitive matches and earn Elo</div>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => {
                          setIsSearchingMatch(true);
                          setSearchStartTime(Date.now());
                          const region = selectedRegion === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : selectedRegion;
                          const effectiveTimeLimit = timeLimit === 0 ? 30 : timeLimit;
                          getSocket().emit('findMatch', { type: 'casual', boardSize, ruleSet, userId: user?.uid, region, timeLimit: effectiveTimeLimit });
                        }}
                        className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold text-left transition-colors bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100"
                      >
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                          <Globe size={24} />
                        </div>
                        <div>
                          <div className="text-lg">Casual Match</div>
                          <div className="text-sm font-normal text-zinc-500">Play for fun without affecting your rank</div>
                        </div>
                      </button>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Private Room</h3>
                    <div className="space-y-4">
                      <button
                        onClick={() => {
                          getSocket().emit('createPrivateRoom', { boardSize, ruleSet, userId: user?.uid, timeLimit });
                        }}
                        className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold text-left transition-colors bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100"
                      >
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                          <Users size={24} />
                        </div>
                        <div>
                          <div className="text-lg">Create Private Room</div>
                          <div className="text-sm font-normal text-zinc-500">Play with a friend using a room code</div>
                        </div>
                      </button>

                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          placeholder="Enter Room Code" 
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-base uppercase outline-none focus:border-zinc-400 transition-colors"
                          value={joinRoomInput}
                          onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                          maxLength={6}
                        />
                        <button
                          onClick={() => {
                            if (joinRoomInput) {
                              getSocket().emit('joinPrivateRoom', { roomId: joinRoomInput, userId: user?.uid });
                            }
                          }}
                          className="bg-zinc-900 text-white px-6 rounded-2xl font-semibold hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                          disabled={!joinRoomInput}
                        >
                          Join
                        </button>
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">Server Region</label>
                        <select
                          value={selectedRegion}
                          onChange={(e) => setSelectedRegion(e.target.value)}
                          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-base text-zinc-700 outline-none focus:border-zinc-400 transition-colors"
                        >
                          <option value="auto">Auto (Best Ping)</option>
                          <option value="America/New_York">North America</option>
                          <option value="Europe/Paris">Europe</option>
                          <option value="Asia/Tokyo">Asia</option>
                          <option value="America/Sao_Paulo">South America</option>
                          <option value="Australia/Sydney">Oceania</option>
                        </select>
                      </div>
                      
                      <div>
                        <button
                          onClick={handleGeolocate}
                          disabled={isLocating}
                          className="w-full flex items-center justify-center gap-2 bg-zinc-900 text-white py-3 px-4 rounded-xl font-semibold hover:bg-zinc-800 transition-colors disabled:opacity-50"
                        >
                          {isLocating ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <MapPin size={18} />
                          )}
                          {isLocating ? 'Localisation...' : 'Géolocaliser'}
                        </button>
                        {locationName && (
                          <p className="text-sm text-emerald-600 mt-2 text-center font-medium">
                            <MapPin size={14} className="inline mr-1" />
                            {locationName}
                          </p>
                        )}
                      </div>
                    </div>
                  </section>
                </>
              )}
            </div>
          </motion.div>
        )}

        {currentScreen === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen('home')}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Settings</h2>
            </header>

            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Game Rules</h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Grid size={20} className="text-zinc-400" />
                      <span className="font-medium">Board Size</span>
                    </div>
                    <select 
                      value={boardSize}
                      onChange={(e) => setBoardSize(Number(e.target.value) as BoardSize)}
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value={15}>15 x 15</option>
                      <option value={19}>19 x 19</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <BookOpen size={20} className="text-zinc-400" />
                      <span className="font-medium">Rule Set</span>
                    </div>
                    <select 
                      value={ruleSet}
                      onChange={(e) => setRuleSet(e.target.value as RuleSet)}
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="casual">Casual Gomoku</option>
                      <option value="renju">Renju Pro Rules</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <UserCircle size={20} className="text-zinc-400" />
                      <span className="font-medium">Who Starts (PvE)</span>
                    </div>
                    <select 
                      value={startingPlayer}
                      onChange={(e) => setStartingPlayer(e.target.value as StartingPlayer)}
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="human">Player (Black)</option>
                      <option value="ai">AI (Black)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <RefreshCw size={20} className="text-zinc-400" />
                      <span className="font-medium">Time Limit (Per Turn)</span>
                    </div>
                    <select 
                      value={timeLimit}
                      onChange={(e) => setTimeLimitSetting(parseInt(e.target.value) as TimeLimit)}
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="0">Unlimited</option>
                      <option value="15">15 Seconds</option>
                      <option value="30">30 Seconds</option>
                      <option value="60">60 Seconds</option>
                    </select>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Character & Skin</h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3 mb-4">
                      <User size={20} className="text-zinc-400" />
                      <span className="font-medium">Select Character</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      {[...CHARACTERS, ...(userProfile?.customCharacters || [])].map(char => {
                        const charColor = char.color ? (COLOR_MAP[char.color.toLowerCase()] || char.color) : '#6b7280';
                        return (
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          whileHover={{ scale: 1.02 }}
                          key={char.id}
                          onClick={() => {
                            setSelectedCharacterId(char.id);
                            setSelectedSkinId(char.defaultSkin);
                          }}
                          className={`relative flex items-center text-left p-3 rounded-2xl border-2 transition-all group ${
                            selectedCharacterId === char.id 
                              ? 'bg-white shadow-md ring-2 ring-offset-2' 
                              : 'border-transparent bg-zinc-50/50 hover:bg-zinc-100 hover:shadow-sm'
                          }`}
                          style={{ borderColor: selectedCharacterId === char.id ? charColor : 'transparent', ringColor: charColor }}
                        >
                          <div className="relative">
                            <img 
                              src={char.avatar} 
                              alt={char.name} 
                              className="w-14 h-14 rounded-2xl object-cover bg-white shadow-sm border border-zinc-100 flex-shrink-0 transition-transform group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            <div 
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm"
                              style={{ backgroundColor: charColor }}
                              title={`Color: ${char.color}`}
                            />
                          </div>
                          <div className="ml-3 flex-1 overflow-hidden">
                            <span className="text-sm font-bold text-zinc-900 block truncate">{char.name}</span>
                            <span className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-tight opacity-90">{char.bio}</span>
                          </div>
                        </motion.button>
                        )})}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Palette size={20} className="text-zinc-400" />
                      <span className="font-medium">Board & Stone Skin</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                      {allSkins.map(skin => {
                        const isBlackHex = /^#([0-9A-F]{3}){1,2}$/i.test(skin.blackStone);
                        const isWhiteHex = /^#([0-9A-F]{3}){1,2}$/i.test(skin.whiteStone);
                        return (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.02 }}
                            key={skin.id + (skin.isCustom ? `_${skin.name}` : '')}
                            onClick={() => setSelectedSkinId(skin.id)}
                            className={`flex flex-col items-start p-3 rounded-2xl border-2 transition-all ${
                              selectedSkinId === skin.id 
                                ? 'border-zinc-900 bg-zinc-50 ring-2 ring-zinc-900 ring-offset-2' 
                                : 'border-transparent bg-zinc-100 hover:bg-zinc-200'
                            }`}
                          >
                            <div 
                              className="w-full h-12 rounded-lg mb-2 flex items-center justify-center gap-2"
                              style={{ backgroundColor: skin.boardColor }}
                            >
                              <div 
                                className={`w-4 h-4 rounded-full ${!isBlackHex ? skin.blackStone : ''}`} 
                                style={isBlackHex ? { backgroundColor: skin.blackStone } : {}}
                              />
                              <div 
                                className={`w-4 h-4 rounded-full ${!isWhiteHex ? skin.whiteStone : ''}`} 
                                style={isWhiteHex ? { backgroundColor: skin.whiteStone } : {}}
                              />
                            </div>
                            <span className="text-xs font-bold">{skin.name}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Appearance</h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Sun size={20} className="text-zinc-400" />
                      <span className="font-medium">Theme</span>
                    </div>
                    <select className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900">
                      <option>System</option>
                      <option>Light</option>
                      <option>Dark</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <Monitor size={20} className="text-zinc-400" />
                      <span className="font-medium">Animations</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Audio</h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Volume2 size={20} className="text-zinc-400" />
                      <span className="font-medium">Sound Effects</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={soundEnabled}
                        onChange={(e) => setSoundEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Music size={20} className="text-zinc-400" />
                      <span className="font-medium">Background Music</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer" 
                        checked={musicEnabled}
                        onChange={(e) => setMusicEnabled(e.target.checked)}
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">Account</h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white overflow-hidden shadow-sm">
                        {user?.photoURL ? <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" /> : <User size={24} />}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{user?.displayName || 'Player'}</p>
                        <p className="text-xs font-medium text-zinc-500">{user?.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setCurrentScreen('home');
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-rose-100 transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>
              </section>

              {/* Danger Zone */}
              {user && (
                <div className="pt-8 border-t border-zinc-100">
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">Zone de Danger</h4>
                  <button 
                    onClick={deleteAccount}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >
                    <X size={20} />
                    Supprimer mon compte et mes données
                  </button>
                  <p className="mt-4 text-[10px] text-zinc-400 text-center leading-relaxed">
                    Conformément au RGPD, vous avez le droit à l'effacement de vos données. 
                    Cette action supprimera définitivement votre profil, votre ELO et votre historique de matchs.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {currentScreen === 'tutorial' && (
          <motion.div
            key="tutorial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-zinc-50 overflow-y-auto"
          >
            <TutorialScreen onBack={() => setCurrentScreen('home')} />
          </motion.div>
        )}
        {currentScreen === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 overflow-y-auto custom-scrollbar"
          >
            <div className="max-w-2xl mx-auto w-full pb-24 shrink-0">
              <header className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setCurrentScreen('home')}
                  className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-3xl font-black tracking-tighter">My Profile</h2>
              </header>

              <section className="mb-12">
                <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-xl flex flex-col md:flex-row items-center gap-8">
                  <div className="relative group">
                    <img 
                      src={userProfile?.avatarUrl} 
                      alt="Avatar" 
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                      <RefreshCw size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black tracking-tighter mb-1">{userProfile?.displayName}</h3>
                    <p className="text-zinc-400 font-bold text-sm tracking-widest uppercase mb-4">{playerElo} ELO • {getRankTier(playerElo).name}</p>
                    <p className="text-zinc-600 font-medium leading-relaxed max-w-md">
                      {userProfile?.bio || "No bio yet. Tell the world about your Gomoku strategy!"}
                    </p>
                  </div>
                </div>
              </section>

              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tighter uppercase">Custom Characters</h3>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreatingChar(true)}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus size={14} />
                    Create New
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userProfile?.customCharacters.map(char => (
                    <div key={char.id} className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center gap-4">
                      <img src={char.avatar} alt={char.name} className="w-16 h-16 rounded-2xl object-cover" referrerPolicy="no-referrer" />
                      <div>
                        <h4 className="font-bold text-zinc-900">{char.name}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1">{char.bio}</p>
                      </div>
                    </div>
                  ))}
                  {userProfile?.customCharacters.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-zinc-100/50 rounded-3xl border-2 border-dashed border-zinc-200">
                      <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest">No custom characters yet</p>
                    </div>
                  )}
                </div>
              </section>

              <section className="mb-12">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black tracking-tighter uppercase">Custom Skins</h3>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setIsCreatingSkin(true)}
                    className="flex items-center gap-2 bg-zinc-900 text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus size={14} />
                    Design Skin
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {allCustomSkins.map((skin, idx) => {
                    const isBlackHex = /^#([0-9A-F]{3}){1,2}$/i.test(skin.blackStone);
                    const isWhiteHex = /^#([0-9A-F]{3}){1,2}$/i.test(skin.whiteStone);
                    return (
                    <div key={idx} className="bg-white p-4 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between gap-4 group">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-16 h-16 rounded-2xl flex items-center justify-center gap-1"
                          style={{ backgroundColor: skin.boardColor }}
                        >
                          <div 
                            className={`w-3 h-3 rounded-full ${!isBlackHex ? skin.blackStone : ''}`} 
                            style={isBlackHex ? { backgroundColor: skin.blackStone } : {}}
                          />
                          <div 
                            className={`w-3 h-3 rounded-full ${!isWhiteHex ? skin.whiteStone : ''}`} 
                            style={isWhiteHex ? { backgroundColor: skin.whiteStone } : {}}
                          />
                        </div>
                        <div>
                          <h4 className="font-bold text-zinc-900">{skin.name}</h4>
                          <p className="text-xs text-zinc-500">Custom Design</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteCustomSkin(skin.id)}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors opacity-0 group-hover:opacity-100"
                        title="Delete skin"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )})}
                  {allCustomSkins.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-zinc-100/50 rounded-3xl border-2 border-dashed border-zinc-200">
                      <p className="text-zinc-400 font-bold text-sm uppercase tracking-widest">No custom skins yet</p>
                    </div>
                  )}
                </div>
              </section>
            </div>

            {/* Creation Modals */}
            <AnimatePresence>
              {isCreatingChar && (
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
                      <h3 className="text-2xl font-black tracking-tighter uppercase">New Character</h3>
                      <button onClick={() => setIsCreatingChar(false)} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Live Preview */}
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center gap-4">
                        <img 
                          src={newCharAvatar || "https://picsum.photos/seed/placeholder/200/200"} 
                          alt="Preview" 
                          className="w-16 h-16 rounded-2xl object-cover shadow-sm bg-zinc-200"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://picsum.photos/seed/placeholder/200/200";
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-bold text-zinc-900">{newCharName || "Character Name"}</h4>
                          <p className="text-xs text-zinc-500 line-clamp-2">{newCharBio || "Character biography will appear here..."}</p>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Character Name</label>
                        <input 
                          type="text" 
                          value={newCharName}
                          onChange={(e) => setNewCharName(e.target.value)}
                          placeholder="e.g. Shadow Master"
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Avatar URL</label>
                        <input 
                          type="text" 
                          value={newCharAvatar}
                          onChange={(e) => setNewCharAvatar(e.target.value)}
                          placeholder="https://..."
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Biography</label>
                        <textarea 
                          value={newCharBio}
                          onChange={(e) => setNewCharBio(e.target.value)}
                          placeholder="A short story about your character..."
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none"
                        />
                      </div>
                      <motion.button 
                        whileHover={newCharName && newCharAvatar ? { scale: 1.02 } : {}}
                        whileTap={newCharName && newCharAvatar ? { scale: 0.98 } : {}}
                        onClick={handleCreateCustomCharacter}
                        disabled={!newCharName || !newCharAvatar}
                        className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
                          newCharName && newCharAvatar 
                            ? 'bg-zinc-900 text-white hover:bg-zinc-800 shadow-zinc-900/20' 
                            : 'bg-zinc-200 text-zinc-400 cursor-not-allowed shadow-none'
                        }`}
                      >
                        Create Character
                      </motion.button>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {isCreatingSkin && (
                <CustomSkinDesigner 
                  onClose={() => setIsCreatingSkin(false)} 
                  onSave={handleCreateCustomSkin} 
                />
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Color Button */}
      <motion.button
        drag
        dragConstraints={{ left: -window.innerWidth + 50, right: 0, top: -window.innerHeight + 50, bottom: 0 }}
        dragElastic={0.1}
        onDragStart={() => {
          if (ambientBtnTimeoutRef.current) clearTimeout(ambientBtnTimeoutRef.current);
          setIsAmbientBtnCollapsed(false);
        }}
        onDragEnd={() => {
          resetAmbientBtnTimeout();
        }}
        onPointerDown={(e) => {
          // Prevent default to avoid issues with touch events on mobile
          // e.preventDefault();
        }}
        onPointerUp={(e) => {
          if (isAmbientBtnCollapsed) {
            resetAmbientBtnTimeout();
          } else {
            nextAmbientColor();
            resetAmbientBtnTimeout();
          }
        }}
        animate={{
          width: isAmbientBtnCollapsed ? 8 : 48,
          height: isAmbientBtnCollapsed ? 48 : 48,
          borderRadius: isAmbientBtnCollapsed ? 4 : 24,
          opacity: isAmbientBtnCollapsed ? 0.5 : 1,
        }}
        className="absolute bottom-6 right-6 bg-white shadow-xl border border-zinc-200 text-zinc-600 hover:text-zinc-900 transition-colors z-50 flex items-center justify-center overflow-hidden touch-none"
        title="Changer la couleur d'ambiance"
        style={{
          boxShadow: ambientColor !== 'transparent' && !isAmbientBtnCollapsed ? `0 10px 25px -5px ${ambientColor}80` : undefined
        }}
      >
        {!isAmbientBtnCollapsed && <Palette size={24} color={ambientColor !== 'transparent' ? ambientColor : 'currentColor'} />}
      </motion.button>

      {/* Background Music */}
      <audio 
        id="bg-music" 
        loop 
        src="https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3" 
      />
    </div>
  );
}
