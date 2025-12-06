import React from 'react';
import { GameCanvas } from './components/GameCanvas';

export default function App() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-900 p-4 sm:p-8">
      <div className="w-full max-w-4xl mb-4 flex justify-between items-center text-slate-400">
        <h1 className="text-lg font-bold tracking-wider hidden sm:block">PAWS & CLAWS</h1>
        <span className="text-xs uppercase tracking-widest">Endless Runner</span>
      </div>
      
      <main className="w-full flex-grow flex flex-col justify-center">
        <GameCanvas />
      </main>

      <footer className="mt-8 text-center text-slate-500 text-sm">
        <p>Press <span className="font-bold text-slate-300 px-1 border border-slate-600 rounded mx-1">SPACE</span> to jump</p>
      </footer>
    </div>
  );
}