import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import { sendMessageToGemini, getSpeechAudio } from './services/geminiService';
import { Message, MessageRole, ChatSession, UserUsage } from './types';
import { Crown, X, Mail, CheckCircle2, CreditCard, Copy, ExternalLink, ShieldCheck, Zap, Sparkles } from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions';
const USAGE_KEY = 'sm-ai-usage';
const AUTO_SPEECH_KEY = 'sm-ai-auto-speech';

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
        if (parsed.length > 0) setCurrentSessionId(parsed[0].id);
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

  const handleSendMessage = async (text: string, image?: string) => {
    if (image && !usage.isPremium && usage.imagesSentToday >= 3) {
      setIsPremiumOpen(true);
      return;
    }

    const pdfKeywords = ['download pdf', 'generate pdf', 'pdf file', 'give me file'];
    if (!usage.isPremium && pdfKeywords.some(k => text.toLowerCase().includes(k))) {
       setIsPremiumOpen(true);
       return;
    }

    stopCurrentAudio();
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

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text,
      timestamp: Date.now(),
      image: image
    };

    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newUserMsg], lastUpdated: Date.now() } : s));
    
    if (image) {
      setUsage(prev => ({ ...prev, imagesSentToday: prev.imagesSentToday + 1 }));
    }

    setIsLoading(true);
    try {
      const sessionToUse = sessions.find(s => s.id === activeSessionId);
      const history = sessionToUse ? sessionToUse.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })) : [];

      const responseText = await sendMessageToGemini(text, history, isDeepThink, image);
      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = { id: aiMsgId, role: MessageRole.MODEL, text: responseText, timestamp: Date.now() };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newAiMsg], lastUpdated: Date.now() } : s));
      
      if (isAutoSpeech) {
        speakResponse(responseText, aiMsgId);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = () => {
    const newVal = !isDark;
    setIsDark(newVal);
    document.documentElement.classList.toggle('dark', newVal);
    localStorage.setItem('theme', newVal ? 'dark' : 'light');
  };

  const handleToggleAutoSpeech = () => {
    const newVal = !isAutoSpeech;
    setIsAutoSpeech(newVal);
    localStorage.setItem(AUTO_SPEECH_KEY, String(newVal));
    if (!newVal) {
      stopCurrentAudio();
    }
  };

  const stopCurrentAudio = () => {
    if (currentAudioSourceRef.current) {
      try { currentAudioSourceRef.current.stop(); } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const speakResponse = async (text: string, messageId: string) => {
    if (playingMessageId === messageId) {
      stopCurrentAudio();
      return;
    }

    stopCurrentAudio();
    setPlayingMessageId(messageId);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    try {
      const audioDataB64 = await getSpeechAudio(text);
      if (audioDataB64) {
        const bytes = decodeBase64(audioDataB64);
        const buffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => {
          if (playingMessageId === messageId) setPlayingMessageId(null);
        };
        source.start();
        currentAudioSourceRef.current = source;
      } else {
        setPlayingMessageId(null);
      }
    } catch (e) {
      setPlayingMessageId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Detail copied to clipboard.');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <Header 
        isDark={isDark} 
        isAutoSpeech={isAutoSpeech}
        isDeepThink={isDeepThink}
        isPremium={usage.isPremium}
        toggleTheme={toggleTheme} 
        toggleAutoSpeech={handleToggleAutoSpeech}
        toggleDeepThink={() => setIsDeepThink(!isDeepThink)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPremium={() => setIsPremiumOpen(true)}
      />

      {/* Modernized English Premium Modal */}
      {isPremiumOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsPremiumOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-gray-950 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/5 flex flex-col max-h-[95vh]">
            
            <div className="bg-gradient-to-br from-blue-700 via-indigo-800 to-purple-800 p-8 text-center text-white relative flex-shrink-0">
              <Crown size={56} className="mx-auto mb-2 animate-bounce text-yellow-300" />
              <h2 className="text-3xl font-black uppercase tracking-tight">SM AI PARTNER <span className="text-yellow-300">PREMIUM</span></h2>
              <p className="text-white/80 font-bold uppercase text-[10px] tracking-[0.4em] mb-1">UNLEASH THE POWER OF EDUCATION</p>
              <button 
                onClick={() => setIsPremiumOpen(false)}
                className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth">
              
              <section>
                 <div className="flex items-center gap-2 mb-4">
                    <ShieldCheck className="text-blue-500" size={24} />
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-gray-100">🔓 What is Premium?</h3>
                 </div>
                 <p className="text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed border-l-4 border-blue-500 pl-4">
                   SM AI Partner Premium offers users advanced AI features, unlimited usage, and exclusive benefits not available in the free version. It's built for serious students and professionals.
                 </p>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-blue-500 mb-4 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-lg inline-block">🎁 Premium Benefits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    "Unlimited AI Questions & Responses",
                    "Unlimited Image Uploads (Solving Problems)",
                    "Free PDF & Document Exports",
                    "No Advertisements (Clean Experience)",
                    "Priority Technical Support",
                    "Early Access to New Features"
                  ].map((benefit, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
                      <CheckCircle2 size={16} className="text-green-500" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">{benefit}</span>
                    </div>
                  ))}
                </div>
              </section>

              <section>
                <h3 className="text-sm font-black uppercase tracking-widest text-pink-500 mb-4 bg-pink-50 dark:bg-pink-950/30 px-3 py-1 rounded-lg inline-block">💰 Plans & Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl border-2 border-indigo-100 dark:border-indigo-900/50 bg-white dark:bg-gray-900 text-center shadow-md">
                    <p className="text-xs font-black uppercase text-gray-400">Monthly Plan</p>
                    <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-2">PKR 499</p>
                  </div>
                  <div className="p-6 rounded-3xl border-2 border-pink-500 bg-white dark:bg-gray-900 text-center relative shadow-xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-pink-500 text-white text-[9px] font-black px-4 py-1 rounded-full uppercase">Best Value</div>
                    <p className="text-xs font-black uppercase text-gray-400">Yearly Plan</p>
                    <p className="text-2xl font-black text-pink-600 dark:text-pink-400 mt-2">PKR 3,999</p>
                  </div>
                </div>
              </section>

              <section className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/50 space-y-4">
                <div className="flex items-center gap-3 mb-2">
                  <CreditCard className="text-indigo-600 dark:text-indigo-400" size={24} />
                  <h3 className="text-lg font-black uppercase tracking-tight text-indigo-900 dark:text-indigo-100">Payment Accounts</h3>
                </div>
                
                <div className="space-y-3">
                  {[
                    { bank: "Easypaisa IBAN", iban: "PK23TMFB0000000047101668", name: "Shoaib Ahmed" },
                    { bank: "Jazz Cash IBAN", iban: "PK27JCMA1401923213961348", name: "Shoaib Ahmed" },
                    { bank: "JS Zindagi IBAN", iban: "PK22JSBL9999903213961348", name: "Shoaib Ahmed" },
                    { bank: "UPaisa IBAN", iban: "PK38UMBL0000032139613480", name: "Shoaib Ahmed" },
                    { bank: "Payoneer Acc", iban: "70586350000735785", name: "Shoaib Ahmed" }
                  ].map((p, i) => (
                    <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-white dark:bg-gray-900 rounded-2xl border border-indigo-100 dark:border-indigo-900 gap-2">
                      <div>
                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{p.bank}</p>
                        <p className="text-[12px] font-mono font-black text-gray-800 dark:text-white break-all">{p.iban}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Beneficiary: {p.name}</p>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(p.iban)}
                        className="p-2 bg-blue-50 dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-600 hover:text-white transition-all text-[10px] font-black uppercase"
                      >
                        <Copy size={14} className="inline mr-1" /> Copy
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-5 bg-yellow-50 dark:bg-yellow-900/10 rounded-3xl border-2 border-dashed border-yellow-200 dark:border-yellow-800/30">
                  <p className="text-[12px] font-bold text-yellow-800 dark:text-yellow-400 leading-relaxed text-center">
                    Note: After making the payment, please send the screenshot to the email addresses below for activation. Verification usually takes 5-10 minutes.
                  </p>
                </div>
              </section>

              <div className="flex flex-col gap-4 pb-4">
                <h4 className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Send Screenshot To</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <a href="mailto:smgamingstudioofficial@gmail.com" className="flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-2xl text-xs font-black shadow-lg">
                    <Mail size={16} /> smgamingstudioofficial@gmail.com
                  </a>
                  <a href="mailto:smaipartner.contact@gmail.com" className="flex items-center justify-center gap-3 p-4 bg-indigo-600 text-white rounded-2xl text-xs font-black shadow-lg">
                    <Mail size={16} /> smaipartner.contact@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <HistorySidebar 
        isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)}
        sessions={sessions} currentSessionId={currentSessionId}
        onSelectSession={setCurrentSessionId} onDeleteSession={(id) => setSessions(s => s.filter(x => x.id !== id))}
        onNewChat={() => setCurrentSessionId(null)}
      />

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden relative">
        <MessageList 
          messages={currentMessages} isLoading={isLoading} 
          onSpeak={speakResponse} onStopSpeak={stopCurrentAudio} playingMessageId={playingMessageId}
        />
        
        {/* ChatGPT Style Premium Banner (Always visible for free users) */}
        {!usage.isPremium && (
          <div className="px-6 mb-2">
            <button 
              onClick={() => setIsPremiumOpen(true)}
              className="w-full p-4 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-indigo-900 rounded-3xl flex items-center justify-between group hover:border-indigo-400 transition-all shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-xl">
                  <Sparkles className="text-indigo-600 dark:text-indigo-400" size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black uppercase text-gray-800 dark:text-white tracking-tight">Upgrade to SM AI PARTNER PRO</p>
                  <p className="text-[9px] font-bold text-gray-500 uppercase">Unlock Unlimited Images, PDF Export & Faster Reasoning</p>
                </div>
              </div>
              <div className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase group-hover:scale-105 transition-transform">
                Upgrade
              </div>
            </button>
          </div>
        )}

        <TypewriterInput onSend={handleSendMessage} onMicClick={() => {}} isListening={isListening} disabled={isLoading} />
      </main>
      <Footer />
    </div>
  );
};

export default App;