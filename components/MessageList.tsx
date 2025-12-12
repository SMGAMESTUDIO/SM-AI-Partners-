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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8">
          <div className="relative mb-8 group">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-blue-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity animate-pulse-slow"></div>
            <Logo size={140} className="relative z-10" />
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-4 py-1 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
               <span className="text-[10px] font-black tracking-widest text-gray-500 uppercase">Official Partner</span>
            </div>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-black mb-4 flex gap-2 items-center justify-center">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-indigo-600 dark:text-indigo-400">PARTNER</span>
          </h2>
          
          <div className="flex flex-wrap justify-center gap-2 mb-8 max-w-md">
            <span className="px-3 py-1 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg text-xs font-bold border border-pink-100 dark:border-pink-800">KG to PhD</span>
            <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-bold border border-blue-100 dark:border-blue-800">All Subjects</span>
            <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800">Global Education</span>
          </div>

          <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 max-w-lg leading-relaxed font-medium">
            Welcome to your professional AI Study Partner. <br/>
            Turn on <b>Deep Think</b> for complex math or research! <br/>
            <span className="text-blue-500 dark:text-blue-400 mt-2 block italic">Urdu, Sindhi, or English – ask anything!</span>
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex w-full ${
            msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'
          }`}
        >
          <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${
             msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shadow-md overflow-hidden ${
              msg.role === MessageRole.USER 
                ? 'bg-primary-600 text-white' 
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            }`}>
              {msg.role === MessageRole.USER ? <User size={18} /> : <Logo size={32} />}
            </div>

            <div className="flex flex-col gap-1">
              <div
                className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed transition-all ${
                  msg.role === MessageRole.USER
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}
              >
                {msg.text}
              </div>
              
              {msg.role === MessageRole.MODEL && (
                <div className="flex items-center gap-2 mt-1">
                  <button 
                    onClick={() => playingMessageId === msg.id ? onStopSpeak() : onSpeak(msg.text, msg.id)}
                    className={`p-1.5 transition-colors rounded-lg flex items-center gap-1.5 ${
                      playingMessageId === msg.id 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400'
                    }`}
                  >
                    {playingMessageId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    {playingMessageId === msg.id && <span className="text-[10px] font-bold uppercase tracking-tight">Stop</span>}
                  </button>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">SM AI Partner</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start w-full">
           <div className="flex max-w-[85%] gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-md overflow-hidden">
              <Logo size={32} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 flex items-center gap-2 shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
              <span className="text-[10px] font-bold text-gray-400 ml-2 uppercase tracking-widest italic animate-pulse">Analyzing carefully...</span>
            </div>
           </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;