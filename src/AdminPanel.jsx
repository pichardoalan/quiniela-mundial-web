import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { AlertTriangle, Edit3 } from 'lucide-react';

export default function AdminPanel({ usuarioActualId }) {
  // Estados para la actualización manual
  const [partidos, setPartidos] = useState([]);
  const [partidoSeleccionado, setPartidoSeleccionado] = useState('');
  const [cargandoManual, setCargandoManual] = useState(false);
  const [mensajeManual, setMensajeManual] = useState('');

  // 🚨 REEMPLAZA ESTO CON TU ID DE SUPABASE 🚨
  const MI_ID_ADMIN = 'eb8798f7-d4d2-42f0-be6f-641fdf8dd13f';

  useEffect(() => {
    if (usuarioActualId === MI_ID_ADMIN) {
      cargarPartidos();
    }
  }, [usuarioActualId]);

  const cargarPartidos = async () => {
    const { data } = await supabase.from('partidos').select('*').order('fecha', { ascending: true });
    if (data) setPartidos(data);
  };

  if (usuarioActualId !== MI_ID_ADMIN) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center mb-6">
        <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
        <h2 className="text-red-500 font-black">ACCESO DENEGADO</h2>
        <p className="text-xs text-red-400 mt-1">Esta área es exclusiva para administradores del sistema.</p>
      </div>
    );
  }

  // Actualizador Manual
  const actualizarResultadoManual = async (resultado) => {
    if (!partidoSeleccionado) {
      setMensajeManual('Por favor selecciona un partido primero.');
      return;
    }

    setCargandoManual(true);
    setMensajeManual('Guardando...');

    const { error } = await supabase
      .from('partidos')
      .update({ resultado_real: resultado })
      .eq('id', partidoSeleccionado);

    if (error) {
      setMensajeManual('Error al guardar: ' + error.message);
    } else {
      setMensajeManual('¡Resultado guardado con éxito!');
      await cargarPartidos(); // Recargar para ver el cambio
    }
    setCargandoManual(false);
  };

  const partidoActivo = partidos.find(p => p.id.toString() === partidoSeleccionado);

  return (
    <div className="flex flex-col gap-4 mb-6">
      {/* PANEL DE ACTUALIZACIÓN MANUAL */}
      <div className="bg-[#12151C] border border-purple-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Edit3 size={20} className="text-purple-500" />
          <h2 className="text-sm font-black text-white">Actualizador Manual de Resultados</h2>
        </div>
        
        <select 
          value={partidoSeleccionado}
          onChange={(e) => setPartidoSeleccionado(e.target.value)}
          className="w-full bg-[#090B0E] border border-[#2A2E37] text-white rounded-xl p-3 mb-4 text-sm focus:border-purple-500 outline-none"
        >
          <option value="">-- Selecciona un partido --</option>
          {partidos.map(p => (
            <option key={p.id} value={p.id}>
              {p.local} vs {p.visitante} {p.resultado_real ? `(Ya tiene: ${p.resultado_real})` : ''}
            </option>
          ))}
        </select>

        {partidoSeleccionado && partidoActivo && (
          <div className="grid grid-cols-3 gap-2">
            <button 
              disabled={cargandoManual}
              onClick={() => actualizarResultadoManual('L')}
              className="bg-[#1A1D24] hover:bg-purple-600 border border-[#2A2E37] hover:border-purple-500 text-white font-bold text-xs p-2 rounded-lg transition-colors"
            >
              Gana {partidoActivo.local}
            </button>
            <button 
              disabled={cargandoManual}
              onClick={() => actualizarResultadoManual('X')}
              className="bg-[#1A1D24] hover:bg-gray-600 border border-[#2A2E37] hover:border-gray-500 text-white font-bold text-xs p-2 rounded-lg transition-colors"
            >
              Empate
            </button>
            <button 
              disabled={cargandoManual}
              onClick={() => actualizarResultadoManual('V')}
              className="bg-[#1A1D24] hover:bg-purple-600 border border-[#2A2E37] hover:border-purple-500 text-white font-bold text-xs p-2 rounded-lg transition-colors"
            >
              Gana {partidoActivo.visitante}
            </button>
          </div>
        )}

        {/* Botón para borrar el resultado si te equivocas */}
        {partidoSeleccionado && partidoActivo?.resultado_real && (
           <button 
             onClick={() => actualizarResultadoManual(null)}
             className="w-full mt-3 text-red-500 text-xs font-bold hover:underline"
           >
             Borrar resultado (Resetear)
           </button>
        )}

        {mensajeManual && (
          <div className={`mt-4 text-xs font-bold text-center ${mensajeManual.includes('Error') ? 'text-red-500' : 'text-emerald-400'}`}>
            {mensajeManual}
          </div>
        )}
      </div>
    </div>
  );
}