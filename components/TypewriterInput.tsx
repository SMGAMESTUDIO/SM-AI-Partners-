import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff } from 'lucide-react';

interface TypewriterInputProps {
  onSend: (text: string) => void;
  onMicClick: () => void;
  isListening: boolean;
  disabled: boolean;
}

const PLACEHOLDERS = [
  "Ask Mathematics Questions...",
  "Ask General Knowledge Questions...",
  "Ask Science Questions...",
  "Ask Physics Questions...",
  "Ask Biology Questions...",
  "Ask General Questions...",
  "Ask Islamiyat Questions..."
];

const TypewriterInput: React.FC<TypewriterInputProps> = ({ onSend, onMicClick, isListening, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  // Typewriter effect logic
  useEffect(() => {
    const currentText = PLACEHOLDERS[placeholderIndex];
    let typingSpeed = isDeleting ? 50 : 100;

    if (!isDeleting && charIndex === currentText.length) {
      // Finished typing, wait before deleting
      typingSpeed = 2000;
      setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && charIndex === 0) {
      // Finished deleting, move to next string
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
        <div className="relative flex-grow">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            className="w-full p-4 pr-12 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all shadow-sm"
            placeholder={placeholder}
          />
        </div>

        <button
          type="button"
          onClick={onMicClick}
          className={`p-4 rounded-full transition-all duration-300 ${
            isListening 
              ? 'bg-red-500 text-white animate-pulse' 
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          }`}
          title="Voice Input (English/Urdu/Sindhi)"
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="submit"
          disabled={!inputValue.trim() || disabled}
          className="p-4 rounded-full bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
};

export default TypewriterInput;