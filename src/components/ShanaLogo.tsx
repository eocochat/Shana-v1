import React from 'react';
import { Mic } from 'lucide-react';

interface ShanaLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
  theme?: 'gold' | 'dark' | 'monochrome';
}

export default function ShanaLogo({
  size = 'md',
  showSlogan = false,
  className = '',
  theme = 'gold'
}: ShanaLogoProps) {
  // Determine sizing classes
  let iconSize = 'w-8 h-8';
  let textSize = 'text-xl sm:text-2xl font-black';
  let micSize = 20; // size in px for Lucide Mic
  let dotSize = 'w-1.5 h-1.5';
  
  if (size === 'xs') {
    iconSize = 'w-6 h-6';
    textSize = 'text-base font-black';
    micSize = 16;
    dotSize = 'w-1 h-1';
  } else if (size === 'sm') {
    iconSize = 'w-7 h-7';
    textSize = 'text-lg sm:text-xl font-black';
    micSize = 18;
    dotSize = 'w-1.2 h-1.2';
  } else if (size === 'md') {
    iconSize = 'w-9 h-9';
    textSize = 'text-xl sm:text-2xl font-black';
    micSize = 22;
    dotSize = 'w-1.5 h-1.5';
  } else if (size === 'lg') {
    iconSize = 'w-14 h-14';
    textSize = 'text-3xl sm:text-4xl font-black';
    micSize = 34;
    dotSize = 'w-2.5 h-2.5';
  } else if (size === 'xl') {
    iconSize = 'w-20 h-20';
    textSize = 'text-5xl sm:text-6xl font-black';
    micSize = 48;
    dotSize = 'w-3.5 h-3.5';
  }

  // Determine text color and microphone color
  let textColorClass = 'text-[#EDC154]'; // Default gold
  let micColorClass = 'text-zinc-400'; // Sleek dark charcoal/platinum mic as in the original logo
  
  if (theme === 'dark') {
    textColorClass = 'text-stone-900'; // Dark for light headers
    micColorClass = 'text-stone-800'; // Matching dark mic
  } else if (theme === 'monochrome') {
    textColorClass = 'text-current';
    micColorClass = 'text-current';
  }

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      {/* Horizontal Flex Container containing elements */}
      <div className="flex items-center gap-1.5 sm:gap-2 select-none">
        
        {/* 1. App Icon: Gold rounded square with black inner square and gold 'S' */}
        <div className={`${iconSize} relative flex-shrink-0`}>
          <svg viewBox="0 0 80 80" className="w-full h-full drop-shadow-md">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFE082" />
                <stop offset="30%" stopColor="#EDC154" />
                <stop offset="70%" stopColor="#C59B27" />
                <stop offset="100%" stopColor="#9E7815" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="80" height="80" rx="22" fill="url(#goldGrad)" />
            <rect x="9" y="9" width="62" height="62" rx="16" fill="#0E0E0E" />
            <text
              x="40"
              y="55"
              textAnchor="middle"
              fontFamily="system-ui, -apple-system, sans-serif"
              fontWeight="900"
              fontSize="44"
              fill="url(#goldGrad)"
            >
              S
            </text>
          </svg>
        </div>

        {/* 2. Text "SHANA" */}
        <span className={`font-sans tracking-wide leading-none ${textSize} ${textColorClass}`}>
          SHANA
        </span>

        {/* 3. Golden Dot */}
        <div className={`${dotSize} rounded-full bg-gradient-to-br from-[#FFE082] via-[#EDC154] to-[#9E7815] flex-shrink-0 self-end mb-1 sm:mb-1.5`} />

        {/* 4. Sleek, responsive, and high-fidelity Microphone Icon from Lucide */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <Mic 
            size={micSize} 
            className={`${micColorClass} stroke-[2] drop-shadow-sm`} 
          />
        </div>

      </div>

      {/* 5. Slogan subtext under logo */}
      {showSlogan && (
        <div className="mt-1.5 text-[9px] sm:text-[10px] uppercase font-black tracking-[0.25em] text-center text-[#9E7815]">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent">
            Practice. Improve. Get Hired.
          </span>
        </div>
      )}
    </div>
  );
}
