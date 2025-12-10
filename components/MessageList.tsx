import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { Bot, User, Volume2 } from 'lucide-react';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string) => void;
}

const MessageList: React.FC<MessageListProps> = ({ messages, isLoading, onSpeak }) => {
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
        <div className="h-full flex flex-col items-center justify-center text-center opacity-50 p-8">
          <Bot className="w-16 h-16 mb-4 text-primary-500" />
          <h2 className="text-2xl font-bold mb-2 dark:text-white">Welcome to SM AI Partner</h2>
          <p className="text-sm dark:text-gray-300">
            Ask me anything about Math, Science, or General Knowledge in English, Urdu, or Sindhi!
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
          <div className={`flex max-w-[85%] md:max-w-[70%] gap-3 ${
             msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'
          }`}>
            <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
              msg.role === MessageRole.USER 
                ? 'bg-primary-600 text-white' 
                : 'bg-purple-600 text-white'
            }`}>
              {msg.role === MessageRole.USER ? <User size={18} /> : <Bot size={18} />}
            </div>

            <div className="flex flex-col gap-1">
              <div
                className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap leading-relaxed ${
                  msg.role === MessageRole.USER
                    ? 'bg-primary-600 text-white rounded-tr-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-tl-none border border-gray-100 dark:border-gray-700'
                }`}
              >
                {msg.text}
              </div>
              
              {/* Speaker Button for AI Messages */}
              {msg.role === MessageRole.MODEL && (
                <button 
                  onClick={() => onSpeak(msg.text)}
                  className="self-start p-1.5 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  title="Listen to this response"
                  aria-label="Speak response"
                >
                  <Volume2 size={16} />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {isLoading && (
        <div className="flex justify-start w-full">
           <div className="flex max-w-[85%] gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></span>
              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></span>
            </div>
           </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList;