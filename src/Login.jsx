import React from 'react';
import { supabase } from './supabase';
import { Trophy } from 'lucide-react';

export default function Login() {
  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
  };

  return (
    <div className="min-h-screen bg-[#090B0E] flex flex-col items-center justify-center p-4 relative">
      <div className="flex flex-col items-center gap-6 max-w-sm w-full z-10">
        
        {/* ÍCONO ACTUALIZADO: Trofeo en lugar de Fuego */}
        <div className="w-16 h-16 bg-[#12151C] border border-[#2A2E37] rounded-2xl flex items-center justify-center shadow-lg">
          <Trophy size={32} className="text-blue-500" />
        </div>
        
        <div className="text-center">
          <h1 className="text-3xl font-black text-white tracking-tight mb-1">
            QUINIELA <span className="text-emerald-500">MUNDIAL</span>
          </h1>
          <p className="text-sm text-gray-400">Demuestra quién sabe más de fútbol.</p>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full bg-[#12151C] border border-[#2A2E37] hover:bg-[#1A1D24] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          CONTINUAR CON GOOGLE
        </button>
      </div>

      {/* CRÉDITO SUTIL */}
      <div className="absolute bottom-8 w-full text-center opacity-30 pointer-events-none">
        <span className="text-[10px] text-white font-bold tracking-widest uppercase">
          by Alan Pichardo
        </span>
      </div>
    </div>
  );
}