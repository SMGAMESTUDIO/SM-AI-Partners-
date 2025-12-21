
import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { User, Volume2, VolumeX } from 'lucide-react';
import Logo from './Logo';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string, id: string) => void;
  onStopSpeak: () => void;
  playingMessageId: string | null;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onSpeak, 
  onStopSpeak,
  playingMessageId 
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
           <Logo size={140} className="mb-8" />
           <h2 className="text-3xl md:text-4xl font-black mb-4 flex gap-2 items-center justify-center">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-indigo-600 dark:text-indigo-400">PARTNER</span>
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your Study Partner for all exams and skills.</p>
        </div>
      )}

      {messages.map((msg) => (
        <div key={msg.id} className={`flex w-full ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
          <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md overflow-hidden bg-white dark:bg-gray-800 border">
              {msg.role === MessageRole.USER ? <User size={18} /> : <Logo size={32} />}
            </div>
            <div className="flex flex-col gap-1">
              {msg.image && (
                <img src={msg.image} alt="User upload" className="max-w-xs rounded-2xl mb-1 shadow-sm border dark:border-gray-700" />
              )}
              <div className="relative group">
                <div className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === MessageRole.USER 
                    ? 'bg-primary-600 text-white rounded-tr-none' 
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border'
                }`}>
                  {msg.text}
                </div>
                
                {/* Manual Voice Control for AI messages */}
                {msg.role === MessageRole.MODEL && (
                  <button
                    onClick={() => onSpeak(msg.text, msg.id)}
                    className={`absolute -right-10 top-2 p-2 rounded-full transition-all duration-200 ${
                      playingMessageId === msg.id 
                        ? 'bg-blue-600 text-white animate-pulse shadow-lg scale-110' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-blue-500 opacity-0 group-hover:opacity-100'
                    }`}
                    title={playingMessageId === msg.id ? "Stop Speaking" : "Listen to this message"}
                  >
                    {playingMessageId === msg.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex justify-start w-full">
          <div className="flex max-w-[85%] gap-3 items-center">
            <Logo size={32} />
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl animate-pulse text-[10px] font-black uppercase tracking-widest text-gray-400">Processing...</div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;
