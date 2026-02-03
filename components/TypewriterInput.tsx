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
  "Ask School/College questions...",
  "Explain Physics step-by-step...",
  "Help with Math assignments...",
  "How to earn online?"
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (placeholderOverwrite) {
      setPlaceholder(placeholderOverwrite);
      return;
    }
    const currentText = DEFAULT_PLACEHOLDERS[placeholderIndex];
    let typingSpeed = isDeleting ? 30 : 60;
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim() || selectedImage) {
      onSend(inputValue, selectedImage || undefined);
      setInputValue('');
      setSelectedImage(null);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-2 pb-1 md:px-4 md:pb-4">
      {selectedImage && (
        <div className="mb-2 ml-1 relative inline-block animate-in zoom-in duration-200">
          <img src={selectedImage} alt="Preview" className="h-12 w-12 md:h-16 md:w-16 object-cover rounded-xl border-2 border-blue-500 shadow-md" />
          <button type="button" onClick={() => setSelectedImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm">
            <X size={10} />
          </button>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-end gap-1.5 md:gap-2">
        <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/*" className="hidden" />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 shrink-0 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <ImageIcon size={18} className="md:w-6 md:h-6" />
        </button>

        <div className="relative flex-grow">
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                if (inputValue.trim() || selectedImage) {
                  e.preventDefault();
                  handleSubmit(e as any);
                }
              }
            }}
            disabled={disabled}
            className="w-full p-2.5 md:p-4 rounded-xl md:rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-blue-500 transition-all resize-none text-[14px] md:text-base leading-tight"
            placeholder={placeholder}
            style={{ maxHeight: '150px' }}
          />
        </div>

        {!isLoading ? (
          <button
            type="button"
            onClick={onMicClick}
            className={`w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl shrink-0 transition-all ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {isListening ? <MicOff size={18} className="md:w-6 md:h-6" /> : <Mic size={18} className="md:w-6 md:h-6" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onStop}
            className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-600 shrink-0 animate-in zoom-in"
          >
            <Square size={16} fill="currentColor" className="md:w-5 md:h-5" />
          </button>
        )}

        <button
          type="submit"
          disabled={(!inputValue.trim() && !selectedImage) || isLoading}
          className="w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-xl md:rounded-2xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 shrink-0 transition-transform active:scale-95"
        >
          <Send size={18} className="md:w-6 md:h-6" />
        </button>
      </form>
    </div>
  );
};

export default TypewriterInput;