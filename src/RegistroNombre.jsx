import React, { useState } from 'react';
import { supabase } from './supabase';
import { User, Loader2 } from 'lucide-react';

export default function RegistroNombre({ usuarioId, onCompletado }) {
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const manejarGuardar = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    setGuardando(true);
    setError('');

    try {
      const { error: upsertError } = await supabase
        .from('perfiles')
        .upsert({ id: usuarioId, nombre: nombre.trim() });

      if (upsertError) throw upsertError;
      
      onCompletado(nombre.trim());
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la información. Inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090B0E] text-white font-sans flex items-center justify-center p-4">
      <div className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-8 max-w-md w-full shadow-2xl animate-fade-in">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-blue-600/10 rounded-full flex items-center justify-center text-blue-500 mb-4 border border-blue-500/20">
            <User size={32} />
          </div>
          <h2 className="text-xl font-black text-white tracking-tight">Configuración de Perfil</h2>
          <p className="text-sm text-gray-400 mt-1">Antes de ingresar a la plataforma, por favor define tu nombre de participación oficial.</p>
        </div>

        <form onSubmit={manejarGuardar} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nombre del Participante</label>
            <input 
              type="text" 
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingresa tu nombre"
              className="bg-[#090B0E] border border-[#2A2E37] rounded-xl px-4 py-3 text-sm text-white font-bold outline-none focus:border-blue-500 transition-colors w-full"
            />
          </div>

          {error && <p className="text-xs font-bold text-red-500 bg-red-500/10 py-2 px-3 rounded-lg text-center">{error}</p>}

          <button 
            type="submit"
            disabled={guardando || !nombre.trim()}
            className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm py-3.5 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {guardando ? <Loader2 size={18} className="animate-spin" /> : 'Confirmar e Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}