import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SymptomDetail } from '../types';
import { getFullSymptomDetails } from '../services/geminiService';
// We reuse the components from DetailPages to maintain consistency
// But since they are not exported, I might need to copy them or refactor DetailPages to export them.
// For speed and safety, I will copy the MarkdownRenderer and MagicalCard logic here or refactor DetailPages to export them.
// Refactoring DetailPages to export components is cleaner.
// For now, I will assume I can refactor DetailPages first to export helper components.
// But to avoid breaking DetailPages in this step, I will duplicate the renderer and card for this specific isolated page.
// It creates duplication but ensures I don't break the existing page.

// --- Redefined for SharedPage ---
const MarkdownRenderer = ({ text, className = "" }: { text: string; className?: string }) => {
    if (!text) return null;

    return (
        <div className={`space-y-3 ${className}`}>
            {text.split('\n').map((line, idx) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={idx} className="h-2" />;

                if (trimmed.startsWith('### ')) return <h5 key={idx} className="text-sm font-black uppercase tracking-widest text-primary mt-4 mb-2">{trimmed.slice(4)}</h5>;
                if (trimmed.startsWith('## ')) return <h4 key={idx} className="text-lg font-bold text-gray-900 dark:text-white mt-5 mb-2">{trimmed.slice(3)}</h4>;

                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    const content = trimmed.slice(2);
                    return (
                        <div key={idx} className="flex items-start gap-2 pl-2">
                            <span className="mt-1.5 size-1.5 rounded-full bg-primary/60 flex-shrink-0"></span>
                            <p className="leading-relaxed">
                                <InlineMarkdown text={content} />
                            </p>
                        </div>
                    );
                }

                return (
                    <p key={idx} className="leading-relaxed text-gray-700 dark:text-gray-300">
                        <InlineMarkdown text={line} />
                    </p>
                );
            })}
        </div>
    );
};

const InlineMarkdown = ({ text }: { text: string }) => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
        <>
            {parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    return <span key={i} className="font-black text-primary dark:text-neon-cyan">{part.slice(2, -2)}</span>;
                }
                if (part.startsWith('*') && part.endsWith('*')) {
                    return <span key={i} className="font-serif italic text-gray-600 dark:text-white">{part.slice(1, -1)}</span>;
                }
                return part;
            })}
        </>
    );
};

interface MagicalCardProps {
    id: string;
    isOpen: boolean;
    onToggle: (id: string) => void;
    title: string;
    subtitle?: string;
    icon: string;
    gradientTheme: string;
    iconColor: string;
    children: React.ReactNode;
}

