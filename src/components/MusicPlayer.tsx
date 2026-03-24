import React, { useState, useEffect } from 'react';
import { Music, Search, Disc, ExternalLink, LogIn, LogOut, Loader2, Music2, Youtube, Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  artwork: string;
  provider: 'spotify' | 'deezer' | 'youtube';
  uri: string;
}

interface MusicStatus {
  spotify: boolean;
  deezer: boolean;
  youtube: boolean;
}

export function MusicPlayer() {
  const [status, setStatus] = useState<MusicStatus>({ spotify: false, deezer: false, youtube: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [activeTrack, setActiveTrack] = useState<Track | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/music/status');
      const data = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Failed to fetch music status');
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        fetchStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (provider: string) => {
    try {
      const res = await fetch(`/api/auth/${provider}/url`);
      const { url } = await res.json();
      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (e) {
      console.error(`Failed to connect to ${provider}`);
    }
  };

  const handleLogout = async (provider: string) => {
    try {
      await fetch('/api/music/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider })
      });
      fetchStatus();
    } catch (e) {
      console.error(`Failed to logout from ${provider}`);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/music/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      setResults(data);
    } catch (e) {
      console.error('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  const getEmbedUrl = (track: Track) => {
    if (track.provider === 'spotify') {
      return `https://open.spotify.com/embed/track/${track.id}`;
    }
    if (track.provider === 'deezer') {
      return `https://www.deezer.com/plugins/player?format=classic&autoplay=false&playlist=false&width=700&height=350&color=ff0000&layout=dark&size=medium&type=tracks&id=${track.id}&app_id=1`;
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[2.5rem] shadow-xl border border-zinc-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-900 rounded-full flex items-center justify-center text-white shadow-lg">
            <Music size={20} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight">Music Player</h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Connected Services</p>
          </div>
        </div>
        <div className="flex gap-2">
          <ProviderBadge 
            provider="spotify" 
            connected={status.spotify} 
            onConnect={() => handleConnect('spotify')} 
            onLogout={() => handleLogout('spotify')}
          />
          <ProviderBadge 
            provider="deezer" 
            connected={status.deezer} 
            onConnect={() => handleConnect('deezer')} 
            onLogout={() => handleLogout('deezer')}
          />
          <ProviderBadge 
            provider="youtube" 
            connected={status.youtube} 
            onConnect={() => handleConnect('youtube')} 
            onLogout={() => handleLogout('youtube')}
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-zinc-100">
        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Search for songs, artists..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-zinc-100 border-none rounded-2xl font-medium outline-none focus:ring-2 focus:ring-zinc-900 transition-all"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <button 
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-900 text-white rounded-xl hover:bg-zinc-800 transition-colors"
          >
            {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTrack ? (
            <motion.div
              key="player"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <button 
                onClick={() => setActiveTrack(null)}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-900 flex items-center gap-1 transition-colors"
              >
                <Disc size={14} /> Back to results
              </button>
              
              <div className="aspect-video w-full bg-zinc-100 rounded-3xl overflow-hidden shadow-inner border border-zinc-200">
                {getEmbedUrl(activeTrack) ? (
                  <iframe
                    src={getEmbedUrl(activeTrack)!}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allow="encrypted-media"
                    title="Music Player"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center">
                    <img src={activeTrack.artwork} alt={activeTrack.title} className="w-32 h-32 rounded-2xl shadow-2xl mb-4" />
                    <h3 className="font-bold text-zinc-900">{activeTrack.title}</h3>
                    <p className="text-sm text-zinc-500 mb-6">{activeTrack.artist}</p>
                    <a 
                      href={activeTrack.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg"
                    >
                      <ExternalLink size={18} />
                      Open in {activeTrack.provider}
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          ) : results.length > 0 ? (
            <motion.div
              key="results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-2"
            >
              {results.map((track) => (
                <div 
                  key={`${track.provider}-${track.id}`}
                  onClick={() => setActiveTrack(track)}
                  className="flex items-center gap-4 p-3 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-100 transition-all cursor-pointer group"
                >
                  <img src={track.artwork} alt={track.title} className="w-12 h-12 rounded-xl shadow-sm group-hover:scale-105 transition-transform" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-zinc-900 truncate">{track.title}</h4>
                    <p className="text-xs text-zinc-500 truncate">{track.artist}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {track.provider === 'spotify' && <Music2 size={14} className="text-[#1DB954]" />}
                    {track.provider === 'deezer' && <Disc size={14} className="text-[#EF3340]" />}
                    {track.provider === 'youtube' && <Youtube size={14} className="text-[#FF0000]" />}
                    <Play size={16} className="text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                  </div>
                </div>
              ))}
            </motion.div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
              <Disc size={48} className="mb-4 animate-spin-slow" />
              <p className="font-bold text-zinc-900">No music playing</p>
              <p className="text-xs font-medium">Search for your favorite tracks above</p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Mini Player / Footer */}
      {activeTrack && !getEmbedUrl(activeTrack) && (
        <div className="p-4 bg-zinc-900 text-white flex items-center gap-4">
          <img src={activeTrack.artwork} alt={activeTrack.title} className="w-10 h-10 rounded-lg" />
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-xs truncate">{activeTrack.title}</h4>
            <p className="text-[10px] text-zinc-400 truncate">{activeTrack.artist}</p>
          </div>
          <div className="flex items-center gap-3">
            <SkipBack size={16} className="text-zinc-500 cursor-not-allowed" />
            <div className="w-8 h-8 bg-white text-zinc-900 rounded-full flex items-center justify-center">
              <Play size={16} fill="currentColor" />
            </div>
            <SkipForward size={16} className="text-zinc-500 cursor-not-allowed" />
          </div>
        </div>
      )}
    </div>
  );
}

function ProviderBadge({ provider, connected, onConnect, onLogout }: { provider: string, connected: boolean, onConnect: () => void, onLogout: () => void }) {
  const colors = {
    spotify: connected ? 'bg-[#1DB954]' : 'bg-zinc-200',
    deezer: connected ? 'bg-[#EF3340]' : 'bg-zinc-200',
    youtube: connected ? 'bg-[#FF0000]' : 'bg-zinc-200',
  };

  const icons = {
    spotify: <Music2 size={14} />,
    deezer: <Disc size={14} />,
    youtube: <Youtube size={14} />,
  };

  return (
    <div className="relative group">
      <button
        onClick={connected ? undefined : onConnect}
        className={`w-8 h-8 rounded-full flex items-center justify-center text-white transition-all ${colors[provider as keyof typeof colors]} ${!connected && 'hover:bg-zinc-300'}`}
        title={connected ? `Connected to ${provider}` : `Connect ${provider}`}
      >
        {icons[provider as keyof typeof icons]}
      </button>
      {connected && (
        <button
          onClick={onLogout}
          className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Disconnect"
        >
          <LogOut size={8} />
        </button>
      )}
    </div>
  );
}
