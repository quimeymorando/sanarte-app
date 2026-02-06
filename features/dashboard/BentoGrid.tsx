import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { updateStreak } from '../../services/routineService';
import { UserProfile } from '../../types';

// Widget Components
const WelcomeWidget = ({ user, greeting }: { user: UserProfile | null, greeting: string }) => {
    const levelProgress = ((user?.xp || 0) % 500) / 500 * 100;
    const levelTitle = user?.level === 1 ? "Semilla Despierta" : user?.level === 2 ? "Brote de Luz" : "Loto en Expansión";

    return (
        <div className="w-full h-40 glass-panel rounded-[2rem] p-6 relative overflow-hidden group mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-cyan-900/40 opacity-50"></div>
            <div className="relative z-10 flex justify-between items-center h-full">
                <div>
                    <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-widest mb-1">{greeting}</h2>
                    <h1 className="text-3xl font-black text-white leading-tight">
                        {user?.name ? user.name.split(' ')[0] : 'Sanador/a'}
                    </h1>
                    <p className="text-cyan-200/60 text-xs mt-1 font-medium tracking-wide">{levelTitle}</p>
                </div>

                {/* Avatar */}
                <div className="relative group/avatar cursor-pointer">
                    <div className="absolute inset-0 bg-cyan-400 blur-xl opacity-20 group-hover/avatar:opacity-50 transition-opacity rounded-full"></div>
                    {user?.avatar ? (
                        <div className="size-20 rounded-full bg-cover bg-center border-2 border-white/20 shadow-2xl group-hover/avatar:scale-105 transition-transform" style={{ backgroundImage: `url('${user.avatar}')` }}></div>
                    ) : (
                        <div className="size-20 rounded-full bg-white/5 flex items-center justify-center border-2 border-white/10 text-cyan-400 font-black text-3xl group-hover/avatar:scale-105 transition-transform">
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
        <div className="w-full mb-4">
            <div className="relative overflow-hidden rounded-[2rem] p-[1px] bg-gradient-to-r from-primary via-white to-primary animate-breathing shadow-glow-primary group">
                <div className="bg-[#0f1e24] rounded-[2rem] p-1 relative h-20 flex items-center">
                    <form onSubmit={handleSubmit} className="w-full relative h-full flex items-center px-6">
                        <div className="text-primary mr-4 animate-pulse">
                            <span className="material-symbols-outlined text-3xl">search</span>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="¿Qué siente tu cuerpo hoy?"
                            className="w-full h-full bg-transparent outline-none text-white text-lg font-medium placeholder-gray-400/50"
                        />
                        <button type="submit" className="bg-white/10 hover:bg-white/20 text-white size-10 rounded-full flex items-center justify-center transition-colors">
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

const BreathingWidget = () => {
    const [active, setActive] = useState(false);

    return (
        <div
            className={`w-full mb-4 rounded-[2rem] relative overflow-hidden transition-all duration-700 cursor-pointer shadow-2xl ${active ? 'h-64 bg-indigo-900' : 'h-28 bg-emerald-900/80'} border border-emerald-500/30 group animate-float`}
            onClick={() => setActive(!active)}
        >
            {/* Glowing Border effect */}
            <div className={`absolute inset-0 border-2 ${active ? 'border-indigo-400/50' : 'border-emerald-400/50'} rounded-[2rem] animate-pulse-slow`}></div>

            {/* Background Ambience */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50"></div>
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-400/20 blur-[50px] rounded-full group-hover:scale-125 transition-transform duration-1000"></div>

            <div className="relative z-10 p-6 flex items-center justify-between h-full">
                {!active ? (
                    <>
                        <div className="flex items-center gap-5">
                            <div className="size-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <span className="material-symbols-outlined text-3xl animate-breathing">air</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white leading-none mb-1 text-neon-green">Pausa Sagrada</h3>
                                <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-wider">Reiniciar Sistema Nervioso</p>
                            </div>
                        </div>
                        <div className="bg-white/10 size-10 rounded-full flex items-center justify-center text-white">
                            <span className="material-symbols-outlined">play_arrow</span>
                        </div>
                    </>
                ) : (
                    <div className="w-full flex flex-col items-center justify-center">
                        <h3 className="text-2xl font-black text-white animate-pulse mb-4">Inhala... 4s</h3>
                        <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                            <div className="h-full bg-white animate-[shimmer_2s_infinite] w-1/2 rounded-full"></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const NavCard = ({ title, icon, color, onClick, desc }: any) => (
    <div
        onClick={onClick}
        className={`w-full h-24 mb-3 bg-[#131d22] border border-white/5 rounded-3xl p-4 flex items-center justify-between relative overflow-hidden group cursor-pointer hover:border-${color}-500/50 transition-all active:scale-98`}
    >
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}></div>

        <div className="flex items-center gap-4 relative z-10">
            <div className={`size-14 rounded-2xl bg-${color}-500/10 flex items-center justify-center text-${color}-400 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
                <span className="material-symbols-outlined text-2xl">{icon}</span>
            </div>
            <div>
                <h3 className={`text-lg font-bold text-white group-hover:text-${color}-300 transition-colors`}>{title}</h3>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{desc}</p>
            </div>
        </div>

        <div className={`size-8 rounded-full bg-${color}-500/10 flex items-center justify-center text-${color}-500 group-hover:bg-${color}-500 group-hover:text-white transition-all`}>
            <span className="material-symbols-outlined text-lg">arrow_forward</span>
        </div>
    </div>
);

const StatBar = ({ icon, label, value, color }: any) => (
    <div className="w-full h-16 mb-3 bg-[#131d22] border border-white/5 rounded-2xl px-6 flex items-center justify-between relative overflow-hidden">
        <div className={`absolute left-0 top-0 bottom-0 w-1 bg-${color}-500`}></div>
        <div className="flex items-center gap-3">
            <span className={`text-${color}-500 text-xl`}>{icon}</span>
            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-xl font-black text-white">{value}</span>
    </div>
);

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
                <div className="absolute -top-[20%] right-[-10%] w-[70%] h-[70%] bg-primary/5 blur-[150px] rounded-full animate-float-slow"></div>
                <div className="absolute top-[40%] left-[-20%] w-[60%] h-[60%] bg-secondary/5 blur-[150px] rounded-full animate-float"></div>
            </div>

            {/* Main Container - Single Column Stack for Mobile */}
            <div className="relative z-10 max-w-lg mx-auto px-5 pt-24 md:pt-32 flex flex-col">

                {/* 1. Welcome */}
                <WelcomeWidget user={user} greeting={greeting} />

                {/* 2. Search (Glowing Pulse) */}
                <SearchWidget onSearch={handleSearch} />

                {/* 3. Breathing (Glowing Pulse) */}
                <BreathingWidget />

                {/* 4. Community */}
                <NavCard
                    title="Comunidad"
                    desc="Conecta y Sana"
                    icon="diversity_1"
                    color="pink"
                    onClick={() => navigate('/community')}
                />

                {/* 5. Routines */}
                <NavCard
                    title="Rutinas"
                    desc="Hábitos de Poder"
                    icon="event_note"
                    color="purple"
                    onClick={() => navigate('/routines')}
                />

                {/* 6. Journal */}
                <NavCard
                    title="Diario"
                    desc="Tu Espacio Seguro"
                    icon="edit_note"
                    color="cyan"
                    onClick={() => navigate('/journal')}
                />

                {/* 7. Level of Light */}
                <StatBar
                    icon="⭐"
                    label="Nivel de Luz"
                    value={Math.floor((user?.xp || 0) / 100)}
                    color="yellow"
                />

                {/* 8. Streak Days */}
                <StatBar
                    icon="🔥"
                    label="Días Racha"
                    value={streak}
                    color="orange"
                />

                {/* 9. Daily Tip */}
                <div className="w-full mt-2 bg-gradient-to-r from-[#131d22] to-[#0f181c] border border-white/5 rounded-2xl p-4 flex items-center gap-4">
                    <div className="size-10 bg-white/5 rounded-full flex items-center justify-center text-xl">🧘‍♂️</div>
                    <div>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Consejo del día</p>
                        <p className="text-xs font-bold text-gray-300 italic leading-snug">"Lo que niegas te somete, lo que aceptas te transforma."</p>
                    </div>
                </div>

                <div className="mt-8 text-center pb-8 border-t border-white/5 pt-8">
                    <p className="text-white/10 text-[10px] uppercase tracking-[0.4em] font-black">Sanarte v2.0</p>
                </div>
            </div>
        </div>
    );
};

export default BentoGrid;
