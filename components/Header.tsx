
import React from 'react';
import { Sun, Moon, Menu, Volume2, VolumeX, Brain, Code, GraduationCap, ImageIcon } from 'lucide-react';
import Logo from './Logo';

interface HeaderProps {
  isDark: boolean;
  isAutoSpeech: boolean;
  isDeepThink: boolean;
  isPremium: boolean;
  appMode: 'education' | 'coding' | 'image';
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
  appMode,
  toggleTheme, 
  toggleAutoSpeech, 
  toggleDeepThink,
  onOpenHistory,
}) => {
  const getModeIcon = () => {
    switch(appMode) {
      case 'coding': return <Code size={14} />;
      case 'image': return <ImageIcon size={14} />;
      default: return <GraduationCap size={14} />;
    }
  };

  const getModeLabel = () => {
    switch(appMode) {
      case 'coding': return 'Coding Mode';
      case 'image': return 'Image Gen';
      default: return 'Education';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/95 dark:bg-gray-950/95 border-b border-gray-200 dark:border-gray-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-3 md:px-4 h-14 md:h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenHistory}
            className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            <Menu size={18} className="md:w-5 md:h-5" />
          </button>

          <div 
            className="flex items-center gap-1.5 md:gap-3 transform hover:scale-102 transition-transform cursor-pointer" 
            onClick={() => window.location.reload()}
          >
            <Logo size={28} className="md:size-8" />
            <div className="flex flex-col -space-y-0.5 md:-space-y-1">
              <h1 className="text-[12px] md:text-lg font-black tracking-tighter flex items-center">
                <span className="text-blue-600 dark:text-blue-500">SM</span>
                <span className="text-pink-500">AI</span>
                <span className="text-gray-900 dark:text-gray-100 ml-0.5 md:ml-1 uppercase">Partner</span>
              </h1>
              <div className="flex items-center gap-1">
                <div className={`w-1 h-1 rounded-full ${appMode === 'image' ? 'bg-pink-500' : 'bg-blue-500'} animate-pulse`}></div>
                <span className="text-[7px] font-bold tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase flex items-center gap-1">
                  {getModeIcon()} {getModeLabel()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2.5">
          <button
            onClick={toggleDeepThink}
            className={`flex items-center justify-center p-1.5 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border transition-all ${
              isDeepThink 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800' 
                : 'bg-gray-50 border-gray-200 text-gray-400 dark:bg-gray-800 dark:border-gray-700'
            }`}
          >
            <Brain size={16} className={isDeepThink ? 'animate-pulse' : ''} />
            <span className="hidden lg:inline text-[10px] font-black ml-2 uppercase tracking-widest">Reasoning</span>
          </button>

          <button
            onClick={toggleAutoSpeech}
            className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-all ${
              isAutoSpeech 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 shadow-inner' 
                : 'bg-gray-50 text-gray-400 dark:bg-gray-800'
            }`}
          >
            {isAutoSpeech ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>

          <button
            onClick={toggleTheme}
            className="p-1.5 md:p-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-gray-800 shadow-sm transition-transform active:scale-90"
          >
            {isDark ? <Sun size={16} className="text-yellow-500" /> : <Moon size={16} className="text-indigo-500" />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
