import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import SplashScreen from './components/SplashScreen';
import OfflineNotice from './components/OfflineNotice';
import { sendMessageStreamToGemini } from './services/geminiService';
import { Message, MessageRole, ChatSession } from './types';
import { AlertCircle, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions-v1';

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
  const [apiErrorType, setApiErrorType] = useState<'key' | 'network' | null>(null);
  
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 2500); 
    
    // Theme Loading
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    // Sessions Loading
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
    
    setApiErrorType(null);
    abortControllerRef.current = false;

    let sid = currentSessionId;
    if (!sid) {
      sid = Date.now().toString();
      const newSession: ChatSession = { 
        id: sid, 
        title: text.substring(0, 40) || "New Chat", 
        messages: [], 
        lastUpdated: Date.now() 
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sid);
    }

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text, timestamp: Date.now(), image };
    
    const currentSession = sessions.find(s => s.id === sid);
    const historyContext = currentSession ? currentSession.messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text || "" }]
    })) : [];

    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() } : s));

    setIsLoading(true);
    const aiId = (Date.now() + 1).toString();
    const aiMsg: Message = { id: aiId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, aiMsg] } : s));

    try {
      const streamResponse = await sendMessageStreamToGemini(
        text, 
        historyContext, 
        isDeepThink, 
        image, 
        appMode === 'coding' ? 'coding' : 'education'
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

    } catch (e: any) {
      console.error("Chat Execution Error:", e);
      const errStr = String(e).toLowerCase();
      
      // Specifically look for authentication/key errors
      if (errStr.includes("api key") || errStr.includes("403") || errStr.includes("401") || errStr.includes("400")) {
        setApiErrorType('key');
      } else {
        setApiErrorType('network');
      }
      
      const errorNote = "Mazarat! AI response nahi de raha. Baraye meherbani internet ya API settings check karein.";
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
    const utterance = new SpeechSynthesisUtterance(text);
    if (/[\u0600-\u06FF]/.test(text)) {
      utterance.lang = 'ur-PK';
    } else {
      utterance.lang = 'en-US';
    }
    
    utterance.onend = () => setPlayingMessageId(null);
    utterance.onerror = () => setPlayingMessageId(null);
    
    setPlayingMessageId(id);
    window.speechSynthesis.speak(utterance);
  };

  if (showSplash) return <SplashScreen />;
  if (!isOnline) return <OfflineNotice />;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white dark:bg-gray-950 transition-colors fixed inset-0 overflow-hidden font-sans">
      <Header 
        isDark={isDark} isAutoSpeech={isAutoSpeech} isDeepThink={isDeepThink} isPremium={false}
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

      <main className="flex-1 flex flex-col relative overflow-hidden max-w-7xl mx-auto w-full">
        {apiErrorType === 'key' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
            <div className="bg-orange-600 text-white p-4 rounded-2xl shadow-2xl flex flex-col gap-2 animate-in slide-in-from-top-4">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold uppercase tracking-wider">API Connection Failed</p>
              </div>
              <p className="text-[10px] opacity-90 leading-tight">Gemini API Key sahi nahi hai ya configured nahi hai. Dashboard check karein.</p>
              <button onClick={() => window.location.reload()} className="mt-2 bg-white/20 p-2 rounded-lg text-[10px] font-bold uppercase flex items-center justify-center gap-2">
                <RotateCcw size={12} /> Reload App
              </button>
            </div>
          </div>
        )}

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