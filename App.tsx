import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import SplashScreen from './components/SplashScreen';
import OfflineNotice from './components/OfflineNotice';
import { sendMessageStreamToGemini, getSpeechAudio, generateAiImage } from './services/geminiService';
import { Message, MessageRole, ChatSession, UserUsage } from './types';
import { AlertCircle, X } from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions-v2';
const USAGE_KEY = 'sm-ai-usage-v2';
const AUTO_SPEECH_KEY = 'sm-ai-auto-speech';

type AppMode = 'education' | 'coding' | 'image';

const decodeBase64 = (base64: string) => {
  if (!base64) return new Uint8Array(0);
  try {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  } catch (e) {
    console.error("Base64 decode error", e);
    return new Uint8Array(0);
  }
};

const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer | null> => {
  if (!data || data.length === 0) return null;
  try {
    const dataInt16 = new Int16Array(data.buffer);
    if (dataInt16.length === 0) return null;
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  } catch (e) {
    console.error("Audio decode error", e);
    return null;
  }
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isDark, setIsDark] = useState(false);
  const [isAutoSpeech, setIsAutoSpeech] = useState(false);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [isPremiumOpen, setIsPremiumOpen] = useState(false);
  const [appMode, setAppMode] = useState<AppMode>('education');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  
  const [usage, setUsage] = useState<UserUsage>({
    imagesSentToday: 0,
    imagesGeneratedToday: 0,
    lastImageDate: new Date().toISOString().split('T')[0],
    isPremium: false
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const abortControllerRef = useRef<boolean>(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3500); 
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
    const savedAutoSpeech = localStorage.getItem(AUTO_SPEECH_KEY);
    setIsAutoSpeech(savedAutoSpeech === 'true');
    const savedUsage = localStorage.getItem(USAGE_KEY);
    const today = new Date().toISOString().split('T')[0];
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        if (parsed.lastImageDate !== today) setUsage({ ...parsed, imagesSentToday: 0, imagesGeneratedToday: 0, lastImageDate: today });
        else setUsage(parsed);
      } catch(e) {}
    }
    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
      } catch (e) {}
    }
  }, []);

  useEffect(() => { localStorage.setItem(USAGE_KEY, JSON.stringify(usage)); }, [usage]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)); }, [sessions]);

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  const stopCurrentAudio = () => {
    if (currentAudioSourceRef.current) { 
      try { currentAudioSourceRef.current.stop(); } catch(e) {}
      currentAudioSourceRef.current = null; 
    }
    setPlayingMessageId(null);
  };

  const speakResponse = async (text: string, id: string) => {
    if (playingMessageId === id) { stopCurrentAudio(); return; }
    stopCurrentAudio();
    setPlayingMessageId(id);
    try {
      if (!audioContextRef.current) audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();
      
      const base64Audio = await getSpeechAudio(text);
      if (!base64Audio || abortControllerRef.current) { setPlayingMessageId(null); return; }
      
      const audioData = decodeBase64(base64Audio);
      if (audioData.length === 0) { setPlayingMessageId(null); return; }

      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      if (!audioBuffer) { setPlayingMessageId(null); return; }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => { if (playingMessageId === id) setPlayingMessageId(null); };
      currentAudioSourceRef.current = source;
      source.start();
    } catch (e) { 
      console.error("Playback error", e);
      setPlayingMessageId(null); 
    }
  };

  const handleSendMessage = async (text: string, image?: string, isRegenerate = false) => {
    if (!isOnline) return; 
    setApiError(null);
    if (appMode === 'image') { handleGenerateImage(text); return; }
    if (image && !usage.isPremium && usage.imagesSentToday >= 5) { setIsPremiumOpen(true); return; }

    stopCurrentAudio();
    abortControllerRef.current = false;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = { id: Date.now().toString(), title: text.substring(0, 30) || "New Chat", messages: [], lastUpdated: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(newSession.id);
    }

    if (!isRegenerate) {
      const newUserMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text, timestamp: Date.now(), image };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newUserMsg], lastUpdated: Date.now() } : s));
    } else {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, -1) } : s));
    }
    
    if (image) setUsage(prev => ({ ...prev, imagesSentToday: prev.imagesSentToday + 1 }));

    setIsLoading(true);
    try {
      const currentSession = sessions.find(s => s.id === activeSessionId);
      const history = currentSession ? currentSession.messages
        .filter((m, idx) => !isRegenerate || idx < currentSession.messages.length - 1)
        .map(m => ({ role: m.role, parts: [{ text: m.text }] })) : [];

      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = { id: aiMsgId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newAiMsg], lastUpdated: Date.now() } : s));

      const stream = await sendMessageStreamToGemini(text, history, isDeepThink, image, appMode === 'coding' ? 'coding' : 'education');
      let accumulatedText = "";
      for await (const chunk of stream) {
        if (abortControllerRef.current) break;
        accumulatedText += chunk.text || "";
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
          ...s, messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m)
        } : s));
      }
      if (isAutoSpeech && !abortControllerRef.current) speakResponse(accumulatedText, aiMsgId);
    } catch (error: any) { 
      setApiError(error.message || "Something went wrong.");
      // Cleanup blank message if error occurs immediately
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.text !== "") } : s));
    } finally { setIsLoading(false); }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (!usage.isPremium && usage.imagesGeneratedToday >= 5) { setIsPremiumOpen(true); return; }
    setIsLoading(true);
    let activeSessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) {
       const newSession: ChatSession = { id: activeSessionId, title: "Image Gen: " + prompt.substring(0, 15), messages: [], lastUpdated: Date.now() };
       setSessions(prev => [newSession, ...prev]);
       setCurrentSessionId(activeSessionId);
    }
    try {
      const imageUrl = await generateAiImage(prompt);
      if (imageUrl) {
        setUsage(prev => ({ ...prev, imagesGeneratedToday: prev.imagesGeneratedToday + 1 }));
        const aiMsg: Message = { id: Date.now().toString(), role: MessageRole.MODEL, text: "Generated image for: " + prompt, image: imageUrl, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg], lastUpdated: Date.now() } : s));
      }
    } catch(e) {
      setApiError("Failed to generate image.");
    } finally { setIsLoading(false); setAppMode('education'); }
  };

  const startListening = () => {
    if (!isOnline) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => handleSendMessage(e.results[0][0].transcript);
    recognition.start();
  };

  if (showSplash) return <SplashScreen />;
  if (!isOnline) return <OfflineNotice />;

  return (
    <div className="flex flex-col h-[100dvh] w-full bg-white dark:bg-gray-950 transition-colors overflow-hidden font-sans fixed inset-0 touch-none">
      <Header 
        isDark={isDark} isAutoSpeech={isAutoSpeech} isDeepThink={isDeepThink} isPremium={usage.isPremium}
        toggleTheme={() => { setIsDark(!isDark); document.documentElement.classList.toggle('dark'); localStorage.setItem('theme', !isDark ? 'dark' : 'light'); }}
        toggleAutoSpeech={() => { setIsAutoSpeech(!isAutoSpeech); localStorage.setItem(AUTO_SPEECH_KEY, (!isAutoSpeech).toString()); }}
        toggleDeepThink={() => setIsDeepThink(!isDeepThink)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden h-full touch-auto">
        {apiError && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[40] w-[90%] max-w-md animate-in slide-in-from-top-4 duration-300">
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-center gap-3 shadow-lg">
              <AlertCircle className="text-red-500 shrink-0" size={20} />
              <p className="text-xs font-bold text-red-700 dark:text-red-300 flex-1 leading-tight">{apiError}</p>
              <button onClick={() => setApiError(null)} className="p-1 hover:bg-red-100 dark:hover:bg-red-800 rounded-lg"><X size={16} /></button>
            </div>
          </div>
        )}

        <div className="flex-1 relative overflow-hidden flex flex-col h-full">
          <MessageList 
            messages={currentMessages} isLoading={isLoading} onSpeak={speakResponse} onStopSpeak={stopCurrentAudio}
            playingMessageId={playingMessageId} onRegenerate={() => handleSendMessage("", undefined, true)} onSendMessage={handleSendMessage}
          />
        </div>
        
        <div className="w-full bg-gradient-to-t from-white via-white/80 dark:from-gray-950 dark:via-gray-950/80 pb-safe pt-6 px-4 shrink-0 z-[45]">
          <TypewriterInput 
            onSend={handleSendMessage} onMicClick={startListening} onStop={() => { abortControllerRef.current = true; setIsLoading(false); }}
            isListening={isListening} isLoading={isLoading} disabled={isLoading}
            placeholderOverwrite={appMode === 'image' ? "Describe the educational image you want..." : undefined}
          />
          <Footer />
        </div>
      </main>

      <HistorySidebar 
        isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} sessions={sessions} currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId} onDeleteSession={(id) => { setSessions(prev => prev.filter(s => s.id !== id)); if (currentSessionId === id) setCurrentSessionId(null); }}
        onNewChat={() => { setCurrentSessionId(null); setAppMode('education'); setIsHistoryOpen(false); }}
        onStartCoding={() => { setCurrentSessionId(null); setAppMode('coding'); setIsHistoryOpen(false); }}
        onStartImageGen={() => { setCurrentSessionId(null); setAppMode('image'); setIsHistoryOpen(false); }}
      />
    </div>
  );
};

export default App;