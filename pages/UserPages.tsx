import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

import { useNavigate, useSearchParams } from 'react-router-dom';
import { getStoredRoutines, toggleRoutine, deleteRoutine } from '../services/routineService';
import { historyService } from '../services/dataService';
import { Routine, SymptomLogEntry } from '../types';
import { authService } from '../services/authService';
import { supabase } from '../supabaseClient';

export const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    const data = await historyService.getFavorites();
    if (data) setFavorites(data);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar de favoritos?")) return;
    try {
      await historyService.deleteFavoriteById(id);
      setFavorites(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 pt-32 pb-24">
      <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-8 tracking-tight">Mis Favoritos 💖</h2>
      {favorites.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 dark:bg-surface-dark rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
          <p className="text-gray-500">Aún no hay favoritos.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((fav, index) => (
            <div key={index} onClick={() => navigate(`/symptom-detail?q=${encodeURIComponent(fav.symptom_name)}`)} className="relative bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-lg border border-gray-50 dark:border-gray-800 cursor-pointer hover:border-primary/30 transition-all group">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-10">{fav.symptom_name}</h3>
              <p className="text-sm text-gray-500 line-clamp-3">{fav.description}</p>
              <button
                onClick={(e) => handleDelete(fav.id, e)}
                className="absolute top-4 right-4 z-50 p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-500 hover:text-white transition-all shadow-md"
                title="Eliminar de favoritos"
              >
                <span className="material-symbols-outlined text-[20px] font-bold">close</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const RoutinesPage: React.FC = () => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [xpAdded, setXpAdded] = useState<number | null>(null);

  useEffect(() => {
    getStoredRoutines().then(setRoutines);
  }, []);

  const handleToggle = async (id: string) => {
    const routine = routines.find(r => r.id === id);
    if (!routine) return;

    // Optimistic update
    setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed: !r.completed } : r));

    const { success, xpEarned } = await toggleRoutine(id, routine.completed);

    if (!success) {
      // Revert if failed
      setRoutines(prev => prev.map(r => r.id === id ? { ...r, completed: routine.completed } : r));
    } else if (xpEarned > 0) {
      authService.addXP(xpEarned);
      setXpAdded(xpEarned);
      setTimeout(() => setXpAdded(null), 2000);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Confirmación amigable antes de eliminar
    if (!window.confirm("¿Estás segura/o de que quieres eliminar esta rutina de tu lista?")) {
      return;
    }

    const success = await deleteRoutine(id);
    if (success) {
      setRoutines(prev => prev.filter(r => r.id !== id));
    }
  };

  const getIcon = (cat: string) => {
    switch (cat) {
      case 'meditation': return 'self_improvement';
      case 'infusion': return 'local_cafe';
      case 'spiritual': return 'volunteer_activism';
      default: return 'check_circle';
    }
  };

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto px-6 py-12 pt-32 pb-24">
      {xpAdded && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-6 py-3 rounded-full font-bold flex items-center gap-2 animate-bounce">
          <span>+{xpAdded} XP</span>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">Mis Rutinas Diarias 📅</h1>
        <p className="text-gray-500 mt-2">Pequeños pasos para grandes cambios.</p>
      </div>

      <div className="space-y-4">
        {routines.map((routine) => (
          <div
            key={routine.id}
            onClick={() => handleToggle(routine.id)}
            className={`group flex items-center gap-4 p-5 rounded-3xl transition-all cursor-pointer border ${routine.completed
              ? 'bg-gray-50 dark:bg-white/5 border-transparent opacity-60'
              : 'bg-white dark:bg-surface-dark border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:border-primary/20'
              }`}
          >
            <div className={`size-12 rounded-2xl flex items-center justify-center text-2xl transition-colors ${routine.completed
              ? 'bg-green-100 text-green-600'
              : 'bg-primary/10 text-primary'
              }`}>
              <span className="material-symbols-outlined">{routine.completed ? 'check' : getIcon(routine.category)}</span>
            </div>

            <div className="flex-1">
              <h3 className={`font-bold text-lg transition-colors ${routine.completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}>
                {routine.text}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-lg">{routine.time}</span>
                {routine.source && (
                  <span className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-lg uppercase tracking-wide">
                    {routine.source}
                  </span>
                )}
              </div>
            </div>

            <button onClick={(e) => handleDelete(routine.id, e)} className="p-2 text-gray-300 hover:text-red-400 transition-all">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        ))}

        {routines.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            No tienes rutinas activas. Busca un síntoma para agregar recomendaciones.
          </div>
        )}
      </div>
    </div>
  )
}

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await historyService.getHistory();
      if (data) setHistoryItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este registro?")) return;
    try {
      await historyService.deleteLog(id);
      setHistoryItems(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 pt-32 pb-24">
      <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-8">Tu Historial 🕰️</h1>
      <div className="space-y-4">
        {historyItems.length === 0 ? <p className="text-gray-500">Sin registros.</p> : historyItems.map(item => {
          const symptomName = item.notes?.replace('Síntoma: ', '').replace('Búsqueda: ', '').trim();
          return (
            <div
              key={item.id}
              onClick={() => symptomName ? navigate(`/symptom-detail?q=${encodeURIComponent(symptomName)}`) : null}
              className={`bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all ${symptomName ? 'cursor-pointer hover:border-primary/40 hover:shadow-md active:scale-[0.98]' : ''}`}
            >
              <div className="flex justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${item.intensity > 0 ? 'text-primary' : 'text-gray-400 uppercase tracking-widest'}`}>
                    {item.intensity > 0 ? `Intensidad ${item.intensity}` : '👁️ Visualizado'}
                  </span>
                  <button onClick={(e) => handleDelete(item.id, e)} className="text-gray-300 hover:text-red-400 transition-colors p-1">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
              </div>
              <p className="text-gray-800 dark:text-gray-200 font-medium">
                {item.notes}
                {symptomName && <span className="material-symbols-outlined inline-block align-middle ml-2 text-primary opacity-50 text-sm">arrow_forward</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  )
}

export const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subscriptionRef = React.useRef<HTMLDivElement>(null);

  // HOOKS MUST BE AT THE TOP LEVEL
  // const { theme, toggleTheme } = useTheme();

  // Handle Upgrade Redirect
  useEffect(() => {
    if (searchParams.get('upgrade') === 'true' && subscriptionRef.current) {
      setTimeout(() => {
        subscriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Optional: Highlight effect
        subscriptionRef.current?.classList.add('ring-4', 'ring-amber-400');
        setTimeout(() => subscriptionRef.current?.classList.remove('ring-4', 'ring-amber-400'), 2000);
      }, 500); // Small delay to allow rendering
    }
  }, [searchParams, user]);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      const file = e.target.files[0];
      try {
        const newAvatarUrl = await authService.updateAvatar(file);
        if (newAvatarUrl) {
          setUser((prev: any) => ({ ...prev, avatar: newAvatarUrl }));
        } else {
          alert('Error al subir imagen. Asegúrate de tener el bucket "avatars" creado en Supabase con acceso público.');
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  useEffect(() => {
    const loadUser = async () => {
      const userData = await authService.getUser();
      setUser(userData);
    };
    loadUser();
  }, []);

  if (!user) {
    return <div className="flex-1 flex items-center justify-center"><span className="animate-spin material-symbols-outlined text-4xl text-primary">progress_activity</span></div>;
  }

  // --- HELPER LOGIC ---
  const getSoulTitle = (level: number) => {
    if (level < 3) return "Semilla Cósmica";
    if (level < 6) return "Brote de Luz";
    if (level < 10) return "Guerrero Espejo";
    return "Maestro del Loto";
  };

  const soulTitle = getSoulTitle(user.level || 1);
  const nextLevelXp = (user.level || 1) * 100; // Simplified logic
  const currentXp = user.xp || 0;
  const progressPercent = Math.min(100, (currentXp % 100) / 100 * 100);

  // Stats Reales
  const streak = user.currentStreak || 0;
  const healingMoments = user.healingMoments || 0;
  const xp = user.xp || 0;

  // Real Badges Logic
  const userBadges = user.badges || [];

  const allBadges = [
    { name: "Despertar", icon: "🌱", color: "bg-green-100 dark:bg-green-900/30 text-green-600" },
    { name: "Constancia", icon: "🔥", color: "bg-orange-100 dark:bg-orange-900/30 text-orange-600" },
    { name: "Sabiduría", icon: "🦉", color: "bg-blue-100 dark:bg-blue-900/30 text-blue-600" },
    { name: "Alquimista", icon: "⚗️", color: "bg-purple-100 dark:bg-purple-900/30 text-purple-600" },
  ];

  const benefits = [
    { text: "Búsquedas de Síntomas", free: "3 al día", premium: "Ilimitadas" },
    { text: "Meditaciones IA", free: "Bloqueado", premium: "Acceso Total", highlight: true },
    { text: "Remedios Naturales", free: "Básico", premium: "Completo", highlight: true },
    { text: "Historial de Sanación", free: "7 días", premium: "Infinito" },
    { text: "Publicidad", free: "Con Anuncios", premium: "Sin Anuncios", highlight: true },
    { text: "Soporte", free: "Comunidad", premium: "Prioritario" },
  ];

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 pt-32 pb-32">

      {/* 1. AURA HEADER */}
      <div className="relative mb-12 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/20 dark:bg-primary/10 rounded-full blur-3xl -z-10 animate-pulse"></div>

        <div className="relative inline-block mb-4">
          <svg className="size-32 -rotate-90">
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-gray-800" />
            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-primary transition-all duration-1000 ease-out" strokeDasharray="377" strokeDashoffset={377 - (377 * progressPercent) / 100} strokeLinecap="round" />
          </svg>

          <div className="absolute inset-2 rounded-full overflow-hidden border-4 border-white dark:border-surface-dark shadow-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900 dark:to-purple-900 flex items-center justify-center group">
            {/* Mensaje sutil si no hay foto */}
            {!user.avatar && (
              <div className="absolute bottom-6 left-0 right-0 text-center z-20 pointer-events-none">
                <span className="text-[10px] bg-black/50 text-white px-2 py-1 rounded-full backdrop-blur-md">Sube tu foto</span>
              </div>
            )}
            {user.avatar ? (
              <img src={user.avatar} alt="User" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-black text-primary/50">{user.name.charAt(0).toUpperCase()}</span>
            )}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer backdrop-blur-sm"
            >
              {isUploading ? (
                <span className="material-symbols-outlined animate-spin text-white">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-white text-3xl">photo_camera</span>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
          </div>

          <div className="absolute -bottom-2 -right-2 bg-white dark:bg-surface-dark rounded-full p-2 shadow-lg text-primary text-xs font-black border border-gray-100 dark:border-gray-700">
            Lvl {user.level}
          </div>
        </div>

        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-1">{user.name}</h2>
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-500 animate-gradient">
          {soulTitle}
        </p>
      </div>

      {/* 2. MY PATH (STATS) */}
      <div className="grid grid-cols-3 gap-3 md:gap-6 mb-12">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-lg flex flex-col items-center">
          <span className="text-2xl md:text-3xl mb-1">🔥</span>
          <span className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">{streak}</span>
          <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">Racha días</span>
          {streak > 0 && <span className="text-[9px] text-green-500 font-bold mt-1">¡Sigue así!</span>}
          {streak === 0 && <span className="text-[9px] text-orange-400 font-bold mt-1">¡Empieza hoy!</span>}
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-lg flex flex-col items-center border-t-4 border-t-primary/50">
          <span className="text-2xl md:text-3xl mb-1">⚡</span>
          <span className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">{xp}</span>
          <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">XP Total</span>
        </div>
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl p-4 md:p-6 rounded-[2rem] border border-white/50 dark:border-white/10 shadow-lg flex flex-col items-center">
          <span className="text-2xl md:text-3xl mb-1">✨</span>
          <span className="text-xl md:text-2xl font-black text-gray-800 dark:text-white">{healingMoments}</span>
          <span className="text-[10px] md:text-xs text-gray-400 uppercase tracking-wider font-bold">Sanaciones</span>
        </div>
      </div>

      {/* 3. CONSTELLATION (BADGES) */}
      <div className="mb-12">
        <h3 className="text-lg font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-purple-500">stars</span>
          Constelación de Logros
        </h3>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {allBadges.map((badge, idx) => {
            const isUnlocked = userBadges.includes(badge.name);
            return (
              <div key={idx} className={`min-w-[100px] flex flex-col items-center gap-2 transition-all duration-500 ${isUnlocked ? 'opacity-100 scale-100' : 'opacity-40 grayscale scale-95'}`}>
                <div className={`size-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg ${isUnlocked ? badge.color : 'bg-gray-200 dark:bg-gray-800'}`}>
                  {badge.icon}
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 text-center max-w-[80px] leading-tight">
                  {badge.name}
                </span>
                {!isUnlocked && <span className="text-[9px] text-gray-300 uppercase tracking-widest">Locked</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. LOTUS STATE (SUBSCRIPTION) */}
      <div className="mb-12" ref={subscriptionRef}>
        {user.isPremium ? (
          <div className="relative overflow-hidden bg-gray-900 text-white rounded-[2.5rem] p-8 shadow-2xl border border-gray-800">
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-[80px]"></div>
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-serif italic text-yellow-400 mb-1">Miembro Loto Dorado</h3>
                <p className="text-gray-400 text-sm">Tu suscripción está activa y sanando.</p>
              </div>
              <span className="text-4xl">👑</span>
            </div>
          </div>
        ) : (
          <div className="relative group overflow-hidden bg-gradient-to-br from-amber-100 to-orange-50 dark:from-amber-900/40 dark:to-orange-900/20 rounded-[2.5rem] p-1 border border-amber-200 dark:border-amber-700/50 shadow-xl">
            <div className="bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-[2.3rem] p-6 md:p-8">
              <div className="text-center mb-8">
                <span className="inline-block px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full mb-4 shadow-lg shadow-orange-500/30 animate-pulse">
                  Desbloquea tu Potencial
                </span>
                <h3 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white mb-2">
                  Eleva tu Consciencia
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base mb-6 max-w-lg mx-auto leading-relaxed">
                  ¿Sientes que te falta algo? Desbloquea todo nuestro potencial por menos de lo que vale un Café. El <span className="font-bold text-amber-600 dark:text-amber-400">Loto Dorado</span> te ofrece las herramientas profundas para tu sanación completa.
                </p>
              </div>

              {/* Comparison Table */}
              <div className="bg-white dark:bg-black/20 rounded-3xl overflow-hidden mb-8 border border-gray-100 dark:border-white/5 shadow-sm">

                {/* Header */}
                <div className="grid grid-cols-3 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5">
                  <div className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center">
                    Beneficio
                  </div>
                  <div className="p-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-100/50 dark:bg-white/5">
                    Gratis
                  </div>
                  <div className="p-4 text-center text-xs font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 dark:bg-amber-500/20">
                    Premium
                  </div>
                </div>

                {/* Rows */}
                {benefits.map((item, i) => (
                  <div key={i} className={`grid grid-cols-3 text-sm border-b border-gray-50 dark:border-white/5 last:border-0 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${item.highlight ? 'bg-amber-50/30 dark:bg-amber-900/10' : ''}`}>
                    <div className="p-4 py-3 font-medium text-gray-700 dark:text-gray-300 flex items-center">
                      {item.text}
                    </div>
                    <div className="p-4 py-3 text-center font-medium text-gray-500 bg-gray-50/30 dark:bg-white/5 flex items-center justify-center border-l border-gray-50 dark:border-white/5">
                      {item.free === "Bloqueado" ? (
                        <span className="material-symbols-outlined text-gray-300 text-lg">lock</span>
                      ) : (
                        item.free
                      )}
                    </div>
                    <div className={`p-4 py-3 text-center font-bold flex items-center justify-center border-l border-amber-100 dark:border-white/5 ${item.text === "Publicidad" ? "text-emerald-500" : "text-amber-600 dark:text-amber-400"}`}>
                      {item.premium === "Ilimitadas" || item.premium === "Infinito" || item.premium === "Acceso Total" || item.premium === "Completo" ? (
                        <span className="flex items-center gap-1">
                          {item.premium}
                          <span className="material-symbols-outlined text-xs">verified</span>
                        </span>
                      ) : (
                        item.premium
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => window.open('https://sanarte.lemonsqueezy.com/checkout/buy/cdc04c6b-be2e-4486-88e6-bbf61cfc945e', '_blank')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">diamond</span>
                Unirse al Loto Dorado
              </button>
            </div >
          </div >
        )}
      </div >

      {/* 5. HARMONY MENU (SETTINGS) */}
      <div className="bg-white dark:bg-surface-dark rounded-[2.5rem] p-2 shadow-sm border border-gray-100 dark:border-gray-800">


        <button
          onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          className="w-full flex items-center justify-between p-4 px-6 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className={`size-10 rounded-full flex items-center justify-center transition-colors ${notificationsEnabled ? 'bg-primary/10 text-primary' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              <span className="material-symbols-outlined">{notificationsEnabled ? 'notifications_active' : 'notifications_off'}</span>
            </div>
            <div className="text-left">
              <span className="block font-bold text-gray-700 dark:text-gray-200">Notificaciones</span>
              <span className="text-xs text-gray-400">{notificationsEnabled ? 'Activadas' : 'Silencio'}</span>
            </div>
          </div>
          <span className={`material-symbols-outlined text-4xl ${notificationsEnabled ? 'text-primary' : 'text-gray-300'}`}>
            {notificationsEnabled ? 'toggle_on' : 'toggle_off'}
          </span>
        </button>



        <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4 my-2"></div>

        <button
          onClick={() => { authService.logout(); navigate('/'); }}
          className="w-full flex items-center justify-between p-4 px-6 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-2xl transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="size-10 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/40 transition-colors">
              <span className="material-symbols-outlined">logout</span>
            </div>
            <span className="font-bold text-red-500">Cerrar Sesión</span>
          </div>
        </button>
      </div >



      <div className="mt-8 text-center pb-8">
        <a href="/community?theme=feedback" className="text-sm text-primary font-bold hover:underline opacity-80 decoration-dashed underline-offset-4">
          ¿Cómo podemos mejorar? Tu opinión nos sana.
        </a>
      </div>

    </div >
  );
};
