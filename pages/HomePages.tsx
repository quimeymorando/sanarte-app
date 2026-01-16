
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchCatalog, getSymptomDetails, searchLocalSymptoms } from '../services/geminiService';
import { updateStreak } from '../services/routineService';
import { authService } from '../services/authService';
import { OnboardingTour } from '../components/OnboardingTour';
import AdBanner from '../components/AdBanner';
import { SearchResult, UserProfile } from '../types';


export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [homeSearchQuery, setHomeSearchQuery] = useState('');
  const [greeting, setGreeting] = useState('');
  const [showBreathing, setShowBreathing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Breathing State
  const [isBreathing, setIsBreathing] = useState(false);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale'>('inhale');
  const [breathCount, setBreathCount] = useState(4);

  useEffect(() => {
    const checkOnboarding = () => {
      const completed = localStorage.getItem('sanarte_onboarding_completed');
      if (!completed) {
        setShowOnboarding(true);
      }
    };

    const loadData = async () => {
      const s = updateStreak();
      setStreak(s);
      const u = await authService.getUser();
      setUser(u);
      checkOnboarding();
    };
    loadData();

    // Greeting logic
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 19) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('sanarte_onboarding_completed', 'true');
    setShowOnboarding(false);
  };

  const toggleBreathing = () => setShowBreathing(!showBreathing);

  // 4-7-8 Breathing Logic
  useEffect(() => {
    let interval: any;
    if (isBreathing) {
      interval = setInterval(() => {
        setBreathCount((prev) => {
          if (prev > 1) return prev - 1;
          if (breathPhase === 'inhale') {
            setBreathPhase('hold');
            return 7;
          } else if (breathPhase === 'hold') {
            setBreathPhase('exhale');
            return 8;
          } else {
            setBreathPhase('inhale');
            return 4;
          }
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBreathing, breathPhase]);

  const getBreathInstructions = () => {
    switch (breathPhase) {
      case 'inhale': return { text: "Inhala Paz", sub: "Llena tus pulmones", color: "text-white" };
      case 'hold': return { text: "Retén", sub: "Siente la calma", color: "text-blue-100" };
      case 'exhale': return { text: "Exhala", sub: "Suelta la ansiedad", color: "text-emerald-100" };
    }
  };

  const getCircleStyle = () => {
    const base = "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ease-in-out border-4 border-white/30 relative z-20";
    if (breathPhase === 'inhale') return `${base} bg-white/20 scale-125 duration-[4000ms]`;
    if (breathPhase === 'hold') return `${base} bg-white/30 scale-125 duration-0 animate-pulse`;
    if (breathPhase === 'exhale') return `${base} bg-white/10 scale-90 duration-[8000ms]`;
    return base;
  };

  const handleHomeSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeSearchQuery.trim()) {
      authService.addXP(20);
      navigate(`/search?initial=${encodeURIComponent(homeSearchQuery)}`);
    } else {
      navigate('/search');
    }
  };

  const levelProgress = ((user?.xp || 0) % 500) / 500 * 100;
  const levelTitle = user?.level === 1 ? "Semilla Despierta" : user?.level === 2 ? "Brote de Luz" : "Loto en Expansión";

  return (
    <div className="relative flex min-h-screen w-full flex-col pb-32 bg-[#fcfdfe] dark:bg-background-dark">
      {/* Onboarding Tour */}
      {showOnboarding && <OnboardingTour onComplete={completeOnboarding} />}

      {/* Floating Action Button (FAB) for Quick Community Access */}
      <button
        onClick={() => navigate('/community')}
        className="fixed bottom-24 right-6 size-14 bg-gradient-to-tr from-pink-500 to-purple-600 text-white rounded-full shadow-lg flex items-center justify-center animate-in zoom-in duration-300 hover:scale-105 active:scale-95 z-40 md:hidden"
      >
        <span className="material-symbols-outlined text-2xl">diversity_1</span>
      </button>

      {/* Mobile Navigation Bar (TOP HEADER) */}
      <div className="md:hidden fixed top-0 left-0 w-full bg-white/90 dark:bg-[#1a2c32]/95 backdrop-blur-lg border-b border-gray-100 dark:border-gray-800 z-50 shadow-sm transition-all duration-300">
        <div className="flex flex-col max-w-[1200px] mx-auto w-full">
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="size-9 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-xl">spa</span>
              </div>
              <div>
                <h2 className="text-[#0d181c] dark:text-white text-base font-black tracking-tight leading-none">SanArte</h2>
                <p className="text-[8px] uppercase tracking-[0.2em] font-black text-primary/60 mt-0.5">{levelTitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end gap-1 mr-2">
                <div className="flex items-center gap-1 text-[10px] font-black text-orange-500 uppercase">
                  <span className="material-symbols-outlined text-sm">local_fire_department</span>
                  <span>{streak} días</span>
                </div>
                <div className="w-24 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-purple-500" style={{ width: `${levelProgress}%` }}></div>
                </div>
              </div>
              <div
                onClick={() => navigate('/profile')}
                className="relative cursor-pointer group"
              >
                {user?.avatar ? (
                  <div className="size-10 rounded-2xl bg-cover bg-center border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundImage: `url('${user.avatar}')` }}></div>
                ) : (
                  <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-white dark:border-gray-800 shadow-lg group-hover:scale-110 transition-transform text-primary font-black text-xl">
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 size-4 bg-primary text-white text-[8px] font-black rounded-lg flex items-center justify-center border-2 border-white dark:border-gray-900 shadow-md">
                  {user?.level}
                </div>
              </div>
            </div>
          </div>
          {/* Mobile Level Progress Bar */}
          <div className="sm:hidden h-1 w-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-1000" style={{ width: `${levelProgress}%` }}></div>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full max-w-[1200px] mx-auto px-5 py-6 pt-24 md:pt-6">
        <div className="mb-6 flex justify-between items-end">
          <div className="flex flex-col gap-1">

            <h1 className="text-[#0d181c] dark:text-white text-2xl md:text-3xl font-black leading-tight tracking-tight">
              Hola, {user?.name ? user.name.split(' ')[0] : 'Sanador'} 🌿
            </h1>
            <p className="text-gray-500 dark:text-text-sub text-sm">
              ¿Qué parte de tu alma desea expresarse hoy?
            </p>
          </div>
        </div>

        {/* AD BANNER */}
        <AdBanner />

        <form onSubmit={handleHomeSearch} className="mb-8 group relative w-full">
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <span className="material-symbols-outlined text-gray-400 group-focus-within:text-primary transition-colors text-xl">search</span>
          </div>
          <input
            type="text"
            value={homeSearchQuery}
            onChange={(e) => setHomeSearchQuery(e.target.value)}
            placeholder="¿Qué siente tu cuerpo?"
            className="w-full h-14 pl-12 pr-28 rounded-2xl bg-white dark:bg-surface-dark border border-gray-100 dark:border-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none text-base placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
          />
          <button type="submit" className="absolute right-2 top-2 bottom-2 bg-primary text-white hover:bg-primary-hover px-6 rounded-xl font-bold uppercase tracking-wider text-[10px] shadow-sm transition-all flex items-center justify-center active:scale-95">
            Buscar
          </button>
        </form>

        {/* BREATHE SOS - Improved visual feedback */}
        <div className={`mb-8 w-full rounded-[2rem] p-6 shadow-xl transition-all duration-700 relative overflow-hidden group ${isBreathing ? 'bg-indigo-600 h-[280px]' : 'bg-gradient-to-br from-[#10b981] to-[#059669] h-auto'}`}>
          <div className="absolute top-0 right-0 w-56 h-56 bg-white/10 rounded-full blur-[80px] -mr-16 -mt-16 pointer-events-none group-hover:scale-110 transition-transform duration-1000"></div>

          {!isBreathing ? (
            <div className="flex items-center justify-between relative z-10">
              <div className="flex gap-4 items-center">
                <div className="size-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/30 text-white">
                  <span className="material-symbols-outlined text-2xl">air</span>
                </div>
                <div>
                  <h3 className="text-lg font-black text-white mb-0.5">Pausa Sagrada</h3>
                  <p className="text-white/80 text-xs font-medium max-w-[200px] leading-tight">Técnica de respiración para pánico o ansiedad. Toca el botón y reinicia tu sistema parasimpático.</p>
                </div>
              </div>
              <button
                onClick={() => { setIsBreathing(true); setBreathCount(4); setBreathPhase('inhale'); }}
                className="bg-white text-emerald-700 px-5 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-50 transition-all active:scale-95 shadow-lg"
              >
                Respirar
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full relative z-10">
              <div className="relative mb-6">
                <div className={getCircleStyle().replace('w-32 h-32', 'size-24')}>
                  <span className="text-4xl font-black font-heading">{breathCount}</span>
                </div>
                <div className={`absolute inset-0 rounded-full border-4 border-white/10 ${breathPhase === 'exhale' ? 'scale-150 opacity-0 transition-transform duration-[8000ms]' : 'scale-100 opacity-100'}`}></div>
              </div>

              <div className="text-center space-y-1">
                <h3 className={`text-2xl font-black tracking-tighter uppercase ${getBreathInstructions().color} transition-colors duration-500`}>
                  {getBreathInstructions().text}
                </h3>
                <p className="text-indigo-200 text-sm font-bold animate-pulse">
                  {getBreathInstructions().sub}
                </p>
              </div>

              <button onClick={() => setIsBreathing(false)} className="absolute top-0 right-0 p-4 text-white/30 hover:text-white transition-colors">
                <span className="material-symbols-outlined text-2xl">close</span>
              </button>
            </div>
          )}
        </div>

        {/* 2x2 Grid - Polished */}
        <div className="grid grid-cols-2 gap-3 mb-10">
          {[
            { id: 'community', name: 'Comunidad', emoji: '🤝', color: 'bg-pink-50 text-pink-500 border-pink-100', xp: '+10 Luz' },
            { id: 'favorites', name: 'Favoritos', emoji: '💖', color: 'bg-rose-50 text-rose-500 border-rose-100', xp: 'Ver listado' },
            { id: 'routines', name: 'Rutinas', emoji: '📅', color: 'bg-orange-50 text-orange-500 border-orange-100', xp: '+50 Luz' },
            { id: 'history', name: 'Historial', emoji: '🕰️', color: 'bg-purple-50 text-purple-500 border-purple-100', xp: 'Tu camino' },
          ].map(item => (
            <div
              key={item.id}
              onClick={() => navigate(`/${item.id}`)}
              className={`bg-white dark:bg-surface-dark p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer hover:border-primary/20 group relative overflow-hidden h-32`}
            >
              <div className={`size-10 rounded-2xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform ${item.color}`}>
                {item.emoji}
              </div>
              <div className="text-center">
                <span className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-tight">{item.name}</span>
                <span className="block text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{item.xp}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center px-8 py-4">
          <p className="text-sm font-serif italic text-gray-400 dark:text-gray-600">"Toda sanación física comienza en la quietud de la mente."</p>
        </div>

      </main>
    </div>
  );
};

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('initial') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Ref for click outside logic
  const searchContainerRef = React.useRef<HTMLDivElement>(null);

  const phrases = [
    "Conectando con la sabiduría de tu cuerpo...",
    "Buscando la luz en tus síntomas...",
    "Preparando tu camino hacia la sanación...",
    "Interpretando el lenguaje sagrado de tu alma...",
    "Atrayendo las respuestas que necesitas..."
  ];
  const [phraseIndex, setPhraseIndex] = useState(0);

  // Autocomplete Logic
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    // Debounce para UX suave
    const timeoutId = setTimeout(async () => {
      if (query.length > 1) {
        try {
          // Busqueda Local: Instantánea y GRATIS (No consume API de OpenRouter)
          // @ts-ignore
          const results = await searchLocalSymptoms(query);
          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          console.error("Error fetching suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // Debounce de 300ms es suficiente para local

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (isLoading) {
      interval = setInterval(() => setPhraseIndex(p => (p + 1) % phrases.length), 3000);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    if (initialQuery && !hasSearched) handleSearch(initialQuery);
  }, [initialQuery]);

  const handleSearch = async (searchTerm: string = query) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setHasSearched(true);
    setResults([]);
    setShowSuggestions(false); // Ocultar sugerencias al buscar
    try {
      // @ts-ignore
      const data = await searchCatalog(searchTerm); // Usar alias searchCatalog
      setResults(data);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full pb-24 min-h-screen bg-[#fcfdfe] dark:bg-background-dark">
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-background-dark/90 backdrop-blur-xl pt-10 pb-6 px-6 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="size-12 rounded-2xl bg-gray-50 dark:bg-surface-dark flex items-center justify-center text-gray-400 hover:text-primary transition-colors">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div ref={searchContainerRef} className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-xl">search</span>
            </div>
            <input
              className="w-full h-14 pl-12 pr-12 rounded-2xl border-none bg-gray-50 dark:bg-surface-dark text-lg placeholder-gray-400 focus:ring-4 focus:ring-primary/10 transition-all outline-none"
              placeholder="¿Qué te duele?"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              autoFocus={!initialQuery}
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-surface-dark rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {suggestions.map((s, i) => (
                  <div
                    key={i}
                    onClick={() => { setQuery(s); handleSearch(s); setShowSuggestions(false); }}
                    className="px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer text-gray-700 dark:text-gray-300 font-medium transition-colors border-b last:border-0 border-gray-50 dark:border-gray-800/50"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 mt-10">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
            <div className="relative w-48 h-48 flex items-center justify-center mb-16">
              <div className="absolute inset-0 border-2 border-primary/20 rounded-full animate-[spin_10s_linear_infinite]"></div>
              <div className="absolute inset-6 border border-purple-400/20 rounded-full animate-[spin_7s_linear_infinite_reverse]"></div>
              <div className="relative w-6 h-6 bg-primary rounded-full shadow-[0_0_30px_#0db9f2] animate-pulse"></div>
            </div>
            <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 font-heading tracking-tight">Sintonizando...</h3>
            <p className="text-primary font-bold italic h-8">{phrases[phraseIndex]}</p>
          </div>
        )}


        {!isLoading && results.length === 0 && hasSearched && (
          <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
            <div className="text-6xl mb-4">🌪️</div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-gray-200 mb-2">La energía está difusa...</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              No encontramos un síntoma exacto con ese nombre. <br />
              Intenta usar palabras más simples como "Cabeza", "Estómago" o "Miedo".
            </p>
          </div>
        )}

        {!isLoading && results.length > 0 && (
          <div className="flex flex-col gap-6">

            {/* Debugging Log */}
            {console.log("Rendering results:", results)}

            {/* Fallback Warning - Only shows when offline/fallback data is used */}
            {results[0] && results[0].isFallback && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/50 p-4 rounded-2xl flex items-start gap-3 mb-2 animate-in fade-in slide-in-from-top-2">
                <span className="material-symbols-outlined text-orange-500 mt-0.5">wifi_off</span>
                <div>
                  <h4 className="font-bold text-orange-800 dark:text-orange-200 text-sm">Conexión Débil con la Fuente</h4>
                  <p className="text-orange-600 dark:text-orange-300 text-xs mt-1">
                    No pudimos conectar con la Inteligencia Artificial. Mostrando resultados básicos de emergencia. Por favor verifica tu conexión o configuración.
                  </p>

                  {typeof results[0].errorMessage === 'string' && (
                    <details className="mt-2 group/details">
                      <summary className="text-[10px] font-bold text-orange-500 cursor-pointer hover:underline select-none list-none flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px] group-open/details:rotate-90 transition-transform">chevron_right</span>
                        Ver detalle técnico del error
                      </summary>
                      <pre className="mt-2 p-2 bg-orange-100 dark:bg-orange-950/50 rounded-lg text-[10px] text-orange-800 dark:text-orange-200 overflow-x-auto whitespace-pre-wrap font-mono border border-orange-200 dark:border-orange-900">
                        {results[0].errorMessage}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            {results.map((result, index) => {
              if (!result) return null; // Safety check
              return (
                <div
                  key={index}
                  onClick={() => navigate(`/symptom-detail?q=${encodeURIComponent(result.name || '')}`)}
                  className="group bg-white dark:bg-surface-dark p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm transition-all cursor-pointer hover:border-primary/40 hover:-translate-y-1 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-primary text-xl">arrow_forward</span>
                  </div>

                  <div className="mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary/80 mb-1 block">
                      {result.category || 'General'}
                    </span>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white capitalize leading-tight">
                      {result.name || 'Sin nombre'}
                    </h3>
                  </div>

                  <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                    {result.emotionalMeaning || 'Sin descripción disponible.'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}