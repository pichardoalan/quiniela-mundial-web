import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Users, ChevronDown, ChevronUp, Lock, Clock } from 'lucide-react';

export default function Comunidad({ ligaId, partidos }) {
  const [prediccionesTotales, setPrediccionesTotales] = useState([]);
  const [perfiles, setPerfiles] = useState({});
  const [cargando, setCargando] = useState(true);
  const [partidoExpandido, setPartidoExpandido] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: preds } = await supabase
        .from('predicciones')
        .select('partido_id, voto, usuario_id')
        .eq('liga_id', ligaId);

      const { data: perfs } = await supabase
        .from('perfiles')
        .select('id, nombre');

      if (preds) setPrediccionesTotales(preds);

      if (perfs) {
        const mapaPerfiles = {};
        perfs.forEach(p => mapaPerfiles[p.id] = p.nombre || 'Anónimo');
        setPerfiles(mapaPerfiles);
      }
      setCargando(false);
    };

    if (ligaId) cargarDatos();
  }, [ligaId]);

  if (cargando) return <div className="text-center text-blue-500 font-bold py-10 animate-pulse">Cargando el Oráculo...</div>;

  const partidosConVotos = partidos.filter(p => prediccionesTotales.some(pred => pred.partido_id === p.id));

  return (
    <div className="flex flex-col animate-fade-in pb-10">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#12151C] border border-[#2A2E37] rounded-xl flex items-center justify-center text-emerald-500 shadow-lg">
          <Users size={20} />
        </div>
        <div>
          <h2 className="text-xl font-black text-white leading-tight">La Comunidad</h2>
          <p className="text-xs text-gray-500 font-medium">Mira quién apostó por quién</p>
        </div>
      </div>

      {partidosConVotos.length === 0 ? (
        <div className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-8 text-center flex flex-col items-center gap-2">
          <Users size={32} className="text-[#2A2E37]" />
          <span className="text-gray-500 text-sm font-bold">Nadie ha hecho pronósticos aún.</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {partidosConVotos.map((partido) => {
            const votosPartido = prediccionesTotales.filter(p => p.partido_id === partido.id);
            const votosLocal = votosPartido.filter(v => v.voto === 'L');
            const votosEmpate = votosPartido.filter(v => v.voto === 'X' || v.voto === 'E');
            const votosVisitante = votosPartido.filter(v => v.voto === 'V');
            const expandido = partidoExpandido === partido.id;
            
            // LA CORRECCIÓN DE ORO: Candado de Tiempo Real
            const ahora = new Date().getTime();
            const fechaPartido = new Date(partido.fecha).getTime();
            const yaComenzo = ahora >= fechaPartido;

            return (
              <div key={partido.id} className="bg-[#12151C] border border-[#2A2E37] rounded-2xl overflow-hidden transition-all duration-300">
                <button 
                  onClick={() => setPartidoExpandido(expandido ? null : partido.id)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#1A1D24] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center -space-x-2">
                      <img src={partido.logo_local} alt={partido.local} className="w-8 h-8 rounded-full border border-[#2A2E37] bg-[#090B0E] z-10 object-contain" />
                      <img src={partido.logo_visitante} alt={partido.visitante} className="w-8 h-8 rounded-full border border-[#2A2E37] bg-[#090B0E] object-contain" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-black text-white">{partido.local} vs {partido.visitante}</span>
                      <span className="text-[10px] text-gray-500 font-bold uppercase">{votosPartido.length} Votos totales</span>
                    </div>
                  </div>
                  {expandido ? <ChevronUp size={20} className="text-blue-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </button>

                {expandido && (
                  <div className="p-4 border-t border-[#2A2E37] bg-[#090B0E]">
                    {yaComenzo ? (
                      /* Mostramos los votos SOLO si el partido ya está cerrado/comenzado */
                      <div className="grid grid-cols-3 gap-2">
                        <div className="flex flex-col items-center bg-[#12151C] border border-[#2A2E37] rounded-xl p-2">
                          <img src={partido.logo_local} alt="Local" className="w-6 h-6 mb-2 object-contain" />
                          <div className="w-full flex flex-col gap-1 mt-2 border-t border-[#2A2E37] pt-2">
                            {votosLocal.length === 0 ? <span className="text-[9px] text-center text-gray-600">Nadie</span> : 
                              votosLocal.map((v, i) => <span key={i} className="text-[10px] text-center text-blue-400 font-bold truncate" title={perfiles[v.usuario_id]}>{perfiles[v.usuario_id]}</span>)
                            }
                          </div>
                        </div>
                        <div className="flex flex-col items-center bg-[#12151C] border border-[#2A2E37] rounded-xl p-2">
                          <div className="w-6 h-6 mb-2 flex items-center justify-center text-xs font-black text-gray-400">VS</div>
                          <div className="w-full flex flex-col gap-1 mt-2 border-t border-[#2A2E37] pt-2">
                            {votosEmpate.length === 0 ? <span className="text-[9px] text-center text-gray-600">Nadie</span> : 
                              votosEmpate.map((v, i) => <span key={i} className="text-[10px] text-center text-gray-300 font-bold truncate" title={perfiles[v.usuario_id]}>{perfiles[v.usuario_id]}</span>)
                            }
                          </div>
                        </div>
                        <div className="flex flex-col items-center bg-[#12151C] border border-[#2A2E37] rounded-xl p-2">
                          <img src={partido.logo_visitante} alt="Visitante" className="w-6 h-6 mb-2 object-contain" />
                          <div className="w-full flex flex-col gap-1 mt-2 border-t border-[#2A2E37] pt-2">
                            {votosVisitante.length === 0 ? <span className="text-[9px] text-center text-gray-600">Nadie</span> : 
                              votosVisitante.map((v, i) => <span key={i} className="text-[10px] text-center text-blue-400 font-bold truncate" title={perfiles[v.usuario_id]}>{perfiles[v.usuario_id]}</span>)
                            }
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Si NO ha comenzado, mostramos el escudo protector */
                      <div className="flex flex-col items-center justify-center py-6 text-center bg-[#12151C] border border-[#2A2E37] rounded-xl">
                        <Clock size={28} className="text-blue-500 mb-2" />
                        <span className="text-sm font-black text-white">Partido Abierto</span>
                        <span className="text-[10px] text-gray-400 mt-1 max-w-[220px]">Para evitar trampas, los pronósticos se revelarán en cuanto comience el partido.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}