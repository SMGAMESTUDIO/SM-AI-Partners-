import React from 'react';

const Footer: React.FC = () => {
  const hasApiKey = !!(process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY);

  return (
    <footer className="w-full bg-transparent py-4 mt-auto">
      <div className="container mx-auto px-4 text-center flex flex-col items-center gap-2">
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300 dark:text-gray-700 select-none">
          SM AI PARTNER • DEVELOPED BY SM GAME STUDIO
        </p>
        <div className="flex items-center gap-1.5 opacity-40">
          <div className={`w-1.5 h-1.5 rounded-full ${hasApiKey ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">
            API Status: {hasApiKey ? 'Detected' : 'Missing (Check Vercel)'}
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;