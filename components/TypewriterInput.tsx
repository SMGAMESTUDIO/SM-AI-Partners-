import React, { useState, useEffect, useRef } from 'react';
import { Send, Mic, MicOff, Image as ImageIcon, X } from 'lucide-react';

interface TypewriterInputProps {
  onSend: (text: string, image?: string) => void;
  onMicClick: () => void;
  isListening: boolean;
  disabled: boolean;
}

const PLACEHOLDERS = [
  "Ask School, College, or University questions...",
  "Snap a math problem to solve it...",
  "Explain Quantum Physics like I'm 10...",
  "Help with Sindh Board/Oxford/Cambridge exam...",
  "Tips for Logo Design & Development..."
];

const TypewriterInput: React.FC<TypewriterInputProps> = ({ onSend, onMicClick, isListening, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="mb-2 relative inline-block">
          <img src={selectedImage} alt="Preview" className="h-20 w-20 object-cover rounded-xl border-2 border-primary-500 shadow-md" />
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
          >
            <X size={12} />
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
          className="p-4 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 hover:text-primary-600 transition-all shadow-sm"
          title="Attach Image (Max 3/day free)"
        >
          <ImageIcon size={24} />
        </button>

        <div className="relative flex-grow group">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={disabled}
            className="w-full p-4 pr-12 rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all shadow-sm"
            placeholder={placeholder}
          />
        </div>

        <button
          type="button"
          onClick={onMicClick}
          className={`p-4 rounded-2xl transition-all duration-300 shadow-md ${
            isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
          }`}
        >
          {isListening ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        <button
          type="submit"
          disabled={(!inputValue.trim() && !selectedImage) || disabled}
          className="p-4 rounded-2xl bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 transition-all shadow-lg active:scale-95"
        >
          <Send size={24} />
        </button>
      </form>
    </div>
  );
};

export default TypewriterInput;