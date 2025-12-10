import React from 'react';
import { Sun, Moon, GraduationCap, RotateCcw } from 'lucide-react';

interface HeaderProps {
  isDark: boolean;
  toggleTheme: () => void;
  onResetChat: () => void;
}

const Header: React.FC<HeaderProps> = ({ isDark, toggleTheme, onResetChat }) => {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 dark:bg-gray-900/90 border-b border-gray-200 dark:border-gray-700 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2.5 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
            <GraduationCap className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex gap-2 items-center">
            <span className="text-blue-700 dark:text-blue-400 drop-shadow-sm">SM</span>
            <span className="text-rose-600 dark:text-rose-400 drop-shadow-sm">AI</span>
            <span className="bg-gradient-to-r from-teal-500 to-emerald-600 bg-clip-text text-transparent dark:from-teal-400 dark:to-emerald-400">
              PARTNER
            </span>
          </h1>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={onResetChat}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-all duration-200 group"
            title="New Chat / Reset"
            aria-label="New Chat"
          >
            <RotateCcw className="w-5 h-5 group-hover:-rotate-180 transition-transform duration-500" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-yellow-500" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-500" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;