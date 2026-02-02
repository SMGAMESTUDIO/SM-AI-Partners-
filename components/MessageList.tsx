
import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { 
  User, Volume2, VolumeX, Copy, Check, RotateCcw
} from 'lucide-react';
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

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onSpeak, 
  onStopSpeak,
  playingMessageId,
  onRegenerate,
  onSendMessage
}) => {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const renderFormattedText = (text: string) => {
    let parts: React.ReactNode[] = text.split(/(`[^`]+`)/g).map((part, i) => {
      if (typeof part === 'string' && part.startsWith('`') && part.endsWith('`')) {
        return <code key={`ic-${i}`} className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/30 font-mono text-[0.9em] text-blue-600 dark:text-blue-400">{part.slice(1, -1)}</code>;
      }
      return part;
    });

    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      return part.split(/(\*\*[^*]+\*\*)/g).map((subPart, i) => {
        if (subPart.startsWith('**') && subPart.endsWith('**')) {
          return <strong key={`b-${i}`} className="font-bold text-gray-900 dark:text-white">{subPart.slice(2, -2)}</strong>;
        }
        return subPart;
      });
    });

    return parts;
  };

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-8 scroll-smooth custom-scrollbar w-full overscroll-contain"
    >
      {messages.length === 0 && (
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-1000">
           <Logo size={100} className="mb-6 drop-shadow-2xl" />
           <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-gray-900 dark:text-gray-100"> PARTNER</span>
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.6em] mb-4">Empowering Students with Intelligence</p>
          <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-pink-500 rounded-full opacity-50"></div>
          <p className="mt-8 text-sm text-gray-500 dark:text-gray-400 max-w-md leading-relaxed">
            Your professional educational companion for Math, Science, Coding, and general studies. How can I assist your learning today?
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isAiGenerating = msg.role === MessageRole.MODEL && isLastMessage && isLoading;

        return (
          <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[95%] md:max-w-[85%] gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm transition-all ${
                  msg.role === MessageRole.USER 
                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' 
                    : 'bg-white border-transparent'
                }`}>
                  {msg.role === MessageRole.USER ? <User size={20} className="text-gray-400" /> : <Logo size={36} />}
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-0">
                {msg.image && (
                  <div className="rounded-2xl border border-gray-200 dark:border-gray-800 shadow-md mb-2 overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <img src={msg.image} alt="Upload" className="max-w-xs md:max-w-md w-full h-auto" />
                  </div>
                )}
                <div className={`${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block text-[15px] leading-relaxed break-words px-5 py-3 rounded-2xl shadow-sm ${
                    msg.role === MessageRole.USER 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-gray-100 dark:bg-gray-800/60 dark:text-gray-200 rounded-tl-none'
                  }`}>
                    <div className="space-y-3">
                      {msg.text.split('\n').map((line, l) => (
                        <p key={l}>{renderFormattedText(line)}</p>
                      ))}
                      {isAiGenerating && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-1 rounded-full" />}
                    </div>
                  </div>
                </div>
                
                {msg.role === MessageRole.MODEL && !isAiGenerating && (
                  <div className="flex items-center gap-2 mt-1 opacity-60 hover:opacity-100 transition-opacity">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
                      {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <button onClick={() => onSpeak(msg.text, msg.id)} className={`p-2 rounded-xl transition-all ${playingMessageId === msg.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
                      {playingMessageId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    {isLastMessage && <button onClick={onRegenerate} className="p-2 hover:bg-gray-100 rounded-xl transition-all"><RotateCcw size={14} /></button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="h-4 w-full" />
    </div>
  );
};

export default MessageList;
