
import React from 'react';
import { X, MessageSquare, Trash2, Plus, ImageIcon, Sparkles, Mail, Globe, Code, Zap } from 'lucide-react';
import { ChatSession } from '../types';
// Fixed: Logo is a default export from ./Logo, so it must be imported without curly braces.
import Logo from './Logo';

interface HistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onNewChat: () => void;
  onStartImageGen: () => void;
  onStartCoding: () => void;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
  onNewChat,
  onStartImageGen,
  onStartCoding
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-gray-950 z-[60] transform transition-transform duration-300 ease-in-out shadow-2xl border-r border-gray-200 dark:border-gray-800 flex flex-col ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gray-50/50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            <Logo size={32} />
            <h2 className="text-lg font-black tracking-tighter flex items-center leading-none">
              <span className="text-blue-600 dark:text-blue-500">SM</span>
              <span className="text-pink-500">AI</span>
              <span className="text-gray-900 dark:text-gray-100 ml-1">PARTNER</span>
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-xl transition-colors text-gray-500 dark:text-gray-400"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <button
            onClick={() => { onNewChat(); onClose(); }}
            className="w-full flex items-center justify-start gap-3 p-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl transition-all shadow-lg shadow-blue-500/20 font-black text-xs uppercase tracking-widest"
          >
            <Plus size={18} /> Education Chat
          </button>
          
          <button
            onClick={() => { onStartCoding(); onClose(); }}
            className="w-full flex items-center justify-start gap-3 p-3.5 bg-gray-900 dark:bg-gray-800 hover:bg-black dark:hover:bg-gray-700 text-white rounded-2xl transition-all shadow-md font-black text-xs uppercase tracking-widest"
          >
            <Code size={18} /> Coding Assistant
          </button>

          <button
            onClick={() => { onStartImageGen(); onClose(); }}
            className="w-full flex items-center justify-start gap-3 p-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white rounded-2xl transition-all shadow-lg shadow-pink-500/20 font-black text-xs uppercase tracking-widest"
          >
            <ImageIcon size={18} /> AI Image Generator
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scrollbar">
          <div className="flex items-center gap-2 mt-4 mb-2 ml-2">
            <div className="w-1 h-1 rounded-full bg-blue-500"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Recent Chats</p>
          </div>
          
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4">
              <MessageSquare size={32} className="mx-auto text-gray-200 dark:text-gray-800 mb-3" />
              <p className="text-gray-400 dark:text-gray-600 text-[11px] font-bold uppercase tracking-widest">No Recent Activity</p>
            </div>
          ) : (
            sessions.sort((a, b) => b.lastUpdated - a.lastUpdated).map((session) => (
              <div
                key={session.id}
                className={`group flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition-all border ${
                  currentSessionId === session.id
                    ? 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 shadow-sm'
                    : 'bg-transparent border-transparent hover:bg-gray-50 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-400'
                }`}
                onClick={() => { onSelectSession(session.id); onClose(); }}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <MessageSquare size={16} className={`shrink-0 ${currentSessionId === session.id ? 'opacity-100' : 'opacity-40'}`} />
                  <span className={`truncate text-xs font-bold ${currentSessionId === session.id ? 'text-blue-800 dark:text-blue-200' : ''}`}>
                    {session.title || 'New Conversation'}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-all"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="p-4 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-blue-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">Developer Profile</p>
            </div>
            
            <p className="text-sm font-black text-gray-900 dark:text-gray-100 mb-4 tracking-tight">SM GAMING STUDIO</p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <Mail size={14} className="shrink-0 text-blue-500" />
                <span className="truncate">smgamingstudioofficial@gmail.com</span>
              </div>
              
              <a 
                href="https://smgamingstudioofficial.blogspot.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-2 p-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md group"
              >
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <Globe size={14} />
                  <span>Our Blog</span>
                </div>
                <Zap size={12} className="group-hover:scale-125 transition-transform" />
              </a>
            </div>
          </div>
          
          <p className="text-center text-[8px] font-black uppercase tracking-[0.4em] text-gray-300 dark:text-gray-700 mt-4 select-none">
            Advancing Education
          </p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.05); }
      `}</style>
    </>
  );
};

export default HistorySidebar;
