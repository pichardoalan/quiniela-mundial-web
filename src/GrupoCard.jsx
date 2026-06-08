import React, { useState } from 'react';
import { ChevronDown, Shield } from 'lucide-react';
import PartidoCard from './PartidoCard';

export default function GrupoCard({ nombreGrupo, partidos, usuarioId, ligaId }) {
  const [abierto, setAbierto] = useState(false);

  // Truco matemático para extraer los nombres de los equipos sin que se repitan
  const equiposUnicos = [...new Set(partidos.flatMap(p => [p.local, p.visitante]))];

  return (
    <div className="mb-4 bg-[#12151C] border border-[#2A2E37] rounded-2xl overflow-hidden transition-all shadow-lg">
      
      {/* CABECERA DEL GRUPO (El botón que abre/cierra) */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="w-full px-5 py-4 flex items-center justify-between bg-[#1A1D24] hover:bg-[#222831] transition-colors active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <Shield className="text-blue-500" size={20} />
          <h3 className="text-sm font-black text-white uppercase tracking-widest">{nombreGrupo}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Pequeño contador visual de partidos */}
          <span className="bg-[#090B0E] text-blue-500 text-[10px] font-bold px-2 py-1 rounded-md">
            {partidos.length} PARTIDOS
          </span>
          <ChevronDown size={18} className={`text-gray-400 transition-transform duration-300 ${abierto ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* CONTENIDO DESPLEGABLE */}
      <div className={`grid transition-all duration-300 ease-in-out ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <div className="p-5 border-t border-[#2A2E37]">
            
            {/* SECCIÓN 1: Integrantes del Equipo */}
            <div className="mb-6">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
                Integrantes del Grupo <div className="h-px bg-[#2A2E37] flex-1"></div>
              </span>
              <div className="flex flex-wrap gap-2">
                {equiposUnicos.map((equipo, index) => (
                  <div key={index} className="bg-[#090B0E] border border-[#2A2E37] px-3 py-1.5 rounded-lg text-xs font-bold text-gray-300 shadow-sm">
                    {equipo}
                  </div>
                ))}
              </div>
            </div>

            {/* SECCIÓN 2: Los Partidos */}
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 block flex items-center gap-2">
              Calendario <div className="h-px bg-[#2A2E37] flex-1"></div>
            </span>
            <div className="flex flex-col gap-3">
              {partidos.map(partido => (
                <PartidoCard 
                  key={`${partido.id}-${ligaId}`} 
                  partido={partido} 
                  usuarioId={usuarioId} 
                  ligaId={ligaId} 
                />
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}