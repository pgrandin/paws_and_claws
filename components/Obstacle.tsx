import React from 'react';
import { Waves, Zap, OctagonAlert, House } from 'lucide-react';
import { ObstacleEntity, ObstacleType } from '../types';

interface ObstacleProps {
  obstacle: ObstacleEntity;
}

export const Obstacle: React.FC<ObstacleProps> = ({ obstacle }) => {
  // Special rendering for House
  if (obstacle.type === ObstacleType.HOUSE) {
    return (
      <div
        style={{
          position: 'absolute',
          bottom: `${obstacle.y}px`,
          left: `${obstacle.x}px`,
          width: `${obstacle.width}px`,
          height: `${obstacle.height}px`,
          zIndex: 5 // Behind the cat (20) and obstacles (15)
        }}
        className="flex items-end justify-center"
      >
        <div className="flex flex-col items-center">
            {/* Simple House Graphic */}
            <div className="relative">
                 <House size={obstacle.width} strokeWidth={1.5} className="text-slate-600 fill-slate-700/50" />
                 <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-6 bg-yellow-100/20 rounded-t-sm"></div>
            </div>
        </div>
      </div>
    );
  }

  let Icon = OctagonAlert;
  let colorClass = 'text-gray-700';

  switch (obstacle.type) {
    case ObstacleType.WATER:
      Icon = Waves;
      colorClass = 'text-blue-500';
      break;
    case ObstacleType.VACUUM:
      Icon = Zap;
      colorClass = 'text-yellow-500';
      break;
    case ObstacleType.CATCHER:
      Icon = OctagonAlert;
      colorClass = 'text-red-500';
      break;
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: `${obstacle.y}px`,
        left: `${obstacle.x}px`,
        width: `${obstacle.width}px`,
        height: `${obstacle.height}px`,
        zIndex: 15
      }}
      className="flex items-center justify-center"
    >
      <div className={`${colorClass} filter drop-shadow-md`}>
         <Icon size={obstacle.width} strokeWidth={2.5} />
      </div>
    </div>
  );
};