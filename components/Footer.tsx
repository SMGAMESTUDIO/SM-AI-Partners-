import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
          Created By SM GAMING STUDIO
        </p>
        
        {/* The user-select-none and pointer-events-none classes prevent copying/clicking */}
        <div className="inline-block px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-md">
          <p 
            className="text-xs text-gray-500 dark:text-gray-500 select-none pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          >
            Email: smgamingstudioofficial@gmail.com
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;