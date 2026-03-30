import express from 'express';
import { createServer as createViteServer } from 'vite';
import { Server } from 'socket.io';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Simple game state types (matching client)
type Player = 'black' | 'white' | null;
type BoardState = Player[][];

interface Room {
  id: string;
  type: 'ranked' | 'casual' | 'private';
  players: {
    black: string | null;
    white: string | null;
  };
  playerData?: {
    black: { elo: number, userId: string } | null;
    white: { elo: number, userId: string } | null;
  };
  board: BoardState;
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  boardSize: number;
  ruleSet: string;
  timeLimit: number;
  lastMoveTime: number;
}

interface QueuedPlayer {
  socketId: string;
  userId: string;
  elo: number;
  boardSize: number;
  ruleSet: string;
  region: string;
  timeLimit: number;
  joinTime: number;
}

const rooms = new Map<string, Room>();
const waitingPlayers = {
  ranked: [] as QueuedPlayer[],
  casual: [] as QueuedPlayer[],
};

function calculateElo(rating1: number, rating2: number, score1: number) {
  const expected1 = 1 / (1 + Math.pow(10, (rating2 - rating1) / 400));
  const k = 32;
  return Math.round(rating1 + k * (score1 - expected1));
}

function createEmptyBoard(size: number): BoardState {
  return Array.from({ length: size }, () => Array(size).fill(null));
}

// Basic win check for server validation
function checkWin(board: BoardState, row: number, col: number, player: Player, isRenju: boolean = false): [number, number][] | null {
  const size = board.length;
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

  for (const [dr, dc] of directions) {
    let count = 1;
    const line: [number, number][] = [[row, col]];
    
    for (let i = 1; i < size; i++) {
      const r = row + dr * i;
      const c = col + dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        count++;
        line.push([r, c]);
      } else break;
    }
    for (let i = 1; i < size; i++) {
      const r = row - dr * i;
      const c = col - dc * i;
      if (r >= 0 && r < size && c >= 0 && c < size && board[r][c] === player) {
        count++;
        line.push([r, c]);
      } else break;
    }

    if (isRenju && player === 'black' && count > 5) {
      continue; // Overline is a foul for black in Renju
    }

    if (count >= 5) return line.slice(0, 5);
  }
  return null;
}

