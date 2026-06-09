import React, { useState, useEffect } from 'react';
import Login from './Login';
import SelectorLiga from './SelectorLiga';
import PartidoCard from './PartidoCard';
import Ranking from './Ranking';
import Comunidad from './Comunidad';
import RegistroNombre from './RegistroNombre';
import ListaMiembros from './ListaMiembros';
import ResumenEstadisticas from './ResumenEstadisticas';
import { Trophy, CalendarDays, LogOut, ChevronDown, Plus, Home, Users, Lock } from 'lucide-react';
import { supabase } from './supabase';
import BracketEliminatorio from './BracketEliminatorio';
import AdminPanel from './AdminPanel';

export default function App() {
  const [usuarioActivo, setUsuarioActivo] = useState(null);
  const [necesitaPerfil, setNecesitaPerfil] = useState(false);
  const [misLigas, setMisLigas] = useState([]); 
  const [ligaActiva, setLigaActiva] = useState(null); 
  const [agregandoLiga, setAgregandoLiga] = useState(false); 
  const [menuAbierto, setMenuAbierto] = useState(false); 
  const [vistaActiva, setVistaActiva] = useState('inicio'); 
  const [cargando, setCargando] = useState(true);
  const [partidos, setPartidos] = useState([]);
  const [grupoSeleccionado, setGrupoSeleccionado] = useState('Grupo A');
  const [modoJuego, setModoJuego] = useState('grupos'); // 'grupos' | 'bracket'

  const cargarLigasDelUsuario = async (userId) => {
    const { data: ligasUsuario } = await supabase
      .from('miembros_liga')
      .select('ligas(id, nombre, codigo_invitacion)')
      .eq('usuario_id', userId);

    if (ligasUsuario && ligasUsuario.length > 0) {
      const listasFormateadas = ligasUsuario.map(item => item.ligas);
      setMisLigas(listasFormateadas);
      if (!ligaActiva) setLigaActiva(listasFormateadas[0]);
    } else {
      setMisLigas([]);
      setLigaActiva(null);
      setVistaActiva('inicio');
    }
  };

  useEffect(() => {
    const cargarDatosIniciales = async (session) => {
      if (session) {
        const userId = session.user.id;
        
        const { data: perfilData } = await supabase
          .from('perfiles')
          .select('nombre')
          .eq('id', userId)
          .single();

        if (perfilData && perfilData.nombre) {
          setUsuarioActivo({ id: userId, nombre: perfilData.nombre });
          setNecesitaPerfil(false);
        } else {
          setUsuarioActivo({ id: userId, nombre: session.user.user_metadata.full_name || 'Usuario' });
          setNecesitaPerfil(true);
        }

        await cargarLigasDelUsuario(userId);
        const { data: partidosData } = await supabase.from('partidos').select('*').order('fecha', { ascending: true });
        if (partidosData) setPartidos(partidosData);
      } else {
        setUsuarioActivo(null);
        setMisLigas([]);
        setLigaActiva(null);
      }
      setCargando(false);
    };

    supabase.auth.getSession().then(({ data: { session } }) => cargarDatosIniciales(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCargando(true);
      cargarDatosIniciales(session);
    });

    return () => subscription.unsubscribe();
  }, [ligaActiva]);

  const manejarCerrarSesion = async () => await supabase.auth.signOut();

  const alCompletarRegistroLiga = () => {
    setAgregandoLiga(false);
    setCargando(true);
    cargarLigasDelUsuario(usuarioActivo.id).then(() => setCargando(false));
  };

  if (cargando) return <div className="min-h-screen bg-[#090B0E] flex items-center justify-center text-blue-500 font-bold">Cargando Quiniela...</div>;
  if (!usuarioActivo) return <Login />;
  
  if (necesitaPerfil) {
    return <RegistroNombre 
      usuarioId={usuarioActivo.id} 
      onCompletado={(nombreRegistrado) => {
        setUsuarioActivo(prev => ({ ...prev, nombre: nombreRegistrado }));
        setNecesitaPerfil(false);
      }} 
    />;
  }
  
  if (misLigas.length === 0 || agregandoLiga) {
    return <SelectorLiga 
      usuarioId={usuarioActivo.id} 
      onLigaSeleccionada={alCompletarRegistroLiga} 
      onCancelar={() => setAgregandoLiga(false)}
      puedeCancelar={misLigas.length > 0}
    />;
  }

  return (
    <div className="min-h-screen bg-[#090B0E] text-white font-sans selection:bg-blue-500 selection:text-white pb-24">
      
      <header className="sticky top-0 z-40 bg-[#12151C]/90 backdrop-blur-md border-b border-[#2A2E37] px-4 py-3 mb-6 flex items-center justify-between">
        <div className="relative">
          <button onClick={() => setMenuAbierto(!menuAbierto)} className="flex flex-col text-left focus:outline-none group">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-0.5">Torneo Actual</span>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight text-blue-500 leading-none group-hover:text-blue-400 transition-colors">{ligaActiva?.nombre}</h1>
              <ChevronDown size={16} className={`text-gray-400 transition-transform ${menuAbierto ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {menuAbierto && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuAbierto(false)}></div>
              <div className="absolute top-full left-0 mt-3 w-56 bg-[#1A1D24] border border-[#2A2E37] rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-3 pb-2 mb-2 border-b border-[#2A2E37] text-[10px] font-bold text-gray-500 uppercase">Mis Torneos</div>
                {misLigas.map((liga) => (
                  <button key={liga.id} onClick={() => { setLigaActiva(liga); setMenuAbierto(false); setVistaActiva('inicio'); }} className={`w-full text-left px-4 py-2.5 text-sm font-bold hover:bg-[#2A2E37] transition-colors ${ligaActiva.id === liga.id ? 'text-blue-400' : 'text-gray-300'}`}>
                    {liga.nombre}
                  </button>
                ))}
                <div className="h-px bg-[#2A2E37] my-1" />
                <button onClick={() => { setAgregandoLiga(true); setMenuAbierto(false); }} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-gray-400 hover:text-white hover:bg-[#2A2E37] transition-colors">
                  <Plus size={16} /> Unirse o Crear
                </button>
              </div>
            </>
          )}
        </div>
        <button onClick={manejarCerrarSesion} className="w-8 h-8 bg-[#2A2E37] rounded-full flex items-center justify-center text-sm shadow-inner text-red-500 hover:bg-red-500/20 transition-colors"><LogOut size={14} /></button>
      </header>

      <main className="max-w-3xl mx-auto px-4">
        {vistaActiva === 'inicio' && (
          <div className="flex flex-col gap-4 animate-fade-in">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-400 font-medium">Hola, <span className="text-white font-bold">{usuarioActivo.nombre}</span></p>
              <div className="bg-[#12151C] border border-blue-500/30 px-3 py-1.5 rounded-lg text-[10px] font-bold text-gray-400 tracking-widest flex items-center gap-2">
                CÓDIGO: <span className="text-blue-400 text-xs">{ligaActiva?.codigo_invitacion}</span>
              </div>
            </div>
           
            <ListaMiembros 
              ligaId={ligaActiva.id} 
              usuarioActualId={usuarioActivo.id} 
              onLigaEliminada={async () => {
                setCargando(true);
                setLigaActiva(null);
                await cargarLigasDelUsuario(usuarioActivo.id);
                setCargando(false);
              }}
            />

            <ResumenEstadisticas usuarioId={usuarioActivo.id} ligaId={ligaActiva.id} />
            {/* PANEL MAESTRO INVISIBLE PARA LOS DEMÁS */}
            {usuarioActivo.id === 'eb8798f7-d4d2-42f0-be6f-641fdf8dd13f' && (
              <AdminPanel usuarioActualId={usuarioActivo.id} />
            )}

            <button onClick={() => setVistaActiva('partidos')} className="w-full relative overflow-hidden bg-gradient-to-br from-blue-900/40 to-[#12151C] border border-blue-500/30 rounded-2xl p-6 flex flex-col items-start justify-center text-left hover:border-blue-500/60 transition-colors group mt-2">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all"></div>
              <CalendarDays size={32} className="text-blue-400 mb-4" />
              <h2 className="text-2xl font-black text-white mb-1">Jornada de Partidos</h2>
              <p className="text-sm text-gray-400 mb-4">Ingresa o modifica tus pronósticos</p>
              <div className="mt-auto inline-flex items-center gap-2 text-xs font-bold bg-blue-500 text-white px-4 py-2 rounded-lg">
                JUGAR AHORA
              </div>
            </button>

            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setVistaActiva('ranking')} className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 transition-colors">
                <Trophy size={28} className="text-yellow-500" />
                <span className="font-bold text-sm text-white">Ranking</span>
              </button>
              
              <button onClick={() => setVistaActiva('comunidad')} className="bg-[#12151C] border border-[#2A2E37] rounded-2xl p-5 flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 transition-colors relative overflow-hidden group">
                <Users size={28} className="text-emerald-500 group-hover:scale-110 transition-transform" />
                <span className="font-bold text-sm text-white">Comunidad</span>
              </button>
            </div>
          </div>
        )}

        {vistaActiva === 'partidos' && (
          <div className="flex flex-col animate-fade-in pb-10">
            <h2 className="text-xl font-black mb-4">Selección de Pronósticos</h2>
            
            {/* INTERRUPTOR PRINCIPAL DE MODO DE JUEGO */}
            <div className="flex bg-[#12151C] border border-[#2A2E37] rounded-xl p-1 mb-6">
              <button 
                onClick={() => setModoJuego('grupos')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all ${modoJuego === 'grupos' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Fase de Grupos
              </button>
              <button 
                onClick={() => setModoJuego('bracket')}
                className={`flex-1 py-2.5 text-xs font-black uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${modoJuego === 'bracket' ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Fase Final <Lock size={12} className={modoJuego === 'bracket' ? 'text-white' : 'text-gray-500'} />
              </button>
            </div>

            {/* MODO 1: FASE DE GRUPOS */}
            {modoJuego === 'grupos' && (
              <div className="animate-fade-in">
                <div className="flex overflow-x-auto gap-3 pb-4 mb-2 hide-scrollbar">
                  {[...new Set(partidos.map(p => p.grupo))].sort().map(nombreGrupo => (
                    <button 
                      key={nombreGrupo}
                      onClick={() => setGrupoSeleccionado(nombreGrupo)} 
                      className={`px-5 py-3 rounded-xl whitespace-nowrap font-black text-sm transition-all duration-300 ${
                        grupoSeleccionado === nombreGrupo 
                          ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] scale-105 border border-blue-400' 
                          : 'bg-[#12151C] border border-[#2A2E37] text-gray-500 hover:text-gray-300 hover:border-[#3A3F4B]'
                      }`}
                    >
                      {nombreGrupo.toUpperCase()}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  {partidos
                    .filter(partido => partido.grupo === grupoSeleccionado)
                    .map(partido => (
                      <PartidoCard key={partido.id} partido={partido} usuarioId={usuarioActivo.id} ligaId={ligaActiva.id} />
                    ))}
                </div>
              </div>
            )}

            {/* MODO 2: BRACKET ELIMINATORIO */}
            {modoJuego === 'bracket' && (
              <div className="animate-fade-in">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4 text-center">
                  <span className="text-blue-400 text-xs font-bold block mb-1">Las eliminatorias aún no comienzan</span>
                  <span className="text-gray-400 text-[10px]">Las llaves de votación se habilitarán cuando finalice la fase de grupos.</span>
                </div>
                <BracketEliminatorio ligaId={ligaActiva.id} usuarioId={usuarioActivo.id} />
              </div>
            )}
            
            <div className="h-10"></div>
          </div>
        )}

        {vistaActiva === 'ranking' && (
          <div className="animate-fade-in">
            <Ranking ligaId={ligaActiva.id} usuarioActualId={usuarioActivo.id} />
          </div>
        )}
        
        {vistaActiva === 'comunidad' && (
          <div className="animate-fade-in">
            <Comunidad ligaId={ligaActiva.id} partidos={partidos} />
          </div>
        )} 

        {/* CRÉDITO SUTIL AL FINAL DEL CONTENIDO */}
        <div className="w-full text-center pt-8 pb-4 opacity-30 pointer-events-none">
          <span className="text-[10px] text-white font-bold tracking-widest uppercase">
            by Alan Pichardo
          </span>
        </div>     
      </main>

      <nav className="fixed bottom-0 w-full bg-[#12151C]/95 backdrop-blur-md border-t border-[#2A2E37] pb-2 z-30">
        <div className="max-w-md mx-auto flex justify-around p-3">
          <button onClick={() => setVistaActiva('inicio')} className={`flex flex-col items-center gap-1.5 w-20 transition-colors ${vistaActiva === 'inicio' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            <Home size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Inicio</span>
          </button>
          <button onClick={() => setVistaActiva('partidos')} className={`flex flex-col items-center gap-1.5 w-20 transition-colors ${vistaActiva === 'partidos' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            <CalendarDays size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Jugar</span>
          </button>
          <button onClick={() => setVistaActiva('ranking')} className={`flex flex-col items-center gap-1.5 w-20 transition-colors ${vistaActiva === 'ranking' ? 'text-blue-400' : 'text-gray-500 hover:text-gray-300'}`}>
            <Trophy size={24} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ranking</span>
          </button>
        </div>
      </nav>
    </div>
  );
}