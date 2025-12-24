import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import { sendMessageStreamToGemini, getSpeechAudio } from './services/geminiService';
import { Message, MessageRole, ChatSession, UserUsage } from './types';
import { 
  Crown, X, Mail, CheckCircle2, Copy, Sparkles, Zap, Smartphone, 
  Globe, Landmark, ShieldCheck, Star, Trophy, Image as ImageIcon, 
  Info, Activity, ArrowLeft, ChevronRight, CreditCard 
} from 'lucide-react';

const STORAGE_KEY = 'sm-ai-partner-sessions';
const USAGE_KEY = 'sm-ai-usage';
const AUTO_SPEECH_KEY = 'sm-ai-auto-speech';
const HIDE_NUDGE_KEY = 'sm-ai-hide-nudge';

interface PremiumPlan {
  id: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  offerPrice: string;
  imagesPerDay: string;
  features: string[];
  themeColor: string;
  icon: React.ReactNode;
}

const PLANS: PremiumPlan[] = [
  {
    id: 'basic',
    name: 'Basic Premium',
    monthlyPrice: '500',
    yearlyPrice: '5,000',
    offerPrice: '5,000',
    imagesPerDay: '10',
    themeColor: 'blue',
    icon: <Star size={24} />,
    features: ["Standard AI Logic", "Access to Basic Files", "Email Support"]
  },
  {
    id: 'standard',
    name: 'Standard Premium',
    monthlyPrice: '1,000',
    yearlyPrice: '10,000',
    offerPrice: '8,000',
    imagesPerDay: '30',
    themeColor: 'indigo',
    icon: <Zap size={24} />,
    features: ["Advanced Reasoning AI", "Full Pro PDF Access", "Priority Support", "Ads-Free Experience"]
  },
  {
    id: 'ultra',
    name: 'Ultra Premium',
    monthlyPrice: '2,000',
    yearlyPrice: '20,000',
    offerPrice: '15,000',
    imagesPerDay: 'Unlimited',
    themeColor: 'amber',
    icon: <Trophy size={24} />,
    features: ["Elite AI Engine", "All Premium Tools", "VIP Direct Support", "Exclusive Beta Features"]
  }
];

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
  const [showNudge, setShowNudge] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<PremiumPlan | null>(null);
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

    const savedNudgeStatus = localStorage.getItem(HIDE_NUDGE_KEY);
    if (savedNudgeStatus === 'true') setShowNudge(false);

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

  const handleSendMessage = async (text: string, image?: string, isRegenerate = false) => {
    if (image && !usage.isPremium && usage.imagesSentToday >= 3) {
      setIsPremiumOpen(true);
      return;
    }

    const pdfKeywords = ['download pdf', 'generate pdf', 'pdf file', 'give me file', 'save as pdf'];
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
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })) : [];

      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = { id: aiMsgId, role: MessageRole.MODEL, text: "", timestamp: Date.now() };
      
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, newAiMsg], lastUpdated: Date.now() } : s));

      const stream = await sendMessageStreamToGemini(text, history, isDeepThink, image);
      let accumulatedText = "";

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          accumulatedText += chunkText;
          setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
            ...s, 
            messages: s.messages.map(m => m.id === aiMsgId ? { ...m, text: accumulatedText } : m)
          } : s));
        }
      }

      if (isAutoSpeech) {
        speakResponse(accumulatedText, aiMsgId);
      }
    } catch (error) {
      console.error("Streaming Error:", error);
    } finally {
      setIsLoading(false);
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
    alert('Account Detail Copied!');
  };

  const handleOpenPremium = () => {
    setSelectedPlan(null);
    setIsPremiumOpen(true);
  };

  const handleDismissNudge = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowNudge(false);
    localStorage.setItem(HIDE_NUDGE_KEY, 'true');
  };

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-950 transition-colors">
      <Header 
        isDark={isDark} 
        isAutoSpeech={isAutoSpeech}
        isDeepThink={isDeepThink}
        isPremium={usage.isPremium}
        toggleTheme={toggleTheme} 
        toggleAutoSpeech={handleToggleAutoSpeech}
        toggleDeepThink={() => setIsDeepThink(!isDeepThink)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenPremium={handleOpenPremium}
      />

      {/* PREMIUM MODAL */}
      {isPremiumOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/85 backdrop-blur-xl" onClick={() => setIsPremiumOpen(false)} />
          <div className="relative w-full max-w-7xl bg-white dark:bg-gray-900 rounded-[3rem] shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-300">
            
            <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-indigo-900 p-10 text-white relative flex-shrink-0">
              <div className="flex items-center justify-center gap-4 mb-2">
                {selectedPlan && (
                  <button 
                    onClick={() => setSelectedPlan(null)}
                    className="absolute left-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all flex items-center gap-2 pr-4"
                  >
                    <ArrowLeft size={20} /> <span className="text-xs font-black uppercase">Back</span>
                  </button>
                )}
                <Crown size={48} className="text-yellow-300 drop-shadow-[0_0_15px_rgba(253,224,71,0.5)] animate-bounce-slow" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-1 text-center">
                {selectedPlan ? "Complete Your Order" : "SM AI Partner Premium"}
              </h2>
              <button onClick={() => setIsPremiumOpen(false)} className="absolute top-10 right-10 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all">
                <X size={24} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 md:p-12 scroll-smooth">
              {!selectedPlan ? (
                /* Plan Selection List */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                  {/* Current / Free Card */}
                  <div className={`flex flex-col p-6 rounded-[2.5rem] border-2 transition-all ${!usage.isPremium ? 'bg-blue-50/30 dark:bg-blue-900/10 border-blue-500 shadow-xl' : 'bg-gray-50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-800 opacity-60'}`}>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-xl text-blue-600 dark:text-blue-300"><Activity size={20} /></div>
                      <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">Current Plan</h3>
                    </div>
                    <div className="mb-6">
                      <p className="text-3xl font-black text-gray-900 dark:text-white">Free</p>
                    </div>
                    <div className="space-y-3 mb-8 flex-1">
                      <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <ImageIcon size={16} className="text-blue-400" />
                        <span className="text-[11px] font-black">3 Images / 24 Hours</span>
                      </div>
                    </div>
                    <button className="w-full py-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-2xl font-black text-xs uppercase">
                      {!usage.isPremium ? 'Currently Active' : 'Limited Access'}
                    </button>
                  </div>

                  {PLANS.map((plan) => (
                    <div key={plan.id} onClick={() => setSelectedPlan(plan)} className={`group cursor-pointer flex flex-col p-6 rounded-[2.5rem] border-2 transition-all hover:scale-[1.02] hover:shadow-2xl ${plan.id === 'standard' ? 'bg-indigo-50/30 dark:bg-indigo-950/10 border-indigo-400' : 'bg-white dark:bg-gray-800/40 border-gray-100 dark:border-gray-800 hover:border-blue-500'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-3 rounded-2xl text-white shadow-lg ${plan.themeColor === 'blue' ? 'bg-blue-600' : plan.themeColor === 'indigo' ? 'bg-indigo-600' : 'bg-amber-500'}`}>{plan.icon}</div>
                        <h3 className="text-sm font-black dark:text-white uppercase tracking-tighter">{plan.name}</h3>
                      </div>
                      <div className="space-y-4 mb-6">
                        <div>
                          <p className="text-3xl font-black text-gray-900 dark:text-white">PKR {plan.monthlyPrice}</p>
                          <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Per Month</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <p className="text-lg font-black text-green-600 dark:text-green-400">PKR {plan.offerPrice}</p>
                           {plan.yearlyPrice !== plan.offerPrice && (
                             <span className="text-[10px] line-through text-gray-400">PKR {plan.yearlyPrice}</span>
                           )}
                           <span className="text-[9px] text-gray-400 font-bold">/ YEAR</span>
                        </div>
                      </div>
                      <div className="space-y-3 mb-8 flex-1">
                        <div className={`flex items-center gap-2 p-3 rounded-xl border font-black text-[11px] ${plan.themeColor === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-600' : plan.themeColor === 'indigo' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
                          <ImageIcon size={16} /> {plan.imagesPerDay} Images / 24 Hours
                        </div>
                      </div>
                      <button className={`w-full py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all text-white shadow-lg ${plan.themeColor === 'blue' ? 'bg-blue-600' : plan.themeColor === 'indigo' ? 'bg-indigo-600' : 'bg-amber-500'}`}>
                        Select Plan <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                /* Step 2: Checkout */
                <div className="max-w-4xl mx-auto animate-in slide-in-from-right-10 duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="md:col-span-1 bg-gray-50 dark:bg-gray-800/40 p-8 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 h-fit">
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-2xl text-white shadow-lg ${selectedPlan.themeColor === 'blue' ? 'bg-blue-600' : selectedPlan.themeColor === 'indigo' ? 'bg-indigo-600' : 'bg-amber-500'}`}>{selectedPlan.icon}</div>
                        <h3 className="text-xl font-black uppercase tracking-tight">{selectedPlan.name}</h3>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-xs font-bold text-gray-500 uppercase">Monthly Subscription</span>
                          <span className="font-black">PKR {selectedPlan.monthlyPrice}</span>
                        </div>
                        <div className="flex justify-between items-center py-3 border-b border-gray-100 dark:border-gray-800">
                          <span className="text-xs font-bold text-gray-500 uppercase">Yearly Offer Price</span>
                          <span className="font-black text-green-600">PKR {selectedPlan.offerPrice}</span>
                        </div>
                        <div className="flex justify-between items-center py-3">
                          <span className="text-xs font-bold text-gray-500 uppercase">Daily Images</span>
                          <span className="font-black text-blue-500">{selectedPlan.imagesPerDay}</span>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2 space-y-6">
                       <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                        <CreditCard size={20} className="text-blue-600" /> Payment Methods
                       </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {[{ bank: "Easypaisa", id: "03213961348" }, { bank: "Jazz Cash", id: "03213961348" }].map((p, i) => (
                          <div key={i} className="group bg-white dark:bg-gray-800/40 p-6 rounded-3xl border border-gray-100 dark:border-gray-800 hover:border-blue-500 transition-all">
                            <div className="flex justify-between mb-4">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{p.bank}</p>
                              <button onClick={() => copyToClipboard(p.id)} className="p-2 text-blue-500 hover:scale-110 transition-transform"><Copy size={16} /></button>
                            </div>
                            <p className="text-lg font-mono font-black tracking-widest text-gray-900 dark:text-white">{p.id}</p>
                            <p className="text-[10px] font-bold text-blue-500 mt-1 uppercase">Shoaib Ahmed</p>
                          </div>
                        ))}
                      </div>
                      <div className="p-6 bg-blue-600 rounded-[2.5rem] text-white shadow-xl shadow-blue-600/20">
                        <h4 className="font-black uppercase mb-2 flex items-center gap-2">
                           <ShieldCheck size={18} /> Send Verification
                        </h4>
                        <p className="text-xs text-blue-100 mb-4 font-medium opacity-90">Please send a screenshot of the transaction to our official email for activation.</p>
                        <div className="flex items-center justify-between bg-white/10 p-3 rounded-2xl cursor-pointer hover:bg-white/20 transition-all" onClick={() => copyToClipboard('smgamingstudioofficial@gmail.com')}>
                          <span className="text-[11px] font-black tracking-wider">smgamingstudioofficial@gmail.com</span>
                          <Copy size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="p-8 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 text-center">
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.8em]">Powered by SM GAMING STUDIO</p>
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

      <main className="flex-1 flex flex-col max-w-4xl w-full mx-auto overflow-hidden relative">
        <MessageList 
          messages={currentMessages} isLoading={isLoading} 
          onSpeak={speakResponse} onStopSpeak={stopCurrentAudio} playingMessageId={playingMessageId}
          onRegenerate={handleRegenerate}
        />
        
        <div className="relative pb-4 pt-2">
          {/* Floating Premium Nudge */}
          {!usage.isPremium && showNudge && (
            <div className="absolute bottom-full left-4 right-4 mb-4 animate-in slide-in-from-bottom-5 duration-500">
              <div 
                onClick={handleOpenPremium}
                className="group cursor-pointer relative flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 via-indigo-700 to-indigo-800 rounded-3xl shadow-2xl border border-white/10 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                    <Sparkles className="text-yellow-300 animate-pulse" size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-tight">Upgrade to SM Partner Plus</h4>
                    <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest opacity-80">Unlimited Images • PDF Pro • Elite AI</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 relative z-10">
                  <span className="hidden sm:block text-[10px] font-black bg-white/20 text-white px-4 py-2 rounded-full uppercase tracking-widest group-hover:bg-white/30 transition-all">Get Pro</span>
                  <button 
                    onClick={handleDismissNudge}
                    className="p-2 hover:bg-white/20 rounded-xl transition-all text-white/60 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto px-4 mb-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl text-[9px] font-black text-gray-500 uppercase tracking-widest shadow-sm">
                <Info size={10} className="text-blue-500" />
                <span>Plan Usage: <span className={usage.imagesSentToday >= (usage.isPremium ? 999 : 3) ? "text-red-500" : "text-blue-500"}>{usage.imagesSentToday}</span> / {usage.isPremium ? '∞' : '3'} Images Solved</span>
              </div>
              {!usage.isPremium && !showNudge && (
                <button onClick={handleOpenPremium} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                  Show Offers
                </button>
              )}
            </div>
          </div>
          <TypewriterInput onSend={handleSendMessage} onMicClick={() => {}} isListening={isListening} disabled={isLoading} />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;