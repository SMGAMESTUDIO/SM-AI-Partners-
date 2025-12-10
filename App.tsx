import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import MessageList from './components/MessageList';
import TypewriterInput from './components/TypewriterInput';
import { sendMessageToGemini } from './services/geminiService';
import { Message, MessageRole } from './types';

// Speech Recognition Type Definition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

const App: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Theme Handling
  useEffect(() => {
    // Check system preference or localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

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

  const handleResetChat = () => {
    if (window.confirm("Are you sure you want to start a new chat?")) {
      setMessages([]);
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    }
  };

  // Chat Handling
  const handleSendMessage = async (text: string) => {
    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: MessageRole.USER,
      text: text,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      // Create history for API
      const history = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const responseText = await sendMessageToGemini(text, history);

      const newAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: MessageRole.MODEL,
        text: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, newAiMsg]);
    } catch (error) {
      console.error("Failed to get response", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice Logic
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      
      // Attempt to support multiple languages or auto-detect
      // Note: Setting a specific lang helps accuracy. 
      // For now, we default to 'ur-PK' (Urdu) as it often picks up Sindhi/Urdu better, 
      // or 'en-US' mixed. Users might need to speak clearly.
      // Ideally, we'd have a language selector, but for simplicity:
      recognitionRef.current.lang = 'ur-PK'; // Defaulting to Urdu region for better Urdu/Sindhi support

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Voice recognition is not supported in this browser. Please use Chrome.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300`}>
      <Header isDark={isDark} toggleTheme={toggleTheme} onResetChat={handleResetChat} />
      
      <main className="flex-1 flex flex-col max-w-5xl w-full mx-auto overflow-hidden">
        <MessageList messages={messages} isLoading={isLoading} />
        
        <div className="w-full">
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