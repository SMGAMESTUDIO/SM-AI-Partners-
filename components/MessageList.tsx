
import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { User, Volume2, VolumeX, Copy, Check, RotateCcw, BrainCircuit, BookOpen, Calculator, Atom, GraduationCap, ChevronRight } from 'lucide-react';
import Logo from './Logo';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string, id: string) => void;
  onStopSpeak: () => void;
  playingMessageId: string | null;
  onRegenerate: () => void;
  onSendMessage: (text: string) => void;
}

const SUGGESTIONS = [
  { icon: <Calculator size={18} />, title: "Solve Math", prompt: "Help me solve a math problem step-by-step.", color: "blue" },
  { icon: <Atom size={18} />, title: "Explain Science", prompt: "Explain the concept of Photosynthesis or Atoms.", color: "indigo" },
  { icon: <BookOpen size={18} />, title: "Islamiyat", prompt: "Tell me about Islamic History and Ethics.", color: "emerald" },
  { icon: <GraduationCap size={18} />, title: "Exam Help", prompt: "Give me study tips for my Board Exams.", color: "sky" }
];

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onSpeak, 
  playingMessageId,
  onRegenerate,
  onSendMessage
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text: string, isAiGenerating: boolean) => {
    if (!text && isAiGenerating) {
      return (
        <div className="flex items-center gap-3 text-blue-600/70 py-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest">Studying Query...</span>
        </div>
      );
    }
    
    return text.split('\n').map((line, i) => {
      const isStep = /^\d+\.|\*|-/.test(line.trim());
      return (
        <p key={i} className={`${line.trim() === '' ? 'h-3' : 'mb-2 last:mb-0'} ${isStep ? 'pl-2 border-l-2 border-blue-100 dark:border-blue-900/30 ml-1' : ''}`}>
          {line}
        </p>
      );
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth w-full bg-slate-50/30 dark:bg-transparent">
      {messages.length === 0 && (
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full scale-150 animate-pulse"></div>
            <Logo size={90} className="relative z-10" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tight text-slate-900 dark:text-white">
            Hello, <span className="text-blue-600">Student</span> Partner
          </h2>
          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-10">Professional Academic Assistant</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl mb-12">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(s.prompt)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-left group"
              >
                <div className={`p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 transition-colors`}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <span className="block text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">{s.title}</span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium line-clamp-1">Try: {s.prompt}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-md leading-relaxed bg-white/50 dark:bg-slate-900/50 py-3 px-6 rounded-full border border-slate-100 dark:border-slate-800">
            Welcome! I am ready to help with your studies. <span className="text-blue-600 font-bold ml-1">Kiya seekhna hai aaj?</span>
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isAiGenerating = msg.role === MessageRole.MODEL && isLastMessage && isLoading;

        return (
          <div key={msg.id} className={`flex w-full animate-in slide-in-from-bottom-2 duration-300 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[92%] md:max-w-[80%] gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 pt-1">
                <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center transition-all ${
                  msg.role === MessageRole.USER 
                    ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700' 
                    : 'bg-white shadow-sm ring-1 ring-slate-100 dark:ring-slate-800'
                }`}>
                  {msg.role === MessageRole.USER ? <User size={18} className="text-slate-400" /> : <Logo size={36} />}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                {msg.image && (
                  <div className="rounded-2xl border-2 border-white dark:border-slate-800 shadow-xl mb-1 overflow-hidden group relative">
                    <img src={msg.image} alt="Academic Reference" className="max-w-[240px] md:max-w-md w-full h-auto" />
                    <div className="absolute inset-0 bg-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  </div>
                )}
                <div className={`relative px-5 py-4 rounded-2xl shadow-sm border text-[14px] md:text-[15px] leading-relaxed transition-colors ${
                  msg.role === MessageRole.USER 
                    ? 'bg-blue-600 border-blue-500 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
                }`}>
                  <div className="space-y-1">
                    {renderFormattedText(msg.text, isAiGenerating)}
                    {isAiGenerating && msg.text && <span className="inline-block w-2 h-2 bg-blue-500 rounded-full animate-pulse ml-1 align-baseline" />}
                  </div>
                </div>
                
                {msg.role === MessageRole.MODEL && (!isAiGenerating || msg.text) && (
                  <div className="flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 sm:opacity-40 hover:opacity-100 transition-opacity ml-1">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-blue-500" title="Copy Text">
                      {copiedId === msg.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => onSpeak(msg.text, msg.id)} className={`p-2 rounded-lg transition-all ${playingMessageId === msg.id ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' : 'text-slate-400 hover:text-blue-500 hover:bg-white dark:hover:bg-slate-800'}`} title="Speak">
                      {playingMessageId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    {isLastMessage && !isLoading && (
                      <button onClick={onRegenerate} className="p-2 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all text-slate-400 hover:text-blue-500" title="Try Again">
                        <RotateCcw size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="h-10" />
    </div>
  );
};

export default MessageList;
