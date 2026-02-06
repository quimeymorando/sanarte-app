import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { updateStreak } from '../../services/routineService';
import { UserProfile } from '../../types';

// Widget Components (Internal for now, can be extracted later)
const WelcomeWidget = ({ user, greeting }: { user: UserProfile | null, greeting: string }) => {
    const levelProgress = ((user?.xp || 0) % 500) / 500 * 100;
    const levelTitle = user?.level === 1 ? "Semilla Despierta" : user?.level === 2 ? "Brote de Luz" : "Loto en Expansión";

    return (
        <div className="col-span-2 row-span-1 glass-panel rounded-3xl p-6 relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex justify-between items-start h-full">
                <div className="flex flex-col justify-between h-full">
                    <div>
                        <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-1">{greeting}</h2>
                        <h1 className="text-3xl md:text-4xl font-black text-white leading-tight">
                            {user?.name ? user.name.split(' ')[0] : 'Sanador/a'}
                        </h1>
                        <p className="text-white/60 text-xs mt-1 font-medium">{levelTitle}</p>
                    </div>
                    <div className="w-full max-w-[200px] mt-4">
                        <div className="flex justify-between text-[10px] text-white/50 mb-1 font-bold uppercase">
                            <span>Nivel {user?.level || 1}</span>
                            <span>{Math.floor(user?.xp || 0)} XP</span>
                        </div>
                        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-1000 shadow-[0_0_10px_rgba(0,242,255,0.5)]" style={{ width: `${levelProgress}%` }}></div>
                        </div>
                    </div>
                </div>

                {/* Avatar */}
                <div className="relative group/avatar cursor-pointer">
                    <div className="absolute inset-0 bg-primary blur-md opacity-20 group-hover/avatar:opacity-40 transition-opacity rounded-full"></div>
                    {user?.avatar ? (
                        <div className="size-16 rounded-2xl bg-cover bg-center border-2 border-white/20 shadow-xl group-hover/avatar:scale-105 transition-transform" style={{ backgroundImage: `url('${user.avatar}')` }}></div>
                    ) : (
                        <div className="size-16 rounded-2xl bg-white/5 flex items-center justify-center border-2 border-white/10 text-primary font-black text-2xl group-hover/avatar:scale-105 transition-transform">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'S'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SearchWidget = ({ onSearch }: { onSearch: (q: string) => void }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) onSearch(query);
    };

    return (
        <div className="col-span-2 md:col-span-1 row-span-1 bg-white dark:bg-surface-dark border border-white/10 dark:border-white/5 rounded-3xl p-1 shadow-lg relative flex items-center">
            <form onSubmit={handleSubmit} className="w-full relative h-full flex items-center">
                <div className="absolute left-4 text-primary animate-pulse-slow">
                    <span className="material-symbols-outlined text-2xl">search</span>
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="¿Qué siente tu cuerpo hoy?"
                    className="w-full h-14 pl-12 pr-4 bg-transparent outline-none text-gray-800 dark:text-white font-medium placeholder-gray-400/70"
                />
                <button type="submit" className="absolute right-2 bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-xl transition-colors">
                    <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </button>
            </form>
        </div>
    );
};

const StatWidget = ({ icon, value, label, color, delay }: any) => (
    <div className={`col-span-1 row-span-1 bg-white/5 dark:bg-[#0f1e24] border border-white/5 p-4 rounded-3xl flex flex-col items-center justify-center gap-2 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300 animate-in fade-in zoom-in`} style={{ animationDelay: `${delay}ms` }}>
        <div className={`absolute top-0 right-0 p-10 bg-${color}-500/10 blur-2xl rounded-full -mr-10 -mt-10 group-hover:bg-${color}-500/20 transition-colors`}></div>
        <div className={`text-${color}-500 text-3xl mb-1 drop-shadow-lg`}>{icon}</div>
        <div className="text-center z-10">
            <span className="block text-2xl font-black text-white leading-none">{value}</span>
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-widest">{label}</span>
        </div>
    </div>
);

const NavWidget = ({ title, icon, color, onClick, span = 1 }: any) => (
    <div
        onClick={onClick}
        className={`col-span-${span} h-32 md:h-auto bg-gradient-to-br from-white/5 to-white/0 border border-white/5 p-6 rounded-3xl relative overflow-hidden group cursor-pointer hover:border-${color}-500/30 transition-all active:scale-95`}
    >
        <div className={`absolute inset-0 bg-${color}-500/0 group-hover:bg-${color}-500/5 transition-colors duration-500`}></div>

        <div className={`size-12 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-500 mb-3 group-hover:scale-110 transition-transform duration-300 shadow-lg shadow-${color}-500/10`}>
            <span className="material-symbols-outlined text-2xl">{icon}</span>
        </div>

        <h3 className="text-lg font-bold text-white group-hover:translate-x-1 transition-transform">{title}</h3>

        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300">
            <span className={`material-symbols-outlined text-${color}-500`}>arrow_forward</span>
        </div>
    </div>
);

const BreathingWidget = () => {
    const [active, setActive] = useState(false);

    return (
        <div className={`col-span-2 md:col-span-1 row-span-2 rounded-[2rem] relative overflow-hidden transition-all duration-500 group cursor-pointer ${active ? 'bg-indigo-600' : 'bg-[#059669]'}`} onClick={() => setActive(!active)}>
            {/* Decor layer */}
            <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/noise.png')]"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-1000"></div>

            <div className="relative z-10 p-6 flex flex-col justify-between h-full min-h-[240px]">
                <div className="flex justify-between items-start">
                    <div className="size-12 rounded-2xl bg-white/20 border border-white/20 flex items-center justify-center text-white backdrop-blur-md">
                        <span className="material-symbols-outlined">{active ? 'close' : 'air'}</span>
                    </div>
                    {active && <span className="animate-pulse text-white font-bold tracking-widest text-xs uppercase">Respirando...</span>}
                </div>

                <div>
                    <h3 className="text-2xl font-black text-white leading-none mb-2">{active ? "Inhala..." : "Pausa Sagrada"}</h3>
                    <p className="text-white/80 text-xs font-medium leading-relaxed max-w-[200px]">
                        {active ? "Sigue el ciclo de luz." : "Toca aquí para reiniciar tu sistema nervioso en 30 segundos."}
                    </p>
                </div>

                {active && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="size-32 rounded-full border-4 border-white/20 animate-ping opacity-20"></div>
                        <div className="size-20 rounded-full bg-white/20 animate-pulse blur-xl"></div>
                    </div>
                )}
            </div>
        </div>
    );
};


export const BentoGrid = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [streak, setStreak] = useState(0);
    const [greeting, setGreeting] = useState('');

    useEffect(() => {
        // Load Data
        const load = async () => {
            const u = await authService.getUser();
            const s = updateStreak();
            setUser(u);
            setStreak(s);
        };
        load();

        // Greeting
        const h = new Date().getHours();
        setGreeting(h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches');
    }, []);

    const handleSearch = (q: string) => {
        authService.addXP(20);
        navigate(`/search?initial=${encodeURIComponent(q)}`);
    };

    return (
        <div className="min-h-[100dvh] w-full bg-[#050b0d] text-gray-200 pb-32">
            {/* Background Ambient */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full animate-float-slow"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary/5 blur-[120px] rounded-full animate-float"></div>
            </div>

            {/* Main Grid Container */}
            <div className="relative z-10 max-w-5xl mx-auto px-5 pt-24 md:pt-32">

                <div className="grid grid-cols-2 md:grid-cols-4 md:grid-rows-[auto_auto_auto] gap-4">
                    {/* Row 1 */}
                    <WelcomeWidget user={user} greeting={greeting} />
                    <StatWidget icon="🔥" value={`${streak}`} label="Días Racha" color="orange" delay={100} />
                    <StatWidget icon="⭐" value={`${Math.floor((user?.xp || 0) / 100)}`} label="Nivel Luz" color="yellow" delay={200} />

                    {/* Row 2 */}
                    <SearchWidget onSearch={handleSearch} />
                    <NavWidget title="Comunidad" icon="diversity_1" color="pink" onClick={() => navigate('/community')} span={1} />
                    <NavWidget title="Diario" icon="edit_note" color="cyan" onClick={() => navigate('/journal')} span={1} />

                    {/* Row 3 - Breathing & More */}
                    <BreathingWidget />
                    <div className="col-span-2 flex flex-col gap-4">
                        <NavWidget title="Rutinas de Poder" icon="event_note" color="purple" onClick={() => navigate('/routines')} span={2} />
                        <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-xs text-white/50 uppercase font-bold">Consejo del día</p>
                                <p className="text-sm font-medium text-white italic">"Lo que niegas te somete, lo que aceptas te transforma."</p>
                            </div>
                            <span className="text-2xl">🧘‍♂️</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center pb-8">
                    <p className="text-white/20 text-xs uppercase tracking-[0.3em] font-bold">Sanarte OS v2.0</p>
                </div>
            </div>
        </div>
    );
};

export default BentoGrid;
