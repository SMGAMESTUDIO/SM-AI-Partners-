
import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import SplashScreen from './components/SplashScreen';
import OfflineNotice from './components/OfflineNotice';
import { sendMessageStreamToGemini } from './services/geminiService';
import { Message, MessageRole, ChatSession, UserUsage } from './types';
import { AlertCircle, RotateCcw } from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions-v4';

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
  const [apiError, setApiError] = useState<boolean>(false);
  
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000); 
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) {}
    }
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  const handleSendMessage = async (text: string, image?: string) => {
    if (!isOnline || isLoading) return;
    setApiError(false);
    abortControllerRef.current = false;

    let sid = currentSessionId;
    if (!sid) {
      sid = Date.now().toString();
      const newSession: ChatSession = { id: sid, title: text.substring(0, 30) || "Education Chat", messages: [], lastUpdated: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(sid);
    }

    const userMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text, timestamp: Date.now(), image };
    
    // Prepare History before state update for consistency
    const sessionToUse = sessions.find(s => s.id === sid);
    const history = sessionToUse ? sessionToUse.messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text || "Attached Image" }]
    })) : [];

    setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, userMsg], lastUpdated: Date.now() } : s));

    setIsLoading(true);
    const aiId = (Date.now() + 1).toString();
    
    try {
      const aiMsg: Message = { id: aiId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === sid ? { ...s, messages: [...s.messages, aiMsg] } : s));

      const streamResponse = await sendMessageStreamToGemini(
        text, 
        history, 
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
          // Update AI message text in real-time
          setSessions(prev => prev.map(s => s.id === sid ? { 
            ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, text: fullText } : m)
          } : s));
        }
      }

      if (!fullText && !abortControllerRef.current) {
        throw new Error("EMPTY_RESPONSE");
      }

    } catch (e: any) {
      console.error("Gemini Error:", e);
      if (e.message?.includes("API_KEY")) setApiError(true);
      
      const errorText = "Maafi chahta hoon, server se rabta nahi ho pa raha. Baraye meherbani dubara koshish karein.";
      setSessions(prev => prev.map(s => s.id === sid ? { 
        ...s, messages: s.messages.map(m => m.id === aiId ? { ...m, text: errorText } : m)
      } : s));
    } finally {
      setIsLoading(false);
    }
  };

  if (showSplash) return <SplashScreen />;
  if (!isOnline) return <OfflineNotice />;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white dark:bg-gray-950 transition-colors fixed inset-0 overflow-hidden">
      <Header 
        isDark={isDark} isAutoSpeech={isAutoSpeech} isDeepThink={isDeepThink} isPremium={false}
        toggleTheme={() => { setIsDark(!isDark); document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', !isDark ? 'dark' : 'light'); }}
        toggleAutoSpeech={() => setIsAutoSpeech(!isAutoSpeech)}
        toggleDeepThink={() => setIsDeepThink(!isDeepThink)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPremium={() => {}}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {apiError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
            <div className="bg-red-600 text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between animate-bounce">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} />
                <p className="text-xs font-bold uppercase tracking-wider">Connection Error: Refresh App</p>
              </div>
              <button onClick={() => window.location.reload()} className="p-1 hover:bg-white/20 rounded-lg">
                <RotateCcw size={16} />
              </button>
            </div>
          </div>
        )}

        <MessageList 
          messages={currentMessages} 
          isLoading={isLoading}
          onSpeak={() => {}}
          onStopSpeak={() => {}}
          playingMessageId={playingMessageId}
          onRegenerate={() => {
            const lastUserMsg = currentMessages.filter(m => m.role === MessageRole.USER).pop();
            if (lastUserMsg) handleSendMessage(lastUserMsg.text, lastUserMsg.image);
          }}
          onSendMessage={handleSendMessage}
        />

        <TypewriterInput 
          onSend={handleSendMessage}
          onMicClick={() => {}}
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
