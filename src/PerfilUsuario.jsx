import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserCircle, Save, Loader2, Lock } from 'lucide-react';

export default function PerfilUsuario({ usuarioId, ligaId }) {
  const [apodo, setApodo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [bloqueado, setBloqueado] = useState(false);

  useEffect(() => {
    const cargarPerfil = async () => {
      const { data } = await supabase
        .from('miembros_liga')
        .select('nickname')
        .eq('usuario_id', usuarioId)
        .eq('liga_id', ligaId)
        .single();
        
      if (data && data.nickname) {
        setApodo(data.nickname);
        setBloqueado(true);
      } else {
        setApodo('');
        setBloqueado(false);
      }
    };
    if (usuarioId && ligaId) cargarPerfil();
  }, [usuarioId, ligaId]);

  const guardarApodo = async () => {
    if (!apodo.trim()) return;
    setGuardando(true);
    
    await supabase
      .from('miembros_liga')
      .update({ nickname: apodo.trim() })
      .eq('usuario_id', usuarioId)
      .eq('liga_id', ligaId);

    setBloqueado(true);
    setGuardando(false);
  };

  return (
    <div className="bg-[#12151C] border border-blue-500/30 rounded-2xl p-5 mb-4 flex flex-col md:flex-row items-center gap-4 justify-between shadow-[0_0_15px_rgba(59,130,246,0.1)]">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${bloqueado ? 'bg-emerald-500/20 text-emerald-500' : 'bg-blue-600/20 text-blue-500'}`}>
          {bloqueado ? <Lock size={20} /> : <UserCircle size={24} />}
        </div>
        <div className="flex flex-col flex-1">
          <span className="text-sm font-black text-white">{bloqueado ? 'Identidad Confirmada' : 'Elige tu Apodo'}</span>
          <span className="text-[10px] text-gray-400">
            {bloqueado ? 'Este es tu nombre oficial en esta liga.' : 'Piénsalo bien. Una vez guardado, no podrás cambiarlo.'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full md:w-auto">
        {bloqueado ? (
          <div className="bg-[#090B0E] border border-emerald-500/30 rounded-xl px-6 py-2.5 text-sm text-emerald-400 font-black flex items-center justify-center w-full md:w-auto">
            {apodo}
          </div>
        ) : (
          <>
            <input 
              type="text" 
              value={apodo}
              onChange={(e) => setApodo(e.target.value)}
              placeholder="Ej. El Rompe Quinielas"
              className="bg-[#090B0E] border border-[#2A2E37] rounded-xl px-4 py-2.5 text-sm text-white font-bold outline-none focus:border-blue-500 w-full md:w-48 transition-colors"
            />
            <button 
              onClick={guardarApodo}
              disabled={guardando || !apodo}
              className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}