import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Users, Shield, UserMinus, Trash2 } from 'lucide-react';

export default function ListaMiembros({ ligaId, usuarioActualId, onLigaEliminada }) {
  const [miembros, setMiembros] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [esAdmin, setEsAdmin] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const cargarMiembros = async () => {
    const { data: miembrosData } = await supabase
      .from('miembros_liga')
      .select('usuario_id, rol')
      .eq('liga_id', ligaId);
    
    const { data: perfilesData } = await supabase
      .from('perfiles')
      .select('id, nombre');

    if (miembrosData && perfilesData) {
      const mapaNombres = {};
      perfilesData.forEach(p => mapaNombres[p.id] = p.nombre);

      const listaFormateada = miembrosData.map(m => ({
        ...m,
        nombre: mapaNombres[m.usuario_id] || 'Participante'
      }));
      
      setMiembros(listaFormateada);
      
      const miPerfil = listaFormateada.find(m => m.usuario_id === usuarioActualId);
      setEsAdmin(miPerfil && miPerfil.rol === 'admin');
    }
    setCargando(false);
  };

  useEffect(() => {
    if (ligaId) cargarMiembros();
  }, [ligaId, usuarioActualId]);

  const expulsarUsuario = async (idExpulsar, nombre) => {
    if (!window.confirm(`¿Seguro que deseas expulsar a ${nombre}? Se borrarán todas sus predicciones y desaparecerá del ranking.`)) return;
    setProcesando(true);
    
    const { error } = await supabase.rpc('expulsar_usuario', { 
      p_liga_id: ligaId, 
      p_usuario_id: idExpulsar 
    });

    if (error) {
      console.error(error);
      alert("Hubo un error al expulsar al jugador: " + error.message);
    } else {
      await cargarMiembros();
    }
    
    setProcesando(false);
  };

  const eliminarLiga = async () => {
    if (!window.confirm('🚨 PELIGRO: ¿Estás absolutamente seguro de eliminar esta liga? Esta acción destruirá la liga, todos los miembros y todos los pronósticos para siempre. NO SE PUEDE DESHACER.')) return;
    setProcesando(true);

    const { error } = await supabase.rpc('eliminar_liga_completa', { 
      p_liga_id: ligaId 
    });

    if (error) {
      console.error(error);
      alert("Hubo un error al eliminar la liga: " + error.message);
    } else {
      if (onLigaEliminada) onLigaEliminada();
    }
    
    setProcesando(false);
  };

  if (cargando) return <div className="text-xs text-gray-500 py-4 animate-pulse">Cargando integrantes...</div>;

  return (
    <div className="flex flex-col gap-2 mb-2">
      <div className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-5 shadow-lg">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#2A2E37]">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-gray-400" />
            <h3 className="text-sm font-black text-white">Integrantes de la Liga ({miembros.length})</h3>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {miembros.map((m) => (
            <div key={m.usuario_id} className="bg-[#090B0E] border border-[#2A2E37] p-3 rounded-xl flex items-center justify-between group transition-colors hover:border-blue-500/30">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="font-bold text-sm text-blue-400 truncate pr-2">
                  {m.nombre}
                </span>
                {m.rol === 'admin' && (
                  <Shield size={14} className="text-yellow-500 flex-shrink-0" title="Administrador" />
                )}
              </div>
              
              {esAdmin && m.usuario_id !== usuarioActualId && (
                <button 
                  onClick={() => expulsarUsuario(m.usuario_id, m.nombre)}
                  disabled={procesando}
                  className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-all md:opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  title="Expulsar jugador"
                >
                  <UserMinus size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {esAdmin && (
        <button 
          onClick={eliminarLiga}
          disabled={procesando}
          className="bg-[#12151C] border border-red-900/30 hover:border-red-500/50 hover:bg-red-900/10 text-red-500 text-[10px] uppercase font-black tracking-widest py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all w-full mt-2"
        >
          <Trash2 size={16} />
          ELIMINAR TORNEO PERMANENTEMENTE
        </button>
      )}
    </div>
  );
}