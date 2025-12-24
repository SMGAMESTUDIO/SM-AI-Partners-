import React, { useEffect, useRef } from 'react';
import { Message, MessageRole } from '../types';
import { 
  User, Volume2, VolumeX, Copy, Check, RotateCcw, Terminal, Sparkles,
  Globe, Mail, Facebook, Github, Youtube, Twitter, Instagram, 
  Linkedin, ExternalLink, Gamepad2, Pi, Music2, Ghost,
  ChevronRight
} from 'lucide-react';
import Logo from './Logo';

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  onSpeak: (text: string, id: string) => void;
  onStopSpeak: () => void;
  playingMessageId: string | null;
  onRegenerate: () => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  isLoading, 
  onSpeak, 
  onStopSpeak,
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

  /**
   * Helper to get brand-specific icons for links
   */
  const getBrandIcon = (url: string) => {
    const u = url.toLowerCase();
    if (u.includes('facebook')) return <Facebook size={18} className="text-[#1877F2]" />;
    if (u.includes('github')) return <Github size={18} className="text-[#181717] dark:text-white" />;
    if (u.includes('youtube')) return <Youtube size={18} className="text-[#FF0000]" />;
    if (u.includes('twitter') || u.includes('x.com')) return <Twitter size={18} className="text-[#1DA1F2]" />;
    if (u.includes('instagram')) return <Instagram size={18} className="text-[#E4405F]" />;
    if (u.includes('linkedin')) return <Linkedin size={18} className="text-[#0A66C2]" />;
    if (u.includes('tiktok')) return <Music2 size={18} className="text-[#000000] dark:text-white" />;
    if (u.includes('snapchat')) return <Ghost size={18} className="text-[#FFFC00]" />;
    if (u.includes('pinterest')) return <Pi size={18} className="text-[#BD081C]" />;
    if (u.includes('itch.io')) return <Gamepad2 size={18} className="text-[#FA5C5C]" />;
    if (u.includes('blogspot')) return <Globe size={18} className="text-[#FF5722]" />;
    return <Globe size={18} className="text-blue-500" />;
  };

  /**
   * Renders standard text with markdown-lite support (bold, italic, code)
   */
  const renderFormattedText = (text: string) => {
    // 1. Handle Inline Code
    let parts: React.ReactNode[] = text.split(/(`[^`]+`)/g).map((part, i) => {
      if (typeof part === 'string' && part.startsWith('`') && part.endsWith('`')) {
        return <code key={`ic-${i}`} className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700 font-mono text-[0.9em] text-pink-600 dark:text-pink-400">{part.slice(1, -1)}</code>;
      }
      return part;
    });

    // 2. Handle Bold
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      return part.split(/(\*\*[^*]+\*\*)/g).map((subPart, i) => {
        if (subPart.startsWith('**') && subPart.endsWith('**')) {
          return <strong key={`b-${i}`} className="font-bold text-gray-900 dark:text-white">{subPart.slice(2, -2)}</strong>;
        }
        return subPart;
      });
    });

    // 3. Handle Italic
    parts = parts.flatMap((part) => {
      if (typeof part !== 'string') return part;
      return part.split(/(\*[^*]+\*)/g).map((subPart, i) => {
        if (subPart.startsWith('*') && subPart.endsWith('*') && !subPart.startsWith('**')) {
          return <em key={`i-${i}`} className="italic opacity-90">{subPart.slice(1, -1)}</em>;
        }
        return subPart;
      });
    });

    return parts;
  };

  /**
   * Main formatting engine for AI responses
   */
  const formatMessageContent = (text: string, isAiGenerating: boolean) => {
    if (!text && isAiGenerating) return null;

    // Split content by segments (code blocks, or lines)
    const segments = text.split(/(```[\s\S]*?```)/g);
    
    return segments.map((segment, sIdx) => {
      // CODE BLOCK RENDERING
      if (segment.startsWith('```') && segment.endsWith('```')) {
        const fullContent = segment.slice(3, -3).trim();
        const firstLineBreak = fullContent.indexOf('\n');
        const language = firstLineBreak !== -1 ? fullContent.slice(0, firstLineBreak).trim() : 'code';
        const code = firstLineBreak !== -1 ? fullContent.slice(firstLineBreak + 1).trim() : fullContent;

        return (
          <div key={`cb-${sIdx}`} className="my-5 rounded-xl overflow-hidden bg-gray-950 border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-gray-900 px-4 py-2.5 flex justify-between items-center border-b border-white/5">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">{language || 'terminal'}</span>
              </div>
              <button 
                onClick={() => handleCopy(code, `code-${sIdx}`)} 
                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition-all group"
              >
                <span className="text-[9px] font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
                {copiedId === `code-${sIdx}` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>
            <div className="p-4 overflow-x-auto custom-scrollbar">
              <pre className="text-xs md:text-sm font-mono leading-relaxed text-gray-300">
                <code>{code}</code>
              </pre>
            </div>
          </div>
        );
      }

      // TEXT & LIST & LINK RENDERING
      const lines = segment.split('\n');
      return (
        <div key={`txt-${sIdx}`} className="space-y-3">
          {lines.map((line, lIdx) => {
            if (!line.trim()) return <div key={`br-${lIdx}`} className="h-1" />;

            // 1. Detect Professional Link Cards: [Name](URL)
            // We check if the line *contains* or *is* a link markdown
            const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g;
            const hasLinks = line.match(linkRegex);

            if (hasLinks && (line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().length < 100)) {
               // If it's a short line or list item containing a link, render as a Professional Card
               const linkMatch = Array.from(line.matchAll(linkRegex))[0];
               const name = linkMatch[1];
               const url = linkMatch[2];

               return (
                 <a 
                   key={`link-${lIdx}`}
                   href={url} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="group relative flex items-center justify-between p-4 my-2 bg-white dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-blue-500 dark:hover:border-blue-400 hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
                 >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 translate-x-[-100%] group-hover:animate-shimmer" />
                    
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                        {getBrandIcon(url)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400 opacity-60">Professional Link</span>
                        <span className="text-sm font-black text-gray-800 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative z-10 bg-gray-50 dark:bg-gray-700/50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                      Visit <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                    </div>
                 </a>
               );
            }

            // Headers
            if (line.startsWith('### ')) {
              return (
                <h3 key={`h3-${lIdx}`} className="text-sm font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-400 pt-6 pb-2 border-b border-blue-500/10 flex items-center gap-2">
                  <Sparkles size={14} /> {line.slice(4)}
                </h3>
              );
            }

            // Unordered Lists
            if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
              return (
                <div key={`li-${lIdx}`} className="flex gap-3 pl-2">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                  <span className="flex-1">{renderFormattedText(line.trim().slice(2))}</span>
                </div>
              );
            }

            // Default Paragraph
            return (
              <p key={`p-${lIdx}`}>
                {renderFormattedText(line)}
                {isAiGenerating && sIdx === segments.length - 1 && lIdx === lines.length - 1 && (
                  <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse align-middle ml-1 rounded-full" />
                )}
              </p>
            );
          })}
        </div>
      );
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-12 scroll-smooth custom-scrollbar">
      {messages.length === 0 && (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-700">
           <Logo size={140} className="mb-6 drop-shadow-2xl" />
           <h2 className="text-2xl md:text-4xl font-black mb-2 tracking-tighter">
            <span className="text-blue-600">SM</span>
            <span className="text-pink-500">AI</span>
            <span className="text-gray-900 dark:text-gray-100"> PARTNER</span>
          </h2>
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.5em] max-w-xs mx-auto">Advancing Education with Professional AI Assistance</p>
        </div>
      )}

      {messages.map((msg, idx) => {
        const isLastMessage = idx === messages.length - 1;
        const isAiGenerating = msg.role === MessageRole.MODEL && isLastMessage && isLoading;

        return (
          <div key={msg.id} className={`flex w-full animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === MessageRole.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[95%] md:max-w-[85%] gap-4 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className="flex-shrink-0 mt-1">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all duration-300 ${
                  msg.role === MessageRole.USER 
                    ? 'bg-gray-100 border-gray-200 dark:bg-gray-800 dark:border-gray-700 shadow-sm' 
                    : 'bg-white border-transparent hover:scale-110'
                }`}>
                  {msg.role === MessageRole.USER ? <User size={18} className="text-gray-500" /> : <Logo size={32} />}
                </div>
              </div>
              <div className="flex flex-col gap-2 group min-w-0">
                {msg.image && (
                  <div className="relative group/img overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-800 shadow-lg mb-2">
                    <img src={msg.image} alt="User Upload" className="max-w-sm w-full object-cover transition-transform group-hover/img:scale-105 duration-500" />
                  </div>
                )}
                <div className={`${msg.role === MessageRole.USER ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block text-sm md:text-[15.5px] leading-relaxed break-words transition-all ${
                    msg.role === MessageRole.USER 
                      ? 'bg-blue-600 text-white px-5 py-3 rounded-2xl rounded-tr-none shadow-md' 
                      : 'text-gray-800 dark:text-gray-200 py-1'
                  }`}>
                    {formatMessageContent(msg.text, isAiGenerating)}
                  </div>
                </div>
                
                {msg.role === MessageRole.MODEL && !isAiGenerating && (
                  <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={() => handleCopy(msg.text, msg.id)} 
                      className="p-2 text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" 
                      title="Copy Response"
                    >
                      {copiedId === msg.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                    <button 
                      onClick={() => onSpeak(msg.text, msg.id)} 
                      className={`p-2 rounded-lg transition-all ${
                        playingMessageId === msg.id 
                          ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                          : 'text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                      title="Read Aloud"
                    >
                      {playingMessageId === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    </button>
                    {isLastMessage && (
                      <button 
                        onClick={onRegenerate} 
                        className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" 
                        title="Regenerate"
                      >
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
      
      {isLoading && messages.length > 0 && messages[messages.length-1].role === MessageRole.USER && (
        <div className="flex justify-start w-full animate-in fade-in slide-in-from-left-4 duration-500">
          <div className="flex gap-4 items-start relative">
            <div className="relative w-9 h-9 rounded-xl flex items-center justify-center border bg-white border-transparent flex-shrink-0 mt-1 shadow-md overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/10 animate-ping rounded-full scale-150" />
              <Logo size={32} className="animate-spin-slow relative z-10" />
            </div>
            
            <div className="flex flex-col gap-2 py-1.5">
              <div className="relative group overflow-hidden flex items-center gap-3 px-5 py-2.5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-shimmer" />
                
                <div className="flex gap-1.5 relative z-10">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-bounce"></span>
                </div>
                
                <div className="flex flex-col relative z-10">
                   <div className="flex items-center gap-1.5">
                     <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] uppercase">SM AI is Thinking</span>
                     <Sparkles size={10} className="text-yellow-500 animate-pulse" />
                   </div>
                   <div className="h-[1px] w-full bg-gradient-to-r from-blue-500/50 to-transparent mt-0.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} className="h-32" />
      
      <style>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite ease-in-out;
        }

        .custom-scrollbar::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(156, 163, 175, 0.3); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(156, 163, 175, 0.5); }
      `}</style>
    </div>
  );
};

export default MessageList;