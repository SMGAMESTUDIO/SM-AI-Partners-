import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import SplashScreen from './components/SplashScreen';
import OfflineNotice from './components/OfflineNotice';
import { sendMessageStreamToGemini, generateImageWithGemini } from './services/geminiService';
import { Message, MessageRole, ChatSession } from './types';

const STORAGE_KEY = 'sm-ai-partner-sessions-v2';

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDark, setIsDark] = useState(false);
  const [isAutoSpeech, setIsAutoSpeech] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [appMode, setAppMode] = useState<'education' | 'coding' | 'image'>('education');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2000); 
    
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Session load error:", e);
      }
    }
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  const handleSendMessage = async (text: string, image?: string) => {
    if (!isOnline || isLoading || (!text.trim() && !image)) return;
    
    abortControllerRef.current = false;

    let sid = currentSessionId;
    if (!sid) {
      sid = Date.now().toString();
      const newSession: ChatSession = { 
        id: sid, 
        title: text.substring(0, 40) || (image ? "Image Analysis" : "New Chat"), 
        messages: [], 
        lastUpdated: Date.now() 
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sid);
    }

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text, timestamp: Date.now(), image };
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() } : s));

    setIsLoading(true);
    const aiId = (Date.now() + 1).toString();
    const aiMsg: Message = { id: aiId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, aiMsg] } : s));

    try {
      if (appMode === 'image' && text.trim()) {
        const generatedImage = await generateImageWithGemini(text);
        setSessions(prev => prev.map(s => s.id === sid ? { 
          ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, text: "Your professional image is ready:", image: generatedImage } : m)
        } : s));
      } else {
        const streamResponse = await sendMessageStreamToGemini(
          text, 
          [], 
          isDeepThink, 
          image, 
          appMode
        );
        
        let fullText = "";
        for await (const chunk of streamResponse) {
          if (abortControllerRef.current) break;
          const chunkText = chunk.text;
          if (chunkText) {
            fullText += chunkText;
            setSessions(prev => prev.map(s => s.id === sid ? { 
              ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, text: fullText } : m)
            } : s));
          }
        }
        
        if (isAutoSpeech && fullText) {
          handleSpeak(fullText, aiId);
        }
      }

    } catch (e: any) {
      console.error("Chat Error:", e);
      let errorNote = "Mazarat! Service busy or unavailable.";
      if (e.message?.includes("API_KEY_MISSING")) {
        errorNote = "Developer Alert: API_KEY is missing in Cloudflare settings!";
      } else if (e.message?.includes("403")) {
        errorNote = "Error: Invalid API Key. Please update your Gemini API Key.";
      }
      
      setSessions(prev => prev.map(s => s.id === sid ? { 
        ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, text: errorNote } : m)
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = (text: string, id: string) => {
    if (playingMessageId === id) {
      window.speechSynthesis.cancel();
      setPlayingMessageId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = /[\u0600-\u06FF]/.test(text) ? 'ur-PK' : 'en-US';
    utterance.onend = () => setPlayingMessageId(null);
    setPlayingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  if (showSplash) return <SplashScreen />;
  if (!isOnline) return <OfflineNotice />;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-slate-50 dark:bg-slate-950 transition-colors fixed inset-0 overflow-hidden font-sans">
      <Header 
        isDark={isDark} isAutoSpeech={isAutoSpeech} isDeepThink={isDeepThink} isPremium={false}
        appMode={appMode}
        toggleTheme={() => { 
          const nextDark = !isDark;
          setIsDark(nextDark); 
          document.documentElement.classList.toggle('dark', nextDark); 
          localStorage.setItem('theme', nextDark ? 'dark' : 'light'); 
        }}
        toggleAutoSpeech={() => setIsAutoSpeech(!isAutoSpeech)}
        toggleDeepThink={() => setIsDeepThink(!isDeepThink)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPremium={() => {}}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden max-w-7xl mx-auto w-full bg-white dark:bg-slate-950 shadow-xl">
        <MessageList 
          messages={currentMessages} 
          isLoading={isLoading}
          onSpeak={handleSpeak}
          onStopSpeak={() => { window.speechSynthesis.cancel(); setPlayingMessageId(null); }}
          playingMessageId={playingMessageId}
          onRegenerate={() => {
            const lastUserMsg = currentMessages.filter(m => m.role === MessageRole.USER).pop();
            if (lastUserMsg) handleSendMessage(lastUserMsg.text, lastUserMsg.image);
          }}
          onSendMessage={handleSendMessage}
        />

        <TypewriterInput 
          onSend={handleSendMessage}
          onMicClick={() => setIsListening(!isListening)}
          onStop={() => { abortControllerRef.current = true; setIsLoading(false); }}
          isListening={isListening}
          isLoading={isLoading}
          disabled={isLoading}
          placeholderOverwrite={appMode === 'image' ? "Describe the image for SM AI Partner to paint..." : undefined}
        />
      </main>

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={(id) => {
          setSessions(prev => prev.filter(s => s.id !== id));
          if (currentSessionId === id) setCurrentSessionId(null);
        }}
        onNewChat={() => { setCurrentSessionId(null); setAppMode('education'); }}
        onStartImageGen={() => { setCurrentSessionId(null); setAppMode('image'); }}
        onStartCoding={() => { setCurrentSessionId(null); setAppMode('coding'); }}
      />
      
      <Footer />
    </div>
  );
};

export default App;