import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { User, Volume2, VolumeX, Copy, Check, RotateCcw } from 'lucide-react';
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
  playingMessageId,
  onRegenerate
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

  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <p key={i} className={line.trim() === '' ? 'h-3' : 'mb-1 last:mb-0'}>
        {line}
      </p>
    ));
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-4 md:space-y-6 scroll-smooth w-full bg-gray-50/20 dark:bg-transparent">
      {messages.length === 0 && (
        <div className="min-h-full flex flex-col items-center justify-center text-center p-6 animate-in fade-in duration-1000">
          <Logo size={60} className="mb-4 md:mb-8 md:size-[100px] drop-shadow-2xl" />
          <h2 className="text-2xl md:text-5xl font-black mb-1 tracking-tighter">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-gray-900 dark:text-gray-100 ml-1">PARTNER</span>
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] mb-4">Educational Assistant</p>
          <p className="mt-4 text-[13px] md:text-sm font-medium text-gray-500 dark:text-gray-400 max-w-xs md:max-w-md">
            Welcome student! How can I help you today?
          </p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isAiGenerating = msg.role === MessageRole.MODEL && isLastMessage && isLoading;

        return (
          <div key={msg.id} className={`flex w-full animate-in slide-in-from-bottom-2 duration-300 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[95%] md:max-w-[85%] gap-2 md:gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center border shadow-sm ${
                  msg.role === MessageRole.USER ? 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700' : 'bg-white border-transparent'
                }`}>
                  {msg.role === MessageRole.USER ? <User size={14} className="text-gray-400" /> : <Logo size={32} />}
                </div>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                {msg.image && (
                  <div className="rounded-xl border border-gray-200 dark:border-gray-800 shadow-md mb-1 overflow-hidden bg-gray-100">
                    <img src={msg.image} alt="Upload" className="max-w-[240px] md:max-w-md w-full h-auto" />
                  </div>
                )}
                <div className={`inline-block text-[14px] md:text-[15px] leading-relaxed break-words px-3.5 py-2 md:px-4 md:py-2.5 rounded-2xl shadow-sm ${
                  msg.role === MessageRole.USER 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700 dark:text-gray-200 rounded-tl-none'
                }`}>
                  <div className="space-y-1">
                    {renderFormattedText(msg.text)}
                    {isAiGenerating && <span className="inline-block w-1.5 h-3.5 bg-blue-500 animate-pulse ml-1 rounded-full align-middle" />}
                  </div>
                </div>
                
                {msg.role === MessageRole.MODEL && !isAiGenerating && (
                  <div className="flex items-center gap-1 mt-0.5 opacity-60 ml-1">
                    <button onClick={() => handleCopy(msg.text, msg.id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                      {copiedId === msg.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                    </button>
                    <button onClick={() => onSpeak(msg.text, msg.id)} className={`p-1.5 rounded-lg ${playingMessageId === msg.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}>
                      {playingMessageId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                    </button>
                    {isLastMessage && <button onClick={onRegenerate} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"><RotateCcw size={12} /></button>}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={messagesEndRef} className="h-4" />
    </div>
  );
};

export default MessageList;