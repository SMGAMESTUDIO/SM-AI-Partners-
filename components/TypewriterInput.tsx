import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Image as ImageIcon, X, Square } from 'lucide-react';

interface TypewriterInputProps {
  onSend: (text: string, image?: string) => void;
  onMicClick: () => void;
  onStop?: () => void;
  isListening: boolean;
  isLoading?: boolean;
  disabled: boolean;
  placeholderOverwrite?: string;
}

const DEFAULT_PLACEHOLDERS = [
  "Ask School, College, or University questions...",
  "How to earn online through freelancing?",
  "Explain Physics concepts step-by-step...",
  "Help with Math or Science assignments..."
];

const TypewriterInput: React.FC<TypewriterInputProps> = ({ 
  onSend, 
  onMicClick, 
  onStop, 
  isListening, 
  isLoading, 
  disabled,
  placeholderOverwrite
}) => {
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (placeholderOverwrite) {
      setPlaceholder(placeholderOverwrite);
      return;
    }

    const currentText = DEFAULT_PLACEHOLDERS[placeholderIndex];
    let typingSpeed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentText.length) {
      typingSpeed = 2500;
      setTimeout(() => setIsDeleting(true), 2500);
    } else if (isDeleting && charIndex === 0) {
      setIsDeleting(false);
      setPlaceholderIndex((prev) => (prev + 1) % DEFAULT_PLACEHOLDERS.length);
      typingSpeed = 500;
    }

    const timer = setTimeout(() => {
      setPlaceholder(currentText.substring(0, charIndex + (isDeleting ? -1 : 1)));
      setCharIndex((prev) => prev + (isDeleting ? -1 : 1));
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [charIndex, isDeleting, placeholderIndex, placeholderOverwrite]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() || selectedImage) {
      onSend(inputValue, selectedImage || undefined);
      setInputValue('');
      setSelectedImage(null);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      {selectedImage && (
        <div className="mb-2 relative inline-block animate-in zoom-in-95">
          <img src={selectedImage} alt="Preview" className="h-16 w-16 object-cover rounded-xl border-2 border-blue-500 shadow-md" />
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
          >
            <X size={10} />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-blue-600 hover:bg-gray-200 transition-all shadow-sm disabled:opacity-30"
          title="Attach Image"
        >
          <ImageIcon size={24} />
        </button>

        <div className="relative flex-grow group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            className="w-full p-4 pr-12 rounded-2xl border-2 border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm disabled:opacity-50"
            placeholder={placeholder}
          />
        </div>

        {!isLoading ? (
          <button
            type="button"
            onClick={onMicClick}
            className={`p-4 rounded-2xl transition-all shadow-md ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 transition-all shadow-sm"
          >
            <Square size={24} fill="currentColor" />
          </button>
        )}

        <button
          type="submit"
          disabled={(!inputValue.trim() && !selectedImage) || isLoading}
          className="p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg active:scale-95 disabled:opacity-50"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
};

export default TypewriterInput;