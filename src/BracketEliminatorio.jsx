import React, { useState, useEffect } from 'react';
import { Lock, Trophy, Check } from 'lucide-react';
import { supabase } from './supabase';

export default function BracketEliminatorio({ usuarioId, ligaId }) {
  const [partidosFaseFinal, setPartidosFaseFinal] = useState([]);
  const [misVotos, setMisVotos] = useState({});
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: partidosData } = await supabase
        .from('partidos')
        .select('*')
        .not('fase', 'is', null)
        .order('fecha', { ascending: true });

      if (partidosData) setPartidosFaseFinal(partidosData);

      if (usuarioId && ligaId) {
        const { data: votosData } = await supabase
          .from('predicciones')
          .select('partido_id, voto')
          .eq('usuario_id', usuarioId)
          .eq('liga_id', ligaId);
        
        if (votosData) {
          const mapaVotos = {};
          votosData.forEach(v => mapaVotos[v.partido_id] = v.voto);
          setMisVotos(mapaVotos);
        }
      }
    };
    cargarDatos();
  }, [usuarioId, ligaId]);

  const manejarVoto = async (partidoId, voto, estaBloqueado) => {
    if (estaBloqueado || guardando) return;
    setGuardando(true);
    
    const { error } = await supabase
      .from('predicciones')
      .upsert({ 
        usuario_id: usuarioId, 
        liga_id: ligaId,
        partido_id: partidoId, 
        voto: voto 
      }, { onConflict: 'usuario_id, partido_id, liga_id' });

    if (!error) {
      setMisVotos(prev => ({ ...prev, [partidoId]: voto }));
    }
    setGuardando(false);
  };

