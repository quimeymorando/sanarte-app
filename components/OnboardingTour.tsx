import React, { useState } from 'react';

const STEPS = [
    {
        title: "¡Te damos la bienvenida a SanArte!",
        description: "Tu refugio digital para sanar cuerpo y alma. Aquí descubrirás el mensaje oculto detrás de cada síntoma físico.",
        icon: "spa",
        color: "text-primary",
        bg: "bg-cyan-50 dark:bg-cyan-900/20"
    },
    {
        title: "Decodifica tu Dolor",
        description: "Usa el buscador para encontrar lo que sientes. Nuestra IA te explicará el conflicto emocional y cómo liberarlo.",
        icon: "psychology",
        color: "text-purple-500",
        bg: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
        title: "Herramientas de Luz",
        description: "Accede a meditaciones, hierbas curativas y guías de ángeles para apoyar tu proceso de sanación.",
        icon: "light_mode",
        color: "text-amber-500",
        bg: "bg-amber-50 dark:bg-amber-900/20"
    },
    {
        title: "Comunidad que Sana",
        description: "Comparte tus intenciones, enciende velas virtuales y crece junto a miles de personas en el mismo camino.",
        icon: "diversity_1",
        color: "text-pink-500",
        bg: "bg-pink-50 dark:bg-pink-900/20"
    }
];

export const OnboardingTour: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(0);
    const [isClosing, setIsClosing] = useState(false);

    const handleNext = () => {
        if (step < STEPS.length - 1) {
            setStep(prev => prev + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsClosing(true);
        setTimeout(onComplete, 600);
    };

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md transition-opacity duration-500 ${isClosing ? 'opacity-0' : 'opacity-100'}`}>

            <div className={`relative w-full max-w-sm bg-white dark:bg-[#1a2327] rounded-[2.5rem] shadow-2xl overflow-hidden transition-all duration-500 ${isClosing ? 'scale-90 translate-y-20 opacity-0' : 'scale-100 translate-y-0'}`}>

                {/* Decorative Background Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"></div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-2 pt-8 absolute top-0 left-0 w-full z-10">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-primary/30' : 'w-2 bg-gray-200 dark:bg-gray-700'}`}
                        />
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="p-8 pb-4 flex flex-col items-center text-center mt-10 min-h-[420px]">

                    {/* Dynamic Icon */}
                    <div className={`size-32 rounded-[2rem] ${STEPS[step].bg} flex items-center justify-center mb-8 shadow-inner transform transition-all duration-500 hover:scale-105 hover:rotate-3`}>
                        <span key={step} className={`material-symbols-outlined text-6xl ${STEPS[step].color} animate-in zoom-in spin-in-12 duration-500`}>
                            {STEPS[step].icon}
                        </span>
                    </div>

                    {/* Text Content */}
                    <div key={step} className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1 flex flex-col justify-center">
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 leading-tight">
                            {STEPS[step].title}
                        </h2>
                        <p className="text-lg text-gray-500 dark:text-gray-300 leading-relaxed font-medium">
                            {STEPS[step].description}
                        </p>
                    </div>
                </div>

                {/* Footer / Controls */}
                <div className="p-8 pt-0 mt-4 flex justify-between items-center relative z-20">
                    <button
                        onClick={onComplete}
                        className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 font-bold text-sm px-2 transition-colors"
                    >
                        Saltar
                    </button>

                    <button
                        onClick={handleNext}
                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-4 rounded-2xl font-black shadow-xl hover:scale-105 hover:shadow-2xl transition-all flex items-center gap-2"
                    >
                        {step === STEPS.length - 1 ? '¡Comenzar!' : 'Siguiente'}
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
