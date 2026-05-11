import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Settings,
  Trophy,
  User,
  ChevronLeft,
  ChevronRight,
  SkipBack,
  SkipForward,
  Volume2,
  Moon,
  Sun,
  Monitor,
  RefreshCw,
  Cpu,
  Lightbulb,
  X,
  Check,
  Grid,
  BookOpen,
  UserCircle,
  Palette,
  Globe,
  Loader2,
  Users,
  LogOut,
  Music,
  MessageSquare,
  Send,
  Undo2,
  HelpCircle,
  ShieldCheck,
  Scale,
  Mail,
  Info,
  Trash2,
  MapPin,
  Plus,
  Zap,
  Contrast,
  Clock,
  Heart,
  Terminal,
  Activity,
  Target,
  Award,
  Shield,
  Crown,
  Puzzle,
  Compass,
  ShoppingCart,
  QrCode,
} from "lucide-react";
import confetti from "canvas-confetti";
import { GomokuBoard } from "./GomokuBoard";
import {
  BoardState,
  Player,
  createEmptyBoard,
  checkWin,
  isBoardFull,
  Threat,
  findThreats,
  getForbiddenMoveReason,
  RenjuRules,
} from "../game/engine";
import { getBestMove, getCoachAdvice, Difficulty } from "../game/ai";
import { analyzeGame, MoveAnalysis } from "../game/analysis";
import { connectSocket, disconnectSocket, getSocket } from "../game/socket";
import {
  MatchRecord,
  getRankTier,
  getNextRank,
  RANK_TIERS,
  SKINS,
  CHARACTERS,
  SkinId,
  UserProfile,
  Character,
  Skin,
  UiStyle,
  ACHIEVEMENTS,
} from "../types";
import {
  auth,
  db,
  loginWithGoogle,
  logout,
  onAuthStateChanged,
  User as FirebaseUser,
  OperationType,
  handleFirestoreError,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "../firebase";

import { MusicPlayer } from "./MusicPlayer";
import { TutorialScreen } from "./TutorialScreen";
import { CustomSkinDesigner } from "./CustomSkinDesigner";
import { OpeningExplorer } from "./OpeningExplorer";
import { DailyPuzzle } from "./DailyPuzzle";
import { ZenShop } from "./ZenShop";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

import { toast } from "sonner";

const PREDEFINED_AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Garfield",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Loki",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot2",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Molly",
  "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
];

const AMBIENT_COLORS = [
  { name: "Aucun", value: "transparent" },
  { name: "Noir Métallique", value: "#2a2a2a" },
  { name: "Noir", value: "#090909" },
  { name: "Or", value: "#FFD700" },
  { name: "Jaune Fluo", value: "#eaff00" },
  { name: "Vert Fluo", value: "#39ff14" },
  { name: "Orange Fluo", value: "#ff6600" },
  { name: "Bleu Fluo", value: "#0044ff" },
  { name: "Bleu Ciel Fluo", value: "#00ffff" },
  { name: "Bleu Électrique Fluo", value: "#0ff0fc" },
  { name: "Rouge Fluo", value: "#ff003c" },
  { name: "Beige Fluo", value: "#fffae6" },
  { name: "Blanc Fluo", value: "#ffffff" },
];

type Screen =
  | "home"
  | "game"
  | "settings"
  | "stats"
  | "replay"
  | "music"
  | "profile"
  | "tutorial"
  | "support"
  | "privacy"
  | "online"
  | "openings"
  | "daily"
  | "shop";
type GameMode = "pvp" | "pve" | "online";
type BoardSize = string | number;
type RuleSet = "casual" | "renju";
type StartingPlayer = "human" | "ai";
type TimeLimit = 0 | 15 | 30 | 60;

interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isMe: boolean;
  achievements?: string[];
}

const COLOR_MAP: Record<string, string> = {
  emerald: "#10b981",
  cyan: "#06b6d4",
  green: "#22c55e",
  red: "#ef4444",
  orange: "#f97316",
  blue: "#3b82f6",
  teal: "#14b8a6",
  gray: "#6b7280",
  gold: "#eab308",
  yellow: "#eab308",
  silver: "#9ca3af",
  purple: "#a855f7",
  crimson: "#dc2626",
  brown: "#78350f",
  sky: "#0ea5e9",
  indigo: "#6366f1",
  lime: "#84cc16",
  white: "#ffffff",
  black: "#000000",
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
  renjuRules: RenjuRules;
}

const DIFFICULTY_CONFIG: Record<
  Difficulty,
  { label: string; icon: any; color: string; description: string }
> = {
  Beginner: {
    label: "Beginner",
    icon: Zap,
    color: "bg-emerald-500",
    description: "Just starting out. AI plays casually.",
  },
  Intermediate: {
    label: "Intermediate",
    icon: Activity,
    color: "bg-blue-500",
    description: "A steady challenge for most players.",
  },
  Advanced: {
    label: "Advanced",
    icon: Target,
    color: "bg-amber-500",
    description: "AI looks for basic tactical patterns.",
  },
  Expert: {
    label: "Expert",
    icon: Award,
    color: "bg-rose-500",
    description: "Think carefully. AI plans ahead.",
  },
  Master: {
    label: "Master",
    icon: Shield,
    color: "bg-purple-600",
    description: "The ultimate veteran. High depth search.",
  },
  Grandmaster: {
    label: "Grandmaster",
    icon: Crown,
    color: "bg-zinc-900",
    description: "Master of the stones. Maximum depth minimax.",
  },
};

