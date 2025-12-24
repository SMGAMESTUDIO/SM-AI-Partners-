import React from 'react';
import { Sun, Moon, MoreVertical, Volume2, VolumeX, Brain, Crown, Sparkles } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  isDark: boolean;
  isAutoSpeech: boolean;
  isDeepThink: boolean;
  isPremium: boolean;
  toggleTheme: () => void;
  toggleAutoSpeech: () => void;
  toggleDeepThink: () => void;
  onOpenHistory: () => void;
  onOpenPremium: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isDark, 
  isAutoSpeech, 
  isDeepThink,
  isPremium,
  toggleTheme, 
  toggleAutoSpeech, 
  toggleDeepThink,
  onOpenHistory,
  onOpenPremium
}) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-gray-950/95 border-b border-gray-200 dark:border-gray-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="transform hover:scale-105 transition-transform duration-300 cursor-pointer" onClick={() => window.location.reload()}>
            <Logo size={40} />
          </div>
          <div className="flex flex-col -space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-lg md:text-xl font-black tracking-tighter flex items-center">
                <span className="text-blue-600 dark:text-blue-500">SM</span>
                <span className="text-pink-500">AI</span>
                <span className="text-gray-800 dark:text-gray-100 ml-1">PARTNER</span>
              </h1>
              
              {isPremium ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-400 text-black text-[9px] font-black rounded-full shadow-sm uppercase">
                  <Crown size={10} fill="currentColor" /> PRO
                </div>
              ) : (
                <button 
                  onClick={onOpenPremium}
                  className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[9px] font-black rounded-full shadow-md uppercase animate-pulse hover:scale-105 transition-transform"
                >
                  <Sparkles size={10} /> GO PREMIUM
                </button>
              )}
            </div>
            <span className="text-[8px] font-bold tracking-[0.3em] text-gray-400 dark:text-gray-500 uppercase">Educational Assistant</span>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleDeepThink}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-300 ${
              isDeepThink 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 shadow-sm' 
                : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100'
            }`}
            title="Deep Thinking Mode"
          >
            <Brain size={16} className={isDeepThink ? 'animate-pulse' : ''} />
            <span className="hidden lg:inline text-[10px] font-black uppercase tracking-widest">Deep Think</span>
          </button>

          <button
            onClick={toggleAutoSpeech}
            className={`p-2 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isAutoSpeech 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner' 
                : 'bg-gray-50 text-gray-400 dark:bg-gray-800 dark:text-gray-500 hover:bg-gray-100'
            }`}
          >
            {isAutoSpeech ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          <button
            onClick={onOpenHistory}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
          >
            <MoreVertical size={18} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
          >
            {isDark ? <Sun size={18} className="text-yellow-500" /> : <Moon size={18} className="text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;