import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Lock } from 'lucide-react'; // <-- Agregamos el ícono del candado

export default function PartidoCard({ partido, usuarioId, ligaId }) {
  const [prediccion, setPrediccion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [cargado, setCargado] = useState(false);
  const [partidoBloqueado, setPartidoBloqueado] = useState(false); // <-- Nuevo estado anti-trampas

  // --- NUEVO EFECTO: CANDADO DE TIEMPO ---
  useEffect(() => {
    const verificarBloqueo = () => {
      if (!partido.fecha) return;
      const fechaPartido = new Date(partido.fecha).getTime();
      const ahora = new Date().getTime();
      if (ahora >= fechaPartido) {
        setPartidoBloqueado(true);
      }
    };

    verificarBloqueo();
    // Revisa cada minuto por si dejan la página abierta
    const intervalo = setInterval(verificarBloqueo, 60000); 
    return () => clearInterval(intervalo);
  }, [partido.fecha]);

  useEffect(() => {
    const cargarVoto = async () => {
      const { data } = await supabase
        .from('predicciones')
        .select('voto')
        .eq('usuario_id', usuarioId)
        .eq('partido_id', partido.id)
        .eq('liga_id', ligaId)
        .single();
      
      if (data) setPrediccion(data.voto);
      setCargado(true);
    };
    cargarVoto();
  }, [ligaId, partido.id, usuarioId]);

  const fechaObj = new Date(partido.fecha);
  const diaMes = fechaObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const hora = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  // --- LÓGICA DE RESULTADOS Y BLOQUEO COMBINADO ---
  const yaTermino = partido.resultado_real != null;
  const acierto = yaTermino && prediccion === partido.resultado_real;
  const estaTotalmenteBloqueado = yaTermino || partidoBloqueado; // <-- Candado maestro

  const manejarVoto = async (opcion) => {
    if (guardando || estaTotalmenteBloqueado) return; // <-- Aplica el candado maestro
    setGuardando(true);
    
    const { data: existente } = await supabase
      .from('predicciones')
      .select('id')
      .eq('usuario_id', usuarioId)
      .eq('partido_id', partido.id)
      .eq('liga_id', ligaId)
      .single();

    let errorGuardado = null;

    if (existente) {
      const { error } = await supabase.from('predicciones').update({ voto: opcion }).eq('id', existente.id);
      errorGuardado = error;
    } else {
      const { error } = await supabase.from('predicciones').insert({ 
        usuario_id: usuarioId, partido_id: partido.id, liga_id: ligaId, voto: opcion 
      });
      errorGuardado = error;
    }

    if (!errorGuardado) setPrediccion(opcion);
    else console.error("Error al guardar:", errorGuardado);
    
    setGuardando(false);
  };

  const getLocalStyle = () => {
    if (prediccion === 'L') return 'bg-gradient-to-br from-blue-600/30 to-blue-900/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-105 z-10';
    if (prediccion === 'V' || prediccion === 'X') return 'bg-[#0E1015] border-transparent opacity-40 grayscale scale-95';
    return 'bg-[#12151C] border-[#2A2E37] hover:border-blue-500/50 hover:bg-[#1A1D24] opacity-80 hover:opacity-100';
  };

  const getVisitanteStyle = () => {
    if (prediccion === 'V') return 'bg-gradient-to-bl from-blue-600/30 to-blue-900/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-105 z-10';
    if (prediccion === 'L' || prediccion === 'X') return 'bg-[#0E1015] border-transparent opacity-40 grayscale scale-95';
    return 'bg-[#12151C] border-[#2A2E37] hover:border-blue-500/50 hover:bg-[#1A1D24] opacity-80 hover:opacity-100';
  };

  const getEmpateStyle = () => {
    if (prediccion === 'X') return 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110';
    if (prediccion === 'L' || prediccion === 'V') return 'bg-[#0E1015] border-[#2A2E37] text-gray-600';
    return 'bg-[#1A1D24] border-[#2A2E37] text-gray-400 hover:border-blue-500 hover:text-blue-400';
  };

  return (
    <div className="relative bg-[#090B0E] border border-[#2A2E37] rounded-2xl mb-4 overflow-visible">
      
      {/* ENCABEZADO DE FECHA Y ETIQUETA DE ESTADO */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#2A2E37] bg-[#12151C] rounded-t-2xl">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
          {diaMes} • {hora}
        </span>
        
        {/* LÓGICA VISUAL DE ETIQUETAS ACTUALIZADA */}
        {yaTermino ? (
          acierto ? (
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              ✅ Acierto +1
            </span>
          ) : (
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
              ❌ Fallo
            </span>
          )
        ) : partidoBloqueado ? (
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
            <Lock size={10} /> Cerrado
          </span>
        ) : (
          /* Las etiquetas originales que tú hiciste si el partido sigue abierto */
          <>
            {cargado && prediccion === null && (
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest animate-pulse flex items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Abierto
              </span>
            )}
            {cargado && prediccion !== null && (
              <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1 bg-blue-500/10 px-2 py-0.5 rounded-full">
                Completado
              </span>
            )}
          </>
        )}
      </div>

      {/* ARENA DE COMBATE (Zonas de Votación) */}
      <div className={`flex items-stretch justify-between p-2 h-32 relative ${partidoBloqueado && !yaTermino ? 'opacity-70' : ''}`}>
        
        {/* BOTÓN GIGANTE LOCAL */}
        <button 
          disabled={guardando || estaTotalmenteBloqueado} 
          onClick={() => manejarVoto('L')} 
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ease-out ${!estaTotalmenteBloqueado ? 'cursor-pointer' : 'cursor-default'} ${getLocalStyle()}`}
        >
          <img src={partido.logo_local} alt={partido.local} className="w-12 h-12 object-contain drop-shadow-xl mb-2 transition-transform" />
          <span className="text-xs font-black text-white text-center leading-tight line-clamp-2 px-2">{partido.local}</span>
        </button>

        {/* BOTÓN FLOTANTE DE EMPATE (Centro) */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center pointer-events-none">
          <button 
            disabled={guardando || estaTotalmenteBloqueado} 
            onClick={() => manejarVoto('X')} 
            className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-xs transition-all duration-300 border-2 ${!estaTotalmenteBloqueado ? 'pointer-events-auto cursor-pointer' : 'pointer-events-auto cursor-default'} ${getEmpateStyle()}`}
          >
            VS
          </button>
          <span className="text-[8px] font-bold text-gray-500 mt-1 uppercase tracking-widest bg-[#090B0E] px-1.5 rounded-sm">Empate</span>
        </div>

        {/* BOTÓN GIGANTE VISITANTE */}
        <button 
          disabled={guardando || estaTotalmenteBloqueado} 
          onClick={() => manejarVoto('V')} 
          className={`flex-1 flex flex-col items-center justify-center p-2 rounded-xl border transition-all duration-300 ease-out ${!estaTotalmenteBloqueado ? 'cursor-pointer' : 'cursor-default'} ${getVisitanteStyle()}`}
        >
          <img src={partido.logo_visitante} alt={partido.visitante} className="w-12 h-12 object-contain drop-shadow-xl mb-2 transition-transform" />
          <span className="text-xs font-black text-white text-center leading-tight">{partido.visitante}</span>
        </button>

      </div>
    </div>
  );
}