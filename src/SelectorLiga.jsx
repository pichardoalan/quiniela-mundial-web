import React, { useState } from 'react';
import { Trophy, Key, ArrowRight, PlusCircle, X } from 'lucide-react';
import { supabase } from './supabase';

export default function SelectorLiga({ usuarioId, onLigaSeleccionada, onCancelar, puedeCancelar }) {
  const [modo, setModo] = useState('seleccionar'); 
  const [codigo, setCodigo] = useState('');
  const [nombreLiga, setNombreLiga] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const manejarUnirse = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const { data: liga, error: errorBusqueda } = await supabase
      .from('ligas')
      .select('id, nombre')
      .eq('codigo_invitacion', codigo.toUpperCase())
      .single();

    if (errorBusqueda || !liga) {
      console.error("Error al buscar código:", errorBusqueda);
      setError('El código no existe. Verifica con tu administrador.');
      setCargando(false);
      return;
    }

    const { error: errorUnion } = await supabase
      .from('miembros_liga')
      .insert({ liga_id: liga.id, usuario_id: usuarioId });

    if (errorUnion && errorUnion.code !== '23505') { 
      console.error("Error al unir a la liga:", errorUnion);
      setError(`Error al unirte: ${errorUnion.message}`);
    } else {
      onLigaSeleccionada(liga.nombre, codigo.toUpperCase());
    }
    setCargando(false);
  };

  const manejarCrear = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    const nuevoCodigo = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { data: nuevaLiga, error: errorCrear } = await supabase
      .from('ligas')
      .insert({ nombre: nombreLiga, codigo_invitacion: nuevoCodigo, creador_id: usuarioId })
      .select()
      .single();

    if (errorCrear) {
      console.error("Error detallado al crear la liga:", errorCrear);
      setError(`Error de Supabase: ${errorCrear.message}`);
      setCargando(false);
      return;
    }

    const { error: errorUnion } = await supabase
      .from('miembros_liga')
      .insert({ liga_id: nuevaLiga.id, usuario_id: usuarioId, rol: 'admin' });
      
    if (errorUnion) {
      console.error("Error detallado al agregar miembro:", errorUnion);
      setError(`Error al asignarte a la liga: ${errorUnion.message}`);
      setCargando(false);
      return;
    }

    onLigaSeleccionada(nuevaLiga.nombre, nuevoCodigo);
    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-[#090B0E] text-white flex flex-col justify-center items-center px-6 relative">
      
      {puedeCancelar && (
        <button onClick={onCancelar} className="absolute top-6 right-6 w-10 h-10 bg-[#12151C] border border-[#2A2E37] rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 transition-colors">
          <X size={20} />
        </button>
      )}

      <div className="w-full max-w-sm flex flex-col items-center">
        <div className="w-16 h-16 bg-[#12151C] border border-[#2A2E37] rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-2xl">
          <Trophy size={32} />
        </div>

        <h1 className="text-2xl font-black tracking-tight mb-2 text-center">Torneos Privados</h1>
        <p className="text-sm text-gray-500 text-center mb-8">Únete a una liga para competir.</p>

        {error && <div className="w-full bg-red-500/10 border border-red-500/50 text-red-500 text-xs p-3 rounded-lg mb-6 text-center">{error}</div>}

        {modo === 'seleccionar' && (
          <div className="w-full flex flex-col gap-4">
            <button onClick={() => setModo('unirse')} className="w-full bg-[#12151C] border border-[#2A2E37] hover:border-blue-500 text-white p-4 rounded-xl flex items-center gap-4 transition-colors">
              <Key className="text-blue-500" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm">Tengo un código</span>
                <span className="text-[10px] text-gray-500">Unirme a un torneo existente</span>
              </div>
            </button>
            <button onClick={() => setModo('crear')} className="w-full bg-[#12151C] border border-[#2A2E37] hover:border-blue-500 text-white p-4 rounded-xl flex items-center gap-4 transition-colors">
              <PlusCircle className="text-blue-500" />
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm">Crear nuevo torneo</span>
                <span className="text-[10px] text-gray-500">Ser el administrador</span>
              </div>
            </button>
          </div>
        )}

        {modo === 'unirse' && (
          <form onSubmit={manejarUnirse} className="w-full space-y-4 animate-fade-in">
            <input type="text" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Código de Invitación" className="w-full bg-[#12151C] border border-[#2A2E37] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 uppercase tracking-widest font-bold" required />
            <button disabled={cargando} type="submit" className="w-full bg-blue-500 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
              {cargando ? 'VERIFICANDO...' : 'UNIRME AHORA'} <ArrowRight size={18} />
            </button>
            <button type="button" onClick={() => { setModo('seleccionar'); setError(''); }} className="w-full text-xs text-gray-500 font-bold uppercase mt-4">Volver</button>
          </form>
        )}

        {modo === 'crear' && (
          <form onSubmit={manejarCrear} className="w-full space-y-4 animate-fade-in">
            <input type="text" value={nombreLiga} onChange={(e) => setNombreLiga(e.target.value)} placeholder="Nombre de tu Liga" className="w-full bg-[#12151C] border border-[#2A2E37] text-white rounded-xl px-4 py-3.5 focus:outline-none focus:border-blue-500 font-bold" required />
            <button disabled={cargando} type="submit" className="w-full bg-blue-500 text-white font-black text-sm py-4 rounded-xl flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors">
              {cargando ? 'CREANDO...' : 'CREAR TORNEO'} <Trophy size={18} />
            </button>
            <button type="button" onClick={() => { setModo('seleccionar'); setError(''); }} className="w-full text-xs text-gray-500 font-bold uppercase mt-4">Volver</button>
          </form>
        )}
      </div>
    </div>
  );
}