import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cloud, Droplets, Wind, Leaf, Clock, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

interface WeatherData {
  time: string;
  temp: number;
  humidity: number;
  weatherCode: number;
  aqi: number;
  pollen: string;
}

export function WeatherBar() {
  const [isOpen, setIsOpen] = useState(true);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        setIsOpen(false);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code`);
        const weatherData = await weatherRes.json();
        
        const aqiRes = await fetch(`https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen`);
        const aqiData = await aqiRes.json();

        const pollenSum = 
          (aqiData.current.alder_pollen || 0) + 
          (aqiData.current.birch_pollen || 0) + 
          (aqiData.current.grass_pollen || 0) + 
          (aqiData.current.mugwort_pollen || 0) + 
          (aqiData.current.olive_pollen || 0) + 
          (aqiData.current.ragweed_pollen || 0);
          
        let pollenRisk = 'Faible';
        if (pollenSum > 50) pollenRisk = 'Moyen';
        if (pollenSum > 100) pollenRisk = 'Élevé';

        setWeather({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(weatherData.current.temperature_2m),
          humidity: Math.round(weatherData.current.relative_humidity_2m),
          weatherCode: weatherData.current.weather_code,
          aqi: Math.round(aqiData.current.european_aqi),
          pollen: pollenRisk
        });
      } catch (error) {
        console.error("Failed to fetch weather", error);
      } finally {
        setLoading(false);
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
        () => {
          // Default to Paris if denied
          fetchWeather(48.8566, 2.3522);
        }
      );
    } else {
      fetchWeather(48.8566, 2.3522);
    }

    const timeInterval = setInterval(() => {
      setWeather(prev => prev ? { ...prev, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } : null);
    }, 60000);

    return () => clearInterval(timeInterval);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0) return <Sun className="text-amber-400" size={16} />;
    if (code <= 3) return <Cloud className="text-sky-400" size={16} />;
    if (code <= 67) return <CloudRain className="text-blue-400" size={16} />;
    if (code <= 77) return <CloudSnow className="text-white" size={16} />;
    if (code <= 99) return <CloudLightning className="text-purple-400" size={16} />;
    return <Cloud className="text-gray-400" size={16} />;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none">
      <AnimatePresence mode="wait">
        {isOpen ? (
          <motion.div
            key="open"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="bg-zinc-900/90 backdrop-blur-md text-white px-6 py-3 rounded-b-3xl shadow-2xl flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-medium cursor-pointer pointer-events-auto border border-zinc-800/50 border-t-0 flex-wrap justify-center max-w-[95vw]"
            onClick={() => setIsOpen(false)}
          >
            {loading ? (
              <div className="animate-pulse flex gap-4 items-center h-5">
                <div className="h-4 w-12 bg-zinc-700 rounded"></div>
                <div className="h-4 w-16 bg-zinc-700 rounded"></div>
                <div className="h-4 w-16 bg-zinc-700 rounded"></div>
              </div>
            ) : weather ? (
              <>
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-zinc-400" />
                  <span>{weather.time}</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-zinc-700"></div>
                <div className="flex items-center gap-2" title="Météo et Température">
                  {getWeatherIcon(weather.weatherCode)}
                  <span>{weather.temp}°C</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-zinc-700"></div>
                <div className="flex items-center gap-2" title="Humidité">
                  <Droplets size={16} className="text-blue-400" />
                  <span>{weather.humidity}%</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-zinc-700"></div>
                <div className="flex items-center gap-2" title="Indice de Pollution (AQI)">
                  <Wind size={16} className={weather.aqi > 50 ? "text-amber-400" : "text-emerald-400"} />
                  <span>AQI {weather.aqi}</span>
                </div>
                <div className="hidden sm:block w-px h-4 bg-zinc-700"></div>
                <div className="flex items-center gap-2" title="Risque Pollen">
                  <Leaf size={16} className={weather.pollen === 'Élevé' ? "text-red-400" : weather.pollen === 'Moyen' ? "text-amber-400" : "text-emerald-400"} />
                  <span>Pollen: {weather.pollen}</span>
                </div>
              </>
            ) : (
              <span className="text-zinc-400">Données indisponibles</span>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="closed"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-32 h-4 bg-transparent hover:bg-zinc-900/10 rounded-b-xl flex items-start justify-center cursor-pointer transition-colors pointer-events-auto"
            onClick={() => setIsOpen(true)}
          >
            <div className="w-16 h-1 bg-zinc-400/30 rounded-b-full" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