function isBoardFull(board: BoardState): boolean {
  return board.every(row => row.every(cell => cell !== null));
}

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());
  app.use(cookieParser());

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*' }
  });

  function createMatch(p1: QueuedPlayer, p2: QueuedPlayer, type: 'ranked' | 'casual') {
    const roomId = `room_${Math.random().toString(36).substring(2, 9)}`;
    
    rooms.set(roomId, {
      id: roomId,
      type,
      players: { black: p1.socketId, white: p2.socketId },
      playerData: {
        black: { elo: p1.elo, userId: p1.userId },
        white: { elo: p2.elo, userId: p2.userId }
      },
      board: createEmptyBoard(p1.boardSize),
      currentPlayer: 'black',
      winner: null,
      boardSize: p1.boardSize,
      ruleSet: p1.ruleSet,
      timeLimit: p1.timeLimit,
      lastMoveTime: Date.now()
    });

    const socket1 = io.sockets.sockets.get(p1.socketId);
    const socket2 = io.sockets.sockets.get(p2.socketId);

    socket1?.join(roomId);
    socket2?.join(roomId);

    io.to(roomId).emit('matchFound', {
      roomId,
      players: { black: p1.socketId, white: p2.socketId },
      playerData: {
        black: { elo: p1.elo, userId: p1.userId },
        white: { elo: p2.elo, userId: p2.userId }
      },
      boardSize: p1.boardSize,
      timeLimit: p1.timeLimit
    });
  }

  // Matchmaking loop
  setInterval(() => {
    const now = Date.now();

    // Ranked Matchmaking
    const rankedQueue = waitingPlayers.ranked;
    const matchedRanked = new Set<string>();

    for (let i = 0; i < rankedQueue.length; i++) {
      const p1 = rankedQueue[i];
      if (matchedRanked.has(p1.socketId)) continue;

      const timeInQueue1 = now - p1.joinTime;
      const maxEloDiff1 = 50 + Math.floor(timeInQueue1 / 1000) * 10;

      for (let j = i + 1; j < rankedQueue.length; j++) {
        const p2 = rankedQueue[j];
        if (matchedRanked.has(p2.socketId)) continue;
        if (p2.socketId === p1.socketId) continue;
        // Allow same user to match against themselves for testing purposes in this environment
        if (p1.boardSize !== p2.boardSize) continue;
        if (p1.ruleSet !== p2.ruleSet) continue;
        if (p1.timeLimit !== p2.timeLimit) continue;

        const timeInQueue2 = now - p2.joinTime;
        const maxEloDiff2 = 50 + Math.floor(timeInQueue2 / 1000) * 10;

        // Region matching: prefer same region, but expand over time
        const sameRegion = p1.region === p2.region;
        if (!sameRegion && timeInQueue1 < 5000 && timeInQueue2 < 5000) {
          continue; // Wait at least 5 seconds before matching cross-region
        }

        const eloDiff = Math.abs(p1.elo - p2.elo);

        if (eloDiff <= maxEloDiff1 && eloDiff <= maxEloDiff2) {
          matchedRanked.add(p1.socketId);
          matchedRanked.add(p2.socketId);
          createMatch(p1, p2, 'ranked');
          break;
        }
      }
    }

    waitingPlayers.ranked = waitingPlayers.ranked.filter(p => !matchedRanked.has(p.socketId));

    // Casual Matchmaking
    const casualQueue = waitingPlayers.casual;
    const matchedCasual = new Set<string>();

    for (let i = 0; i < casualQueue.length; i++) {
      const p1 = casualQueue[i];
      if (matchedCasual.has(p1.socketId)) continue;

      for (let j = i + 1; j < casualQueue.length; j++) {
        const p2 = casualQueue[j];
        if (matchedCasual.has(p2.socketId)) continue;
        if (p2.socketId === p1.socketId) continue;
        // Allow same user to match against themselves for testing purposes in this environment
        if (p1.boardSize !== p2.boardSize) continue;
        if (p1.ruleSet !== p2.ruleSet) continue;
        if (p1.timeLimit !== p2.timeLimit) continue;

        const timeInQueue1 = now - p1.joinTime;
        const timeInQueue2 = now - p2.joinTime;

        // Region matching: prefer same region, but expand over time
        const sameRegion = p1.region === p2.region;
        if (!sameRegion && timeInQueue1 < 3000 && timeInQueue2 < 3000) {
          continue; // Wait at least 3 seconds before matching cross-region in casual
        }

        matchedCasual.add(p1.socketId);
        matchedCasual.add(p2.socketId);
        createMatch(p1, p2, 'casual');
        break;
      }
    }

    waitingPlayers.casual = waitingPlayers.casual.filter(p => !matchedCasual.has(p.socketId));

  }, 1000);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // --- Music OAuth Routes ---

  const getRedirectUri = (req: express.Request, provider: string) => {
    const host = req.get('host');
    const protocol = req.protocol;
    // Use the APP_URL if available, otherwise fallback to request host
    const origin = process.env.APP_URL || `${protocol}://${host}`;
    return `${origin}/api/auth/${provider}/callback`;
  };

  // Spotify
  app.get('/api/auth/spotify/url', (req, res) => {
    const scope = 'user-read-private user-read-email user-modify-playback-state user-read-playback-state streaming';
    const params = new URLSearchParams({
      client_id: process.env.SPOTIFY_CLIENT_ID!,
      response_type: 'code',
      redirect_uri: getRedirectUri(req, 'spotify'),
      scope: scope,
    });
    res.json({ url: `https://accounts.spotify.com/authorize?${params.toString()}` });
  });

  app.get('/api/auth/spotify/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
        grant_type: 'authorization_code',
        code: code as string,
        redirect_uri: getRedirectUri(req, 'spotify'),
        client_id: process.env.SPOTIFY_CLIENT_ID!,
        client_secret: process.env.SPOTIFY_CLIENT_SECRET!,
      }).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });

      const { access_token, refresh_token, expires_in } = response.data;
      res.cookie('spotify_token', access_token, { 
        httpOnly: true, secure: true, sameSite: 'none', maxAge: expires_in * 1000 
      });
      
      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'spotify' }, '*');
              window.close();
            </script>
            <p>Spotify connected! Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Spotify OAuth error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // Deezer
  app.get('/api/auth/deezer/url', (req, res) => {
    const params = new URLSearchParams({
      app_id: process.env.DEEZER_APP_ID!,
      redirect_uri: getRedirectUri(req, 'deezer'),
      perms: 'basic_access,email,offline_access,manage_library',
    });
    res.json({ url: `https://connect.deezer.com/oauth/auth.php?${params.toString()}` });
  });

  app.get('/api/auth/deezer/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const response = await axios.get(`https://connect.deezer.com/oauth/access_token.php`, {
        params: {
          app_id: process.env.DEEZER_APP_ID!,
          secret: process.env.DEEZER_APP_SECRET!,
          code: code as string,
          output: 'json'
        }
      });

      const { access_token, expires } = response.data;
      res.cookie('deezer_token', access_token, { 
        httpOnly: true, secure: true, sameSite: 'none', maxAge: (expires || 3600) * 1000 
      });

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'deezer' }, '*');
              window.close();
            </script>
            <p>Deezer connected! Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('Deezer OAuth error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  // YouTube Music (Google)
  app.get('/api/auth/youtube/url', (req, res) => {
    const scope = 'https://www.googleapis.com/auth/youtube.readonly';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: getRedirectUri(req, 'youtube'),
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent'
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  app.get('/api/auth/youtube/callback', async (req, res) => {
    const { code } = req.query;
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code: code as string,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: getRedirectUri(req, 'youtube'),
        grant_type: 'authorization_code',
      });

      const { access_token, expires_in } = response.data;
      res.cookie('youtube_token', access_token, { 
        httpOnly: true, secure: true, sameSite: 'none', maxAge: expires_in * 1000 
      });

      res.send(`
        <html>
          <body>
            <script>
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', provider: 'youtube' }, '*');
              window.close();
            </script>
            <p>YouTube Music connected! Closing window...</p>
          </body>
        </html>
      `);
    } catch (error) {
      console.error('YouTube OAuth error:', error);
      res.status(500).send('Authentication failed');
    }
  });

  app.get('/api/music/status', (req, res) => {
    res.json({
      spotify: !!req.cookies.spotify_token,
      deezer: !!req.cookies.deezer_token,
      youtube: !!req.cookies.youtube_token,
    });
  });

  app.get('/api/music/search', async (req, res) => {
    const { q } = req.query;
    const results: any[] = [];

    // Spotify Search
    if (req.cookies.spotify_token) {
      try {
        const spotifyRes = await axios.get(`https://api.spotify.com/v1/search`, {
          params: { q, type: 'track', limit: 5 },
          headers: { Authorization: `Bearer ${req.cookies.spotify_token}` }
        });
        results.push(...spotifyRes.data.tracks.items.map((item: any) => ({
          id: item.id,
          title: item.name,
          artist: item.artists[0].name,
          album: item.album.name,
          artwork: item.album.images[0]?.url,
          provider: 'spotify',
          uri: item.uri
        })));
      } catch (e) { console.error('Spotify search failed'); }
    }

    // Deezer Search
    try {
      const deezerRes = await axios.get(`https://api.deezer.com/search`, {
        params: { q, limit: 5 }
      });
      results.push(...deezerRes.data.data.map((item: any) => ({
        id: item.id,
        title: item.title,
        artist: item.artist.name,
        album: item.album.title,
        artwork: item.album.cover_medium,
        provider: 'deezer',
        uri: item.link
      })));
    } catch (e) { console.error('Deezer search failed'); }

    res.json(results);
  });

  app.post('/api/music/logout', (req, res) => {
    const { provider } = req.body;
    if (provider === 'spotify') res.clearCookie('spotify_token');
    if (provider === 'deezer') res.clearCookie('deezer_token');
    if (provider === 'youtube') res.clearCookie('youtube_token');
    res.json({ success: true });
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('findMatch', ({ type, boardSize, ruleSet, elo, userId, region, timeLimit }: { type: 'ranked' | 'casual', boardSize: number, ruleSet: string, elo?: number, userId?: string, region?: string, timeLimit?: number }) => {
      const queue = waitingPlayers[type];
      if (!queue.some(p => p.socketId === socket.id)) {
        queue.push({ 
          socketId: socket.id, 
          elo: elo || 1200, 
          userId: userId || 'anon',
          boardSize,
          ruleSet: ruleSet || 'casual',
          region: region || 'unknown',
          timeLimit: timeLimit || 30,
          joinTime: Date.now()
        });
      }
    });

    socket.on('cancelSearch', () => {
      waitingPlayers.ranked = waitingPlayers.ranked.filter(p => p.socketId !== socket.id);
      waitingPlayers.casual = waitingPlayers.casual.filter(p => p.socketId !== socket.id);
    });

    socket.on('createPrivateRoom', ({ boardSize, ruleSet, userId, timeLimit }) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      rooms.set(roomId, {
        id: roomId,
        type: 'private',
        players: { black: socket.id, white: null },
        playerData: {
          black: { elo: 1200, userId: userId || 'anon' },
          white: null
        },
        board: createEmptyBoard(boardSize),
        currentPlayer: 'black',
        winner: null,
        boardSize,
        ruleSet: ruleSet || 'casual',
        timeLimit: timeLimit || 30,
        lastMoveTime: Date.now()
      });
      socket.join(roomId);
      socket.emit('privateRoomCreated', { roomId });
    });

    socket.on('joinPrivateRoom', ({ roomId, userId }) => {
      const room = rooms.get(roomId);
      if (room && !room.players.white) {
        room.players.white = socket.id;
        if (room.playerData) {
          room.playerData.white = { elo: 1200, userId: userId || 'anon' };
        }
        socket.join(roomId);
        room.lastMoveTime = Date.now(); // Reset timer when game starts
        io.to(roomId).emit('matchFound', {
          roomId,
          players: room.players,
          playerData: room.playerData,
          boardSize: room.boardSize,
          timeLimit: room.timeLimit
        });
      } else {
        socket.emit('error', { message: 'Room not found or full' });
      }
    });

    socket.on('sendMessage', ({ roomId, text, timestamp }) => {
      const room = rooms.get(roomId);
      if (room) {
        socket.to(roomId).emit('receiveMessage', {
          sender: `Player ${socket.id.substring(0, 4)}`,
          text,
          timestamp
        });
      }
    });

    socket.on('makeMove', ({ roomId, row, col }) => {
      const room = rooms.get(roomId);
      if (!room || room.winner) return;

      const isBlack = room.players.black === socket.id;
      const isWhite = room.players.white === socket.id;
      const playerColor = isBlack ? 'black' : isWhite ? 'white' : null;

      if (playerColor !== room.currentPlayer) return;
      if (room.board[row][col] !== null) return;

      // Check for timeout
      if (room.timeLimit > 0) {
        const timeElapsed = (Date.now() - room.lastMoveTime) / 1000;
        if (timeElapsed > room.timeLimit + 2) { // 2 seconds grace period
          // Timeout occurred, handled by the interval loop
          return;
        }
      }

      room.board[row][col] = playerColor;
      room.lastMoveTime = Date.now();
      
      const winLine = checkWin(room.board, row, col, playerColor, room.ruleSet === 'renju');
      let newEloBlack, newEloWhite;

      if (winLine || isBoardFull(room.board)) {
        room.winner = winLine ? playerColor : 'draw';
        
        if (room.type === 'ranked' && room.playerData) {
          const scoreBlack = room.winner === 'black' ? 1 : room.winner === 'white' ? 0 : 0.5;
          const scoreWhite = room.winner === 'white' ? 1 : room.winner === 'black' ? 0 : 0.5;
          
          newEloBlack = calculateElo(room.playerData.black!.elo, room.playerData.white!.elo, scoreBlack);
          newEloWhite = calculateElo(room.playerData.white!.elo, room.playerData.black!.elo, scoreWhite);
        }
      } else {
        room.currentPlayer = playerColor === 'black' ? 'white' : 'black';
      }

      io.to(roomId).emit('moveMade', {
        row, col, player: playerColor,
        nextPlayer: room.currentPlayer,
        winner: room.winner,
        winningLine: winLine,
        newElo: newEloBlack ? { black: newEloBlack, white: newEloWhite } : undefined
      });
    });

    socket.on('forfeitMatch', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room && !room.winner) {
        const winner = room.players.black === socket.id ? 'white' : 'black';
        room.winner = winner;
        let newEloBlack, newEloWhite;
        
        if (room.type === 'ranked' && room.playerData) {
          const scoreBlack = winner === 'black' ? 1 : 0;
          const scoreWhite = winner === 'white' ? 1 : 0;
          
          newEloBlack = calculateElo(room.playerData.black!.elo, room.playerData.white!.elo, scoreBlack);
          newEloWhite = calculateElo(room.playerData.white!.elo, room.playerData.black!.elo, scoreWhite);
        }
        
        io.to(roomId).emit('matchForfeited', { 
          winner,
          forfeitedBy: socket.id,
          newElo: newEloBlack ? { black: newEloBlack, white: newEloWhite } : undefined
        });
      }
    });

    socket.on('leaveMatch', ({ roomId }) => {
      const room = rooms.get(roomId);
      if (room) {
        const winner = room.players.black === socket.id ? 'white' : 'black';
        let newEloBlack, newEloWhite;
        
        if (room.type === 'ranked' && room.playerData && !room.winner) {
          const scoreBlack = winner === 'black' ? 1 : 0;
          const scoreWhite = winner === 'white' ? 1 : 0;
          
          newEloBlack = calculateElo(room.playerData.black!.elo, room.playerData.white!.elo, scoreBlack);
          newEloWhite = calculateElo(room.playerData.white!.elo, room.playerData.black!.elo, scoreWhite);
        }
        
        io.to(roomId).emit('opponentLeft', { 
          winner,
          newElo: newEloBlack ? { black: newEloBlack, white: newEloWhite } : undefined
        });
        rooms.delete(roomId);
      }
    });

    socket.on('disconnect', () => {
      waitingPlayers.ranked = waitingPlayers.ranked.filter(p => p.socketId !== socket.id);
      waitingPlayers.casual = waitingPlayers.casual.filter(p => p.socketId !== socket.id);
      
      for (const [roomId, room] of rooms.entries()) {
        if (room.players.black === socket.id || room.players.white === socket.id) {
          const winner = room.players.black === socket.id ? 'white' : 'black';
          let newEloBlack, newEloWhite;
          
          if (room.type === 'ranked' && room.playerData && !room.winner) {
            const scoreBlack = winner === 'black' ? 1 : 0;
            const scoreWhite = winner === 'white' ? 1 : 0;
            
            newEloBlack = calculateElo(room.playerData.black!.elo, room.playerData.white!.elo, scoreBlack);
            newEloWhite = calculateElo(room.playerData.white!.elo, room.playerData.black!.elo, scoreWhite);
          }

          io.to(roomId).emit('opponentLeft', { 
            winner,
            newElo: newEloBlack ? { black: newEloBlack, white: newEloWhite } : undefined
          });
          rooms.delete(roomId);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Timeout checking loop
  setInterval(() => {
    const now = Date.now();
    for (const [roomId, room] of rooms.entries()) {
      if (room.winner || room.timeLimit === 0 || !room.players.black || !room.players.white) continue;

      const timeElapsed = (now - room.lastMoveTime) / 1000;
      if (timeElapsed > room.timeLimit + 2) { // 2 seconds grace period
        // Player timed out
        const winner = room.currentPlayer === 'black' ? 'white' : 'black';
        room.winner = winner;

        let newEloBlack, newEloWhite;
        if (room.type === 'ranked' && room.playerData) {
          const scoreBlack = winner === 'black' ? 1 : 0;
          const scoreWhite = winner === 'white' ? 1 : 0;
          
          newEloBlack = calculateElo(room.playerData.black!.elo, room.playerData.white!.elo, scoreBlack);
          newEloWhite = calculateElo(room.playerData.white!.elo, room.playerData.black!.elo, scoreWhite);
        }

        io.to(roomId).emit('opponentLeft', {
          winner,
          reason: 'timeout',
          newElo: newEloBlack ? { black: newEloBlack, white: newEloWhite } : undefined
        });
        
        rooms.delete(roomId);
      }
    }
  }, 1000);

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