const MatchCard = ({ titulo, faseAPI, index }) => {
    // Filtramos por la etiqueta de la API
    const partidosDeFase = partidosFaseFinal.filter(p => p.fase === faseAPI);
    const partido = partidosDeFase[index];

    if (!partido) {
       return (
        <div className="relative bg-[#090B0E] border border-[#2A2E37] rounded-xl w-60 opacity-60 mb-4 shrink-0">
           <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2A2E37] bg-[#12151C] rounded-t-xl">
             <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{titulo}</span>
             <span className="text-[8px] font-black text-red-500/80 uppercase flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded-full"><Lock size={8} /> PENDIENTE</span>
           </div>
           <div className="flex relative h-16">
             <div className="flex-1 flex flex-col items-center justify-center border-r border-[#2A2E37] bg-[#12151C] rounded-bl-xl"><span className="text-[10px] font-black text-gray-500 text-center px-1">Por definir</span></div>
             <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10 pointer-events-none"><div className="w-7 h-7 bg-[#1A1D24] rounded-full flex items-center justify-center font-black text-[9px] text-gray-400 border border-[#2A2E37]">VS</div></div>
             <div className="flex-1 flex flex-col items-center justify-center bg-[#12151C] rounded-br-xl"><span className="text-[10px] font-black text-gray-500 text-center px-1">Por definir</span></div>
           </div>
        </div>
       );
    }

    const fechaPartido = new Date(partido.fecha).getTime();
    const ahora = new Date().getTime();
    const tieneResultado = partido.resultado_real !== null;
    const estaBloqueado = ahora >= fechaPartido || tieneResultado;
    const miVoto = misVotos[partido.id];
    
    let estadoAcierto = 'pendiente';
    if (partido.resultado_real && miVoto) {
      estadoAcierto = miVoto === partido.resultado_real ? 'acierto' : 'error';
    }

    const borderColores = {
      pendiente: 'border-[#2A2E37] hover:border-blue-500/30',
      acierto: 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]',
      error: 'border-red-500/50'
    };

    return (
      <div className={`relative bg-[#090B0E] border ${borderColores[estadoAcierto]} rounded-xl w-60 transition-all mb-4 shrink-0`}>
         <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#2A2E37] bg-[#12151C] rounded-t-xl">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{titulo}</span>
            {partido.resultado_real ? (
               <span className="text-[8px] font-black bg-gray-800 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest">Finalizado</span>
            ) : estaBloqueado ? (
              <span className="text-[8px] font-black text-red-500 flex items-center gap-1 bg-red-500/10 px-1.5 py-0.5 rounded-sm uppercase tracking-widest"><Lock size={8} /> Cerrado</span>
            ) : (
              <span className="text-[8px] font-black text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-1.5 py-0.5 rounded-sm uppercase tracking-widest"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Abierto</span>
            )}
         </div>
         <div className="flex relative h-16">
            
            {/* BOTÓN LOCAL CON BANDERA */}
            <button onClick={() => manejarVoto(partido.id, 'L', estaBloqueado)} disabled={guardando || estaBloqueado} className={`flex-1 flex flex-col items-center justify-center border-r border-[#2A2E37] rounded-bl-xl transition-colors group relative py-1 ${miVoto === 'L' ? 'bg-blue-600' : 'bg-[#12151C] hover:bg-[#1A1D24]'} ${(estaBloqueado && miVoto !== 'L') ? 'opacity-40' : ''}`}>
              {partido.local !== 'TBD' && <img src={partido.logo_local} alt={partido.local} className="w-6 h-6 object-contain mb-1 drop-shadow-md" />}
              <span className={`text-[10px] font-black leading-tight px-1 text-center w-full truncate ${miVoto === 'L' ? 'text-white' : 'text-gray-300'}`}>{partido.local}</span>
              {miVoto === 'L' && !estaBloqueado && <Check size={10} className="text-white absolute top-1 left-1 opacity-50" />}
            </button>
            
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
              <button onClick={() => manejarVoto(partido.id, 'X', estaBloqueado)} disabled={guardando || estaBloqueado} className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-[9px] transition-all border ${miVoto === 'X' ? 'bg-blue-600 text-white border-blue-400 scale-110' : 'bg-[#1A1D24] text-gray-400 border-[#2A2E37] hover:border-gray-500'} ${(estaBloqueado && miVoto !== 'X') ? 'opacity-40' : ''}`}>VS</button>
              <span className={`text-[6px] font-bold mt-0.5 uppercase tracking-widest px-1 rounded-sm border ${miVoto === 'X' ? 'bg-[#090B0E] border-blue-400 text-blue-400' : 'bg-[#090B0E] border-[#2A2E37] text-gray-500'}`}>Empate</span>
            </div>
            
            {/* BOTÓN VISITANTE CON BANDERA */}
            <button onClick={() => manejarVoto(partido.id, 'V', estaBloqueado)} disabled={guardando || estaBloqueado} className={`flex-1 flex flex-col items-center justify-center rounded-br-xl transition-colors group relative py-1 ${miVoto === 'V' ? 'bg-blue-600' : 'bg-[#12151C] hover:bg-[#1A1D24]'} ${(estaBloqueado && miVoto !== 'V') ? 'opacity-40' : ''}`}>
              {partido.visitante !== 'TBD' && <img src={partido.logo_visitante} alt={partido.visitante} className="w-6 h-6 object-contain mb-1 drop-shadow-md" />}
              <span className={`text-[10px] font-black leading-tight px-1 text-center w-full truncate ${miVoto === 'V' ? 'text-white' : 'text-gray-300'}`}>{partido.visitante}</span>
              {miVoto === 'V' && !estaBloqueado && <Check size={10} className="text-white absolute top-1 right-1 opacity-50" />}
            </button>
         
         </div>
      </div>
    );
  };

  return (
    <div className="w-full overflow-x-auto pb-8 hide-scrollbar">
      <div className="min-w-[1300px] flex justify-between gap-8 px-2 mt-4 animate-fade-in">
        
        {/* COLUMNA 1: Dieciseisavos (LAST_32) */}
        <div className="flex flex-col">
          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 text-center">Dieciseisavos</h3>
          {[...Array(16)].map((_, i) => (
            <MatchCard key={`diec-${i}`} titulo={`16avos ${i+1}`} faseAPI="LAST_32" index={i} />
          ))}
        </div>

        {/* COLUMNA 2: Octavos (LAST_16) */}
        <div className="flex flex-col justify-around py-12">
          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 text-center">Octavos de Final</h3>
          {[...Array(8)].map((_, i) => (
            <MatchCard key={`oct-${i}`} titulo={`Octavos ${i+1}`} faseAPI="LAST_16" index={i} />
          ))}
        </div>

        {/* COLUMNA 3: Cuartos (QUARTER_FINALS) */}
        <div className="flex flex-col justify-around py-32">
          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 text-center">Cuartos de Final</h3>
          {[...Array(4)].map((_, i) => (
            <MatchCard key={`cua-${i}`} titulo={`Cuartos ${i+1}`} faseAPI="QUARTER_FINALS" index={i} />
          ))}
        </div>

        {/* COLUMNA 4: Semifinales (SEMI_FINALS) */}
        <div className="flex flex-col justify-around py-64">
          <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 text-center">Semifinal</h3>
          {[...Array(2)].map((_, i) => (
            <MatchCard key={`semi-${i}`} titulo={`Semifinal ${i+1}`} faseAPI="SEMI_FINALS" index={i} />
          ))}
        </div>

        {/* COLUMNA 5: Gran Final (FINAL) */}
        <div className="flex flex-col justify-center">
          <div className="flex flex-col items-center gap-2 mb-4">
            <Trophy size={32} className="text-yellow-500 drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]" />
            <h3 className="text-[10px] font-black text-yellow-500 uppercase tracking-widest text-center">Gran Final</h3>
          </div>
          <MatchCard titulo="Campeonato del Mundo" faseAPI="FINAL" index={0} />
        </div>

      </div>
    </div>
  );
}