
import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { User, Volume2, VolumeX, Copy, Check, RotateCcw, BrainCircuit, BookOpen, Calculator, Atom, GraduationCap } from 'lucide-react';
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
  { icon: <Calculator size={18} />, title: "Solve Math", prompt: "Can you help me solve a math problem step-by-step?", color: "blue" },
  { icon: <Atom size={18} />, title: "Explain Science", prompt: "Explain the concept of Photosynthesis simply.", color: "purple" },
  { icon: <BookOpen size={18} />, title: "Islamiyat", prompt: "Tell me about the importance of ethics in Islam.", color: "green" },
  { icon: <GraduationCap size={18} />, title: "Exam Tips", prompt: "Give me some effective study tips for my upcoming exams.", color: "pink" }
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
        <div className="flex items-center gap-2 text-blue-500/70 italic animate-pulse py-1">
          <BrainCircuit size={14} className="animate-spin-slow" />
          <span className="text-xs font-bold uppercase tracking-widest">SM AI is thinking...</span>
        </div>
      );
    }
    
    return text.split('\n').map((line, i) => (
      <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-1.5 last:mb-0'}>
        {line}
      </p>
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-5 md:space-y-6 scroll-smooth w-full bg-gray-50/20 dark:bg-transparent custom-scrollbar">
      {messages.length === 0 && (
        <div className="min-h-full flex flex-col items-center justify-center text-center p-4 md:p-6 animate-in fade-in zoom-in duration-700">
          <Logo size={70} className="mb-4 md:mb-6 md:size-[100px] drop-shadow-2xl" />
          <h2 className="text-3xl md:text-5xl font-black mb-1 tracking-tighter">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">PARTNER</span>
          </h2>
          <p className="text-[10px] md:text-[12px] text-gray-400 font-bold uppercase tracking-[0.4em] mb-8">Educational Excellence</p>
          
          <div className="grid grid-cols-2 gap-3 w-full max-w-lg mb-8">
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => onSendMessage(s.prompt)}
                className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg transition-all group"
              >
                <div className={`p-2 rounded-xl bg-${s.color}-50 dark:bg-${s.color}-900/20 text-${s.color}-600 dark:text-${s.color}-400 mb-2 group-hover:scale-110 transition-transform`}>
                  {s.icon}
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">{s.title}</span>
              </button>
            ))}
          </div>

          <p className="text-[13px] md:text-sm font-medium text-gray-500 dark:text-gray-400 max-w-[260px] md:max-w-md leading-relaxed">
            As-salamu alaykum! I am your AI study partner. <br/>
            <span className="text-blue-500 font-bold">What are we learning today?</span>
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isAiGenerating = msg.role === MessageRole.MODEL && isLastMessage && isLoading;

        return (
          <div key={msg.id} className={`flex w-full animate-in slide-in-from-bottom-3 duration-400 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[96%] md:max-w-[85%] gap-2 md:gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center border shadow-sm ${
                  msg.role === MessageRole.USER ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-white border-transparent'
                }`}>
                  {msg.role === MessageRole.USER ? <User size={16} className="text-gray-400" /> : <Logo size={32} />}
                </div>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                {msg.image && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-md mb-1.5 overflow-hidden bg-gray-100 dark:bg-gray-900">
                    <img src={msg.image} alt="Upload" className="max-w-[200px] md:max-w-md w-full h-auto" />
                  </div>
                )}
                <div className={`inline-block text-[14px] md:text-[15px] leading-relaxed break-words px-4 py-3 md:px-5 md:py-3.5 rounded-2xl shadow-sm ${
                  msg.role === MessageRole.USER 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800/90 border border-gray-100 dark:border-gray-700 dark:text-gray-100 rounded-tl-none'
                }`}>
                  <div className="space-y-1">
                    {renderFormattedText(msg.text, isAiGenerating)}
                    {isAiGenerating && msg.text && <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-1 rounded-full align-middle" />}
                  </div>
                </div>
                
                {msg.role === MessageRole.MODEL && (!isAiGenerating || msg.text) && (
                  <div className="flex items-center gap-1 mt-0.5 opacity-40 hover:opacity-100 transition-opacity ml-1">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Copy Text">
                      {copiedId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    <button onClick={() => onSpeak(msg.text, msg.id)} className={`p-1.5 rounded-lg transition-colors ${playingMessageId === msg.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`} title="Text to Speech">
                      {playingMessageId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    {isLastMessage && !isLoading && <button onClick={onRegenerate} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors" title="Regenerate Response"><RotateCcw size={12} /></button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="h-6" />
    </div>
  );
};

export default MessageList;
