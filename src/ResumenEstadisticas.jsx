import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Trophy, Target, ClipboardList } from 'lucide-react';

export default function ResumenEstadisticas({ usuarioId, ligaId }) {
  const [stats, setStats] = useState({
    posicion: '-',
    aciertos: 0,
    pronosticosHechos: 0
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarEstadisticas = async () => {
      // 1. Contar cuántos pronósticos ha llenado el usuario en esta liga
      const { count } = await supabase
        .from('predicciones')
        .select('*', { count: 'exact', head: true })
        .eq('usuario_id', usuarioId)
        .eq('liga_id', ligaId);

      // 2. Traer el ranking para saber su posición y sus puntos (aciertos)
      const { data: rankingData } = await supabase
        .from('ranking_ligas')
        .select('*')
        .eq('liga_id', ligaId);

      let miPosicion = '-';
      let misPuntos = 0;

      if (rankingData && rankingData.length > 0) {
        // Encontrar en qué índice del arreglo está el usuario para saber su "Lugar"
        const index = rankingData.findIndex(r => r.usuario_id === usuarioId);
        if (index !== -1) {
          miPosicion = index + 1; // +1 porque los arreglos empiezan en 0
          misPuntos = rankingData[index].puntos_totales || 0;
        }
      }

      setStats({
        posicion: miPosicion,
        aciertos: misPuntos,
        pronosticosHechos: count || 0
      });
      setCargando(false);
    };

    if (usuarioId && ligaId) cargarEstadisticas();
  }, [usuarioId, ligaId]);

  if (cargando) {
    return <div className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-5 mt-2 animate-pulse h-24"></div>;
  }

  return (
    <div className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-4 flex items-center justify-between mt-2 shadow-lg">
      
      {/* Columna 1: Posición */}
      <div className="flex flex-col items-center flex-1 border-r border-[#2A2E37]">
        <Trophy size={18} className="text-yellow-500 mb-1" />
        <span className="text-xl font-black text-white leading-none mb-0.5">
          {stats.posicion !== '-' ? `#${stats.posicion}` : '-'}
        </span>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Lugar</span>
      </div>

      {/* Columna 2: Aciertos */}
      <div className="flex flex-col items-center flex-1 border-r border-[#2A2E37]">
        <Target size={18} className="text-emerald-500 mb-1" />
        <span className="text-xl font-black text-white leading-none mb-0.5">{stats.aciertos}</span>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Aciertos</span>
      </div>

      {/* Columna 3: Pronósticos */}
      <div className="flex flex-col items-center flex-1">
        <ClipboardList size={18} className="text-blue-500 mb-1" />
        <span className="text-xl font-black text-white leading-none mb-0.5">{stats.pronosticosHechos}</span>
        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Jugados</span>
      </div>

    </div>
  );
}