export function AppScreens() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("home");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Custom Character Creation State
  const [newCharName, setNewCharName] = useState("");
  const [newCharAvatar, setNewCharAvatar] = useState("");
  const [newCharBio, setNewCharBio] = useState("");
  const [isCreatingChar, setIsCreatingChar] = useState(false);

  // Custom Skin Creation State
  const [isCreatingSkin, setIsCreatingSkin] = useState(false);
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [gameMode, setGameMode] = useState<GameMode>("pve");
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty>(() => {
    const saved = localStorage.getItem("gomoku_aiDifficulty");
    return (saved as Difficulty) || "Intermediate";
  });
  const [showDifficultySelect, setShowDifficultySelect] = useState(false);
  const [isSearchingMatch, setIsSearchingMatch] = useState(false);
  const [searchStartTime, setSearchStartTime] = useState<number | null>(null);
  const [searchTimeElapsed, setSearchTimeElapsed] = useState(0);
  const [privateRoomCode, setPrivateRoomCode] = useState("");
  const [joinRoomInput, setJoinRoomInput] = useState("");
  const [onlineRoomId, setOnlineRoomId] = useState<string | null>(null);
  const [onlinePlayerColor, setOnlinePlayerColorState] = useState<Player>(null);
  const onlinePlayerColorRef = useRef<Player>(null);

  const setOnlinePlayerColor = (color: Player) => {
    setOnlinePlayerColorState(color);
    onlinePlayerColorRef.current = color;
  };

  const [uiStyle, setUiStyle] = useState<UiStyle>(() => {
    const saved = localStorage.getItem("gomoku_uiStyle");
    return (saved as UiStyle) || "modern";
  });

  const [onlineOpponentLeft, setOnlineOpponentLeft] = useState(false);
  const [endReason, setEndReason] = useState<string | null>(null);
  const [forbiddenReason, setForbiddenReason] = useState<
    "double-three" | "double-four" | "overline" | null
  >(null);
  const [selectedRegion, setSelectedRegion] = useState<string>(() => {
    const saved = localStorage.getItem("gomoku_selectedRegion");
    return saved || "auto";
  });
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
  const [opponentAvatarUrl, setOpponentAvatarUrl] = useState<string | null>(
    null,
  );
  const [opponentName, setOpponentName] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [eloChange, setEloChange] = useState<number | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
  const [moveHistory, setMoveHistory] = useState<
    { row: number; col: number; player: Player }[]
  >([]);
  const [replayMatch, setReplayMatch] = useState<MatchRecord | null>(null);
  const [replayMoveIndex, setReplayMoveIndex] = useState<number>(0);
  const [replayBoard, setReplayBoard] = useState<BoardState>([]);
  const [isPlayingReplay, setIsPlayingReplay] = useState<boolean>(false);
  const [analysisData, setAnalysisData] = useState<{
    analysis: MoveAnalysis[];
    dataPoints: number[];
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [leaderboard, setLeaderboard] = useState<UserProfile[]>([]);

  // Settings
  const [boardSize, setBoardSize] = useState<BoardSize>(() => {
    const saved = localStorage.getItem("gomoku_boardSize");
    if (!saved) return 15;
    return isNaN(Number(saved)) ? saved : (parseInt(saved) as BoardSize);
  });
  const [ruleSet, setRuleSet] = useState<RuleSet>(() => {
    const saved = localStorage.getItem("gomoku_ruleSet");
    return (saved as RuleSet) || "casual";
  });
  const [renjuRules, setRenjuRules] = useState<RenjuRules>(() => {
    const saved = localStorage.getItem("gomoku_renjuRules");
    return saved
      ? JSON.parse(saved)
      : { doubleThree: true, doubleFour: true, overline: true };
  });
  const [startingPlayer, setStartingPlayer] = useState<StartingPlayer>(() => {
    const saved = localStorage.getItem("gomoku_startingPlayer");
    return (saved as StartingPlayer) || "human";
  });
  const [timeLimit, setTimeLimitSetting] = useState<TimeLimit>(() => {
    const saved = localStorage.getItem("gomoku_timeLimit");
    return saved ? (parseInt(saved) as TimeLimit) : 30;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("gomoku_soundEnabled");
    return saved === null ? true : saved === "true";
  });
  const [musicEnabled, setMusicEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem("gomoku_musicEnabled");
    return saved === null ? true : saved === "true";
  });
  const [selectedSkinId, setSelectedSkinId] = useState<SkinId>(() => {
    const saved = localStorage.getItem("gomoku_selectedSkinId");
    return (saved as SkinId) || "classic";
  });
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>(() => {
    const saved = localStorage.getItem("gomoku_selectedCharacterId");
    return saved || "master_lin";
  });

  const [localCustomSkins, setLocalCustomSkins] = useState<Skin[]>(() => {
    const saved = localStorage.getItem("gomoku_customSkins");
    return saved ? JSON.parse(saved) : [];
  });

  const allCustomSkins = userProfile?.customSkins || localCustomSkins;
  const allSkins = useMemo(
    () => [...SKINS, ...allCustomSkins],
    [allCustomSkins],
  );
  const currentSkin = useMemo(
    () => allSkins.find((s) => s.id === selectedSkinId) || SKINS[0],
    [allSkins, selectedSkinId],
  );
  const currentCharacter = useMemo(
    () => CHARACTERS.find((c) => c.id === selectedCharacterId) || CHARACTERS[0],
    [selectedCharacterId],
  );

  const soundEnabledRef = useRef<boolean>(true);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const playSound = (type: "move" | "win" | "lose" | "draw") => {
    if (!soundEnabledRef.current) return;

    try {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      if (type === "move") {
        const soundType = userProfile?.selectedSound || "default";
        if (soundType.startsWith("sound_")) {
          const parts = soundType.split("_");
          const tier = parts[1];
          const num = parseInt(parts[2]) || 1;
          
          let baseFreq = 400;
          let endFreq = 600;
          let dur = 0.1;
          let baseVolume = 0.3;
          let waveType: OscillatorType = "sine";
          
          if (tier === "classic") {
            waveType = num % 2 === 0 ? "square" : "triangle";
            baseFreq = 200 + (num * 30);
            endFreq = 150 + (num * 20);
            dur = 0.2;
          } else if (tier === "silver") {
            waveType = "sawtooth";
            baseFreq = 300 + (num * 40);
            endFreq = baseFreq - 100;
            dur = 0.25;
            baseVolume = 0.4;
          } else if (tier === "gold") {
            waveType = "sine";
            baseFreq = 800 + (num * 100);
            endFreq = 1200 + (num * 100);
            dur = 0.15;
            baseVolume = 0.2;
          } else if (tier === "diamond") {
            waveType = "sine";
            if (num % 2 === 0) { // clicks
              baseFreq = 1500 + (num * 50);
              endFreq = 3000;
              dur = 0.05;
              baseVolume = 0.5;
            } else { // deep calls
              baseFreq = 100 + (num * 10);
              endFreq = 80;
              dur = 0.4;
              baseVolume = 0.5;
            }
          } else if (tier === "plat") {
            waveType = num % 2 === 0 ? "sawtooth" : "square";
            baseFreq = 150 + (num * 20);
            endFreq = 50 + (num * 10);
            dur = 0.35;
            baseVolume = 0.6;
          }

          osc.type = waveType;
          osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            endFreq,
            ctx.currentTime + dur,
          );
          gainNode.gain.setValueAtTime(baseVolume, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            ctx.currentTime + dur,
          );
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + dur);
        } else if (soundType === "laser") {
          osc.type = "sawtooth";
          osc.frequency.setValueAtTime(800, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            200,
            ctx.currentTime + 0.15,
          );
          gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            ctx.currentTime + 0.15,
          );
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.15);
        } else if (soundType === "heavy") {
          osc.type = "square";
          osc.frequency.setValueAtTime(100, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.1);
          gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            ctx.currentTime + 0.1,
          );
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
        } else {
          // default
          osc.type = "sine";
          osc.frequency.setValueAtTime(400, ctx.currentTime);
          osc.frequency.exponentialRampToValueAtTime(
            600,
            ctx.currentTime + 0.1,
          );
          gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            ctx.currentTime + 0.1,
          );
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.1);
        }
      } else if (type === "win") {
        osc.type = "triangle";
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.setValueAtTime(500, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.2);
        osc.frequency.setValueAtTime(800, ctx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === "lose") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.6);
      } else if (type === "draw") {
        osc.type = "square";
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

  const moveHistoryRef = useRef<{ row: number; col: number; player: Player }[]>(
    [],
  );
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
          const userDocRef = doc(db, "users", opponentUserId);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setOpponentAvatarUrl(userDoc.data().photoURL || null);
            setOpponentName(userDoc.data().displayName || null);
          } else {
            setOpponentAvatarUrl(null);
            setOpponentName(null);
          }
        } catch (error) {
          console.error("Error fetching opponent avatar:", error);
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
    localStorage.setItem("gomoku_uiStyle", uiStyle);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.uiStyle": uiStyle,
      }).catch((err) => console.error("Error saving uiStyle:", err));
    }
  }, [uiStyle, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_boardSize", boardSize.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.boardSize": boardSize,
      }).catch((err) => console.error("Error saving boardSize:", err));
    }
  }, [boardSize, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_ruleSet", ruleSet);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.ruleSet": ruleSet,
      }).catch((err) => console.error("Error saving ruleSet:", err));
    }
  }, [ruleSet, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_renjuRules", JSON.stringify(renjuRules));
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.renjuRules": renjuRules,
      }).catch((err) => console.error("Error saving renjuRules:", err));
    }
  }, [renjuRules, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_startingPlayer", startingPlayer);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.startingPlayer": startingPlayer,
      }).catch((err) => console.error("Error saving startingPlayer:", err));
    }
  }, [startingPlayer, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_timeLimit", timeLimit.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.timeLimit": timeLimit,
      }).catch((err) => console.error("Error saving timeLimit:", err));
    }
  }, [timeLimit, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_aiDifficulty", aiDifficulty);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.aiDifficulty": aiDifficulty,
      }).catch((err) => console.error("Error saving aiDifficulty:", err));
    }
  }, [aiDifficulty, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_soundEnabled", soundEnabled.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.soundEnabled": soundEnabled,
      }).catch((err) => console.error("Error saving soundEnabled:", err));
    }
  }, [soundEnabled, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_musicEnabled", musicEnabled.toString());
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.musicEnabled": musicEnabled,
      }).catch((err) => console.error("Error saving musicEnabled:", err));
    }
  }, [musicEnabled, user, isAuthLoading]);

  useEffect(() => {
    const audio = document.getElementById("bg-music") as HTMLAudioElement;

    const handleInteraction = () => {
      if (audio && musicEnabled) {
        audio.volume = 0.3;
        audio.play().catch((e) => console.log("Audio play failed:", e));
      }
      // Remove listeners after first interaction
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };

    if (audio) {
      if (musicEnabled) {
        audio.volume = 0.3; // Set a reasonable background volume
        audio.play().catch((e) => {
          console.log(
            "Audio play failed (autoplay blocked), waiting for interaction:",
            e,
          );
          document.addEventListener("click", handleInteraction);
          document.addEventListener("keydown", handleInteraction);
        });
      } else {
        audio.pause();
      }
    }

    return () => {
      document.removeEventListener("click", handleInteraction);
      document.removeEventListener("keydown", handleInteraction);
    };
  }, [musicEnabled]);

  useEffect(() => {
    localStorage.setItem("gomoku_selectedSkinId", selectedSkinId);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.selectedSkin": selectedSkinId,
      }).catch((err) => console.error("Error saving selectedSkin:", err));
    }
  }, [selectedSkinId, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_selectedCharacterId", selectedCharacterId);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.selectedCharacter": selectedCharacterId,
      }).catch((err) => console.error("Error saving selectedCharacter:", err));
    }
  }, [selectedCharacterId, user, isAuthLoading]);

  useEffect(() => {
    localStorage.setItem("gomoku_selectedRegion", selectedRegion);
    if (user && !isAuthLoading) {
      updateDoc(doc(db, "users", user.uid), {
        "settings.selectedRegion": selectedRegion,
      }).catch((err) => console.error("Error saving selectedRegion:", err));
    }
  }, [selectedRegion, user, isAuthLoading]);

  const [board, setBoard] = useState<BoardState>(createEmptyBoard(boardSize));
  const [currentPlayer, setCurrentPlayer] = useState<Player>("black");
  const [winner, setWinner] = useState<Player | "draw" | null>(null);
  const [winningLine, setWinningLine] = useState<[number, number][] | null>(
    null,
  );
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(
    null,
  );
  const [keyboardCursor, setKeyboardCursor] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [coachAdvice, setCoachAdvice] = useState<{
    row: number;
    col: number;
    explanation: string;
  } | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);
  const [ambientColor, setAmbientColor] = useState<string>("#000000");
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
      if (ambientBtnTimeoutRef.current)
        clearTimeout(ambientBtnTimeoutRef.current);
    };
  }, [resetAmbientBtnTimeout]);

  const [showNewGameModal, setShowNewGameModal] = useState(false);
  const [showForfeitConfirm, setShowForfeitConfirm] = useState(false);
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [hasForfeited, setHasForfeited] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    const checkSavedGame = () => {
      setHasSavedGame(!!localStorage.getItem("gomoku_saved_game"));
    };
    checkSavedGame();
    // Also check when screen changes to home
    if (currentScreen === "home") {
      checkSavedGame();
    }
  }, [currentScreen]);

  useEffect(() => {
    if (currentScreen === "game" && !winner && gameMode !== "online") {
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
        ruleSet,
        renjuRules,
      };
      localStorage.setItem("gomoku_saved_game", JSON.stringify(gameState));
    } else if (winner || currentScreen === "home") {
      // If game is won, clear saved state
      if (winner) {
        localStorage.removeItem("gomoku_saved_game");
      }
    }
  }, [
    board,
    currentPlayer,
    moveHistory,
    winner,
    gameMode,
    boardSize,
    aiDifficulty,
    startingPlayer,
    timeLimit,
    selectedSkinId,
    selectedCharacterId,
    lastMove,
    ruleSet,
    currentScreen,
  ]);

  const resumeGame = () => {
    const saved = localStorage.getItem("gomoku_saved_game");
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
        if (state.renjuRules) setRenjuRules(state.renjuRules);

        setWinner(null);
        setWinningLine(null);
        setCoachAdvice(null);
        setThreats(findThreats(state.board, state.currentPlayer));
        setHasForfeited(false);
        setOnlineOpponentLeft(false);
        setEndReason(null);
        setEloChange(null);
        setTimeLeft(state.timeLimit || 30);

        setCurrentScreen("game");
      } catch (e) {
        console.error("Error parsing saved game:", e);
        localStorage.removeItem("gomoku_saved_game");
        setHasSavedGame(false);
      }
    }
  };

  const calculateEloChange = (
    pElo: number,
    oElo: number,
    result: "win" | "loss" | "draw",
  ) => {
    const K = pElo > 2000 ? 16 : 32;
    const expectedScore = 1 / (1 + Math.pow(10, (oElo - pElo) / 400));
    let actualScore = 0.5;
    if (result === "win") actualScore = 1;
    if (result === "loss") actualScore = 0;

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
        player2Uid:
          record.gameMode === "online"
            ? opponentUserIdRef.current || "Unknown"
            : "AI",
        winnerUid:
          record.result === "draw"
            ? "draw"
            : record.result === "win"
              ? user.uid
              : record.gameMode === "online"
                ? opponentUserIdRef.current || "Opponent"
                : "AI",
        gameMode: record.gameMode,
        moves: record.moves,
        boardSize: record.boardSize,
        player1EloBefore: record.playerEloBefore,
        player1EloAfter: record.playerEloAfter,
        player2EloBefore: record.opponentElo,
        player2EloAfter: record.opponentElo,
        selectedSkin: record.selectedSkin,
        selectedCharacter: record.selectedCharacter,
      };

      await addDoc(collection(db, "matches"), matchData);

      // Update user profile with stats
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const currentData = userDoc.data() as UserProfile;

      const oldStats = currentData.stats || {
        wins: 0,
        losses: 0,
        draws: 0,
        winStreak: 0,
        maxWinStreak: 0,
        totalMoves: 0,
        totalGames: 0,
      };

      const isWin = record.result === "win";
      const isLoss = record.result === "loss";
      const isDraw = record.result === "draw";

      const newWinStreak = isWin ? oldStats.winStreak + 1 : 0;

      const newStats = {
        wins: oldStats.wins + (isWin ? 1 : 0),
        losses: oldStats.losses + (isLoss ? 1 : 0),
        draws: oldStats.draws + (isDraw ? 1 : 0),
        winStreak: newWinStreak,
        maxWinStreak: Math.max(oldStats.maxWinStreak, newWinStreak),
        totalMoves: oldStats.totalMoves + record.moves.length,
        totalGames: oldStats.totalGames + 1,
      };

      // Zen Coins & Achievements
      const coinsEarned = isWin ? 20 : isDraw ? 10 : 5;
      const currentCoins = currentData.zenCoins || 0;
      const newZenCoins = currentCoins + coinsEarned;

      const currentAchievements = currentData.achievements || [];
      const newAchievements: { id: string; unlockedAt: number }[] = [];

      // Check Achievements
      const hasReq = (id: string) =>
        currentAchievements.some((a) => a.id === id);

      if (isWin && !hasReq("first_win")) {
        newAchievements.push({ id: "first_win", unlockedAt: Date.now() });
        toast.success("🏆 Achievement Unlocked: First Blood!");
      }
      if (isWin && record.moves.length <= 15 && !hasReq("sniper")) {
        newAchievements.push({ id: "sniper", unlockedAt: Date.now() });
        toast.success("🎯 Achievement Unlocked: The Sniper!");
      }
      if (record.playerEloAfter >= 1500 && !hasReq("untouchable")) {
        newAchievements.push({ id: "untouchable", unlockedAt: Date.now() });
        toast.success("👑 Achievement Unlocked: Untouchable!");
      }
      if (newStats.totalGames === 100 && !hasReq("veteran")) {
        newAchievements.push({ id: "veteran", unlockedAt: Date.now() });
        toast.success("⚔️ Achievement Unlocked: Veteran!");
      }

      const mergedAchievements = [...currentAchievements, ...newAchievements];

      await updateDoc(userDocRef, {
        elo: record.playerEloAfter,
        rank: getRankTier(record.playerEloAfter).name,
        lastPlayed: serverTimestamp(),
        stats: newStats,
        zenCoins: newZenCoins,
        achievements: mergedAchievements,
      });

      setPlayerElo(record.playerEloAfter);
      setUserProfile((prev) =>
        prev
          ? {
              ...prev,
              elo: record.playerEloAfter,
              stats: newStats,
              zenCoins: newZenCoins,
              achievements: mergedAchievements,
            }
          : null,
      );

      if (coinsEarned > 0) {
        toast(`You earned ${coinsEarned} Zen Coins!`);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "matches");
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
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const data = userDoc.data();
          setPlayerElo(data.elo || 1200);

          // Load settings from Firebase if they exist
          if (data.settings) {
            if (data.settings.uiStyle) setUiStyle(data.settings.uiStyle);
            if (data.settings.boardSize) setBoardSize(data.settings.boardSize);
            if (data.settings.ruleSet) setRuleSet(data.settings.ruleSet);
            if (data.settings.startingPlayer)
              setStartingPlayer(data.settings.startingPlayer);
            if (data.settings.aiDifficulty)
              setAiDifficulty(data.settings.aiDifficulty);
            if (data.settings.soundEnabled !== undefined)
              setSoundEnabled(data.settings.soundEnabled);
            if (data.settings.musicEnabled !== undefined)
              setMusicEnabled(data.settings.musicEnabled);
            if (data.settings.selectedSkin)
              setSelectedSkinId(data.settings.selectedSkin as SkinId);
            if (data.settings.selectedCharacter)
              setSelectedCharacterId(data.settings.selectedCharacter);
            if (data.settings.selectedRegion)
              setSelectedRegion(data.settings.selectedRegion);

            setUserProfile({
              uid: firebaseUser.uid,
              displayName:
                data.displayName || firebaseUser.displayName || "Player",
              avatarUrl:
                data.photoURL ||
                firebaseUser.photoURL ||
                `https://api.dicebear.com/9.x/lorelei/svg?seed=${firebaseUser.uid}`,
              bio: data.bio || "",
              elo: data.elo || 1200,
              customCharacters: data.customCharacters || [],
              customSkins: data.customSkins || [],
              selectedCharacterId:
                data.settings.selectedCharacter || "master_lin",
              selectedSkinId:
                (data.settings.selectedSkin as SkinId) || "classic",
              zenCoins: data.zenCoins || 0,
              unlockedSkins: data.unlockedSkins || ["classic"],
              unlockedCharacters: data.unlockedCharacters || ["master_lin"],
              unlockedSounds: data.unlockedSounds || ["default"],
              achievements: data.achievements || [],
              selectedSound: data.settings.selectedSound || "default",
              stats: data.stats,
            });
          }
        } else {
          // Initialize new user
          const initialProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || "Player",
            avatarUrl:
              firebaseUser.photoURL ||
              `https://api.dicebear.com/9.x/lorelei/svg?seed=${firebaseUser.uid}`,
            bio: "",
            elo: 1200,
            customCharacters: [],
            customSkins: [],
            selectedCharacterId: "master_lin",
            selectedSkinId: "classic",
            zenCoins: 100, // Starting bonus
            unlockedSkins: ["classic"],
            unlockedCharacters: ["master_lin"],
            unlockedSounds: ["default"],
            achievements: [],
            selectedSound: "default",
            stats: {
              wins: 0,
              losses: 0,
              draws: 0,
              winStreak: 0,
              maxWinStreak: 0,
              totalMoves: 0,
              totalGames: 0,
            },
          };

          await setDoc(userDocRef, {
            ...initialProfile,
            rank: "Beginner",
            lastPlayed: serverTimestamp(),
            settings: {
              boardSize,
              ruleSet,
              startingPlayer,
              aiDifficulty,
              soundEnabled,
              musicEnabled,
              selectedSkin: selectedSkinId,
              selectedCharacter: selectedCharacterId,
              selectedRegion,
            },
          });
          setUserProfile(initialProfile);
          setPlayerElo(1200);
        }

        // Sync Match History
        const matchesQuery = query(
          collection(db, "matches"),
          where("player1Uid", "==", firebaseUser.uid),
          orderBy("date", "desc"),
          limit(50),
        );

        const unsubscribeMatches = onSnapshot(
          matchesQuery,
          (snapshot) => {
            const history: MatchRecord[] = snapshot.docs.map((doc) => {
              const data = doc.data();
              return {
                ...data,
                date: data.date
                  ? (data.date as Timestamp).toMillis()
                  : Date.now(),
                // Map Firestore fields back to MatchRecord interface if needed
                opponent:
                  data.player2Uid === "AI"
                    ? "AI"
                    : data.player2Uid === firebaseUser.uid
                      ? data.player1Uid
                      : data.player2Uid,
                result:
                  data.winnerUid === "draw"
                    ? "draw"
                    : data.winnerUid === firebaseUser.uid
                      ? "win"
                      : "loss",
                winner:
                  data.winnerUid === "draw"
                    ? "draw"
                    : data.winnerUid === firebaseUser.uid
                      ? onlinePlayerColorRef.current || "black"
                      : onlinePlayerColorRef.current === "black"
                        ? "white"
                        : "black",
              } as MatchRecord;
            });
            setMatchHistory(history);
          },
          (error) => {
            handleFirestoreError(error, OperationType.LIST, "matches");
          },
        );

        return () => unsubscribeMatches();
      } else {
        // Reset to local defaults if logged out
        setUserId("");
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
    if (currentScreen === "stats") {
      const q = query(
        collection(db, "users"),
        orderBy("elo", "desc"),
        limit(10),
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const topPlayers = snapshot.docs.map(
            (doc) => doc.data() as UserProfile,
          );
          setLeaderboard(topPlayers);
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, "users");
        },
      );
      return () => unsubscribe();
    }
  }, [currentScreen]);

  const handleCreateCustomCharacter = async () => {
    if (!user) {
      toast.error("You must be logged in to create a character");
      return;
    }
    if (!newCharName || !newCharAvatar) {
      toast.error("Please enter a name and avatar URL");
      return;
    }

    const newChar: Character = {
      id: `custom_${Date.now()}`,
      name: newCharName,
      avatar: newCharAvatar,
      bio: newCharBio,
      defaultSkin: "classic",
      isCustom: true,
    };

    const updatedProfile = {
      ...userProfile!,
      customCharacters: [...(userProfile?.customCharacters || []), newChar],
      zenCoins: (userProfile?.zenCoins || 0) - 500,
    };

    try {
      await updateDoc(doc(db, "users", user.uid), {
        customCharacters: updatedProfile.customCharacters,
        zenCoins: updatedProfile.zenCoins,
      });
      setUserProfile(updatedProfile);
      setNewCharName("");
      setNewCharAvatar("");
      setNewCharBio("");
      setIsCreatingChar(false);
      toast.success("Character created successfully!");
    } catch (error) {
      console.error("Error creating custom character:", error);
      toast.error("Failed to create character");
    }
  };

  const handleDeleteCustomSkin = async (skinId: string) => {
    if (user && userProfile) {
      const updatedSkins = (userProfile.customSkins || []).filter(
        (s) => s.id !== skinId,
      );
      const updatedProfile = { ...userProfile, customSkins: updatedSkins };

      try {
        await updateDoc(doc(db, "users", user.uid), {
          customSkins: updatedSkins,
        });
        setUserProfile(updatedProfile);
        if (selectedSkinId === skinId) setSelectedSkinId(SKINS[0].id);
        toast.success("Theme deleted");
      } catch (error) {
        console.error("Error deleting skin:", error);
        toast.error("Failed to delete theme");
      }
    } else {
      const updatedSkins = localCustomSkins.filter((s) => s.id !== skinId);
      setLocalCustomSkins(updatedSkins);
      localStorage.setItem("gomoku_customSkins", JSON.stringify(updatedSkins));
      if (selectedSkinId === skinId) setSelectedSkinId(SKINS[0].id);
      toast.success("Theme deleted");
    }
  };

  const handleCreateCustomSkin = async (newSkin: Skin) => {
    if (user && userProfile) {
      const updatedProfile = {
        ...userProfile,
        customSkins: [...(userProfile.customSkins || []), newSkin],
        zenCoins: (userProfile.zenCoins || 0) - 500,
      };

      try {
        await updateDoc(doc(db, "users", user.uid), {
          customSkins: updatedProfile.customSkins,
          zenCoins: updatedProfile.zenCoins,
        });
        setUserProfile(updatedProfile);
        setIsCreatingSkin(false);
        toast.success("Custom theme saved!");
      } catch (error) {
        console.error("Error creating custom skin:", error);
        toast.error("Failed to save theme");
      }
    } else {
      const updatedSkins = [...localCustomSkins, newSkin];
      setLocalCustomSkins(updatedSkins);
      localStorage.setItem("gomoku_customSkins", JSON.stringify(updatedSkins));
      setIsCreatingSkin(false);
      toast.success("Custom theme saved locally!");
    }
  };
  const nextAmbientColor = () => {
    const currentIndex = AMBIENT_COLORS.findIndex(
      (c) => c.value === ambientColor,
    );
    const nextIndex = (currentIndex + 1) % AMBIENT_COLORS.length;
    setAmbientColor(AMBIENT_COLORS[nextIndex].value);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Pick a random color from AMBIENT_COLORS, excluding 'transparent' (the first element)
      // to ensure the border is always visible.
      const randomIndex =
        Math.floor(Math.random() * (AMBIENT_COLORS.length - 1)) + 1;
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

    const onMatchFound = (data: {
      roomId: string;
      players: { black: string; white: string };
      playerData?: {
        black: { elo: number; userId?: string };
        white: { elo: number; userId?: string };
      };
      boardSize: number;
      timeLimit?: number;
    }) => {
      setIsSearchingMatch(false);
      setSearchStartTime(null);
      setPrivateRoomCode("");
      setJoinRoomInput("");
      setChatMessages([]);
      setShowChat(true);
      setOnlineRoomId(data.roomId);
      const isBlack = data.players.black === socket.id;
      setOnlinePlayerColor(isBlack ? "black" : "white");
      setBoardSize(data.boardSize as BoardSize);
      if (data.timeLimit !== undefined) {
        setTimeLimitSetting(data.timeLimit as TimeLimit);
      }

      if (data.playerData) {
        setOpponentElo(
          isBlack ? data.playerData.white.elo : data.playerData.black.elo,
        );
        setOpponentUserId(
          isBlack
            ? data.playerData.white.userId || null
            : data.playerData.black.userId || null,
        );
      } else {
        setOpponentElo(null);
        setOpponentUserId(null);
      }

      setGameMode("online");
      resetGame();
      setCurrentScreen("game");
    };

    const onPrivateRoomCreated = (data: { roomId: string }) => {
      setPrivateRoomCode(data.roomId);
    };

    const onMoveMade = (data: {
      row: number;
      col: number;
      player: Player;
      nextPlayer: Player;
      winner: Player | "draw" | null;
      winningLine?: [number, number][] | null;
      newElo?: { black: number; white: number };
    }) => {
      setBoard((prev) => {
        const newBoard = prev.map((r) => [...r]);
        newBoard[data.row][data.col] = data.player;
        if (!data.winner) {
          setThreats(findThreats(newBoard, data.nextPlayer));
        } else {
          setThreats([]);
        }
        return newBoard;
      });
      playSound("move");

      let updatedHistory: { row: number; col: number; player: Player }[] = [];
      setMoveHistory((prev) => {
        updatedHistory = [
          ...prev,
          { row: data.row, col: data.col, player: data.player },
        ];
        moveHistoryRef.current = updatedHistory; // Manually update ref to avoid stale data
        return updatedHistory;
      });

      setLastMove({ row: data.row, col: data.col });
      setCurrentPlayer(data.nextPlayer);
      if (data.winner) {
        setWinner(data.winner);
        if (data.winner === "draw") {
          playSound("draw");
        } else {
          playSound(
            data.winner === onlinePlayerColorRef.current ? "win" : "lose",
          );
        }
        if (data.winningLine) setWinningLine(data.winningLine);

        if (data.newElo) {
          const isBlack = onlinePlayerColorRef.current === "black";
          const newPlayerElo = isBlack ? data.newElo.black : data.newElo.white;
          const newOpponentElo = isBlack
            ? data.newElo.white
            : data.newElo.black;

          const oldPlayerElo = playerEloRef.current;
          const diff = newPlayerElo - oldPlayerElo;
          setEloChange(diff);
          setPlayerElo(newPlayerElo);
          setOpponentElo(newOpponentElo);

          // Save to history
          const record: MatchRecord = {
            id: Math.random().toString(36).substring(2, 9),
            date: Date.now(),
            opponent: opponentUserIdRef.current || "Unknown",
            opponentElo: newOpponentElo,
            playerEloBefore: oldPlayerElo,
            playerEloAfter: newPlayerElo,
            result:
              data.winner === "draw"
                ? "draw"
                : data.winner === onlinePlayerColorRef.current
                  ? "win"
                  : "loss",
            moves: updatedHistory,
            boardSize: boardSizeRef.current,
            gameMode: "online",
            winner: data.winner,
            selectedSkin: selectedSkinId,
            selectedCharacter: selectedCharacterId,
          };

          saveMatchToFirestore(record);
        }
      }
    };

    const onOpponentLeft = (data: {
      winner: Player;
      reason?: string;
      newElo?: { black: number; white: number };
    }) => {
      setOnlineOpponentLeft(true);
      setEndReason(data.reason || null);
      setWinner(data.winner);
      setThreats([]);
      playSound("win");

      if (data.newElo) {
        const isBlack = onlinePlayerColorRef.current === "black";
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
          opponent: opponentUserIdRef.current || "Unknown",
          opponentElo: newOpponentElo,
          playerEloBefore: oldPlayerElo,
          playerEloAfter: newPlayerElo,
          result: data.winner === onlinePlayerColorRef.current ? "win" : "loss",
          moves: [...moveHistoryRef.current],
          boardSize: boardSizeRef.current,
          gameMode: "online",
          winner: data.winner,
          selectedSkin: selectedSkinId,
          selectedCharacter: selectedCharacterId,
        };

        saveMatchToFirestore(record);
      }
    };

    const onMatchForfeited = (data: {
      winner: Player;
      forfeitedBy: string;
      newElo?: { black: number; white: number };
    }) => {
      setWinner(data.winner);
      setThreats([]);
      if (data.forfeitedBy === getSocket().id) {
        setHasForfeited(true);
      } else {
        setEndReason("opponent_forfeited");
      }
      playSound("win");

      if (data.newElo) {
        const isBlack = onlinePlayerColorRef.current === "black";
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
          opponent: opponentUserIdRef.current || "Unknown",
          opponentElo: newOpponentElo,
          playerEloBefore: oldPlayerElo,
          playerEloAfter: newPlayerElo,
          result: data.winner === onlinePlayerColorRef.current ? "win" : "loss",
          moves: [...moveHistoryRef.current],
          boardSize: boardSizeRef.current,
          gameMode: "online",
          winner: data.winner,
          selectedSkin: selectedSkinId,
          selectedCharacter: selectedCharacterId,
        };

        saveMatchToFirestore(record);
      }
    };

    const onReceiveMessage = (data: {
      sender: string;
      text: string;
      timestamp: number;
      achievements?: string[];
    }) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          sender: data.sender,
          text: data.text,
          timestamp: data.timestamp,
          isMe: false,
          achievements: data.achievements,
        },
      ]);
    };

    const onError = (data: { message: string }) => {
      toast.error(data.message);
      setIsSearchingMatch(false);
      setSearchStartTime(null);
      setCurrentScreen("online");
    };

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    setIsConnected(socket.connected);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("matchFound", onMatchFound);
    socket.on("privateRoomCreated", onPrivateRoomCreated);
    socket.on("moveMade", onMoveMade);
    socket.on("opponentLeft", onOpponentLeft);
    socket.on("matchForfeited", onMatchForfeited);
    socket.on("receiveMessage", onReceiveMessage);
    socket.on("error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("matchFound", onMatchFound);
      socket.off("privateRoomCreated", onPrivateRoomCreated);
      socket.off("moveMade", onMoveMade);
      socket.off("opponentLeft", onOpponentLeft);
      socket.off("matchForfeited", onMatchForfeited);
      socket.off("receiveMessage", onReceiveMessage);
      socket.off("error", onError);
    };
  }, []);

  useEffect(() => {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer("black");
    setWinner(null);
    setWinningLine(null);
    setLastMove(null);
    setCoachAdvice(null);
  }, [boardSize, ruleSet, startingPlayer]);

  useEffect(() => {
    const isAiTurn =
      gameMode === "pve" &&
      ((startingPlayer === "human" && currentPlayer === "white") ||
        (startingPlayer === "ai" && currentPlayer === "black"));

    if (isAiTurn && !winner) {
      const timer = setTimeout(() => {
        const move = getBestMove(
          board,
          currentPlayer as Player,
          aiDifficulty,
          ruleSet === "renju",
          renjuRules,
        );
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
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto-lose on timeout
          if (gameMode === "pve" || gameMode === "pvp") {
            setWinner(currentPlayer === "black" ? "white" : "black");
            setThreats([]);
            playSound(gameMode === "pve" ? "lose" : "win");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [
    currentPlayer,
    gameMode,
    winner,
    onlinePlayerColor,
    timeLimit,
    startingPlayer,
    onlineOpponentLeft,
  ]);

  useEffect(() => {
    if (winner && winner !== "draw") {
      const duration = 4 * 1000;
      const animationEnd = Date.now() + duration;
      const isBlack = winner === "black";
      const colors = isBlack
        ? ["#18181b", "#3f3f46", "#71717a", "#D4AF37", "#FFDF00"]
        : ["#ffffff", "#f4f4f5", "#e4e4e7", "#D4AF37", "#FFDF00"];

      const defaults = {
        startVelocity: 25,
        spread: 360,
        ticks: 150,
        zIndex: 100,
        shapes: ["circle"] as confetti.Shape[],
        colors: colors,
        scalar: 0.8,
        gravity: 0.6,
        disableForReducedMotion: true,
      };

      const randomInRange = (min: number, max: number) =>
        Math.random() * (max - min) + min;

      // Initial big burst
      confetti({
        ...defaults,
        particleCount: 120,
        spread: 120,
        origin: { y: 0.6, x: 0.5 },
      });

      const interval: any = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 25 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.9), y: Math.random() - 0.2 },
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
    if (currentScreen === "game") {
      setKeyboardCursor({
        row: Math.floor(boardSize / 2),
        col: Math.floor(boardSize / 2),
      });
    }
  }, [currentScreen, boardSize]);

  // Handle keyboard navigation inside the game screen
  useEffect(() => {
    if (
      currentScreen !== "game" ||
      winner ||
      onlineOpponentLeft ||
      hasForfeited
    )
      return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Allow default behavior for typical inputs if they have focus (like chat)
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "TEXTAREA"
      )
        return;

      if (
        ![
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "Enter",
          " ",
        ].includes(e.key)
      )
        return;
      e.preventDefault();

      setKeyboardCursor((prev) => {
        let { row, col } = prev || {
          row: Math.floor(boardSize / 2),
          col: Math.floor(boardSize / 2),
        };

        if (e.key === "ArrowUp") row = Math.max(0, row - 1);
        else if (e.key === "ArrowDown") row = Math.min(boardSize - 1, row + 1);
        else if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
        else if (e.key === "ArrowRight") col = Math.min(boardSize - 1, col + 1);
        else if (e.key === "Enter" || e.key === " ") {
          // Trigger the move! Note: state updates in handleCellClick expect latest state,
          // but we will call handleCellClick directly with row, col
          setTimeout(() => {
            if (handleCellClickRef.current)
              handleCellClickRef.current(row, col);
          }, 0);
        } else if (e.key === "c" || e.key === "C") {
          // Additional shortcut: jump to coach advice if it exists
          if (coachAdvice) {
            row = coachAdvice.row;
            col = coachAdvice.col;
          }
        }

        return { row, col };
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentScreen,
    winner,
    onlineOpponentLeft,
    hasForfeited,
    boardSize,
    coachAdvice,
  ]); // Depend on coachAdvice to allow jumping to it

  // Use a ref to access the latest handleCellClick safely from the effect
  const handleCellClickRef =
    useRef<(r: number, c: number, ai?: boolean) => void>();

  useEffect(() => {
    handleCellClickRef.current = handleCellClick;
  });

  const handleCellClick = (
    row: number,
    col: number,
    isAiMove: boolean = false,
  ) => {
    if (board[row][col] || winner || onlineOpponentLeft) return;

    if (gameMode === "online") {
      if (currentPlayer !== onlinePlayerColor) return;
      const socket = getSocket();
      socket.emit("makeMove", { roomId: onlineRoomId, row, col });
      setKeyboardCursor({ row, col }); // Also snap cursor
      return;
    }

    const isAiTurn =
      gameMode === "pve" &&
      ((startingPlayer === "human" && currentPlayer === "white") ||
        (startingPlayer === "ai" && currentPlayer === "black"));

    if (isAiTurn && !isAiMove) return; // Prevent human from playing for AI

    setCoachAdvice(null); // Clear coach advice on move
    setForbiddenReason(null);

    if (ruleSet === "renju" && currentPlayer === "black") {
      const reason = getForbiddenMoveReason(
        board,
        row,
        col,
        currentPlayer,
        renjuRules,
      );
      if (reason) {
        setForbiddenReason(reason);
        setTimeout(() => setForbiddenReason(null), 3000);
        return; // Forbidden move
      }
    }

    const newBoard = board.map((r) => [...r]);
    newBoard[row][col] = currentPlayer;
    setBoard(newBoard);
    playSound("move");
    setMoveHistory((prev) => [...prev, { row, col, player: currentPlayer }]);
    setLastMove({ row, col });

    // Snap keyboard cursor to the most recently played move
    setKeyboardCursor({ row, col });

    const winLine = checkWin(
      newBoard,
      row,
      col,
      currentPlayer,
      ruleSet === "renju",
      renjuRules.overline,
    );
    if (winLine) {
      setWinner(currentPlayer);

      const isHuman =
        gameMode === "pve"
          ? (startingPlayer === "human" && currentPlayer === "black") ||
            (startingPlayer === "ai" && currentPlayer === "white")
          : true;
      playSound(isHuman ? "win" : "lose");
      setWinningLine(winLine);
      setThreats([]);

      // Save local match to history
      const calculateAiElo = (diff: Difficulty) => {
        switch (diff) {
          case "Beginner":
            return 600;
          case "Intermediate":
            return 1000;
          case "Advanced":
            return 1400;
          case "Expert":
            return 1800;
          case "Master":
            return 2200;
          case "Grandmaster":
            return 2600;
          default:
            return 1200;
        }
      };
      const opponentElo = gameMode === "pve" ? calculateAiElo(aiDifficulty) : 0;
      const result =
        gameMode === "pve"
          ? isHuman
            ? "win"
            : "loss"
          : currentPlayer === "black"
            ? "win"
            : "loss";
      const eloChange =
        gameMode === "pve"
          ? calculateEloChange(playerElo, opponentElo, result)
          : 0;
      const newElo = playerElo + eloChange;

      const record: MatchRecord = {
        id: Math.random().toString(36).substring(2, 9),
        date: Date.now(),
        opponent: gameMode === "pve" ? `AI (${aiDifficulty})` : "Local Player",
        opponentElo: opponentElo,
        playerEloBefore: playerElo,
        playerEloAfter: newElo,
        result: result,
        moves: [...moveHistory, { row, col, player: currentPlayer }],
        boardSize: boardSize,
        gameMode: gameMode,
        winner: currentPlayer,
        selectedSkin: selectedSkinId,
        selectedCharacter: selectedCharacterId,
      };
      setEloChange(eloChange);
      saveMatchToFirestore(record);
    } else if (isBoardFull(newBoard)) {
      setWinner("draw");
      playSound("draw");
      setThreats([]);
      // Save draw to history
      const calculateAiElo = (diff: Difficulty) => {
        switch (diff) {
          case "Beginner":
            return 600;
          case "Intermediate":
            return 1000;
          case "Advanced":
            return 1400;
          case "Expert":
            return 1800;
          case "Master":
            return 2200;
          case "Grandmaster":
            return 2600;
          default:
            return 1200;
        }
      };
      const opponentElo = gameMode === "pve" ? calculateAiElo(aiDifficulty) : 0;
      const eloChange =
        gameMode === "pve"
          ? calculateEloChange(playerElo, opponentElo, "draw")
          : 0;
      const newElo = playerElo + eloChange;

      const record: MatchRecord = {
        id: Math.random().toString(36).substring(2, 9),
        date: Date.now(),
        opponent: gameMode === "pve" ? `AI (${aiDifficulty})` : "Local Player",
        opponentElo: opponentElo,
        playerEloBefore: playerElo,
        playerEloAfter: newElo,
        result: "draw",
        moves: [...moveHistory, { row, col, player: currentPlayer }],
        boardSize: boardSize,
        gameMode: gameMode,
        winner: "draw",
        selectedSkin: selectedSkinId,
        selectedCharacter: selectedCharacterId,
      };
      setEloChange(eloChange);
      saveMatchToFirestore(record);
    } else {
      const nextPlayer = currentPlayer === "black" ? "white" : "black";
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
      timestamp: Date.now(),
      senderName: user?.displayName || "Opponent",
      achievements: userProfile?.achievements?.map((a) => a.id) || [],
    };

    getSocket().emit("sendMessage", messageData);

    setChatMessages((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        sender: user?.displayName || "Me",
        text: chatInput.trim(),
        timestamp: Date.now(),
        isMe: true,
        achievements: userProfile?.achievements?.map((a) => a.id) || [],
      },
    ]);

    setChatInput("");
  };

  const resetGame = () => {
    setBoard(createEmptyBoard(boardSize));
    setCurrentPlayer("black");
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

    if (
      !window.confirm(
        "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et toutes vos données (ELO, historique, thèmes personnalisés) seront définitivement supprimées.",
      )
    ) {
      return;
    }

    try {
      // 1. Delete user document from Firestore
      await deleteDoc(doc(db, "users", user.uid));

      // 2. Delete match history (optional, but good for GDPR)
      const matchesQuery = query(
        collection(db, "matches"),
        where("player1Uid", "==", user.uid),
      );
      const matchesSnapshot = await getDocs(matchesQuery);
      const deletePromises = matchesSnapshot.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);

      // 3. Sign out
      await logout();

      toast.success("Votre compte a été supprimé avec succès.");
      setCurrentScreen("home");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "users");
      toast.error("Une erreur est survenue lors de la suppression du compte.");
    }
  };

  const handleUndo = () => {
    if (gameMode === "online" || winner || moveHistory.length === 0) return;

    setCoachAdvice(null);

    if (gameMode === "pvp") {
      const lastMove = moveHistory[moveHistory.length - 1];
      const newBoard = board.map((r) => [...r]);
      newBoard[lastMove.row][lastMove.col] = null;
      setBoard(newBoard);
      setCurrentPlayer(lastMove.player);
      setThreats(findThreats(newBoard, lastMove.player));
      setMoveHistory((prev) => prev.slice(0, -1));

      const prevMove =
        moveHistory.length > 1 ? moveHistory[moveHistory.length - 2] : null;
      setLastMove(prevMove ? { row: prevMove.row, col: prevMove.col } : null);
      setTimeLeft(timeLimit);
    } else if (gameMode === "pve") {
      const isLastMoveAi =
        (startingPlayer === "human" &&
          moveHistory[moveHistory.length - 1].player === "white") ||
        (startingPlayer === "ai" &&
          moveHistory[moveHistory.length - 1].player === "black");

      const movesToUndo = isLastMoveAi && moveHistory.length >= 2 ? 2 : 1;

      const newBoard = board.map((r) => [...r]);
      for (let i = 0; i < movesToUndo; i++) {
        const move = moveHistory[moveHistory.length - 1 - i];
        newBoard[move.row][move.col] = null;
      }
      setBoard(newBoard);

      const nextPlayer = moveHistory[moveHistory.length - movesToUndo].player;
      setCurrentPlayer(nextPlayer);
      setThreats(findThreats(newBoard, nextPlayer));
      setMoveHistory((prev) => prev.slice(0, -movesToUndo));

      const prevMove =
        moveHistory.length > movesToUndo
          ? moveHistory[moveHistory.length - movesToUndo - 1]
          : null;
      setLastMove(prevMove ? { row: prevMove.row, col: prevMove.col } : null);
      setTimeLeft(timeLimit);
    }
  };

  const leaveOnlineMatch = () => {
    if (gameMode === "online" && onlineRoomId) {
      getSocket().emit("leaveMatch", { roomId: onlineRoomId });
    }
    setOnlineRoomId(null);
    setOnlinePlayerColor(null);
    setOnlineOpponentLeft(false);
    setEndReason(null);
    setShowMusicModal(false);
    setCurrentScreen("home");
  };

  const forfeitMatch = () => {
    if (gameMode === "online" && onlineRoomId) {
      getSocket().emit("forfeitMatch", { roomId: onlineRoomId });
    } else {
      setWinner(currentPlayer === "black" ? "white" : "black");
      setThreats([]);
      setHasForfeited(true);
      playSound(gameMode === "pve" ? "lose" : "win");
    }
    setShowForfeitConfirm(false);
  };

  const updateAvatar = async (url: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, "users", user.uid), {
        avatarUrl: url,
      });
      setUserProfile((prev) => (prev ? { ...prev, avatarUrl: url } : null));
      setIsEditingAvatar(false);
      toast.success("Avatar updated!");
    } catch (e) {
      toast.error("Failed to update avatar");
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        // 1MB max
        toast.error("Image too large. Please select an image under 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.8);

          updateAvatar(dataUrl);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBuyItem = async (
    type: "skin" | "sound" | "character",
    itemId: string,
    price: number,
  ) => {
    if (!user || (!userProfile && !!user)) return;
    if (userProfile!.zenCoins < price) {
      toast.error("Not enough Zen Coins!");
      return;
    }

    try {
      const newZenCoins = userProfile!.zenCoins - price;

      let updateData: any = { zenCoins: newZenCoins };
      if (type === "skin") {
        const newUnlocks = [...(userProfile!.unlockedSkins || []), itemId];
        updateData.unlockedSkins = newUnlocks;
        setUserProfile({
          ...userProfile!,
          zenCoins: newZenCoins,
          unlockedSkins: newUnlocks,
        });
      } else if (type === "sound") {
        const newUnlocks = [...(userProfile!.unlockedSounds || []), itemId];
        updateData.unlockedSounds = newUnlocks;
        setUserProfile({
          ...userProfile!,
          zenCoins: newZenCoins,
          unlockedSounds: newUnlocks,
        });
      } else if (type === "character") {
        const newUnlocks = [...(userProfile!.unlockedCharacters || []), itemId];
        updateData.unlockedCharacters = newUnlocks;
        setUserProfile({
          ...userProfile!,
          zenCoins: newZenCoins,
          unlockedCharacters: newUnlocks,
        });
      }

      await updateDoc(doc(db, "users", user.uid), updateData);
      toast.success("Purchase successful!");
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during purchase.");
    }
  };

  const handleEquipItem = async (type: "skin" | "sound" | "character", itemId: string) => {
    if (!user || (!userProfile && !!user)) return;
    try {
      let updateData: any = {};
      if (type === "skin") {
        setSelectedSkinId(itemId);
        // Will be synced by useEffect
      } else if (type === "sound") {
        updateData["settings.selectedSound"] = itemId;
        setUserProfile({ ...userProfile!, selectedSound: itemId });
        await updateDoc(doc(db, "users", user.uid), updateData);
        // Also fire off a sample!
        playSound("move");
      } else if (type === "character") {
        updateData.selectedCharacterId = itemId;
        setUserProfile({ ...userProfile!, selectedCharacterId: itemId });
        await updateDoc(doc(db, "users", user.uid), updateData);
      }
      toast.success("Equipped!");
    } catch (e) {
      console.error(e);
      toast.error("An error occurred.");
    }
  };

  const startGame = (mode: GameMode) => {
    setGameMode(mode);
    resetGame();
    setCurrentScreen("game");
  };

  const handleGeolocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
          );
          const data = await response.json();

          if (data && data.address) {
            const city =
              data.address.city ||
              data.address.town ||
              data.address.village ||
              data.address.county;
            const country = data.address.country;
            const locationStr = [city, country].filter(Boolean).join(", ");
            setLocationName(locationStr);
            toast.success(`Location found: ${locationStr}`);

            // Try to map location to a region or keep auto
            setSelectedRegion("auto");
          } else {
            toast.error("Could not determine location name");
          }
        } catch (error) {
          console.error("Error fetching location name:", error);
          toast.error("Failed to get location details");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Failed to get your location. Please check permissions.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const startReplay = (match: MatchRecord) => {
    setReplayMatch(match);
    setReplayMoveIndex(0);
    setReplayBoard(createEmptyBoard(match.boardSize));
    setIsPlayingReplay(false);
    setAnalysisData(null);
    setCurrentScreen("replay");
  };

  const handleRunAnalysis = () => {
    if (!replayMatch) return;
    setIsAnalyzing(true);
    // Timeout to allow UI to show loading state
    setTimeout(() => {
      const result = analyzeGame(
        replayMatch.boardSize as number,
        replayMatch.moves,
      );
      setAnalysisData(result);
      setIsAnalyzing(false);
    }, 100);
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (
      isPlayingReplay &&
      replayMatch &&
      replayMoveIndex < replayMatch.moves.length
    ) {
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
    setReplayBoard((prev) => {
      const newBoard = prev.map((r) => [...r]);
      newBoard[move.row][move.col] = move.player;
      return newBoard;
    });
    setReplayMoveIndex((prev) => prev + 1);
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
    const isAiTurn =
      gameMode === "pve" &&
      ((startingPlayer === "human" && currentPlayer === "white") ||
        (startingPlayer === "ai" && currentPlayer === "black"));

    if (winner || isAiTurn) return;
    const advice = getCoachAdvice(
      board,
      currentPlayer,
      ruleSet === "renju",
      renjuRules,
    );
    setCoachAdvice(advice);
  };

  const handleLogin = async () => {
    if (isLoggingIn) return;
    setIsLoggingIn(true);
    try {
      await loginWithGoogle();
    } catch (error: any) {
      if (
        error.code === "auth/cancelled-popup-request" ||
        error.code === "auth/popup-closed-by-user"
      ) {
        // User cancelled or closed the popup, ignore
        console.log("Sign-in cancelled by user");
      } else {
        console.error("Login error:", error);
        toast.error("Échec de la connexion. Veuillez réessayer.");
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
          <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm">
            Connect to play and track your rank
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[3rem] shadow-2xl border border-zinc-100 max-w-sm w-full"
        >
          <div className="w-20 h-20 bg-zinc-900 rounded-full flex items-center justify-center text-white mb-8 mx-auto shadow-xl">
            <Globe size={40} />
          </div>
          <h2 className="text-2xl font-black mb-4 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-zinc-500 mb-8 font-medium">
            Sign in with Google to save your ELO, match history, and compete
            globally.
          </p>

          <button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className={`w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg hover:shadow-xl active:scale-95 ${isLoggingIn ? "opacity-70 cursor-not-allowed" : "hover:bg-zinc-800"}`}
          >
            {isLoggingIn ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Globe size={20} />
            )}
            {isLoggingIn ? "Connecting..." : "Sign in with Google"}
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-zinc-50 text-zinc-900 font-sans overflow-hidden relative"
      style={{
        boxShadow:
          ambientColor !== "transparent"
            ? `inset 0 0 0 4px ${ambientColor}`
            : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <AnimatePresence mode="wait">
        {currentScreen === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex flex-col items-center p-6 overflow-y-auto custom-scrollbar"
          >
            <div className="my-auto flex flex-col items-center w-full py-8">
              <div className="text-center mb-12 shrink-0">
                <h1 className="text-6xl font-black tracking-tighter mb-4">
                  GOMOKU
                </h1>
                <p className="text-zinc-500 font-medium tracking-wide uppercase text-sm mb-8">
                  The Classic Strategy Game
                </p>

                <motion.div
                  whileHover={{ scale: 1.05 }}
                  onClick={() => setCurrentScreen("stats")}
                  className="inline-flex flex-col items-center gap-3 bg-white p-6 rounded-[2.5rem] shadow-xl border border-zinc-100 cursor-pointer group transition-all hover:shadow-2xl"
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg group-hover:rotate-12 transition-transform"
                    style={{ backgroundColor: getRankTier(playerElo).color }}
                  >
                    <Trophy size={32} />
                  </div>
                  <div className="text-center">
                    <h3
                      className="text-xl font-black tracking-tighter uppercase"
                      style={{ color: getRankTier(playerElo).color }}
                    >
                      {getRankTier(playerElo).name}
                    </h3>
                    <p className="text-zinc-400 font-bold text-sm tracking-widest uppercase">
                      {playerElo} ELO
                    </p>
                  </div>
                </motion.div>
              </div>

              <div className="flex flex-col gap-4 w-full max-w-sm sm:max-w-md md:max-w-2xl px-4">
                {!showDifficultySelect ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    <button
                      onClick={() => setCurrentScreen("music")}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-all group sm:col-span-2 md:col-span-1"
                    >
                      <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center text-white group-hover:rotate-12 transition-transform">
                        <Music size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-sm">Music Player</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          Spotify • Deezer • YT
                        </p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        connectSocket();
                        setCurrentScreen("online");
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
                      onClick={() => startGame("pvp")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                    >
                      <User size={20} />
                      Pass & Play
                    </button>

                    <div className="col-span-1 sm:col-span-2 md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                      <button
                        onClick={() => setCurrentScreen("daily")}
                        className="flex items-center justify-center gap-3 bg-indigo-50 text-indigo-700 py-4 px-6 rounded-2xl font-semibold hover:bg-indigo-100 transition-colors border border-indigo-100 shadow-sm"
                      >
                        <Puzzle size={20} />
                        Daily Puzzles
                      </button>
                      <button
                        onClick={() => setCurrentScreen("openings")}
                        className="flex items-center justify-center gap-3 bg-amber-50 text-amber-700 py-4 px-6 rounded-2xl font-semibold hover:bg-amber-100 transition-colors border border-amber-100 shadow-sm"
                      >
                        <Compass size={20} />
                        Opening Explorer
                      </button>
                      <button
                        onClick={() => setCurrentScreen("shop")}
                        className="flex items-center justify-center gap-3 bg-rose-50 text-rose-700 py-4 px-6 rounded-2xl font-semibold hover:bg-rose-100 transition-colors border border-rose-100 shadow-sm sm:col-span-2 md:col-span-1"
                      >
                        <ShoppingCart size={20} />
                        Zen Shop
                      </button>
                    </div>

                    <button
                      onClick={() => setCurrentScreen("tutorial")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200 mt-2"
                    >
                      <BookOpen size={20} />
                      How to Play
                    </button>
                    <button
                      onClick={() => setCurrentScreen("stats")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                    >
                      <Trophy size={20} />
                      Stats & Replays
                    </button>
                    <button
                      onClick={() => setCurrentScreen("profile")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                    >
                      <UserCircle size={20} />
                      Profile
                    </button>
                    <button
                      onClick={() => setCurrentScreen("settings")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                    >
                      <Settings size={20} />
                      Settings
                    </button>
                    <button
                      onClick={() => setCurrentScreen("support")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                    >
                      <HelpCircle size={20} />
                      Support
                    </button>
                    <button
                      onClick={() => setCurrentScreen("privacy")}
                      className="flex items-center justify-center gap-3 bg-white text-zinc-900 py-4 px-6 rounded-2xl font-semibold hover:bg-zinc-50 transition-colors border border-zinc-200"
                    >
                      <ShieldCheck size={20} />
                      Privacy
                    </button>
                  </div>
                ) : showDifficultySelect ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="flex flex-col gap-3 bg-white p-6 rounded-[2.5rem] border border-zinc-200 shadow-2xl w-full"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-black tracking-tighter text-zinc-900">
                          Select Difficulty
                        </h3>
                        <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                          Choose your challenge
                        </p>
                      </div>
                      <button
                        onClick={() => setShowDifficultySelect(false)}
                        className="w-10 h-10 bg-zinc-100 flex items-center justify-center rounded-full hover:bg-zinc-200 transition-colors"
                      >
                        <X size={20} className="text-zinc-500" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {(
                        [
                          "Beginner",
                          "Intermediate",
                          "Advanced",
                          "Expert",
                          "Master",
                          "Grandmaster",
                        ] as Difficulty[]
                      ).map((diff) => {
                        const config = DIFFICULTY_CONFIG[diff];
                        const Icon = config.icon;
                        const isSelected = aiDifficulty === diff;

                        return (
                          <button
                            key={diff}
                            onClick={() => {
                              setAiDifficulty(diff);
                              setShowDifficultySelect(false);
                              startGame("pve");
                            }}
                            className={`group flex items-center gap-4 p-4 rounded-2xl text-left transition-all relative overflow-hidden ${
                              isSelected
                                ? "bg-zinc-900 text-white shadow-xl scale-[1.02]"
                                : "bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-transparent hover:border-zinc-200"
                            }`}
                          >
                            <div
                              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm shrink-0 transition-transform group-hover:scale-110 ${
                                isSelected
                                  ? "bg-white/20"
                                  : `${config.color} text-white`
                              }`}
                            >
                              <Icon size={24} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p
                                  className={`font-black text-lg tracking-tight uppercase ${isSelected ? "text-white" : "text-zinc-900"}`}
                                >
                                  {config.label}
                                </p>
                                {isSelected && (
                                  <motion.div
                                    layoutId="selected-check"
                                    className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center"
                                  >
                                    <Check
                                      size={14}
                                      className="text-white"
                                      strokeWidth={3}
                                    />
                                  </motion.div>
                                )}
                              </div>
                              <p
                                className={`text-xs font-medium truncate ${isSelected ? "text-white/60" : "text-zinc-400"}`}
                              >
                                {config.description}
                              </p>
                            </div>

                            {diff === "Grandmaster" && !isSelected && (
                              <div className="absolute top-2 right-2">
                                <Zap
                                  size={12}
                                  className="text-amber-400 animate-pulse"
                                />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : null}
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === "game" && (
          <motion.div
            key="game"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className={`absolute inset-0 flex flex-col p-4 md:p-8 overflow-y-auto custom-scrollbar transition-colors duration-500 ${
              uiStyle === "zen"
                ? "bg-[#f4f1ea] text-[#3d3a33]"
                : uiStyle === "pixel"
                  ? "bg-black text-lime-400 font-mono uppercase"
                  : uiStyle === "cyberpunk"
                    ? "bg-[#0f0a1e] text-cyan-400 shadow-[inset_0_0_100px_rgba(147,51,234,0.1)]"
                    : uiStyle === "monochrome"
                      ? "bg-white text-black font-serif"
                      : uiStyle === "retro"
                        ? "bg-[#fdf6e3] text-[#586e75] font-serif"
                        : uiStyle === "midnight"
                          ? "bg-[#020617] text-slate-100"
                          : uiStyle === "nature"
                            ? "bg-[#f0f9ff] text-emerald-900"
                            : uiStyle === "terminal"
                              ? "bg-black text-green-500 font-mono"
                              : uiStyle === "bubblegum"
                                ? "bg-rose-50 text-rose-500 font-sans selection:bg-yellow-200"
                                : "bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white"
            }`}
          >
            {/* Quick Switcher for UI & Skins */}
            <div
              className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 p-1.5 backdrop-blur-md rounded-2xl border shadow-2xl scale-[0.85] sm:scale-100 max-w-[95vw] overflow-x-auto no-scrollbar ${
                uiStyle === "bubblegum"
                  ? "bg-white/80 border-rose-200"
                  : "bg-black/80 border-white/10"
              }`}
            >
              <div
                className={`flex gap-1 border-r pr-2 overflow-x-auto no-scrollbar max-w-[150px] sm:max-w-none shrink-0 ${uiStyle === "bubblegum" ? "border-rose-100" : "border-white/10"}`}
              >
                <button
                  onClick={() => setUiStyle("modern")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "modern" ? "bg-white text-black" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Modern UI"
                >
                  <Monitor size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("zen")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "zen" ? "bg-[#d2c9b1] text-[#4a4636]" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Zen UI"
                >
                  <Palette size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("pixel")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "pixel" ? "bg-yellow-400 text-black" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Pixel UI"
                >
                  <Grid size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("cyberpunk")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "cyberpunk" ? "bg-purple-600 text-white" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Cyberpunk UI"
                >
                  <Zap size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("monochrome")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "monochrome" ? "bg-black text-white font-bold" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Monochrome UI"
                >
                  <Contrast size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("retro")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "retro" ? "bg-orange-500 text-white" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Retro UI"
                >
                  <Clock size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("midnight")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "midnight" ? "bg-slate-800 text-blue-300" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Midnight UI"
                >
                  <Moon size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("nature")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "nature" ? "bg-emerald-600 text-white" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Nature UI"
                >
                  <Sun size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("terminal")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "terminal" ? "bg-green-900/50 text-green-400 border border-green-400/30" : uiStyle === "bubblegum" ? "text-rose-300 hover:text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Terminal UI"
                >
                  <Terminal size={16} />
                </button>
                <button
                  onClick={() => setUiStyle("bubblegum")}
                  className={`p-2 rounded-xl h-8 w-8 shrink-0 flex items-center justify-center transition-all ${uiStyle === "bubblegum" ? "bg-rose-400 text-white shadow-[0_0_10px_rgba(251,113,133,0.5)]" : "text-zinc-500 hover:text-zinc-300"}`}
                  title="Bubblegum UI"
                >
                  <Heart size={16} />
                </button>
              </div>
              <div className="flex gap-1 overflow-x-auto max-w-[120px] md:max-w-none no-scrollbar px-1">
                {SKINS.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSkinId(s.id)}
                    className={`w-6 h-6 rounded-full border-2 transition-all shrink-0 ${selectedSkinId === s.id ? (uiStyle === "bubblegum" ? "border-rose-400 scale-125" : "border-white scale-110") : "border-transparent opacity-50 hover:opacity-100"}`}
                    style={{ backgroundColor: s.boardColor }}
                    title={s.name}
                  />
                ))}
              </div>
            </div>

            {uiStyle === "pixel" && (
              <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
              </div>
            )}

            {uiStyle === "zen" && (
              <div
                className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-multiply"
                style={{
                  backgroundImage:
                    "url(https://www.transparenttextures.com/patterns/natural-paper.png)",
                }}
              />
            )}

            {uiStyle === "bubblegum" && (
              <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden opacity-30">
                <div className="absolute top-[10%] left-[5%] w-32 h-32 bg-yellow-200 rounded-full blur-[60px] animate-pulse" />
                <div className="absolute bottom-[20%] right-[10%] w-48 h-48 bg-pink-300 rounded-full blur-[80px] animate-pulse [animation-delay:1s]" />
                <div className="absolute top-[60%] left-[40%] w-24 h-24 bg-purple-200 rounded-full blur-[50px] animate-pulse [animation-delay:2s]" />
              </div>
            )}

            {(uiStyle === "terminal" || uiStyle === "cyberpunk") && (
              <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.05] overflow-hidden">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[length:100%_4px,2px_100%]" />
              </div>
            )}

            {uiStyle === "cyberpunk" && (
              <div className="fixed inset-0 pointer-events-none z-[99] bg-[radial-gradient(circle_at_center,transparent_0%,rgba(147,51,234,0.05)_100%)]" />
            )}

            {gameMode === "online" ? (
              <div className="flex flex-col h-full max-w-3xl mx-auto w-full justify-between pb-8 shrink-0">
                {/* Top: Opponent Info */}
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div
                    className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-2xl transition-all duration-300 flex-1 min-w-[200px] ${
                      uiStyle === "pixel"
                        ? currentPlayer !== onlinePlayerColor
                          ? "bg-zinc-800 border-2 border-lime-400 scale-105"
                          : "opacity-40 grayscale"
                        : uiStyle === "zen"
                          ? currentPlayer !== onlinePlayerColor
                            ? "bg-[#e5e1d8] shadow-md scale-105 border border-[#d2c9b1]"
                            : "opacity-60 grayscale-[0.5]"
                          : uiStyle === "cyberpunk"
                            ? currentPlayer !== onlinePlayerColor
                              ? "bg-[#1e1b4b] border border-cyan-500 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105"
                              : "opacity-40 grayscale"
                            : uiStyle === "monochrome"
                              ? currentPlayer !== onlinePlayerColor
                                ? "bg-black text-white border border-white scale-105 shadow-md"
                                : "opacity-50 grayscale"
                              : uiStyle === "retro"
                                ? currentPlayer !== onlinePlayerColor
                                  ? "bg-[#eee8d5] border-2 border-[#586e75] scale-105 shadow-md"
                                  : "opacity-50 grayscale"
                                : uiStyle === "midnight"
                                  ? currentPlayer !== onlinePlayerColor
                                    ? "bg-slate-800 border border-slate-700 shadow-xl scale-105"
                                    : "opacity-40"
                                  : uiStyle === "nature"
                                    ? currentPlayer !== onlinePlayerColor
                                      ? "bg-emerald-100 border border-emerald-200 scale-105"
                                      : "opacity-50"
                                    : uiStyle === "terminal"
                                      ? currentPlayer !== onlinePlayerColor
                                        ? "bg-black border-2 border-green-500 scale-105 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                        : "opacity-30"
                                      : uiStyle === "bubblegum"
                                        ? currentPlayer !== onlinePlayerColor
                                          ? "bg-white border-4 border-rose-300 scale-105 shadow-xl shadow-rose-200/50"
                                          : "opacity-40 scale-95 blur-[0.5px]"
                                        : currentPlayer !== onlinePlayerColor
                                          ? "bg-white shadow-lg ring-2 ring-emerald-500/50 scale-105"
                                          : "opacity-60 scale-100"
                    }`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-200 flex items-center justify-center text-lg md:text-xl font-bold text-zinc-500 uppercase overflow-hidden ${currentPlayer === onlinePlayerColor ? "animate-idle-float" : ""}`}
                      >
                        {opponentAvatarUrl ? (
                          <img
                            src={opponentAvatarUrl}
                            alt="Opponent"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : opponentUserId ? (
                          opponentUserId.substring(0, 2)
                        ) : (
                          "O"
                        )}
                      </div>
                      <div
                        className={`absolute -bottom-1 -right-1 w-3 h-3 md:w-4 md:h-4 border-2 border-[#f5f5f5] rounded-full ${
                          onlineOpponentLeft
                            ? "bg-rose-500"
                            : isConnected
                              ? "bg-emerald-500"
                              : "bg-amber-500 animate-pulse"
                        }`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                        <h3 className="font-bold text-zinc-900 truncate max-w-[100px] sm:max-w-none text-sm md:text-base">
                          {opponentName ||
                            (opponentUserId
                              ? `Player ${opponentUserId.substring(0, 4)}`
                              : "Opponent")}
                        </h3>
                        {opponentElo !== null && (
                          <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] md:text-xs font-bold rounded-md whitespace-nowrap">
                            {opponentElo} ELO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] md:text-sm text-zinc-500 flex items-center gap-1 md:gap-2 mt-0.5 font-medium whitespace-nowrap">
                        <div
                          className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${onlinePlayerColor === "black" ? "bg-white border border-zinc-300" : "bg-zinc-900"}`}
                        />
                        <span className="flex-shrink-0">
                          {onlinePlayerColor === "black" ? "White" : "Black"}
                        </span>
                        {currentPlayer !== onlinePlayerColor &&
                          !winner &&
                          timeLimit > 0 && (
                            <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2">
                              <span
                                className={`font-mono text-[10px] md:text-sm ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-zinc-500"}`}
                              >
                                00:{timeLeft.toString().padStart(2, "0")}
                              </span>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {!winner && (
                      <button
                        onClick={() => setShowForfeitConfirm(true)}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-rose-100 text-rose-600 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-widest hover:bg-rose-200 transition-colors"
                      >
                        Forfeit
                      </button>
                    )}
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className={`p-1.5 md:p-2 transition-all rounded-full shadow-sm relative ${showChat ? "bg-zinc-900 text-white" : "bg-white text-zinc-400 hover:text-zinc-700"}`}
                    >
                      <MessageSquare size={20} />
                      {chatMessages.length > 0 && !showChat && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white" />
                      )}
                    </button>
                    <button
                      onClick={() => setShowMusicModal(true)}
                      className="text-zinc-400 hover:text-zinc-700 p-1.5 md:p-2 transition-colors bg-white rounded-full shadow-sm"
                    >
                      <Music size={20} />
                    </button>
                    <button
                      onClick={() => leaveOnlineMatch()}
                      className="text-zinc-400 hover:text-zinc-700 p-1.5 md:p-2 transition-colors bg-white rounded-full shadow-sm"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>

                {/* Center: Board */}
                <div className="px-4 mt-2">
                  <AnimatePresence>
                    {threats.length > 0 && !winner && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-3 shadow-sm mb-2 overflow-hidden"
                      >
                        <ShieldCheck size={18} className="shrink-0" />
                        <p className="text-xs font-bold leading-tight">
                          Threat Detected! Your opponent has {threats.length}{" "}
                          potential winning{" "}
                          {threats.length === 1 ? "line" : "lines"}.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <main
                  className={`flex-1 flex flex-col items-center justify-center relative my-1 sm:my-4 md:my-8 px-1 sm:px-4 w-full ${showChat ? "md:flex-row" : ""}`}
                >
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
                  <div className="w-full flex-1 sm:flex-none h-full sm:h-auto sm:max-w-[min(90vw,70vh)] sm:aspect-square relative flex items-center justify-center">
                    <div
                      className="w-full h-full max-h-full max-w-full flex items-center justify-center"
                      style={{ containerType: "size" }}
                    >
                      <GomokuBoard
                        board={board}
                        onCellClick={handleCellClick}
                        winningLine={winningLine}
                        lastMove={lastMove}
                        keyboardCursor={keyboardCursor}
                        skin={currentSkin}
                        threats={threats}
                      />
                    </div>
                  </div>

                  <AnimatePresence>
                    {forbiddenReason && (
                      <motion.div
                        initial={{ opacity: 0, y: 20, x: "-50%" }}
                        animate={{ opacity: 1, y: 0, x: "-50%" }}
                        exit={{ opacity: 0, y: 20, x: "-50%" }}
                        className="absolute bottom-4 md:bottom-8 left-1/2 bg-rose-500 text-white p-4 rounded-2xl shadow-xl z-20 flex items-center gap-3 whitespace-nowrap"
                      >
                        <X
                          size={20}
                          className="bg-rose-600 p-1 rounded-full shrink-0"
                        />
                        <div className="text-sm font-bold">
                          {forbiddenReason === "overline" &&
                            "Forbidden: Overline (6+ stones)"}
                          {forbiddenReason === "double-three" &&
                            "Forbidden: Double Three"}
                          {forbiddenReason === "double-four" &&
                            "Forbidden: Double Four"}
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
                        className="absolute md:relative right-0 top-0 bottom-0 w-[85%] md:w-[300px] h-full bg-white/95 backdrop-blur-md shadow-2xl md:shadow-md border-l border-zinc-200 z-50 md:z-10 flex flex-col rounded-l-3xl md:rounded-3xl overflow-hidden ml-0 md:ml-4"
                      >
                        <div
                          className={`p-4 border-b flex items-center justify-between ${
                            uiStyle === "zen"
                              ? "border-[#e5e1d8] bg-[#e5e1d8]/50"
                              : uiStyle === "pixel"
                                ? "border-lime-500/30 bg-lime-500/5"
                                : uiStyle === "bubblegum"
                                  ? "border-rose-100 bg-rose-50/80"
                                  : "border-zinc-100 bg-zinc-50/50"
                          }`}
                        >
                          <h3
                            className={`font-bold flex items-center gap-2 ${
                              uiStyle === "pixel"
                                ? "text-lime-400"
                                : uiStyle === "bubblegum"
                                  ? "text-rose-500"
                                  : "text-zinc-900"
                            }`}
                          >
                            <MessageSquare
                              size={18}
                              className={
                                uiStyle === "pixel"
                                  ? "text-lime-500"
                                  : uiStyle === "bubblegum"
                                    ? "text-rose-400"
                                    : "text-zinc-400"
                              }
                            />
                            Game Chat
                          </h3>
                          <button
                            onClick={() => setShowChat(false)}
                            className="p-1 hover:bg-zinc-200 rounded-full transition-colors"
                          >
                            <X size={18} />
                          </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                          {chatMessages.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-zinc-400 text-center p-4">
                              <MessageSquare
                                size={32}
                                className="mb-2 opacity-20"
                              />
                              <p className="text-xs font-medium uppercase tracking-widest">
                                No messages yet
                              </p>
                              <p className="text-[10px] mt-1">
                                Be the first to say hello!
                              </p>
                            </div>
                          ) : (
                            chatMessages.map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex gap-2 ${msg.isMe ? "flex-row-reverse" : "flex-row"} mb-4`}
                              >
                                <div className="w-8 h-8 rounded-full bg-zinc-200 flex-shrink-0 overflow-hidden flex items-center justify-center text-xs font-bold text-zinc-500 uppercase">
                                  {msg.isMe ? (
                                    user?.photoURL ? (
                                      <img
                                        src={user.photoURL}
                                        alt="Me"
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    ) : (
                                      <img
                                        src={currentCharacter.avatar}
                                        alt={currentCharacter.name}
                                        className="w-full h-full object-cover"
                                        referrerPolicy="no-referrer"
                                      />
                                    )
                                  ) : opponentAvatarUrl ? (
                                    <img
                                      src={opponentAvatarUrl}
                                      alt="Opponent"
                                      className="w-full h-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    msg.sender.substring(0, 2)
                                  )}
                                </div>
                                <div
                                  className={`flex flex-col ${msg.isMe ? "items-end" : "items-start"}`}
                                >
                                  <div
                                    className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                                      msg.isMe
                                        ? "bg-zinc-900 text-white rounded-tr-none"
                                        : "bg-zinc-100 text-zinc-800 rounded-tl-none"
                                    }`}
                                  >
                                    <p className="leading-relaxed">
                                      {msg.text}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1 mt-1">
                                    <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">
                                      {msg.isMe ? "You" : msg.sender} •{" "}
                                      {new Date(
                                        msg.timestamp,
                                      ).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                    {msg.achievements &&
                                      msg.achievements.length > 0 && (
                                        <div className="flex gap-0.5 ml-1">
                                          {msg.achievements.map((aId) => {
                                            const aData = ACHIEVEMENTS.find(
                                              (a) => a.id === aId,
                                            );
                                            return aData ? (
                                              <span
                                                key={aId}
                                                title={aData.name}
                                                className="text-[10px] bg-amber-100 text-amber-800 rounded-full px-1"
                                              >
                                                {aData.icon}
                                              </span>
                                            ) : null;
                                          })}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                          <div ref={chatEndRef} />
                        </div>

                        <form
                          onSubmit={handleSendMessage}
                          className="p-4 bg-zinc-50/50 border-t border-zinc-100"
                        >
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
                  <div
                    className={`flex items-center gap-3 md:gap-4 p-2 md:p-3 rounded-2xl transition-all duration-300 ${currentPlayer === onlinePlayerColor ? "bg-white shadow-lg ring-2 ring-emerald-500/50 scale-105" : "opacity-60 scale-100"}`}
                  >
                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-zinc-900 flex items-center justify-center text-lg md:text-xl font-bold text-white uppercase overflow-hidden ${currentPlayer !== onlinePlayerColor ? "animate-idle-float" : ""}`}
                      >
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Me"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <img
                            src={currentCharacter.avatar}
                            alt={currentCharacter.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                      <div
                        className="absolute -top-1 -right-1 w-2.5 h-2.5 md:w-3 md:h-3 rounded-full border border-black/20"
                        style={{
                          backgroundColor:
                            COLOR_MAP[
                              currentCharacter.color?.toLowerCase() || ""
                            ] ||
                            currentCharacter.color ||
                            "#6b7280",
                        }}
                      />
                      <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 md:w-4 md:h-4 bg-emerald-500 border-2 border-[#f5f5f5] rounded-full" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                        <h3 className="font-bold text-zinc-900 truncate max-w-[100px] sm:max-w-none text-sm md:text-base">
                          {user?.displayName || currentCharacter.name}
                        </h3>
                        <span className="px-1.5 py-0.5 bg-zinc-100 text-zinc-600 text-[10px] md:text-xs font-bold rounded-md whitespace-nowrap">
                          {playerElo} ELO
                        </span>
                      </div>
                      <div className="text-[10px] md:text-sm text-zinc-500 flex items-center gap-1 md:gap-2 mt-0.5 font-medium whitespace-nowrap">
                        <div
                          className={`w-2 h-2 md:w-3 md:h-3 rounded-full flex-shrink-0 ${onlinePlayerColor === "black" ? "bg-zinc-900" : "bg-white border border-zinc-300"}`}
                        />
                        <span className="flex-shrink-0">
                          {onlinePlayerColor === "black" ? "Black" : "White"}
                        </span>
                        {currentPlayer === onlinePlayerColor &&
                          !winner &&
                          timeLimit > 0 && (
                            <div className="flex items-center gap-1 md:gap-2 ml-1 md:ml-2">
                              <span
                                className={`font-mono text-[10px] md:text-sm ${timeLeft <= 10 ? "text-red-500 animate-pulse" : "text-emerald-500"}`}
                              >
                                00:{timeLeft.toString().padStart(2, "0")}
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
                <header
                  className={`flex items-center justify-between mb-4 md:mb-8 shrink-0 flex-wrap gap-4 ${uiStyle === "pixel" ? "border-b-4 border-white pb-4" : ""}`}
                >
                  <button
                    onClick={() =>
                      gameMode === "online"
                        ? leaveOnlineMatch()
                        : setCurrentScreen("home")
                    }
                    className={`p-2 rounded-full transition-colors ${uiStyle === "pixel" ? "bg-white text-black" : "hover:bg-zinc-200"}`}
                  >
                    <ChevronLeft size={24} />
                  </button>
                  <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
                    <div
                      className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-xs md:text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                        uiStyle === "pixel"
                          ? currentPlayer === "black"
                            ? "bg-lime-400 text-black shadow-[4px_4px_0px_#fff] scale-105"
                            : "bg-zinc-800 text-zinc-500 opacity-60"
                          : uiStyle === "zen"
                            ? currentPlayer === "black"
                              ? "bg-[#4a4636] text-[#e5e1d8] shadow-md scale-105"
                              : "bg-[#e5e1d8] text-[#4a4636] opacity-60"
                            : uiStyle === "cyberpunk"
                              ? currentPlayer === "black"
                                ? "bg-purple-600 text-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105"
                                : "bg-zinc-900 text-zinc-600 opacity-60"
                              : uiStyle === "monochrome"
                                ? currentPlayer === "black"
                                  ? "bg-black text-white scale-105 border border-white"
                                  : "bg-white text-black border border-black opacity-60"
                                : uiStyle === "retro"
                                  ? currentPlayer === "black"
                                    ? "bg-[#586e75] text-[#fdf6e3] scale-105 shadow-md"
                                    : "bg-[#eee8d5] text-[#586e75] opacity-60"
                                  : uiStyle === "midnight"
                                    ? currentPlayer === "black"
                                      ? "bg-slate-100 text-black scale-105 shadow-lg"
                                      : "bg-slate-800 text-slate-500 opacity-60"
                                    : uiStyle === "nature"
                                      ? currentPlayer === "black"
                                        ? "bg-emerald-900 text-emerald-50 scale-105"
                                        : "bg-emerald-100 text-emerald-900 opacity-60"
                                      : uiStyle === "terminal"
                                        ? currentPlayer === "black"
                                          ? "bg-green-500 text-black scale-105"
                                          : "bg-black text-green-900 border border-green-900 opacity-60"
                                        : uiStyle === "bubblegum"
                                          ? currentPlayer === "black"
                                            ? "bg-rose-500 text-white shadow-[0_8px_15px_rgba(244,63,94,0.3)] scale-110"
                                            : "bg-rose-100 text-rose-300 opacity-60 scale-95"
                                          : currentPlayer === "black"
                                            ? "bg-zinc-900 text-white shadow-lg ring-2 ring-zinc-900/20 scale-105"
                                            : "bg-zinc-200 text-zinc-900 opacity-60"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={
                            gameMode === "pve" && startingPlayer === "ai"
                              ? CHARACTERS[1].avatar
                              : currentCharacter.avatar
                          }
                          alt="Black Player"
                          className={`w-5 h-5 rounded-full object-cover ${currentPlayer !== "black" ? "animate-idle-float" : ""}`}
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black/20"
                          style={{
                            backgroundColor:
                              (gameMode === "pve" && startingPlayer === "ai"
                                ? COLOR_MAP[
                                    CHARACTERS[1].color?.toLowerCase() || ""
                                  ] || CHARACTERS[1].color
                                : COLOR_MAP[
                                    currentCharacter.color?.toLowerCase() || ""
                                  ] || currentCharacter.color) || "#6b7280",
                          }}
                        />
                      </div>
                      <span
                        className={uiStyle === "pixel" ? "tracking-widest" : ""}
                      >
                        {gameMode === "pve"
                          ? startingPlayer === "ai"
                            ? `AI (${aiDifficulty})`
                            : user?.displayName || "You"
                          : gameMode === "pvp"
                            ? "Player 1"
                            : user?.displayName || "You"}
                      </span>
                      {(gameMode === "pve" || gameMode === "pvp") &&
                        currentPlayer === "black" &&
                        !winner &&
                        timeLimit > 0 && (
                          <span
                            className={`ml-2 font-mono ${timeLeft <= 10 ? "text-red-500 animate-pulse" : uiStyle === "bubblegum" ? "text-white/80" : uiStyle === "pixel" ? "text-black" : uiStyle === "zen" ? "text-[#e5e1d8]" : "text-emerald-500"}`}
                          >
                            00:{timeLeft.toString().padStart(2, "0")}
                          </span>
                        )}
                    </div>
                    <div
                      className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                        uiStyle === "pixel"
                          ? currentPlayer === "white"
                            ? "bg-yellow-400 text-black shadow-[4px_4px_0px_#fff] scale-105"
                            : "bg-zinc-800 text-zinc-500 opacity-60"
                          : uiStyle === "zen"
                            ? currentPlayer === "white"
                              ? "bg-[#4a4636] text-[#e5e1d8] shadow-md scale-105"
                              : "bg-[#e5e1d8] text-[#4a4636] opacity-60"
                            : uiStyle === "cyberpunk"
                              ? currentPlayer === "white"
                                ? "bg-purple-600 text-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.5)] scale-105"
                                : "bg-zinc-900 text-zinc-600 opacity-60"
                              : uiStyle === "monochrome"
                                ? currentPlayer === "white"
                                  ? "bg-black text-white scale-105 border border-white"
                                  : "bg-white text-black border border-black opacity-60"
                                : uiStyle === "retro"
                                  ? currentPlayer === "white"
                                    ? "bg-[#586e75] text-[#fdf6e3] scale-105 shadow-md"
                                    : "bg-[#eee8d5] text-[#586e75] opacity-60"
                                  : uiStyle === "midnight"
                                    ? currentPlayer === "white"
                                      ? "bg-slate-100 text-black scale-105 shadow-lg"
                                      : "bg-slate-800 text-slate-500 opacity-60"
                                    : uiStyle === "nature"
                                      ? currentPlayer === "white"
                                        ? "bg-emerald-900 text-emerald-50 scale-105"
                                        : "bg-emerald-100 text-emerald-900 opacity-60"
                                      : uiStyle === "terminal"
                                        ? currentPlayer === "white"
                                          ? "bg-green-500 text-black scale-105"
                                          : "bg-black text-green-900 border border-green-900 opacity-60"
                                        : uiStyle === "bubblegum"
                                          ? currentPlayer === "white"
                                            ? "bg-rose-500 text-white shadow-[0_8px_15px_rgba(244,63,94,0.3)] scale-110"
                                            : "bg-rose-100 text-rose-300 opacity-60 scale-95"
                                          : currentPlayer === "white"
                                            ? "bg-zinc-900 text-white shadow-lg ring-2 ring-zinc-900/20 scale-105"
                                            : "bg-zinc-200 text-zinc-900 opacity-60"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={
                            gameMode === "pve" && startingPlayer === "human"
                              ? CHARACTERS[1].avatar
                              : currentCharacter.avatar
                          }
                          alt="White Player"
                          className={`w-5 h-5 rounded-full object-cover ${currentPlayer !== "white" ? "animate-idle-float" : ""}`}
                          referrerPolicy="no-referrer"
                        />
                        <div
                          className="absolute -top-1 -right-1 w-2 h-2 rounded-full border border-black/20"
                          style={{
                            backgroundColor:
                              (gameMode === "pve" && startingPlayer === "human"
                                ? COLOR_MAP[
                                    CHARACTERS[1].color?.toLowerCase() || ""
                                  ] || CHARACTERS[1].color
                                : COLOR_MAP[
                                    currentCharacter.color?.toLowerCase() || ""
                                  ] || currentCharacter.color) || "#6b7280",
                          }}
                        />
                      </div>
                      <span
                        className={uiStyle === "pixel" ? "tracking-widest" : ""}
                      >
                        {gameMode === "pve"
                          ? startingPlayer === "human"
                            ? `AI (${aiDifficulty})`
                            : user?.displayName || "You"
                          : gameMode === "pvp"
                            ? "Player 2"
                            : user?.displayName || "You"}
                      </span>
                      {(gameMode === "pve" || gameMode === "pvp") &&
                        currentPlayer === "white" &&
                        !winner &&
                        timeLimit > 0 && (
                          <span
                            className={`ml-2 font-mono ${timeLeft <= 10 ? "text-red-500 animate-pulse" : uiStyle === "bubblegum" ? "text-white/80" : uiStyle === "pixel" ? "text-black" : uiStyle === "zen" ? "text-[#e5e1d8]" : "text-emerald-500"}`}
                          >
                            00:{timeLeft.toString().padStart(2, "0")}
                          </span>
                        )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                    <button
                      onClick={() => setShowMusicModal(true)}
                      className="p-2 hover:bg-zinc-100 text-zinc-600 rounded-full transition-colors"
                      title="Music Player"
                    >
                      <Music size={20} />
                    </button>
                    {!winner &&
                      gameMode !== "online" &&
                      !(
                        gameMode === "pve" &&
                        ((startingPlayer === "human" &&
                          currentPlayer === "white") ||
                          (startingPlayer === "ai" &&
                            currentPlayer === "black"))
                      ) && (
                        <button
                          onClick={askCoach}
                          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold transition-all shadow-lg text-xs md:text-sm flex items-center gap-2 active:scale-95 ${
                            uiStyle === "bubblegum"
                              ? "bg-rose-400 text-white hover:bg-rose-500 shadow-rose-200"
                              : uiStyle === "pixel"
                                ? "bg-lime-400 text-black border-2 border-white"
                                : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200"
                          }`}
                          title="Get a hint from the AI"
                        >
                          <Lightbulb
                            size={16}
                            fill={uiStyle === "pixel" ? "black" : "white"}
                          />
                          <span className="hidden sm:inline">Hint</span>
                        </button>
                      )}
                    {!winner &&
                      gameMode !== "online" &&
                      moveHistory.length > 0 &&
                      !(
                        gameMode === "pve" &&
                        ((startingPlayer === "human" &&
                          currentPlayer === "white") ||
                          (startingPlayer === "ai" &&
                            currentPlayer === "black"))
                      ) && (
                        <button
                          onClick={handleUndo}
                          className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full font-bold transition-all shadow-lg text-xs md:text-sm flex items-center gap-2 active:scale-95 ${
                            uiStyle === "bubblegum"
                              ? "bg-rose-100 text-rose-500 hover:bg-rose-200 shadow-rose-100 border border-rose-200"
                              : uiStyle === "pixel"
                                ? "bg-zinc-800 text-white border-2 border-white"
                                : "bg-amber-100 text-amber-700 hover:bg-amber-200 shadow-amber-50"
                          }`}
                          title="Undo Move"
                        >
                          <Undo2 size={16} />
                          <span className="hidden sm:inline">Undo</span>
                        </button>
                      )}
                    {!winner &&
                      gameMode !== "online" &&
                      !(
                        gameMode === "pve" &&
                        ((startingPlayer === "human" &&
                          currentPlayer === "white") ||
                          (startingPlayer === "ai" &&
                            currentPlayer === "black"))
                      ) && (
                        <button
                          onClick={() => setShowForfeitConfirm(true)}
                          className="px-3 py-1.5 md:px-4 md:py-2 bg-rose-100 text-rose-600 rounded-full font-semibold hover:bg-rose-200 transition-colors text-xs md:text-sm flex items-center gap-2"
                          title="Forfeit Match"
                        >
                          <span className="hidden sm:inline">Forfeit</span>
                          <LogOut size={16} className="sm:hidden" />
                        </button>
                      )}
                    {gameMode !== "online" && (
                      <button
                        onClick={() => setShowNewGameModal(true)}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-zinc-900 text-white rounded-full font-semibold hover:bg-zinc-800 transition-colors text-xs md:text-sm"
                      >
                        New Game
                      </button>
                    )}
                  </div>
                </header>

                <div className="px-4">
                  <AnimatePresence>
                    {threats.length > 0 && !winner && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="bg-red-50 text-red-600 px-4 py-2 rounded-2xl border border-red-100 flex items-center gap-3 shadow-sm mb-2 overflow-hidden"
                      >
                        <ShieldCheck size={18} className="shrink-0" />
                        <p className="text-xs font-bold leading-tight">
                          Threat Detected! Opponent has {threats.length}{" "}
                          potential winning{" "}
                          {threats.length === 1 ? "line" : "lines"}.
                        </p>
                      </motion.div>
                    )}
                    {coachAdvice && !winner && (
                      <motion.div
                        initial={{ height: 0, opacity: 0, y: -10 }}
                        animate={{ height: "auto", opacity: 1, y: 0 }}
                        exit={{ height: 0, opacity: 0, y: -10 }}
                        className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100 flex items-center gap-3 shadow-sm mb-2 overflow-hidden"
                      >
                        <Lightbulb size={18} className="shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold leading-tight truncate">
                            Hint: {coachAdvice.explanation}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleCellClick(coachAdvice.row, coachAdvice.col)
                            }
                            className="bg-emerald-500 text-white p-1.5 rounded-lg hover:bg-emerald-600 transition-colors"
                            title="Apply Move"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={() => setCoachAdvice(null)}
                            className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
                            title="Close"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <main className="flex-1 flex flex-col items-center justify-center relative my-1 sm:my-4 md:my-8 px-1 sm:px-4 w-full">
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
                  <div className="w-full flex-1 sm:flex-none h-full sm:h-auto sm:max-w-[min(90vw,70vh)] sm:aspect-square relative flex items-center justify-center">
                    <div
                      className="w-full h-full max-h-full max-w-full flex items-center justify-center"
                      style={{ containerType: "size" }}
                    >
                      <GomokuBoard
                        board={board}
                        onCellClick={handleCellClick}
                        winningLine={winningLine}
                        lastMove={lastMove}
                        coachMove={
                          coachAdvice
                            ? { row: coachAdvice.row, col: coachAdvice.col }
                            : null
                        }
                        keyboardCursor={keyboardCursor}
                        skin={currentSkin}
                        threats={threats}
                      />
                    </div>
                  </div>
                </main>
              </div>
            )}

            <AnimatePresence>
              {winner && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-6 rounded-[3rem] shadow-2xl border text-center min-w-[300px] z-[70] ${
                    uiStyle === "pixel"
                      ? "bg-black border-lime-400 shadow-[8px_8px_0px_#fff]"
                      : uiStyle === "zen"
                        ? "bg-[#e5e1d8] border-[#4a4636] italic"
                        : uiStyle === "cyberpunk"
                          ? "bg-[#0f0a1e] border-cyan-500 shadow-[0_0_30px_rgba(34,211,238,0.5)]"
                          : uiStyle === "monochrome"
                            ? "bg-black text-white border-white border-2"
                            : uiStyle === "retro"
                              ? currentPlayer !== onlinePlayerColor
                                ? "bg-[#eee8d5] border-2 border-[#586e75] scale-105 shadow-md"
                                : "opacity-50 grayscale"
                              : uiStyle === "midnight"
                                ? "bg-slate-900 border-slate-700 shadow-2xl"
                                : uiStyle === "nature"
                                  ? "bg-emerald-50 border-emerald-200"
                                  : uiStyle === "terminal"
                                    ? "bg-black border-green-500 border-2"
                                    : uiStyle === "bubblegum"
                                      ? "bg-white border-8 border-rose-200 shadow-[0_20px_50px_rgba(251,113,133,0.3)] animate-bounce-slow"
                                      : "bg-white border-zinc-100"
                  }`}
                >
                  <h2
                    className={`text-4xl font-black mb-2 ${
                      uiStyle === "pixel"
                        ? "text-yellow-400"
                        : uiStyle === "zen"
                          ? "text-[#4a4636]"
                          : uiStyle === "cyberpunk"
                            ? "text-fuchsia-500 tracking-tighter uppercase"
                            : uiStyle === "terminal"
                              ? "text-green-500"
                              : uiStyle === "bubblegum"
                                ? "text-rose-500 drop-shadow-sm"
                                : "text-zinc-900"
                    }`}
                  >
                    {winner === "draw"
                      ? "Draw!"
                      : `${winner === "black" ? "Black" : "White"} Wins!`}
                  </h2>
                  <p className="text-zinc-500 mb-2">
                    {hasForfeited
                      ? "You forfeited the match."
                      : endReason === "opponent_forfeited"
                        ? "Opponent forfeited the match."
                        : endReason === "timeout"
                          ? winner === onlinePlayerColor
                            ? "Opponent timed out."
                            : "You timed out."
                          : onlineOpponentLeft
                            ? "Opponent left the match."
                            : "Great game played by both sides."}
                  </p>
                  {eloChange !== null && (
                    <div className="mb-6 flex items-center justify-center gap-2">
                      <span className="font-bold text-zinc-700">
                        Rating: {playerElo}
                      </span>
                      <span
                        className={`font-bold ${eloChange > 0 ? "text-emerald-500" : eloChange < 0 ? "text-red-500" : "text-zinc-500"}`}
                      >
                        ({eloChange > 0 ? "+" : ""}
                        {eloChange})
                      </span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        const tempMatch: MatchRecord = {
                          id: "temp_replay",
                          date: Date.now(),
                          opponent:
                            gameMode === "online"
                              ? opponentName || "Unknown"
                              : gameMode === "pve"
                                ? `AI (${aiDifficulty})`
                                : "Local Player",
                          opponentElo: playerElo,
                          playerEloBefore: playerElo - (eloChange || 0),
                          playerEloAfter: playerElo,
                          result:
                            winner === "draw"
                              ? "draw"
                              : winner === "black"
                                ? "win"
                                : "loss",
                          moves: moveHistory,
                          boardSize: boardSize,
                          gameMode: gameMode,
                          winner: winner || "draw",
                          selectedSkin: selectedSkinId,
                          selectedCharacter: selectedCharacterId,
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
                    {gameMode !== "online" && (
                      <button
                        onClick={resetGame}
                        className="flex-1 bg-zinc-900 text-white py-3 rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
                      >
                        Play Again
                      </button>
                    )}
                    <button
                      onClick={() =>
                        gameMode === "online"
                          ? leaveOnlineMatch()
                          : setCurrentScreen("home")
                      }
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
                    <h3 className="text-xl font-bold mb-2 text-center">
                      New Game
                    </h3>
                    <p className="text-zinc-500 text-center mb-6 text-sm">
                      What would you like to do?
                    </p>

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
                          setCurrentScreen("home");
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
                    <h3 className="text-xl font-bold mb-2 text-center text-rose-600">
                      Forfeit Match?
                    </h3>
                    <p className="text-zinc-500 text-center mb-6 text-sm">
                      Are you sure you want to concede? This will count as a
                      loss.
                    </p>

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

        {currentScreen === "music" && (
          <motion.div
            key="music"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full h-full"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen("home")}
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

        {currentScreen === "stats" && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen("home")}
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
                <h3
                  className="text-3xl font-black tracking-tighter uppercase"
                  style={{ color: getRankTier(playerElo).color }}
                >
                  {getRankTier(playerElo).name}
                </h3>
                <p className="text-zinc-400 font-bold text-lg">
                  {playerElo} ELO
                </p>
              </div>

              <div className="w-full">
                <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">
                  <span>{getRankTier(playerElo).name}</span>
                  {getNextRank(playerElo) && (
                    <span>
                      {getNextRank(playerElo)!.name} (
                      {getNextRank(playerElo)!.minElo})
                    </span>
                  )}
                </div>
                <div className="h-4 bg-zinc-100 rounded-full overflow-hidden border border-zinc-200 p-1">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: getNextRank(playerElo)
                        ? `${((playerElo - getRankTier(playerElo).minElo) / (getNextRank(playerElo)!.minElo - getRankTier(playerElo).minElo)) * 100}%`
                        : "100%",
                    }}
                    className="h-full rounded-full shadow-sm"
                    style={{ backgroundColor: getRankTier(playerElo).color }}
                  />
                </div>
                {getNextRank(playerElo) && (
                  <p className="text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-3">
                    {getNextRank(playerElo)!.minElo - playerElo} ELO to next
                    rank
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Matches
                </p>
                <p className="text-3xl font-black">{matchHistory.length}</p>
                <div className="flex gap-1 mt-2">
                  {matchHistory.slice(0, 5).map((m, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        m.result === "win"
                          ? "bg-emerald-500"
                          : m.result === "loss"
                            ? "bg-rose-500"
                            : "bg-zinc-300"
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">
                  Win Rate
                </p>
                <p className="text-3xl font-black">
                  {matchHistory.length > 0
                    ? Math.round(
                        (matchHistory.filter((m) => m.result === "win").length /
                          matchHistory.length) *
                          100,
                      )
                    : 0}
                  %
                </p>
                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1">
                  Streak: {userProfile?.stats?.winStreak || 0} (Max:{" "}
                  {userProfile?.stats?.maxWinStreak || 0})
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
                  <AreaChart
                    data={matchHistory
                      .slice()
                      .reverse()
                      .map((m, i) => ({ elo: m.playerEloAfter, name: i + 1 }))}
                  >
                    <defs>
                      <linearGradient id="colorElo" x1="0" y1="0" x2="0" y2="1">
                        <stop
                          offset="5%"
                          stopColor="#6366f1"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#6366f1"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f1f5f9"
                    />
                    <XAxis dataKey="name" hide />
                    <YAxis domain={["dataMin - 50", "dataMax + 50"]} hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "12px",
                        border: "none",
                        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ display: "none" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="elo"
                      stroke="#6366f1"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorElo)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100">
                <h3 className="text-lg font-bold mb-6">Match Distribution</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Wins",
                            value: matchHistory.filter(
                              (m) => m.result === "win",
                            ).length,
                          },
                          {
                            name: "Losses",
                            value: matchHistory.filter(
                              (m) => m.result === "loss",
                            ).length,
                          },
                          {
                            name: "Draws",
                            value: matchHistory.filter(
                              (m) => m.result === "draw",
                            ).length,
                          },
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
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                      Wins
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                      Losses
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                    <span className="text-[10px] font-bold text-zinc-500 uppercase">
                      Draws
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100">
                <h3 className="text-lg font-bold mb-6">Outcome Comparison</h3>
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        {
                          name: "Wins",
                          count: matchHistory.filter((m) => m.result === "win")
                            .length,
                          fill: "#10b981",
                        },
                        {
                          name: "Losses",
                          count: matchHistory.filter((m) => m.result === "loss")
                            .length,
                          fill: "#ef4444",
                        },
                        {
                          name: "Draws",
                          count: matchHistory.filter((m) => m.result === "draw")
                            .length,
                          fill: "#71717a",
                        },
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="#f1f5f9"
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 12,
                          fill: "#71717a",
                          fontWeight: "bold",
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#71717a" }}
                      />
                      <Tooltip
                        cursor={{ fill: "#f8fafc" }}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar dataKey="count" radius={[6, 6, 6, 6]} barSize={32}>
                        {[
                          { fill: "#10b981" },
                          { fill: "#ef4444" },
                          { fill: "#71717a" },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-zinc-100">
                <h3 className="text-lg font-bold mb-6">Advanced Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">
                      Total Moves
                    </span>
                    <span className="text-sm font-bold">
                      {userProfile?.stats?.totalMoves || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">
                      Avg Moves/Game
                    </span>
                    <span className="text-sm font-bold">
                      {matchHistory.length > 0
                        ? Math.round(
                            (userProfile?.stats?.totalMoves || 0) /
                              matchHistory.length,
                          )
                        : 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">
                      Max Win Streak
                    </span>
                    <span className="text-sm font-bold text-emerald-500">
                      {userProfile?.stats?.maxWinStreak || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-500 font-medium">
                      Games Played
                    </span>
                    <span className="text-sm font-bold">
                      {userProfile?.stats?.totalGames || 0}
                    </span>
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
                  <p className="text-zinc-400 text-center py-4 text-sm">
                    Loading leaderboard...
                  </p>
                ) : (
                  leaderboard.map((player, i) => (
                    <motion.div
                      key={player.uid}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        duration: 0.3,
                        delay: i * 0.05,
                        ease: "backOut",
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl transition-all hover:shadow-md hover:-translate-y-0.5 ${
                        player.uid === user?.uid
                          ? "bg-indigo-50 border border-indigo-100 shadow-sm"
                          : "bg-zinc-50 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-6 text-center font-black text-xs ${
                            i === 0
                              ? "text-amber-500"
                              : i === 1
                                ? "text-zinc-400"
                                : i === 2
                                  ? "text-amber-700"
                                  : "text-zinc-300"
                          }`}
                        >
                          {i + 1}
                        </span>
                        <img
                          src={
                            player.avatarUrl ||
                            `https://i.pravatar.cc/150?u=${player.uid}`
                          }
                          alt={player.displayName}
                          className="w-8 h-8 rounded-full border border-zinc-200"
                        />
                        <span
                          className={`font-bold text-sm ${player.uid === user?.uid ? "text-indigo-600" : "text-zinc-700"}`}
                        >
                          {player.displayName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-zinc-900">
                          {player.elo}
                        </span>
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{
                            backgroundColor: getRankTier(player.elo).color,
                          }}
                        />
                      </div>
                    </motion.div>
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
                  <p className="text-zinc-500 text-center py-8 font-medium">
                    No matches played yet.
                  </p>
                ) : (
                  matchHistory.map((match, i) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: i * 0.05,
                        ease: "easeOut",
                      }}
                      className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-2xl hover:bg-zinc-800 transition-colors cursor-pointer group hover:shadow-lg hover:-translate-y-0.5"
                      onClick={() => startReplay(match)}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                            match.result === "win"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : match.result === "loss"
                                ? "bg-rose-500/20 text-rose-400"
                                : "bg-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {match.result === "win"
                            ? "W"
                            : match.result === "loss"
                              ? "L"
                              : "D"}
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            vs {match.opponent}
                          </p>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                            {new Date(match.date).toLocaleDateString()} •{" "}
                            {match.gameMode.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-xs font-black">
                            {match.playerEloAfter}
                          </p>
                          <p
                            className={`text-[10px] font-bold ${
                              match.playerEloAfter > match.playerEloBefore
                                ? "text-emerald-400"
                                : match.playerEloAfter < match.playerEloBefore
                                  ? "text-rose-400"
                                  : "text-zinc-500"
                            }`}
                          >
                            {match.playerEloAfter > match.playerEloBefore
                              ? "+"
                              : ""}
                            {match.playerEloAfter - match.playerEloBefore}
                          </p>
                        </div>
                        <Play
                          size={16}
                          className="text-zinc-600 group-hover:text-white transition-colors"
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {currentScreen === "replay" && replayMatch && (
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
                  onClick={() => setCurrentScreen("stats")}
                  className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <div>
                  <h2 className="text-xl font-bold">Replay</h2>
                  <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                    vs {replayMatch.opponent} • Move {replayMoveIndex} /{" "}
                    {replayMatch.moves.length}
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

            <main className="flex-1 flex flex-col items-center justify-center relative my-1 sm:my-4 md:my-8 px-1 sm:px-4 w-full">
              <div className="w-full flex-1 sm:flex-none h-full sm:h-auto sm:max-w-[min(90vw,70vh)] sm:aspect-square relative flex items-center justify-center">
                <div
                  className="w-full h-full max-h-full max-w-full flex items-center justify-center"
                  style={{ containerType: "size" }}
                >
                  <GomokuBoard
                    board={replayBoard}
                    onCellClick={() => {}}
                    winningLine={
                      replayMoveIndex === replayMatch.moves.length &&
                      replayMatch.winner !== "draw" &&
                      replayMatch.moves.length > 0
                        ? checkWin(
                            replayBoard,
                            replayMatch.moves[replayMatch.moves.length - 1].row,
                            replayMatch.moves[replayMatch.moves.length - 1].col,
                            replayMatch.moves[replayMatch.moves.length - 1]
                              .player,
                            false,
                          )
                        : null
                    }
                    lastMove={
                      replayMoveIndex > 0
                        ? replayMatch.moves[replayMoveIndex - 1]
                        : null
                    }
                    skin={
                      allSkins.find(
                        (s) => s.id === (replayMatch as any).selectedSkin,
                      ) || SKINS[0]
                    }
                  />
                </div>
              </div>

              <div className="mt-8 w-full max-w-md bg-white p-6 rounded-3xl shadow-xl border border-zinc-100">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                    Timeline
                  </span>
                  <span className="text-xs font-bold text-zinc-900">
                    {Math.round(
                      (replayMoveIndex / replayMatch.moves.length) * 100,
                    )}
                    %
                  </span>
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

              {!analysisData && !isAnalyzing && (
                <button
                  onClick={handleRunAnalysis}
                  className="mt-4 px-6 py-3 bg-zinc-900 text-white rounded-full font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg active:scale-95"
                >
                  <Activity size={20} />
                  Run AI Analysis
                </button>
              )}
              {isAnalyzing && (
                <div className="mt-4 px-6 py-3 bg-white border border-zinc-200 rounded-full font-bold flex items-center justify-center gap-2 text-zinc-500 shadow-sm">
                  <div className="w-5 h-5 border-2 border-zinc-300 border-t-zinc-600 rounded-full animate-spin" />
                  Analyzing Match...
                </div>
              )}
              {analysisData && (
                <div className="mt-4 w-full max-w-2xl bg-white p-6 rounded-3xl shadow-xl border border-zinc-100">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Activity size={20} /> Match Advantage
                  </h3>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={analysisData.dataPoints.map((score, i) => ({
                          move: i,
                          advantage: score,
                        }))}
                        margin={{ top: 5, right: 0, left: 0, bottom: 5 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorAdvantage"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#10b981"
                              stopOpacity={0.8}
                            />
                            <stop
                              offset="95%"
                              stopColor="#10b981"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="move" hide />
                        <YAxis domain={[-100, 100]} hide />
                        <Tooltip
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              const val = payload[0].value as number;
                              return (
                                <div className="bg-white p-2 rounded shadow border text-xs font-semibold">
                                  Move {label}:{" "}
                                  {val > 0
                                    ? `Black +${Math.round(val)}`
                                    : `White +${Math.round(Math.abs(val))}`}
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <ReferenceLine
                          y={0}
                          stroke="#e4e4e7"
                          strokeDasharray="3 3"
                        />
                        <Area
                          type="monotone"
                          dataKey="advantage"
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#colorAdvantage)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                    {analysisData.analysis.map((a) => {
                      if (
                        a.classification === "normal" ||
                        a.classification === "good"
                      )
                        return null;
                      return (
                        <button
                          key={a.moveIndex}
                          onClick={() => {
                            setIsPlayingReplay(false);
                            const newBoard = createEmptyBoard(
                              replayMatch.boardSize,
                            );
                            for (let i = 0; i <= a.moveIndex; i++) {
                              const move = replayMatch.moves[i];
                              newBoard[move.row][move.col] = move.player;
                            }
                            setReplayBoard(newBoard);
                            setReplayMoveIndex(a.moveIndex + 1);
                          }}
                          className="flex items-center gap-3 p-3 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors text-left group"
                        >
                          <span className="w-20 font-mono text-zinc-400">
                            Move {a.moveIndex + 1}
                          </span>
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${a.classification === "brilliant" ? "bg-cyan-100 text-cyan-700" : a.classification === "blunder" ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"}`}
                          >
                            {a.classification}
                          </span>
                          <span className="text-sm font-semibold capitalize flex-1">
                            {a.player}
                          </span>
                          <ChevronRight
                            size={16}
                            className="text-zinc-300 group-hover:text-zinc-600"
                          />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </main>
          </motion.div>
        )}

        {currentScreen === "support" && (
          <motion.div
            key="support"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen("home")}
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
                    <h4 className="font-bold text-sm text-zinc-900">
                      Comment jouer au Gomoku ?
                    </h4>
                    <p className="text-sm text-zinc-500 mt-1">
                      Le but est d'aligner 5 pierres de votre couleur
                      horizontalement, verticalement ou en diagonale.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-900">
                      Comment fonctionne le classement ELO ?
                    </h4>
                    <p className="text-sm text-zinc-500 mt-1">
                      Votre ELO augmente quand vous gagnez et diminue quand vous
                      perdez. Le gain dépend du niveau de votre adversaire.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Mail size={20} className="text-emerald-500" />
                  Contactez-nous
                </h3>
                <p className="text-sm text-zinc-500 mb-4">
                  Besoin d'aide personnalisée ? Notre équipe est à votre écoute.
                </p>
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
                  <p>
                    <strong>Éditeur :</strong> Gomoku App SAS, 123 Rue de la
                    Stratégie, 75001 Paris, France.
                  </p>
                  <p>
                    <strong>Directeur de la publication :</strong> Claude Pierre
                    Monet.
                  </p>
                  <p>
                    <strong>Hébergement :</strong> Google Cloud Platform
                    (Europe-West2).
                  </p>
                  <p>
                    Conformément à la loi n° 2004-575 du 21 juin 2004 pour la
                    confiance dans l'économie numérique (LCEN).
                  </p>
                </div>
              </section>

              {/* GDPR Section (European Regulation Compliance) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-blue-500" />
                  Protection des Données (RGPD)
                </h3>
                <div className="text-xs text-zinc-500 space-y-3 leading-relaxed">
                  <p>
                    Nous accordons une importance capitale à la protection de
                    vos données personnelles, conformément au Règlement Général
                    sur la Protection des Données (RGPD).
                  </p>
                  <div>
                    <p className="font-bold text-zinc-700">Vos Droits :</p>
                    <ul className="list-disc ml-4 mt-1 space-y-1">
                      <li>Droit d'accès à vos données.</li>
                      <li>Droit de rectification ou d'effacement.</li>
                      <li>Droit à la portabilité de vos données.</li>
                      <li>Droit d'opposition au traitement.</li>
                    </ul>
                  </div>
                  <p>
                    Pour exercer vos droits, contactez notre Délégué à la
                    Protection des Données (DPO) à l'adresse :{" "}
                    <span className="font-bold">dpo@gomoku-app.fr</span>.
                  </p>
                  <p>
                    Les données collectées (Email Google, ELO, Historique) sont
                    utilisées uniquement pour le fonctionnement du jeu et ne
                    sont jamais revendues.
                  </p>
                </div>
              </section>

              {/* Terms of Service (CGU) */}
              <section className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Info size={20} className="text-zinc-500" />
                  Conditions Générales d'Utilisation
                </h3>
                <div className="text-xs text-zinc-500 space-y-2 leading-relaxed">
                  <p>
                    L'utilisation de l'application Gomoku implique l'acceptation
                    pleine et entière des présentes CGU.
                  </p>
                  <p>
                    Tout comportement malveillant, triche ou harcèlement dans le
                    chat en ligne pourra entraîner un bannissement définitif du
                    compte.
                  </p>
                  <button
                    onClick={() => setCurrentScreen("privacy")}
                    className="text-indigo-600 font-bold hover:underline mt-2 block"
                  >
                    Consulter la Politique de Confidentialité complète →
                  </button>
                </div>
              </section>

              <footer className="text-center py-4">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                  Version 1.2.0 • Fait avec ❤️ en France • Conforme RGPD
                </p>
              </footer>
            </div>
          </motion.div>
        )}

        {currentScreen === "privacy" && (
          <motion.div
            key="privacy"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen("support")}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">
                Politique de Confidentialité
              </h2>
            </header>

            <div className="space-y-8 text-sm text-zinc-600 leading-relaxed">
              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  1. Introduction
                </h3>
                <p>
                  La présente Politique de Confidentialité a pour but d'informer
                  les utilisateurs de l'application Gomoku sur la manière dont
                  leurs données personnelles sont collectées, traitées et
                  protégées, conformément au **Règlement Général sur la
                  Protection des Données (RGPD)** et à la **Loi Informatique et
                  Libertés**.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  2. Données Collectées
                </h3>
                <p className="mb-2">
                  Nous collectons uniquement les données strictement nécessaires
                  au bon fonctionnement du service :
                </p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>
                    <span className="font-bold text-zinc-800">Identité :</span>{" "}
                    Nom d'affichage, adresse email (via Google Auth), photo de
                    profil.
                  </li>
                  <li>
                    <span className="font-bold text-zinc-800">
                      Données de jeu :
                    </span>{" "}
                    Score ELO, historique des matchs, statistiques de jeu,
                    replays.
                  </li>
                  <li>
                    <span className="font-bold text-zinc-800">
                      Données techniques :
                    </span>{" "}
                    Adresse IP (pour la sécurité et le matchmaking), type
                    d'appareil, fuseau horaire.
                  </li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  3. Finalités du Traitement
                </h3>
                <p className="mb-2">
                  Vos données sont traitées pour les finalités suivantes :
                </p>
                <ul className="list-disc ml-5 space-y-2">
                  <li>
                    Gestion de votre compte utilisateur et authentification.
                  </li>
                  <li>
                    Calcul et affichage du classement mondial (Leaderboard).
                  </li>
                  <li>
                    Mise en relation des joueurs pour les parties en ligne
                    (Matchmaking).
                  </li>
                  <li>
                    Amélioration de l'expérience de jeu et support technique.
                  </li>
                  <li>Prévention de la fraude et de la triche.</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  4. Base Légale
                </h3>
                <p>
                  Le traitement de vos données repose sur votre **consentement**
                  (lors de la connexion via Google) et sur la **nécessité
                  contractuelle** de fournir le service de jeu en ligne.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  5. Conservation des Données
                </h3>
                <p>
                  Vos données sont conservées tant que votre compte est actif.
                  En cas d'inactivité prolongée (plus de 2 ans) ou sur simple
                  demande de votre part, vos données personnelles seront
                  supprimées ou anonymisées, à l'exception de celles dont la
                  conservation est requise par la loi.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  6. Destinataires des Données
                </h3>
                <p>
                  Vos données sont exclusivement destinées à Gomoku App. Elles
                  sont hébergées sur les serveurs sécurisés de **Google Cloud
                  Platform (GCP)** situés au sein de l'Union Européenne. Aucune
                  donnée n'est vendue ou louée à des tiers.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  7. Vos Droits (RGPD)
                </h3>
                <p className="mb-4">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">
                      Accès & Rectification
                    </h4>
                    <p className="text-xs">
                      Consulter et modifier vos informations à tout moment.
                    </p>
                  </div>
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">
                      Effacement (Droit à l'oubli)
                    </h4>
                    <p className="text-xs">
                      Demander la suppression définitive de votre compte.
                    </p>
                  </div>
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">
                      Portabilité
                    </h4>
                    <p className="text-xs">
                      Récupérer vos données dans un format structuré.
                    </p>
                  </div>
                  <div className="bg-zinc-100 p-4 rounded-2xl">
                    <h4 className="font-bold text-zinc-900 mb-1">Opposition</h4>
                    <p className="text-xs">
                      Refuser certains traitements de vos données.
                    </p>
                  </div>
                </div>
                <p className="mt-4">
                  Pour exercer ces droits, contactez notre DPO :{" "}
                  <span className="font-bold text-indigo-600">
                    dpo@gomoku-app.fr
                  </span>
                  .
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  8. Cookies
                </h3>
                <p>
                  Nous utilisons uniquement des cookies techniques essentiels à
                  l'authentification et au maintien de votre session. Aucun
                  cookie publicitaire ou de traçage tiers n'est utilisé.
                </p>
              </section>

              <section>
                <h3 className="text-lg font-black text-zinc-900 mb-4 uppercase tracking-tight">
                  9. Sécurité
                </h3>
                <p>
                  Nous mettons en œuvre des mesures de sécurité techniques et
                  organisationnelles (chiffrement SSL/TLS, contrôle d'accès
                  strict) pour protéger vos données contre tout accès non
                  autorisé ou perte.
                </p>
              </section>

              <footer className="pt-8 border-t border-zinc-200 text-center">
                <p className="text-xs font-bold text-zinc-400">
                  Dernière mise à jour : 26 Mars 2026
                </p>
                <button
                  onClick={() => setCurrentScreen("home")}
                  className="mt-6 px-8 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all"
                >
                  Retour à l'accueil
                </button>
              </footer>
            </div>
          </motion.div>
        )}

        {currentScreen === "online" && (
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
                  setCurrentScreen("home");
                  setPrivateRoomCode("");
                  if (isSearchingMatch) {
                    setIsSearchingMatch(false);
                    setSearchStartTime(null);
                    getSocket().emit("cancelSearch");
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
                    <h3 className="font-medium text-zinc-900 text-xl tracking-tight">
                      Finding an opponent...
                    </h3>
                    <p className="text-zinc-500 text-sm tracking-wide uppercase">
                      Matching skill level
                    </p>
                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-mono text-zinc-400">
                      <span>
                        {Math.floor(searchTimeElapsed / 60)
                          .toString()
                          .padStart(2, "0")}
                        :{(searchTimeElapsed % 60).toString().padStart(2, "0")}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsSearchingMatch(false);
                      setSearchStartTime(null);
                      getSocket().emit("cancelSearch");
                    }}
                    className="px-6 py-2.5 rounded-full border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:bg-zinc-50 font-medium text-sm transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              ) : privateRoomCode ? (
                <div className="text-center py-12">
                  <p className="text-zinc-500 text-sm mb-2">
                    Share this code with your friend:
                  </p>
                  <div className="text-4xl font-black tracking-widest bg-zinc-100 py-6 rounded-2xl mb-8">
                    {privateRoomCode}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-zinc-500 mb-8">
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-base">Waiting for opponent...</span>
                  </div>
                  <button
                    onClick={() => {
                      setPrivateRoomCode("");
                      getSocket().emit("leaveMatch", {
                        roomId: privateRoomCode,
                      });
                    }}
                    className="px-8 py-3 rounded-full border border-zinc-200 text-red-600 hover:bg-red-50 hover:border-red-200 font-medium transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                        Matchmaking Settings
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        <ShieldCheck size={14} />
                        <span>Connected</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-medium text-zinc-700 flex items-center gap-2">
                            <Globe size={16} className="text-zinc-400" />
                            Matchmaking Region
                          </label>
                          <button
                            onClick={handleGeolocate}
                            disabled={isLocating}
                            className="text-xs font-semibold text-zinc-500 hover:text-zinc-900 flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            {isLocating ? (
                              <Loader2 size={12} className="animate-spin" />
                            ) : (
                              <MapPin size={12} />
                            )}
                            {isLocating ? "Detecting..." : "Use My Location"}
                          </button>
                        </div>

                        <div className="relative">
                          <select
                            value={selectedRegion}
                            onChange={(e) => setSelectedRegion(e.target.value)}
                            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl pl-4 pr-10 py-3 text-base text-zinc-700 outline-none focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 transition-all appearance-none"
                          >
                            <option value="auto">Automatic (Best Ping)</option>
                            <option value="America/New_York">
                              North America (East)
                            </option>
                            <option value="America/Los_Angeles">
                              North America (West)
                            </option>
                            <option value="Europe/Paris">Europe (West)</option>
                            <option value="Europe/London">Europe (UK)</option>
                            <option value="Asia/Tokyo">Asia (Japan)</option>
                            <option value="Asia/Seoul">Asia (Korea)</option>
                            <option value="America/Sao_Paulo">
                              South America (Brazil)
                            </option>
                            <option value="Australia/Sydney">
                              Oceania (Australia)
                            </option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                            <ChevronRight size={18} className="rotate-90" />
                          </div>
                        </div>

                        {locationName && (
                          <p className="text-[10px] text-zinc-400 mt-2 flex items-center gap-1 px-1">
                            <Info size={10} />
                            Detected:{" "}
                            <span className="text-zinc-600 font-medium">
                              {locationName}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                      Quick Play
                    </h3>
                    <div className="space-y-3">
                      <button
                        onClick={() => {
                          setIsSearchingMatch(true);
                          setSearchStartTime(Date.now());
                          const region =
                            selectedRegion === "auto"
                              ? Intl.DateTimeFormat().resolvedOptions().timeZone
                              : selectedRegion;
                          const effectiveTimeLimit =
                            timeLimit === 0 ? 30 : timeLimit;
                          getSocket().emit("findMatch", {
                            type: "ranked",
                            boardSize,
                            ruleSet,
                            elo: playerElo,
                            userId: user?.uid,
                            region,
                            timeLimit: effectiveTimeLimit,
                          });
                        }}
                        className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold text-left transition-colors bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100"
                      >
                        <div className="p-3 bg-amber-100 rounded-xl text-amber-600">
                          <Trophy size={24} />
                        </div>
                        <div>
                          <div className="text-lg">Ranked Match</div>
                          <div className="text-sm font-normal text-zinc-500">
                            Play competitive matches and earn Elo
                          </div>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setIsSearchingMatch(true);
                          setSearchStartTime(Date.now());
                          const region =
                            selectedRegion === "auto"
                              ? Intl.DateTimeFormat().resolvedOptions().timeZone
                              : selectedRegion;
                          const effectiveTimeLimit =
                            timeLimit === 0 ? 30 : timeLimit;
                          getSocket().emit("findMatch", {
                            type: "casual",
                            boardSize,
                            ruleSet,
                            userId: user?.uid,
                            region,
                            timeLimit: effectiveTimeLimit,
                          });
                        }}
                        className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold text-left transition-colors bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100"
                      >
                        <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                          <Globe size={24} />
                        </div>
                        <div>
                          <div className="text-lg">Casual Match</div>
                          <div className="text-sm font-normal text-zinc-500">
                            Play for fun without affecting your rank
                          </div>
                        </div>
                      </button>
                    </div>
                  </section>

                  <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                      Private Room
                    </h3>
                    <div className="space-y-4">
                      <button
                        onClick={() => {
                          getSocket().emit("createPrivateRoom", {
                            boardSize,
                            ruleSet,
                            userId: user?.uid,
                            timeLimit,
                          });
                        }}
                        className="w-full flex items-center gap-4 py-4 px-5 rounded-2xl font-semibold text-left transition-colors bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border border-zinc-100"
                      >
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                          <Users size={24} />
                        </div>
                        <div>
                          <div className="text-lg">Create Private Room</div>
                          <div className="text-sm font-normal text-zinc-500">
                            Play with a friend using a room code
                          </div>
                        </div>
                      </button>

                      <div className="flex gap-3">
                        <input
                          type="text"
                          placeholder="Enter Room Code"
                          className="flex-1 bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 text-base uppercase outline-none focus:border-zinc-400 transition-colors"
                          value={joinRoomInput}
                          onChange={(e) =>
                            setJoinRoomInput(e.target.value.toUpperCase())
                          }
                          maxLength={6}
                        />
                        <button
                          onClick={() => {
                            if (joinRoomInput) {
                              getSocket().emit("joinPrivateRoom", {
                                roomId: joinRoomInput,
                                userId: user?.uid,
                              });
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
                </>
              )}
            </div>
          </motion.div>
        )}

        {currentScreen === "settings" && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute inset-0 flex flex-col p-6 max-w-2xl mx-auto w-full overflow-y-auto custom-scrollbar pb-24"
          >
            <header className="flex items-center gap-4 mb-8 shrink-0">
              <button
                onClick={() => setCurrentScreen("home")}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors -ml-2"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-2xl font-bold">Settings</h2>
            </header>

            <div className="space-y-6">
              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Game Rules
                </h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Monitor size={20} className="text-zinc-400" />
                      <div>
                        <p className="font-bold text-sm">UI Style</p>
                        <p className="text-xs text-zinc-400">
                          Choose the app's visual aesthetic.
                        </p>
                      </div>
                    </div>
                    <select
                      value={uiStyle}
                      onChange={(e) => setUiStyle(e.target.value as UiStyle)}
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="modern">Modern Glass</option>
                      <option value="zen">Zen Paper</option>
                      <option value="pixel">8-Bit Arcade</option>
                      <option value="cyberpunk">Cyberpunk Neon</option>
                      <option value="monochrome">Editorial Monochrome</option>
                      <option value="retro">70s Retro</option>
                      <option value="midnight">Deep Midnight</option>
                      <option value="nature">Nature Forest</option>
                      <option value="terminal">Classic Terminal</option>
                      <option value="bubblegum">Bubblegum Pop</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Grid size={20} className="text-zinc-400" />
                      <span className="font-medium">Board Size</span>
                    </div>
                    <select
                      value={boardSize}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBoardSize(
                          isNaN(Number(val)) ? val : (Number(val) as BoardSize),
                        );
                      }}
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value={13}>13 x 13 (Fast)</option>
                      <option value={15}>15 x 15 (Standard)</option>
                      <option value={19}>19 x 19 (Pro)</option>
                      <option value="19x35">19 x 35</option>
                      <option value="19x40">19 x 40</option>
                      <option value="19x45">19 x 45</option>
                      <option value="19x50">19 x 50</option>
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
                      <option value="casual">Casual (Gomoku)</option>
                      <option value="renju">Renju (Competitive)</option>
                    </select>
                  </div>
                  {ruleSet === "renju" && (
                    <div
                      className="px-4 pb-4 -mt-2 space-y-3"
                      id="renju-variant-options"
                    >
                      <p className="text-[10px] text-zinc-400 bg-zinc-50 p-2 rounded-lg border border-zinc-100">
                        <Scale size={10} className="inline mr-1" />
                        Customize Renju variant rules. These fouls apply only to
                        the Black player (starting player).
                      </p>
                      <div className="space-y-2 pl-2">
                        <div className="flex items-center justify-between group">
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                            Three Three (3x3)
                          </span>
                          <button
                            id="toggle-double-three"
                            onClick={() =>
                              setRenjuRules((prev) => ({
                                ...prev,
                                doubleThree: !prev.doubleThree,
                              }))
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${renjuRules.doubleThree ? "bg-zinc-900" : "bg-zinc-200"}`}
                            title={
                              renjuRules.doubleThree
                                ? "Double Three is forbidden"
                                : "Double Three allowed"
                            }
                          >
                            <div
                              className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${renjuRules.doubleThree ? "left-6" : "left-1"}`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-between group">
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                            Four Four (4x4)
                          </span>
                          <button
                            id="toggle-double-four"
                            onClick={() =>
                              setRenjuRules((prev) => ({
                                ...prev,
                                doubleFour: !prev.doubleFour,
                              }))
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${renjuRules.doubleFour ? "bg-zinc-900" : "bg-zinc-200"}`}
                            title={
                              renjuRules.doubleFour
                                ? "Double Four is forbidden"
                                : "Double Four allowed"
                            }
                          >
                            <div
                              className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${renjuRules.doubleFour ? "left-6" : "left-1"}`}
                            />
                          </button>
                        </div>
                        <div className="flex items-center justify-between group">
                          <span className="text-xs font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors">
                            Long Four / Overline (6+)
                          </span>
                          <button
                            id="toggle-overline"
                            onClick={() =>
                              setRenjuRules((prev) => ({
                                ...prev,
                                overline: !prev.overline,
                              }))
                            }
                            className={`w-10 h-5 rounded-full transition-all relative ${renjuRules.overline ? "bg-zinc-900" : "bg-zinc-200"}`}
                            title={
                              renjuRules.overline
                                ? "Overline is forbidden"
                                : "Overline allowed"
                            }
                          >
                            <div
                              className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${renjuRules.overline ? "left-6" : "left-1"}`}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <Cpu size={20} className="text-zinc-400" />
                      <span className="font-medium">AI Difficulty</span>
                    </div>
                    <select
                      value={aiDifficulty}
                      onChange={(e) =>
                        setAiDifficulty(e.target.value as Difficulty)
                      }
                      className="bg-zinc-100 border-none rounded-xl px-4 py-2 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                      <option value="Master">Master</option>
                      <option value="Grandmaster">Grandmaster</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3">
                      <UserCircle size={20} className="text-zinc-400" />
                      <span className="font-medium">Who Starts (PvE)</span>
                    </div>
                    <select
                      value={startingPlayer}
                      onChange={(e) =>
                        setStartingPlayer(e.target.value as StartingPlayer)
                      }
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
                      onChange={(e) =>
                        setTimeLimitSetting(
                          parseInt(e.target.value) as TimeLimit,
                        )
                      }
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
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Character & Theme
                </h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="p-4 border-b border-zinc-100">
                    <div className="flex items-center gap-3 mb-4">
                      <User size={20} className="text-zinc-400" />
                      <span className="font-medium">Select Character</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                      {[
                        ...CHARACTERS,
                        ...(userProfile?.customCharacters || []),
                      ].filter(char => 
                        userProfile?.unlockedCharacters?.includes(char.id) || ['master_lin'].includes(char.id) || char.isCustom
                      ).map((char) => {
                        const charColor = char.color
                          ? COLOR_MAP[char.color.toLowerCase()] || char.color
                          : "#6b7280";
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
                                ? "bg-white shadow-md ring-2 ring-offset-2"
                                : "border-transparent bg-zinc-50/50 hover:bg-zinc-100 hover:shadow-sm"
                            }`}
                            style={{
                              borderColor:
                                selectedCharacterId === char.id
                                  ? charColor
                                  : "transparent",
                              ringColor: charColor,
                            }}
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
                              <span className="text-sm font-bold text-zinc-900 block truncate">
                                {char.name}
                              </span>
                              <span className="text-[10px] text-zinc-500 line-clamp-2 mt-0.5 leading-tight opacity-90">
                                {char.bio}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                      <Palette size={20} className="text-zinc-400" />
                      <span className="font-medium">Board & Stone Theme</span>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-6 snap-x custom-scrollbar -mx-2 px-2">
                      {allSkins.map((skin) => {
                        const isBlackHex = /^#([0-9A-F]{3}){1,2}$/i.test(
                          skin.blackStone,
                        );
                        const isWhiteHex = /^#([0-9A-F]{3}){1,2}$/i.test(
                          skin.whiteStone,
                        );
                        return (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            whileHover={{ scale: 1.05, y: -4 }}
                            key={
                              skin.id + (skin.isCustom ? `_${skin.name}` : "")
                            }
                            onClick={() => setSelectedSkinId(skin.id)}
                            className={`flex flex-col flex-shrink-0 items-center p-4 rounded-[2rem] border-[3px] transition-all w-36 snap-start relative overflow-hidden ${
                              selectedSkinId === skin.id
                                ? "border-zinc-900 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
                                : "border-transparent bg-zinc-50 hover:bg-zinc-100/80 shadow-sm"
                            }`}
                          >
                            {selectedSkinId === skin.id && (
                              <div className="absolute top-2 right-2 w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center text-white z-10">
                                <Check size={12} strokeWidth={4} />
                              </div>
                            )}
                            <div
                              className="w-full h-20 rounded-2xl mb-4 flex items-center justify-center gap-3 shadow-inner relative overflow-hidden"
                              style={{ backgroundColor: skin.boardColor }}
                            >
                              <div
                                className="absolute inset-0 opacity-20 pointer-events-none"
                                style={{
                                  backgroundImage:
                                    "linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)",
                                  backgroundSize: "10px 10px",
                                  backgroundPosition: "0 0, 5px 5px",
                                }}
                              />
                              <div
                                className={`w-6 h-6 rounded-full shadow-lg border border-black/10 z-10 ${!isBlackHex ? skin.blackStone : ""}`}
                                style={
                                  isBlackHex
                                    ? { backgroundColor: skin.blackStone }
                                    : {}
                                }
                              />
                              <div
                                className={`w-6 h-6 rounded-full shadow-lg border border-black/10 z-10 ${!isWhiteHex ? skin.whiteStone : ""}`}
                                style={
                                  isWhiteHex
                                    ? { backgroundColor: skin.whiteStone }
                                    : {}
                                }
                              />
                            </div>
                            <span
                              className={`text-sm font-black text-center leading-tight ${selectedSkinId === skin.id ? "text-zinc-900" : "text-zinc-500 group-hover:text-zinc-700"}`}
                            >
                              {skin.name}
                            </span>
                            {skin.serialNumber && (
                              <div className={`flex items-center gap-1 mt-1 text-[8px] uppercase font-mono font-bold tracking-widest ${selectedSkinId === skin.id ? "text-zinc-600" : "text-zinc-400"}`}>
                                <QrCode size={10} />
                                <span>{skin.serialNumber}</span>
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Appearance
                </h3>
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
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        defaultChecked
                      />
                      <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                    </label>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Audio
                </h3>
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
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-wider mb-4">
                  Account
                </h3>
                <div className="bg-white rounded-3xl border border-zinc-100 overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-zinc-50/50">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-white overflow-hidden shadow-sm">
                        {user?.photoURL ? (
                          <img
                            src={user.photoURL}
                            alt="Profile"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <User size={24} />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">
                          {user?.displayName || "Player"}
                        </p>
                        <p className="text-xs font-medium text-zinc-500">
                          {user?.email}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setCurrentScreen("home");
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
                  <h4 className="text-xs font-bold text-red-500 uppercase tracking-widest mb-4">
                    Zone de Danger
                  </h4>
                  <button
                    onClick={deleteAccount}
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-100 transition-colors"
                  >
                    <X size={20} />
                    Supprimer mon compte et mes données
                  </button>
                  <p className="mt-4 text-[10px] text-zinc-400 text-center leading-relaxed">
                    Conformément au RGPD, vous avez le droit à l'effacement de
                    vos données. Cette action supprimera définitivement votre
                    profil, votre ELO et votre historique de matchs.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
        {currentScreen === "tutorial" && (
          <motion.div
            key="tutorial"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 bg-zinc-50 overflow-y-auto"
          >
            <TutorialScreen onBack={() => setCurrentScreen("home")} />
          </motion.div>
        )}
        {currentScreen === "openings" && (
          <motion.div
            key="openings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0"
          >
            <OpeningExplorer onBack={() => setCurrentScreen("home")} />
          </motion.div>
        )}
        {currentScreen === "daily" && (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0"
          >
            <DailyPuzzle onBack={() => setCurrentScreen("home")} />
          </motion.div>
        )}
        {currentScreen === "shop" && (
          <motion.div
            key="shop"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 z-10"
          >
            <ZenShop
              userProfile={userProfile}
              onBack={() => setCurrentScreen("home")}
              onBuyItem={handleBuyItem}
              onEquipItem={handleEquipItem}
              onOpenSkinDesigner={() => setIsCreatingSkin(true)}
              onOpenCharDesigner={() => setIsCreatingChar(true)}
            />
          </motion.div>
        )}
        {currentScreen === "profile" && (
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
                  onClick={() => setCurrentScreen("home")}
                  className="p-3 bg-white rounded-2xl shadow-sm border border-zinc-100 hover:bg-zinc-50 transition-colors"
                >
                  <ChevronLeft size={24} />
                </button>
                <h2 className="text-3xl font-black tracking-tighter">
                  My Profile
                </h2>
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
                    <div
                      onClick={() => setIsEditingAvatar(true)}
                      className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                    >
                      <RefreshCw size={24} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-3xl font-black tracking-tighter mb-1">
                      {userProfile?.displayName}
                    </h3>
                    <p className="text-zinc-400 font-bold text-sm tracking-widest uppercase mb-4">
                      {playerElo} ELO • {getRankTier(playerElo).name}
                    </p>
                    <p className="text-zinc-600 font-medium leading-relaxed max-w-md">
                      {userProfile?.bio ||
                        "No bio yet. Tell the world about your Gomoku strategy!"}
                    </p>
                  </div>
                </div>
              </section>

              {/* Achievements Section */}
              <section className="mt-12 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100/50 relative overflow-hidden">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Trophy size={20} className="text-zinc-900" /> My
                      Achievements
                    </h3>
                    <p className="text-zinc-500 text-sm mt-1">
                      Milestones you have reached.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userProfile?.achievements?.map((achiev) => {
                    const data = ACHIEVEMENTS.find((a) => a.id === achiev.id);
                    if (!data) return null;
                    return (
                      <div
                        key={achiev.id}
                        className="bg-amber-50 border border-amber-100 p-4 rounded-3xl flex items-center gap-4"
                      >
                        <div className="text-3xl">{data.icon}</div>
                        <div>
                          <h4 className="font-bold text-amber-900">
                            {data.name}
                          </h4>
                          <p className="text-xs text-amber-700">
                            {data.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {(!userProfile?.achievements ||
                    userProfile.achievements.length === 0) && (
                    <p className="text-zinc-500 text-sm w-full py-4 text-center sm:col-span-2">
                      No achievements yet. Keep playing!
                    </p>
                  )}
                </div>
              </section>

              {/* Past Seasons Section */}
              {userProfile?.seasonRankings &&
                userProfile.seasonRankings.length > 0 && (
                  <section className="mt-12 bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-100/50">
                    <div className="flex items-center justify-between mb-8">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2">
                          <Crown size={20} className="text-zinc-900" /> Past
                          Seasons
                        </h3>
                        <p className="text-zinc-500 text-sm mt-1">
                          Your legacy across ranked seasons.
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {userProfile.seasonRankings.map((season, i) => (
                        <div
                          key={i}
                          className="bg-indigo-50 border border-indigo-100 p-4 rounded-3xl flex items-center justify-between gap-4"
                        >
                          <div>
                            <h4 className="font-bold text-indigo-900">
                              Season {season.season}
                            </h4>
                            <p className="text-xs text-indigo-700">
                              {season.title}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-indigo-900">
                              {season.rank}
                            </p>
                            <p className="text-xs text-indigo-700">
                              {season.elo} ELO
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
            </div>

            {/* Creation Modals */}
            <AnimatePresence>
              {isEditingAvatar && (
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
                    className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                  >
                    <div className="flex items-center justify-between mb-6 shrink-0">
                      <h3 className="text-2xl font-black">Choose Avatar</h3>
                      <button
                        onClick={() => setIsEditingAvatar(false)}
                        className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar pr-2 pb-4">
                      <h4 className="font-bold text-zinc-900 mb-3">
                        Predefined Avatars
                      </h4>
                      <div className="grid grid-cols-4 gap-4 mb-8">
                        {PREDEFINED_AVATARS.map((url, i) => (
                          <button
                            key={i}
                            onClick={() => updateAvatar(url)}
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

                      <h4 className="font-bold text-zinc-900 mb-3">
                        Upload Custom
                      </h4>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-zinc-300 rounded-2xl cursor-pointer hover:bg-zinc-50 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <RefreshCw size={24} className="mb-2 text-zinc-400" />
                          <p className="mb-1 text-sm text-zinc-500">
                            <span className="font-semibold">
                              Click to upload
                            </span>
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
                  </motion.div>
                </motion.div>
              )}

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
                      <h3 className="text-2xl font-black tracking-tighter uppercase">
                        New Character
                      </h3>
                      <button
                        onClick={() => setIsCreatingChar(false)}
                        className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
                      >
                        <X size={24} />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Live Preview */}
                      <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 flex items-center gap-4">
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
                          <h4 className="font-bold text-zinc-900">
                            {newCharName || "Character Name"}
                          </h4>
                          <p className="text-xs text-zinc-500 line-clamp-2">
                            {newCharBio ||
                              "Character biography will appear here..."}
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
                          placeholder="e.g. Shadow Master"
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">
                          Avatar URL
                        </label>
                        <input
                          type="text"
                          value={newCharAvatar}
                          onChange={(e) => setNewCharAvatar(e.target.value)}
                          placeholder="https://..."
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
                          placeholder="A short story about your character..."
                          className="w-full bg-zinc-100 border-none rounded-2xl px-4 py-3 font-medium outline-none focus:ring-2 focus:ring-zinc-900 h-24 resize-none"
                        />
                      </div>
                      <motion.button
                        whileHover={
                          newCharName && newCharAvatar ? { scale: 1.02 } : {}
                        }
                        whileTap={
                          newCharName && newCharAvatar ? { scale: 0.98 } : {}
                        }
                        onClick={handleCreateCustomCharacter}
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
        dragConstraints={{
          left: -window.innerWidth + 50,
          right: 0,
          top: -window.innerHeight + 50,
          bottom: 0,
        }}
        dragElastic={0.1}
        onDragStart={() => {
          if (ambientBtnTimeoutRef.current)
            clearTimeout(ambientBtnTimeoutRef.current);
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
          boxShadow:
            ambientColor !== "transparent" && !isAmbientBtnCollapsed
              ? `0 10px 25px -5px ${ambientColor}80`
              : undefined,
        }}
      >
        {!isAmbientBtnCollapsed && (
          <Palette
            size={24}
            color={
              ambientColor !== "transparent" ? ambientColor : "currentColor"
            }
          />
        )}
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
