import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 100 }) => {
  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ec4899" /> {/* Pink */}
            <stop offset="100%" stopColor="#06b6d4" /> {/* Cyan/Blue */}
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Atomic Orbits */}
        <ellipse
          cx="100"
          cy="100"
          rx="80"
          ry="35"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          transform="rotate(0 100 100)"
          className="opacity-80"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="80"
          ry="35"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          transform="rotate(60 100 100)"
          className="opacity-80"
        />
        <ellipse
          cx="100"
          cy="100"
          rx="80"
          ry="35"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          transform="rotate(120 100 100)"
          className="opacity-80"
        />

        {/* Electrons/Dots */}
        <circle cx="20" cy="100" r="6" fill="#ec4899" />
        <circle cx="180" cy="100" r="6" fill="#06b6d4" />
        <circle cx="140" cy="35" r="6" fill="#06b6d4" />
        <circle cx="60" cy="165" r="6" fill="#ec4899" />

        {/* Central Circle with Graduation Cap */}
        <circle cx="100" cy="100" r="28" fill="url(#logoGradient)" className="opacity-20" />
        <circle cx="100" cy="100" r="25" stroke="url(#logoGradient)" strokeWidth="2" />
        
        {/* Simple Graduation Cap Icon */}
        <path
          d="M100 85L75 95L100 105L125 95L100 85Z"
          fill="url(#logoGradient)"
        />
        <path
          d="M82 98V108C82 108 85 112 100 112C115 112 118 108 118 108V98"
          stroke="url(#logoGradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <path
          d="M125 95V108"
          stroke="url(#logoGradient)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
};

export default Logo;