const MagicalCard: React.FC<MagicalCardProps> = ({
    id, isOpen, onToggle, title, subtitle, icon, gradientTheme, iconColor, children
}) => {
    return (
        <div className={`group relative overflow-hidden transition-all duration-700 ease-in-out border rounded-[2rem] mb-3 shadow-sm ${isOpen
            ? 'bg-white dark:bg-[#1a2c32] border-primary/20 shadow-primary/5'
            : 'bg-white/60 dark:bg-surface-dark border-transparent hover:border-gray-200 dark:hover:border-gray-700'
            }`}>
            <div className={`absolute top-0 right-0 w-full h-full opacity-0 transition-opacity duration-700 pointer-events-none ${isOpen ? 'opacity-100' : ''}`}>
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[60px] -mr-10 -mt-10 ${gradientTheme} opacity-10`}></div>
            </div>

            <button
                onClick={() => onToggle(id)}
                className="relative z-10 w-full p-5 flex items-center justify-between text-left outline-none"
            >
                <div className="flex items-center gap-4">
                    <div className={`size-11 rounded-xl flex items-center justify-center text-2xl shadow-sm transition-transform duration-500 group-hover:scale-105 ${isOpen ? `${gradientTheme} text-white` : `bg-gray-50 dark:bg-white/5 ${iconColor}`
                        }`}>
                        <span className="material-symbols-outlined text-[24px]">{icon}</span>
                    </div>
                    <div>
                        <h3 className={`text-base md:text-lg font-bold tracking-tight transition-colors ${isOpen ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                            }`}>
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                <div className={`size-8 rounded-full border border-gray-100 dark:border-gray-700 flex items-center justify-center transition-all duration-500 ${isOpen ? 'rotate-180 bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-transparent text-gray-400'
                    }`}>
                    <span className="material-symbols-outlined text-lg">keyboard_arrow_down</span>
                </div>
            </button>

            <div className={`relative z-10 grid transition-[grid-template-rows] duration-700 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <div className="p-5 pt-0 space-y-4">
                        <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700 to-transparent mb-4"></div>
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const SharedResultPage: React.FC = () => {
    const { id } = useParams<{ id: string }>(); // The "id" will be the symptom name
    const navigate = useNavigate();

    const [data, setData] = useState<SymptomDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openSections, setOpenSections] = useState<Set<string>>(new Set(['meaning']));

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            setIsLoading(true);
            try {
                // Treat the ID as the query
                const detail = await getFullSymptomDetails(decodeURIComponent(id));
                if (detail) {
                    setData(detail);
                }
            } catch (error: any) {
                console.error(error);
                setError("No se pudo cargar la información compartida.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const toggleSection = (sectionId: string) => {
        const newSections = new Set(openSections);
        if (newSections.has(sectionId)) newSections.delete(sectionId);
        else newSections.add(sectionId);
        setOpenSections(newSections);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
                <span className="material-symbols-outlined text-4xl animate-spin text-primary">autorenew</span>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-background-light dark:bg-background-dark">
                <h2 className="text-xl font-bold mb-4">Enlace expirado o inválido</h2>
                <button onClick={() => navigate('/')} className="bg-primary text-white px-6 py-2 rounded-full font-bold">
                    Ir al Inicio
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-background-dark pb-32">
            {/* Simple Header */}
            <div className="bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-2xl">spa</span>
                    <span className="font-heading font-black text-xl text-gray-900 dark:text-white">SanArte</span>
                </div>
                <button onClick={() => navigate('/')} className="text-sm font-bold text-primary">
                    Descargar App
                </button>
            </div>

            <div className="max-w-2xl mx-auto px-5 pt-8">
                <div className="mb-8 text-center">
                    <div className="inline-block px-3 py-1 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300 text-[10px] font-black tracking-widest uppercase mb-3">
                        Mensaje Compartido
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight mb-3">
                        {data.name}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 font-serif italic opacity-90">
                        "{data.shortDefinition}"
                    </p>
                </div>

                {/* 1. ZONA Y EMOCIÓN (Bloque Principal) - Always visible */}
                <MagicalCard
                    id="emocion"
                    isOpen={openSections.has('meaning')}
                    onToggle={toggleSection}
                    title="Mensaje del Alma"
                    subtitle="Zona Corporal y Emoción"
                    icon="lightbulb"
                    gradientTheme="bg-gradient-to-br from-cyan-400 to-blue-500"
                    iconColor="text-cyan-500"
                >
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-3xl border border-blue-100 dark:border-blue-500/10 mb-6">
                        <MarkdownRenderer text={data.zona_detalle} />
                    </div>
                    <div className="text-gray-700 dark:text-gray-200">
                        <MarkdownRenderer text={data.emociones_detalle} />
                    </div>
                </MagicalCard>

                {/* Teaser for other sections */}
                <div className="mt-8 p-8 rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 text-white text-center relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                    <span className="material-symbols-outlined text-5xl text-amber-400 mb-4">lock_open</span>
                    <h3 className="text-2xl font-bold mb-2">Desbloquea el Ritual Completo</h3>
                    <p className="text-gray-300 mb-6 max-w-sm mx-auto">
                        Accede a la meditación guiada, hierbas sanadoras, conexión con ángeles y tu plan de acción personalizado.
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="bg-gradient-to-r from-primary to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform"
                    >
                        Comenzar mi Sanación
                    </button>
                </div>
            </div>
        </div>
    );
};
