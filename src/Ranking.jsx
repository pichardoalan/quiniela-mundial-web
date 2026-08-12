import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Trophy, Medal } from 'lucide-react';

export default function Ranking({ ligaId, usuarioActualId }) {
  const [posiciones, setPosiciones] = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarRanking = async () => {
      const { data: rankingData, error } = await supabase
        .from('ranking_ligas')
        .select('*')
        .eq('liga_id', ligaId)
        .order('puntos_totales', { ascending: false }); 

      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('id, nombre');

      if (error) {
        console.error("Error al cargar ranking:", error);
      } else {
        if (perfilesData) {
          const mapaNombres = {};
          perfilesData.forEach(p => mapaNombres[p.id] = p.nombre);
          setPerfiles(mapaNombres);
        }
        setPosiciones(rankingData || []);
      }
      setCargando(false);
    };

    if (ligaId) cargarRanking();
  }, [ligaId]);

  if (cargando) {
    return <div className="text-center text-blue-500 font-bold py-10 animate-pulse">Calculando posiciones...</div>;
  }

  return (
    <div className="flex flex-col animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#12151C] border border-[#2A2E37] rounded-xl flex items-center justify-center text-yellow-500 shadow-lg">
          <Trophy size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white leading-tight">Tabla de Posiciones</h2>
          <p className="text-xs text-gray-500 font-medium">1 punto por acierto exacto</p>
        </div>
      </div>

      <div className="bg-[#12151C] border border-[#2A2E37] rounded-2xl overflow-hidden shadow-2xl">
        {posiciones.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center gap-2">
            <Trophy size={32} className="text-[#2A2E37]" />
            <span className="text-gray-500 text-sm font-bold">Aún no hay puntos registrados.</span>
            <span className="text-xs text-gray-600">Los resultados aparecerán cuando termine el primer partido.</span>
          </div>
        ) : (
          <div className="flex flex-col">
            {posiciones.map((jugador, index) => {
              const esUsuarioActual = jugador.usuario_id === usuarioActualId;
              const nombreMostrar = esUsuarioActual ? 'Tú' : (perfiles[jugador.usuario_id] || 'Participante');
              
              return (
                <div 
                  key={jugador.usuario_id} 
                  className={`flex items-center justify-between p-4 border-b border-[#2A2E37] last:border-0 transition-colors ${esUsuarioActual ? 'bg-blue-500/10' : 'hover:bg-[#1A1D24]'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 flex justify-center">
                      {index === 0 ? <Medal size={24} className="text-yellow-400 drop-shadow-md" /> :
                       index === 1 ? <Medal size={24} className="text-gray-300 drop-shadow-md" /> :
                       index === 2 ? <Medal size={24} className="text-amber-600 drop-shadow-md" /> :
                       <span className="font-black text-gray-500 text-sm">{index + 1}</span>}
                    </div>
                    
                    <div className="flex flex-col">
                      <span className={`font-black text-sm ${esUsuarioActual ? 'text-blue-400' : 'text-white'}`}>
                        {nombreMostrar}
                      </span>
                    </div>
                  </div>

                  <div className="bg-[#090B0E] border border-[#2A2E37] px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-inner">
                    <span className="text-lg font-black text-white">{jugador.puntos_totales}</span>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">pts</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}