import React from 'react';
import { X, Check, Star, Zap, Shield, Globe, Award } from 'lucide-react';

interface PremiumModalProps {
  onClose: () => void;
  onUpgrade: () => void;
}

const PremiumModal: React.FC<PremiumModalProps> = ({ onClose, onUpgrade }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden relative animate-in zoom-in duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors z-10"
        >
          <X size={20} />
        </button>

        <div className="relative h-32 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 left-0 w-24 h-24 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-400 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl"></div>
          </div>
          <div className="relative z-10 flex flex-col items-center">
            <Star size={40} className="text-yellow-400 fill-yellow-400 animate-bounce-slow mb-2" />
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">SM AI Partner Premium</h2>
          </div>
        </div>

        <div className="p-6 md:p-8">
          <div className="mb-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">Developed by SM Game Studio</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Unlock Professional Academic Power</h3>
          </div>

          <div className="space-y-4 mb-8">
            <FeatureItem icon={<Zap size={18} className="text-yellow-500" />} title="Priority AI Processing" description="Get faster responses even during peak hours." />
            <FeatureItem icon={<Award size={18} className="text-blue-500" />} title="Advanced Reasoning" description="Access deeper logical explanations for complex problems." />
            <FeatureItem icon={<Globe size={18} className="text-emerald-500" />} title="Multi-Language Mastery" description="Enhanced Urdu, Sindhi, and English support." />
            <FeatureItem icon={<Shield size={18} className="text-indigo-500" />} title="Ad-Free Experience" description="Focus entirely on your studies without interruptions." />
          </div>

          <button 
            onClick={onUpgrade}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            UPGRADE TO PREMIUM NOW
          </button>
          
          <p className="mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Trusted by Students Worldwide • SM Game Studio
          </p>
        </div>
      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({ icon, title, description }) => (
  <div className="flex gap-4 items-start">
    <div className="mt-1 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 flex-shrink-0">
      {icon}
    </div>
    <div>
      <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default PremiumModal;
