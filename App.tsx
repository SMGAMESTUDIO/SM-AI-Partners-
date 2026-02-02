import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import { sendMessageStreamToGemini, getSpeechAudio, generateAiImage } from './services/geminiService';
import { Message, MessageRole, ChatSession, UserUsage } from './types';
import { 
  Crown, X, Mail, CheckCircle2, Copy, Sparkles, Zap, Smartphone, 
  Globe, Landmark, ShieldCheck, Star, Trophy, Image as ImageIcon, 
  Info, Activity, ArrowLeft, ChevronRight, Square
} from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions';
const USAGE_KEY = 'sm-ai-usage';
const AUTO_SPEECH_KEY = 'sm-ai-auto-speech';

type AppMode = 'education' | 'coding' | 'image';

const decodeBase64 = (base64: string) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

const App: React.FC = () => {
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
      const parsed = JSON.parse(savedUsage);
      if (parsed.lastImageDate !== today) {
        setUsage({ ...parsed, imagesSentToday: 0, imagesGeneratedToday: 0, lastImageDate: today });
      } else {
        setUsage(parsed);
      }
    } else {
      setUsage(prev => ({ ...prev, lastImageDate: today }));
    }

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0 && !currentSessionId) setCurrentSessionId(parsed[0].id);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(USAGE_KEY, JSON.stringify(usage));
  }, [usage]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  }, [sessions]);

  const currentMessages = sessions.find(s => s.id === currentSessionId)?.messages || [];

  const handleStopGeneration = () => {
    abortControllerRef.current = true;
    setIsLoading(false);
  };

  const stopCurrentAudio = () => {
    if (currentAudioSourceRef.current) {
      currentAudioSourceRef.current.stop();
      currentAudioSourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const speakResponse = async (text: string, id: string) => {
    if (playingMessageId === id) {
      stopCurrentAudio();
      return;
    }
    stopCurrentAudio();
    setPlayingMessageId(id);
    try {
      const base64Audio = await getSpeechAudio(text);
      if (!base64Audio || abortControllerRef.current) {
        setPlayingMessageId(null);
        return;
      }
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      }
      const audioData = decodeBase64(base64Audio);
      const audioBuffer = await decodeAudioData(audioData, audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => { if (playingMessageId === id) setPlayingMessageId(null); };
      currentAudioSourceRef.current = source;
      source.start();
    } catch (e) { setPlayingMessageId(null); }
  };

  const handleSendMessage = async (text: string, image?: string, isRegenerate = false) => {
    if (appMode === 'image') {
      handleGenerateImage(text);
      return;
    }

    // Limit Uploads to 5 per day
    if (image && !usage.isPremium && usage.imagesSentToday >= 5) {
      setIsPremiumOpen(true);
      return;
    }

    stopCurrentAudio();
    abortControllerRef.current = false;

    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.substring(0, 30),
        messages: [],
        lastUpdated: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(newSession.id);
    }

    if (!isRegenerate) {
      const newUserMsg: Message = {
        id: Date.now().toString(),
        role: MessageRole.USER,
        text: text,
        timestamp: Date.now(),
        image: image
      };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newUserMsg], lastUpdated: Date.now() } : s));
    } else {
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: s.messages.slice(0, -1) } : s));
    }
    
    if (image) {
      setUsage(prev => ({ ...prev, imagesSentToday: prev.imagesSentToday + 1 }));
    }

    setIsLoading(true);
    try {
      const sessionToUse = sessions.find(s => s.id === activeSessionId);
      const history = sessionToUse ? sessionToUse.messages
        .filter((m, idx) => !isRegenerate || idx < sessionToUse.messages.length - 1)
        .map(m => ({ role: m.role, parts: [{ text: m.text }] })) : [];

      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = { id: aiMsgId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newAiMsg], lastUpdated: Date.now() } : s));

      const stream = await sendMessageStreamToGemini(text, history, isDeepThink, image, appMode === 'coding' ? 'coding' : 'education');
      let accumulatedText = "";

      for await (const chunk of stream) {
        if (abortControllerRef.current) break;
        const chunkText = chunk.text;
        if (chunkText) {
          accumulatedText += chunkText;
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
            ...s, 
            messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m)
          } : s));
        }
      }

      if (isAutoSpeech && !abortControllerRef.current) {
        speakResponse(accumulatedText, aiMsgId);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = false;
    }
  };

  const handleGenerateImage = async (prompt: string) => {
    // Limit Generations to 5 per day
    if (!usage.isPremium && usage.imagesGeneratedToday >= 5) {
      setIsPremiumOpen(true);
      return;
    }

    setIsLoading(true);
    let activeSessionId = currentSessionId;
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "Image: " + prompt.substring(0, 15),
        messages: [],
        lastUpdated: Date.now()
      };
      setSessions(prev => [newSession, ...prev]);
      activeSessionId = newSession.id;
      setCurrentSessionId(newSession.id);
    }
    const newUserMsg: Message = { id: Date.now().toString(), role: MessageRole.USER, text: "Generate image: " + prompt, timestamp: Date.now() };
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newUserMsg], lastUpdated: Date.now() } : s));
    
    try {
      const imageUrl = await generateAiImage(prompt);
      if (imageUrl) {
        setUsage(prev => ({ ...prev, imagesGeneratedToday: prev.imagesGeneratedToday + 1 }));
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: MessageRole.MODEL, text: "Here is your generated image:", image: imageUrl, timestamp: Date.now() };
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, aiMsg], lastUpdated: Date.now() } : s));
      }
    } catch (e) { console.error(e); } finally {
      setIsLoading(false);
      setAppMode('education');
    }
  };

  const handleRegenerate = () => {
    const lastUserMessage = [...currentMessages].reverse().find(m => m.role === MessageRole.USER);
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.text, lastUserMessage.image, true);
    }
  };

  const toggleTheme = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    document.documentElement.classList.toggle('dark', newVal);
    localStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  const handleNewChat = (mode: AppMode = 'education') => {
    setCurrentSessionId(null);
    setAppMode(mode);
    stopCurrentAudio();
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) { alert("Speech recognition not supported."); return; }
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => handleSendMessage(event.results[0][0].transcript);
    recognition.start();
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 transition-colors overflow-hidden font-sans">
      <Header 
        isDark={isDark} 
        isAutoSpeech={isAutoSpeech}
        isDeepThink={isDeepThink}
        isPremium={usage.isPremium}
        toggleTheme={toggleTheme} 
        toggleAutoSpeech={() => { setIsAutoSpeech(!isAutoSpeech); localStorage.setItem(AUTO_SPEECH_KEY, (!isAutoSpeech).toString()); }}
        toggleDeepThink={() => setIsDeepThink(!isDeepThink)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-white dark:bg-gray-950">
        <MessageList 
          messages={currentMessages} 
          isLoading={isLoading} 
          onSpeak={speakResponse}
          onStopSpeak={stopCurrentAudio}
          playingMessageId={playingMessageId}
          onRegenerate={handleRegenerate}
        />
        
        <div className="w-full bg-gradient-to-t from-white via-white/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 pb-6 pt-10">
          <TypewriterInput 
            onSend={handleSendMessage} 
            onMicClick={startListening}
            onStop={handleStopGeneration}
            isListening={isListening}
            isLoading={isLoading}
            disabled={isLoading && !abortControllerRef.current}
            placeholderOverwrite={
              appMode === 'image' ? "Describe the image you want..." :
              appMode === 'coding' ? "Paste code or ask a programming question..." : undefined
            }
          />
          <Footer />
        </div>
      </main>

      {/* Premium Modal */}
      {isPremiumOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsPremiumOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 text-center text-white">
              <div className="inline-flex p-4 bg-white/20 rounded-3xl backdrop-blur-xl mb-4 border border-white/20 animate-bounce-slow">
                <Crown size={40} className="text-yellow-400" fill="currentColor" />
              </div>
              <h2 className="text-3xl font-black tracking-tighter mb-1">SM PRO ACCESS</h2>
              <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Unlock the Future of Education</p>
            </div>
            
            <div className="p-8 space-y-4">
              {[
                { icon: <Zap className="text-yellow-500" />, title: "Unlimited AI Responses", desc: "No daily chat limits for education or coding." },
                { icon: <ImageIcon className="text-pink-500" />, title: "Unlimited HD Generations", desc: "Generate as many high-quality images as you want." },
                { icon: <Star className="text-blue-500" />, title: "Priority Thinking Mode", desc: "Access the most powerful reasoning models first." },
                { icon: <Trophy className="text-purple-500" />, title: "Ad-Free Experience", desc: "Zero interruptions, just pure focus and learning." }
              ].map((item, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 transition-all hover:border-blue-500/30 group">
                  <div className="shrink-0 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm group-hover:scale-110 transition-transform">{item.icon}</div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-gray-100">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-8 pt-0 flex flex-col gap-3">
              <button className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-lg shadow-blue-500/30 transition-all transform active:scale-95">
                Go Pro Now
              </button>
              <p className="text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">Secured by SM Gaming Studio</p>
            </div>
          </div>
        </div>
      )}

      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId}
        onDeleteSession={(id) => { setSessions(prev => prev.filter(s => s.id !== id)); if (currentSessionId === id) setCurrentSessionId(null); }}
        onNewChat={() => handleNewChat('education')}
        onStartCoding={() => { handleNewChat('coding'); setIsHistoryOpen(false); }}
        onStartImageGen={() => { handleNewChat('image'); setIsHistoryOpen(false); }}
      />
    </div>
  );
};

export default App;