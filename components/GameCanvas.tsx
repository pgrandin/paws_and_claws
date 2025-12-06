
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Cloud, Trophy, Play, RotateCcw, Cat, Volume2, VolumeX, Flag } from 'lucide-react';
import { useGameLoop } from '../hooks/useGameLoop';
import { CatPlayer } from './CatPlayer';
import { Obstacle } from './Obstacle';
import { GameStatus } from '../types';
import { GAME_HEIGHT, GROUND_HEIGHT } from '../constants';

export const GameCanvas: React.FC = () => {
  const { gameState, jump, resetGame } = useGameLoop();
  const [isMuted, setIsMuted] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicTimeoutRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const noteIndexRef = useRef<number>(0);

  // Monitor Level Up for Toast
  useEffect(() => {
    if (gameState.level > 1 && gameState.status === GameStatus.PLAYING) {
        setShowLevelUp(true);
        const timer = setTimeout(() => setShowLevelUp(false), 2000);
        return () => clearTimeout(timer);
    } else {
        setShowLevelUp(false);
    }
  }, [gameState.level, gameState.status]);

  // Keep mute state accessible in timeouts
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);

  // Helper to get or create AudioContext safely
  const getAudioContext = () => {
    if (!audioContextRef.current) {
        const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtor) {
            audioContextRef.current = new AudioCtor();
        }
    }
    const ctx = audioContextRef.current;
    if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(console.error);
    }
    return ctx;
  };

  // --- SOUND EFFECTS ---

  const playJumpSound = () => {
    if (isMutedRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;
    
    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Retro jump: square wave sliding up
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

        // Volume: 0.25 (Loud enough to hear over music)
        gainNode.gain.setValueAtTime(0.25, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.1);
    } catch (e) {
        console.error("AudioContext error:", e);
    }
  };

  const playGameOverSound = () => {
    if (isMutedRef.current) return;
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        // Retro die: sawtooth wave sliding down
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);

        // Volume: 0.4 (Very prominent)
        gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        oscillator.start();
        oscillator.stop(ctx.currentTime + 0.5);
    } catch (e) {
        console.error("AudioContext error:", e);
    }
  };

  // --- PROCEDURAL MUSIC ENGINE ---

  const playMusicNote = (freq: number, duration: number, time: number) => {
    if (isMutedRef.current) return;
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);

    // Retro Bass Sound: Triangle wave
    osc.type = 'triangle';
    osc.frequency.value = freq;

    // Mix: Low volume (0.05) to stay in background
    gain.gain.setValueAtTime(0.05, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.05);

    osc.start(time);
    osc.stop(time + duration);
  };

  const scheduleMusic = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    // Simple catchy bassline loop (C Minor pentatonic-ish)
    // Frequencies: C3=130.8, Eb3=155.6, F3=174.6, G3=196.0
    const sequence = [
        130.81, 130.81, // C C
        196.00, 196.00, // G G
        174.61, 174.61, // F F
        155.56, 155.56  // Eb Eb
    ];

    const tempo = 120; 
    const secondsPerBeat = 60.0 / tempo;
    const lookahead = 0.1; // 100ms lookahead

    // If next note is ready to be scheduled
    while (nextNoteTimeRef.current < ctx.currentTime + lookahead) {
        // Play current note in sequence
        const freq = sequence[noteIndexRef.current % sequence.length];
        
        if (gameState.status === GameStatus.PLAYING) {
             playMusicNote(freq, secondsPerBeat, nextNoteTimeRef.current);
        }

        // Advance time and index
        nextNoteTimeRef.current += secondsPerBeat;
        noteIndexRef.current++;
    }

    // Schedule next check
    musicTimeoutRef.current = setTimeout(scheduleMusic, 25);
  }, [gameState.status]); // Re-create if status changes, but logic handles playing check

  // Start/Stop Music Loop based on Game Status
  useEffect(() => {
    if (gameState.status === GameStatus.PLAYING) {
        const ctx = getAudioContext();
        if (ctx) {
            // Reset timing if starting fresh
            if (nextNoteTimeRef.current < ctx.currentTime) {
                nextNoteTimeRef.current = ctx.currentTime + 0.1;
                noteIndexRef.current = 0;
            }
            scheduleMusic();
        }
    } else {
        // Stop the loop
        if (musicTimeoutRef.current) {
            clearTimeout(musicTimeoutRef.current);
        }
    }
    
    return () => {
        if (musicTimeoutRef.current) clearTimeout(musicTimeoutRef.current);
    };
  }, [gameState.status, scheduleMusic]);


  // --- GAME LOGIC ---

  const handleJump = () => {
      const didJump = jump();
      if (didJump) {
          playJumpSound();
      }
  };

  // Monitor Game Over status to play sound
  useEffect(() => {
    if (gameState.status === GameStatus.GAME_OVER) {
        playGameOverSound();
    }
  }, [gameState.status]);

  // Start/Restart Interaction
  const startGame = (e?: React.SyntheticEvent | Event) => {
    if (e) e.stopPropagation();
    
    // 1. Resume Web Audio API Context
    const ctx = getAudioContext();
    if (ctx) {
        // Reset music timing cursors
        nextNoteTimeRef.current = ctx.currentTime + 0.1;
        noteIndexRef.current = 0;
    }
    
    resetGame();
  };

  // Keyboard/Touch Controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault(); 
        
        if (gameState.status === GameStatus.PLAYING) {
            handleJump();
        } else {
             if (gameState.status === GameStatus.GAME_OVER || gameState.status === GameStatus.START) {
                 startGame(e);
             }
        }
      }
    };
    
    const handleTouchStart = (e: TouchEvent) => {
        if (gameState.status === GameStatus.PLAYING) {
            handleJump();
        } else {
            startGame(e);
        }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('touchstart', handleTouchStart);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('touchstart', handleTouchStart);
    };
  }, [jump, gameState.status, resetGame]); 


  return (
    <div 
        className="relative w-full max-w-4xl mx-auto overflow-hidden rounded-xl shadow-2xl border-4 border-slate-800 bg-gradient-to-b from-sky-300 to-sky-100 transition-colors duration-1000"
        style={{ height: `${GAME_HEIGHT}px` }}
        onClick={() => {
            if (gameState.status === GameStatus.PLAYING) handleJump();
        }}
    >
      {/* Background Decor - Clouds */}
      <div className="absolute top-10 left-10 text-white/60 animate-[pulse_5s_ease-in-out_infinite]">
        <Cloud size={64} fill="currentColor" />
      </div>
      <div className="absolute top-20 right-20 text-white/40 animate-[bounce_8s_infinite]">
        <Cloud size={48} fill="currentColor" />
      </div>
      <div className="absolute top-5 left-1/2 text-white/30">
        <Cloud size={80} fill="currentColor" />
      </div>

      {/* HUD: Score & Audio Toggle */}
      <div className="absolute top-4 w-full px-4 flex justify-between items-start z-30 font-bold text-slate-700 pointer-events-none">
        {/* Mute Button */}
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(!isMuted);
          }}
          className="pointer-events-auto p-2 bg-white/80 rounded-full shadow-sm hover:bg-white transition-colors"
        >
          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </button>

        <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
                 <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full shadow-sm text-sm">
                    <Flag size={14} className="text-orange-500" />
                    <span>LVL {gameState.level}</span>
                </div>
                <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full shadow-sm">
                    <span className="text-xl font-mono">{Math.floor(gameState.score).toString().padStart(5, '0')}</span>
                </div>
            </div>
          
          <div className="flex items-center gap-1 text-sm opacity-75">
              <Trophy size={14} />
              <span>HI: {gameState.highScore}</span>
          </div>
        </div>
      </div>

      {/* Level Up Notification */}
      {showLevelUp && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 animate-[bounce_1s_infinite]">
              <div className="bg-orange-500 text-white px-6 py-2 rounded-xl shadow-lg border-2 border-white transform rotate-2">
                  <h3 className="text-2xl font-black italic">LEVEL {gameState.level}!</h3>
              </div>
          </div>
      )}

      {/* Game Entities */}
      <div className="absolute bottom-0 w-full" style={{ height: `${GAME_HEIGHT - GROUND_HEIGHT}px` }}>
        <CatPlayer 
            y={gameState.catY + GROUND_HEIGHT} 
            isJumping={gameState.isJumping} 
            status={gameState.status}
        />
        
        {gameState.obstacles.map(obs => (
            <Obstacle key={obs.id} obstacle={{...obs, y: obs.y + GROUND_HEIGHT}} />
        ))}
      </div>

      {/* Ground */}
      <div 
        className="absolute bottom-0 w-full bg-slate-800 z-20 flex items-center overflow-hidden"
        style={{ height: `${GROUND_HEIGHT}px` }}
      >
        {/* Running track lines effect */}
        <div className="flex gap-20 w-[200%] animate-[slide_1s_linear_infinite]" 
             style={{ 
                 animationDuration: `${2 / (gameState.gameSpeed / 10)}s`,
                 animationPlayState: gameState.status === GameStatus.PLAYING ? 'running' : 'paused' 
            }}>
             {[...Array(20)].map((_, i) => (
                 <div key={i} className="w-10 h-1 bg-slate-600/50 rounded-full" />
             ))}
        </div>
      </div>

      {/* Start Screen */}
      {gameState.status === GameStatus.START && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white text-center p-6">
            <div className="bg-white p-4 rounded-full mb-6 shadow-xl">
                 <Cat size={64} className="text-orange-500" />
            </div>
            <h1 className="text-5xl font-black tracking-wider mb-2 drop-shadow-lg text-yellow-400">CAT RUN</h1>
            <p className="text-lg mb-8 font-medium max-w-md">Jump over puddles, vacuums, and catchers! <br/>Tap space or screen to jump.</p>
            <button 
                onClick={startGame}
                className="group flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 text-white px-8 py-4 rounded-2xl text-xl font-bold transition-all transform hover:scale-105 shadow-xl"
            >
                <Play fill="currentColor" />
                START RUNNING
            </button>
        </div>
      )}

      {/* Game Over Screen */}
      {gameState.status === GameStatus.GAME_OVER && (
        <div className="absolute inset-0 bg-red-900/60 backdrop-blur-md z-50 flex flex-col items-center justify-center text-white text-center p-6 animate-in fade-in duration-300">
            <h2 className="text-4xl font-black mb-2">CAUGHT!</h2>
            <p className="text-xl mb-6 opacity-90">Score: {Math.floor(gameState.score)}</p>
            
            <button 
                onClick={startGame}
                className="flex items-center gap-2 bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg"
            >
                <RotateCcw size={20} />
                TRY AGAIN
            </button>
        </div>
      )}
      
      {/* Mobile Controls Hint */}
      {gameState.status === GameStatus.PLAYING && (
          <div className="absolute bottom-2 left-0 w-full text-center text-white/20 text-xs pointer-events-none">
              TAP TO JUMP
          </div>
      )}
    </div>
  );
};