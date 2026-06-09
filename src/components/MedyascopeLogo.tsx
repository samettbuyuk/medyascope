import React from "react";

interface LogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  showText?: boolean;
}

export const MedyascopeLogo: React.FC<LogoProps> = ({ size = 48, showText = false, className, ...props }) => {
  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width={size} 
        height={size} 
        className="drop-shadow-[0_0_12px_rgba(147,51,234,0.3)] transition-transform hover:scale-105"
        {...props}
      >
        <defs>
          <radialGradient id="bgGrace" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1a0c33"/>
            <stop offset="70%" stopColor="#050209"/>
            <stop offset="100%" stopColor="#030005"/>
          </radialGradient>
          <linearGradient id="silverGrace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="35%" stopColor="#dedede"/>
            <stop offset="65%" stopColor="#a3a3a3"/>
            <stop offset="100%" stopColor="#737373"/>
          </linearGradient>
          <linearGradient id="glowBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7"/>
            <stop offset="50%" stopColor="#ec4899"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </linearGradient>
        </defs>
        
        {/* Outer Circular Gradient Ring */}
        <circle cx="50" cy="50" r="48" fill="url(#bgGrace)" stroke="url(#glowBorder)" strokeWidth="1.5" />
        
        {/* Inner broken guide line */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="#3b0764" strokeWidth="1.2" strokeDasharray="3,3" />
        <circle cx="50" cy="50" r="40" fill="none" stroke="#2e054f" strokeWidth="0.8" />
        
        {/* Lower crescent arch wrapping the book */}
        <path 
          d="M 20,60 C 22,76 35,88 50,88 C 65,88 78,76 80,60" 
          fill="none" 
          stroke="url(#silverGrace)" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
        />
        
        {/* Open Book Wings */}
        {/* Left main leaf */}
        <path 
          d="M 50,71 C 36,68 24,71 20,65 L 20,29 C 24,34 36,31 50,34 Z" 
          fill="none" 
          stroke="url(#silverGrace)" 
          strokeWidth="3.2" 
          strokeLinejoin="round" 
        />
        {/* Right main leaf */}
        <path 
          d="M 50,71 C 64,68 76,71 80,65 L 80,29 C 76,34 64,31 50,34 Z" 
          fill="none" 
          stroke="url(#silverGrace)" 
          strokeWidth="3.2" 
          strokeLinejoin="round" 
        />
        {/* Book spine line */}
        <line x1="50" y1="34" x2="50" y2="71" stroke="url(#silverGrace)" strokeWidth="3" strokeLinecap="round" />

        {/* Top curved pages overlays */}
        <path d="M 20,29 C 24,19 36,16 50,22 C 64,16 76,19 80,29" fill="none" stroke="url(#silverGrace)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Central Magnifying Glass Frame */}
        <circle cx="50" cy="46" r="10.5" fill="#080312" stroke="url(#silverGrace)" strokeWidth="2.8" />
        {/* Magnifying Glass Handle */}
        <line x1="57.5" y1="53.5" x2="66.5" y2="62.5" stroke="url(#silverGrace)" strokeWidth="3.5" strokeLinecap="round" />

        {/* Deep, piercing organic eyeball pattern inside magnifying lens */}
        <path 
          d="M 43,46 C 45,41 55,41 57,46 C 55,51 45,51 43,46 Z" 
          fill="none" 
          stroke="url(#silverGrace)" 
          strokeWidth="1.2" 
        />
        {/* Iris */}
        <circle cx="50" cy="46" r="4" fill="url(#silverGrace)" />
        {/* Pupil / highlight */}
        <circle cx="49" cy="45" r="1.5" fill="#050209" />
        <circle cx="51" cy="45" r="0.6" fill="#ffffff" />

        {/* Vibrational waves propagating from center lens */}
        {/* Left Waves */}
        <path d="M 36,39 A 10,10 0 0,0 36,53" fill="none" stroke="url(#silverGrace)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 31,34 A 15,15 0 0,0 31,58" fill="none" stroke="url(#silverGrace)" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
        
        {/* Right Waves */}
        <path d="M 64,39 A 10,10 0 0,1 64,53" fill="none" stroke="url(#silverGrace)" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M 69,34 A 15,15 0 0,1 69,58" fill="none" stroke="url(#silverGrace)" strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
      </svg>
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-gray-400 font-display">
            MEDYASCOPE.AI
          </span>
          <span className="text-[9px] text-purple-400 font-bold tracking-widest uppercase font-mono">
            Medya Okuryazarlığı Laboratuvarı
          </span>
        </div>
      )}
    </div>
  );
};
