import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 100 }) => {
  return (
    <div 
      className={`relative flex items-center justify-center transition-all duration-300 ${className}`} 
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="smGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
          <filter id="logoShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
        </defs>

        <g filter="url(#logoShadow)">
          <ellipse 
            cx="100" cy="100" rx="85" ry="36" 
            stroke="url(#smGrad)" strokeWidth="3.5" 
            transform="rotate(-60 100 100)" 
            opacity="0.9"
          />
          <circle cx="142" cy="26" r="7" fill="#60a5fa" />
          <circle cx="58" cy="174" r="7" fill="#ec4899" />

          <ellipse 
            cx="100" cy="100" rx="85" ry="36" 
            stroke="url(#smGrad)" strokeWidth="3.5" 
            transform="rotate(60 100 100)" 
            opacity="0.9"
          />
          <circle cx="142" cy="174" r="7" fill="#60a5fa" />
          <circle cx="58" cy="26" r="7" fill="#ec4899" />

          <ellipse 
            cx="100" cy="100" rx="85" ry="36" 
            stroke="url(#smGrad)" strokeWidth="3.5" 
            opacity="0.9"
          />
          <circle cx="185" cy="100" r="7" fill="#60a5fa" />
          <circle cx="15" cy="100" r="7" fill="#ec4899" />
        </g>

        <circle cx="100" cy="100" r="32" fill="url(#smGrad)" />
        
        <path 
          d="M100 82L70 96L100 110L130 96L100 82Z" 
          fill="white" 
        />
        <path 
          d="M82 103V116C82 116 88 122 100 122C112 122 118 116 118 116V103" 
          stroke="white" 
          strokeWidth="3.5" 
          strokeLinecap="round" 
          fill="none"
        />
        <path 
          d="M130 96V110" 
          stroke="white" 
          strokeWidth="2.5" 
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

export default Logo;