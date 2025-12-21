import React, { useState, useEffect } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface TypewriterInputProps {
  onSend: (text: string) => void;
  onMicClick: () => void;
  isListening: boolean;
  disabled: boolean;
}

const PLACEHOLDERS = [
  "Ask School, College, or University questions...",
  "How to earn online through freelancing?",
  "Explain Quantum Physics like I'm 10...",
  "Help with Sindh Board/Oxford/Cambridge exam...",
  "Solve a complex Calculus problem...",
  "Ask about Islamiyat or History...",
  "Tips for Logo Design & Development..."
];

const TypewriterInput: React.FC<TypewriterInputProps> = ({ onSend, onMicClick, isListening, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentText = PLACEHOLDERS[placeholderIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentText.length) {
      typingSpeed = 2500;
      setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDERS.length);
      typingSpeed = 500;
    }

    const timer = setTimeout(() => {
      setPlaceholder(currentText.substring(0, charIndex + (isDeleting ? -1 : 1)));
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, placeholderIndex]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSend(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <div className="relative flex-grow group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            className="w-full p-4 pr-12 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            placeholder={placeholder}
          />
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none opacity-20 group-focus-within:opacity-40 transition-opacity">
            <kbd className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded">Enter</kbd>
          </div>
        </div>

        <button
          type="button"
          onClick={onMicClick}
          className={`p-4 rounded-2xl transition-all duration-300 shadow-md ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
          title="Voice Input (English/Urdu/Sindhi)"
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="submit"
          disabled={!inputValue.trim() || disabled}
          className="p-4 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-primary-500/25 active:scale-95"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
};

export default TypewriterInput;