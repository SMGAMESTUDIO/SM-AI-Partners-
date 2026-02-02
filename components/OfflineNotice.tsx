
import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import Logo from './Logo';

const OfflineNotice: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-white dark:bg-gray-950 animate-in fade-in duration-300">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="relative flex justify-center mb-8">
          <div className="absolute inset-0 bg-red-500/10 blur-[40px] rounded-full animate-pulse"></div>
          <WifiOff size={80} className="text-gray-300 dark:text-gray-700 relative z-10" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight uppercase">No Connection</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Please check your internet settings. SM AI Partner needs an active connection to assist you.
          </p>
        </div>

        <button 
          onClick={handleRetry}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-500/30 active:scale-95 group"
        >
          <RefreshCw size={16} className="group-active:animate-spin" />
          Try Again
        </button>

        <div className="pt-12 opacity-30 flex items-center justify-center gap-2">
          <Logo size={24} />
          <span className="text-[10px] font-black tracking-widest uppercase">SM AI Partner</span>
        </div>
      </div>
    </div>
  );
};

export default OfflineNotice;
