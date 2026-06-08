import React, { useState } from 'react';
import { supabase } from './supabase';
import { Database, Loader2, CheckCircle, AlertTriangle } from 'lucide-react';

export default function AdminPanel({ usuarioActualId }) {
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // 🚨 REEMPLAZA ESTO CON TU ID DE SUPABASE 🚨
  const MI_ID_ADMIN = 'eb8798f7-d4d2-42f0-be6f-641fdf8dd13f';

  // El escudo protector: Si no eres tú, se bloquea la vista
  if (usuarioActualId !== MI_ID_ADMIN) {
    return (
      <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 text-center mb-6">
        <AlertTriangle size={32} className="text-red-500 mx-auto mb-2" />
        <h2 className="text-red-500 font-black">ACCESO DENEGADO</h2>
        <p className="text-xs text-red-400 mt-1">Esta área es exclusiva para Alan Pichardo.</p>
      </div>
    );
  }

  const descargarPartidos = async () => {
    setCargando(true);
    setMensaje('Conectando con Football-Data.org...');

    try {
      const respuesta = await fetch('/api-futbol/v4/competitions/WC/matches', {
        method: 'GET',
        headers: {
          'X-Auth-Token': import.meta.env.VITE_FOOTBALL_DATA_TOKEN,
        }
      });

      const datos = await respuesta.json();

      if (datos.errorCode || datos.message) {
        setMensaje(`Error de API: ${datos.message}`);
        setCargando(false);
        return;
      }

      if (!datos.matches || datos.matches.length === 0) {
        setMensaje('La API conectó pero no devolvió el calendario oficial.');
        setCargando(false);
        return;
      }

      const faseGrupos = datos.matches.filter(p => p.stage === 'GROUP_STAGE');
      setMensaje(`Se encontraron ${faseGrupos.length} partidos. Procesando...`);

      const partidosFormateados = faseGrupos.map(p => ({
        local: p.homeTeam?.name || 'Por definir',
        logo_local: p.homeTeam?.crest || 'https://flagcdn.com/w80/un.png',
        visitante: p.awayTeam?.name || 'Por definir',
        logo_visitante: p.awayTeam?.crest || 'https://flagcdn.com/w80/un.png',
        fecha: p.utcDate,
        grupo: p.group ? p.group.replace('GROUP_', 'Grupo ') : 'Fase de Grupos'
      }));

      setMensaje('Limpiando calendario anterior...');
      // ⚠️ Ya NO borramos las predicciones de los usuarios, solo reseteamos los partidos
      await supabase.from('partidos').delete().neq('id', 0);     

      setMensaje('Guardando el Mundial completo en Supabase...');
      const { error } = await supabase.from('partidos').insert(partidosFormateados);

      if (error) throw error;

      setMensaje('¡ÉXITO! Calendario oficial descargado.');
    } catch (error) {
      console.error("Error al descargar:", error);
      setMensaje('Hubo un error de conexión. Revisa la consola.');
    }
    
    setCargando(false);
  };

  return (
    <div className="bg-[#12151C] border border-blue-500/30 rounded-2xl p-6 mb-6 flex flex-col items-center text-center">
      <Database size={32} className="text-blue-500 mb-3" />
      <h2 className="text-lg font-black text-white mb-2">Sincronizador Oficial</h2>
      <p className="text-xs text-gray-400 mb-6">
        Haz clic para descargar los partidos reales desde Football-Data.org.
      </p>
      
      <button 
        disabled={cargando}
        onClick={descargarPartidos}
        className="bg-blue-600 hover:bg-blue-500 text-white font-black text-sm px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
      >
        {cargando ? <Loader2 size={18} className="animate-spin" /> : 'DESCARGAR CALENDARIO REAL'}
      </button>

      {mensaje && (
        <div className={`mt-4 text-xs font-bold flex items-center gap-1.5 px-3 py-2 rounded-lg ${mensaje.includes('Error') || mensaje.includes('API conectó') ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
          {mensaje.includes('¡ÉXITO!') && <CheckCircle size={14} />}
          {mensaje}
        </div>
      )}
    </div>
  );
}