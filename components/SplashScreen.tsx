
import React from 'react';
import Logo from './Logo';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 bg-[#020617]">
      {/* Premium Background Mesh/Gradient */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-pink-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative group">
          <div className="absolute inset-0 bg-blue-500/10 blur-[40px] rounded-full scale-125 animate-pulse"></div>
          <Logo size={140} className="relative z-10 drop-shadow-[0_0_25px_rgba(59,130,246,0.3)] animate-bounce-slow" />
        </div>
        
        <div className="mt-12 text-center relative z-10 space-y-3">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter flex items-center justify-center animate-in slide-in-from-bottom-8 duration-700 delay-300">
            <span className="text-blue-500">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-white ml-3">PARTNER</span>
          </h1>
          <div className="flex items-center justify-center gap-2 animate-in fade-in duration-1000 delay-700">
            <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-blue-500"></div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.5em]">Advancing Education</span>
            <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-blue-500"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
