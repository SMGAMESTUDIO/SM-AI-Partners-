
import React from 'react';
import { Sun, Moon, MoreVertical, Volume2, VolumeX, Brain, Crown } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="transform hover:scale-110 transition-transform duration-300 cursor-pointer" onClick={() => window.location.reload()}>
            <Logo size={48} />
          </div>
          <div className="flex flex-col -space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tighter flex items-center">
                <span className="text-blue-600 dark:text-blue-500">SM</span>
                <span className="text-pink-500">AI</span>
                <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">PARTNER</span>
              </h1>
              
              {isPremium ? (
                <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black text-[9px] font-black rounded-full shadow-lg shadow-yellow-500/20 uppercase animate-pulse-slow">
                  <Crown size={10} fill="currentColor" /> Premium
                </div>
              ) : (
                <button 
                  onClick={onOpenPremium}
                  className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black rounded-full shadow-md hover:bg-pink-600 transition-all uppercase tracking-tighter"
                >
                  <Crown size={10} /> Upgrade
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-bold tracking-[0.25em] text-gray-400 dark:text-gray-500 uppercase">Education Hub</span>
               {!isPremium && (
                 <button onClick={onOpenPremium} className="md:hidden text-[8px] font-black text-blue-500 hover:text-pink-500 transition-colors uppercase">Go Premium</button>
               )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={toggleDeepThink}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-300 ${
              isDeepThink 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400 shadow-sm' 
                : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-100'
            }`}
            title="Deep Thinking Mode"
          >
            <Brain size={18} className={isDeepThink ? 'animate-pulse' : ''} />
            <span className="hidden lg:inline text-xs font-black uppercase tracking-widest">Deep Think</span>
          </button>

          <button
            onClick={toggleAutoSpeech}
            className={`p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center ${
              isAutoSpeech 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner' 
                : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
            }`}
            title={isAutoSpeech ? "Auto Voice ON" : "Auto Voice OFF"}
          >
            {isAutoSpeech ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>

          <button
            onClick={onOpenHistory}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
            title="Chat History"
          >
            <MoreVertical size={20} />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm"
            title="Toggle Theme"
          >
            {isDark ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} className="text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
