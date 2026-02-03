
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
      className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 scroll-smooth custom-scrollbar w-full overscroll-contain bg-gray-50/30 dark:bg-transparent"
    >
      {messages.length === 0 && (
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-1000">
           <Logo size={100} className="mb-6 drop-shadow-2xl" />
           <h2 className="text-3xl md:text-5xl font-black mb-2 tracking-tighter">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-gray-900 dark:text-gray-100"> PARTNER</span>
          </h2>
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.5em] mb-4">Educational Assistant</p>
          <div className="w-16 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full opacity-60"></div>
          <p className="mt-8 text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xs md:max-w-md leading-relaxed">
            Welcome to your digital study partner. I am ready to help you with Math, Science, IT, and more. 
            <br/><br/>
            <span className="text-blue-500 font-bold italic">"Ask me anything to start learning!"</span>
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isAiGenerating = msg.role === MessageRole.MODEL && isLastMessage && isLoading;

        return (
          <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-2 duration-400 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[92%] md:max-w-[85%] gap-2 md:gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border shadow-sm transition-all ${
                  msg.role === MessageRole.USER 
                    ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' 
                    : 'bg-white border-transparent'
                }`}>
                  {msg.role === MessageRole.USER ? <User size={16} className="text-gray-400" /> : <Logo size={32} />}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 min-w-0">
                {msg.image && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-md mb-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
                    <img src={msg.image} alt="Upload" className="max-w-xs md:max-w-md w-full h-auto" />
                  </div>
                )}
                <div className={`${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block text-[14px] md:text-[15px] leading-relaxed break-words px-4 py-2.5 rounded-2xl shadow-sm ${
                    msg.role === MessageRole.USER 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 dark:text-gray-200 rounded-tl-none'
                  }`}>
                    <div className="space-y-2">
                      {msg.text.split('\n').map((line, l) => (
                        <p key={l} className={line.trim() === '' ? 'h-2' : ''}>{renderFormattedText(line)}</p>
                      ))}
                      {isAiGenerating && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse align-middle ml-1 rounded-full" />}
                    </div>
                  </div>
                </div>
                
                {msg.role === MessageRole.MODEL && !isAiGenerating && (
                  <div className="flex items-center gap-1 mt-0.5 opacity-50 hover:opacity-100 transition-opacity ml-1">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="Copy Text">
                      {copiedId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    <button onClick={() => onSpeak(msg.text, msg.id)} className={`p-1.5 rounded-lg transition-all ${playingMessageId === msg.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`} title="Play Audio">
                      {playingMessageId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    {isLastMessage && <button onClick={onRegenerate} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="Regenerate Answer"><RotateCcw size={12} /></button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="h-2 w-full" />
    </div>
  );
};

export default MessageList;
