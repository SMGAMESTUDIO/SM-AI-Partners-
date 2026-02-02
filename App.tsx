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
    if (savedUsage) {
      const parsed = JSON.parse(savedUsage);
      const today = new Date().toISOString().split('T')[0];
      if (parsed.lastImageDate !== today) {
        setUsage({ ...parsed, imagesSentToday: 0, lastImageDate: today });
      } else {
        setUsage(parsed);
      }
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

    if (image && !usage.isPremium && usage.imagesSentToday >= 3) {
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