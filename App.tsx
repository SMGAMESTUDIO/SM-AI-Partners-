
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
import { AlertCircle, X, Key, Info } from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions-v3';
const USAGE_KEY = 'sm-ai-usage-v3';
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
    
    stopCurrentAudio();
    abortControllerRef.current = false;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      activeSessionId = Date.now().toString();
      const newSession: ChatSession = { id: activeSessionId, title: text.substring(0, 30) || "New Chat", messages: [], lastUpdated: Date.now() };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(activeSessionId);
    }

    const newUserMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text, timestamp: Date.now(), image };
    
    const sessionToUse = sessions.find(s => s.id === activeSessionId);
    const historyBeforeNewMsg = (sessionToUse?.messages || [])
      .filter(m => m.text.trim() !== "" || m.image)
      .map(m => ({
        role: m.role,
        parts: [
          ...(m.image ? [{ inlineData: { mimeType: "image/jpeg", data: m.image.split(',')[1] || m.image } }] : []),
          { text: m.text || (m.image ? "Image uploaded" : "") }
        ]
      }));

    if (!isRegenerate) {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newUserMsg], lastUpdated: Date.now() } : s));
    } else {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, -1) } : s));
    }
    
    if (image) setUsage(prev => ({ ...prev, imagesSentToday: prev.imagesSentToday + 1 }));

    setIsLoading(true);
    try {
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = { id: aiMsgId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newAiMsg], lastUpdated: Date.now() } : s));

      const stream = await sendMessageStreamToGemini(text, historyBeforeNewMsg, isDeepThink, image, appMode === 'coding' ? 'coding' : 'education');
      
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
      console.error("App Error:", error);
      const msg = error.message?.toLowerCase() || "";
      const isKeyError = msg.includes("key") || msg.includes("browser") || msg.includes("undefined");
      
      setApiError(isKeyError 
        ? "API Key Missing in Browser. Your build didn't inject the key correctly." 
        : (error.message || "Connection error."));
        
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.filter(m => m.role === 'user' || (m.role === 'model' && m.text !== "")) } : s));
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    if (!usage.isPremium && usage.imagesGeneratedToday >= 5) { setIsPremiumOpen(true); return; }
    setIsLoading(true);
    setApiError(null);
    let activeSessionId = currentSessionId || Date.now().toString();
    if (!currentSessionId) {
       const newSession: ChatSession = { id: activeSessionId, title: "Image: " + prompt.substring(0, 15), messages: [], lastUpdated: Date.now() };
       setSessions(prev => [newSession, ...prev]);
       setCurrentSessionId(activeSessionId);
    }
    try {
      const imageUrl = await generateAiImage(prompt);
      if (imageUrl) {
        setUsage(prev => ({ ...prev, imagesGeneratedToday: prev.imagesGeneratedToday + 1 }));
        const aiMsg: Message = { id: Date.now().toString(), role: MessageRole.MODEL, text: "Generated: " + prompt, image: imageUrl, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg], lastUpdated: Date.now() } : s));
      } else {
        setApiError("Image generation failed.");
      }
    } catch(e) {
      setApiError("Failed to generate image.");
    } finally { setIsLoading(false); setAppMode('education'); }
  };

  const startListening = () => {
    if (!isOnline) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'en-US';
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
          <div className="absolute inset-x-0 top-0 z-[100] p-4 animate-in slide-in-from-top duration-300">
            <div className="max-w-xl mx-auto bg-white dark:bg-gray-900 border-2 border-red-500 rounded-[2rem] shadow-2xl overflow-hidden backdrop-blur-xl">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600">
                    <AlertCircle size={28} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none">Vercel Configuration Error</h3>
                    <p className="text-xs font-bold text-gray-500 mt-1">Please follow these steps exactly:</p>
                  </div>
                  <button onClick={() => setApiError(null)} className="ml-auto p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</div>
                    <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                      Vercel Dashboard par jayen aur Environment Variables mein <span className="text-blue-600 italic">API_KEY</span> check karein.
                    </p>
                  </div>
                  
                  <div className="flex gap-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">2</div>
                    <p className="text-[13px] font-bold text-gray-700 dark:text-gray-300">
                      Variable edit karein aur <span className="text-pink-600 underline font-black">Preview</span> aur <span className="text-pink-600 underline font-black">Development</span> ke dabbaon (checkboxes) ko lazmi tick karein.
                    </p>
                  </div>

                  <div className="flex gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                    <Info size={18} className="text-blue-600 shrink-0" />
                    <p className="text-[12px] font-bold text-blue-800 dark:text-blue-300">
                      Aap Preview URL (vercel.app) use kar rahe hain, isliye Preview mode enable karna zaroori hai. Save karne ke baad **REDEPLOY** lazmi karein.
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => window.location.reload()}
                  className="w-full mt-6 py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
                >
                  Reload App After Redeploy
                </button>
              </div>
            </div>
          </div>
        )}

        <MessageList 
          messages={currentMessages} 
          isLoading={isLoading}
          onSpeak={speakResponse}
          onStopSpeak={stopCurrentAudio}
          playingMessageId={playingMessageId}
          onRegenerate={() => {
            const lastUserMsg = currentMessages.filter(m => m.role === MessageRole.USER).pop();
            if (lastUserMsg) handleSendMessage(lastUserMsg.text, lastUserMsg.image, true);
          }}
          onSendMessage={handleSendMessage}
        />

        <TypewriterInput 
          onSend={handleSendMessage}
          onMicClick={startListening}
          onStop={() => { abortControllerRef.current = true; setIsLoading(false); }}
          isListening={isListening}
          isLoading={isLoading}
          disabled={isLoading}
          placeholderOverwrite={appMode === 'image' ? "Describe the image you want to generate..." : undefined}
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
