import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, MapPin, ExternalLink } from 'lucide-react';

const LANDSCAPES = [
  { url: "https://images.unsplash.com/photo-1506744032029-a8b3254a4cb1?auto=format&fit=crop&w=600&q=80", location: "Yosemite National Park, USA", photographer: "Bailey Zindel" },
  { url: "https://images.unsplash.com/photo-1469334025819-66db08facdf5?auto=format&fit=crop&w=600&q=80", location: "Dolomites, Italy", photographer: "Eberhard Grossgasteiger" },
  { url: "https://images.unsplash.com/photo-1476610232099-f3884cb5c333?auto=format&fit=crop&w=600&q=80", location: "Iceland", photographer: "Jonatan Pie" },
  { url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80", location: "Kyoto, Japan", photographer: "S. Tsuda" },
  { url: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?auto=format&fit=crop&w=600&q=80", location: "Grand Canyon, USA", photographer: "Alan Carrillo" },
  { url: "https://images.unsplash.com/photo-1503614054008-8e5e97f54fc8?auto=format&fit=crop&w=600&q=80", location: "Geirangerfjord, Norway", photographer: "Inge Maria" },
  { url: "https://images.unsplash.com/photo-1464822759023-fea092813c14?auto=format&fit=crop&w=600&q=80", location: "Banff, Canada", photographer: "John Lee" },
  { url: "https://images.unsplash.com/photo-1469522859120-e714e4235384?auto=format&fit=crop&w=600&q=80", location: "Milford Sound, New Zealand", photographer: "Dan Freeman" },
  { url: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=600&q=80", location: "Lake Louise, Canada", photographer: "Luca Bravo" },
  { url: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=600&q=80", location: "Pic du Midi, France", photographer: "Paul Gilmore" }
];

export function PhotoBar() {
  const [isOpen, setIsOpen] = useState(true);
  const [photoIndex, setPhotoIndex] = useState(0);

  // Auto-hide after 5s
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  // Change photo every 2 minutes (120000 ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setPhotoIndex((prev) => (prev + 1) % LANDSCAPES.length);
    }, 120000);
    return () => clearInterval(interval);
  }, []);

  const currentPhoto = LANDSCAPES[photoIndex];

  return (
    <div className="fixed left-0 top-2/3 -translate-y-1/2 z-[100] flex items-center pointer-events-none">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="open"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative bg-white/10 backdrop-blur-xl rounded-r-3xl shadow-2xl cursor-pointer pointer-events-auto border border-white/20 border-l-0 p-2 group w-[280px] h-[180px] sm:w-[320px] sm:h-[220px]"
            onClick={() => setIsOpen(false)}
          >
            <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-900 shadow-inner">
              {LANDSCAPES.map((photo, index) => (
                <div 
                  key={photo.url}
                  className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === photoIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                >
                  <img 
                    src={photo.url} 
                    alt={photo.location} 
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    crossOrigin="anonymous"
                  />
                </div>
              ))}
              <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent flex flex-col justify-end p-5 pointer-events-none">
                <div className="flex items-end justify-between w-full">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 text-white mb-1.5 transform transition-transform duration-500 group-hover:translate-x-1">
                      <MapPin size={16} className="text-emerald-400 drop-shadow-md" />
                      <span className="text-base font-black tracking-wide drop-shadow-md">{currentPhoto.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-300 transform transition-transform duration-500 delay-75 group-hover:translate-x-1">
                      <Camera size={14} className="opacity-80" />
                      <span className="text-xs font-bold uppercase tracking-widest opacity-90">{currentPhoto.photographer}</span>
                    </div>
                  </div>
                  <a 
                    href={currentPhoto.url.split('?')[0]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="pointer-events-auto p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-white transition-all transform hover:scale-110 mb-1"
                    title="Voir l'image en haute résolution"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="closed"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-4 h-32 bg-transparent hover:bg-zinc-900/10 rounded-r-xl flex items-center justify-start cursor-pointer transition-colors pointer-events-auto"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-1 h-16 bg-zinc-400/30 rounded-r-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
