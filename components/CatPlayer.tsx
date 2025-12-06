
import React from 'react';
import { Cat } from 'lucide-react';
import { CAT_SIZE, CAT_X_POSITION } from '../constants';

interface CatPlayerProps {
  y: number;
  isJumping: boolean;
  status: string;
}

export const CatPlayer: React.FC<CatPlayerProps> = ({ y, isJumping, status }) => {
  // Simple rotation effect when jumping
  const rotation = isJumping ? -15 : 0;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: `${y}px`, // y is distance from ground
        left: `${CAT_X_POSITION}px`,
        width: `${CAT_SIZE}px`,
        height: `${CAT_SIZE}px`,
        transform: `rotate(${rotation}deg)`,
        transition: 'transform 0.1s',
        zIndex: 20
      }}
      className="flex items-center justify-center"
    >
      <div className={`relative ${status === 'GAME_OVER' ? 'animate-bounce' : ''}`}>
        <Cat 
          size={CAT_SIZE} 
          className={`
            ${status === 'GAME_OVER' ? 'text-red-500' : 'text-orange-500'} 
            filter drop-shadow-lg
          `} 
          fill="currentColor"
          strokeWidth={1.5}
        />
        
        {/* Left Eye */}
        <div className="absolute top-[16px] left-[13px] w-[6px] h-[6px] bg-white rounded-full z-10 pointer-events-none">
            <div className={`absolute top-[1.5px] right-[1px] w-[2.5px] h-[2.5px] bg-slate-900 rounded-full ${status === 'GAME_OVER' ? 'top-[3px] right-[2px]' : ''}`} />
        </div>
        
        {/* Right Eye */}
        <div className="absolute top-[16px] right-[13px] w-[6px] h-[6px] bg-white rounded-full z-10 pointer-events-none">
            <div className={`absolute top-[1.5px] right-[1px] w-[2.5px] h-[2.5px] bg-slate-900 rounded-full ${status === 'GAME_OVER' ? 'top-[3px] right-[2px]' : ''}`} />
        </div>

        {/* Mouth/Smile */}
        <div 
          className={`
            absolute left-[20px] w-[8px] h-[4px] z-10 border-slate-900
            ${status === 'GAME_OVER' 
              ? 'top-[26px] border-t-[1.5px] rounded-t-full' // Frown
              : 'top-[23px] border-b-[1.5px] rounded-b-full' // Smile
            }
          `} 
        />
      </div>
    </div>
  );
};
