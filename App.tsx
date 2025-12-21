import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import HistorySidebar from './components/HistorySidebar';
import { sendMessageToGemini, getSpeechAudio } from './services/geminiService';
import { Message, MessageRole, ChatSession } from './types';

// Utility functions for Audio Processing
function decodeBase64(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
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
}

const STORAGE_KEY = 'sm-ai-partner-sessions';
const AUTO_SPEECH_KEY = 'sm-ai-auto-speech';
const DEEP_THINK_KEY = 'sm-ai-deep-think';

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [isAutoSpeech, setIsAutoSpeech] = useState(true);
  const [isDeepThink, setIsDeepThink] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }

    setIsAutoSpeech(localStorage.getItem(AUTO_SPEECH_KEY) !== 'false');
    setIsDeepThink(localStorage.getItem(DEEP_THINK_KEY) === 'true');

    const savedSessions = localStorage.getItem(STORAGE_KEY);
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0 && !currentSessionId) {
          setCurrentSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Error parsing saved sessions", e);
      }
    }
  }, []);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    if (newIsDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const toggleAutoSpeech = () => {
    const newVal = !isAutoSpeech;
    setIsAutoSpeech(newVal);
    localStorage.setItem(AUTO_SPEECH_KEY, String(newVal));
    if (!newVal) stopCurrentAudio();
  };

  const toggleDeepThink = () => {
    const newVal = !isDeepThink;
    setIsDeepThink(newVal);
    localStorage.setItem(DEEP_THINK_KEY, String(newVal));
  };

  const createNewChat = () => {
    stopCurrentAudio();
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      lastUpdated: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
  };

  const handleSelectSession = (id: string) => {
    stopCurrentAudio();
    setCurrentSessionId(id);
  };

  const handleDeleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const currentMessages = currentSession?.messages || [];

  const stopCurrentAudio = () => {
    if (currentAudioSourceRef.current) {
      try { currentAudioSourceRef.current.stop(); } catch (e) {}
      currentAudioSourceRef.current = null;
    }
    setPlayingMessageId(null);
  };

  const speakResponse = async (text: string, messageId?: string) => {
    stopCurrentAudio();
    if (messageId) setPlayingMessageId(messageId);

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const audioDataB64 = await getSpeechAudio(text);
    if (!audioDataB64 || !audioContextRef.current) {
      setPlayingMessageId(null);
      return;
    }

    try {
      const audioBytes = decodeBase64(audioDataB64);
      const audioBuffer = await decodeAudioData(audioBytes, audioContextRef.current, 24000, 1);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.onended = () => { if (currentAudioSourceRef.current === source) setPlayingMessageId(null); };
      source.start();
      currentAudioSourceRef.current = source;
    } catch (e) {
      setPlayingMessageId(null);
    }
  };

  const handleSendMessage = async (text: string) => {
    stopCurrentAudio();
    let activeSessionId = currentSessionId;
    
    if (!activeSessionId) {
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: text.substring(0, 30) + (text.length > 30 ? '...' : ''),
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
      timestamp: Date.now()
    };

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return { ...s, messages: [...s.messages, newUserMsg], lastUpdated: Date.now() };
      }
      return s;
    }));

    setIsLoading(true);

    try {
      const sessionToUse = sessions.find(s => s.id === activeSessionId);
      const history = sessionToUse ? sessionToUse.messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      })) : [];

      const responseText = await sendMessageToGemini(text, history, isDeepThink);

      const aiMsgId = (Date.now() + 1).toString();
      const newAiMsg: Message = {
        id: aiMsgId,
        role: MessageRole.MODEL,
        text: responseText,
        timestamp: Date.now()
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          const newTitle = s.messages.length === 1 ? text.substring(0, 30) : s.title;
          return { ...s, title: newTitle, messages: [...s.messages, newAiMsg], lastUpdated: Date.now() };
        }
        return s;
      }));
      
      if (isAutoSpeech) speakResponse(responseText, aiMsgId);

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const recognitionRef = useRef<any>(null);
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (event: any) => handleSendMessage(event.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsListening(false);
      recognitionRef.current.onerror = () => setIsListening(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    stopCurrentAudio();
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Header 
        isDark={isDark} 
        isAutoSpeech={isAutoSpeech}
        isDeepThink={isDeepThink}
        toggleTheme={toggleTheme} 
        toggleAutoSpeech={toggleAutoSpeech}
        toggleDeepThink={toggleDeepThink}
        onOpenHistory={() => setIsHistoryOpen(true)} 
      />
      
      <HistorySidebar 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onNewChat={createNewChat}
      />

      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden relative">
        <div className="flex-1 overflow-hidden flex flex-col">
          <MessageList 
            messages={currentMessages} 
            isLoading={isLoading} 
            onSpeak={speakResponse}
            onStopSpeak={stopCurrentAudio}
            playingMessageId={playingMessageId}
          />
        </div>
        
        <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 pb-2 md:pb-4">
          <TypewriterInput 
            onSend={handleSendMessage} 
            onMicClick={toggleListening} 
            isListening={isListening} 
            disabled={isLoading}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;